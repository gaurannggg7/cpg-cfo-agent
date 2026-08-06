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

  const navLinkClass = (href: string) =>
    `text-sm transition-colors duration-200 border-b-2 pb-1 ${
      pathname === href
        ? 'text-accent border-accent'
        : 'text-text-secondary border-transparent hover:text-text-primary'
    }`;

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
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-text-primary font-mono text-sm font-medium tracking-tight"
        >
          <span className="w-1.5 h-1.5 bg-accent" aria-hidden="true" />
          baseline
        </Link>

        <nav className="flex items-center gap-6 sm:gap-8">
          <Link href="/demo" className={`hidden sm:inline ${navLinkClass('/demo')}`}>
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
            className="hidden sm:inline text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            GitHub
          </a>

          {isGoogleUser && (
            <div className="flex items-center gap-4 pl-4 sm:pl-6 border-l border-border">
              <span className="hidden sm:inline font-mono text-xs text-text-muted max-w-[140px] truncate">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm text-text-secondary hover:text-text-primary font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          )}

          {isGuest && (
            <button
              type="button"
              onClick={handleSignIn}
              className="border-l border-border pl-4 sm:pl-6 text-sm text-text-secondary hover:text-text-primary font-medium transition-colors duration-200"
            >
              Sign In
            </button>
          )}

          {!user && (
            <Link
              href="/login"
              className="inline-flex items-center bg-accent text-accent-foreground text-sm font-medium px-4 py-1.5 hover:bg-accent-hover transition-colors duration-200"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
