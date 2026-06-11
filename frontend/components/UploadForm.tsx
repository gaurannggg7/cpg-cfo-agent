'use client';

import { useState } from 'react';

interface Props {
  onAnalyze: (file: File, revenue: number) => void;
  loading: boolean;
}

export default function UploadForm({ onAnalyze, loading }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [revenue, setRevenue] = useState(100000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) onAnalyze(file, revenue);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">

        {/* File upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Transaction File
          </label>
          <div
            className={`relative rounded-xl border-2 border-dashed transition-colors duration-200 ${
              file
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <div className="p-8 text-center pointer-events-none select-none">
              {file ? (
                <>
                  <svg className="mx-auto mb-2 w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-emerald-700 break-all">{file.name}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Ready to analyze</p>
                </>
              ) : (
                <>
                  <svg className="mx-auto mb-2 w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm font-medium text-slate-600">Click to select a CSV file</p>
                  <p className="text-xs text-slate-400 mt-0.5">Columns: date, amount, description, category</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload transaction CSV"
              required
            />
          </div>
        </div>

        {/* Revenue input */}
        <div>
          <label htmlFor="monthly-revenue" className="block text-sm font-semibold text-slate-700 mb-2">
            Monthly Revenue
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none" aria-hidden="true">$</span>
            <input
              id="monthly-revenue"
              type="number"
              value={revenue}
              min={0}
              onChange={(e) => setRevenue(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow duration-200"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || loading}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900 ${
            loading || !file
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
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
