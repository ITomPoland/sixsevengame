import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "sixsevengame-a5461.firebaseapp.com",
  projectId: "sixsevengame-a5461",
  storageBucket: "sixsevengame-a5461.firebasestorage.app",
  messagingSenderId: "228795528490",
  appId: "1:228795528490:web:9eadbb74f663fceb5eda53",
  measurementId: "G-B1BRYH4E44",
  // Explicit RTDB URL for EU region (Firebase may not auto-detect for Realtime Database)
  databaseURL: "https://sixsevengame-a5461-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
