// src/lib/firebase-admin.ts
import 'server-only';
import admin from 'firebase-admin';

// This file is for SERVER-SIDE use only.

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  // When running locally, the FIREBASE_SERVICE_ACCOUNT_JSON will be used.
  // In a deployed environment (like Cloud Run), the service account is automatically available.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  const credential = serviceAccountJson
    ? admin.credential.cert(JSON.parse(serviceAccountJson))
    : admin.credential.applicationDefault();

  admin.initializeApp({
    credential,
    databaseURL: `https://${process.env.GCLOUD_PROJECT || 'saga-ai-coach'}.firebaseio.com`,
  });
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();

export { firestoreAdmin, authAdmin };
