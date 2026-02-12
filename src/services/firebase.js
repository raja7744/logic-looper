// Import Firebase core
import { initializeApp } from "firebase/app";

// Import Auth
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA61G_DXjZbMx20YqUzsV0Gbd4rrbyTNSY",
  authDomain: "logic-looper-4ef49.firebaseapp.com",
  projectId: "logic-looper-4ef49",
  storageBucket: "logic-looper-4ef49.firebasestorage.app",
  messagingSenderId: "149123996478",
  appId: "1:149123996478:web:30a9e7d9dbc64a2a3a2a6f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Setup Auth
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
