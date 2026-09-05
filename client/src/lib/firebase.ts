import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseIsConfigured = Object.values(firebaseConfig).every(Boolean);

const app = firebaseIsConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const firebaseAuth = app ? getAuth(app) : null;

export function requireFirebaseAuth() {
  if (!firebaseAuth) {
    throw new Error("La configuration Firebase est incomplète. Contactez l'administrateur.");
  }
  return firebaseAuth;
}
