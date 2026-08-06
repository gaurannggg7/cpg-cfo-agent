'use client';

import Link from 'next/link';
import type { StoredAnalysis } from '@/lib/firebase';

interface Props {
  analysis: StoredAnalysis;
}

export function formatAnalysisDate(createdAt: StoredAnalysis['createdAt']) {
  // serverTimestamp() resolves server-side, so a freshly written doc can
  // briefly read back as null on the local snapshot.
  if (!createdAt) return 'Just now';
  return createdAt.toDate().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AnalysisCard({ analysis }: Props) {
  const anomalyCount = analysis.anomalies?.anomalies?.length ?? 0;
  const riskLevel = analysis.anomalies?.risk_level?.toLowerCase();

  const riskBadgeClass =
    riskLevel === 'high'
      ? 'bg-[var(--accent-flag)]/15 text-[var(--accent-flag)] border-[var(--accent-flag)]/40'
      : riskLevel === 'medium'
      ? 'bg-[var(--accent-flag)]/8 text-[var(--accent-flag)]/80 border-[var(--accent-flag)]/20'
      : 'bg-[var(--accent-base)]/10 text-[var(--accent-base)] border-[var(--accent-base)]/25';

  return (
    <Link
      href={`/dashboard/${analysis.id}`}
      className="block bg-[var(--surface)] rounded border border-[var(--border)] p-5 hover:border-[var(--accent-flag)]/40 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] focus-visible:ring-[var(--accent-flag)]"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text)] truncate">
            {analysis.fileName || 'untitled.csv'}
          </p>
          <p className="text-xs text-[var(--text-dim)] mt-0.5">
            {formatAnalysisDate(analysis.createdAt)}
          </p>
        </div>
        {anomalyCount > 0 && (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border flex-shrink-0 ${riskBadgeClass}`}
          >
            {anomalyCount} {anomalyCount === 1 ? 'anomaly' : 'anomalies'}
          </span>
        )}
      </div>

      <p className="text-sm text-[var(--text-dim)] leading-relaxed line-clamp-3">
        {analysis.summary}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-[var(--text-dim)]">
          {analysis.metrics?.total_transactions ?? 0} transactions
        </span>
        <span className="text-[var(--accent-base)] font-medium">View Details →</span>
      </div>
    </Link>
  );
}
