import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface PhotoData {
  url: string;
  name: string;
  base64?: string;
  uploadedAt?: Date;
  size?: number;
}

export class SignalementPhotosService {
  /**
   * Récupère toutes les photos d'un signalement
   */
  static async getSignalementPhotos(signalementId: string): Promise<PhotoData[]> {
    try {
      const photosRef = collection(db, 'signalements', signalementId, 'photos');
      const q = query(photosRef, orderBy('uploadedAt', 'asc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data()
      } as PhotoData));
      
    } catch (error) {
      console.error('Erreur récupération photos signalement:', error);
      return [];
    }
  }

  /**
   * Vérifie si un signalement a des photos
   */
  static async hasSignalementPhotos(signalementId: string): Promise<boolean> {
    const photos = await this.getSignalementPhotos(signalementId);
    return photos.length > 0;
  }

  /**
   * Compte le nombre de photos d'un signalement
   */
  static async getPhotosCount(signalementId: string): Promise<number> {
    const photos = await this.getSignalementPhotos(signalementId);
    return photos.length;
  }

  /**
   * Récupère la première photo d'un signalement (pour les aperçus)
   */
  static async getFirstPhoto(signalementId: string): Promise<PhotoData | null> {
    const photos = await this.getSignalementPhotos(signalementId);
    return photos.length > 0 ? photos[0] : null;
  }

  /**
   * Récupère les N premières photos d'un signalement
   */
  static async getFirstPhotos(signalementId: string, limit: number = 3): Promise<PhotoData[]> {
    const photos = await this.getSignalementPhotos(signalementId);
    return photos.slice(0, limit);
  }
}
