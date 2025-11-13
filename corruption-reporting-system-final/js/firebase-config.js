// Import Firebase SDK (using CDN)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your Firebase configuration (REPLACE WITH YOUR OWN!)
const firebaseConfig = {
  apiKey: "AIzaSyAxoT7j070pF2n3ObIfgHoICaIOhNNzjZI",
  authDomain: "corruption-reporting-system.firebaseapp.com",
  projectId: "corruption-reporting-system",
  storageBucket: "corruption-reporting-system.firebasestorage.app",
  messagingSenderId: "339218597582",
  appId: "1:339218597582:web:0a4901e9a31feb6e37729f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export database instance
export { db };
