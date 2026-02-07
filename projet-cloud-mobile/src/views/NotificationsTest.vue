<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Test Notifications</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Configuration des Notifications</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <ion-item>
            <ion-label>Statut: {{ status }}</ion-label>
          </ion-item>
          
          <ion-item>
            <ion-label>Token FCM: {{ fcmToken ? 'Obtenu' : 'Non obtenu' }}</ion-label>
          </ion-item>
          
          <ion-item v-if="fcmToken">
            <ion-label position="stacked">Token (copier pour test)</ion-label>
            <ion-textarea 
              readonly 
              :value="fcmToken" 
              rows="3"
              style="font-size: 12px; font-family: monospace;">
            </ion-textarea>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Actions</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <ion-button 
            expand="block" 
            fill="outline" 
            @click="initializeNotifications"
            :disabled="loading">
            <ion-icon name="notifications" slot="start"></ion-icon>
            Initialiser les notifications
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            @click="sendTestNotification"
            :disabled="loading"
            class="ion-margin-top">
            <ion-icon name="paper-plane" slot="start"></ion-icon>
            Envoyer notification de test
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            @click="sendCloudFunctionTest"
            :disabled="loading"
            class="ion-margin-top">
            <ion-icon name="settings" slot="start"></ion-icon>
            Test Cloud Function
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            @click="goToNotificationsList"
            :disabled="loading"
            class="ion-margin-top">
            <ion-icon name="list" slot="start"></ion-icon>
            Voir les notifications
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Logs</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <ion-list>
            <ion-item v-for="(log, index) in logs" :key="index">
              <ion-label>
                <h3>{{ log.timestamp }}</h3>
                <p>{{ log.message }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonTextarea,
  IonList,
  toastController
} from '@ionic/vue';
import { notificationService } from '@/services/notifications.service';
import { getFCMToken } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { useRouter } from 'vue-router';

const status = ref('Non initialisé');
const fcmToken = ref<string | null>(null);
const loading = ref(false);
const logs = ref<Array<{ timestamp: string; message: string }>>([]);
const router = useRouter();

function addLog(message: string) {
  logs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    message
  });
  
  // Garder seulement les 20 derniers logs
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20);
  }
}

async function initializeNotifications() {
  loading.value = true;
  try {
    addLog('Initialisation des notifications...');
    await notificationService.initialize();
    
    // Obtenir le token FCM
    const token = await getFCMToken();
    fcmToken.value = token;
    
    status.value = 'Initialisé avec succès';
    addLog('Notifications initialisées avec succès');
    
    const toast = await toastController.create({
      message: 'Notifications initialisées avec succès',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
  } catch (error) {
    console.error('Error initializing notifications:', error);
    status.value = 'Erreur lors de l\'initialisation';
    addLog(`Erreur: ${error}`);
    
    const toast = await toastController.create({
      message: 'Erreur lors de l\'initialisation',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
}

async function sendTestNotification() {
  loading.value = true;
  try {
    addLog('Envoi notification de test locale...');
    await notificationService.sendTestNotification();
    addLog('Notification de test envoyée');
    
    const toast = await toastController.create({
      message: 'Notification de test envoyée',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
  } catch (error) {
    console.error('Error sending test notification:', error);
    addLog(`Erreur: ${error}`);
    
    const toast = await toastController.create({
      message: 'Erreur lors de l\'envoi',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
}

async function sendCloudFunctionTest() {
  loading.value = true;
  try {
    addLog('Test Cloud Function...');
    
    const functions = getFunctions();
    const sendTestNotification = httpsCallable(functions, 'sendTestNotification');
    const result = await sendTestNotification();
    
    addLog(`Cloud Function exécutée: ${JSON.stringify(result.data)}`);
    
    const toast = await toastController.create({
      message: 'Cloud Function testée avec succès',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    
  } catch (error) {
    console.error('Error testing cloud function:', error);
    addLog(`Erreur Cloud Function: ${error}`);
    
    const toast = await toastController.create({
      message: 'Erreur Cloud Function',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
}

async function goToNotificationsList() {
  loading.value = true;
  try {
    router.push('/notifications');
  } catch (error) {
    console.error('Error navigating to notifications:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  addLog('Page de test chargée');
});
</script>

<style scoped>
.ion-margin-top {
  margin-top: 16px;
}
</style>
