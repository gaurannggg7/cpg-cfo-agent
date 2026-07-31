import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthChange,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutUser as firebaseSignOutUser,
} from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    isGuest: user?.isAnonymous ?? false,
    signInWithGoogle: firebaseSignInWithGoogle,
    signOutUser: firebaseSignOutUser,
  };
}
