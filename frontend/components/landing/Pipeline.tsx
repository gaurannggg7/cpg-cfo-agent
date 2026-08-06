const STAGES = [
  { name: 'UPLOAD', desc: 'Ingest transactional files' },
  { name: 'INGEST', desc: 'Normalize and structure' },
  { name: 'ANALYZE', desc: 'Establish the baseline' },
  { name: 'DETECT', desc: 'Surface deviations' },
  { name: 'REASON', desc: 'Explain what changed' },
  { name: 'RECOMMEND', desc: 'Propose next actions' },
] as const;

export default function Pipeline() {
  return (
    <section className="border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-baseline justify-between mb-14 flex-wrap gap-2">
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl tracking-[-0.02em] text-text-primary">
            The pipeline
          </h2>
          <span className="font-mono text-xs text-text-muted">06 stages</span>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 border-t border-l border-border">
          {STAGES.map((stage, i) => (
            <li
              key={stage.name}
              className="relative border-b border-r border-border p-6 min-h-[160px] flex flex-col justify-between group hover:bg-surface transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {i < STAGES.length - 1 && (
                  <span className="text-accent text-sm hidden lg:inline" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
              <div>
                <p className="font-mono text-sm font-medium tracking-wide text-text-primary mb-1.5">
                  {stage.name}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
