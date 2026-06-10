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
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Transaction CSV
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Required columns: date, amount, description, category</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Revenue ($)
          </label>
          <input
            type="number"
            value={revenue}
            min={0}
            onChange={(e) => setRevenue(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={!file || loading}
          className={`w-full py-3 px-6 rounded-lg font-bold text-white transition ${
            loading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? 'Analyzing...' : 'Run CFO Analysis'}
        </button>
      </div>
    </form>
  );
}
