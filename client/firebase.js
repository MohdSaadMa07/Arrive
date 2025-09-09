// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWdqCYVHeEWsL7R44h90ZdnTXqHkd4E-4",
  authDomain: "face-cb61d.firebaseapp.com",
  projectId: "face-cb61d",
  storageBucket: "face-cb61d.firebasestorage.app",
  messagingSenderId: "609440353853",
  appId: "1:609440353853:web:abaf401948353410f1e454",
  measurementId: "G-HW7P4KNQ04"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword };