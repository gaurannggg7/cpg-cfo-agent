import { Zap, Lock, Settings } from 'lucide-react';

const CAPABILITIES = [
  {
    name: 'Agentic Orchestration',
    description:
      'LangGraph coordinates the analysis workflow across separate, extendable stages, with Groq providing LLM inference.',
    icon: Zap,
  },
  {
    name: 'Multi-User Security',
    description:
      "Firebase Authentication plus Firestore Security Rules isolate each user's analyses at the data layer.",
    icon: Lock,
  },
  {
    name: 'Persistent Analysis',
    description:
      'Authenticated users save and revisit past analyses; a guest mode lets evaluators try it with no account.',
    icon: Settings,
  },
] as const;

export default function Capabilities() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED] mb-3">
            Capabilities
          </p>
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-[#E2E8F0] tracking-tight">
            What it does
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {CAPABILITIES.map(({ name, description, icon: Icon }) => (
            <div
              key={name}
              className="bg-[#0F0F12]/75 border border-white/[0.08] rounded-xl p-6 transition-all duration-200 hover:scale-[1.03] hover:border-[#7C3AED] hover:shadow-[0_0_24px_rgba(124,58,237,0.25)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#7C3AED]" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-[#E2E8F0] mb-2">{name}</h3>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
