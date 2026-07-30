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
