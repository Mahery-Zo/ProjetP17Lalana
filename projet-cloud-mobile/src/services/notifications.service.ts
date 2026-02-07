import { doc, onSnapshot, collection, addDoc, query, where, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
  private static listeners: Map<string, () => void> = new Map();

  /**
   * Initialise le service de notifications pour un utilisateur
   */
  static async initialize(userId: string): Promise<void> {
    console.log('Initialisation du service de notifications pour utilisateur:', userId);
    
    // Démarrer l'écoute des changements de statut
    this.listenForStatusChanges(userId);
    
    // Démarrer l'écoute des notifications
    this.listenForNotifications(userId);
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
   * Demande la permission de notification
   */
  static async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
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
