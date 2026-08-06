'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { signInWithEmail, signInWithGoogle, getAuthErrorMessage } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import GoogleIcon from '@/components/GoogleIcon';

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'email' | 'google' | null>(null);

  const isSignedIn = !!user && !user.isAnonymous;

  // Already signed in with a real account — nothing to do here.
  useEffect(() => {
    if (authLoading) return;
    if (isSignedIn) router.replace('/dashboard');
  }, [authLoading, isSignedIn, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading('email');
    try {
      await signInWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      console.error('Sign-in failed:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading('google');
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      console.error('Sign-in failed:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  if (authLoading || isSignedIn) {
    return (
      <div className="min-h-screen">
        <Navbar user={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <main className="max-w-sm mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-8">
          <h1 className="font-[family-name:var(--font-heading)] font-semibold text-2xl text-[var(--text)] tracking-tight mb-6 text-center">
            Sign In
          </h1>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded border border-[var(--border-strong)] bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)] text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {loading === 'google' ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {error && (
            <div className="mb-4 rounded border border-[var(--accent-flag)]/30 bg-[var(--accent-flag)]/10 px-4 py-3">
              <p className="text-sm text-[var(--accent-flag)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--text)] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-flag)] focus:border-transparent transition-shadow duration-200"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--text)] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-flag)] focus:border-transparent transition-shadow duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading !== null}
              className="w-full py-3.5 px-6 rounded font-semibold text-sm tracking-wide bg-[var(--accent-flag)] hover:bg-[var(--accent-flag-hover)] text-[var(--bg)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'email' ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-[var(--text-dim)] text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[var(--accent-base)] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
