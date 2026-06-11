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
