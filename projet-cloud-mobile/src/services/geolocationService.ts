import { Geolocation, Position } from '@capacitor/geolocation';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Coordonnées par défaut : Centre d'Antananarivo
export const DEFAULT_COORDS: Coordinates = {
  latitude: -18.8792,
  longitude: 47.5079
};

/**
 * Demande la permission de géolocalisation
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const permission = await Geolocation.requestPermissions();
    return permission.location === 'granted';
  } catch (error) {
    console.error('Erreur permission géolocalisation:', error);
    return false;
  }
};

/**
 * Vérifie si la permission de géolocalisation est accordée
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const permission = await Geolocation.checkPermissions();
    return permission.location === 'granted';
  } catch (error) {
    console.error('Erreur vérification permission:', error);
    return false;
  }
};

/**
 * Obtient la position actuelle de l'utilisateur
 */
export const getCurrentPosition = async (): Promise<Coordinates> => {
  try {
    const hasPermission = await checkLocationPermission();
    
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        console.warn('Permission géolocalisation refusée, utilisation position par défaut');
        return DEFAULT_COORDS;
      }
    }

    const position: Position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    console.error('Erreur géolocalisation:', error);
    return DEFAULT_COORDS;
  }
};

/**
 * Surveille la position en continu
 */
export const watchPosition = async (
  callback: (coords: Coordinates) => void,
  errorCallback?: (error: any) => void
): Promise<string> => {
  const watchId = await Geolocation.watchPosition(
    {
      enableHighAccuracy: true,
      timeout: 10000,
    },
    (position, err) => {
      if (err) {
        errorCallback?.(err);
        return;
      }
      if (position) {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      }
    }
  );

  return watchId;
};

/**
 * Arrête la surveillance de position
 */
export const clearWatch = async (watchId: string): Promise<void> => {
  await Geolocation.clearWatch({ id: watchId });
};
