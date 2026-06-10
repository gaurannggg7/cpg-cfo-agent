import streamlit as st
import pandas as pd
#
from agent import cfo_app

st.set_page_config(page_title="CPG CFO Agent", layout="wide")
st.title("💰 CPG CFO Agent")
st.markdown("Upload transactions, get AI-powered financial decisions orchestrated by LangGraph.")

# Check for API key
import os
if not os.environ.get("GROQ_API_KEY"):
    st.error("⚠️ GROQ_API_KEY environment variable not set. Please set it before running this app.")
    st.stop()

# File upload
uploaded_file = st.file_uploader("Upload transaction CSV", type="csv")

if uploaded_file:
    df = pd.read_csv(uploaded_file)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    st.subheader("📊 Transaction Overview")
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Transactions", len(df))
    col2.metric("Date Range", f"{df['date'].min().date()} to {df['date'].max().date()}")
    col3.metric("Total Spend", f"${df['amount'].sum():,.0f}")
    
    monthly_revenue = st.number_input("Monthly Revenue ($)", value=100000, step=10000)
    
    if st.button("🤖 Run CFO Analysis"):
        with st.spinner("LangGraph is orchestrating 4 AI agents..."):
            
            # 1. Prep the initial state for the graph
            monthly_burn = df['amount'].sum() / (len(df.groupby(df['date'].dt.to_period('M'))) or 1)
            
            initial_state = {
                "csv_text": df.to_csv(index=False),
                "df_summary": df.describe().to_string(),
                "monthly_burn": float(monthly_burn),
                "monthly_revenue": float(monthly_revenue)
            }
            
            # 2. Execute the LangGraph workflow
            result_state = cfo_app.invoke(initial_state)
            
            # 3. Render Results
            st.subheader("📋 CFO Brief")
            st.write(result_state['summary'])
            
            col_a, col_b = st.columns(2)
            
            with col_a:
                st.subheader("💸 Spend by Category")
                if cat and isinstance(cat, dict) and 'total_by_category' in cat:
                    st.json(cat['total_by_category'])
                else:
                    st.warning("Category breakdown unavailable.")
            
            with col_b:
                st.subheader("⚠️ Anomalies & Risk")
                anom = result_state['anomalies']
                risk_color = "red" if anom.get('risk_level') == "high" else "orange" if anom.get('risk_level') == "medium" else "green"
                st.markdown(f"**Risk Level:** :{risk_color}[{anom.get('risk_level', 'Unknown').upper()}]")
                for anomaly in anom.get('anomalies', []):
                    st.warning(anomaly)
                    
            st.subheader("📈 Runway Analysis")
            runway = result_state['runway']
            st.metric("Months of Runway", f"{runway.get('runway_months', 0)}")
            for rec in runway.get('recommendations', []):
                st.info(rec)