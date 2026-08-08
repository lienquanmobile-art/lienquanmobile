// js/firebase-config.js
// Khởi tạo Firebase (dùng bản "compat" để có thể chạy thẳng bằng <script>, không cần build tool)

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

firebase.initializeApp(firebaseConfig);

// Realtime Database gốc, các file khác sẽ dùng biến toàn cục "db"
const db = firebase.database();
