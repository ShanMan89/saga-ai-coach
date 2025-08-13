// src/lib/firebase-admin.ts
import 'server-only';
import admin from 'firebase-admin';

// This file is for SERVER-SIDE use only.

// Check if the app is already initialized to prevent errors
if (!admin.apps.length && typeof window === 'undefined') {
  try {
    // When running locally, the FIREBASE_SERVICE_ACCOUNT_JSON will be used.
    // In a deployed environment (like Cloud Run), the service account is automatically available.
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.GCLOUD_PROJECT || 'saga-ai-coach'}.firebaseio.com`,
      });
    } else if (process.env.NODE_ENV === 'production') {
      // In production, try to use application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: `https://${process.env.GCLOUD_PROJECT || 'saga-ai-coach'}.firebaseio.com`,
      });
    } else {
      // Development mode without credentials - skip initialization
      console.warn('Firebase Admin not initialized: Missing service account credentials');
    }
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Safe exports that handle when admin is not initialized
const firestoreAdmin = admin.apps.length > 0 ? admin.firestore() : null;
const authAdmin = admin.apps.length > 0 ? admin.auth() : null;

export { firestoreAdmin, authAdmin };
