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
          <ion-button @click="markAllAsRead" v-if="unreadNotifications.length > 0">
            <ion-icon name="checkmark-done"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Badge de notifications non lues -->
      <div class="notification-header" v-if="unreadNotifications.length > 0">
        <ion-chip color="primary">
          <ion-icon name="notifications"></ion-icon>
          <ion-label>{{ unreadNotifications.length }} non lue(s)</ion-label>
        </ion-chip>
      </div>

      <!-- Liste des notifications -->
      <ion-list v-if="notifications.length > 0">
        <ion-item 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="{ 'unread': !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <ion-avatar slot="start" v-if="notification.type === 'status_change'">
            <ion-icon :icon="getStatusIcon(notification.status)" :color="getStatusColor(notification.status)"></ion-icon>
          </ion-avatar>
          <ion-avatar slot="start" v-else>
            <ion-icon name="notifications" color="primary"></ion-icon>
          </ion-avatar>
          
          <ion-label>
            <h2>{{ notification.title }}</h2>
            <p>{{ notification.body }}</p>
            <p class="timestamp">{{ formatDate(notification.createdAt) }}</p>
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
        <p>Vous n'avez pas encore de notifications</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '@/firebase';
import { NotificationService, type NotificationData } from '@/services/notifications.service';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonList, IonItem,
  IonLabel, IonChip, IonAvatar, IonBadge
} from '@ionic/vue';
import { 
  notifications as notificationsIcon, 
  notificationsOff, 
  arrowBack, 
  checkmarkDone,
  alertCircle,
  checkmarkCircle,
  time
} from 'ionicons/icons';

const router = useRouter();
const notifications = ref<NotificationData[]>([]);

// Computed
const unreadNotifications = computed(() => {
  return notifications.value.filter(n => !n.read);
});

// Méthodes
const loadNotifications = async () => {
  const userId = auth.currentUser?.uid;
  if (userId) {
    try {
      notifications.value = await NotificationService.getUnreadNotifications(userId);
      console.log('📬 Notifications chargées:', notifications.value);
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    }
  }
};

const handleNotificationClick = async (notification: NotificationData) => {
  // Marquer comme lue
  const userId = auth.currentUser?.uid;
  if (userId && !notification.read) {
    await NotificationService.markAsRead(userId, notification.id);
    notification.read = true;
  }

  // Naviguer vers le signalement si applicable
  if (notification.signalementId) {
    router.push(`/signalement/${notification.signalementId}`);
  }
};

const markAllAsRead = async () => {
  const userId = auth.currentUser?.uid;
  if (userId) {
    try {
      // Marquer toutes les notifications non lues comme lues
      const unreadIds = unreadNotifications.value.map(n => n.id);
      for (const id of unreadIds) {
        await NotificationService.markAsRead(userId, id);
      }
      
      // Mettre à jour l'état local
      notifications.value.forEach(n => {
        if (unreadIds.includes(n.id)) {
          n.read = true;
        }
      });
    } catch (error) {
      console.error('❌ Erreur marquage toutes lues:', error);
    }
  }
};

const goBack = () => {
  router.back();
};

const formatDate = (date: Date | any): string => {
  const now = new Date();
  const notificationDate = date instanceof Date ? date : (date?.toDate ? date.toDate() : new Date(date));
  const diffMs = now.getTime() - notificationDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  
  return notificationDate.toLocaleDateString('fr-FR');
};

const getStatusIcon = (status?: string): string => {
  switch (status) {
    case 'nouveau': return alertCircle;
    case 'en_cours': return time;
    case 'termine': return checkmarkCircle;
    default: return notificationsIcon;
  }
};

const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'nouveau': return 'danger';
    case 'en_cours': return 'warning';
    case 'termine': return 'success';
    default: return 'medium';
  }
};

// Lifecycle
onMounted(() => {
  loadNotifications();
});

onUnmounted(() => {
  // Nettoyer si nécessaire
});
</script>

<style scoped>
.notification-header {
  margin-bottom: 16px;
}

.unread {
  background-color: var(--ion-color-light);
  border-left: 4px solid var(--ion-color-primary);
}

.timestamp {
  font-size: 0.8em;
  color: var(--ion-color-medium);
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  margin-bottom: 16px;
}

.empty-state h2 {
  margin: 0 0 8px 0;
  font-size: 1.2em;
}

.empty-state p {
  margin: 0;
  font-size: 0.9em;
}

ion-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

ion-item:hover {
  background-color: var(--ion-color-light);
}
</style>
