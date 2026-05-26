import { db } from './firebase-config.js';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { isPremium, setPremium } from './app.js';

export async function submitPremiumRequest(gcashRef) {
  const userId = localStorage.getItem('bikeUserId');
  const ref = (gcashRef || '').trim().slice(0, 64);
  if (!userId) return { success: false, msg: 'Device ID missing. Please reload the app.' };
  if (!ref)    return { success: false, msg: 'Please enter your GCash reference number.' };
  // Only allow alphanumeric + hyphens in reference
  if (!/^[a-zA-Z0-9\-]{4,64}$/.test(ref)) return { success: false, msg: 'Reference number should contain only letters, numbers, or hyphens.' };
  try {
    await addDoc(collection(db, 'premiumRequests'), {
      deviceId: userId,
      gcashRef: ref,
      amount: 79,
      status: 'pending',
      submittedAt: serverTimestamp(),
    });
    return { success: true, msg: 'Request submitted! Please allow 1–24 hours for activation. Tap "Check Activation" below.' };
  } catch {
    return { success: false, msg: 'Network error. Please try again.' };
  }
}

export async function checkPremiumActivation() {
  const userId = localStorage.getItem('bikeUserId');
  if (!userId) return false;
  try {
    const snap = await getDoc(doc(db, 'premiumUsers', userId));
    if (snap.exists() && snap.data().activated) {
      setPremium(true);
      return true;
    }
  } catch { /* offline */ }
  return false;
}
