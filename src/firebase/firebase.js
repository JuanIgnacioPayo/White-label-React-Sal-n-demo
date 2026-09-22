// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getFirestore } from "firebase/firestore"; // Added Firestore import
import { getStorage } from "firebase/storage"; // Import Firebase Storage
import { getDatabase } from "firebase/database"; // Import Realtime Database

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  projectId: "melishare-redirect-payo",
  appId: "1:1097375998153:web:eb455dbf72c57700162d18",
  databaseURL: "https://melishare-redirect-payo-default-rtdb.firebaseio.com",
  storageBucket: "melishare-redirect-payo.firebasestorage.app",
  apiKey: "AIzaSyAhhsUxhGOu2F0sRTqXaXEPsV-aRsn2s7Y",
  authDomain: "melishare-redirect-payo.firebaseapp.com",
  messagingSenderId: "1097375998153"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');
const db = getFirestore(app); // Initialize Firestore
const storage = getStorage(app); // Initialize Storage
const database = getDatabase(app); // Initialize Realtime Database

export { app, auth, functions, db, storage, analytics, database }; // Export all services including analytics