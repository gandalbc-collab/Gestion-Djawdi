import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function firebaseOptions() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      return { projectId, credential: cert(JSON.parse(serviceAccountJson)) };
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }
  }

  // Cloud Functions and Cloud Run automatically provide application default
  // credentials. Local development must provide GOOGLE_APPLICATION_CREDENTIALS.
  return { projectId, credential: applicationDefault() };
}

export function getFirebaseAdminApp() {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseOptions());
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
