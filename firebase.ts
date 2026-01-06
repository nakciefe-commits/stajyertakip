import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAPoWC9oXLGiiuEIcT5H7vH8mgt-uRGzW0",
  authDomain: "stajyertakip-be6ce.firebaseapp.com",
  projectId: "stajyertakip-be6ce",
  storageBucket: "stajyertakip-be6ce.firebasestorage.app",
  messagingSenderId: "782564156782",
  appId: "1:782564156782:web:ca4a9562d209ba40b7cd7f",
  measurementId: "G-BHYXG17ENP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Enable Offline Persistence (Cache) to save reads
// This might fail in multiple tabs, so we catch the error silently
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.log("Persistence failed: Multiple tabs open");
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.log("Persistence not supported");
    }
  });
} catch (e) {
  // Ignore
}

export { db, auth };