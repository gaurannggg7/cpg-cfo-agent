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
              <p className="text-[11px] font-medium text-zinc-400 mt-1 uppercase tracking-wide">
                {tech.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
