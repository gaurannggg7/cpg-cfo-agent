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

      <section className="py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="font-[family-name:var(--font-heading)] font-semibold text-4xl sm:text-5xl text-[var(--text)] tracking-tight mb-4">
              Try It Yourself
            </h1>
            <p className="text-[var(--text-dim)] text-sm">
              Upload a CSV with columns:{' '}
              <code className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-[var(--text)] text-xs">
                date, amount, description, category
              </code>
            </p>

            {/* Signed-in users get their saved history; guests just run the demo. */}
            {!authLoading && user && !user.isAnonymous && (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center text-sm bg-[var(--text)] hover:bg-[var(--text)]/85 text-[var(--bg)] px-4 py-2.5 rounded-[2px] font-medium transition-colors duration-200 mt-6"
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
