<template>
  <ion-card class="recap-card">
    <ion-card-header>
      <ion-card-title>
        <ion-icon name="stats-chart-outline"></ion-icon>
        Récapitulatif
      </ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <div class="stats-grid">
        <!-- Nombre de points -->
        <div class="stat-item">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Signalements</div>
        </div>

        <!-- Surface totale -->
        <div class="stat-item">
          <div class="stat-value">{{ formatNumber(stats.totalSurface) }}</div>
          <div class="stat-label">Surface (m²)</div>
        </div>

        <!-- Avancement -->
        <div class="stat-item">
          <div class="stat-value">{{ stats.avancement }}%</div>
          <div class="stat-label">Terminés</div>
        </div>

        <!-- Budget total -->
        <div class="stat-item">
          <div class="stat-value">{{ formatBudget(stats.totalBudget) }}</div>
          <div class="stat-label">Budget (Ar)</div>
        </div>
      </div>

      <!-- Barre de progression -->
      <div class="progress-section">
        <div class="progress-labels">
          <span class="status-badge nouveau">{{ stats.nouveau }} nouveaux</span>
          <span class="status-badge en_cours">{{ stats.enCours }} en cours</span>
          <span class="status-badge termine">{{ stats.termine }} terminés</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-segment nouveau" 
            :style="{ width: getPercentage(stats.nouveau) + '%' }"
          ></div>
          <div 
            class="progress-segment en_cours" 
            :style="{ width: getPercentage(stats.enCours) + '%' }"
          ></div>
          <div 
            class="progress-segment termine" 
            :style="{ width: getPercentage(stats.termine) + '%' }"
          ></div>
        </div>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/vue';
import type { Signalement } from '@/types/firebase.types';

// Props
const props = defineProps<{
  signalements: Signalement[];
}>();

// Computed stats
const stats = computed(() => {
  const data = props.signalements || [];
  
  const nouveau = data.filter(s => s.status === 'nouveau').length;
  const enCours = data.filter(s => s.status === 'en_cours').length;
  const termine = data.filter(s => s.status === 'termine').length;
  const total = data.length;

  const totalSurface = data.reduce((sum, s) => sum + (s.surface_m2 || 0), 0);
  const totalBudget = data.reduce((sum, s) => sum + (s.budget || 0), 0);
  
  const avancement = total > 0 ? Math.round((termine / total) * 100) : 0;

  return {
    total,
    nouveau,
    enCours,
    termine,
    totalSurface,
    totalBudget,
    avancement,
  };
});

// Méthodes de formatage
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toFixed(0);
};

const formatBudget = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'Mrd';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'k';
  }
  return num.toFixed(0);
};

const getPercentage = (count: number): number => {
  const total = stats.value.total;
  return total > 0 ? (count / total) * 100 : 0;
};
</script>

<style scoped>
.recap-card {
  margin: 10px;
  border-radius: 12px;
}

.recap-card ion-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.stat-item {
  text-align: center;
  padding: 10px 5px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--ion-color-medium);
  margin-top: 4px;
}

.progress-section {
  margin-top: 10px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 5px;
}

.status-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  color: white;
}

.status-badge.nouveau {
  background-color: #f44336;
}

.status-badge.en_cours {
  background-color: #ff9800;
}

.status-badge.termine {
  background-color: #4caf50;
}

.progress-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--ion-color-light);
}

.progress-segment {
  transition: width 0.3s ease;
}

.progress-segment.nouveau {
  background-color: #f44336;
}

.progress-segment.en_cours {
  background-color: #ff9800;
}

.progress-segment.termine {
  background-color: #4caf50;
}

@media (max-width: 400px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
