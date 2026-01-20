<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Carte des signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showMySignalements = !showMySignalements">
            <ion-icon :icon="filterOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div id="map" style="height: 100%"></div>
      
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="addSignalement">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
      
      <div class="recap-card">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Récapitulatif</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Nombre de signalements: {{ stats.count }}</p>
            <p>Surface totale: {{ stats.totalSurface }} m²</p>
            <p>Budget total: {{ stats.totalBudget }} Ar</p>
            <p>Avancement: {{ stats.progress }}%</p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonButtons, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/vue';
import { addOutline, filterOutline } from 'ionicons/icons';
import L from 'leaflet';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const map = ref<L.Map | null>(null);
const signalements = ref([]);
const showMySignalements = ref(false);

const stats = computed(() => {
  const filtered = showMySignalements.value 
    ? signalements.value.filter((s: any) => s.user_id === authStore.user?.id)
    : signalements.value;
    
  return {
    count: filtered.length,
    totalSurface: filtered.reduce((sum: number, s: any) => sum + (s.surface_m2 || 0), 0),
    totalBudget: filtered.reduce((sum: number, s: any) => sum + (s.budget || 0), 0),
    progress: filtered.length > 0 
      ? Math.round((filtered.filter((s: any) => s.status === 'termine').length / filtered.length) * 100)
      : 0
  };
});

onMounted(async () => {
  // Initialize map centered on Antananarivo
  map.value = L.map('map').setView([-18.8792, 47.5079], 13);
  
  // Use local tile server
  L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value);
  
  await loadSignalements();
});

const loadSignalements = async () => {
  try {
    const response = showMySignalements.value 
      ? await api.getMySignalements()
      : await api.getSignalements();
    signalements.value = response.data;
    
    // Add markers
    signalements.value.forEach((s: any) => {
      const marker = L.marker([s.latitude, s.longitude]).addTo(map.value!);
      marker.bindPopup(`
        <b>Status:</b> ${s.status}<br>
        <b>Date:</b> ${new Date(s.created_at).toLocaleDateString()}<br>
        <b>Surface:</b> ${s.surface_m2 || 'N/A'} m²<br>
        <b>Budget:</b> ${s.budget || 'N/A'} Ar<br>
        <b>Entreprise:</b> ${s.entreprise || 'N/A'}
      `);
    });
  } catch (error) {
    console.error('Error loading signalements:', error);
  }
};

const addSignalement = async () => {
  // TODO: Open modal to add signalement
};
</script>

<style scoped>
.recap-card {
  position: absolute;
  top: 70px;
  right: 10px;
  z-index: 1000;
  max-width: 300px;
}
</style>
