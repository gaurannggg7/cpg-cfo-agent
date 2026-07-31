'use client';

import Link from 'next/link';
import type { User } from 'firebase/auth';

interface Props {
  user: User | null;
}

export default function Hero({ user }: Props) {
  const isGoogleUser = !!user && !user.isAnonymous;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED] mb-6">
        Autonomous Financial Intelligence
      </p>

      <h1 className="font-[family-name:var(--font-heading)] font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.15] mb-6 motion-safe:animate-[fadeIn_0.6s_ease-out]">
        <span className="text-[#E2E8F0]">Know what&apos;s normal.</span>
        <br />
        <span className="bg-gradient-to-r from-white to-[#06B6D4] bg-clip-text text-transparent">
          Catch what&apos;s not.
        </span>
      </h1>

      <p className="text-[#9CA3AF] text-lg leading-relaxed max-w-2xl mx-auto mb-10">
        Baseline analyzes transactional data, detects meaningful financial deviations,
        explains what changed, and recommends what to do about it.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {isGoogleUser ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold rounded-lg transition-colors duration-200"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/demo"
              className="inline-flex items-center px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold rounded-lg transition-colors duration-200"
            >
              Try Demo
            </Link>
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#7C3AED] text-[#E2E8F0] hover:bg-[#7C3AED]/10 text-sm font-semibold rounded-lg transition-colors duration-200"
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
