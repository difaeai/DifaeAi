
"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "difae-ai",
  "appId": "1:641568304353:web:d47c0755f8dda04eb29ba0",
  "storageBucket": "difae-ai.appspot.com",
  "apiKey": "AIzaSyCEWdKEJaLFAkyYHCMofN_c3FY5l43-y7Q",
  "authDomain": "difae-ai.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "641568304353"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
