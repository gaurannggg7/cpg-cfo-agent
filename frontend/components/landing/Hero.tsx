'use client';

import Link from 'next/link';
import type { User } from 'firebase/auth';

interface Props {
  user: User | null;
}

export default function Hero({ user }: Props) {
  const isGoogleUser = !!user && !user.isAnonymous;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-32 text-center">
      <h1 className="font-[family-name:var(--font-heading)] font-semibold tracking-tight text-5xl sm:text-6xl lg:text-7xl leading-[1.1] mb-8 text-[var(--text)]">
        Know what&apos;s normal.
        <br />
        Catch what&apos;s <span className="text-[var(--accent-flag)]">not.</span>
      </h1>

      <p className="text-[var(--text-dim)] text-lg leading-relaxed max-w-2xl mx-auto mb-12">
        Baseline analyzes transactional data, detects meaningful financial deviations,
        explains what changed, and recommends what to do about it.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {isGoogleUser ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-[var(--text)] hover:bg-[var(--text)]/85 text-[var(--bg)] text-sm font-semibold rounded-[2px] transition-colors duration-200"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/demo"
              className="inline-flex items-center px-6 py-3 bg-[var(--text)] hover:bg-[var(--text)]/85 text-[var(--bg)] text-sm font-semibold rounded-[2px] transition-colors duration-200"
            >
              Try Demo
            </Link>
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--text)] text-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] text-sm font-semibold rounded-[2px] transition-colors duration-200"
            >
              View Architecture
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </>
        )}
      </div>
    </section>
  );
}
