import { useState } from 'react';
import { saveAnalysis } from '@/lib/firebase';

export function useAnalysisSave() {
  const [saving, setSaving] = useState(false);

  const save = async (data: Record<string, unknown>, userId: string) => {
    setSaving(true);
    try {
      return await saveAnalysis(data, userId);
    } finally {
      setSaving(false);
    }
  };

  return { save, saving };
}
