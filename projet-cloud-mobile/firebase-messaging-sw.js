// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyD_MjGjn6cFBn7FM2IjZp8VhXTs-LEqcQg",
  authDomain: "lalana-f6fbd.firebaseapp.com",
  projectId: "lalana-f6fbd",
  storageBucket: "lalana-f6fbd.firebasestorage.app",
  messagingSenderId: "393256090955",
  appId: "1:393256090955:web:b531c5bcd4a099dd983cce",
  measurementId: "G-BRNXWXT95C"
});

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Message FCM reçu en arrière-plan:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: payload.data?.signalementId || 'default',
    data: payload.data,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'Voir le signalement',
        icon: '/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
        icon: '/icon-96x96.png'
      }
    ]
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
  
  // Jouer un son si disponible
  if (payload.data?.sound) {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('Erreur lecture son:', e));
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification cliquée:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app to the signalement
    const signalementId = event.notification.data.signalementId;
    if (signalementId) {
      clients.openWindow(`/signalement/${signalementId}`);
    } else {
      clients.openWindow('/home');
    }
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    clients.openWindow('/home');
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification fermée:', event);
});

// Handle push event (messages when app is closed)
self.addEventListener('push', (event) => {
  console.log('Push event reçu:', event);
  
  if (!event.data) {
    console.log('Push event sans données');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('Données push reçues:', data);
    
    // Si c'est une notification FCM, elle sera gérée par onBackgroundMessage
    if (data.notification) {
      return;
    }
    
    // Sinon, créer une notification personnalisée
    const title = data.title || 'Nouvelle notification Lalana';
    const options = {
      body: data.body || 'Vous avez une nouvelle notification',
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: data.tag || 'default',
      data: data.data || {},
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200]
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Erreur traitement push event:', error);
  }
});
