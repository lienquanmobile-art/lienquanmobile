// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, get, push, update, remove, query, orderByChild, equalTo } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAARnQrk-U3V9bmX0T9P-P3hk5ffFhjYUo",
  authDomain: "lienquanmobile-6bcff.firebaseapp.com",
  databaseURL: "https://lienquanmobile-6bcff-default-rtdb.firebaseio.com",
  projectId: "lienquanmobile-6bcff",
  storageBucket: "lienquanmobile-6bcff.firebasestorage.app",
  messagingSenderId: "945809558015",
  appId: "1:945809558015:web:2e55df43632e5da5273fca",
  measurementId: "G-7273VD0ZYJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// Export for use in other files
export { db, ref, set, get, push, update, remove, query, orderByChild, equalTo };
