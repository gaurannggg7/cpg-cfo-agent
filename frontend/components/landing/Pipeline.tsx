'use client';

import { useEffect, useRef, useState } from 'react';

const STAGES = ['UPLOAD', 'INGEST', 'ANALYZE', 'DETECT', 'REASON', 'RECOMMEND'];
const STEP_DELAY_MS = 180;

function Arrow({ active }: { active: boolean }) {
  return (
    <span
      className={`text-sm transition-colors duration-300 ${
        active ? 'text-[var(--accent-flag)]' : 'text-[var(--border-strong)]'
      }`}
      aria-hidden="true"
    >
      &rarr;
    </span>
  );
}

export default function Pipeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeCount, setActiveCount] = useState(0);
  const triggeredRef = useRef(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setActiveCount(STAGES.length);
      return;
    }

    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || triggeredRef.current) return;
        triggeredRef.current = true;

        // This is the one place motion happens on the whole page — the
        // six pipeline stages are a genuinely ordered process, so stepping
        // through them on scroll-into-view earns the animation. Everything
        // else on the page is static.
        STAGES.forEach((_, i) => {
          setTimeout(() => setActiveCount(i + 1), i * STEP_DELAY_MS);
        });

        observer.disconnect();
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="font-[family-name:var(--font-heading)] font-semibold text-4xl sm:text-5xl text-[var(--text)] tracking-tight">
            Six stages, explicitly separated
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
          {STAGES.map((stage, i) => {
            const active = i < activeCount;
            return (
              <div key={stage} className="flex items-center gap-3">
                <span
                  className={`text-sm font-mono tracking-wider transition-colors duration-300 ${
                    active ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'
                  }`}
                >
                  {stage}
                </span>
                {i < STAGES.length - 1 && <Arrow active={i < activeCount - 1} />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
