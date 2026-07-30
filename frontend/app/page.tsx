'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import { runAnalysis } from '@/lib/analyzeApi';
import Navbar from '@/components/Navbar';
import AuthBanner from '@/components/AuthBanner';
import UploadForm from '@/components/UploadForm';
import Dashboard, { type AnalysisResult } from '@/components/Dashboard';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import HowItWorks from '@/components/landing/HowItWorks';
import BuiltWith from '@/components/landing/BuiltWith';
import Footer from '@/components/landing/Footer';

export default function Home() {
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
      alert('Analysis failed. Is the backend running? Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar user={user} />
      {!user && <AuthBanner />}

      {/* Marketing sections */}
      <Hero />
      <Stats />
      <HowItWorks />

      {/* Live demo — real working tool */}
      <section id="demo" className="py-20 bg-white border-y border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Interactive Demo
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-3">
              Try It Yourself
            </h2>
            <p className="text-zinc-500 text-sm">
              Upload a CSV with columns:{' '}
              <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 text-xs">
                date, amount, description, category
              </code>
            </p>

            {/* Signed-in users get their saved history; guests just run the demo. */}
            {!authLoading && user && !user.isAnonymous && (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 mt-6"
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

      <BuiltWith />
      <Footer />
    </div>
  );
}
