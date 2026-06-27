# CPG CFO Agent

**Turn a CSV of transactions into an executive financial brief in under 3 seconds.**

An agentic AI system that runs four autonomous LLM-powered agents in sequence — categorizing spend, flagging anomalies, forecasting runway, and writing a CFO-ready summary — orchestrated with LangGraph and served over a production Next.js interface.

[![MIT License](https://img.shields.io/badge/license-MIT-zinc.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://cpg-cfo-agent.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-blue.svg)](https://langchain-ai.github.io/langgraph/)

---

## What it does

Upload a CSV of financial transactions and the system runs a four-agent pipeline that produces a structured CFO executive brief — including categorized spend by bucket (COGS, OpEx, S&M, R&D), flagged anomalies with risk level, cash runway in months, and a plain-English executive summary written by Llama 3.3 70B.

Each agent writes to shared state that the next agent reads from. Results are persisted to Firebase Firestore and rendered in a real-time dashboard — no page reload required.

---

## Architecture

Two independent ingestion paths feed the same LangGraph pipeline:

```
┌─────────────────────────────── HTTP PATH ────────────────────────────────────┐
│                                                                               │
│  Browser / curl                                                               │
│       │ POST /analyze (multipart CSV)                                         │
│       ▼                                                                       │
│  Next.js Frontend ──► FastAPI Backend :8000 ──► LangGraph Pipeline           │
│  (Vercel / :3000)       /analyze                 categorize →                 │
│                         /health                  detect_anomalies →           │
│                                                  runway_calc →                │
│                                                  summarize                    │
│                                                       │                       │
│                                                       ▼                       │
│                                                  Groq · Llama 3.3 70B        │
└───────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────── gRPC / KAFKA PATH ────────────────────────────┐
│                                                                               │
│  gRPC Client                                                                  │
│       │ AnalyzeTransactions RPC                                               │
│       ▼                                                                       │
│  Go Gateway :50051 ──► Kafka "transaction-ingestion" ──► kafka_consumer.py  │
│  services/gateway/        (validate + publish JSON)         cfo_app.invoke() │
│                                                                  │            │
│                                                                  ├─► evaluation.py
│                                                                  │   Firestore
│                                                                  │   evaluations/
│                                                                  │            │
│                                                        Kafka "analysis-complete"
│                                                                               │
│  Prometheus metrics: http://localhost:9090  (Prometheus server)               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────── MCP PATH ─────────────────────────────────────┐
│                                                                               │
│  Claude Desktop                                                               │
│       │ stdio                                                                 │
│       ▼                                                                       │
│  FastMCP server (services/mcp/server.py) ──► LangGraph Pipeline              │
│  3 tools: analyze_transactions                                                │
│           categorize_spend                                                    │
│           get_runway_forecast                                                 │
└───────────────────────────────────────────────────────────────────────────────┘

Kubernetes (k8s/): namespace cpg-cfo-agent
  gateway (2 replicas, HPA 2–5) | backend (2) | frontend (1) | kafka+zk (1)
```

---

## Key features

- **Agentic orchestration** — Four LLM agents chained as a directed state graph via LangGraph. Each agent specializes in one task and hands structured output to the next.
- **Groq-accelerated inference** — Llama 3.3 70B served via Groq's inference API. JSON-mode responses keep outputs structured and parseable.
- **Real-time dashboard** — Upload → analysis → results rendered in one page transition. Metric cards, anomaly list, recommendations, and the full executive brief.
- **Firebase persistence** — Anonymous auth and Firestore storage so analysis history survives page refreshes.
- **Go gRPC gateway** — Alternative high-throughput ingestion path. Validates CSV payloads and publishes to Kafka for async pipeline execution.
- **Kafka event bus** — Decouples ingestion from processing. `transaction-ingestion` and `analysis-complete` topics enable fanout and replay.
- **MCP server** — Exposes the pipeline as three Claude Desktop tools via FastMCP over stdio.
- **Prometheus observability** — Request count, latency histograms, per-agent execution time, LLM token usage, and rolling pipeline success rate. Grafana dashboard auto-provisioned with 5 panels.
- **Evaluation logging** — Every Kafka-path pipeline run is scored and persisted to Firestore `evaluations/` for quality tracking over time.
- **Kubernetes-ready** — Production manifests with resource limits, health probes, Ingress, and HPA in `k8s/`.

---

## LangGraph pipeline

```
CSV Upload  ──►  Categorize  ──►  Detect Anomalies  ──►  Forecast Runway  ──►  Generate Brief
                    │                   │                       │                     │
             Buckets spend         Flags outliers,        Calculates burn       Writes CFO
             into COGS/OpEx/       assigns risk level     rate & runway         executive
             S&M/R&D/Other         (Low/Med/High)         in months             summary
```

---

## Tech stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | Next.js 16 + TypeScript | UI, upload form, results dashboard |
| Styling | Tailwind CSS 4 | Design system |
| Backend | FastAPI + Uvicorn | REST API, agent runner |
| Orchestration | LangGraph 0.2 | Agent state graph |
| LLM | Groq · Llama 3.3 70B | Inference (JSON mode) |
| Auth & Storage | Firebase Firestore | Anonymous auth, persistence, evaluation logs |
| gRPC Gateway | Go + grpc-go | Alternative high-throughput ingestion path |
| Message bus | Apache Kafka (Confluent 7.6) | Async pipeline trigger, result fanout |
| MCP | FastMCP 1.2 | Claude Desktop integration over stdio |
| Observability | Prometheus + Grafana | Metrics on port 9090, dashboard on port 3001 |
| Containerization | Docker + Docker Compose | Local development stack |
| Kubernetes | k8s + nginx Ingress | Production deployment manifests |
| Deployment | Vercel | Production hosting |

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

## Quick start (Docker Compose)

**Prerequisites:** Docker Desktop, a [Groq API key](https://console.groq.com), and a [Firebase project](https://console.firebase.google.com) with Firestore enabled.

**1. Clone**

```bash
git clone https://github.com/gaurannggg7/cpg-cfo-agent.git
cd cpg-cfo-agent
```

**2. Configure environment**

```bash
cp .env.example backend/.env
# Edit backend/.env — fill in GROQ_API_KEY and optionally GOOGLE_APPLICATION_CREDENTIALS

cp .env.example frontend/.env.local
# Edit frontend/.env.local — fill in all NEXT_PUBLIC_FIREBASE_* values
```

**3. Start**

```bash
docker-compose up --build
```

**4. Try it**

Upload `sample_transactions.csv` from http://localhost:3000, or call the API directly:

```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@sample_transactions.csv" \
  -F "monthly_revenue=100000"
```

---

## Go gRPC Gateway

The gateway lives in `services/gateway/`. It validates CSV payloads and publishes JSON envelopes to Kafka.

**Prerequisites:** Go, `protoc`, and the Go protoc plugins.

```bash
cd services/gateway

# Install protoc plugins (one-time)
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

make deps        # download Go modules
make build       # generate stubs + compile binary → bin/gateway
make test        # run unit tests (no proto-gen or Kafka needed)

# Run locally (Kafka must be running)
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

**Start Kafka without the full stack:**

```bash
docker compose -f services/kafka/docker-compose.kafka.yml up -d
```

**Run the consumer:**

```bash
cd backend
pip install -r requirements.txt
KAFKA_BOOTSTRAP_SERVERS=localhost:9092 python kafka_consumer.py
```

While the consumer runs, raw Prometheus metrics are available at `http://localhost:9090/metrics`.

**Topics:**

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

See [services/mcp/README.md](services/mcp/README.md) for Claude Desktop configuration and Docker setup.

---

## Monitoring (Prometheus + Grafana)

Access Grafana at http://localhost:3001 (admin/admin). The dashboard is provisioned automatically from `grafana/`.

**Metrics** (defined in `backend/monitoring.py`):

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `cpg_cfo_request_count_total` | Counter | `endpoint`, `status` | Requests by entry point and outcome |
| `cpg_cfo_request_latency_seconds` | Histogram | `endpoint` | End-to-end latency; buckets 0.5s–60s |
| `cpg_cfo_agent_execution_seconds` | Histogram | `agent` | Per-node LangGraph execution time |
| `cpg_cfo_llm_token_usage_total` | Counter | `agent`, `token_type` | Groq tokens consumed |
| `cpg_cfo_pipeline_success_rate` | Gauge | — | Rolling success rate 0.0–1.0 |

**Grafana panels:**

1. Request Rate — `rate(cpg_cfo_request_count_total[5m])` by endpoint/status
2. Request Latency P50/P95/P99 — histogram quantiles over 5m
3. Per-Agent Execution Time — average execution seconds per LangGraph node
4. LLM Token Usage — token consumption rate by agent and token type
5. Pipeline Success Rate — gauge with red/yellow/green thresholds at 0.8/0.95

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

Manifests are in `k8s/`. All resources live in the `cpg-cfo-agent` namespace.

**Prerequisites:** a running cluster, `kubectl`, and the nginx Ingress Controller.

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

kubectl get all -n cpg-cfo-agent
```

**Dry-run:**

```bash
kubectl apply --dry-run=client -f k8s/
```

**HPA:** The gateway scales from 2 → 5 replicas at 70% CPU. Requires the [Metrics Server](https://github.com/kubernetes-sigs/metrics-server).

---

## API reference

### `POST /analyze`

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

Returns `{"status": "ok"}`. Used by Kubernetes liveness/readiness probes.

### gRPC `AnalyzeTransactions` (port 50051)

See `services/gateway/proto/transaction.proto`. Returns `{status, job_id, message}`. The analysis result arrives asynchronously on the `analysis-complete` Kafka topic.

---

## Project structure

```
cpg-cfo-agent/
├── backend/
│   ├── agent.py              # LangGraph state machine + 4 agent nodes
│   ├── main.py               # FastAPI app, /analyze endpoint
│   ├── kafka_consumer.py     # Async Kafka → LangGraph consumer
│   ├── monitoring.py         # Prometheus metrics definitions + HTTP server
│   ├── evaluation.py         # Firestore evaluation logger
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Main page — state orchestrator
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── UploadForm.tsx
│   │   └── landing/          # Hero, HowItWorks, BuiltWith, Stats, Footer
│   ├── hooks/useAnalysisSave.ts
│   ├── lib/firebase.ts
│   └── package.json
├── services/
│   ├── gateway/              # Go gRPC gateway
│   │   ├── proto/transaction.proto
│   │   ├── cmd/gateway/main.go
│   │   ├── validate.go
│   │   ├── gateway_test.go
│   │   ├── gen/              # Generated by `make build` (gitignored)
│   │   ├── go.mod
│   │   ├── Makefile
│   │   └── Dockerfile
│   ├── kafka/
│   │   └── docker-compose.kafka.yml  # Standalone Kafka dev setup
│   └── mcp/
│       ├── server.py         # FastMCP stdio server (3 tools)
│       ├── requirements.txt
│       ├── test_server.py
│       ├── README.md
│       └── Dockerfile
├── k8s/                      # Kubernetes manifests
│   ├── namespace.yaml
│   ├── deployments/
│   ├── services/
│   ├── configmaps/
│   ├── ingress.yaml
│   └── hpa.yaml
├── grafana/
│   ├── dashboards/cpg-cfo-agent.json
│   └── provisioning/
│       ├── dashboards/dashboard.yml
│       └── datasources/prometheus.yml
├── prometheus/
│   └── prometheus.yml
├── docker-compose.yml
├── .env.example
└── sample_transactions.csv
```

---

## Live demo

**[cpg-cfo-agent.vercel.app](https://cpg-cfo-agent.vercel.app)**

Upload the included `sample_transactions.csv` to see a full analysis. The CSV must include columns: `date`, `amount`, `description`, `category`.

---

## License

MIT

---

<div align="center">

Built by **[Gaurang Mohan](https://github.com/gaurannggg7)** · ASU CS 2026

[GitHub](https://github.com/gaurannggg7/cpg-cfo-agent) · [Live Demo](https://cpg-cfo-agent.vercel.app) · [LinkedIn](https://linkedin.com/in/gaurang-mohan)

</div>
