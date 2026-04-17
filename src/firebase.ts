import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Check if config exists, otherwise use placeholder
let firebaseConfig = {};
try {
  // @ts-ignore
  firebaseConfig = await import('../firebase-applet-config.json');
} catch (e) {
  console.warn("Firebase config not found. Please set up Firebase in the UI.");
}

const app = initializeApp(firebaseConfig);
// @ts-ignore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
