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
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED] mb-3">
            Built On
          </p>
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-[#E2E8F0] tracking-tight">
            The Stack
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {STACK.map((name) => (
            <div
              key={name}
              className="bg-[#0F0F12]/75 border border-white/[0.08] rounded-xl px-6 py-5 text-center min-w-[110px] transition-all duration-200 hover:border-[#7C3AED] hover:-translate-y-0.5"
            >
              <p className="text-sm font-bold text-[#E2E8F0]">{name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
