import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const userId = () => localStorage.getItem('bikeUserId') || 'anonymous';

// ── Local storage fallback (when Firebase is not configured) ──
const lsKey = () => `bgph_rides_${userId()}`;
function localGet() {
  try { return JSON.parse(localStorage.getItem(lsKey())) || []; } catch { return []; }
}
function localSet(arr) {
  localStorage.setItem(lsKey(), JSON.stringify(arr));
}

export async function logRide(rideData) {
  if (db) {
    return addDoc(collection(db, 'users', userId(), 'rides'), {
      ...rideData,
      timestamp: serverTimestamp(),
    });
  }
  const rides = localGet();
  rides.unshift({ id: crypto.randomUUID(), ...rideData, timestamp: Date.now() });
  localSet(rides);
}

export async function getRides() {
  if (db) {
    try {
      const q = query(collection(db, 'users', userId(), 'rides'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return localGet(); }
  }
  return localGet();
}

export async function deleteRide(rideId) {
  if (db) return deleteDoc(doc(db, 'users', userId(), 'rides', rideId));
  localSet(localGet().filter(r => r.id !== rideId));
}

export function calcStats(rides) {
  const totalKm      = rides.reduce((s, r) => s + (r.distanceKm || 0), 0);
  const totalMinutes = rides.reduce((s, r) => s + (r.durationMinutes || 0), 0);
  const totalRides   = rides.length;
  const avgSpeed     = totalMinutes > 0 ? (totalKm / (totalMinutes / 60)).toFixed(1) : 0;
  const longestRide  = rides.reduce((max, r) => Math.max(max, r.distanceKm || 0), 0);
  return { totalKm: totalKm.toFixed(1), totalMinutes, totalRides, avgSpeed, longestRide };
}
