import { 
  doc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  getMessaging, 
  getToken, 
  onMessage, 
  deleteToken 
} from 'firebase/messaging';
import { auth, db } from '../firebase';

export interface FCMToken {
  token: string;
  createdAt: Date;
  userAgent: string;
}

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'signalement_update' | 'entreprise_assigned' | 'status_change';
  signalementId?: string;
  status?: string;
  entrepriseId?: string;
  read: boolean;
  createdAt: Date;
  userId: string;
}

export class NotificationService {
  private static messaging: any = null;
  private static vapidKey = 'YOUR_VAPID_KEY_HERE'; // À configurer
  private static listeners: Map<string, () => void> = new Map();

  /**
   * Initialise le service pour un utilisateur spécifique
   */
  static async initializeForUser(userId: string): Promise<void> {
    console.log('Initialisation FCM pour utilisateur:', userId);
    
    // Initialiser FCM
    await this.initialize();
    
    // Écouter les changements de statut
    this.listenForStatusChanges(userId);
    
    // Écouter les notifications directes
    this.listenForNotifications(userId);
  }

  /**
   * Initialise le service de notifications FCM avec demande d'autorisation
   */
  static async initialize(): Promise<void> {
    try {
      console.log('🔔 Initialisation FCM...');
      
      // Initialiser Firebase Messaging
      this.messaging = getMessaging();
      
      // Demander la permission de notification
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        console.log('❌ Permission notification refusée');
        this.showPermissionDeniedMessage();
        return;
      }
      
      console.log('✅ Permission notification accordée');
      
      // Récupérer et sauvegarder le token FCM
      await this.saveFCMToken();
      
      // Écouter les messages en premier plan
      onMessage(this.messaging, (payload) => {
        console.log('📨 Message FCM reçu en premier plan:', payload);
        this.showLocalNotification(payload);
      });
      
      console.log('🎉 Service FCM initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation FCM:', error);
    }
  }

  /**
   * Demande la permission de notification avec interface utilisateur
   */
  static async requestPermission(): Promise<boolean> {
    try {
      console.log('🔔 Demande de permission de notification...');
      
      // Vérifier si les notifications sont supportées
      if (!('Notification' in window)) {
        console.log('❌ Notifications non supportées par ce navigateur');
        this.showUnsupportedMessage();
        return false;
      }
      
      // Vérifier si la permission est déjà accordée
      if (Notification.permission === 'granted') {
        console.log('✅ Permission déjà accordée');
        return true;
      }
      
      // Vérifier si la permission a été refusée
      if (Notification.permission === 'denied') {
        console.log('❌ Permission déjà refusée');
        this.showPermissionDeniedMessage();
        return false;
      }
      
      // Demander la permission
      const permission = await Notification.requestPermission();
      console.log('📋 Réponse permission:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Permission accordée par l\'utilisateur');
        this.showPermissionGrantedMessage();
        return true;
      } else if (permission === 'denied') {
        console.log('❌ Permission refusée par l\'utilisateur');
        this.showPermissionDeniedMessage();
        return false;
      } else {
        console.log('⏳ Permission en attente');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur demande permission:', error);
      return false;
    }
  }

  /**
   * Affiche un message quand la permission est accordée
   */
  private static showPermissionGrantedMessage(): void {
    console.log('✅ Notifications activées avec succès');
    // Ne plus afficher de notification système pour éviter les conflits
  }

  /**
   * Affiche un message quand la permission est refusée
   */
  private static showPermissionDeniedMessage(): void {
    console.log('📢 Pour activer les notifications:');
    console.log('1. Cliquez sur l\'icône 🔒 dans la barre d\'adresse');
    console.log('2. Activez les "Notifications"');
    console.log('3. Rechargez la page');
    
    // Ne plus afficher l'alerte visuelle qui bloque l'application
    // L'utilisateur verra les instructions dans la console uniquement
  }

  /**
   * Affiche un message si les notifications ne sont pas supportées
   */
  private static showUnsupportedMessage(): void {
    console.log('❌ Ce navigateur ne supporte pas les notifications');
    console.log('📱 Utilisez Chrome, Firefox, Edge ou Safari pour recevoir des notifications');
  }

  /**
   * Récupère et sauvegarde le token FCM
   */
  static async saveFCMToken(): Promise<void> {
    try {
      if (!auth.currentUser) {
        console.log('Utilisateur non connecté, sauvegarde token ignorée');
        return;
      }

      const currentToken = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });

      if (currentToken) {
        console.log('Token FCM obtenu:', currentToken.substring(0, 20) + '...');
        
        // Sauvegarder le token dans Firestore
        const userId = auth.currentUser.uid;
        const tokenId = currentToken.substring(0, 20); // Utiliser une partie du token comme ID
        
        const tokenData: FCMToken = {
          token: currentToken,
          createdAt: new Date(),
          userAgent: navigator.userAgent
        };

        await setDoc(
          doc(db, 'users', userId, 'fcmTokens', tokenId),
          tokenData
        );

        console.log('Token FCM sauvegardé');
      } else {
        console.log('Impossible d\'obtenir le token FCM');
      }
    } catch (error) {
      console.error('Erreur sauvegarde token FCM:', error);
    }
  }

  /**
   * Supprime le token FCM lors de la déconnexion
   */
  static async removeFCMToken(): Promise<void> {
    try {
      if (!auth.currentUser || !this.messaging) return;

      const currentToken = await getToken(this.messaging);
      if (currentToken) {
        const userId = auth.currentUser.uid;
        const tokenId = currentToken.substring(0, 20);
        
        // Supprimer de Firestore
        await deleteDoc(doc(db, 'users', userId, 'fcmTokens', tokenId));
        
        // Supprimer de Firebase
        await deleteToken(this.messaging);
        
        console.log('Token FCM supprimé');
      }
    } catch (error) {
      console.error('Erreur suppression token FCM:', error);
    }
  }

  /**
   * Écoute les changements de statut des signalements de l'utilisateur
   */
  private static listenForStatusChanges(userId: string): void {
    console.log('🎯 Démarrage écoute des changements de statut pour userId:', userId);
    
    const q = query(
      collection(db, 'signalements'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📡 Snapshot reçu, changements:', snapshot.docChanges().length);
      
      snapshot.docChanges().forEach((change) => {
        console.log('🔄 Changement détecté:', {
          type: change.type,
          docId: change.doc.id,
          data: change.doc.data()
        });
        
        if (change.type === 'modified') {
          const data = change.doc.data();
          const newStatus = data.status;
          const signalementId = change.doc.id;
          
          console.log('🎉 Changement de statut détecté:', { signalementId, status: newStatus });
          
          // Créer une notification locale
          this.createLocalNotification({
            userId,
            signalementId,
            status: newStatus,
            type: 'status_change'
          });
        }
      });
    }, (error) => {
      console.error('❌ Erreur écoute Firestore:', error);
    });

    this.listeners.set(`status_${userId}`, unsubscribe);
    console.log('✅ Écoute des changements de statut configurée');
  }

  /**
   * Écoute les notifications directes
   */
  private static listenForNotifications(userId: string): void {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    
    const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = {
            id: change.doc.id,
            ...change.doc.data()
          } as NotificationData;
          
          // Afficher la notification
          this.showBrowserNotification(notification);
        }
      });
    });

    this.listeners.set(`notifications_${userId}`, unsubscribe);
  }

  /**
   * Crée une notification locale pour un changement de statut
   */
  private static createLocalNotification(data: {
    userId: string;
    signalementId: string;
    status: string;
    type: 'status_change';
  }): void {
    console.log('🔔 Création notification locale:', data);
    
    const notification: Omit<NotificationData, 'id' | 'createdAt'> = {
      title: 'Mise à jour de votre signalement',
      body: `Le statut de votre signalement est maintenant: ${this.getStatusText(data.status)}`,
      type: data.type,
      signalementId: data.signalementId,
      status: data.status,
      userId: data.userId,
      read: false
    };

    console.log('💾 Sauvegarde notification dans Firestore...');
    // Sauvegarder dans Firestore
    this.saveNotification(data.userId, notification);
    
    console.log('🌐 Affichage notification navigateur...');
    // Afficher notification navigateur
    this.showBrowserNotification({
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date()
    } as NotificationData);
  }

  /**
   * Sauvegarde une notification dans Firestore
   */
  private static async saveNotification(
    userId: string, 
    notification: Omit<NotificationData, 'id' | 'createdAt'>
  ): Promise<void> {
    try {
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const docRef = await addDoc(notificationsRef, {
        ...notification,
        createdAt: new Date(),
        read: false
      });
      console.log('✅ Notification sauvegardée avec ID:', docRef.id);
    } catch (error) {
      console.error('❌ Erreur sauvegarde notification:', error);
    }
  }

  /**
   * Affiche une notification navigateur
   */
  private static showBrowserNotification(notification: NotificationData): void {
    console.log('🌐 Tentative d\'affichage notification navigateur:', {
      permission: Notification.permission,
      title: notification.title,
      body: notification.body
    });
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: '/icon-192x192.png',
        tag: notification.signalementId || notification.id,
        requireInteraction: true
      });
      console.log('✅ Notification navigateur affichée');
    } else {
      console.log('⚠️ Permission notification non accordée:', Notification.permission);
    }
  }

  /**
   * Affiche une notification locale
   */
  private static showLocalNotification(payload: any): void {
    const notification = payload.notification;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icon-192x192.png',
        tag: payload.tag || 'default',
        requireInteraction: true,
        data: payload.data
      });
    }
  }

  /**
   * Marque une notification comme lue
   */
  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Erreur marquage notification lue:', error);
    }
  }

  /**
   * Récupère les notifications non lues
   */
  static async getUnreadNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const q = query(
        notificationsRef,
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NotificationData));
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }
  }

  /**
   * Envoie une notification locale (pour les tests)
   */
  static async sendLocalNotification(notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    try {
      console.log('🔔 Envoi notification locale:', notification);
      
      // Afficher notification navigateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icon-192x192.png',
          tag: 'local-notification',
          requireInteraction: true
        });
      }
      
      // Sauvegarder dans Firestore si userId disponible
      const userId = auth.currentUser?.uid;
      if (userId) {
        const notificationData: Omit<NotificationData, 'id' | 'createdAt'> = {
          title: notification.title,
          body: notification.body,
          type: 'signalement_update',
          userId: userId,
          read: false,
          signalementId: notification.data?.signalementId,
          status: notification.data?.newStatus
        };
        
        await this.saveNotification(userId, notificationData);
      }
    } catch (error) {
      console.error('❌ Erreur envoi notification locale:', error);
    }
  }

  /**
   * Nettoie les listeners
   */
  static cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  /**
   * Formate le texte du statut
   */
  private static getStatusText(status: string): string {
    switch (status) {
      case 'nouveau': return 'Nouveau';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      default: return status;
    }
  }
}
