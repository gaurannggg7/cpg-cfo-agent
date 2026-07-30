'use client';

import Link from 'next/link';
import type { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser } from '@/lib/firebase';

interface Props {
  user: User | null;
}

export default function Navbar({ user }: Props) {
  const isGoogleUser = !!user && !user.isAnonymous;
  const isGuest = !!user && user.isAnonymous;

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <span className="text-zinc-900 font-semibold text-sm tracking-tight">CPG CFO Agent</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/#demo"
            className="hidden sm:inline text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 font-medium"
          >
            Demo
          </Link>
          {isGoogleUser && (
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 font-medium"
            >
              Dashboard
            </Link>
          )}
          <a
            href="https://github.com/gaurannggg7/cpg-cfo-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-1.5 rounded-lg font-medium transition-colors duration-200"
          >
            GitHub
          </a>

          {isGoogleUser && (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-zinc-200">
              <span className="hidden sm:inline text-xs text-zinc-500 max-w-[140px] truncate">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          )}

          {isGuest && (
            <button
              type="button"
              onClick={handleSignIn}
              className="text-sm text-zinc-900 font-medium transition-colors duration-200 border-l border-zinc-200 pl-3"
            >
              Sign In with Google
            </button>
          )}

          {!user && (
            <button
              type="button"
              onClick={handleSignIn}
              className="text-sm text-zinc-900 font-medium transition-colors duration-200 border-l border-zinc-200 pl-3"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
