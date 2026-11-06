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

// Initialize Anonymous Auth to provide persistent, secure UID for user memories
let currentUser: User | null = null;
const authReadyPromise = new Promise<User>((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      resolve(user);
    } else {
      try {
        const userCred = await signInAnonymously(auth);
        currentUser = userCred.user;
        resolve(userCred.user);
      } catch (err) {
        console.warn("Anonymous auth notice:", err);
      }
    }
  });
});

export async function getCurrentUserId(): Promise<string> {
  if (currentUser) return currentUser.uid;
  const user = await authReadyPromise;
  return user.uid;
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
