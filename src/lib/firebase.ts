import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalEntry, AIMessage } from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore (support custom database id)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Helper auth functions
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export const signOutUser = logOut;

// Firestore operations for User-Isolated Journal Entries
// Subcollection path: /users/{userId}/entries/{entryId}

export function subscribeToUserEntries(
  userId: string, 
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: JournalEntry[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        userId,
        title: data.title || '',
        content: data.content || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        mood: data.mood || 'peaceful',
        weather: data.weather || 'sunny',
        tags: Array.isArray(data.tags) ? data.tags : ['Reflection'],
        isFavorite: !!data.isFavorite,
        promptUsed: data.promptUsed || '',
        location: data.location || '',
        aiSummary: data.aiSummary || '',
        aiInsights: Array.isArray(data.aiInsights) ? data.aiInsights : [],
        aiMessages: Array.isArray(data.aiMessages) ? data.aiMessages : []
      });
    });
    onUpdate(list);
  }, (err) => {
    console.error('Error fetching journal entries from Firestore:', err);
    if (onError) onError(err);
  });
}

// Helper to recursively strip undefined values from objects before saving to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

export async function saveUserEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId || !entry.id) return;
  const docRef = doc(db, 'users', userId, 'entries', entry.id);
  const rawData = {
    ...entry,
    userId,
    updatedAt: new Date().toISOString()
  };
  const dataToSave = sanitizeForFirestore(rawData);
  await setDoc(docRef, dataToSave, { merge: true });
}

export const saveUserEntryToFirestore = saveUserEntry;

export async function deleteUserEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  const docRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(docRef);
}

export const deleteUserEntryFromFirestore = deleteUserEntry;

export async function batchSyncEntriesToFirestore(userId: string, entries: JournalEntry[]): Promise<void> {
  if (!userId || !entries || entries.length === 0) return;
  try {
    for (const entry of entries) {
      await saveUserEntry(userId, entry);
    }
  } catch (err) {
    console.error('Error batch syncing entries:', err);
  }
}

export async function addAIMessageToEntry(
  userId: string, 
  entryId: string, 
  message: AIMessage
): Promise<void> {
  if (!userId || !entryId) return;
  const docRef = doc(db, 'users', userId, 'entries', entryId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const existing = docSnap.data();
    const currentMessages: AIMessage[] = Array.isArray(existing.aiMessages) ? existing.aiMessages : [];
    const updatedMessages = [...currentMessages, message];
    const dataToSave = sanitizeForFirestore({ 
      aiMessages: updatedMessages,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  }
}
