"""
kafka_consumer.py — Async Kafka consumer that drives the LangGraph pipeline.

Flow:
  1. Reads a JSON message from 'transaction-ingestion'
  2. Reconstructs the AgentState initial state from the CSV payload
  3. Calls cfo_app.invoke() (unchanged from agent.py)
  4. Logs the run via evaluation.py → Firestore 'evaluations'
  5. Publishes the result JSON to 'analysis-complete'
  6. Exposes Prometheus metrics on port 9090 (via monitoring.py)

The existing FastAPI /analyze endpoint and agent.py are untouched.

Run standalone:
    KAFKA_BOOTSTRAP_SERVERS=localhost:9092 python kafka_consumer.py
"""
import asyncio
import json
import os
import time
from io import StringIO

import pandas as pd
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from agent import cfo_app
from evaluation import log_evaluation
from monitoring import (
    REQUEST_COUNT,
    REQUEST_LATENCY,
    record_pipeline_result,
    start_metrics_server,
)

BOOTSTRAP  = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC_IN   = "transaction-ingestion"
TOPIC_OUT  = "analysis-complete"
GROUP_ID   = "cfo-agent-pipeline"
METRICS_PORT = int(os.getenv("METRICS_PORT", "9090"))


def _build_initial_state(csv_text: str, monthly_revenue: float = 100_000.0) -> dict:
    """Reconstruct the LangGraph AgentState from raw CSV text."""
    df = pd.read_csv(StringIO(csv_text))
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    months = len(df.groupby(df["date"].dt.to_period("M"))) or 1
    return {
        "csv_text": csv_text,
        "df_summary": df.describe().to_string(),
        "monthly_burn": float(df["amount"].sum() / months),
        "monthly_revenue": monthly_revenue,
        "categorized": {},
        "anomalies": {},
        "runway": {},
        "summary": "",
    }


async def _handle_message(msg: dict, producer: AIOKafkaProducer) -> None:
    job_id  = msg.get("job_id", "unknown")
    csv_txt = msg.get("csv_data", "")

    t0 = time.monotonic()
    try:
        state   = _build_initial_state(csv_txt)
        result  = cfo_app.invoke(state)
        elapsed = time.monotonic() - t0

        REQUEST_COUNT.labels(endpoint="kafka", status="success").inc()
        REQUEST_LATENCY.labels(endpoint="kafka").observe(elapsed)
        record_pipeline_result(True)

        log_evaluation(
            job_id=job_id,
            csv_text=csv_txt,
            agent_outputs={k: result.get(k, {}) for k in ("categorized", "anomalies", "runway")},
            latencies={"total_seconds": round(elapsed, 3)},
            final_result=result,
        )

        payload = json.dumps({
            "job_id":      job_id,
            "status":      "complete",
            "summary":     result.get("summary", ""),
            "categories":  result.get("categorized", {}),
            "anomalies":   result.get("anomalies", {}),
            "runway":      result.get("runway", {}),
        }).encode()

    except Exception as exc:
        elapsed = time.monotonic() - t0
        REQUEST_COUNT.labels(endpoint="kafka", status="error").inc()
        record_pipeline_result(False)
        payload = json.dumps({
            "job_id": job_id,
            "status": "error",
            "error":  str(exc),
        }).encode()

    await producer.send(TOPIC_OUT, key=job_id.encode(), value=payload)


async def run() -> None:
    start_metrics_server(METRICS_PORT)

    consumer = AIOKafkaConsumer(
        TOPIC_IN,
        bootstrap_servers=BOOTSTRAP,
        group_id=GROUP_ID,
        auto_offset_reset="earliest",
        value_deserializer=lambda v: json.loads(v.decode()),
    )
    producer = AIOKafkaProducer(bootstrap_servers=BOOTSTRAP)

    await consumer.start()
    await producer.start()
    try:
        async for msg in consumer:
            await _handle_message(msg.value, producer)
    finally:
        await consumer.stop()
        await producer.stop()


if __name__ == "__main__":
    asyncio.run(run())
