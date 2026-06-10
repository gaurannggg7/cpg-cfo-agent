'use client';

import { useState, useEffect } from 'react';
import { signInAnon } from '@/lib/firebase';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import UploadForm from '@/components/UploadForm';
import Dashboard, { type AnalysisResult } from '@/components/Dashboard';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">CPG CFO Agent</h1>
          <p className="text-gray-300 text-lg">
            Agentic AI for financial decisions &mdash; Next.js + FastAPI + LangGraph + Groq + Firebase
          </p>
        </header>

        {!results ? (
          <UploadForm onAnalyze={handleAnalyze} loading={loading} />
        ) : (
          <Dashboard data={results} onNewAnalysis={() => setResults(null)} />
        )}
      </div>
    </div>
  );
}
