const CAPABILITIES = [
  {
    name: 'Agentic Orchestration',
    description:
      'LangGraph coordinates the analysis workflow across separate, extendable stages, with Groq providing LLM inference.',
  },
  {
    name: 'Multi-User Security',
    description:
      "Firebase Authentication plus Firestore Security Rules isolate each user's analyses at the data layer.",
  },
  {
    name: 'Persistent Analysis',
    description:
      'Authenticated users save and revisit past analyses; a guest mode lets evaluators try it with no account.',
  },
] as const;

export default function Capabilities() {
  return (
    <section className="py-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-heading)] font-semibold text-4xl sm:text-5xl text-[var(--text)] tracking-tight">
            What it does
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {CAPABILITIES.map(({ name, description }, i) => (
            <div
              key={name}
              className="bg-[var(--surface)] rounded-[2px] p-8 shadow-[var(--shadow-card)]"
            >
              <p className="text-sm font-mono text-[var(--text-dim)] mb-4">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--text)] mb-2">{name}</h3>
              <p className="text-sm text-[var(--text-dim)] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
