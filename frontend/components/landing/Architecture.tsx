const DECISIONS = [
  {
    title: 'Why LangGraph',
    body:
      "Analysis isn't one LLM call. Explicit orchestration lets stages be separated, inspected, and extended.",
  },
  {
    title: 'Why Firestore',
    body:
      'Lightweight per-user persistence without standing up a relational DB and migration layer.',
  },
];

function Screenshot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <div>
      <div className="bg-[var(--surface)] rounded-[2px] p-3 shadow-[var(--shadow-card)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full aspect-video object-cover object-top rounded-[2px]"
        />
      </div>
      <p className="text-xs text-[var(--text-dim)] mt-3 text-center">{caption}</p>
    </div>
  );
}

export default function Architecture() {
  return (
    <section id="architecture" className="py-40 scroll-mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="font-[family-name:var(--font-heading)] font-semibold text-4xl sm:text-5xl text-[var(--text)] tracking-tight mb-14">
          Architecture
        </h2>

        <div className="grid sm:grid-cols-2 gap-6 mb-14">
          <Screenshot
            src="/screenshots/grafana-dashboard.png"
            alt="Grafana dashboard showing request rate, latency, and per-agent execution time"
            caption="Request rate, latency, and per-agent execution time — live Grafana dashboard."
          />

          <Screenshot
            src="/screenshots/grafana-success-rate.png"
            alt="Grafana gauge showing 100 percent pipeline success rate"
            caption="Pipeline success rate, tracked across every run."
          />

          <Screenshot
            src="/screenshots/langsmith-trace.png"
            alt="LangSmith execution trace of the LangGraph pipeline"
            caption="Live LangGraph execution trace — categorize, detect_anomalies, runway_calc, summarize."
          />

          <Screenshot
            src="/screenshots/docker-containers.png"
            alt="Docker Desktop showing running containers for the stack"
            caption="Services running locally: gateway, backend, frontend, Kafka, Zookeeper."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {DECISIONS.map((d) => (
            <div key={d.title}>
              <p className="text-sm font-semibold text-[var(--text)] mb-2">
                {d.title}
              </p>
              <p className="text-sm text-[var(--text-dim)] leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
