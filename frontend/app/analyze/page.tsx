'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import { runAnalysis } from '@/lib/analyzeApi';
import { AnalysisApiError } from '@/lib/analysisErrors';
import Navbar from '@/components/Navbar';
import UploadForm from '@/components/UploadForm';
import AnalysisProgress, { useElapsedMs } from '@/components/AnalysisProgress';
import ResultsSkeleton from '@/components/ResultsSkeleton';
import AnalysisError from '@/components/AnalysisError';

export default function AnalyzePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { save } = useAnalysisSave();

  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<AnalysisApiError | null>(null);
  const elapsedMs = useElapsedMs(loading);

  const isSignedIn = !!user && !user.isAnonymous;

  // Protected route: guests and signed-out visitors get sent to /login.
  useEffect(() => {
    if (authLoading) return;
    if (!isSignedIn) router.replace('/login');
  }, [authLoading, isSignedIn, router]);

  const handleAnalyze = async (file: File, monthlyRevenue: number, cashOnHand?: number) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await runAnalysis(file, monthlyRevenue, cashOnHand);
      const id = await save(data, user.uid, file.name);
      setSavedId(id ?? null);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(
        err instanceof AnalysisApiError
          ? err
          : new AnalysisApiError(0, 'network', 'The request failed.')
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isSignedIn) {
    return (
      <div className="min-h-screen">
        <Navbar user={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-dim)] mb-3">
            New Analysis
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--text)] tracking-tight mb-3">
            Upload Transaction Data
          </h1>
          <p className="text-[var(--text-dim)] text-sm">
            Results are saved to{' '}
            <Link href="/dashboard" className="underline hover:text-[var(--text)]">
              your dashboard
            </Link>
            .
          </p>
        </div>

        {error && !loading && (
          <div className="mb-6">
            <AnalysisError error={error} onRetry={() => setError(null)} />
          </div>
        )}

        {loading ? (
          <div className="space-y-8">
            <AnalysisProgress elapsedMs={elapsedMs} />
            <ResultsSkeleton />
          </div>
        ) : savedId ? (
          <div className="max-w-xl mx-auto bg-[var(--surface)] rounded-lg border border-[var(--border)] p-8 text-center space-y-5">
            <div>
              <p className="text-[var(--accent-base)] font-semibold text-lg">Analysis saved</p>
              <p className="text-sm text-[var(--text-dim)] mt-1">
                It&apos;s now in your dashboard history.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/dashboard/${savedId}`}
                className="inline-flex items-center justify-center text-sm bg-[var(--accent-flag)] hover:bg-[var(--accent-flag-hover)] text-[var(--bg)] px-4 py-2.5 rounded font-medium transition-colors duration-200"
              >
                View in Dashboard
              </Link>
              <button
                type="button"
                onClick={() => setSavedId(null)}
                className="inline-flex items-center justify-center text-sm border border-[var(--border-strong)] hover:border-[var(--text-dim)] text-[var(--text)] px-4 py-2.5 rounded font-medium transition-colors duration-200"
              >
                Analyze Another File
              </button>
            </div>
          </div>
        ) : (
          <UploadForm onAnalyze={handleAnalyze} />
        )}
      </main>
    </div>
  );
}
