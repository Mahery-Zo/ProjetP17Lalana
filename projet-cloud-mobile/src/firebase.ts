// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_MjGjn6cFBn7FM2IjZp8VhXTs-LEqcQg",
  authDomain: "lalana-f6fbd.firebaseapp.com",
  projectId: "lalana-f6fbd",
  storageBucket: "lalana-f6fbd.firebasestorage.app",
  messagingSenderId: "393256090955",
  appId: "1:393256090955:web:b531c5bcd4a099dd983cce",
  measurementId: "G-BRNXWXT95C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export firebase config for other services
export { firebaseConfig };
export const messaging = getMessaging(app);

// FCM Token management
export const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: 'BAzlxKcB2zcbMK_IX9kogX6vIYkglYOAD6sBaflaDKW_IQpFuC-r-JEioo_rIsbTFzBHm5a4RtyV9bPsdxuEmiw' // Vous devrez ajouter cette clé depuis Firebase Console
    });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = () => {
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    // Afficher la notification dans l'app
    if (payload.notification) {
      new Notification(payload.notification.title || 'Nouvelle notification', {
        body: payload.notification.body,
        icon: '/favicon.ico'
      });
    }
  });
};