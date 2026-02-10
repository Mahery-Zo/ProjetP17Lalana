<template>
  <ion-modal :is-open="isOpen" @didDismiss="handleClose">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="handleClose">Annuler</ion-button>
        </ion-buttons>
        <ion-title>Nouveau Signalement</ion-title>
        <ion-buttons slot="end">
          <ion-button strong @click="submitForm" :disabled="!isValid || submitting">
            <span v-if="!submitting">Envoyer</span>
            <ion-spinner v-else name="dots" style="width: 20px;"></ion-spinner>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Coordonnées (lecture seule) -->
      <ion-item>
        <ion-label position="stacked">Localisation</ion-label>
        <ion-input 
          :value="`${coordinates?.latitude.toFixed(6)}, ${coordinates?.longitude.toFixed(6)}`"
          readonly
        ></ion-input>
      </ion-item>

      <!-- Description -->
      <ion-item>
        <ion-label position="stacked">Description du problème</ion-label>
        <ion-textarea
          v-model="form.description"
          placeholder="Décrivez le problème routier..."
          :rows="3"
          :maxlength="500"
        ></ion-textarea>
      </ion-item>
      <ion-note class="ion-padding-start" color="medium">
        {{ form.description.length }}/500 caractères
      </ion-note>

      <!-- Surface estimée -->
      <ion-item>
        <ion-label position="stacked">Surface estimée (m²)</ion-label>
        <ion-input
          v-model.number="form.surface_m2"
          type="number"
          placeholder="Ex: 10"
          min="0"
          step="0.5"
        ></ion-input>
      </ion-item>

      <!-- Photos -->
      <PhotoUpload 
        ref="photoUploadRef"
        :maxPhotos="5"
        @photos-uploaded="handlePhotosUploaded" />
      
      <!-- Aperçu de la carte -->
      <div class="map-preview">
        <div class="preview-title">Aperçu de la position</div>
        <div id="preview-map" ref="previewMapRef"></div>
      </div>

      <!-- Message d'erreur -->
      <ion-toast
        :is-open="showError"
        :message="errorMessage"
        duration="3000"
        color="danger"
        position="bottom"
        @didDismiss="showError = false"
      ></ion-toast>

      <!-- Message de succès -->
      <ion-toast
        :is-open="showSuccess"
        message="Signalement envoyé avec succès !"
        duration="2000"
        color="success"
        position="bottom"
        @didDismiss="handleSuccess"
      ></ion-toast>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonNote,
  IonIcon,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { addSignalement } from '@/services/firebaseService';
import { FirestoreStorageService, type PhotoData } from '@/services/storage.service';
import PhotoUpload from './PhotoUpload.vue';
import type { Coordinates } from '@/services/geolocationService';

// Props
const props = defineProps<{
  isOpen: boolean;
  coordinates: Coordinates | null;
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

// State
const previewMapRef = ref<HTMLElement | null>(null);
const photoUploadRef = ref<InstanceType<typeof PhotoUpload> | null>(null);
let previewMap: L.Map | null = null;
let previewMarker: L.Marker | null = null;

const form = ref({
  description: '',
  surface_m2: null as number | null,
});

const uploadedPhotos = ref<PhotoData[]>([]);
const submitting = ref(false);
const showError = ref(false);
const errorMessage = ref('');
const showSuccess = ref(false);

// Computed
const isValid = computed(() => {
  return props.coordinates !== null;
});

// Méthodes
const handleClose = () => {
  resetForm();
  emit('close');
};

const handleSuccess = () => {
  showSuccess.value = false;
  handleClose();
  emit('success');
};

const resetForm = () => {
  form.value = {
    description: '',
    surface_m2: null,
  };
  uploadedPhotos.value = [];
  errorMessage.value = '';
  photoUploadRef.value?.clearPhotos();
};

const handlePhotosUploaded = (photos: PhotoData[]) => {
  uploadedPhotos.value = photos;
  console.log('Photos uploadées:', photos);
};

const takePhoto = () => {
  // Fonctionnalité maintenant intégrée via PhotoUpload
  console.log('Utiliser le composant PhotoUpload pour ajouter des photos');
};

const submitForm = async () => {
  if (!props.coordinates) {
    errorMessage.value = 'Veuillez sélectionner une position sur la carte';
    showError.value = true;
    return;
  }

  submitting.value = true;

  try {
    // Upload des photos d'abord
    let photos: PhotoData[] = [];
    if (photoUploadRef.value?.hasPhotos()) {
      const userId = localStorage.getItem('userId') || 'anonymous';
      
      // Créer d'abord le signalement pour obtenir l'ID
      const signalementData = {
        latitude: props.coordinates.latitude,
        longitude: props.coordinates.longitude,
        description: form.value.description || undefined,
        surface_m2: form.value.surface_m2 || undefined,
        status: 'nouveau' as const,
        photos: [] // Sera mis à jour après
      };
      
      console.log('Création signalement avec données:', signalementData);
      const signalementResult = await addSignalement(signalementData);
      const signalementId = signalementResult.id;
      
      console.log('Signalement créé avec ID:', signalementId);
      console.log('Type de signalementId:', typeof signalementId);
      console.log('Valeur signalementId:', signalementId);
      
      // Maintenant sauvegarder les photos avec le bon ID
      photos = await photoUploadRef.value.uploadPhotos(signalementId, userId);
      
      console.log('Photos sauvegardées:', photos);
      
      // Mettre à jour le signalement avec les photos
      // Note: Cette étape est optionnelle car les photos sont déjà dans Firestore
    } else {
      // Pas de photos, créer le signalement directement
      await addSignalement({
        latitude: props.coordinates.latitude,
        longitude: props.coordinates.longitude,
        description: form.value.description || undefined,
        surface_m2: form.value.surface_m2 || undefined,
        status: 'nouveau' as const
      });
    }

    showSuccess.value = true;
  } catch (error: any) {
    console.error('Erreur envoi signalement:', error);
    errorMessage.value = error.message || 'Erreur lors de l\'envoi du signalement';
    showError.value = true;
  } finally {
    submitting.value = false;
  }
};

// Initialiser la mini-carte d'aperçu
const initPreviewMap = () => {
  if (!previewMapRef.value || !props.coordinates) return;

  // Nettoyer l'ancienne carte
  if (previewMap) {
    previewMap.remove();
    previewMap = null;
  }

  previewMap = L.map(previewMapRef.value, {
    center: [props.coordinates.latitude, props.coordinates.longitude],
    zoom: 17,
    zoomControl: false,
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OSM',
    maxZoom: 19,
  }).addTo(previewMap);

  const markerIcon = L.divIcon({
    className: 'preview-marker',
    html: `<div style="
      background-color: #9c27b0;
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  previewMarker = L.marker(
    [props.coordinates.latitude, props.coordinates.longitude],
    { icon: markerIcon }
  ).addTo(previewMap);
};

// Watcher pour initialiser la carte quand le modal s'ouvre
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.coordinates) {
    await nextTick();
    setTimeout(() => {
      initPreviewMap();
    }, 100);
  }
});

// Watcher pour mettre à jour la position
watch(() => props.coordinates, (newCoords) => {
  if (previewMap && previewMarker && newCoords) {
    previewMarker.setLatLng([newCoords.latitude, newCoords.longitude]);
    previewMap.setView([newCoords.latitude, newCoords.longitude], 17);
  }
});
</script>

<style scoped>
.map-preview {
  margin-top: 20px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--ion-color-light-shade);
}

.preview-title {
  background: var(--ion-color-light);
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-color-medium);
}

#preview-map {
  width: 100%;
  height: 150px;
}

:global(.preview-marker) {
  background: transparent;
  border: none;
}
</style>
