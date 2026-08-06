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

function Node({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`px-4 py-2.5 border font-mono text-xs whitespace-nowrap ${
        accent
          ? 'border-accent text-accent bg-accent/5'
          : 'border-border bg-bg text-text-primary'
      }`}
    >
      {children}
    </span>
  );
}

function Connector({ direction }: { direction: 'right' | 'down' }) {
  return (
    <span className="font-mono text-sm text-text-muted" aria-hidden="true">
      {direction === 'right' ? '→' : '↓'}
    </span>
  );
}

export default function Architecture() {
  return (
    <section id="architecture" className="border-t border-border scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="font-heading font-semibold text-3xl sm:text-4xl tracking-[-0.02em] text-text-primary mb-14">
          Architecture
        </h2>

        <div className="border border-border bg-surface p-8 sm:p-12 flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Node>Next.js (TypeScript)</Node>
            <Connector direction="right" />
            <Node>FastAPI</Node>
            <Connector direction="right" />
            <Node accent>LangGraph</Node>
          </div>

          <Connector direction="down" />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Node>Data Analysis</Node>
            <Node>Groq LLM</Node>
            <Node>Anomaly Detection</Node>
          </div>

          <Connector direction="down" />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Node>Insights</Node>
            <Connector direction="right" />
            <Node accent>Firestore</Node>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-border mt-10">
          {DECISIONS.map((d) => (
            <div key={d.title} className="border-b border-r border-border p-6">
              <p className="font-mono text-xs text-accent mb-2">{d.title}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
