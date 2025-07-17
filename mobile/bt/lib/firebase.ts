import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB9tQAoLPpl2sKF5d67lfB4r7jozKBApg4",
  authDomain: "bt-404.firebaseapp.com",
  projectId: "bt-404",
  storageBucket: "bt-404.firebasestorage.app",
  messagingSenderId: "121673037816",
  appId: "1:121673037816:web:e9faea38e0d2d505c9080d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 