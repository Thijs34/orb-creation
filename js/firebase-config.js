import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBjZqcA44ImaNklnBjAjToz08aQ5dff2tM",
  authDomain: "feedback-machine-9298c.firebaseapp.com",
  projectId: "feedback-machine-9298c",
  storageBucket: "feedback-machine-9298c.firebasestorage.app",
  messagingSenderId: "1062557554010",
  appId: "1:1062557554010:web:fdd54cbe001c103947cf63",
  measurementId: "G-XH9REBTMXE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Expose Firestore methods for other JS files
window.db = db;
window.addDoc = addDoc;
window.collection = collection;
