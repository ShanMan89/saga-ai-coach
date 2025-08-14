// src/lib/firebase-admin.ts
import 'server-only';
import admin from 'firebase-admin';

// This file is for SERVER-SIDE use only.

// Check if the app is already initialized to prevent errors
if (!admin.apps.length && typeof window === 'undefined') {
  try {
    // Try individual environment variables first (more reliable for Vercel)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    if (projectId && privateKey && clientEmail) {
      // Clean and format the private key properly
      let formattedPrivateKey = privateKey;
      
      // Handle different formats of private key
      if (privateKey.includes('\\n')) {
        formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      // Ensure proper PEM format
      if (!formattedPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${formattedPrivateKey}\n-----END PRIVATE KEY-----\n`;
      }
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: formattedPrivateKey,
          clientEmail,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
    } else {
      // Fallback to JSON format
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      
      if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
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
    }
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Safe exports that handle when admin is not initialized
const firestoreAdmin = admin.apps.length > 0 ? admin.firestore() : null;
const authAdmin = admin.apps.length > 0 ? admin.auth() : null;

export { firestoreAdmin, authAdmin };
