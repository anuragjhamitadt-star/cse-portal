import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

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
export const auth = getAuth(app);

// SECURITY FIX: every visitor — student or admin — now gets a silent
// anonymous Firebase Auth session the moment the site loads. This costs
// nothing and requires no login UI of its own, but it means Firestore rules
// can now require request.auth != null, which blocks anyone querying the
// database directly from outside the app entirely (e.g. via curl, Postman,
// or the Firebase SDK with just the public API key) — previously the rules
// had no way to distinguish "my real app" from "a stranger with the project
// config," because there was no auth at all.
//
// This does NOT make someone an "admin" — it only proves "this request came
// through some Firebase-authenticated session." Admin-only protections still
// rely on the app's existing username/password check against the creds
// document, same as before.
export const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      resolve(user);
    } else {
      signInAnonymously(auth).catch((e) => {
        console.error("Anonymous sign-in failed:", e);
        resolve(null);
      });
    }
  });
});