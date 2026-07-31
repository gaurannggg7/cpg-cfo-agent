'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import { runAnalysis, SessionExpiredError } from '@/lib/analyzeApi';
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
    if (!isSignedIn) router.replace('/login');
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
      setError(
        err instanceof SessionExpiredError
          ? err.message
          : 'Analysis failed. Is the backend running? Check console for details.'
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
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">
            New Analysis
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[#E2E8F0] tracking-tight mb-3">
            Upload Transaction Data
          </h1>
          <p className="text-[#9CA3AF] text-sm">
            Results are saved to{' '}
            <Link href="/dashboard" className="underline hover:text-[#E2E8F0]">
              your dashboard
            </Link>
            .
          </p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {savedId ? (
          <div className="max-w-xl mx-auto bg-[#0F0F12] rounded-2xl border border-white/[0.08] p-8 text-center space-y-5">
            <div>
              <p className="text-emerald-400 font-semibold text-lg">Analysis saved</p>
              <p className="text-sm text-[#9CA3AF] mt-1">
                It&apos;s now in your dashboard history.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/dashboard/${savedId}`}
                className="inline-flex items-center justify-center text-sm bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200"
              >
                View in Dashboard
              </Link>
              <button
                type="button"
                onClick={() => setSavedId(null)}
                className="inline-flex items-center justify-center text-sm border border-white/[0.12] hover:border-white/25 text-[#E2E8F0] px-4 py-2.5 rounded-lg font-medium transition-colors duration-200"
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
