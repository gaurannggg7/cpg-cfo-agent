'use client';

import { useState } from 'react';

interface Props {
  onAnalyze: (file: File, revenue: number) => void;
  loading: boolean;
}

const MAX_MONTHLY_REVENUE = 100_000_000;

export default function UploadForm({ onAnalyze, loading }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [revenue, setRevenue] = useState(100000);
  const [loadingSample, setLoadingSample] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) onAnalyze(file, revenue);
  };

  const handleRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Digits only — also strips any leading zeros as they're typed
    // (e.g. "034847740" -> 34847740), then caps at a sane maximum.
    const digitsOnly = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    const parsed = digitsOnly === '' ? 0 : Number(digitsOnly);
    setRevenue(Math.min(parsed, MAX_MONTHLY_REVENUE));
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
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-8 space-y-6">

        <div>
          <label className="block text-sm font-semibold text-[var(--text)] mb-2">
            Transaction File
          </label>
          <div
            className={`relative rounded border-2 border-dashed transition-colors duration-200 ${
              file
                ? 'border-[var(--accent-base)]/50 bg-[var(--accent-base)]/5'
                : 'border-[var(--border-strong)] hover:border-[var(--text-dim)]'
            }`}
          >
            <div className="p-8 text-center pointer-events-none select-none">
              {file ? (
                <>
                  <svg className="mx-auto mb-2 w-7 h-7 text-[var(--accent-base)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-[var(--accent-base)] break-all">{file.name}</p>
                  <p className="text-xs text-[var(--accent-base)]/80 mt-0.5">Ready to analyze</p>
                </>
              ) : (
                <>
                  <svg className="mx-auto mb-2 w-7 h-7 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm font-medium text-[var(--text)]">Click to select a CSV file</p>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5">Columns: date, amount, description, category</p>
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
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <button
            type="button"
            onClick={handleUseSampleData}
            disabled={loadingSample}
            className="w-full py-3 px-4 rounded border border-[var(--accent-flag)]/50 bg-[var(--accent-flag)]/10 hover:bg-[var(--accent-flag)]/15 hover:border-[var(--accent-flag)] text-[var(--text)] text-sm font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loadingSample ? 'Loading sample…' : 'Try Sample Data'}
          </button>
          <p className="text-xs text-[var(--text-dim)] text-center mt-2">
            3 months of sample transactions, includes a flagged anomaly.
          </p>
        </div>

        <div>
          <label htmlFor="monthly-revenue" className="block text-sm font-semibold text-[var(--text)] mb-2">
            Monthly Revenue
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-sm font-medium select-none" aria-hidden="true">$</span>
            <input
              id="monthly-revenue"
              type="text"
              inputMode="numeric"
              value={revenue.toLocaleString('en-US')}
              onChange={handleRevenueChange}
              className="w-full pl-8 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-flag)] focus:border-transparent transition-shadow duration-200"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || loading}
          className={`w-full py-3.5 px-6 rounded font-semibold text-sm tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] focus-visible:ring-[var(--accent-flag)] ${
            loading || !file
              ? 'bg-[var(--surface-2)] text-[var(--text-dim)] cursor-not-allowed'
              : 'bg-[var(--accent-flag)] hover:bg-[var(--accent-flag-hover)] text-[var(--bg)] cursor-pointer'
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
