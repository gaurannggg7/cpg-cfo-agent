const STACK = [
  { name: 'Next.js', role: 'Frontend' },
  { name: 'TypeScript', role: 'Language' },
  { name: 'FastAPI', role: 'Backend' },
  { name: 'LangGraph', role: 'Orchestration' },
  { name: 'Groq', role: 'Inference' },
  { name: 'Firebase', role: 'Auth & data' },
  { name: 'Kafka', role: 'Event bus' },
  { name: 'Docker', role: 'Containers' },
] as const;

export default function Stack() {
  return (
    <section className="py-40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-heading)] font-semibold text-4xl sm:text-5xl text-[var(--text)] tracking-tight">
            The Stack
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 bg-[var(--surface)] rounded-[2px] shadow-[var(--shadow-card)] overflow-hidden">
          {STACK.map(({ name, role }, i) => {
            const isLeftColumn = i % 2 === 0;
            const isLastRow = i >= STACK.length - 2;
            return (
              <div
                key={name}
                className={`flex items-baseline justify-between px-5 py-3.5 font-mono text-sm border-[var(--border)] ${
                  isLeftColumn ? 'sm:border-r' : ''
                } ${i < STACK.length - 1 ? 'border-b' : ''} ${isLastRow ? 'sm:border-b-0' : ''}`}
              >
                <span className="text-[var(--text)]">{name}</span>
                <span className="text-[var(--text-dim)] text-xs">{role}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
