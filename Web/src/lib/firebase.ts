// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9tQAoLPpl2sKF5d67lfB4r7jozKBApg4",
  authDomain: "bt-404.firebaseapp.com",
  projectId: "bt-404",
  storageBucket: "bt-404.firebasestorage.app",
  messagingSenderId: "121673037816",
  appId: "1:121673037816:web:e9faea38e0d2d505c9080d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app);

export { app, db, auth }; 