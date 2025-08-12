
"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBD0JOeTKXAYCCYqgCiCiiaA4A1gpj0ND8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "saga-ai-coach.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "saga-ai-coach",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "saga-ai-coach.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1015914525279",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1015914525279:web:e1dac2d2c226bd517261ea"
};

// This function should only be called on the client side.
function getFirebaseApp(): FirebaseApp {
    return !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

// Initialize the app and services here, ensuring they are singletons client-side.
const app = getFirebaseApp();
const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);

export { app, auth, firestore };
