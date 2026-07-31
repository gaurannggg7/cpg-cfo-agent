'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import { runAnalysis, SessionExpiredError } from '@/lib/analyzeApi';
import Navbar from '@/components/Navbar';
import AuthBanner from '@/components/AuthBanner';
import UploadForm from '@/components/UploadForm';
import Dashboard, { type AnalysisResult } from '@/components/Dashboard';

export default function DemoPage() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { save } = useAnalysisSave();
  const prevUidRef = useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.uid ?? null;
    // Discard any displayed analysis when the signed-in identity changes
    // (e.g. guest upgrades to Google, or signs out) — fresh start, no
    // merging a guest's unsaved results into the new account.
    if (prevUidRef.current !== null && uid !== prevUidRef.current) {
      setResults(null);
    }
    prevUidRef.current = uid;
  }, [user?.uid]);

  const handleAnalyze = async (file: File, monthlyRevenue: number) => {
    setLoading(true);
    try {
      const data = await runAnalysis(file, monthlyRevenue);

      // Guests (anonymous) never persist results — Firestore rules reject
      // anonymous writes, so skipping the call keeps the demo working for them.
      if (user?.uid && !user.isAnonymous) {
        await save(data, user.uid, file.name);
      }

      setResults(data);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert(
        error instanceof SessionExpiredError
          ? error.message
          : 'Analysis failed. Is the backend running? Check console for details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      {!user && <AuthBanner />}

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7C3AED] mb-3">
              Interactive Demo
            </p>
            <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-[#E2E8F0] tracking-tight mb-3">
              Try It Yourself
            </h1>
            <p className="text-[#9CA3AF] text-sm">
              Upload a CSV with columns:{' '}
              <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-[#E2E8F0] text-xs">
                date, amount, description, category
              </code>
            </p>

            {/* Signed-in users get their saved history; guests just run the demo. */}
            {!authLoading && user && !user.isAnonymous && (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center text-sm bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 mt-6"
              >
                Go to Dashboard
              </Link>
            )}
          </div>

          {!results ? (
            <UploadForm onAnalyze={handleAnalyze} loading={loading} />
          ) : (
            <Dashboard data={results} onNewAnalysis={() => setResults(null)} />
          )}
        </div>
      </section>
    </div>
  );
}
