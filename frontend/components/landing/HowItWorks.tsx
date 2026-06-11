import { type ReactNode } from 'react';

interface Agent {
  name: string;
  description: string;
  icon: ReactNode;
}

const AGENTS: Agent[] = [
  {
    name: 'Categorize',
    description: 'Groups every transaction by spending type and category',
    icon: (
      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    name: 'Detect Anomalies',
    description: 'Flags unusual spending patterns and assigns a risk level',
    icon: (
      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    name: 'Forecast Runway',
    description: 'Calculates months of cash runway from current burn rate',
    icon: (
      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    name: 'Generate Brief',
    description: 'Writes the executive CFO summary in plain English',
    icon: (
      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Under the hood
          </p>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AGENTS.map((agent, i) => (
            <div key={agent.name} className="relative">
              {i < AGENTS.length - 1 && (
                <div
                  className="hidden lg:block absolute top-8 left-[calc(100%-8px)] w-4 h-px bg-zinc-200 z-10"
                  aria-hidden="true"
                />
              )}
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    {agent.icon}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-900 mb-2">{agent.name}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{agent.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
