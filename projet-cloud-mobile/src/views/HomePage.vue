<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Lalana - Signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleFilter">
            <ion-icon :name="showMySignalements ? 'funnel' : 'funnel-outline'"></ion-icon>
          </ion-button>
          <ion-button @click="handleLogout">
            <ion-icon name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar v-if="showMySignalements">
        <ion-chip color="primary" @click="toggleFilter">
          <ion-icon name="person"></ion-icon>
          <ion-label>Mes signalements uniquement</ion-label>
          <ion-icon name="close-circle"></ion-icon>
        </ion-chip>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Carte -->
      <div class="map-container">
        <MapComponent
          ref="mapRef"
          :signalements="filteredSignalements"
          :allowMarkerPlacement="true"
          @markerPlaced="handleMarkerPlaced"
          @signalementClick="handleSignalementClick"
        />
      </div>

      <!-- Bouton flottant pour ajouter un signalement -->
      <ion-fab vertical="bottom" horizontal="start" slot="fixed">
        <ion-fab-button @click="openSignalementForm" :disabled="!selectedCoords">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Récapitulatif (slide up) -->
      <div class="recap-container" :class="{ expanded: showRecap }">
        <div class="recap-handle" @click="toggleRecap">
          <div class="handle-bar"></div>
          <span>{{ showRecap ? 'Masquer' : 'Voir' }} le récap</span>
        </div>
        <RecapCard :signalements="filteredSignalements" />
      </div>

      <!-- Formulaire de signalement -->
      <SignalementForm
        :isOpen="showSignalementForm"
        :coordinates="selectedCoords"
        @close="closeSignalementForm"
        @success="handleSignalementSuccess"
      />

      <!-- Détail d'un signalement -->
      <ion-modal :is-open="showSignalementDetail" @didDismiss="closeSignalementDetail">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeSignalementDetail">Fermer</ion-button>
            </ion-buttons>
            <ion-title>Détail du signalement</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding" v-if="selectedSignalement">
          <ion-list>
            <ion-item>
              <ion-label>
                <h2>Status</h2>
                <p>
                  <ion-badge :color="getStatusColor(selectedSignalement.status)">
                    {{ formatStatus(selectedSignalement.status) }}
                  </ion-badge>
                </p>
              </ion-label>
            </ion-item>
            <ion-item v-if="selectedSignalement.description">
              <ion-label>
                <h2>Description</h2>
                <p>{{ selectedSignalement.description }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="selectedSignalement.surface_m2">
              <ion-label>
                <h2>Surface</h2>
                <p>{{ selectedSignalement.surface_m2 }} m²</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="selectedSignalement.budget">
              <ion-label>
                <h2>Budget</h2>
                <p>{{ selectedSignalement.budget.toLocaleString() }} Ar</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="selectedSignalement.entreprise">
              <ion-label>
                <h2>Entreprise</h2>
                <p>{{ selectedSignalement.entreprise }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <h2>Coordonnées</h2>
                <p>{{ selectedSignalement.latitude.toFixed(6) }}, {{ selectedSignalement.longitude.toFixed(6) }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <!-- Loading -->
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>

      <!-- Toast -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :color="toastColor"
        duration="3000"
        position="bottom"
        @didDismiss="showToast = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonFab, IonFabButton,
  IonChip, IonLabel, IonModal, IonList, IonItem,
  IonBadge, IonLoading, IonToast
} from '@ionic/vue';
import { useRouter } from 'vue-router';
import { logout as firebaseLogout, getTousLesSignalements, getMesSignalements } from '@/services/firebaseService';
import { auth } from '@/firebase';
import MapComponent from '@/components/MapComponent.vue';
import SignalementForm from '@/components/SignalementForm.vue';
import RecapCard from '@/components/RecapCard.vue';
import type { Signalement } from '@/types/firebase.types';
import type { Coordinates } from '@/services/geolocationService';

const router = useRouter();
const mapRef = ref<InstanceType<typeof MapComponent> | null>(null);

// State
const loading = ref(false);
const signalements = ref<Signalement[]>([]);
const showMySignalements = ref(false);
const showRecap = ref(false);
const showSignalementForm = ref(false);
const showSignalementDetail = ref(false);
const selectedCoords = ref<Coordinates | null>(null);
const selectedSignalement = ref<Signalement | null>(null);
const showToast = ref(false);
const toastMessage = ref('');
const toastColor = ref('primary');

// Computed
const filteredSignalements = computed(() => {
  if (!showMySignalements.value) {
    return signalements.value;
  }
  const currentUserId = auth.currentUser?.uid;
  return signalements.value.filter(s => s.userId === currentUserId);
});

// Méthodes
const loadSignalements = async () => {
  loading.value = true;
  try {
    signalements.value = await getTousLesSignalements();
  } catch (error) {
    console.error('Erreur chargement signalements:', error);
    showNotification('Erreur lors du chargement des signalements', 'danger');
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  await firebaseLogout();
  router.push('/login');
};

const toggleFilter = () => {
  showMySignalements.value = !showMySignalements.value;
};

const toggleRecap = () => {
  showRecap.value = !showRecap.value;
};

const handleMarkerPlaced = (coords: Coordinates) => {
  selectedCoords.value = coords;
  showNotification('Position sélectionnée. Appuyez sur + pour signaler.', 'primary');
};

const openSignalementForm = () => {
  if (!selectedCoords.value) {
    showNotification('Touchez la carte pour sélectionner une position', 'warning');
    return;
  }
  showSignalementForm.value = true;
};

const closeSignalementForm = () => {
  showSignalementForm.value = false;
};

const handleSignalementSuccess = async () => {
  selectedCoords.value = null;
  mapRef.value?.removeTempMarker();
  await loadSignalements();
  showNotification('Signalement créé avec succès !', 'success');
};

const handleSignalementClick = (signalement: Signalement) => {
  selectedSignalement.value = signalement;
  showSignalementDetail.value = true;
};

const closeSignalementDetail = () => {
  showSignalementDetail.value = false;
  selectedSignalement.value = null;
};

const showNotification = (message: string, color: string = 'primary') => {
  toastMessage.value = message;
  toastColor.value = color;
  showToast.value = true;
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

// Lifecycle
onMounted(() => {
  loadSignalements();
});
</script>

<style scoped>
.map-container {
  height: calc(100% - 120px);
  width: 100%;
}

.recap-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--ion-background-color);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  transform: translateY(calc(100% - 50px));
  z-index: 100;
}

.recap-container.expanded {
  transform: translateY(0);
}

.recap-handle {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  cursor: pointer;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: var(--ion-color-medium);
  border-radius: 2px;
  margin-bottom: 5px;
}

.recap-handle span {
  font-size: 12px;
  color: var(--ion-color-medium);
}

ion-fab[vertical="bottom"][horizontal="start"] {
  left: 16px;
  bottom: 70px;
}
</style>