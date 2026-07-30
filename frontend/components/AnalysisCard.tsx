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
      ? 'bg-red-50 text-red-700 border-red-200'
      : riskLevel === 'medium'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-zinc-100 text-zinc-600 border-zinc-200';

  return (
    <Link
      href={`/dashboard/${analysis.id}`}
      className="block bg-white rounded-xl border border-zinc-200 shadow-sm p-5 hover:shadow-md hover:border-zinc-300 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">
            {analysis.fileName || 'untitled.csv'}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {formatAnalysisDate(analysis.createdAt)}
          </p>
        </div>
        {anomalyCount > 0 && (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border flex-shrink-0 ${riskBadgeClass}`}
          >
            {anomalyCount} {anomalyCount === 1 ? 'anomaly' : 'anomalies'}
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3">
        {analysis.summary}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-zinc-400">
          {analysis.metrics?.total_transactions ?? 0} transactions
        </span>
        <span className="text-zinc-900 font-medium">View Details →</span>
      </div>
    </Link>
  );
}
