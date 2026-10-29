# Baseline

**Know what's normal. Catch what's not.**

Baseline turns a CSV of transactions into an executive financial brief. A LangGraph pipeline runs two LLM calls (spend categorization and anomaly screening) in parallel with a deterministic Python runway calculation, then makes a third LLM call to write the summary. It is served behind a Next.js frontend with real accounts, guest access, and per-user data isolation.

**Latency (measured, not a guarantee).** On the previous model (Llama 3.3 70B) the median end-to-end time was 12.02 s before the fixes (n=19) and 14.04 s after (n=18); only 1 of 18 post-fix runs finished in under 3 s. On the current model (`openai/gpt-oss-120b`) latency has only a single smoke run (9.7 s) and has not been re-measured. See [`eval/RESULTS.md`](eval/RESULTS.md) and [`eval/MIGRATION_NOTES.md`](eval/MIGRATION_NOTES.md). This is a portfolio project, not a production-ready service.

The repository and package names still say `cpg-cfo-agent` — that's the original working title and it's wired into the GitHub URL, so it stays. Everything user-facing is Baseline.

[![MIT License](https://img.shields.io/badge/license-MIT-zinc.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://cpg-cfo-agent.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-blue.svg)](https://langchain-ai.github.io/langgraph/)

---

## Demo

**[cpg-cfo-agent.vercel.app](https://cpg-cfo-agent.vercel.app)**

Click **Try Demo**, then **Try Sample Data** — no account needed. `sample_transactions.csv` (100 rows, columns `date, description, amount, category`) has all-positive amounts and no deliberately planted outlier; do not expect a guaranteed anomaly on it. The controlled anomaly test is `eval/corpus/planted_anomaly.csv` (see [Evaluation](#evaluation)).

The frontend shows a "waking up the server" notice after 10 s of waiting (`AnalysisProgress.tsx`); it fires on elapsed time alone and cannot tell a cold start from a slow request. Cold-start duration and the backend's hosting tier are not documented or verified in this repo. Warm requests are not fast either: see the latency figures above.

---

## Features

- **LangGraph pipeline: 3 LLM calls + 1 Python node** — `categorize` and `detect_anomalies` (JSON mode) and `runway_calc` (pure Python, no LLM) start together; `summarize` (free text) joins them. Category totals are computed in pandas and runway in Python, so those figures do not depend on the model. Narrative text is not deterministic.
- **Guest mode** — anyone can run the demo with zero signup friction. This matters specifically because the primary audience for a portfolio project is a recruiter or hiring manager who is not going to create an account to evaluate your work.
- **Google OAuth and email/password auth** — both wired through the same Firebase Auth instance and the same `onAuthStateChanged` listener. Adding email/password didn't require touching the Google flow, the guest flow, or any of the per-user isolation logic — see [ARCHITECTURE.md](ARCHITECTURE.md#authentication) for why that was true by construction rather than luck.
- **Per-user data isolation** — Firestore Security Rules check `request.auth.uid` against the document's `userId` and explicitly reject the `anonymous` sign-in provider, so guest sessions can run analyses but never persist them. Enforcement lives in the rules, not in application code that could have a bug in it.
- **Backend token verification** — `POST /analyze` requires a valid Firebase ID token. Anonymous (guest) tokens are accepted deliberately; tokenless requests are not. This closes the gap where the API was fully anonymous-callable by anyone, without breaking the guest demo — see [ARCHITECTURE.md](ARCHITECTURE.md#authentication) for the reasoning and the failure mode this catches.
- **Persistent analysis history** — signed-in users get a dashboard of past analyses (`/dashboard`, `/dashboard/[id]`), each one loaded and ownership-checked against the signed-in user's UID before rendering.
- **Go gRPC gateway** — an alternative ingestion path that checks only that the CSV and session id are non-empty, then publishes to Kafka for async pipeline execution.
- **Kafka event bus** — decouples ingestion from processing. The consumer does **not** share the HTTP path's validation or state setup (see [Known gaps](#known-gaps)).
- **MCP server** — exposes the pipeline as three tools inside Claude Desktop over stdio. Same caveat as Kafka.
- **Prometheus + Grafana** — request count, latency and success rate are recorded for `/analyze` and Kafka. Per-node execution time and prompt/completion token counters are instrumented in `backend/agent.py`; that this populates the Grafana panels has not been verified here.
- **Kubernetes manifests** — deployments, services, HPA, and Ingress in `k8s/`. No validation or deployment record is kept in this repo (see [Known gaps](#known-gaps)).

---

## Architecture at a glance

Three ingestion paths (HTTP, gRPC/Kafka, MCP) call the same LangGraph graph in `backend/agent.py`, but only the HTTP path validates input and builds the full state. The frontend is a set of Next.js routes — a public light-themed landing page, a `/demo` route anyone can use, and `/dashboard` + `/analyze` routes gated behind real (non-anonymous) auth.

Full system diagram, data flow per path, the auth/token-verification flow, and the reasoning behind the major technical choices live in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Tech stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | Next.js 16 + TypeScript | Landing page, demo, dashboard, auth pages |
| Styling | Tailwind CSS 4 | Light earth-tone theme, design tokens |
| Auth | Firebase Auth | Anonymous (guest), Google OAuth, email/password |
| Backend | FastAPI + Uvicorn | REST API, agent runner, ID-token verification |
| Orchestration | LangGraph 0.2 | Agent state graph |
| LLM | Groq · `openai/gpt-oss-120b` (reasoning model; replaced Llama 3.3 70B) | Inference; JSON mode for categorize and anomalies |
| Data | Firebase Firestore | Per-user analysis history, evaluation logs |
| Token verification | Firebase Admin SDK | Verifies ID tokens on `/analyze` |
| gRPC Gateway | Go + grpc-go | Alternative high-throughput ingestion path |
| Message bus | Apache Kafka (Confluent 7.6) | Async pipeline trigger, result fanout |
| MCP | FastMCP 1.2 | Claude Desktop integration over stdio |
| Observability | Prometheus + Grafana | Metrics on port 9090, dashboard on port 3001 |
| Containerization | Docker + Docker Compose | Local development stack |
| Kubernetes | k8s + nginx Ingress | Manifests only; no validation or deployment record in repo |
| Deployment | Vercel (frontend) + Render (backend) | Production hosting |

---

## Getting started

### Prerequisites

- Node.js 20+ and npm
- Python 3.11 recommended (`backend/requirements.txt` pins `pandas==2.2.0`; newer Python versions are untested here)
- A [Groq API key](https://console.groq.com)
- A [Firebase project](https://console.firebase.google.com) with **Firestore**, **Anonymous auth**, **Google auth**, and **Email/Password auth** all enabled under Authentication → Sign-in method

### 1. Clone and configure

```bash
git clone https://github.com/gaurannggg7/cpg-cfo-agent.git
cd cpg-cfo-agent
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Fill in `backend/.env`:

```
GROQ_API_KEY=your_groq_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

`FIREBASE_PROJECT_ID` alone is enough for local ID-token verification — verifying a token only needs the project id and Google's public signing certificates, not a privileged service-account key. See [ARCHITECTURE.md](ARCHITECTURE.md#credential-flow) for why the production path (Render) is different.

Fill in `frontend/.env.local` with your Firebase web app config (`NEXT_PUBLIC_FIREBASE_*` values from Firebase Console → Project Settings → General → Your apps) and:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Run it

**Frontend only, against a local backend:**

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload
cd frontend && npm install && npm run dev
```

**Full stack (Kafka, gRPC gateway, Prometheus, Grafana included):**

```bash
docker-compose up --build
```

Then open `http://localhost:3000`, click **Try Demo**, and either upload `sample_transactions.csv` or click **Try Sample Data**.

### 3. Deploying your own copy

- **Frontend → Vercel.** Import the repo, set the `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_API_URL` env vars in the Vercel dashboard, deploy.
- **Backend → Render.** New Web Service, root directory `backend`, build command `pip install -r requirements.txt`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set `GROQ_API_KEY` and `FIREBASE_SERVICE_ACCOUNT_BASE64` (see below) as env vars. Pin Python 3.11 with a `PYTHON_VERSION` env var or a `.python-version` file. These steps are a suggested setup; no Render or Vercel configuration is tracked in this repo.
- **`FIREBASE_SERVICE_ACCOUNT_BASE64`** — download a service-account JSON from Firebase Console → Project Settings → Service Accounts, then:
  ```bash
  base64 -i service-account.json | tr -d '\n'
  ```
  Paste the single-line output as the env var value. Base64-in-one-line was a deliberate choice over writing the raw JSON to a temp file at startup — multiline JSON inside a platform's env var UI is a common source of copy-paste corruption.

---

## Known gaps

Being upfront about what's incomplete, rather than letting a reader find out by clicking:

**Pipeline behavior**

- **Categorization sees only the first 3,000 characters** of the re-serialized CSV (`csv_text[:3000]` in `agent.py`). On larger files the LLM-written COGS/OpEx item lists cover a subset of rows (the cut can fall mid-row). `total_by_category` is computed in pandas over all rows and is unaffected. The fraction of rows cut off for a given file has not been measured against the re-serialized input. On `gpt-oss-120b` the model also sometimes returned fewer items than it was given: 51, 51, 50, 41, 51 of 51 in 5 runs on the 51-row reference file, plus 38 and 51 in two earlier runs and 6 in the original smoke test (8 observations, one input; see `eval/MIGRATION_NOTES.md`).
- **Anomaly screening is aggregate-only.** `detect_anomalies` receives `df.describe().to_string()` (count/mean/std/min/quartiles/max of numeric columns), not transaction rows. It can notice that an extreme value exists; it cannot see which row, and any date or description it cites is not grounded in its input. The reported 70% recall (planted-spike file, n=10) was measured on the previous model.
- **Prompt instructions are not enforced.** The plain-text summary rule, schema pinning and injection warnings are prompt text. Code checks only that model JSON parses to an object (falling back with `_parse_error`), not its item schema or completeness.
- **Runway is often `null`.** It needs the optional `cash_on_hand` field, and is `null` with a `reason` when revenue covers spend.
- **Rate limits.** One full run costs about 8,500 tokens on `gpt-oss-120b` (mean of 5 runs, ~38% reasoning tokens) while the `x-ratelimit-limit-tokens` header recorded for this model in one live request read 8,000 (per minute). That header is a single recorded observation, not a documented or permanent quota, and the run-to-run token counts vary (8,141–8,969). A request may be rate limited, depending on recent usage; when Groq returns a rate-limit error the API answers `503 upstream_rate_limited`. Daily quota was not measured for this model.
- **Rows with a blank date or amount are dropped**, and the count is returned as `metrics.rows_dropped`. The frontend does not currently display it (no reference in `frontend/`).

**Kafka and MCP paths**

- Neither calls `parse_transactions()`; the HTTP-only validation (structured 422s, `N/A` rejection, `rows_dropped`) does not apply. The Go gateway only checks for non-empty input. The Kafka consumer uses plain `pd.read_csv` and `to_datetime`; MCP coerces invalid values and silently drops those rows.
- Neither sets `monthly_spend` or `cash_on_hand` in the state. `calculate_runway` reads `monthly_spend` as 0 when absent, so these paths report "revenue covers spend" regardless of data; **treat their `runway` output as not meaningful.**
- The Kafka consumer hardcodes `monthly_revenue=100000`; MCP infers revenue from the data. Kafka results omit the pandas `total_by_category`.

**Metrics**

- Per-node timing and token counters are instrumented in code (`backend/agent.py`). Whether they populate the Grafana dashboard in any running environment has not been verified. The execution-time histogram's top finite bucket is 10 s, so slower nodes fall into `+Inf`. Token counters record prompt and completion tokens (reasoning tokens are inside completion).

**Tests, CI and infrastructure**

- No CI workflow is checked in (`.github/` absent), so there is no evidence of automated runs. Automated tests: Go gateway input validators (`services/gateway/gateway_test.go`) and MCP tests that use a fake pipeline (`services/mcp/test_server.py`). There are no tests for `parse_transactions`, `agent.py`, `/analyze` or the frontend. These tests were not run while this documentation was written. The `eval/` scripts are live-API measurement harnesses, not regression tests.
- **Kubernetes:** 12 manifests exist; no validation output or deployment record is kept here, so "validated" and "deployed" are both undocumented. The manifests reference `ghcr.io/gaurannggg7/cpg-cfo-agent/*:latest` images, and no workflow builds or pushes them. As written, the backend Deployment wires only `KAFKA_BOOTSTRAP_SERVERS` and `GROQ_API_KEY`; `FIREBASE_PROJECT_ID` sits in the ConfigMap but is not referenced, and `backend/auth.py` raises when no Firebase credential variable is set. Expect to add Firebase configuration before `/analyze` works in-cluster.

**Housekeeping**

- **Footer social links are placeholders.** `components/landing/FooterCTA.tsx` has `TODO` markers for GitHub, LinkedIn, and a contact email.
- **Unused landing components.** `Stats.tsx`, `HowItWorks.tsx`, `BuiltWith.tsx` and `Footer.tsx` are not imported from `frontend/app` or `frontend/components` (the landing page imports only Hero, Problem, Pipeline, Capabilities, Architecture, Stack and FooterCTA).

---

## LangGraph pipeline

```
                ┌─► Categorize (LLM, first 3,000 chars) ──┐
CSV Upload ─────┼─► Detect Anomalies (LLM, describe() stats) ─┼─► Generate Brief (LLM, free text)
                └─► Runway (Python, no LLM) ──────────────┘
```

- `categorize` → COGS/OpEx item lists (`{date, amount, description}`), JSON mode.
- `detect_anomalies` → `{anomalies, risk_level, actions}`, JSON mode, from aggregate statistics only.
- `runway_calc` → `cash_on_hand / (monthly_spend − monthly_revenue)`; `null` plus a `reason` if cash is missing or revenue covers spend.
- `summarize` → plain-text brief from the three outputs.

The three upstream nodes are independent, so they run as one parallel step (`set_conditional_entry_point` in `agent.py`). `BASELINE_SEQUENTIAL=1` restores the original sequential chain for comparison. The parallel topology was verified to run concurrently on a synthetic graph (6.04 s → 2.01 s); an end-to-end latency A/B was inconclusive (n=3 vs n=2, 7 of 12 runs rate-limited), so no end-to-end speed-up is claimed.

Why separate nodes: each stage has a narrow output shape, so a stage can be inspected or replaced on its own and failures are attributable to a stage.

---

## Ingestion paths

Three independent paths feed the same pipeline:

```
┌─────────────────────────────── HTTP PATH (primary) ──────────────────────────┐
│  Browser ──POST /analyze (multipart CSV, Bearer token)──► FastAPI :8000     │
│                                                              │                │
│                                                              ▼                │
│                                                     LangGraph Pipeline        │
└────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────── gRPC / KAFKA PATH ────────────────────────────┐
│  gRPC Client ──AnalyzeTransactions RPC──► Go Gateway :50051                  │
│                                              │                                │
│                                              ▼                                │
│                                    Kafka "transaction-ingestion"              │
│                                              │                                │
│                                              ▼                                │
│                                       kafka_consumer.py ──► LangGraph        │
│                                              │                                │
│                                              ├─► evaluation.py → Firestore   │
│                                              └─► Kafka "analysis-complete"    │
└────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────── MCP PATH ─────────────────────────────────────┐
│  Claude Desktop ──stdio──► FastMCP server (services/mcp/server.py)           │
│                               3 tools: analyze_transactions,                 │
│                               categorize_spend, get_runway_forecast          │
└────────────────────────────────────────────────────────────────────────────────┘
```

Full data-flow-per-path detail is in [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Services and ports

| Service | Local URL / Port | Description |
|---------|-----------------|-------------|
| Frontend | http://localhost:3000 | Next.js dev server |
| Backend | http://localhost:8000 | FastAPI; `/analyze`, `/health`, `/docs` |
| gRPC gateway | localhost:50051 | `FinancialAnalysisService.AnalyzeTransactions` |
| Kafka broker | localhost:9092 | Confluent Kafka |
| Prometheus | http://localhost:9090 | Prometheus server UI + API |
| Grafana | http://localhost:3001 | Dashboard (admin/admin) |

---

## Go gRPC gateway

The gateway lives in `services/gateway/`. It validates CSV payloads and publishes JSON envelopes to Kafka.

**Prerequisites:** Go, `protoc`, and the Go protoc plugins.

```bash
cd services/gateway

go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

make deps        # download Go modules
make build       # generate stubs + compile binary → bin/gateway
make test        # run unit tests (no proto-gen or Kafka needed)

KAFKA_BOOTSTRAP_SERVERS=localhost:9092 make run
```

**Docker only:**

```bash
docker build -t cpg-gateway ./services/gateway
docker run -e KAFKA_BOOTSTRAP_SERVERS=host.docker.internal:9092 -p 50051:50051 cpg-gateway
```

---

## Kafka consumer

The async consumer reads from `transaction-ingestion`, invokes the LangGraph pipeline, logs results to Firestore, and publishes to `analysis-complete`.

```bash
docker compose -f services/kafka/docker-compose.kafka.yml up -d

cd backend
pip install -r requirements.txt
KAFKA_BOOTSTRAP_SERVERS=localhost:9092 python kafka_consumer.py
```

While the consumer runs, raw Prometheus metrics are available at `http://localhost:9090/metrics`.

| Topic | Producer | Consumer |
|-------|----------|----------|
| `transaction-ingestion` | Go gateway | kafka_consumer.py |
| `analysis-complete` | kafka_consumer.py | downstream / polling client |

---

## MCP server (Claude Desktop)

`services/mcp/server.py` exposes three tools over stdio via FastMCP:

| Tool | Description |
|------|-------------|
| `analyze_transactions(csv_data)` | Runs the full pipeline (3 LLM calls + Python runway) |
| `categorize_spend(csv_data)` | Returns only the categorization output |
| `get_runway_forecast(csv_data)` | Returns only the runway forecast |

The server is started with `MCP_SERVER.run()` and its README documents stdio transport, so the intended use is a command-based server launched by Claude Desktop. This repo configures no network transport or authentication for it; actual past use is not recorded here. See [services/mcp/README.md](services/mcp/README.md) for Claude Desktop configuration.

---

## Monitoring (Prometheus + Grafana)

Access Grafana at http://localhost:3001 (admin/admin). The dashboard is provisioned automatically from `grafana/`.

**Grafana Cloud (configuration only):** `docker-compose.yml` renders `prometheus/prometheus.yml.template` with `GRAFANA_CLOUD_*` variables from `.env` and starts Prometheus with the result. That configuration scrapes `cpg-cfo-agent.onrender.com` over HTTPS every 5 s (not the local backend container) and `remote_write`s to the Grafana Cloud URL from the environment. The tracked `prometheus/prometheus.yml` is a similar file that uses a different username variable name (`GRAFANA_CLOUD_USERNAME` vs `GRAFANA_CLOUD_PROM_USERNAME`). Whether this has ever run, and what the scraped `/metrics` endpoint exposes, was not verified. Dashboard link (unverified):

[https://glowingpig1947.grafana.net/public-dashboards/67aa37ce287842f4bbc8230b921d72ff](https://glowingpig1947.grafana.net/public-dashboards/67aa37ce287842f4bbc8230b921d72ff)

The link is **unverified**: it was not opened, and whether it is still public or populated is unknown.

**Metrics** (defined in `backend/monitoring.py`):

| Metric | Type | Labels | Description | Status |
|--------|------|--------|-------------|--------|
| `cpg_cfo_request_count_total` | Counter | `endpoint`, `status` | Requests by entry point and outcome | Recorded by `/analyze` and the Kafka consumer |
| `cpg_cfo_request_latency_seconds` | Histogram | `endpoint` | End-to-end latency; buckets 0.5s–60s | Recorded by `/analyze` and the Kafka consumer |
| `cpg_cfo_pipeline_success_rate` | Gauge | — | Rolling success rate 0.0–1.0 | Updated by `/analyze` and the Kafka consumer |
| `cpg_cfo_agent_execution_seconds` | Histogram | `agent` | Per-node LangGraph execution time; buckets top out at 10 s | Observed in `agent.py` nodes; dashboard display not verified |
| `cpg_cfo_llm_token_usage_total` | Counter | `agent`, `token_type` | Groq prompt/completion tokens (reasoning tokens counted in completion) | Incremented in `agent.py` nodes; dashboard display not verified |

The Status column describes what the code does, not a check of a running Prometheus or Grafana. **MCP:** the tool functions record no request count, latency or success-rate metrics. The shared nodes in `agent.py` do update the per-node time and token metrics in whatever process runs them, but `services/mcp/server.py` never starts a metrics HTTP server, so those values are not exposed from the MCP process (read from source, not run).

---

## Evaluation logging (Firestore)

Every pipeline run triggered via Kafka is logged to Firestore `evaluations/{doc_id}`:

```json
{
  "job_id": "uuid",
  "input_hash": "sha256 of csv_data",
  "agent_outputs": { "categorized": "...", "anomalies": "...", "runway": "..." },
  "latencies_seconds": { "total_seconds": 4.2 },
  "quality_score": 100,
  "quality_reasons": [],
  "timestamp": "2026-06-24T12:00:00+00:00"
}
```

Quality score (0–100), from `backend/evaluation.py`: 40 pts if `summary` is at least 100 characters, plus 20 pts each if `categorized`, `anomalies` and `runway` are non-empty. It measures output completeness only. It does not check financial accuracy, schema validity or model quality: a parse-failure fallback dict containing `_parse_error` is non-empty and still scores. `agent_outputs` are stored as strings truncated to 2,000 characters each. `log_evaluation` is called only from the Kafka consumer.

---

## Kubernetes deployment

Manifests are in `k8s/`; all resources use the `cpg-cfo-agent` namespace. **No validation output or deployment record is kept in this repo**, so treat them as untested. See [Known gaps](#known-gaps) for the missing Firebase wiring and unpublished image references.

```bash
kubectl apply -f k8s/namespace.yaml

kubectl create secret generic cpg-cfo-agent-secrets \
  --from-literal=GROQ_API_KEY=<your-key> \
  -n cpg-cfo-agent

kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

**HPA:** the gateway scales from 2 → 5 replicas at 70% CPU. Requires the [Metrics Server](https://github.com/kubernetes-sigs/metrics-server).

---

## API reference

### `POST /analyze`

Requires `Authorization: Bearer <firebase-id-token>`. Anonymous (guest) tokens are accepted; missing or invalid tokens get a `401`.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | UTF-8 CSV. Required columns: `date`, `amount`. `category` is used for totals when present. Amounts like `-$1,234.56` are accepted; spend is expected as negative outflow. |
| `monthly_revenue` | number | Required. Monthly revenue for the runway calculation |
| `cash_on_hand` | number | Optional. Without it, `runway_months` is `null` |

**Response (200):** `application/json`. Values are illustrative.

```json
{
  "summary": "Executive brief text (plain text)...",
  "categories": {
    "categories": { "COGS": [{"date": "...", "amount": -1.0, "description": "..."}], "OpEx": [...] },
    "total_by_category": { "COGS": -1234.56 }
  },
  "anomalies": { "anomalies": [...], "risk_level": "medium", "actions": [...] },
  "runway": {
    "runway_months": null, "monthly_spend": 0.0, "monthly_revenue": 0.0,
    "net_monthly_burn": 0.0, "cash_on_hand": null,
    "basis": "cash_on_hand / (monthly_spend - monthly_revenue)",
    "reason": "…", "recommendations": [...]
  },
  "metrics": {
    "total_transactions": 142, "total_spend": -84230.00, "avg_transaction": -593.17,
    "date_range": "2024-01-01 to 2024-03-31", "rows_dropped": 0
  }
}
```

`categories.categories` is LLM-authored and may be incomplete (see Known gaps); `total_by_category` is computed in pandas. A model reply that fails to parse yields an empty structure with `_parse_error`.

**Errors** (`detail` is `{error, message, ...}` except 401):

| Status | `error` | Meaning |
|---|---|---|
| 401 | — | Missing/invalid Firebase token |
| 422 | `invalid_encoding`, `empty_file`, `no_columns`, `no_data_rows`, `no_usable_rows`, `malformed_csv`, `duplicate_columns`, `missing_columns`, `non_numeric_amount`, `non_finite_amount` | Input rejected before any LLM call |
| 503 | `upstream_rate_limited` | Groq rate/quota limit; `Retry-After: 60` |
| 502 | `upstream_error` | Other Groq API error |
| 500 | `pipeline_failure` | Any other pipeline exception |

### `GET /health`

Returns `{"status": "ok"}`. No auth required — used by Render/Kubernetes liveness and readiness probes, which don't carry a Firebase token.

### gRPC `AnalyzeTransactions` (port 50051)

See `services/gateway/proto/transaction.proto`. Returns `{status, job_id, message}`. The analysis result arrives asynchronously on the `analysis-complete` Kafka topic.

---

## Evaluation

`eval/` holds a 29-file adversarial CSV corpus and live-API harnesses. Full detail and caveats are in [`eval/RESULTS.md`](eval/RESULTS.md); read its section 0 first.

**Measured on the previous model (`llama-3.3-70b-versatile`, `temperature=0`, `seed=42`):**

| Measurement | Result | Sample / caveat |
|---|---|---|
| Corpus pass rate | 18/29 (62%, 10 unhandled 500s) before fixes; 27/27 evaluated after | 2 files (`very_long_cell.csv`, `large_10k_rows.csv`) were NOT_RUN (Groq quota) and excluded from the denominator |
| Latency p50 | 12.02 s before (n=19); 14.04 s after (n=18); 1/18 after under 3 s | |
| Determinism (identical input) | `total_by_category` and `runway_months` stable after moving them out of the LLM; `summary` 7 distinct in 7 runs; anomaly text 4 distinct in 7 | After n=7; `seed` is best-effort |
| Anomaly detection | Recall 70% (7/10); precision 88% lenient / 70% strict; 0 false positives on a 50-identical-row control (n=4) | One planted spike; scoring judgement described in RESULTS.md |
| Prompt injection | 0 of 2 obeyed | |
| Latency A/B (parallel vs sequential) | Inconclusive | n=3 vs n=2; 7 of 12 runs rate-limited |

**Model-independent:** the input-validation results (the parse layer runs before any LLM call; re-checked against all 29 files at that layer without LLM calls, no regressions).

**Repeated on `openai/gpt-oss-120b` (`eval/MIGRATION_NOTES.md`):** one smoke run (200 OK, 9.7 s); 0 markdown in the summary over 5 runs; mean ~8,536 tokens/run over 5 runs (~38% reasoning); categorize completeness varied (see Known gaps); 8,000 tokens/minute limit observed.

**Not re-measured on the current model:** full-corpus pass rate, determinism, anomaly precision/recall, latency distribution, daily quota. Do not cite the older figures as properties of the current model.

---

## Project structure

```
cpg-cfo-agent/
├── backend/
│   ├── agent.py               # LangGraph graph: 3 LLM nodes + Python runway node
│   ├── main.py                # FastAPI app, /analyze endpoint
│   ├── auth.py                # Firebase ID-token verification dependency
│   ├── kafka_consumer.py      # Async Kafka → LangGraph consumer
│   ├── monitoring.py          # Prometheus metrics definitions + HTTP server
│   ├── evaluation.py          # Firestore evaluation logger
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── demo/page.tsx       # Public interactive demo
│   │   ├── analyze/page.tsx    # Authenticated upload → saves to dashboard
│   │   ├── dashboard/          # Analysis history (list + detail)
│   │   ├── login/, signup/     # Email/password + Google auth forms
│   │   └── layout.tsx
│   ├── components/
│   │   ├── Dashboard.tsx        # Analysis result view (shared by /demo and /dashboard/[id])
│   │   ├── UploadForm.tsx       # Shared by /demo and /analyze
│   │   ├── Navbar.tsx           # Auth-aware nav, shared across every route
│   │   ├── AuthBanner.tsx       # Guest-vs-Google choice banner
│   │   ├── AnalysisProgress.tsx, ResultsSkeleton.tsx, AnalysisError.tsx  # loading + structured error UI
│   │   └── landing/             # Hero, Problem, Pipeline, Capabilities, Architecture, Stack, FooterCTA
│   ├── hooks/useAuth.ts, useAnalysisSave.ts
│   ├── lib/firebase.ts, analyzeApi.ts
│   └── package.json
├── services/
│   ├── gateway/               # Go gRPC gateway
│   ├── kafka/                 # Standalone Kafka dev compose file
│   └── mcp/                   # FastMCP stdio server (3 tools)
├── eval/                      # Adversarial corpus, harnesses, RESULTS.md, MIGRATION_NOTES.md
├── k8s/                       # Kubernetes manifests (no validation/deployment record)
├── grafana/                   # Dashboard + provisioning
├── prometheus/
├── docker-compose.yml
├── .env.example
├── ARCHITECTURE.md
└── sample_transactions.csv
```

---

## License

MIT

---

<div align="center">

Built by **[Gaurang Mohan](https://github.com/gaurannggg7)** · ASU CS 2026

[GitHub](https://github.com/gaurannggg7/cpg-cfo-agent) · [Live Demo](https://cpg-cfo-agent.vercel.app) · [LinkedIn](https://linkedin.com/in/gaurang-mohan)

</div>
