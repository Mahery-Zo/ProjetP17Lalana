<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Simulateur de Changement</ion-title>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Tester Changement de Statut</ion-card-title>
          <ion-card-subtitle>Simule un changement de statut avec notification</ion-card-subtitle>
        </ion-card-header>
        
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">ID du Signalement</ion-label>
            <ion-input 
              v-model="signalementId" 
              placeholder="Entrez l'ID du signalement"
              type="text">
            </ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Nouveau Statut</ion-label>
            <ion-select v-model="newStatus" placeholder="Choisir un statut">
              <ion-select-option value="nouveau">Nouveau</ion-select-option>
              <ion-select-option value="en_cours">En cours</ion-select-option>
              <ion-select-option value="termine">Terminé</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-button 
            expand="block" 
            @click="simulateStatusChange"
            :disabled="loading || !signalementId || !newStatus"
            class="ion-margin-top">
            <ion-icon name="refresh" slot="start"></ion-icon>
            Simuler Changement
          </ion-button>

          <ion-button 
            expand="block" 
            fill="outline" 
            @click="loadUserSignalements"
            :disabled="loading"
            class="ion-margin-top">
            <ion-icon name="list" slot="start"></ion-icon>
            Mes Signalements
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Liste des signalements de l'utilisateur -->
      <ion-card v-if="userSignalements.length > 0">
        <ion-card-header>
          <ion-card-title>Mes Signalements</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item 
              v-for="signalement in userSignalements" 
              :key="signalement.id"
              button 
              @click="selectSignalement(signalement)">
              <ion-label>
                <h2>{{ signalement.description || 'Sans description' }}</h2>
                <p>Statut: {{ formatStatus(signalement.status) }}</p>
                <p>ID: {{ signalement.id }}</p>
              </ion-label>
              <ion-badge 
                :color="getStatusColor(signalement.status)"
                slot="end">
                {{ formatStatus(signalement.status) }}
              </ion-badge>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Messages de log -->
      <ion-card v-if="logs.length > 0">
        <ion-card-header>
          <ion-card-title>Logs</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            <ion-text :color="log.type === 'error' ? 'danger' : log.type === 'success' ? 'success' : 'medium'">
              {{ log.message }}
            </ion-text>
          </div>
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
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonBadge,
  IonList,
  IonText,
  IonBackButton,
  IonButtons,
  toastController
} from '@ionic/vue';
import { useRouter } from 'vue-router';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationService } from '../services/notifications.service';

const router = useRouter();

const signalementId = ref('');
const newStatus = ref('');
const loading = ref(false);
const logs = ref<Array<{type: string, message: string}>>([]);
const userSignalements = ref<Array<any>>([]);

const addLog = (message: string, type: string = 'info') => {
  logs.value.unshift({ type, message });
  console.log(`[${type.toUpperCase()}] ${message}`);
};

const formatStatus = (status: string): string => {
  switch (status) {
    case 'nouveau': return 'Nouveau';
    case 'en_cours': return 'En cours';
    case 'termine': return 'Terminé';
    default: return status;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'nouveau': return 'danger';
    case 'en_cours': return 'warning';
    case 'termine': return 'success';
    default: return 'medium';
  }
};

const selectSignalement = (signalement: any) => {
  signalementId.value = signalement.id;
  newStatus.value = signalement.status === 'nouveau' ? 'en_cours' : 'termine';
  addLog(`Signalement sélectionné: ${signalement.id}`, 'info');
};

const loadUserSignalements = async () => {
  loading.value = true;
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      addLog('Utilisateur non connecté', 'error');
      return;
    }

    const q = query(collection(db, 'signalements'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    userSignalements.value = [];
    querySnapshot.forEach((doc) => {
      userSignalements.value.push({
        id: doc.id,
        ...doc.data()
      });
    });

    addLog(`${userSignalements.value.length} signalement(s) trouvé(s)`, 'success');
  } catch (error) {
    addLog(`Erreur: ${error}`, 'error');
  } finally {
    loading.value = false;
  }
};

const simulateStatusChange = async () => {
  loading.value = true;
  addLog(`Début simulation: ${signalementId.value} -> ${newStatus.value}`, 'info');

  try {
    // 1. Récupérer le document actuel
    const docRef = doc(db, 'signalements', signalementId.value);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      addLog('Signalement non trouvé!', 'error');
      return;
    }

    const currentData = docSnap.data();
    const currentStatus = currentData?.status;
    
    addLog(`Statut actuel: ${currentStatus}`, 'info');

    // 2. Mettre à jour le statut
    await updateDoc(docRef, {
      status: newStatus.value,
      updatedAt: new Date()
    });

    addLog(`Statut mis à jour: ${currentStatus} -> ${newStatus.value}`, 'success');

    // 3. Envoyer une notification locale (simulation de Cloud Function)
    await sendLocalNotification(currentData);

    // 4. Afficher un toast
    const toast = await toastController.create({
      message: `Statut changé avec succès!`,
      duration: 2000,
      color: 'success'
    });
    await toast.present();

  } catch (error) {
    addLog(`Erreur: ${error}`, 'error');
  } finally {
    loading.value = false;
  }
};

const sendLocalNotification = async (signalementData: any) => {
  try {
    const notification = {
      title: 'Mise à jour de votre signalement',
      body: `Le statut de votre signalement est maintenant: ${formatStatus(newStatus.value)}`,
      data: {
        signalementId: signalementId.value,
        oldStatus: signalementData?.status,
        newStatus: newStatus.value,
        type: 'signalement_update'
      }
    };

    // Utiliser le service de notification local
    await NotificationService.sendLocalNotification(notification);
    addLog('Notification locale envoyée!', 'success');

  } catch (error) {
    addLog(`Erreur notification: ${error}`, 'error');
  }
};

onMounted(() => {
  addLog('Simulateur prêt', 'info');
});
</script>

<style scoped>
.log-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--ion-color-light);
  font-family: monospace;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}
</style>
