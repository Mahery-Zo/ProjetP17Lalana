// Service de caméra avec fallback web
export interface CameraPhoto {
  dataUrl: string;
  fileName: string;
  fileSize: number;
}

export class CameraService {
  /**
   * Prend une photo avec l'appareil photo (fallback web)
   */
  static async takePhoto(): Promise<CameraPhoto> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const dataUrl = await this.fileToBase64(file);
            resolve({
              dataUrl,
              fileName: `camera_${new Date().getTime()}.${file.type.split('/')[1]}`,
              fileSize: file.size
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Aucune photo sélectionnée'));
        }
      };
      
      input.oncancel = () => {
        reject(new Error('Sélection annulée'));
      };
      
      input.click();
    });
  }

  /**
   * Choisit une photo depuis la galerie (fallback web)
   */
  static async pickFromGallery(): Promise<CameraPhoto> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const dataUrl = await this.fileToBase64(file);
            resolve({
              dataUrl,
              fileName: `gallery_${new Date().getTime()}.${file.type.split('/')[1]}`,
              fileSize: file.size
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('Aucune photo sélectionnée'));
        }
      };
      
      input.oncancel = () => {
        reject(new Error('Sélection annulée'));
      };
      
      input.click();
    });
  }

  /**
   * Convertit dataURL en File
   */
  static dataUrlToFile(dataUrl: string, fileName: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], fileName, {type: mime});
  }

  /**
   * Convertit File en base64
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
   * Estime la taille du fichier depuis dataURL
   */
  private static estimateFileSize(dataUrl: string): number {
    // Approximation: base64 augmente la taille de ~33%
    const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
    return Math.round(base64Length * 0.75);
  }

  /**
   * Vérifie si l'appareil photo est disponible
   */
  static async isCameraAvailable(): Promise<boolean> {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  }

  /**
   * Demande les permissions pour la caméra (web)
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur permission caméra:', error);
      return false;
    }
  }
}
