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
    <section className="border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-baseline justify-between mb-14 flex-wrap gap-2">
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl tracking-[-0.02em] text-text-primary">
            What it does
          </h2>
          <span className="font-mono text-xs text-text-muted">03 capabilities</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-l border-border">
          {CAPABILITIES.map(({ name, description, icon: Icon }) => (
            <div
              key={name}
              className="border-b border-r border-border p-8 hover:bg-surface transition-colors duration-200"
            >
              <Icon className="w-5 h-5 text-accent mb-6" aria-hidden="true" />
              <h3 className="text-base font-semibold text-text-primary mb-2 tracking-tight">
                {name}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
