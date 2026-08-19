from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import StringIO
import csv as _csv
import math
from dotenv import load_dotenv
from groq import RateLimitError, APIError
from agent import cfo_app
from auth import require_firebase_user
from monitoring import start_metrics_server, REQUEST_COUNT, REQUEST_LATENCY, record_pipeline_result
from prometheus_fastapi_instrumentator import Instrumentator
import time
load_dotenv()

REQUIRED_COLUMNS = ("date", "amount")


def _reject(code: str, message: str, **extra):
    """
    Raise a structured 422.

    HTTPException is handled by Starlette's inner ExceptionMiddleware, which
    produces a real Response. A bare exception escapes to the outer
    ServerErrorMiddleware, and the Prometheus instrumentator in between then
    dies on `info.response.headers` with `AttributeError: 'NoneType' object has
    no attribute 'headers'` - masking the true cause in the logs. Raising
    HTTPException keeps both the client answer and the log honest.
    """
    raise HTTPException(status_code=422, detail={"error": code, "message": message, **extra})


def parse_transactions(raw: bytes) -> pd.DataFrame:
    """
    Turn an uploaded CSV into a validated dataframe, or reject with a 422.

    Every branch here corresponds to an input that previously produced an
    unhandled 500 (10 of 29 adversarial files did).
    """
    try:
        # utf-8-sig transparently strips a BOM if present.
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        _reject("invalid_encoding",
                "File is not valid UTF-8 text.", detail=str(exc))

    if not text.strip():
        _reject("empty_file", "The uploaded file is empty.")

    # pandas silently renames duplicate headers (category -> category.1), so
    # the collision has to be caught on the raw header row.
    try:
        header = next(_csv.reader(StringIO(text)))
    except StopIteration:
        _reject("empty_file", "The uploaded file has no rows.")
    seen, dupes = set(), set()
    for col in (h.strip() for h in header):
        if col in seen:
            dupes.add(col)
        seen.add(col)
    if dupes:
        _reject("duplicate_columns",
                f"Duplicate column name(s): {', '.join(sorted(dupes))}.",
                columns=header)

    try:
        # keep_default_na=False disables pandas' built-in NA-string sniffing
        # ("N/A", "NaN", "null", "NA", "n/a", ...), which otherwise converts
        # those straight to NaN during parsing - before the amount-cleaning
        # code below ever runs. That let bad values silently vanish as
        # "missing" instead of being caught by the non_numeric_amount check,
        # the same class of silent data loss as the duplicate-header bug.
        # Blank cells still end up treated as missing: they parse to a
        # literal "" instead of NaN, and the explicit
        # .replace({"": None, ...}) below normalizes that back.
        df = pd.read_csv(StringIO(text), keep_default_na=False, na_values=[])
    except pd.errors.EmptyDataError:
        _reject("no_columns", "No columns could be parsed from the file.")
    except pd.errors.ParserError as exc:
        _reject("malformed_csv",
                "Rows do not all have the same number of columns.",
                detail=str(exc))

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        _reject("missing_columns",
                f"Required column(s) missing: {', '.join(missing)}.",
                required=list(REQUIRED_COLUMNS), found=list(df.columns))

    if len(df) == 0:
        _reject("no_data_rows", "The file has headers but no data rows.")

    # Amounts: accept "-$1,234.56" style formatting; blank cells are treated as
    # missing and dropped further down (with the count surfaced via
    # df.attrs["rows_dropped"], not silently); genuine text ("N/A",
    # "pending") is a hard reject rather than a silent zero - this only
    # works because keep_default_na=False above stops pandas from converting
    # "N/A" itself into a blank before we ever see it.
    amounts = df["amount"]
    if amounts.dtype == object:
        amounts = (amounts.astype(str)
                   .str.strip()
                   .str.replace(r"[$\s]", "", regex=True)
                   .str.replace(",", "", regex=False)
                   .replace({"": None, "nan": None, "None": None}))
    parsed_amounts = pd.to_numeric(amounts, errors="coerce")
    unparseable = df.loc[parsed_amounts.isna() & amounts.notna(), "amount"]
    if len(unparseable) > 0:
        _reject("non_numeric_amount",
                "Column 'amount' contains values that are not numbers.",
                examples=[str(v) for v in unparseable.head(5).tolist()])
    df["amount"] = parsed_amounts

    parsed_dates = pd.to_datetime(df["date"], errors="coerce", format="mixed")
    df["date"] = parsed_dates

    # A blank date/amount cell is a DELIBERATELY different case from the
    # non_numeric_amount check above: there's no content to validate as
    # wrong, so a blank doesn't warrant rejecting the whole file the way
    # "N/A" or "pending" do. But silently vanishing the row is the same
    # failure mode this fix exists to close - so it's dropped, not rejected,
    # and the count travels with the dataframe (df.attrs) so /analyze can
    # surface it rather than letting rows disappear with zero trace.
    rows_before = len(df)
    df = df.dropna(subset=["date", "amount"])
    df.attrs["rows_dropped"] = rows_before - len(df)
    if len(df) == 0:
        _reject("no_usable_rows",
                "No rows had both a parseable date and a numeric amount.")

    if not pd.notna(df["amount"]).all() or not all(math.isfinite(v) for v in df["amount"]):
        _reject("non_finite_amount", "Column 'amount' contains non-finite values.")

    return df.sort_values("date")


def totals_by_category(df: pd.DataFrame) -> dict:
    """
    Category totals computed from the dataframe.

    Previously the model was asked to produce these. Measured across 19 corpus
    runs, 16 disagreed with the pandas total by >5%, 8 had an inverted sign,
    and one returned 0 for a ledger totalling -83,139.15. Summation is not a
    job for a sampled language model.
    """
    if "category" not in df.columns:
        return {}
    totals = (df.groupby(df["category"].astype(str).str.strip().str.upper())["amount"]
                .sum()
                .round(2))
    return {k: float(v) for k, v in totals.items()}
app = FastAPI(title="CPG CFO Agent API")
Instrumentator().instrument(app).expose(app)
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
async def analyze(
    file: UploadFile = File(...),
    monthly_revenue: float = Form(...),
    cash_on_hand: float | None = Form(default=None),
    user: dict = Depends(require_firebase_user),
):
    content = await file.read()
    df = parse_transactions(content)
    rows_dropped = df.attrs.get("rows_dropped", 0)

    months = len(df.groupby(df["date"].dt.to_period("M"))) or 1
    total_spend = float(df["amount"].sum())
    monthly_burn = total_spend / months
    # Spend is stored as negative outflow; the runway maths wants a positive
    # magnitude, so derive it explicitly instead of relying on the sign.
    monthly_spend = abs(monthly_burn)

    initial_state = {
        "csv_text": df.to_csv(index=False),
        "df_summary": df.describe().to_string(),
        "monthly_burn": monthly_burn,
        "monthly_spend": monthly_spend,
        "monthly_revenue": float(monthly_revenue),
        "cash_on_hand": float(cash_on_hand) if cash_on_hand is not None else None,
        "categorized": {},
        "anomalies": {},
        "runway": {},
        "summary": "",
    }
    _t0 = time.time()
    try:
        result = cfo_app.invoke(initial_state)
        REQUEST_COUNT.labels(endpoint="/analyze", status="success").inc()
        record_pipeline_result(True)
    except RateLimitError as e:
        # A provider quota/rate limit is an upstream availability problem, not
        # a server bug. Previously it surfaced as an unhandled 500 in ~0.2s
        # with no indication of what happened or when to retry.
        REQUEST_COUNT.labels(endpoint="/analyze", status="rate_limited").inc()
        record_pipeline_result(False)
        raise HTTPException(
            status_code=503,
            detail={"error": "upstream_rate_limited",
                    "message": "LLM provider rate limit reached. Retry later."},
            headers={"Retry-After": "60"},
        ) from e
    except APIError as e:
        REQUEST_COUNT.labels(endpoint="/analyze", status="upstream_error").inc()
        record_pipeline_result(False)
        raise HTTPException(
            status_code=502,
            detail={"error": "upstream_error",
                    "message": "LLM provider returned an error.",
                    "detail": str(e)[:300]},
        ) from e
    except Exception as e:
        # Catch-all: convert to HTTPException so the response object exists for
        # the Prometheus middleware rather than being masked by it.
        REQUEST_COUNT.labels(endpoint="/analyze", status="error").inc()
        record_pipeline_result(False)
        raise HTTPException(
            status_code=500,
            detail={"error": "pipeline_failure",
                    "message": type(e).__name__ + ": " + str(e)[:300]},
        ) from e
    finally:
        REQUEST_LATENCY.labels(endpoint="/analyze").observe(time.time() - _t0)

    categorized = result["categorized"] or {}
    # Totals come from the dataframe, never from the model.
    categorized["total_by_category"] = totals_by_category(df)

    return {
        "summary": result["summary"],
        "categories": categorized,
        "anomalies": result["anomalies"],
        "runway": result["runway"],
        "metrics": {
            "total_transactions": len(df),
            "total_spend": total_spend,
            "date_range": f"{df['date'].min().date()} to {df['date'].max().date()}",
            "avg_transaction": float(df["amount"].mean()),
            # Rows with a blank date or amount are dropped rather than
            # rejected (see parse_transactions) - this is how many, so the
            # caller can tell "51 transactions" apart from "51 of 55, 4 were
            # unusable" instead of the count silently coming up short.
            "rows_dropped": rows_dropped,
        },
    }
@app.get("/health")
async def health():
    return {"status": "ok"}
