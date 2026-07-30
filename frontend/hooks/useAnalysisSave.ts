import { useState } from 'react';
import { saveAnalysis } from '@/lib/firebase';
import type { AnalysisResult } from '@/components/Dashboard';

export function useAnalysisSave() {
  const [saving, setSaving] = useState(false);

  const save = async (
    data: AnalysisResult,
    userId: string,
    fileName?: string
  ) => {
    setSaving(true);
    try {
      return await saveAnalysis(data, userId, fileName);
    } finally {
      setSaving(false);
    }
  };

  return { save, saving };
}
