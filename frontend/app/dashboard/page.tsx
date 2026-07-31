'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getUserAnalyses, type StoredAnalysis } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import AnalysisCard from '@/components/AnalysisCard';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<StoredAnalysis[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignedIn = !!user && !user.isAnonymous;

  // Protected route: guests and signed-out visitors go back to the landing page.
  useEffect(() => {
    if (authLoading) return;
    if (!isSignedIn) router.replace('/login');
  }, [authLoading, isSignedIn, router]);

  useEffect(() => {
    if (authLoading || !isSignedIn || !user) return;

    let cancelled = false;
    setError(null);

    getUserAnalyses(user.uid)
      .then((rows) => {
        if (!cancelled) setAnalyses(rows);
      })
      .catch((err) => {
        console.error('Failed to load analyses:', err);
        if (!cancelled) {
          setAnalyses([]);
          setError(
            err instanceof Error ? err.message : 'Could not load your analyses.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isSignedIn, user]);

  // While auth resolves (or during the redirect) render just the shell.
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
              Your History
            </p>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[#E2E8F0] tracking-tight">
              Dashboard
            </h1>
          </div>
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center text-sm bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 flex-shrink-0"
          >
            Upload New File
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <p className="text-sm font-semibold text-red-400 mb-1">
              Couldn&apos;t load your analyses
            </p>
            <p className="text-xs text-red-400/80 break-words">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {analyses === null && !error && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#0F0F12] rounded-xl border border-white/[0.08] p-5 animate-pulse"
              >
                <div className="h-4 w-1/2 bg-white/[0.08] rounded mb-3" />
                <div className="h-3 w-1/4 bg-white/[0.05] rounded mb-4" />
                <div className="h-3 w-full bg-white/[0.05] rounded mb-2" />
                <div className="h-3 w-5/6 bg-white/[0.05] rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {analyses !== null && analyses.length === 0 && !error && (
          <div className="bg-[#0F0F12] rounded-xl border border-white/[0.08] px-6 py-16 text-center">
            <p className="text-[#E2E8F0] font-semibold mb-1">No analyses yet</p>
            <p className="text-sm text-[#9CA3AF] mb-6">
              Upload your first file to see it here.
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center text-sm bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200"
            >
              Upload New File
            </Link>
          </div>
        )}

        {/* Results */}
        {analyses !== null && analyses.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {analyses.map((analysis) => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
