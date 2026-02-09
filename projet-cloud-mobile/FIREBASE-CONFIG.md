# Configuration Firebase pour le Module Mobile

## 1. Structure des Collections Firestore

### Collection: `signalements`
Stocke tous les signalements de problèmes routiers.

```typescript
{
  id: string,                    // ID auto-généré par Firestore
  userId: string,                // UID Firebase de l'utilisateur
  latitude: number,              // Latitude GPS
  longitude: number,             // Longitude GPS
  description?: string,          // Description du problème
  status: 'nouveau' | 'en_cours' | 'termine',
  surface_m2?: number,           // Surface en m²
  budget?: number,               // Budget estimé
  entrepriseId?: string,         // ID de l'entreprise assignée
  entreprise?: string,           // Nom de l'entreprise (dénormalisé)
  photoUrl?: string,             // URL de la photo (Firebase Storage)
  synced: boolean,               // Synchronisé avec l'API Laravel
  createdAt: Timestamp,          // Date de création
  updatedAt: Timestamp           // Date de mise à jour
}
```

### Collection: `entreprises`
Liste des entreprises (synchronisée depuis l'API Laravel).

```typescript
{
  id: string,                    // ID de l'entreprise
  nom: string,                   // Nom de l'entreprise
  contact?: string,              // Personne de contact
  email?: string,                // Email
  telephone?: string,            // Téléphone
  adresse?: string,              // Adresse
  active: boolean,               // Entreprise active
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `users` (optionnelle)
Profils utilisateurs étendus.

```typescript
{
  uid: string,                   // UID Firebase
  email: string,                 // Email
  displayName?: string,          // Nom d'affichage
  role: 'visitor' | 'user',      // Rôle (manager uniquement sur web)
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 2. Configuration des Règles de Sécurité

Les règles sont définies dans `firestore.rules` à la racine du projet.

### Déploiement des règles:
```bash
firebase deploy --only firestore:rules
```

### Déploiement des indexes:
```bash
firebase deploy --only firestore:indexes
```

## 3. Configuration Firebase Storage (pour les photos)

### Règles de stockage (`storage.rules`):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /signalements/{userId}/{imageId} {
      // Permet la lecture à tous les utilisateurs authentifiés
      allow read: if request.auth != null;
      
      // Permet l'upload uniquement au propriétaire
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 4. Étapes de Configuration dans la Console Firebase

### A. Firestore Database
1. Aller dans **Firebase Console** → votre projet
2. **Firestore Database** → **Créer une base de données**
3. Choisir le mode **Production** (règles strictes)
4. Sélectionner la région (ex: `europe-west1` pour l'Europe)

### B. Règles de Sécurité Firestore
1. **Firestore Database** → onglet **Règles**
2. Copier le contenu de `firestore.rules`
3. Cliquer sur **Publier**

### C. Indexes Firestore
1. **Firestore Database** → onglet **Index**
2. Les indexes composites seront créés automatiquement ou déployés via Firebase CLI

### D. Authentication
1. **Authentication** → **Sign-in method**
2. Activer **Email/Password**
3. (Optionnel) Activer **Google Sign-In** pour le futur

### E. Storage (pour les photos)
1. **Storage** → **Démarrer**
2. Choisir le mode **Production**
3. Sélectionner la même région que Firestore
4. Configurer les règles dans l'onglet **Règles**

## 5. Installation Firebase CLI (si pas encore fait)

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Sélectionner:
- [x] Firestore
- [x] Storage
- [x] Hosting (optionnel)

## 6. Variables d'Environnement

Créer `.env.local` dans `projet-cloud-mobile/`:

```env
VITE_FIREBASE_API_KEY=AIzaSyDdsICr1naPeL94VP19ULy3Hpm3eeaL35s
VITE_FIREBASE_AUTH_DOMAIN=projet-cloud-s5-47ed8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projet-cloud-s5-47ed8
VITE_FIREBASE_STORAGE_BUCKET=projet-cloud-s5-47ed8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=311369941585
VITE_FIREBASE_APP_ID=1:311369941585:web:3f2f8e18b4278ccb912e70
```

## 7. Tests de Configuration

### Tester l'authentification:
```typescript
import { auth } from '@/firebase';
const user = auth.currentUser;
console.log('User:', user);
```

### Tester Firestore:
```typescript
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
const snapshot = await getDocs(collection(db, 'signalements'));
console.log('Documents:', snapshot.size);
```

## 8. Synchronisation avec l'API Laravel

Le manager (app web) va:
1. Créer des utilisateurs dans Firebase Authentication
2. Synchroniser les entreprises vers Firestore
3. Synchroniser les signalements modifiés (statut, entreprise) vers Firestore

L'app mobile va:
1. Lire tous les signalements depuis Firestore
2. Créer de nouveaux signalements dans Firestore
3. Filtrer "mes signalements" par `userId`

## 9. Mode Offline (bonus)

Firestore supporte automatiquement le mode offline:

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Persistence failed: multiple tabs open');
  } else if (err.code == 'unimplemented') {
    console.warn('Persistence not available');
  }
});
```
