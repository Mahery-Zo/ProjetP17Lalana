import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface PhotoData {
  url: string;
  name: string;
  base64: string;
  uploadedAt: Date;
  size: number;
}

export class FirestoreStorageService {
  /**
   * Sauvegarde une photo en base64 dans Firestore
   */
  static async savePhotoToFirestore(
    signalementId: string, 
    file: File, 
    userId: string
  ): Promise<PhotoData> {
    try {
      // Vérifier que signalementId n'est pas vide
      if (!signalementId || signalementId.trim() === '') {
        throw new Error('ID de signalement invalide');
      }
      
      console.log('Tentative sauvegarde photo pour signalement:', signalementId);
      
      // Convertir en base64
      const base64 = await this.fileToBase64(file);
      
      // Créer les métadonnées
      const photoData: PhotoData = {
        url: base64, // Pour l'affichage direct
        name: file.name,
        base64: base64, // Pour sauvegarde complète
        uploadedAt: new Date(),
        size: file.size
      };
      
      console.log('Données photo à sauvegarder:', photoData);
      
      // Sauvegarder dans la sous-collection photos du signalement
      const photosRef = collection(db, 'signalements', signalementId, 'photos');
      console.log('Référence collection photos:', photosRef);
      
      const docRef = await addDoc(photosRef, photoData);
      console.log('Document photo créé avec ID:', docRef.id);
      
      console.log('Photo sauvegardée dans Firestore:', photoData);
      return photoData;
      
    } catch (error) {
      console.error('Erreur sauvegarde photo Firestore:', error);
      console.error('Détails erreur:', {
        signalementId,
        fileName: file.name,
        fileSize: file.size,
        error
      });
      throw new Error('Impossible de sauvegarder la photo');
    }
  }

  /**
   * Sauvegarde plusieurs photos
   */
  static async saveMultiplePhotosToFirestore(
    signalementId: string, 
    files: File[], 
    userId: string
  ): Promise<PhotoData[]> {
    const savePromises = files.map(file => 
      this.savePhotoToFirestore(signalementId, file, userId)
    );
    
    return Promise.all(savePromises);
  }

  /**
   * Convertit un fichier en base64
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Valide le type et la taille du fichier
   */
  static validatePhotoFile(file: File): { valid: boolean; error?: string } {
    // Types autorisés
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Type de fichier non autorisé. Utilisez JPG, PNG ou GIF.' 
      };
    }

    // Taille maximale (1MB pour Firestore)
    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: 'La photo ne doit pas dépasser 1MB pour Firestore.' 
      };
    }

    return { valid: true };
  }

  /**
   * Compresse une image avant de la convertir en base64
   */
  static compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner et compresser
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
}
