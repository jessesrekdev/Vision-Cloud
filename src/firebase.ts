import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Import the Firebase configuration
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
let analytics = null;
try {
  // Only initialize analytics if measurementId is present
  if (firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn("Firebase Analytics could not be initialized:", e);
}

export { analytics };
export const auth = getAuth(app);
// Use the specific database ID from the config
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
