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
      ? 'bg-red-500/10 text-red-400 border-red-500/30'
      : riskLevel === 'medium'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/20';

  return (
    <Link
      href={`/dashboard/${analysis.id}`}
      className="block bg-[#0F0F12] rounded-xl border border-white/[0.08] p-5 hover:border-[#7C3AED]/40 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] focus-visible:ring-[#7C3AED]"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#E2E8F0] truncate">
            {analysis.fileName || 'untitled.csv'}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
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

      <p className="text-sm text-[#9CA3AF] leading-relaxed line-clamp-3">
        {analysis.summary}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-[#9CA3AF]">
          {analysis.metrics?.total_transactions ?? 0} transactions
        </span>
        <span className="text-[#06B6D4] font-medium">View Details →</span>
      </div>
    </Link>
  );
}
