// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdsICr1naPeL94VP19ULy3Hpm3eeaL35s",
  authDomain: "projet-cloud-s5-47ed8.firebaseapp.com",
  projectId: "projet-cloud-s5-47ed8",
  storageBucket: "projet-cloud-s5-47ed8.firebasestorage.app",
  messagingSenderId: "311369941585",
  appId: "1:311369941585:web:3f2f8e18b4278ccb912e70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);