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
    <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-sm border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-[#E2E8F0] font-bold text-sm tracking-widest uppercase font-[family-name:var(--font-heading)]"
        >
          Baseline
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/demo"
            className="hidden sm:inline text-sm text-[#9CA3AF] hover:text-[#E2E8F0] transition-colors duration-200 font-medium"
          >
            Demo
          </Link>
          {isGoogleUser && (
            <Link
              href="/dashboard"
              className="text-sm text-[#9CA3AF] hover:text-[#E2E8F0] transition-colors duration-200 font-medium"
            >
              Dashboard
            </Link>
          )}
          <a
            href="https://github.com/gaurannggg7/cpg-cfo-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-sm bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-1.5 rounded-lg font-medium transition-colors duration-200"
          >
            GitHub
          </a>

          {isGoogleUser && (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-white/[0.08]">
              <span className="hidden sm:inline text-xs text-[#9CA3AF] max-w-[140px] truncate">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm text-[#E2E8F0] hover:text-[#06B6D4] font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          )}

          {isGuest && (
            <button
              type="button"
              onClick={handleSignIn}
              className="border-l border-white/[0.08] pl-3 text-sm text-[#E2E8F0] hover:text-[#06B6D4] font-medium transition-colors duration-200"
            >
              Sign In with Google
            </button>
          )}

          {!user && (
            <Link
              href="/login"
              className="border-l border-white/[0.08] pl-3 text-sm text-[#E2E8F0] hover:text-[#06B6D4] font-medium transition-colors duration-200"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
