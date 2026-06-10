import os
import json
import pandas as pd
from typing import TypedDict, Dict, Any
from groq import Groq
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Groq client (lazy-load)
def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set. Please set it in the .env file or as an environment variable.")
    return Groq(api_key=api_key)

# 1. Define the Application State
class AgentState(TypedDict):
    csv_text: str
    df_summary: str
    monthly_burn: float
    monthly_revenue: float
    categorized: Dict[str, Any]
    anomalies: Dict[str, Any]
    runway: Dict[str, Any]
    summary: str

# 2. Define the Agent Nodes
def categorize_transactions(state: AgentState):
    """Agent 1: Auto-categorize spend"""
    client = get_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": f"""You are a CPG accounting expert. Analyze these transactions.
            Return ONLY a JSON object with this exact structure: 
            {{"categories": {{"COGS": [...], "OpEx": [...]}}, "total_by_category": {{"COGS": 1000, "OpEx": 500}}}}
            Transactions: {state['csv_text'][:3000]}""" # Truncating slightly to stay well within context
        }]
    )
    return {"categorized": json.loads(response.choices[0].message.content)}

def detect_anomalies(state: AgentState):
    """Agent 2: Flag unusual patterns"""
    client = get_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": f"""Analyze this transaction data summary for red flags in a CPG context.
            Return ONLY a JSON object: {{"anomalies": ["issue 1", "issue 2"], "risk_level": "low|medium|high", "actions": ["action 1"]}}
            Data summary: {state['df_summary']}"""
        }]
    )
    return {"anomalies": json.loads(response.choices[0].message.content)}

def calculate_runway(state: AgentState):
    """Agent 3: Runway analysis"""
    client = get_client()
    monthly_burn = state['monthly_burn']
    monthly_rev = state['monthly_revenue']
    months_left = (12 * monthly_rev / monthly_burn) if monthly_burn > 0 else 999
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": f"""Given a monthly burn rate of ${monthly_burn:,.0f} and monthly revenue of ${monthly_rev:,.0f} for a CPG brand:
            Return ONLY a JSON object: {{"runway_months": {months_left:.1f}, "recommendations": ["rec 1", "rec 2"]}}"""
        }]
    )
    return {"runway": json.loads(response.choices[0].message.content)}

def generate_cfo_summary(state: AgentState):
    """Agent 4: Natural language CFO decision brief"""
    client = get_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "user",
            "content": f"""You are a CFO advising a CPG brand. Synthesize this data into a 3-paragraph executive summary with 3 key decisions.
            Spend Breakdown: {json.dumps(state.get('categorized', {}))}
            Anomalies: {json.dumps(state.get('anomalies', {}))}
            Runway: {json.dumps(state.get('runway', {}))}
            Format: Summary -> 3 Key Decisions -> Next Steps"""
        }]
    )
    return {"summary": response.choices[0].message.content}

# 3. Build and Compile the Graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("categorize_node", categorize_transactions)
workflow.add_node("anomalies_node", detect_anomalies)
workflow.add_node("runway_node", calculate_runway)
workflow.add_node("summary_node", generate_cfo_summary)
# Define the sequential edges

workflow.set_entry_point("categorize_node")
workflow.add_edge("categorize_node", "anomalies_node")
workflow.add_edge("anomalies_node", "runway_node")
workflow.add_edge("runway_node", "summary_node")
workflow.add_edge("summary_node", END)

# Compile the app to be imported by Streamlit
cfo_app = workflow.compile()