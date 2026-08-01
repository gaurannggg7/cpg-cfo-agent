'use client';

import { useState } from 'react';
import { signInAnon, signInWithGoogle } from '@/lib/firebase';

export default function AuthBanner() {
  const [loadingAction, setLoadingAction] = useState<'guest' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGuest = async () => {
    setLoadingAction('guest');
    setError(null);
    try {
      await signInAnon();
    } catch (err) {
      console.error('Guest sign-in failed:', err);
      setError('Could not start a guest session. Try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogle = async () => {
    setLoadingAction('google');
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError('Google sign-in failed or was cancelled.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-[#0F0F12]/75">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-[#9CA3AF] text-center sm:text-left">
          Try the demo as a guest, or sign in with Google to save your analysis history.
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            type="button"
            onClick={handleGuest}
            disabled={loadingAction !== null}
            className="text-sm px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#E2E8F0] hover:border-white/20 transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
          >
            {loadingAction === 'guest' ? 'Starting…' : 'Try Demo as Guest'}
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loadingAction !== null}
            className="text-sm px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors duration-200 font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {loadingAction === 'google' ? 'Signing in…' : 'Sign In with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
