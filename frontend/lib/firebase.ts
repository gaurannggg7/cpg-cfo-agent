import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  type Timestamp,
} from 'firebase/firestore';
import type { AnalysisResult } from '@/components/Dashboard';
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function signInAnon() {
  return await signInAnonymously(auth);
}

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return await signOut(auth);
}

export async function signUpWithEmail(email: string, password: string) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithEmail(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/operation-not-allowed': 'Email/password sign-in isn’t enabled yet. Try Google instead.',
};

/** Maps a Firebase Auth error to a plain-English message; falls back to a generic one. */
export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  return (code && AUTH_ERROR_MESSAGES[code]) || 'Something went wrong. Please try again.';
}

/** Subscribe to auth state changes. Returns the unsubscribe function. */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function saveAnalysis(
  data: AnalysisResult,
  userId: string,
  fileName?: string
) {
  const docRef = await addDoc(collection(db, 'analyses'), {
    fileName: fileName ?? 'untitled.csv',
    summary: data.summary,
    categories: data.categories,
    anomalies: data.anomalies,
    runway: data.runway,
    metrics: data.metrics,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** An analysis document as stored in Firestore. */
export interface StoredAnalysis extends AnalysisResult {
  id: string;
  userId: string;
  fileName: string;
  createdAt: Timestamp | null;
}

export async function getUserAnalyses(userId: string): Promise<StoredAnalysis[]> {
  const q = query(
    collection(db, 'analyses'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as StoredAnalysis);
}

export async function getAnalysisById(id: string): Promise<StoredAnalysis | null> {
  const snapshot = await getDoc(doc(db, 'analyses', id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as StoredAnalysis;
}
