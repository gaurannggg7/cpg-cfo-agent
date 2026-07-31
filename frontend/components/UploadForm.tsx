'use client';

import { useState } from 'react';

interface Props {
  onAnalyze: (file: File, revenue: number) => void;
  loading: boolean;
}

export default function UploadForm({ onAnalyze, loading }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [revenue, setRevenue] = useState(100000);
  const [loadingSample, setLoadingSample] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) onAnalyze(file, revenue);
  };

  const handleUseSampleData = async () => {
    setLoadingSample(true);
    try {
      const res = await fetch('/sample-data/sample-transactions.csv');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'sample-transactions.csv', { type: 'text/csv' });
      setFile(sampleFile);
      setRevenue((prev) => (prev ? prev : 100000));
    } catch (error) {
      console.error('Failed to load sample data:', error);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
      <div className="bg-[#0F0F12] rounded-2xl border border-white/[0.08] shadow-sm p-8 space-y-6">

        {/* File upload */}
        <div>
          <label className="block text-sm font-semibold text-[#E2E8F0] mb-2">
            Transaction File
          </label>
          <div
            className={`relative rounded-xl border-2 border-dashed transition-colors duration-200 ${
              file
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-white/[0.12] hover:border-white/25'
            }`}
          >
            <div className="p-8 text-center pointer-events-none select-none">
              {file ? (
                <>
                  <svg className="mx-auto mb-2 w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-emerald-400 break-all">{file.name}</p>
                  <p className="text-xs text-emerald-500/80 mt-0.5">Ready to analyze</p>
                </>
              ) : (
                <>
                  <svg className="mx-auto mb-2 w-7 h-7 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm font-medium text-[#E2E8F0]">Click to select a CSV file</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Columns: date, amount, description, category</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload transaction CSV"
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleUseSampleData}
              disabled={loadingSample}
              className="text-sm font-medium text-[#9CA3AF] hover:text-[#E2E8F0] underline decoration-white/20 underline-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loadingSample ? 'Loading sample…' : 'Use sample data'}
            </button>
          </div>
          <p className="text-xs text-[#9CA3AF]/70 mt-0.5">
            3 months of sample transactions, includes a flagged anomaly.
          </p>
        </div>

        {/* Revenue input */}
        <div>
          <label htmlFor="monthly-revenue" className="block text-sm font-semibold text-[#E2E8F0] mb-2">
            Monthly Revenue
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm font-medium select-none" aria-hidden="true">$</span>
            <input
              id="monthly-revenue"
              type="number"
              value={revenue}
              min={0}
              onChange={(e) => setRevenue(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 bg-white/[0.03] border border-white/[0.12] rounded-xl text-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-shadow duration-200"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || loading}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F12] focus-visible:ring-[#7C3AED] ${
            loading || !file
              ? 'bg-white/[0.06] text-[#9CA3AF]/60 cursor-not-allowed'
              : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white cursor-pointer'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="motion-safe:animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing…
            </span>
          ) : (
            'Run CFO Analysis'
          )}
        </button>
      </div>
    </form>
  );
}
