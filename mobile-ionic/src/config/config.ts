// Configuration de l'application
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

// Pour production, décommenter:
// export const config = {
//   apiUrl: 'https://api.lalana.mg/api',
//   firebase: { ... },
//   tileServerUrl: 'https://tiles.lalana.mg/tile/{z}/{x}/{y}.png',
// };
