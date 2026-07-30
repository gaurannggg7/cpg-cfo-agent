'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import { runAnalysis } from '@/lib/analyzeApi';
import Navbar from '@/components/Navbar';
import UploadForm from '@/components/UploadForm';

export default function AnalyzePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { save } = useAnalysisSave();

  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignedIn = !!user && !user.isAnonymous;

  // Protected route: guests and signed-out visitors go back to the landing page.
  useEffect(() => {
    if (authLoading) return;
    if (!isSignedIn) router.replace('/');
  }, [authLoading, isSignedIn, router]);

  const handleAnalyze = async (file: File, monthlyRevenue: number) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await runAnalysis(file, monthlyRevenue);
      const id = await save(data, user.uid, file.name);
      setSavedId(id ?? null);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Is the backend running? Check console for details.');
    } finally {
      setLoading(false);
    }
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
            New Analysis
          </p>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-3">
            Upload Transaction Data
          </h1>
          <p className="text-zinc-500 text-sm">
            Results are saved to{' '}
            <Link href="/dashboard" className="underline hover:text-zinc-900">
              your dashboard
            </Link>
            .
          </p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {savedId ? (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
            <div>
              <p className="text-emerald-600 font-semibold text-lg">Analysis saved</p>
              <p className="text-sm text-slate-500 mt-1">
                It&apos;s now in your dashboard history.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/dashboard/${savedId}`}
                className="inline-flex items-center justify-center text-sm bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200"
              >
                View in Dashboard
              </Link>
              <button
                type="button"
                onClick={() => setSavedId(null)}
                className="inline-flex items-center justify-center text-sm border border-slate-300 hover:border-slate-400 text-slate-900 px-4 py-2.5 rounded-lg font-medium transition-colors duration-200"
              >
                Analyze Another File
              </button>
            </div>
          </div>
        ) : (
          <UploadForm onAnalyze={handleAnalyze} loading={loading} />
        )}
      </main>
    </div>
  );
}
