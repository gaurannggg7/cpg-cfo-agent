'use client';

import { useState, useEffect } from 'react';
import { signInAnon } from '@/lib/firebase';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import UploadForm from '@/components/UploadForm';
import Dashboard, { type AnalysisResult } from '@/components/Dashboard';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import HowItWorks from '@/components/landing/HowItWorks';
import BuiltWith from '@/components/landing/BuiltWith';
import Footer from '@/components/landing/Footer';
import type { User } from 'firebase/auth';

export default function Home() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { save } = useAnalysisSave();

  useEffect(() => {
    signInAnon().then((cred) => setUser(cred.user)).catch(console.error);
  }, []);

  const handleAnalyze = async (file: File, monthlyRevenue: number) => {
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('monthly_revenue', monthlyRevenue.toString());

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();

      if (user?.uid) {
        await save(data, user.uid);
      }

      setResults(data as AnalysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Is the backend running? Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Sticky nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <span className="text-zinc-900 font-semibold text-sm tracking-tight">CPG CFO Agent</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <a
              href="#demo"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 font-medium"
            >
              Demo
            </a>
            <a
              href="https://github.com/gaurannggg7/cpg-cfo-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-1.5 rounded-lg font-medium transition-colors duration-200"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

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
