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
    if (!isSignedIn) router.replace('/');
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
      <div className="min-h-screen bg-zinc-50">
        <Navbar user={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Your History
            </p>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
              Dashboard
            </h1>
          </div>
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 flex-shrink-0"
          >
            Upload New File
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-800 mb-1">
              Couldn&apos;t load your analyses
            </p>
            <p className="text-xs text-red-700 break-words">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {analyses === null && !error && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-zinc-200 p-5 animate-pulse"
              >
                <div className="h-4 w-1/2 bg-zinc-200 rounded mb-3" />
                <div className="h-3 w-1/4 bg-zinc-100 rounded mb-4" />
                <div className="h-3 w-full bg-zinc-100 rounded mb-2" />
                <div className="h-3 w-5/6 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {analyses !== null && analyses.length === 0 && !error && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm px-6 py-16 text-center">
            <p className="text-zinc-900 font-semibold mb-1">No analyses yet</p>
            <p className="text-sm text-zinc-500 mb-6">
              Upload your first file to see it here.
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200"
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
