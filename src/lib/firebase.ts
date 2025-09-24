import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: Constants.manifest?.extra?.FIREBASE_API_KEY || '<FIREBASE_API_KEY>',
  authDomain: Constants.manifest?.extra?.FIREBASE_AUTH_DOMAIN || '<FIREBASE_AUTH_DOMAIN>',
  projectId: Constants.manifest?.extra?.FIREBASE_PROJECT_ID || '<FIREBASE_PROJECT_ID>',
  storageBucket: Constants.manifest?.extra?.FIREBASE_STORAGE_BUCKET || '<FIREBASE_STORAGE_BUCKET>',
  messagingSenderId: Constants.manifest?.extra?.FIREBASE_MESSAGING_SENDER_ID || '<SENDER_ID>',
  appId: Constants.manifest?.extra?.FIREBASE_APP_ID || '<APP_ID>'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Enable persistence where supported (best effort)
(async function enablePersistence() {
  try {
    await enableIndexedDbPersistence(db as any);
  } catch (e: unknown) { // Use 'unknown' type to catch the error
    // Persistence not available (e.g., React Native environment that doesn't support indexeddb)
    // Firestore native persistence is handled by SDK on React Native; this is a best-effort shim.
    if (e instanceof Error) {
      console.log('Firestore persistence not enabled:', e.message);
    } else {
      console.log('Firestore persistence not enabled:', e);
    }
  }
})();