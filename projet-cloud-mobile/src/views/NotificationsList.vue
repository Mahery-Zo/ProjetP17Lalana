<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon name="arrow-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="markAllAsRead" :disabled="notifications.length === 0">
            <ion-icon name="checkmark-done"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Liste des notifications -->
      <ion-list v-if="notifications.length > 0">
        <ion-item 
          v-for="notification in notifications" 
          :key="notification.id"
          @click="handleNotificationClick(notification)"
          :class="{ 'unread': !notification.read }"
        >
          <ion-avatar slot="start">
            <ion-icon 
              :name="getNotificationIcon(notification.type)" 
              :color="getNotificationColor(notification.type)"
            ></ion-icon>
          </ion-avatar>
          
          <ion-label>
            <h2>{{ notification.title }}</h2>
            <p>{{ notification.body }}</p>
            <p class="timestamp">{{ formatTimestamp(notification.timestamp) }}</p>
          </ion-label>
          
          <ion-badge 
            v-if="!notification.read" 
            color="danger" 
            slot="end"
          >
            Nouveau
          </ion-badge>
        </ion-item>
      </ion-list>

      <!-- État vide -->
      <div v-else class="empty-state">
        <ion-icon name="notifications-off" size="large" color="medium"></ion-icon>
        <h2>Aucune notification</h2>
        <p>Vous n'avez pas encore reçu de notification</p>
        
        <ion-button fill="outline" @click="goToTestPage">
          <ion-icon name="settings" slot="start"></ion-icon>
          Tester les notifications
        </ion-button>
      </div>

      <!-- Bouton de rafraîchissement -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="refreshNotifications" :disabled="loading">
          <ion-icon :name="loading ? 'hourglass' : 'refresh'"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Loading -->
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonList, IonItem,
  IonLabel, IonAvatar, IonBadge, IonFab, IonFabButton,
  IonLoading
} from '@ionic/vue';
import { useRouter } from 'vue-router';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'signalement_update' | 'entreprise_assigned' | 'test_notification';
  timestamp: Date;
  read: boolean;
  data?: any;
}

const router = useRouter();
const loading = ref(false);
const notifications = ref<Notification[]>([]);

// Méthodes
const loadNotifications = () => {
  loading.value = true;
  
  // Simuler le chargement des notifications
  // En réalité, ceci viendrait de Firestore ou d'un service
  setTimeout(() => {
    notifications.value = [
      {
        id: '1',
        title: 'Signalement mis à jour',
        body: 'Votre signalement sur Route Tananarive est maintenant en cours de traitement',
        type: 'signalement_update',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // Il y a 30 minutes
        read: false,
        data: { signalementId: 'abc123' }
      },
      {
        id: '2',
        title: 'Entreprise assignée',
        body: 'Entreprise Reparation SA a été assignée à votre signalement',
        type: 'entreprise_assigned',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // Il y a 2 heures
        read: false,
        data: { signalementId: 'def456', entrepriseId: 'ent789' }
      },
      {
        id: '3',
        title: 'Test de notification',
        body: 'Ceci est une notification de test pour vérifier que tout fonctionne',
        type: 'test_notification',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Hier
        read: true
      }
    ];
    loading.value = false;
  }, 1000);
};

const refreshNotifications = () => {
  loadNotifications();
};

const markAllAsRead = () => {
  notifications.value = notifications.value.map(n => ({ ...n, read: true }));
  
  // En réalité, sauvegarder dans Firestore
  console.log('All notifications marked as read');
};

const handleNotificationClick = (notification: Notification) => {
  // Marquer comme lue
  notification.read = true;
  
  // Naviguer vers la destination appropriée
  if (notification.data?.signalementId) {
    // Naviguer vers les détails du signalement
    console.log('Navigate to signalement:', notification.data.signalementId);
    // router.push(`/signalement/${notification.data.signalementId}`);
  }
};

const goBack = () => {
  router.back();
};

const goToTestPage = () => {
  router.push('/notifications-test');
};

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'signalement_update': return 'alert-circle';
    case 'entreprise_assigned': return 'business';
    case 'test_notification': return 'notifications';
    default: return 'notifications';
  }
};

const getNotificationColor = (type: string): string => {
  switch (type) {
    case 'signalement_update': return 'warning';
    case 'entreprise_assigned': return 'success';
    case 'test_notification': return 'primary';
    default: return 'medium';
  }
};

const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  
  if (diff < 60000) { // Moins d'une minute
    return 'À l\'instant';
  } else if (diff < 3600000) { // Moins d'une heure
    const minutes = Math.floor(diff / 60000);
    return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (diff < 86400000) { // Moins d'un jour
    const hours = Math.floor(diff / 3600000);
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  } else {
    return timestamp.toLocaleDateString('fr-FR');
  }
};

// Lifecycle
onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.unread {
  background-color: var(--ion-color-light);
  border-left: 4px solid var(--ion-color-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  text-align: center;
  padding: 20px;
}

.empty-state ion-icon {
  margin-bottom: 16px;
}

.empty-state h2 {
  margin: 8px 0;
  color: var(--ion-color-medium);
}

.empty-state p {
  color: var(--ion-color-medium);
  margin-bottom: 24px;
}

.timestamp {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 4px;
}

ion-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--ion-color-light);
}

ion-avatar ion-icon {
  font-size: 24px;
}
</style>
