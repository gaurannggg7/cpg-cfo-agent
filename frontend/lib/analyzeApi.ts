import type { AnalysisResult } from '@/components/Dashboard';

export async function runAnalysis(
  file: File,
  monthlyRevenue: number
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('monthly_revenue', monthlyRevenue.toString());

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  const res = await fetch(`${apiUrl}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as AnalysisResult;
}
