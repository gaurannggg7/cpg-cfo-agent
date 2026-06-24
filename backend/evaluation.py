"""
evaluation.py — Logs pipeline evaluation results to Firestore.

Call log_evaluation() after each pipeline run. It writes a document to the
Firestore 'evaluations' collection containing:
  - SHA-256 hash of the input CSV (for deduplication)
  - Truncated per-agent outputs
  - Per-stage latency measurements
  - A 0-100 quality score based on output completeness
  - ISO-8601 UTC timestamp

The Firebase Admin SDK is lazily initialized on first call. Set
GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path for local dev;
in GCP environments the SDK uses Application Default Credentials automatically.

This module has no side effects on import and does not touch main.py or
the LangGraph pipeline.
"""
import hashlib
import os
from datetime import datetime, timezone
from typing import Any, Dict

_db = None


def _get_db():
    """Return a cached Firestore client, initializing Firebase on first call."""
    global _db
    if _db is not None:
        return _db

    import firebase_admin
    from firebase_admin import credentials, firestore

    if not firebase_admin._apps:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        cred = (
            credentials.Certificate(cred_path)
            if cred_path
            else credentials.ApplicationDefault()
        )
        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db


def _quality_score(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns a simple 0-100 completeness score.
      40 pts — summary >= 100 chars
      20 pts each — categorized, anomalies, runway present
    """
    score, reasons = 0, []

    if len(result.get("summary", "")) >= 100:
        score += 40
    else:
        reasons.append(f"summary too short ({len(result.get('summary', ''))} chars)")

    for key in ("categorized", "anomalies", "runway"):
        if result.get(key):
            score += 20
        else:
            reasons.append(f"missing {key}")

    return {"score": score, "reasons": reasons}


def log_evaluation(
    job_id: str,
    csv_text: str,
    agent_outputs: Dict[str, Any],
    latencies: Dict[str, float],
    final_result: Dict[str, Any],
) -> str:
    """
    Write an evaluation record to Firestore 'evaluations' collection.
    Returns the new Firestore document ID.
    """
    db = _get_db()
    quality = _quality_score(final_result)

    doc = {
        "job_id": job_id,
        "input_hash": hashlib.sha256(csv_text.encode()).hexdigest(),
        # Truncate large agent outputs to keep Firestore documents small.
        "agent_outputs": {k: str(v)[:2000] for k, v in agent_outputs.items()},
        "latencies_seconds": latencies,
        "quality_score": quality["score"],
        "quality_reasons": quality["reasons"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    _, ref = db.collection("evaluations").add(doc)
    return ref.id
