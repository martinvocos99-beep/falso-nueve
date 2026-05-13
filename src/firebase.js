// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBfv86h4L4AvAoa4wmwU39K3K3UBeoIouo",
  authDomain: "falso-9-be690.firebaseapp.com",
  projectId: "falso-9-be690",
  storageBucket: "falso-9-be690.firebasestorage.app",
  messagingSenderId: "1094786158471",
  appId: "1:1094786158471:web:f95cf6ad6de9e1df770d22",
  measurementId: "G-E4XCE99STN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
