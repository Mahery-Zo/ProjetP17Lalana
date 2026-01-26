<template>
  <div class="map-wrapper">
    <div id="map" ref="mapContainer"></div>
    
    <!-- Bouton de localisation -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="locate-fab">
      <ion-fab-button size="small" @click="centerOnUser" :disabled="locating">
        <ion-icon :name="locating ? 'hourglass-outline' : 'locate-outline'"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <!-- Indicateur de chargement -->
    <div v-if="loading" class="map-loading">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Chargement de la carte...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { IonFab, IonFabButton, IonIcon, IonSpinner } from '@ionic/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCurrentPosition, DEFAULT_COORDS, type Coordinates } from '@/services/geolocationService';
import type { Signalement } from '@/types/firebase.types';

// Props
const props = defineProps<{
  signalements?: Signalement[];
  allowMarkerPlacement?: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: 'markerPlaced', coords: Coordinates): void;
  (e: 'signalementClick', signalement: Signalement): void;
}>();

// Refs
const mapContainer = ref<HTMLElement | null>(null);
const loading = ref(true);
const locating = ref(false);

// Map state
let map: L.Map | null = null;
let userMarker: L.Marker | null = null;
let tempMarker: L.Marker | null = null;
let signalementMarkers: L.Marker[] = [];

// Icônes personnalisées
const createIcon = (color: string, iconName: string = 'alert-circle') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <ion-icon name="${iconName}" style="
        transform: rotate(45deg);
        color: white;
        font-size: 16px;
      "></ion-icon>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const statusColors: Record<string, string> = {
  nouveau: '#f44336',      // Rouge
  en_cours: '#ff9800',     // Orange
  termine: '#4caf50',      // Vert
};

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `<div style="
    background-color: #2196f3;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const tempIcon = L.divIcon({
  className: 'temp-marker',
  html: `<div style="
    background-color: #9c27b0;
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 3px 8px rgba(0,0,0,0.4);
    animation: pulse 1s infinite;
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Initialisation de la carte
const initMap = async () => {
  if (!mapContainer.value) return;

  // Obtenir la position de l'utilisateur
  const userCoords = await getCurrentPosition();

  // Créer la carte
  map = L.map(mapContainer.value, {
    center: [userCoords.latitude, userCoords.longitude],
    zoom: 15,
    zoomControl: false,
  });

  // Ajouter les contrôles de zoom en haut à droite
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Ajouter la couche OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  // Ajouter le marqueur de l'utilisateur
  userMarker = L.marker([userCoords.latitude, userCoords.longitude], {
    icon: userIcon,
  }).addTo(map);
  userMarker.bindPopup('Vous êtes ici');

  // Gestionnaire de clic pour placer un marqueur
  if (props.allowMarkerPlacement) {
    map.on('click', (e: L.LeafletMouseEvent) => {
      placeTempMarker(e.latlng.lat, e.latlng.lng);
    });
  }

  loading.value = false;

  // Afficher les signalements existants
  if (props.signalements) {
    displaySignalements(props.signalements);
  }
};

// Placer un marqueur temporaire
const placeTempMarker = (lat: number, lng: number) => {
  if (!map) return;

  // Supprimer l'ancien marqueur temporaire
  if (tempMarker) {
    map.removeLayer(tempMarker);
  }

  // Créer le nouveau marqueur
  tempMarker = L.marker([lat, lng], { icon: tempIcon }).addTo(map);
  tempMarker.bindPopup('Nouveau signalement ici').openPopup();

  emit('markerPlaced', { latitude: lat, longitude: lng });
};

// Supprimer le marqueur temporaire
const removeTempMarker = () => {
  if (tempMarker && map) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
};

// Afficher les signalements
const displaySignalements = (signalements: Signalement[]) => {
  if (!map) return;

  // Supprimer les anciens marqueurs
  signalementMarkers.forEach(marker => map!.removeLayer(marker));
  signalementMarkers = [];

  // Ajouter les nouveaux marqueurs
  signalements.forEach(signalement => {
    const color = statusColors[signalement.status] || statusColors.nouveau;
    const marker = L.marker([signalement.latitude, signalement.longitude], {
      icon: createIcon(color),
    }).addTo(map!);

    // Popup avec informations
    const popupContent = `
      <div style="min-width: 150px;">
        <strong>Signalement</strong><br>
        <small>Status: <span style="color: ${color}; font-weight: bold;">
          ${signalement.status.replace('_', ' ')}
        </span></small><br>
        ${signalement.description ? `<small>${signalement.description}</small><br>` : ''}
        ${signalement.surface_m2 ? `<small>Surface: ${signalement.surface_m2} m²</small><br>` : ''}
        ${signalement.budget ? `<small>Budget: ${signalement.budget.toLocaleString()} Ar</small>` : ''}
      </div>
    `;
    marker.bindPopup(popupContent);

    // Clic sur le marqueur
    marker.on('click', () => {
      emit('signalementClick', signalement);
    });

    signalementMarkers.push(marker);
  });
};

// Centrer sur l'utilisateur
const centerOnUser = async () => {
  if (!map) return;

  locating.value = true;
  const coords = await getCurrentPosition();

  // Mettre à jour la position du marqueur utilisateur
  if (userMarker) {
    userMarker.setLatLng([coords.latitude, coords.longitude]);
  }

  // Centrer la carte
  map.setView([coords.latitude, coords.longitude], 16);
  locating.value = false;
};

// Watcher pour les signalements
watch(() => props.signalements, (newSignalements) => {
  if (newSignalements) {
    displaySignalements(newSignalements);
  }
}, { deep: true });

// Lifecycle
onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

// Exposer des méthodes
defineExpose({
  centerOnUser,
  placeTempMarker,
  removeTempMarker,
});
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

#map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.locate-fab {
  margin-bottom: 20px;
  margin-right: 10px;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 10px;
}

:global(.custom-marker),
:global(.user-marker),
:global(.temp-marker) {
  background: transparent;
  border: none;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.4);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(156, 39, 176, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(156, 39, 176, 0);
  }
}
</style>
