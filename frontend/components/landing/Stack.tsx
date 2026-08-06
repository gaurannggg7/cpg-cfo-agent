const STACK = [
  'Next.js',
  'TypeScript',
  'FastAPI',
  'LangGraph',
  'Groq',
  'Firebase',
  'Docker',
] as const;

export default function Stack() {
  return (
    <section className="border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-baseline justify-between mb-12 flex-wrap gap-2">
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl tracking-[-0.02em] text-text-primary">
            The stack
          </h2>
          <span className="font-mono text-xs text-text-muted">built on</span>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {STACK.map((name) => (
            <span
              key={name}
              className="font-mono text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
