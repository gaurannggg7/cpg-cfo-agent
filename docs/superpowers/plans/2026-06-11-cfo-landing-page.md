# CFO Agent Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing CFO analysis tool in a six-section marketing landing page (Stripe/Linear/Vercel aesthetic) so recruiters can immediately understand what it does and try it live.

**Architecture:** Five new presentational components in `frontend/components/landing/` handle all marketing sections. `page.tsx` is rebuilt as an orchestrator: it keeps all existing state/logic (Firebase auth, `handleAnalyze`, `results`, `loading`) and renders the landing sections with the real `UploadForm` and `Dashboard` embedded in the demo section. `UploadForm.tsx` and `Dashboard.tsx` are untouched.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind 4. No new dependencies.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `frontend/components/landing/Hero.tsx` | Hero section: pill badge, headline, buttons, pipeline node diagram |
| Create | `frontend/components/landing/Stats.tsx` | Four stat tiles row |
| Create | `frontend/components/landing/HowItWorks.tsx` | Four-card agent pipeline with icons |
| Create | `frontend/components/landing/BuiltWith.tsx` | Tech stack tile grid |
| Create | `frontend/components/landing/Footer.tsx` | Attribution + links |
| Modify | `frontend/app/page.tsx` | Orchestrator — keep all state/logic, add section layout |
| Modify | `frontend/app/globals.css` | Add `scroll-behavior: smooth` |
| No change | `frontend/components/UploadForm.tsx` | Frozen |
| No change | `frontend/components/Dashboard.tsx` | Frozen |

---

## Task 1: Add smooth scroll + create Hero component

**Files:**
- Modify: `frontend/app/globals.css`
- Create: `frontend/components/landing/Hero.tsx`

- [ ] **Step 1: Add smooth scroll to globals.css**

Open `frontend/app/globals.css` and add `scroll-behavior: smooth` to the `html` element. The full file should look like this:

```css
@import "tailwindcss";

html {
  scroll-behavior: smooth;
}

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

- [ ] **Step 2: Create landing components directory**

```bash
mkdir -p "frontend/components/landing"
```

- [ ] **Step 3: Create Hero.tsx**

Create `frontend/components/landing/Hero.tsx` with this exact content:

```tsx
export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-500 tracking-wide mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden="true" />
            Agentic AI · LangGraph · Groq
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.1] mb-5">
            AI CFO Analyst<br className="hidden sm:block" /> for CPG Brands
          </h1>
          <p className="text-zinc-500 text-lg leading-relaxed mb-8 max-w-md">
            Upload your transaction data and receive an executive financial brief — categorized spend, anomaly flags, and cash runway forecast in under 3 seconds.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#demo"
              className="inline-flex items-center px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
            >
              Try It Live
            </a>
            <a
              href="https://github.com/gaurannggg7/cpg-cfo-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-semibold rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        <div className="hidden lg:block">
          <PipelineDiagram />
        </div>
      </div>
    </section>
  );
}

function PipelineDiagram() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-6">
        Analysis Pipeline
      </p>

      <div className="flex items-stretch gap-3">
        {/* Node: CSV Upload */}
        <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
          <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-zinc-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-zinc-800">CSV Upload</p>
          <p className="text-[10px] text-zinc-400 mt-1">Transaction data</p>
        </div>

        {/* Arrow */}
        <div className="flex items-center flex-shrink-0">
          <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        {/* Node: 4 AI Agents */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-zinc-800 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4 15.298" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-white">4 AI Agents</p>
          <p className="text-[10px] text-zinc-400 mt-1">LangGraph</p>
        </div>

        {/* Arrow */}
        <div className="flex items-center flex-shrink-0">
          <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        {/* Node: CFO Brief */}
        <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
          <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-zinc-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-zinc-800">CFO Brief</p>
          <p className="text-[10px] text-zinc-400 mt-1">Executive summary</p>
        </div>
      </div>

      {/* Agent labels */}
      <div className="grid grid-cols-4 gap-1 pt-5 border-t border-zinc-100 mt-5">
        {['Categorize', 'Anomalies', 'Runway', 'Generate'].map((label) => (
          <p key={label} className="text-[10px] font-medium text-zinc-400 text-center">
            {label}
          </p>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify file was created**

```bash
ls "frontend/components/landing/"
```
Expected output: `Hero.tsx`

- [ ] **Step 5: Commit**

```bash
git add frontend/app/globals.css frontend/components/landing/Hero.tsx
git commit -m "feat: add Hero landing section and smooth scroll"
```

---

## Task 2: Create Stats component

**Files:**
- Create: `frontend/components/landing/Stats.tsx`

- [ ] **Step 1: Create Stats.tsx**

Create `frontend/components/landing/Stats.tsx`:

```tsx
const STATS = [
  { value: '4', unit: 'Agents', sub: 'Autonomous pipeline' },
  { value: 'LangGraph', unit: '', sub: 'Orchestration' },
  { value: 'Llama 3.3', unit: '70B', sub: 'Groq inference' },
  { value: '<3s', unit: '', sub: 'Analysis time' },
] as const;

export default function Stats() {
  return (
    <section className="border-y border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.sub} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                {stat.value}
                {stat.unit && (
                  <span className="text-base sm:text-lg font-semibold ml-1 text-zinc-700">
                    {stat.unit}
                  </span>
                )}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-2">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/landing/Stats.tsx
git commit -m "feat: add Stats landing section"
```

---

## Task 3: Create HowItWorks component

**Files:**
- Create: `frontend/components/landing/HowItWorks.tsx`

- [ ] **Step 1: Create HowItWorks.tsx**

Create `frontend/components/landing/HowItWorks.tsx`:

```tsx
const AGENTS = [
  {
    name: 'Categorize',
    description: 'Groups every transaction by spending type and category',
    icon: (
      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    name: 'Detect Anomalies',
    description: 'Flags unusual spending patterns and assigns a risk level',
    icon: (
      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    name: 'Forecast Runway',
    description: 'Calculates months of cash runway from current burn rate',
    icon: (
      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    name: 'Generate Brief',
    description: 'Writes the executive CFO summary in plain English',
    icon: (
      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Under the hood
          </p>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AGENTS.map((agent, i) => (
            <div key={agent.name} className="relative">
              {/* Connector line (desktop only) */}
              {i < AGENTS.length - 1 && (
                <div
                  className="hidden lg:block absolute top-8 left-[calc(100%-8px)] w-4 h-px bg-zinc-200 z-10"
                  aria-hidden="true"
                />
              )}

              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    {agent.icon}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-900 mb-2">{agent.name}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{agent.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/landing/HowItWorks.tsx
git commit -m "feat: add HowItWorks landing section"
```

---

## Task 4: Create BuiltWith and Footer components

**Files:**
- Create: `frontend/components/landing/BuiltWith.tsx`
- Create: `frontend/components/landing/Footer.tsx`

- [ ] **Step 1: Create BuiltWith.tsx**

Create `frontend/components/landing/BuiltWith.tsx`:

```tsx
const STACK = [
  { name: 'Next.js', role: 'Frontend' },
  { name: 'TypeScript', role: 'Language' },
  { name: 'FastAPI', role: 'Backend' },
  { name: 'LangGraph', role: 'Orchestration' },
  { name: 'Groq', role: 'Inference' },
  { name: 'Firebase', role: 'Storage' },
  { name: 'Docker', role: 'Deployment' },
] as const;

export default function BuiltWith() {
  return (
    <section className="py-20 bg-zinc-50 border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Tech Stack
          </p>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Built With</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {STACK.map((tech) => (
            <div
              key={tech.name}
              className="bg-white border border-zinc-200 rounded-xl px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center min-w-[100px]"
            >
              <p className="text-sm font-bold text-zinc-900">{tech.name}</p>
              <p className="text-[11px] font-medium text-zinc-400 mt-1 uppercase tracking-wide">{tech.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create Footer.tsx**

Create `frontend/components/landing/Footer.tsx`:

```tsx
export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            Built by{' '}
            <span className="font-semibold text-zinc-700">Gaurang Mohan</span>
            {' · '}ASU CS 2026
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/gaurannggg7/cpg-cfo-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 font-medium"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/gaurang-mohan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 font-medium"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/landing/BuiltWith.tsx frontend/components/landing/Footer.tsx
git commit -m "feat: add BuiltWith and Footer landing sections"
```

---

## Task 5: Rebuild page.tsx

**Files:**
- Modify: `frontend/app/page.tsx`

This is the critical step. The new `page.tsx` must keep every line of existing state/logic unchanged and add the landing sections around the demo section.

- [ ] **Step 1: Replace page.tsx**

Replace the entire content of `frontend/app/page.tsx` with:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { signInAnon } from '@/lib/firebase';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import UploadForm from '@/components/UploadForm';
import Dashboard, { type AnalysisResult } from '@/components/Dashboard';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import HowItWorks from '@/components/landing/HowItWorks';
import BuiltWith from '@/components/landing/BuiltWith';
import Footer from '@/components/landing/Footer';
import type { User } from 'firebase/auth';

export default function Home() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { save } = useAnalysisSave();

  useEffect(() => {
    signInAnon().then((cred) => setUser(cred.user)).catch(console.error);
  }, []);

  const handleAnalyze = async (file: File, monthlyRevenue: number) => {
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('monthly_revenue', monthlyRevenue.toString());

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();

      if (user?.uid) {
        await save(data, user.uid);
      }

      setResults(data as AnalysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Is the backend running? Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <span className="text-zinc-900 font-semibold text-sm tracking-tight">CPG CFO Agent</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <a
              href="#demo"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 font-medium"
            >
              Demo
            </a>
            <a
              href="https://github.com/gaurannggg7/cpg-cfo-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-1.5 rounded-lg font-medium transition-colors duration-200"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Marketing sections */}
      <Hero />
      <Stats />
      <HowItWorks />

      {/* Live demo — real working tool */}
      <section id="demo" className="py-20 bg-white border-y border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Interactive Demo
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-3">
              Try It Yourself
            </h2>
            <p className="text-zinc-500 text-sm">
              Upload a CSV with columns: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 text-xs">date, amount, description, category</code>
            </p>
          </div>
          {!results ? (
            <UploadForm onAnalyze={handleAnalyze} loading={loading} />
          ) : (
            <Dashboard data={results} onNewAnalysis={() => setResults(null)} />
          )}
        </div>
      </section>

      <BuiltWith />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no output (clean compile). If you see errors about missing modules, check that all import paths match the files created in Tasks 1–4.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat: rebuild page.tsx as landing page orchestrator"
```

---

## Task 6: Visual verification

**Files:** No changes — verification only.

- [ ] **Step 1: Start dev server**

```bash
cd frontend && npm run dev
```

Open `http://localhost:3000` in a browser.

- [ ] **Step 2: Check each section**

Walk through the page top to bottom. Verify:

| Section | What to check |
|---------|---------------|
| Nav | Sticky on scroll, logo visible, Demo + GitHub links present |
| Hero | Pill badge visible, headline renders, both buttons present; pipeline diagram shows 3 boxes with arrows on desktop, hidden on mobile |
| Stats | 4 tiles in a row on desktop, 2×2 on mobile |
| How It Works | 4 cards with icons and step numbers, hover state lifts card |
| Live Demo | "Try It Yourself" heading, UploadForm renders (file picker + revenue input + button) |
| Built With | 7 tiles in a wrapping row |
| Footer | "Gaurang Mohan · ASU CS 2026", GitHub and LinkedIn links |

- [ ] **Step 3: Check "Try It Live" scroll**

Click the "Try It Live" button in the hero. Verify it smooth-scrolls to the Live Demo section.

- [ ] **Step 4: Check external links**

Verify both GitHub links and the LinkedIn link open in a new tab.

- [ ] **Step 5: Check mobile (375px)**

Use browser devtools to simulate a 375px viewport. Verify:
- Hero stacks to single column (pipeline diagram hidden)
- Stats renders as 2×2 grid
- HowItWorks cards stack vertically
- No horizontal overflow

- [ ] **Step 6: Final commit (if any CSS tweaks made)**

```bash
git add -p
git commit -m "fix: responsive and visual tweaks after verification"
```
