<template>
  <div class="photo-upload">
    <ion-card>
      <ion-card-header>
        <ion-card-title>Photos du signalement</ion-card-title>
        <ion-card-subtitle>Ajoutez jusqu'à 5 photos</ion-card-subtitle>
      </ion-card-header>
      
      <ion-card-content>
        <!-- Zone de drag & drop -->
        <div 
          class="upload-zone"
          :class="{ 'drag-over': isDragOver }"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          @click="triggerFileInput">
          
          <ion-icon name="camera-outline" size="large"></ion-icon>
          <p>Cliquez ou glissez les photos ici</p>
          <p class="upload-info">
            JPG, PNG, GIF - Max 1MB par photo (compression automatique)
          </p>
          
          <!-- Boutons caméra/galerie -->
          <div class="camera-actions">
            <ion-button 
              size="small" 
              fill="outline"
              @click.stop="takePhoto">
              <ion-icon name="camera" slot="start"></ion-icon>
              Caméra
            </ion-button>
            <ion-button 
              size="small" 
              fill="outline"
              @click.stop="pickFromGallery">
              <ion-icon name="images" slot="start"></ion-icon>
              Galerie
            </ion-button>
          </div>
          
          <input 
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            @change="handleFileSelect"
            style="display: none;">
        </div>

        <!-- Prévisualisation des photos -->
        <div v-if="previewPhotos.length > 0" class="preview-container">
          <div 
            v-for="(photo, index) in previewPhotos" 
            :key="index"
            class="photo-preview">
            
            <img :src="photo.url" :alt="photo.name">
            
            <div class="photo-actions">
              <ion-button 
                size="small" 
                fill="clear" 
                color="danger"
                @click="removePhoto(index)">
                <ion-icon name="trash"></ion-icon>
              </ion-button>
            </div>
            
            <div class="photo-info">
              <p class="photo-name">{{ photo.name }}</p>
              <p class="photo-size">{{ formatFileSize(photo.size) }}</p>
            </div>
          </div>
        </div>

        <!-- Erreurs -->
        <ion-alert
          :is-open="showError"
          header="Erreur"
          :message="errorMessage"
          :buttons="['OK']"
          @didDismiss="showError = false">
        </ion-alert>

        <!-- Loading -->
        <ion-loading
          :is-open="uploading"
          message="Upload des photos en cours...">
        </ion-loading>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonAlert,
  IonLoading
} from '@ionic/vue';
import { FirestoreStorageService, type PhotoData } from '../services/storage.service';

// Import pour la caméra (web fallback)
import { CameraService } from '../services/camera.service';

interface PreviewPhoto {
  file: File;
  url: string;
  name: string;
  size: number;
}

const props = defineProps<{
  maxPhotos?: number;
  existingPhotos?: PhotoData[];
}>();

const emit = defineEmits<{
  photosUploaded: [photos: PhotoData[]];
  photosRemoved: [removedPhotos: PhotoData[]];
}>();

const fileInput = ref<HTMLInputElement>();
const isDragOver = ref(false);
const previewPhotos = ref<PreviewPhoto[]>([]);
const uploading = ref(false);
const showError = ref(false);
const errorMessage = ref('');

const maxPhotos = props.maxPhotos || 5;

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = event.dataTransfer?.files;
  if (files) {
    handleFiles(files);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files) {
    handleFiles(files);
  }
};

const handleFiles = async (files: FileList) => {
  const filesArray = Array.from(files);
  
  // Vérifier le nombre maximum de photos
  if (previewPhotos.value.length + filesArray.length > maxPhotos) {
    showError.value = true;
    errorMessage.value = `Maximum ${maxPhotos} photos autorisées`;
    return;
  }

  // Valider chaque fichier
  const validFiles: File[] = [];
  for (const file of filesArray) {
    const validation = FirestoreStorageService.validatePhotoFile(file);
    if (!validation.valid) {
      showError.value = true;
      errorMessage.value = validation.error || 'Erreur de validation';
      continue;
    }
    validFiles.push(file);
  }

  // Ajouter les fichiers valides à la prévisualisation
  for (const file of validFiles) {
    const base64 = await FirestoreStorageService.fileToBase64(file);
    previewPhotos.value.push({
      file,
      url: base64,
      name: file.name,
      size: file.size
    });
  }
};

const removePhoto = (index: number) => {
  previewPhotos.value.splice(index, 1);
};

const takePhoto = async () => {
  try {
    // Vérifier si Capacitor Camera est disponible
    if (typeof navigator !== 'undefined' && 'mediaDevices' in navigator) {
      // Fallback web: utiliser input file avec capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          await handleSingleFile(file);
        }
      };
      input.click();
    } else {
      // Utiliser Capacitor Camera si disponible
      const cameraPhoto = await CameraService.takePhoto();
      const file = CameraService.dataUrlToFile(cameraPhoto.dataUrl, cameraPhoto.fileName);
      await handleSingleFile(file);
    }
  } catch (error) {
    console.error('Erreur caméra:', error);
    showError.value = true;
    errorMessage.value = 'Impossible d\'accéder à la caméra';
  }
};

const pickFromGallery = async () => {
  try {
    // Vérifier si Capacitor Camera est disponible
    if (typeof navigator !== 'undefined' && 'mediaDevices' in navigator) {
      // Fallback web: utiliser input file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        for (const file of files) {
          await handleSingleFile(file);
        }
      };
      input.click();
    } else {
      // Utiliser Capacitor Camera si disponible
      const cameraPhoto = await CameraService.pickFromGallery();
      const file = CameraService.dataUrlToFile(cameraPhoto.dataUrl, cameraPhoto.fileName);
      await handleSingleFile(file);
    }
  } catch (error) {
    console.error('Erreur galerie:', error);
    showError.value = true;
    errorMessage.value = 'Impossible d\'accéder à la galerie';
  }
};

const handleSingleFile = async (file: File) => {
  // Vérifier le nombre maximum de photos
  if (previewPhotos.value.length >= maxPhotos) {
    showError.value = true;
    errorMessage.value = `Maximum ${maxPhotos} photos autorisées`;
    return;
  }

  // Valider le fichier
  const validation = FirestoreStorageService.validatePhotoFile(file);
  if (!validation.valid) {
    showError.value = true;
    errorMessage.value = validation.error || 'Erreur de validation';
    return;
  }

  // Ajouter à la prévisualisation
  const base64 = await FirestoreStorageService.fileToBase64(file);
  previewPhotos.value.push({
    file,
    url: base64,
    name: file.name,
    size: file.size
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const uploadPhotos = async (signalementId: string, userId: string): Promise<PhotoData[]> => {
  if (previewPhotos.value.length === 0) {
    return [];
  }

  uploading.value = true;
  
  try {
    const files = previewPhotos.value.map(p => p.file);
    
    // Compresser les images si nécessaire
    const compressedFiles = await Promise.all(
      files.map(file => FirestoreStorageService.compressImage(file))
    );
    
    // Sauvegarder dans Firestore
    const uploadedPhotos = await FirestoreStorageService.saveMultiplePhotosToFirestore(
      signalementId, 
      compressedFiles, 
      userId
    );
    
    // Vider la prévisualisation après sauvegarde réussie
    previewPhotos.value = [];
    
    return uploadedPhotos;
    
  } catch (error) {
    showError.value = true;
    errorMessage.value = 'Erreur lors de la sauvegarde des photos';
    throw error;
  } finally {
    uploading.value = false;
  }
};

// Exposer les méthodes pour le composant parent
defineExpose({
  uploadPhotos,
  hasPhotos: () => previewPhotos.value.length > 0,
  clearPhotos: () => previewPhotos.value = []
});
</script>

<style scoped>
.photo-upload {
  margin: 16px 0;
}

.upload-zone {
  border: 2px dashed var(--ion-color-medium);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--ion-color-light);
}

.upload-zone:hover,
.upload-zone.drag-over {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-light-tint);
}

.upload-zone ion-icon {
  color: var(--ion-color-medium);
  margin-bottom: 16px;
}

.upload-info {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 8px;
}

.camera-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
}

.camera-actions ion-button {
  flex: 1;
  max-width: 120px;
}

.preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.photo-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.photo-preview img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.photo-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-info {
  padding: 8px;
  background: var(--ion-color-light);
}

.photo-name {
  font-size: 12px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-size {
  font-size: 11px;
  color: var(--ion-color-medium);
  margin: 4px 0 0 0;
}
</style>
