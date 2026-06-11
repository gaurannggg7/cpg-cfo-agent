export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-500 tracking-wide mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden="true" />
            Agentic AI · LangGraph · Groq
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.1] mb-5">
            AI CFO Analyst<br className="hidden sm:block" /> for CPG Brands
          </h1>
          <p className="text-zinc-500 text-lg leading-relaxed mb-8 max-w-md">
            Upload your transaction data and receive an executive financial brief — categorized spend, anomaly flags, and cash runway forecast in under 3 seconds.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#demo"
              className="inline-flex items-center px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
            >
              Try It Live
            </a>
            <a
              href="https://github.com/gaurannggg7/cpg-cfo-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-semibold rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        <div className="hidden lg:block">
          <PipelineDiagram />
        </div>
      </div>
    </section>
  );
}

function PipelineDiagram() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-6">
        Analysis Pipeline
      </p>

      <div className="flex items-stretch gap-3">
        {/* Node: CSV Upload */}
        <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
          <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-zinc-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-zinc-800">CSV Upload</p>
          <p className="text-[10px] text-zinc-400 mt-1">Transaction data</p>
        </div>

        {/* Arrow */}
        <div className="flex items-center flex-shrink-0">
          <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        {/* Node: 4 AI Agents */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-zinc-800 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4 15.298" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-white">4 AI Agents</p>
          <p className="text-[10px] text-zinc-400 mt-1">LangGraph</p>
        </div>

        {/* Arrow */}
        <div className="flex items-center flex-shrink-0">
          <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        {/* Node: CFO Brief */}
        <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
          <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-zinc-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-zinc-800">CFO Brief</p>
          <p className="text-[10px] text-zinc-400 mt-1">Executive summary</p>
        </div>
      </div>

      {/* Agent labels */}
      <div className="grid grid-cols-4 gap-1 pt-5 border-t border-zinc-100 mt-5">
        {['Categorize', 'Anomalies', 'Runway', 'Generate'].map((label) => (
          <p key={label} className="text-[10px] font-medium text-zinc-400 text-center">
            {label}
          </p>
        ))}
      </div>
    </div>
  );
}
