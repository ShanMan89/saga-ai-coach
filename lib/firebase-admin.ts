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
      let formattedPrivateKey = privateKey.trim();
      
      // Handle different formats of private key
      if (formattedPrivateKey.includes('\\n')) {
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
      }
      
      // Remove any quotes around the key
      if ((formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) ||
          (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'"))) {
        formattedPrivateKey = formattedPrivateKey.slice(1, -1);
      }
      
      // Ensure proper PEM format
      if (!formattedPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${formattedPrivateKey}\n-----END PRIVATE KEY-----\n`;
      }
      
      // Additional validation - check if key looks valid
      if (!formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----') || 
          !formattedPrivateKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Invalid private key format');
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
      } else {
        // Missing credentials - this will cause API failures
        console.error('Firebase Admin not initialized: Missing service account credentials');
        console.error('Required env vars: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
        console.error('Or: FIREBASE_SERVICE_ACCOUNT_JSON');
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
