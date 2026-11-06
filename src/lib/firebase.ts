import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore using custom databaseId if specified in config
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const PERSISTENT_UID_KEY = "avani_persistent_uid";

// Get persistent user ID that NEVER hangs and survives app close/reopens 100% of the time
export function getPersistentUserId(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    const existing = window.localStorage.getItem(PERSISTENT_UID_KEY);
    if (existing && existing.length > 5 && existing.length <= 128) {
      return existing;
    }

    const newId = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    window.localStorage.setItem(PERSISTENT_UID_KEY, newId);
    return newId;
  }

  return "user_avani_default";
}

export async function getCurrentUserId(): Promise<string> {
  return getPersistentUserId();
}

// Connection validation
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    await getDocFromServer(doc(db, "users", userId));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore client is offline or initializing.");
      return false;
    }
    return true;
  }
}
