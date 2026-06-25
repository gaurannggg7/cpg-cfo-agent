from __future__ import annotations

import sys
from io import StringIO
from pathlib import Path
from typing import Any, TypedDict

from mcp.server.fastmcp import FastMCP

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:  # pragma: no cover - fallback for offline unit tests
    load_dotenv = None

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"

for path in (str(REPO_ROOT), str(BACKEND_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

if load_dotenv is not None:
    load_dotenv(BACKEND_DIR / ".env", override=False)

from agent import calculate_runway, categorize_transactions, cfo_app  # noqa: E402

MCP_SERVER_NAME = "cpg-cfo-agent"
MCP_SERVER = FastMCP(MCP_SERVER_NAME)

CSV_INPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "csv_data": {
            "type": "string",
            "minLength": 1,
            "description": "CSV transaction data with a header row.",
        }
    },
    "required": ["csv_data"],
    "additionalProperties": False,
}

TOOL_SCHEMAS: dict[str, dict[str, Any]] = {
    "analyze_transactions": CSV_INPUT_SCHEMA,
    "categorize_spend": CSV_INPUT_SCHEMA,
    "get_runway_forecast": CSV_INPUT_SCHEMA,
}


class AnalysisState(TypedDict):
    csv_text: str
    df_summary: str
    monthly_burn: float
    monthly_revenue: float
    categorized: dict[str, Any]
    anomalies: dict[str, Any]
    runway: dict[str, Any]
    summary: str


def _load_csv(csv_data: str) -> pd.DataFrame:
    import pandas as pd

    if not csv_data or not csv_data.strip():
        raise ValueError("csv_data must not be empty")

    try:
        df = pd.read_csv(StringIO(csv_data.strip()))
    except Exception as exc:  # pragma: no cover - pandas error path varies by input
        raise ValueError(f"Unable to parse CSV data: {exc}") from exc

    if df.empty:
        raise ValueError("CSV data must contain at least one row")

    df.columns = [str(column).strip().lower() for column in df.columns]

    if "date" not in df.columns:
        raise ValueError("CSV data must include a 'date' column")
    if "amount" not in df.columns:
        raise ValueError("CSV data must include an 'amount' column")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df.dropna(subset=["date", "amount"]).copy()
    if df.empty:
        raise ValueError("CSV data must contain valid date and amount values")

    if "description" not in df.columns:
        df["description"] = ""
    if "category" not in df.columns:
        df["category"] = "uncategorized"

    return df.sort_values("date").reset_index(drop=True)


def _infer_monthly_revenue(df: pd.DataFrame, months: int, monthly_burn: float) -> dict[str, Any]:
    import pandas as pd

    revenue_candidates = [
        column
        for column in df.columns
        if any(token in column for token in ("revenue", "sales", "income", "receipt", "credit", "inflow"))
    ]

    for column in revenue_candidates:
        revenue_total = pd.to_numeric(df[column], errors="coerce").fillna(0).clip(lower=0).sum()
        if float(revenue_total) > 0:
            return {
                "monthly_revenue": float(revenue_total / max(months, 1)),
                "method": f"column:{column}",
            }

    positive_amounts = df.loc[df["amount"] > 0, "amount"].sum()
    if float(positive_amounts) > 0:
        return {
            "monthly_revenue": float(positive_amounts / max(months, 1)),
            "method": "positive_amounts",
        }

    return {
        "monthly_revenue": float(abs(monthly_burn)) if monthly_burn else 1.0,
        "method": "burn_fallback",
    }


def _build_analysis_state(csv_data: str) -> AnalysisState:
    df = _load_csv(csv_data)
    months = int(df["date"].dt.to_period("M").nunique()) or 1
    monthly_burn = float(df["amount"].sum() / months)
    revenue = _infer_monthly_revenue(df, months, monthly_burn)

    return {
        "csv_text": df.to_csv(index=False),
        "df_summary": df.describe().to_string(),
        "monthly_burn": monthly_burn,
        "monthly_revenue": revenue["monthly_revenue"],
        "categorized": {},
        "anomalies": {},
        "runway": {},
        "summary": "",
    }


@MCP_SERVER.tool()
def analyze_transactions(csv_data: str) -> dict[str, Any]:
    """Run the full CFO analysis pipeline over a CSV string."""
    return cfo_app.invoke(_build_analysis_state(csv_data))


@MCP_SERVER.tool()
def categorize_spend(csv_data: str) -> dict[str, Any]:
    """Return only the categorization output for the supplied CSV string."""
    return categorize_transactions(_build_analysis_state(csv_data))


@MCP_SERVER.tool()
def get_runway_forecast(csv_data: str) -> dict[str, Any]:
    """Return only the runway forecast output for the supplied CSV string."""
    return calculate_runway(_build_analysis_state(csv_data))


if __name__ == "__main__":
    MCP_SERVER.run()