import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBj81wbshl9uLss1q7UW4BF2bdZZuAYrig",
  authDomain: "cse-portal-3f4ae.firebaseapp.com",
  projectId: "cse-portal-3f4ae",
  storageBucket: "cse-portal-3f4ae.firebasestorage.app",
  messagingSenderId: "297185306714",
  appId: "1:297185306714:web:420cd2a5d9456ec6eb9063",
  measurementId: "G-RG44XS4E8V"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);