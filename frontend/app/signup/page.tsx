'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { signUpWithEmail, signInWithGoogle, getAuthErrorMessage } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import GoogleIcon from '@/components/GoogleIcon';

export default function SignupPage() {
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
      await signUpWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      console.error('Sign-up failed:', err);
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
      console.error('Sign-up failed:', err);
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
        <div className="bg-[#0F0F12] rounded-2xl border border-white/[0.08] p-8">
          <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-[#E2E8F0] tracking-tight mb-6 text-center">
            Sign Up
          </h1>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.06] text-[#E2E8F0] text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {loading === 'google' ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-[#9CA3AF] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#E2E8F0] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.12] rounded-xl text-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-shadow duration-200"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#E2E8F0] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.12] rounded-xl text-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-shadow duration-200"
              />
              <p className="text-xs text-[#9CA3AF] mt-1.5">At least 6 characters.</p>
            </div>

            <button
              type="submit"
              disabled={loading !== null}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'email' ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>

          <p className="text-sm text-[#9CA3AF] text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#06B6D4] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
