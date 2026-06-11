# CFO Agent — Marketing Landing Page Design

**Date:** 2026-06-11  
**Status:** Approved

## Goal

Wrap the existing CFO analysis tool in a single-page marketing landing page targeting recruiters. The page must communicate what the tool does, demonstrate the tech stack, and let visitors run a real analysis — all without changing any existing logic or backend code.

## Constraints

- Next.js 16 + Tailwind 4 stack. No new npm dependencies.
- `UploadForm.tsx` and `Dashboard.tsx` logic is frozen — no changes to props, state, or API calls.
- `backend/`, `.env` files untouched.
- All existing Firebase/auth/API logic in `page.tsx` stays identical.

## Architecture

**Approach:** Rebuild `page.tsx` as a full-page orchestrator. Extract each marketing section into a thin presentational component under `frontend/components/landing/`. The existing state machine (`results`, `loading`, `user`) lives in `page.tsx` exactly as it does today.

### File map

| File | Role |
|------|------|
| `frontend/app/page.tsx` | Orchestrator — all state/logic + section layout |
| `frontend/components/landing/Hero.tsx` | Section 1: pill + headline + buttons + node diagram |
| `frontend/components/landing/Stats.tsx` | Section 2: 4 stat tiles |
| `frontend/components/landing/HowItWorks.tsx` | Section 3: 4-card pipeline |
| `frontend/components/landing/BuiltWith.tsx` | Section 5: tech stack grid |
| `frontend/components/landing/Footer.tsx` | Section 6: links + attribution |
| `frontend/components/UploadForm.tsx` | **Unchanged** |
| `frontend/components/Dashboard.tsx` | **Unchanged** |

## Section Specs

### 1. Hero
- Layout: `lg:grid-cols-2` — text left, visual right.
- Pill badge above headline: `"Agentic AI · LangGraph · Groq"` — small, rounded, zinc border.
- Headline: `"AI CFO Analyst for CPG Brands"` — large, bold, zinc-900.
- Subhead: one line explaining transaction data → executive financial brief.
- Buttons: `"Try It Live"` (anchor `#demo`) + `"View on GitHub"` (external). Both dark zinc-900 style.
- Right visual: inline JSX node diagram — three connected boxes (CSV Upload → 4 AI Agents → CFO Brief) with SVG arrow connectors. No images.

### 2. Stat Tiles
Four horizontal cards:
- `4 Agents` / Autonomous pipeline
- `LangGraph` / Orchestration  
- `Llama 3.3 70B` / Groq inference
- `<3s` / Analysis time

Each: large number/text zinc-900, small label zinc-500, white card with zinc-200 border.

### 3. How It Works
Horizontal pipeline of 4 agent cards with arrow separators:
1. **Categorize** — Groups transactions by type
2. **Detect Anomalies** — Flags unusual spending patterns
3. **Forecast Runway** — Calculates cash runway months
4. **Generate Brief** — Writes the CFO executive summary

Each card: small icon (SVG inline), agent name bold, one-line description zinc-500.

### 4. Live Demo (`id="demo"`)
- Heading: `"Try It Yourself"`
- Subhead: `"Upload a CSV with columns: date, amount, description, category"`
- Conditionally renders `<UploadForm>` (no results) or `<Dashboard>` (results exist).
- All props passed from `page.tsx` state — unchanged.

### 5. Built With
7-tile grid (wrapping): Next.js, TypeScript, FastAPI, LangGraph, Groq, Firebase, Docker.  
Each: name + one-word role label. White cards, zinc-200 border.

### 6. Footer
Centered, zinc-500 text:  
`"Built by Gaurang Mohan · ASU CS 2026"` + GitHub + LinkedIn links (external, `rel="noopener noreferrer"`).

## Design Tokens

| Token | Value |
|-------|-------|
| Page bg | `bg-zinc-50` |
| Cards | `bg-white border border-zinc-200 shadow-sm` |
| Primary text | `text-zinc-900` |
| Secondary text | `text-zinc-500` |
| Labels | `text-xs uppercase tracking-wider text-zinc-500` |
| Primary button | `bg-zinc-900 text-white hover:bg-zinc-800` |
| Hover transitions | `transition-all duration-200` |

## External Links

- GitHub: `https://github.com/gaurannggg7/cpg-cfo-agent` (hero + footer)
- LinkedIn: `https://linkedin.com/in/gaurang-mohan` (footer only)
- All external links: `target="_blank" rel="noopener noreferrer"`

## Responsiveness

- Mobile (375px): single column, stack hero vertically, stats 2×2 grid, pipeline wraps.
- Tablet (768px): 2-column hero, stats row.
- Desktop (1024px+): full layout as designed.
