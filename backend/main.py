from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import StringIO
from dotenv import load_dotenv
from agent import cfo_app
from monitoring import start_metrics_server

load_dotenv()

app = FastAPI(title="CPG CFO Agent API")


@app.on_event("startup")
async def startup_event():
    start_metrics_server(9090)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://cpg-cfo-agent.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze")
async def analyze(file: UploadFile = File(...), monthly_revenue: float = Form(...)):
    content = await file.read()
    df = pd.read_csv(StringIO(content.decode()))
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    months = len(df.groupby(df["date"].dt.to_period("M"))) or 1
    monthly_burn = float(df["amount"].sum() / months)

    initial_state = {
        "csv_text": df.to_csv(index=False),
        "df_summary": df.describe().to_string(),
        "monthly_burn": monthly_burn,
        "monthly_revenue": float(monthly_revenue),
        "categorized": {},
        "anomalies": {},
        "runway": {},
        "summary": "",
    }

    result = cfo_app.invoke(initial_state)

    return {
        "summary": result["summary"],
        "categories": result["categorized"],
        "anomalies": result["anomalies"],
        "runway": result["runway"],
        "metrics": {
            "total_transactions": len(df),
            "total_spend": float(df["amount"].sum()),
            "date_range": f"{df['date'].min().date()} to {df['date'].max().date()}",
            "avg_transaction": float(df["amount"].mean()),
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
