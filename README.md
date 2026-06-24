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
┌─────────────────────────────── HTTP PATH (existing) ────────────────────────────────┐
│                                                                                      │
│  Browser / curl                                                                      │
│       │ POST /analyze (multipart CSV)                                                │
│       ▼                                                                              │
│  Next.js Frontend ──► FastAPI Backend :8000 ──► LangGraph Pipeline                  │
│  (Vercel / :3000)       /analyze                 categorize →                        │
│                         /health                  detect_anomalies →                  │
│                                                  runway_calc →                       │
│                                                  summarize                            │
│                                                       │                              │
│                                                       ▼                              │
│                                                  Groq · Llama 3.3 70B               │
└──────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────── gRPC / KAFKA PATH (new) ──────────────────────────────┐
│                                                                                      │
│  gRPC Client                                                                         │
│       │ AnalyzeTransactions RPC                                                      │
│       ▼                                                                              │
│  Go Gateway :50051 ──► Kafka "transaction-ingestion" ──► kafka_consumer.py          │
│  services/gateway/        (validate + publish JSON)         cfo_app.invoke()        │
│                                                                  │                  │
│                                                                  ├─► evaluation.py  │
│                                                                  │   Firestore      │
│                                                                  │   evaluations/   │
│                                                                  │                  │
│                                                        Kafka "analysis-complete"    │
│                                                                                      │
│  Prometheus metrics: http://localhost:9090/metrics  (monitoring.py)                 │
└──────────────────────────────────────────────────────────────────────────────────────┘

Kubernetes (k8s/): namespace cpg-cfo-agent
  gateway (2 replicas, HPA) | backend (2) | frontend (1) | kafka+zk (1)
```

---

## Key features

- **Agentic orchestration** — Four LLM agents chained as a directed state graph via LangGraph. Each agent specializes in one task and hands structured output to the next.
- **Groq-accelerated inference** — Llama 3.3 70B served via Groq's inference API. JSON-mode responses keep outputs structured and parseable.
- **Real-time dashboard** — Upload → analysis → results rendered in one page transition. Metric cards, anomaly list, recommendations, and the full executive brief.
- **Firebase persistence** — Anonymous auth and Firestore storage so analysis history survives page refreshes.
- **Go gRPC gateway** — Alternative high-throughput ingestion path. Validates CSV payloads and publishes to Kafka for async pipeline execution.
- **Kafka event bus** — Decouples ingestion from processing. `transaction-ingestion` and `analysis-complete` topics enable fanout and replay.
- **Prometheus observability** — Request count, latency histograms, per-agent execution time, LLM token usage, and rolling pipeline success rate.
- **Evaluation logging** — Every Kafka-path pipeline run is scored and persisted to Firestore `evaluations/` for quality tracking over time.
- **Kubernetes-ready** — Production manifests with resource limits, health probes, Ingress, and HPA included in `k8s/`.

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
| gRPC Gateway | Go 1.22 + grpc-go | Alternative high-throughput ingestion path |
| Message bus | Apache Kafka (Confluent) | Async pipeline trigger, result fanout |
| Observability | Prometheus + prometheus-client | Metrics endpoint on port 9090 |
| Containerization | Docker + Docker Compose | Local development |
| Orchestration | Kubernetes + nginx Ingress | Production deployment manifests |
| Deployment | Vercel | Production hosting |

---

## Quick start (Docker Compose — full stack)

**Prerequisites:** Docker Desktop, a [Groq API key](https://console.groq.com), and a [Firebase project](https://console.firebase.google.com) with Firestore enabled.

**1. Clone**

```bash
git clone https://github.com/gaurannggg7/cpg-cfo-agent.git
cd cpg-cfo-agent
```

**2. Configure environment**

```bash
cp .env.example backend/.env
# Edit backend/.env and fill in GROQ_API_KEY (and optionally GOOGLE_APPLICATION_CREDENTIALS)
cp .env.example frontend/.env.local
# Edit frontend/.env.local and fill in all NEXT_PUBLIC_FIREBASE_* values
```

**3. Start with Docker Compose**

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| API docs | http://localhost:8000/docs |
| gRPC gateway | localhost:50051 |

**4. Try it**

Upload the included `sample_transactions.csv` from the web UI, or call the API directly:

```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@sample_transactions.csv" \
  -F "monthly_revenue=100000"
```

---

## Go gRPC Gateway setup

The gateway lives in `services/gateway/`. It accepts gRPC requests, validates the CSV payload, and publishes a JSON message to Kafka.

**Prerequisites:** Go 1.22+, `protoc`, and the Go protoc plugins.

```bash
cd services/gateway

# Install protoc plugins (one-time)
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.2
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

# Download dependencies, generate stubs, build binary
make deps
make build      # runs proto-gen automatically

# Run locally (Kafka must be running)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092 make run

# Unit tests (no Kafka or proto-gen needed)
make test
```

**Docker only:**

```bash
docker build -t cpg-gateway ./services/gateway
docker run -e KAFKA_BOOTSTRAP_SERVERS=host.docker.internal:9092 -p 50051:50051 cpg-gateway
```

---

## Kafka consumer setup

The async pipeline consumer reads from `transaction-ingestion`, invokes the same LangGraph pipeline as the HTTP path, logs results to Firestore, and publishes to `analysis-complete`.

**Start Kafka only (without the full stack):**

```bash
docker compose -f services/kafka/docker-compose.kafka.yml up -d
```

**Run the consumer:**

```bash
cd backend
pip install -r requirements.txt
KAFKA_BOOTSTRAP_SERVERS=localhost:9092 python kafka_consumer.py
```

Prometheus metrics are available at `http://localhost:9090/metrics` while the consumer is running.

**Topics:**

| Topic | Producer | Consumer |
|-------|----------|----------|
| `transaction-ingestion` | Go gateway | kafka_consumer.py |
| `analysis-complete` | kafka_consumer.py | downstream / polling client |

---

## Kubernetes deployment

Manifests are in `k8s/`. All resources live in the `cpg-cfo-agent` namespace.

**Prerequisites:** a running cluster, `kubectl`, and the [nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/deploy/).

**1. Create the namespace**

```bash
kubectl apply -f k8s/namespace.yaml
```

**2. Create secrets** (never stored in git)

```bash
kubectl create secret generic cpg-cfo-agent-secrets \
  --from-literal=GROQ_API_KEY=<your-key> \
  -n cpg-cfo-agent
```

**3. Apply all manifests**

```bash
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

**4. Verify**

```bash
kubectl get all -n cpg-cfo-agent
```

**Dry-run validation:**

```bash
kubectl apply --dry-run=client -f k8s/namespace.yaml
kubectl apply --dry-run=client -f k8s/deployments/
kubectl apply --dry-run=client -f k8s/services/
kubectl apply --dry-run=client -f k8s/ingress.yaml
kubectl apply --dry-run=client -f k8s/hpa.yaml
```

**HPA:** The gateway scales from 2 → 5 replicas at 70% CPU. Requires the [Metrics Server](https://github.com/kubernetes-sigs/metrics-server).

---

## Monitoring & Evaluation

### Prometheus metrics

While `kafka_consumer.py` is running, a Prometheus-compatible `/metrics` endpoint is available at `http://localhost:9090/metrics`.

| Metric | Type | Description |
|--------|------|-------------|
| `cpg_cfo_request_count_total` | Counter | Requests by endpoint and status |
| `cpg_cfo_request_latency_seconds` | Histogram | End-to-end latency |
| `cpg_cfo_agent_execution_seconds` | Histogram | Per-agent LangGraph node time |
| `cpg_cfo_llm_token_usage_total` | Counter | Groq token consumption by agent |
| `cpg_cfo_pipeline_success_rate` | Gauge | Rolling success rate (0.0 – 1.0) |

Scrape config for `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: cpg-cfo-agent
    static_configs:
      - targets: ['localhost:9090']
```

### Evaluation logs (Firestore)

Every pipeline run triggered via Kafka is logged to Firestore under `evaluations/{doc_id}`:

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

Quality score is 0–100 based on output completeness (summary length + presence of categorized, anomalies, runway keys).

---

## Live demo

**[cpg-cfo-agent.vercel.app](https://cpg-cfo-agent.vercel.app)**

Upload the included `sample_transactions.csv` to see a full analysis. The CSV must include these columns: `date`, `amount`, `description`, `category`.

---

## Project structure

```
cpg-cfo-agent/
├── backend/
│   ├── agent.py              # LangGraph state machine + 4 agent nodes
│   ├── main.py               # FastAPI app, /analyze endpoint
│   ├── kafka_consumer.py     # NEW: Async Kafka → LangGraph consumer
│   ├── monitoring.py         # NEW: Prometheus metrics definitions
│   ├── evaluation.py         # NEW: Firestore evaluation logger
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
│   │   └── landing/
│   ├── hooks/useAnalysisSave.ts
│   ├── lib/firebase.ts
│   └── package.json
├── services/
│   ├── gateway/              # NEW: Go gRPC gateway
│   │   ├── proto/transaction.proto
│   │   ├── cmd/gateway/main.go
│   │   ├── validate.go
│   │   ├── gateway_test.go
│   │   ├── gen/              # Generated by `make proto-gen` (gitignored)
│   │   ├── go.mod
│   │   ├── Makefile
│   │   └── Dockerfile
│   └── kafka/               # NEW: Standalone Kafka dev setup
│       └── docker-compose.kafka.yml
├── k8s/                     # NEW: Kubernetes manifests
│   ├── namespace.yaml
│   ├── deployments/
│   ├── services/
│   ├── configmaps/
│   ├── ingress.yaml
│   └── hpa.yaml
├── docker-compose.yml        # UPDATED: includes gateway + Kafka
├── .env.example              # NEW: all environment variables
├── sample_transactions.csv
└── README.md
```

---

## API reference

### `POST /analyze`

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | `File` | CSV with columns: `date`, `amount`, `description`, `category` |
| `monthly_revenue` | `number` | Revenue baseline for runway calculation |

**Response:** `application/json`

```json
{
  "summary": "Executive brief text...",
  "metrics": {
    "total_transactions": 142,
    "total_spend": 84230.00,
    "avg_transaction": 593.17
  },
  "anomalies": {
    "anomalies": ["Unusually large payment to vendor X on 2024-03-15"],
    "risk_level": "Medium"
  },
  "runway": {
    "runway_months": 4.2,
    "recommendations": ["Reduce discretionary OpEx by 15%"]
  }
}
```

### `GET /health`

Returns `{"status": "ok"}`. Used by Kubernetes liveness/readiness probes.

### gRPC `AnalyzeTransactions` (port 50051)

See `services/gateway/proto/transaction.proto` for the full schema.

---

## License

MIT

---

<div align="center">

Built by **[Gaurang Mohan](https://github.com/gaurannggg7)** · ASU CS 2026

[GitHub](https://github.com/gaurannggg7/cpg-cfo-agent) · [Live Demo](https://cpg-cfo-agent.vercel.app) · [LinkedIn](https://linkedin.com/in/gaurang-mohan)

</div>
