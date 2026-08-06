import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
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
  type Auth,
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

/**
 * Lazily initialize Firebase. Calling getAuth/getFirestore at module top-level
 * throws `auth/invalid-api-key` during import when the API key isn't inlined,
 * which crashes the entire page. Deferring init keeps the page rendering and
 * surfaces config errors only when an auth/data action is actually invoked.
 */
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return _app;
}

export function getAuthInstance(): Auth {
  if (!_auth) {
    _auth = getAuth(getApp());
  }
  return _auth;
}

function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getApp());
  }
  return _db;
}

export async function signInAnon() {
  return await signInAnonymously(getAuthInstance());
}

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return await signInWithPopup(getAuthInstance(), googleProvider);
}

export async function signOutUser() {
  return await signOut(getAuthInstance());
}

export async function signUpWithEmail(email: string, password: string) {
  return await createUserWithEmailAndPassword(getAuthInstance(), email, password);
}

export async function signInWithEmail(email: string, password: string) {
  return await signInWithEmailAndPassword(getAuthInstance(), email, password);
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
  try {
    return onAuthStateChanged(getAuthInstance(), callback);
  } catch (error) {
    // Firebase failed to initialize (e.g. missing/invalid API key). Treat the
    // visitor as signed out so the page still renders instead of crashing.
    console.error('[v0] Firebase auth unavailable:', error);
    callback(null);
    return () => {};
  }
}

export async function saveAnalysis(
  data: AnalysisResult,
  userId: string,
  fileName?: string
) {
  const docRef = await addDoc(collection(getDb(), 'analyses'), {
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
    collection(getDb(), 'analyses'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as StoredAnalysis);
}

export async function getAnalysisById(id: string): Promise<StoredAnalysis | null> {
  const snapshot = await getDoc(doc(getDb(), 'analyses', id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as StoredAnalysis;
}
