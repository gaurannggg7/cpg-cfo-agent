# 💰 CPG CFO Agent

> An agentic AI system that turns raw transaction data into CFO-level financial decisions for consumer packaged goods (CPG) brands.

Upload a CSV of transactions and a multi-agent pipeline categorizes spend, flags anomalies, forecasts runway, and generates an executive brief — orchestrated with LangGraph and powered by a Groq-hosted LLM.

**Stack:** Next.js · TypeScript · FastAPI · LangGraph · Groq (Llama 3.3 70B) · Firebase Firestore · Docker

---

## What it does

The system runs four autonomous agents in sequence, each consuming the previous agent's output:

1. **Categorize** — classifies every transaction into COGS, OpEx, S&M, R&D, and other CPG-relevant buckets
2. **Detect Anomalies** — flags unusual spend patterns, outliers, and risk levels using statistical signals
3. **Forecast Runway** — calculates burn rate and months of runway against monthly revenue
4. **Summarize** — synthesizes everything into a 3-paragraph executive brief with key decisions and next steps

The agents are wired together as a directed state graph, so each one writes to shared state that downstream agents read from.

---

## Architecture
┌─────────────────┐          ┌──────────────────────────────┐
│  Next.js (TS)   │  POST    │        FastAPI Backend       │
│  Upload + UI    │ ──────►  │                              │
│  Vercel         │  /analyze│   LangGraph State Machine    │
└─────────────────┘          │
                        ┌──────────┐                  │
│                    │  │categorize│                  │
│                    │  └────┬─────┘                  │
▼                    │       ▼                        │
┌─────────────────┐         │  ┌──────────┐                  │
│   Firestore     │         │  │ anomalies│                  │
│ Analysis history│         │  └────┬─────┘                  │
└─────────────────┘         │       ▼                        │
│  ┌──────────┐   ┌───────────┐  │
│  │  runway  │──►│ summarize │  │
│  └──────────┘   └─────┬─────┘  │
│                       │        │
│              Groq Llama 3.3 70B│
└──────────────────────┬─────────┘
▼
CFO Executive Brief
---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python |
| Agent orchestration | LangGraph |
| LLM inference | Groq (Llama 3.3 70B) |
| Database | Firebase Firestore |
| Containerization | Docker, Docker Compose |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Running locally

### Prerequisites
- Docker Desktop
- A free [Groq API key](https://console.groq.com)
- A [Firebase project](https://console.firebase.google.com) with Firestore enabled

### Setup

1. Clone the repo:
```bash
   git clone https://github.com/gaurannggg7/cpg-cfo-agent.git
   cd cpg-cfo-agent
```

2. Add your Groq API key to `backend/.env`:GROQ_API_KEY=your_groq_api_key_here
3.  Add your Firebase config to `frontend/.env.local`:
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:8000
4. Start everything:
```bash
   docker-compose up --build
```

5. Open the app:
   - Frontend → http://localhost:3000
   - Backend API docs → http://localhost:8000/docs

### Try it
Upload the included `sample_transactions.csv`, set a monthly revenue, and run the analysis.

---

## Project structure
cpg-cfo-agent/
├── backend/
│   ├── main.py            # FastAPI app + /analyze endpoint
│   ├── agent.py           # LangGraph agents + state machine
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/               # Next.js pages
│   ├── components/        # UploadForm, Dashboard
│   ├── lib/firebase.ts    # Firestore client
│   └── hooks/             # Analysis persistence
├── docker-compose.yml
└── sample_transactions.csv

---

## Notes

- The CSV must include `date`, `amount`, `description`, and `category` columns.
- Analysis results are persisted to Firestore so prior runs can be retrieved.
- Groq's free tier provides fast inference suitable for this workload.

---

## License

MIT
