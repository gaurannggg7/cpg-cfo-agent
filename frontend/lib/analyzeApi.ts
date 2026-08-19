import type { AnalysisResult } from '@/components/Dashboard';
import { auth, signInAnon } from '@/lib/firebase';
import { AnalysisApiError, parseErrorResponse } from '@/lib/analysisErrors';

async function post(
  file: File,
  monthlyRevenue: number,
  cashOnHand: number | undefined,
  token: string
): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('monthly_revenue', monthlyRevenue.toString());
  // Omitted entirely, not sent as 0 or empty — the backend treats a missing
  // cash_on_hand field differently from a supplied $0 balance.
  if (cashOnHand !== undefined) {
    formData.append('cash_on_hand', cashOnHand.toString());
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  return fetch(`${apiUrl}/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

export async function runAnalysis(
  file: File,
  monthlyRevenue: number,
  cashOnHand?: number
): Promise<AnalysisResult> {
  // The backend requires a Firebase ID token on /analyze. Guests count:
  // signInAnonymously() issues a real token. A visitor who hasn't picked
  // guest-or-Google yet gets an anonymous session on demand so the public
  // demo still works without an account.
  if (!auth.currentUser) {
    await signInAnon();
  }
  let token = await auth.currentUser!.getIdToken();

  let res = await post(file, monthlyRevenue, cashOnHand, token);

  // A 401 here means the token expired mid-session, not that the user did
  // anything wrong — force a fresh token and retry once, silently. Only a
  // second 401 (e.g. the account itself was disabled) becomes a visible error.
  if (res.status === 401) {
    token = await auth.currentUser!.getIdToken(true);
    res = await post(file, monthlyRevenue, cashOnHand, token);
  }

  if (!res.ok) throw await parseErrorResponse(res);
  return (await res.json()) as AnalysisResult;
}

export { AnalysisApiError };
