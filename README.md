# Baseline

**Know what's normal. Catch what's not.**

Baseline turns a CSV of transactions into an executive financial brief in under 3 seconds. Four autonomous LLM agents run in sequence — categorizing spend, flagging anomalies, forecasting runway, and writing a CFO-ready summary — orchestrated with LangGraph and served behind a Next.js frontend with real accounts, guest access, and per-user data isolation.

The repository and package names still say `cpg-cfo-agent` — that's the original working title and it's wired into the GitHub URL, so it stays. Everything user-facing is Baseline.

[![MIT License](https://img.shields.io/badge/license-MIT-zinc.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://cpg-cfo-agent.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-blue.svg)](https://langchain-ai.github.io/langgraph/)

---

## Demo

**[cpg-cfo-agent.vercel.app](https://cpg-cfo-agent.vercel.app)**

Click **Try Demo**, then **Try Sample Data** — no account needed. The sample CSV includes a deliberately planted anomaly (a -$5,000 outlier transaction) so you can see the anomaly detection actually catch something, not just render an empty state.

The backend runs on Render's free tier, which sleeps after ~15 minutes of inactivity. First request after a cold start can take 30–60 seconds; everything after that is fast.

---

## Features

- **Four-agent LangGraph pipeline** — categorize spend, detect anomalies, forecast runway, generate an executive summary. Each agent is a separate graph node with its own prompt and JSON-mode output; nothing is one giant LLM call.
- **Guest mode** — anyone can run the demo with zero signup friction. This matters specifically because the primary audience for a portfolio project is a recruiter or hiring manager who is not going to create an account to evaluate your work.
- **Google OAuth and email/password auth** — both wired through the same Firebase Auth instance and the same `onAuthStateChanged` listener. Adding email/password didn't require touching the Google flow, the guest flow, or any of the per-user isolation logic — see [ARCHITECTURE.md](ARCHITECTURE.md#authentication) for why that was true by construction rather than luck.
- **Per-user data isolation** — Firestore Security Rules check `request.auth.uid` against the document's `userId` and explicitly reject the `anonymous` sign-in provider, so guest sessions can run analyses but never persist them. Enforcement lives in the rules, not in application code that could have a bug in it.
- **Backend token verification** — `POST /analyze` requires a valid Firebase ID token. Anonymous (guest) tokens are accepted deliberately; tokenless requests are not. This closes the gap where the API was fully anonymous-callable by anyone, without breaking the guest demo — see [ARCHITECTURE.md](ARCHITECTURE.md#authentication) for the reasoning and the failure mode this catches.
- **Persistent analysis history** — signed-in users get a dashboard of past analyses (`/dashboard`, `/dashboard/[id]`), each one loaded and ownership-checked against the signed-in user's UID before rendering.
- **Go gRPC gateway** — an alternative high-throughput ingestion path that validates CSVs and publishes to Kafka for async pipeline execution.
- **Kafka event bus** — decouples ingestion from processing so the pipeline can be triggered from more than one entry point (HTTP, gRPC, eventually anything else that can publish to `transaction-ingestion`).
- **MCP server** — exposes the pipeline as three tools inside Claude Desktop over stdio.
- **Prometheus + Grafana** — request rate, latency histograms, and pipeline success rate are live; per-agent execution time and token usage are defined as metrics but not yet wired into the LangGraph nodes (see [Known gaps](#known-gaps)).
- **Kubernetes manifests** — production-shaped deployments, services, HPA, and Ingress in `k8s/`, validated structurally but never applied to a live cluster.

---

## Architecture at a glance

Three independent ingestion paths (HTTP, gRPC/Kafka, MCP) all feed the same LangGraph pipeline in `backend/agent.py`. The frontend is a set of Next.js routes — a public dark-themed landing page, a `/demo` route anyone can use, and `/dashboard` + `/analyze` routes gated behind real (non-anonymous) auth.

Full system diagram, data flow per path, the auth/token-verification flow, and the reasoning behind the major technical choices live in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Tech stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | Next.js 16 + TypeScript | Landing page, demo, dashboard, auth pages |
| Styling | Tailwind CSS 4 | Dark theme, animated background, design tokens |
| Auth | Firebase Auth | Anonymous (guest), Google OAuth, email/password |
| Backend | FastAPI + Uvicorn | REST API, agent runner, ID-token verification |
| Orchestration | LangGraph 0.2 | Agent state graph |
| LLM | Groq · Llama 3.3 70B | Inference (JSON mode) |
| Data | Firebase Firestore | Per-user analysis history, evaluation logs |
| Token verification | Firebase Admin SDK | Verifies ID tokens on `/analyze` |
| gRPC Gateway | Go + grpc-go | Alternative high-throughput ingestion path |
| Message bus | Apache Kafka (Confluent 7.6) | Async pipeline trigger, result fanout |
| MCP | FastMCP 1.2 | Claude Desktop integration over stdio |
| Observability | Prometheus + Grafana | Metrics on port 9090, dashboard on port 3001 |
| Containerization | Docker + Docker Compose | Local development stack |
| Kubernetes | k8s + nginx Ingress | Production deployment manifests (not applied live) |
| Deployment | Vercel (frontend) + Render (backend) | Production hosting |

---

## Getting started

### Prerequisites

- Node.js 20+ and npm
- Python 3.11 (Python 3.14 currently fails to build `pandas` from source — pin 3.11 locally and on Render)
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
- **Backend → Render.** New Web Service, root directory `backend`, build command `pip install -r requirements.txt`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set `GROQ_API_KEY` and `FIREBASE_SERVICE_ACCOUNT_BASE64` (see below) as env vars. Force Python 3.11 with a `PYTHON_VERSION` env var or a `.python-version` file — Render defaults to a newer Python that can't build `pandas` from source.
- **`FIREBASE_SERVICE_ACCOUNT_BASE64`** — download a service-account JSON from Firebase Console → Project Settings → Service Accounts, then:
  ```bash
  base64 -i service-account.json | tr -d '\n'
  ```
  Paste the single-line output as the env var value. Base64-in-one-line was a deliberate choice over writing the raw JSON to a temp file at startup — multiline JSON inside a platform's env var UI is a common source of copy-paste corruption.

---

## Known gaps

Being upfront about what's incomplete, rather than letting a reader find out by clicking:

- **Two Grafana panels are permanently empty.** `Per-Agent Execution Time` and `LLM Token Usage` are defined as Prometheus metrics in `backend/monitoring.py`, but nothing calls `.observe()` or `.inc()` on them — they'd need instrumentation added inside `backend/agent.py`'s LangGraph nodes, and `agent.py` is intentionally left untouched as a stability boundary for this project.
- **Footer social links are placeholders.** `components/landing/FooterCTA.tsx` has `TODO` markers for GitHub, LinkedIn, and a contact email — fill in your own before treating the landing page as final.
- **A few landing components are dead code.** `Stats.tsx`, `HowItWorks.tsx`, `BuiltWith.tsx`, and the original `Footer.tsx` predate the dark-theme rebrand and aren't imported anywhere anymore. Left on disk rather than deleted in case any of that copy is worth recovering.
- **Kubernetes manifests are unapplied.** They pass structural validation but have never been run against a live cluster — treat them as a demonstration of the shape of a production deployment, not as tested infrastructure.

---

## LangGraph pipeline

```
CSV Upload  ──►  Categorize  ──►  Detect Anomalies  ──►  Forecast Runway  ──►  Generate Brief
                    │                   │                       │                     │
             Buckets spend         Flags outliers,        Calculates burn       Writes CFO
             into COGS/OpEx/       assigns risk level     rate & runway         executive
             S&M/R&D/Other         (Low/Med/High)         in months             summary
```

Why four separate nodes instead of one prompt: each stage has a narrow, checkable output shape (a categorization dict, an anomaly list with a risk level, a runway number, free text). That makes it possible to inspect or replace any one stage without touching the others, and it makes failures attributable to a specific stage instead of "the LLM said something wrong somewhere."

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
| `analyze_transactions(csv_data)` | Runs the full four-agent pipeline |
| `categorize_spend(csv_data)` | Returns only the categorization output |
| `get_runway_forecast(csv_data)` | Returns only the runway forecast |

Runs over stdio, which means it's reachable only from a process that spawns it locally — it has never been exposed as a network service. See [services/mcp/README.md](services/mcp/README.md) for Claude Desktop configuration.

---

## Monitoring (Prometheus + Grafana)

Access Grafana at http://localhost:3001 (admin/admin). The dashboard is provisioned automatically from `grafana/`.

**Public live dashboard:** the local Prometheus also remote_writes to Grafana Cloud (see `prometheus/prometheus.yml.template` and the `prometheus-config`/`prometheus` services in `docker-compose.yml`). A public, no-login snapshot of the same dashboard:

[https://glowingpig1947.grafana.net/public-dashboards/67aa37ce287842f4bbc8230b921d72ff](https://glowingpig1947.grafana.net/public-dashboards/67aa37ce287842f4bbc8230b921d72ff)

Panels only populate while the local Docker stack is running and sending `/analyze` traffic — it's a live feed, not a static demo.

**Metrics** (defined in `backend/monitoring.py`):

| Metric | Type | Labels | Description | Status |
|--------|------|--------|-------------|--------|
| `cpg_cfo_request_count_total` | Counter | `endpoint`, `status` | Requests by entry point and outcome | Live |
| `cpg_cfo_request_latency_seconds` | Histogram | `endpoint` | End-to-end latency; buckets 0.5s–60s | Live |
| `cpg_cfo_pipeline_success_rate` | Gauge | — | Rolling success rate 0.0–1.0 | Live |
| `cpg_cfo_agent_execution_seconds` | Histogram | `agent` | Per-node LangGraph execution time | Defined, not instrumented |
| `cpg_cfo_llm_token_usage_total` | Counter | `agent`, `token_type` | Groq tokens consumed | Defined, not instrumented |

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

Quality score (0–100): 40 pts if `summary` ≥ 100 chars; 20 pts each for non-empty `categorized`, `anomalies`, and `runway`.

---

## Kubernetes deployment

Manifests are in `k8s/`. All resources live in the `cpg-cfo-agent` namespace. **These have been structurally validated (12/12 well-formed manifests) but never applied to a live cluster.**

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
| `file` | File | CSV with columns: `date`, `amount`, `description`, `category` |
| `monthly_revenue` | number | Revenue baseline for runway calculation |

**Response:** `application/json`

```json
{
  "summary": "Executive brief text...",
  "categories": { "COGS": [...], "OpEx": [...] },
  "anomalies": { "anomalies": [...], "risk_level": "medium", "actions": [...] },
  "runway": { "runway_months": 4.2, "recommendations": [...] },
  "metrics": {
    "total_transactions": 142,
    "total_spend": 84230.00,
    "avg_transaction": 593.17,
    "date_range": "2024-01-01 to 2024-03-31"
  }
}
```

### `GET /health`

Returns `{"status": "ok"}`. No auth required — used by Render/Kubernetes liveness and readiness probes, which don't carry a Firebase token.

### gRPC `AnalyzeTransactions` (port 50051)

See `services/gateway/proto/transaction.proto`. Returns `{status, job_id, message}`. The analysis result arrives asynchronously on the `analysis-complete` Kafka topic.

---

## Project structure

```
cpg-cfo-agent/
├── backend/
│   ├── agent.py               # LangGraph state machine + 4 agent nodes (never modified post-authoring)
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
│   │   └── layout.tsx          # Mounts the shared atmospheric background
│   ├── components/
│   │   ├── Dashboard.tsx        # Analysis result view (shared by /demo and /dashboard/[id])
│   │   ├── UploadForm.tsx       # Shared by /demo and /analyze
│   │   ├── Navbar.tsx           # Auth-aware nav, shared across every route
│   │   ├── AuthBanner.tsx       # Guest-vs-Google choice banner
│   │   ├── ScanlinesOverlay.tsx # Animated background (5 drifting lights + scanlines)
│   │   └── landing/             # Hero, Problem, Pipeline, Capabilities, Architecture, Stack, FooterCTA
│   ├── hooks/useAuth.ts, useAnalysisSave.ts
│   ├── lib/firebase.ts, analyzeApi.ts
│   └── package.json
├── services/
│   ├── gateway/               # Go gRPC gateway
│   ├── kafka/                 # Standalone Kafka dev compose file
│   └── mcp/                   # FastMCP stdio server (3 tools)
├── k8s/                       # Kubernetes manifests (validated, not applied live)
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
