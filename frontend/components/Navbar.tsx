'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser } from '@/lib/firebase';

interface Props {
  user: User | null;
}

export default function Navbar({ user }: Props) {
  const pathname = usePathname();
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

  // Same padding on every side for active and inactive states — only the
  // bottom border differs, so nothing shifts when the route changes.
  const navLinkClass = (href: string) => {
    const active = pathname === href;
    return `hidden sm:inline text-sm font-medium px-3 py-2 border-b-2 transition-colors duration-200 ${
      active
        ? 'text-[var(--text)] border-[var(--accent-flag)]'
        : 'text-[var(--text-dim)] hover:text-[var(--text)] border-transparent'
    }`;
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg)]/80 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-[var(--text)] font-semibold text-sm tracking-widest uppercase font-[family-name:var(--font-heading)]"
        >
          Baseline
        </Link>

        <div className="flex items-center gap-1 sm:gap-1">
          <Link href="/demo" className={navLinkClass('/demo')}>
            Demo
          </Link>
          {isGoogleUser && (
            <Link href="/dashboard" className={navLinkClass('/dashboard')}>
              Dashboard
            </Link>
          )}
          <a
            href="https://github.com/gaurannggg7/cpg-cfo-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-sm bg-[var(--accent-flag)] hover:bg-[var(--accent-flag-hover)] text-[var(--bg)] px-4 py-1.5 rounded-[2px] font-medium transition-colors duration-200 ml-2"
          >
            GitHub
          </a>

          {isGoogleUser && (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 ml-2 border-l border-[var(--border)]">
              <span className="hidden sm:inline text-xs text-[var(--text-dim)] max-w-[140px] truncate">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm text-[var(--text)] hover:text-[var(--accent-flag)] font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          )}

          {isGuest && (
            <button
              type="button"
              onClick={handleSignIn}
              className="border-l border-[var(--border)] pl-3 ml-2 text-sm text-[var(--text)] hover:text-[var(--accent-flag)] font-medium transition-colors duration-200"
            >
              Sign In with Google
            </button>
          )}

          {!user && (
            <Link
              href="/login"
              className="border-l border-[var(--border)] pl-3 ml-2 text-sm text-[var(--text)] hover:text-[var(--accent-flag)] font-medium transition-colors duration-200"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
