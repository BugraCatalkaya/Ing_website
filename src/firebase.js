import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCwKCowoAZplk9xvaX5PtBw1L6rkBntQzo",
    authDomain: "wordmaster-app-fd6b1.firebaseapp.com",
    projectId: "wordmaster-app-fd6b1",
    storageBucket: "wordmaster-app-fd6b1.firebasestorage.app",
    messagingSenderId: "298031541872",
    appId: "1:298031541872:web:4d58588a8aee9cf9aa0eb5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
