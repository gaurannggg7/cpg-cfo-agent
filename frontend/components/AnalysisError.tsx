'use client';

import { useEffect, useState } from 'react';
import { AnalysisApiError, ERROR_COPY } from '@/lib/analysisErrors';

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="font-mono text-xs bg-[var(--surface-2)] text-[var(--text)] px-2 py-1 rounded"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function useCountdown(seconds: number | undefined): number | undefined {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    if (!seconds) return;
    const id = setInterval(() => {
      setRemaining((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  return remaining;
}

interface Props {
  error: AnalysisApiError;
  onRetry: () => void;
}

export default function AnalysisError({ error, onRetry }: Props) {
  const copy = ERROR_COPY[error.code];
  const remaining = useCountdown(error.code === 'upstream_rate_limited' ? error.retryAfterSeconds : undefined);
  const retryDisabled = !!remaining && remaining > 0;

  const required = error.extra.required as string[] | undefined;
  const found = error.extra.found as string[] | undefined;
  const duplicateColumns = error.extra.duplicateColumns as string[] | undefined;
  const examples = error.extra.examples as string[] | undefined;

  return (
    <div className="max-w-xl mx-auto rounded-lg border border-[var(--accent-flag)]/30 bg-[var(--accent-flag)]/5 px-6 py-5">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-[var(--accent-flag)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--text)]">{copy.title}</p>
          <p className="text-sm text-[var(--text-dim)] mt-1">{copy.body(error)}</p>

          {required && found && (
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">Required</p>
                <Chips items={required} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">Found in your file</p>
                <Chips items={found} />
              </div>
            </div>
          )}

          {duplicateColumns && duplicateColumns.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">Duplicated</p>
              <Chips items={duplicateColumns} />
            </div>
          )}

          {examples && examples.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">Example values</p>
              <Chips items={examples} />
            </div>
          )}

          <button
            type="button"
            onClick={onRetry}
            disabled={retryDisabled}
            className="mt-4 inline-flex items-center justify-center text-sm border border-[var(--border-strong)] hover:border-[var(--text-dim)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text)] px-4 py-2 rounded-[2px] font-medium transition-colors duration-200"
          >
            {retryDisabled ? `Try again in ${remaining}s` : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  );
}
