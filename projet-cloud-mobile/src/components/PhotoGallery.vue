<template>
  <div class="photo-gallery">
    <!-- Bouton pour afficher/masquer les photos -->
    <ion-button 
      v-if="photos.length > 0"
      fill="clear" 
      size="small" 
      @click="toggleGallery"
      :color="showGallery ? 'primary' : 'medium'">
      <ion-icon :name="showGallery ? 'images' : 'images-outline'" slot="start"></ion-icon>
      {{ showGallery ? 'Masquer les photos' : `Voir ${photos.length} photo(s)` }}
    </ion-button>

    <!-- Galerie de photos -->
    <div v-if="showGallery && photos.length > 0" class="gallery-container">
      <div class="gallery-grid">
        <div 
          v-for="(photo, index) in photos" 
          :key="index"
          class="photo-item"
          @click="openPhoto(photo)">
          
          <img 
            :src="photo.url" 
            :alt="photo.name"
            class="photo-thumbnail"
            loading="lazy">
          
          <div class="photo-overlay">
            <ion-icon name="expand-outline"></ion-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour afficher une photo en plein écran -->
    <ion-modal 
      :is-open="selectedPhoto !== null"
      @did-dismiss="closePhoto">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ selectedPhoto?.name }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closePhoto">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="photo-modal-content">
        <div v-if="selectedPhoto" class="photo-fullscreen">
          <img 
            :src="selectedPhoto.url" 
            :alt="selectedPhoto.name"
            class="photo-full">
          
          <div class="photo-info">
            <p><strong>Nom:</strong> {{ selectedPhoto.name }}</p>
            <p><strong>Taille:</strong> {{ formatFileSize(selectedPhoto.size || 0) }}</p>
            <p><strong>Date:</strong> {{ formatDate(selectedPhoto.uploadedAt) }}</p>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonContent 
} from '@ionic/vue';

interface PhotoData {
  url: string;
  name: string;
  base64?: string;
  uploadedAt?: Date;
  size?: number;
}

const props = defineProps<{
  photos: PhotoData[];
}>();

const showGallery = ref(false);
const selectedPhoto = ref<PhotoData | null>(null);

const toggleGallery = () => {
  showGallery.value = !showGallery.value;
};

const openPhoto = (photo: PhotoData) => {
  selectedPhoto.value = photo;
};

const closePhoto = () => {
  selectedPhoto.value = null;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date?: Date): string => {
  if (!date) return 'Inconnue';
  return new Date(date).toLocaleString('fr-FR');
};
</script>

<style scoped>
.photo-gallery {
  margin: 16px 0;
}

.gallery-container {
  margin-top: 12px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
}

.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.photo-item:hover {
  transform: scale(1.05);
}

.photo-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-overlay ion-icon {
  color: white;
  font-size: 24px;
}

.photo-modal-content {
  --background: var(--ion-color-dark);
}

.photo-fullscreen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 16px;
}

.photo-full {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.photo-info {
  text-align: center;
  color: var(--ion-color-light);
  background: var(--ion-color-dark);
  padding: 16px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
}

.photo-info p {
  margin: 4px 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
    padding: 8px;
  }
  
  .photo-fullscreen {
    padding: 12px;
  }
}
</style>
