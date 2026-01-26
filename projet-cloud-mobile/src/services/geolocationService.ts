import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

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
 * Vérifie si on est sur une plateforme native
 */
const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Demande la permission de géolocalisation
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    // Sur le web, utiliser l'API native du navigateur
    if (!isNativePlatform()) {
      return new Promise((resolve) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          );
        } else {
          resolve(false);
        }
      });
    }
    
    // Sur Android/iOS, utiliser Capacitor
    const permission = await Geolocation.requestPermissions();
    console.log('Permission result:', permission);
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
    if (!isNativePlatform()) {
      // Sur le web, on ne peut pas vraiment checker, on essaie juste
      return true;
    }
    
    const permission = await Geolocation.checkPermissions();
    console.log('Check permission:', permission);
    return permission.location === 'granted';
  } catch (error) {
    console.error('Erreur vérification permission:', error);
    return false;
  }
};

/**
 * Obtient la position actuelle de l'utilisateur via l'API Web
 */
const getWebPosition = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Web geolocation error:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Obtient la position actuelle de l'utilisateur
 */
export const getCurrentPosition = async (): Promise<Coordinates> => {
  try {
    console.log('Getting current position...');
    console.log('Is native platform:', isNativePlatform());

    // Sur le web (développement), utiliser l'API navigateur
    if (!isNativePlatform()) {
      console.log('Using web geolocation API');
      try {
        const coords = await getWebPosition();
        console.log('Web position obtained:', coords);
        return coords;
      } catch (webError) {
        console.warn('Web geolocation failed, using default:', webError);
        return DEFAULT_COORDS;
      }
    }

    // Sur plateforme native (Android/iOS)
    console.log('Using Capacitor Geolocation');
    
    // Demander la permission d'abord
    const hasPermission = await checkLocationPermission();
    console.log('Has permission:', hasPermission);
    
    if (!hasPermission) {
      console.log('Requesting permission...');
      const granted = await requestLocationPermission();
      console.log('Permission granted:', granted);
      
      if (!granted) {
        console.warn('Permission géolocalisation refusée, utilisation position par défaut');
        return DEFAULT_COORDS;
      }
    }

    const position: Position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });

    console.log('Native position obtained:', position.coords);

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
