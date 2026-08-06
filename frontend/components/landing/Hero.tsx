'use client';

import Link from 'next/link';
import type { User } from 'firebase/auth';

interface Props {
  user: User | null;
}

export default function Hero({ user }: Props) {
  const isGoogleUser = !!user && !user.isAnonymous;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-28">
      <div className="max-w-4xl">
        <h1 className="font-heading font-semibold tracking-[-0.03em] text-5xl sm:text-6xl lg:text-7xl leading-[0.98] text-text-primary text-balance mb-8 motion-safe:animate-[fadeIn_0.6s_ease-out]">
          Know what&apos;s normal. Catch what&apos;s not.
        </h1>

        <p className="text-text-secondary text-lg leading-relaxed max-w-xl mb-10">
          Baseline analyzes transactional data, detects meaningful financial
          deviations, explains what changed, and recommends what to do about it.
        </p>

        <div className="flex flex-wrap items-center gap-6">
          {isGoogleUser ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-accent text-accent-foreground text-sm font-medium px-6 py-3 hover:bg-accent-hover transition-colors duration-200"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/demo"
                className="inline-flex items-center bg-accent text-accent-foreground text-sm font-medium px-6 py-3 hover:bg-accent-hover transition-colors duration-200"
              >
                Try Demo
              </Link>
              <a
                href="#architecture"
                className="group inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                View Architecture
                <span
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
