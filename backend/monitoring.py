"""
monitoring.py — Prometheus metrics definitions and HTTP server starter.

Metrics are module-level objects so any module can import and update them.
Call start_metrics_server() once at process startup to expose /metrics on
port 9090 — separate from the FastAPI app on port 8000, so main.py is
untouched.

Usage in kafka_consumer.py:
    from monitoring import REQUEST_COUNT, start_metrics_server
    start_metrics_server(9090)
    REQUEST_COUNT.labels(endpoint="kafka", status="success").inc()
"""
import threading

from prometheus_client import Counter, Gauge, Histogram, start_http_server

# Total requests broken down by entry point and outcome.
REQUEST_COUNT = Counter(
    "cpg_cfo_request_count_total",
    "Total analysis requests handled",
    ["endpoint", "status"],
)

# End-to-end wall-clock latency per entry point.
REQUEST_LATENCY = Histogram(
    "cpg_cfo_request_latency_seconds",
    "End-to-end request latency in seconds",
    ["endpoint"],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
)

# Per-agent LangGraph node execution time.
AGENT_EXECUTION_TIME = Histogram(
    "cpg_cfo_agent_execution_seconds",
    "LangGraph agent node execution time in seconds",
    ["agent"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
)

# Groq token consumption per agent node and token type.
LLM_TOKEN_USAGE = Counter(
    "cpg_cfo_llm_token_usage_total",
    "Groq LLM tokens consumed",
    ["agent", "token_type"],
)

# Rolling success rate; updated on every pipeline completion.
PIPELINE_SUCCESS_RATE = Gauge(
    "cpg_cfo_pipeline_success_rate",
    "Rolling pipeline success rate (0.0 to 1.0)",
)

_lock = threading.Lock()
_success_count = 0
_total_count = 0


def record_pipeline_result(success: bool) -> None:
    """Update PIPELINE_SUCCESS_RATE after each pipeline run."""
    global _success_count, _total_count
    with _lock:
        _total_count += 1
        if success:
            _success_count += 1
        PIPELINE_SUCCESS_RATE.set(_success_count / _total_count)


def start_metrics_server(port: int = 9090) -> None:
    """Start the Prometheus HTTP server in a background daemon thread."""
    start_http_server(port)
