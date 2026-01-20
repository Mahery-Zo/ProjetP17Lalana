// Configuration de l'application
// Copier ce fichier en config.ts et remplir avec vos vraies valeurs

export const config = {
  // API Backend
  apiUrl: 'http://localhost:8000/api',
  
  // Firebase (optionnel)
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
  },
  
  // Tile Server
  tileServerUrl: 'http://localhost:8080/tile/{z}/{x}/{y}.png',
};
