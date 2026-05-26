import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Replace these values with your own Firebase project config at:
// console.firebase.google.com → Project Settings → Your Apps → Web App → Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Until real config is added, run in LOCAL mode: data persists to this
// device via localStorage. This keeps the whole app testable without a
// backend and makes the PWA fully functional offline.
export const firebaseReady = !Object.values(firebaseConfig).some(v => String(v).startsWith('YOUR_'));

let db = null;
if (firebaseReady) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    console.warn('[Bike Guide PH] Firebase init failed — falling back to local mode.', e);
  }
} else {
  console.info('[Bike Guide PH] Running in LOCAL mode (no Firebase config yet). Rides and challenge progress save to this device only.');
}

export { db };
