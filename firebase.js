import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAV2uSO-TfyZ3br99zkf_GdA-XfdZ47fXY",
  authDomain: "ramzan-global-leaderboard.firebaseapp.com",
  projectId: "ramzan-global-leaderboard",
  storageBucket: "ramzan-global-leaderboard.firebasestorage.app",
  messagingSenderId: "180228666222",
  appId: "1:180228666222:web:201ccc82c560505c4a877f"
};

// Prevent re-initialization in Next.js
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const db = getFirestore(app);