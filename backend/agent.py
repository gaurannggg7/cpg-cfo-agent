import os
import json
import pandas as pd
from typing import TypedDict, Dict, Any
from groq import Groq
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

load_dotenv()


def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")
    return Groq(api_key=api_key)


class AgentState(TypedDict):
    csv_text: str
    df_summary: str
    monthly_burn: float
    monthly_revenue: float
    categorized: Dict[str, Any]
    anomalies: Dict[str, Any]
    runway: Dict[str, Any]
    summary: str


def categorize_transactions(state: AgentState):
    client = get_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": (
                "You are a CPG accounting expert. Analyze these transactions. "
                "Return ONLY a JSON object with this exact structure: "
                '{"categories": {"COGS": [...], "OpEx": [...]}, "total_by_category": {"COGS": 1000, "OpEx": 500}} '
                f"Transactions: {state['csv_text'][:3000]}"
            )
        }]
    )
    return {"categorized": json.loads(response.choices[0].message.content)}


def detect_anomalies(state: AgentState):
    client = get_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": (
                "Analyze this transaction data summary for red flags in a CPG context. "
                'Return ONLY a JSON object: {"anomalies": ["issue 1", "issue 2"], "risk_level": "low|medium|high", "actions": ["action 1"]} '
                f"Data summary: {state['df_summary']}"
            )
        }]
    )
    return {"anomalies": json.loads(response.choices[0].message.content)}


def calculate_runway(state: AgentState):
    client = get_client()
    monthly_burn = state["monthly_burn"]
    monthly_rev = state["monthly_revenue"]
    months_left = (12 * monthly_rev / monthly_burn) if monthly_burn > 0 else 999

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": (
                f"Given a monthly burn rate of ${monthly_burn:,.0f} and monthly revenue of ${monthly_rev:,.0f} for a CPG brand: "
                f'Return ONLY a JSON object: {{"runway_months": {months_left:.1f}, "recommendations": ["rec 1", "rec 2"]}}'
            )
        }]
    )
    return {"runway": json.loads(response.choices[0].message.content)}


def generate_cfo_summary(state: AgentState):
    client = get_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "user",
            "content": (
                "You are a CFO advising a CPG brand. Synthesize this data into a 3-paragraph executive summary with 3 key decisions. "
                f"Spend Breakdown: {json.dumps(state.get('categorized', {}))} "
                f"Anomalies: {json.dumps(state.get('anomalies', {}))} "
                f"Runway: {json.dumps(state.get('runway', {}))} "
                "Format: Summary -> 3 Key Decisions -> Next Steps"
            )
        }]
    )
    return {"summary": response.choices[0].message.content}

workflow = StateGraph(AgentState)

workflow.add_node("categorize", categorize_transactions)
workflow.add_node("detect_anomalies", detect_anomalies)
workflow.add_node("runway_calc", calculate_runway)
workflow.add_node("summarize", generate_cfo_summary)

workflow.add_edge("categorize", "detect_anomalies")
workflow.add_edge("detect_anomalies", "runway_calc")
workflow.add_edge("runway_calc", "summarize")
workflow.add_edge("summarize", END)

workflow.set_entry_point("categorize")

cfo_app = workflow.compile()
