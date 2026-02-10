<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon name="arrow-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Détail du signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" v-if="signalement">
      <ion-list>
        <ion-item>
          <ion-label>
            <h2>Status</h2>
            <p>
              <ion-badge :color="getStatusColor(signalement.status)">
                {{ formatStatus(signalement.status) }}
              </ion-badge>
            </p>
          </ion-label>
        </ion-item>
        <ion-item v-if="signalement.description">
          <ion-label>
            <h2>Description</h2>
            <p>{{ signalement.description }}</p>
          </ion-label>
        </ion-item>
        <ion-item v-if="signalement.createdAt">
          <ion-label>
            <h2>Date de création</h2>
            <p>{{ formatDate(signalement.createdAt) }}</p>
          </ion-label>
        </ion-item>
        <ion-item v-if="signalement.surface_m2">
          <ion-label>
            <h2>Surface</h2>
            <p>{{ signalement.surface_m2 }} m²</p>
          </ion-label>
        </ion-item>
        <ion-item v-if="signalement.budget">
          <ion-label>
            <h2>Budget</h2>
            <p>{{ signalement.budget.toLocaleString() }} Ar</p>
          </ion-label>
        </ion-item>
        <!-- <ion-item v-if="signalement.niveau !== undefined && signalement.niveau !== null">
          <ion-label>
            <h2>Niveau</h2>
            <p>{{ signalement.niveau }}/10</p>
          </ion-label>
        </ion-item> -->
        <ion-item v-if="signalement.entreprise">
          <ion-label>
            <h2>Entreprise</h2>
            <p>{{ signalement.entreprise }}</p>
          </ion-label>
        </ion-item>
        <ion-item>
          <ion-label>
            <h2>Coordonnées</h2>
            <p>{{ signalement.latitude.toFixed(6) }}, {{ signalement.longitude.toFixed(6) }}</p>
          </ion-label>
        </ion-item>
        <!-- Photos du signalement -->
        <PhotoGallery 
          v-if="signalement.id" 
          :photos="signalementPhotos" 
        />
      </ion-list>
    </ion-content>

    <!-- Loading -->
    <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { SignalementPhotosService } from '@/services/signalementPhotos.service';
import type { Signalement } from '@/types/firebase.types';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonList, IonItem,
  IonLabel, IonBadge, IonLoading
} from '@ionic/vue';
import PhotoGallery from '@/components/PhotoGallery.vue';
import { arrowBack } from 'ionicons/icons';

const route = useRoute();
const router = useRouter();
const signalement = ref<Signalement | null>(null);
const signalementPhotos = ref<any[]>([]);
const loading = ref(false);

// Méthodes
const loadSignalement = async () => {
  const signalementId = route.params.id as string;
  if (!signalementId) return;

  loading.value = true;
  try {
    const signalementDoc = await getDoc(doc(db, 'signalements', signalementId));
    if (signalementDoc.exists()) {
      signalement.value = {
        id: signalementDoc.id,
        ...signalementDoc.data()
      } as Signalement;

      // Charger les photos
      signalementPhotos.value = await SignalementPhotosService.getSignalementPhotos(signalementId);
    }
  } catch (error) {
    console.error('Erreur chargement signalement:', error);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back();
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'nouveau': return 'danger';
    case 'en_cours': return 'warning';
    case 'termine': return 'success';
    default: return 'medium';
  }
};

const formatStatus = (status: string): string => {
  switch (status) {
    case 'nouveau': return 'Nouveau';
    case 'en_cours': return 'En cours';
    case 'termine': return 'Terminé';
    default: return status;
  }
};

const formatDate = (date: Timestamp | Date | undefined): string => {
  if (!date) return '';
  const jsDate = date instanceof Timestamp ? date.toDate() : date;
  return jsDate.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Lifecycle
onMounted(() => {
  loadSignalement();
});
</script>

<style scoped>
ion-item {
  margin-bottom: 8px;
}
</style>
