'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getAnalysisById, type StoredAnalysis } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import Dashboard from '@/components/Dashboard';
import { formatAnalysisDate } from '@/components/AnalysisCard';

function toCsv(analysis: StoredAnalysis): string {
  const esc = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const rows: string[][] = [
    ['Field', 'Value'],
    ['File Name', analysis.fileName],
    ['Date', formatAnalysisDate(analysis.createdAt)],
    ['Summary', analysis.summary],
    ['Total Transactions', String(analysis.metrics?.total_transactions ?? '')],
    ['Total Spend', String(analysis.metrics?.total_spend ?? '')],
    ['Avg Transaction', String(analysis.metrics?.avg_transaction ?? '')],
    ['Runway (months)', String(analysis.runway?.runway_months ?? '')],
    ['Risk Level', analysis.anomalies?.risk_level ?? ''],
  ];

  (analysis.anomalies?.anomalies ?? []).forEach((item, i) =>
    rows.push([`Anomaly ${i + 1}`, item])
  );
  (analysis.runway?.recommendations ?? []).forEach((item, i) =>
    rows.push([`Recommendation ${i + 1}`, item])
  );

  return rows.map((row) => row.map(esc).join(',')).join('\n');
}

export default function AnalysisDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'denied'>('loading');

  const isSignedIn = !!user && !user.isAnonymous;

  useEffect(() => {
    if (authLoading) return;
    if (!isSignedIn) router.replace('/');
  }, [authLoading, isSignedIn, router]);

  useEffect(() => {
    if (authLoading || !isSignedIn || !user || !id) return;

    let cancelled = false;
    setState('loading');

    getAnalysisById(id)
      .then((doc) => {
        if (cancelled) return;
        // Defense in depth: Firestore rules already reject other users' docs,
        // but never render one that slipped through.
        if (!doc || doc.userId !== user.uid) {
          setState('denied');
          return;
        }
        setAnalysis(doc);
        setState('ready');
      })
      .catch((err) => {
        console.error('Failed to load analysis:', err);
        if (!cancelled) setState('denied');
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isSignedIn, user, id]);

  const handleDownloadCsv = () => {
    if (!analysis) return;
    const blob = new Blob([toCsv(analysis)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysis.fileName.replace(/\.csv$/i, '')}-analysis.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (authLoading || !isSignedIn) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar user={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 mb-6"
        >
          ← Back to Dashboard
        </Link>

        {state === 'loading' && (
          <div className="space-y-4">
            <div className="h-8 w-1/3 bg-zinc-200 rounded animate-pulse" />
            <div className="h-40 bg-white border border-zinc-200 rounded-xl animate-pulse" />
            <div className="h-24 bg-white border border-zinc-200 rounded-xl animate-pulse" />
          </div>
        )}

        {state === 'denied' && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm px-6 py-16 text-center">
            <p className="text-zinc-900 font-semibold mb-1">Analysis not available</p>
            <p className="text-sm text-zinc-500 mb-6">
              It doesn&apos;t exist, or it belongs to another account.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200"
            >
              Back to Dashboard
            </Link>
          </div>
        )}

        {state === 'ready' && analysis && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  {formatAnalysisDate(analysis.createdAt)}
                </p>
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight break-all">
                  {analysis.fileName}
                </h1>
              </div>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center justify-center text-sm border border-zinc-300 hover:border-zinc-400 bg-white text-zinc-900 px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 flex-shrink-0"
              >
                Download CSV
              </button>
            </div>

            <Dashboard
              data={analysis}
              onNewAnalysis={() => router.push('/analyze')}
            />
          </>
        )}
      </main>
    </div>
  );
}
