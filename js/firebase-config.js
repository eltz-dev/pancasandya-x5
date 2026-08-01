// PANCASANDYA — konfigurasi Firebase Realtime Database (dipakai bersama)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIX4l0jIMmfM7en6ojmkjW25hPBogwcdc",
  authDomain: "pancasandya-44667.firebaseapp.com",
  databaseURL: "https://pancasandya-44667-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pancasandya-44667",
  storageBucket: "pancasandya-44667.firebasestorage.app",
  messagingSenderId: "18825512048",
  appId: "1:18825512048:web:69ac6cf86b50c3e1a860b5",
  measurementId: "G-VNZEYPP1ME"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
