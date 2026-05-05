import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAdVG5TDMLS3uSJuP9sSbTFh9V_sPmi3sU",
  authDomain: "sixsevengame-a5461.firebaseapp.com",
  projectId: "sixsevengame-a5461",
  storageBucket: "sixsevengame-a5461.firebasestorage.app",
  messagingSenderId: "228795528490",
  appId: "1:228795528490:web:9eadbb74f663fceb5eda53",
  measurementId: "G-B1BRYH4E44",
  // Firebase zazwyczaj automatycznie wykrywa URL, ale czasami lepiej podać wprost dla RTDB
  databaseURL: "https://sixsevengame-a5461-default-rtdb.europe-west1.firebasedatabase.app" // Domyslny format dla eu
};

// Jeśli databaseURL bez regionu, to zazwyczaj: https://sixsevengame-a5461-default-rtdb.firebaseio.com
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
