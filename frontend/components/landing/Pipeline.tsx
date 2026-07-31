const STAGES = ['UPLOAD', 'INGEST', 'ANALYZE', 'DETECT', 'REASON', 'RECOMMEND'];

function Arrow({ vertical }: { vertical: boolean }) {
  return (
    <svg
      className={`text-[#7C3AED] flex-shrink-0 ${vertical ? 'w-4 h-4 rotate-90 sm:rotate-0' : 'w-4 h-4'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

export default function Pipeline() {
  return (
    <section className="py-24 border-t border-white/[0.08]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED] mb-3">
            How It Works
          </p>
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-[#E2E8F0] tracking-tight">
            Six stages, explicitly separated
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex flex-col sm:flex-row items-center gap-3">
              <span className="px-4 py-2 rounded-full border border-white/[0.08] bg-[#0F0F12] text-[#E2E8F0] text-xs font-mono tracking-wider">
                {stage}
              </span>
              {i < STAGES.length - 1 && <Arrow vertical />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
