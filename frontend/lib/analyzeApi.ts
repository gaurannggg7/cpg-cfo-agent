import type { AnalysisResult } from '@/components/Dashboard';
import { auth, signInAnon } from '@/lib/firebase';

export class SessionExpiredError extends Error {
  constructor() {
    super('Your session expired. Refresh the page and try again.');
    this.name = 'SessionExpiredError';
  }
}

export async function runAnalysis(
  file: File,
  monthlyRevenue: number
): Promise<AnalysisResult> {
  // The backend requires a Firebase ID token on /analyze. Guests count:
  // signInAnonymously() issues a real token. A visitor who hasn't picked
  // guest-or-Google yet gets an anonymous session on demand so the public
  // demo still works without an account.
  if (!auth.currentUser) {
    await signInAnon();
  }
  const token = await auth.currentUser!.getIdToken();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('monthly_revenue', monthlyRevenue.toString());

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  const res = await fetch(`${apiUrl}/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as AnalysisResult;
}
