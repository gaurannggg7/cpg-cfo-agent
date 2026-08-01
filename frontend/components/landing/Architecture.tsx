const DECISIONS = [
  {
    title: 'Why LangGraph',
    body:
      "Analysis isn't one LLM call. Explicit orchestration lets stages be separated, inspected, and extended.",
  },
  {
    title: 'Why Firestore',
    body:
      'Lightweight per-user persistence without standing up a relational DB and migration layer.',
  },
];

function Box({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`px-4 py-2.5 rounded-lg border text-xs font-mono text-[#E2E8F0] whitespace-nowrap ${
        accent ? 'border-[#7C3AED] text-[#06B6D4]' : 'border-white/[0.08] bg-[#0F0F12]/75'
      }`}
    >
      {children}
    </span>
  );
}

function DownArrow() {
  return (
    <svg className="w-4 h-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

function RightArrow() {
  return (
    <svg className="w-4 h-4 text-[#7C3AED] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

export default function Architecture() {
  return (
    <section id="architecture" className="py-24 scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED] mb-3">
          System Design
        </p>
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-[#E2E8F0] tracking-tight mb-10">
          Architecture
        </h2>

        <div className="bg-[#0F0F12]/75 border border-white/[0.08] rounded-xl p-8 flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Box>Next.js (TypeScript)</Box>
            <RightArrow />
            <Box>FastAPI</Box>
            <RightArrow />
            <Box accent>LangGraph</Box>
          </div>

          <DownArrow />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Box>Data Analysis</Box>
            <Box>Groq LLM</Box>
            <Box>Anomaly Detection</Box>
          </div>

          <DownArrow />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Box>Insights</Box>
            <RightArrow />
            <Box accent>Firestore</Box>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-10">
          {DECISIONS.map((d) => (
            <div key={d.title}>
              <p className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] mb-2">
                {d.title}
              </p>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
