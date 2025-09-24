import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { initializeApp } from "firebase/app";
import * as firebaseAuth from 'firebase/auth';
import {
  GoogleAuthProvider,
  initializeAuth,
} from "firebase/auth";
import { enableIndexedDbPersistence, getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY || "<FIREBASE_API_KEY>",
  authDomain:
    Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN || "<FIREBASE_AUTH_DOMAIN>",
  projectId:
    Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID || "<FIREBASE_PROJECT_ID>",
  storageBucket:
    Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET ||
    "<FIREBASE_STORAGE_BUCKET>",
  messagingSenderId:
    Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID || "<SENDER_ID>",
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID || "<APP_ID>",
};
const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with React Native persistence
const auth = initializeAuth(app, {
   persistence: reactNativePersistence(AsyncStorage),
});

export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Firestore offline persistence
(async function enablePersistence() {
  try {
    await enableIndexedDbPersistence(db as any);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log("Firestore persistence not enabled:", e.message);
    } else {
      console.log("Firestore persistence not enabled:", e);
    }
  }
})();

export { auth };

