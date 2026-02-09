# 📸 Fonctionnalité Photos - Documentation

## 🎯 Vue d'ensemble

Ce document décrit la fonctionnalité complète de gestion des photos pour les signalements routiers.

## 📋 Fonctionnalités implémentées

### ✅ Upload de photos
- **Drag & drop** des photos directement dans l'interface
- **Sélection multiple** jusqu'à 5 photos par signalement
- **Prévisualisation** avant upload
- **Validation automatique** (type, taille maximale 5MB)
- **Formats supportés** : JPG, PNG, GIF

### ✅ Stockage Firebase
- **Upload automatique** vers Firebase Storage
- **Organisation par utilisateur** et signalement
- **URLs générées** automatiquement pour l'affichage
- **Gestion des erreurs** d'upload

### ✅ Interface utilisateur
- **Composant PhotoUpload** réutilisable
- **Intégration** dans le formulaire de signalement
- **Feedback visuel** pendant l'upload
- **Messages d'erreur** clairs

## 🗂️ Structure des fichiers

```
src/
├── services/
│   └── storage.service.ts     # Service Firebase Storage
├── components/
│   ├── PhotoUpload.vue         # Composant upload photos
│   └── SignalementForm.vue     # Formulaire avec photos
└── types/
    └── firebase.types.ts       # Types PhotoData
```

## 🔧 Utilisation

### Dans le formulaire de signalement

```vue
<template>
  <PhotoUpload 
    ref="photoUploadRef"
    :maxPhotos="5"
    @photos-uploaded="handlePhotosUploaded" />
</template>

<script setup>
import PhotoUpload from './PhotoUpload.vue';

const handlePhotosUploaded = (photos) => {
  console.log('Photos uploadées:', photos);
};
</script>
```

### Service Storage

```typescript
import { StorageService } from '@/services/storage.service';

// Upload une photo
const photoData = await StorageService.uploadPhoto(
  'signalement-id', 
  file, 
  'user-id'
);

// Upload plusieurs photos
const photos = await StorageService.uploadMultiplePhotos(
  'signalement-id', 
  files, 
  'user-id'
);
```

## 📱 Flux utilisateur

1. **Sélectionner des photos** : Glisser-déposer ou cliquer
2. **Prévisualiser** : Voir les photos avant envoi
3. **Valider** : Vérification automatique du format/taille
4. **Uploader** : Envoi vers Firebase Storage
5. **Sauvegarder** : Les URLs sont stockées avec le signalement

## 🔒 Sécurité

- **Validation des types** de fichiers
- **Limite de taille** (5MB par photo)
- **Nombre maximum** de photos (5)
- **Stockage sécurisé** dans Firebase Storage
- **Isolation par utilisateur**

## 📊 Stockage

### Structure Firebase Storage

```
signalements/
├── {userId}/
│   └── {signalementId}/
│       ├── timestamp_photo1.jpg
│       ├── timestamp_photo2.jpg
│       └── ...
```

### Données stockées

Chaque photo contient :
- `url` : URL de téléchargement publique
- `name` : Nom du fichier
- `path` : Chemin complet dans Storage
- `uploadedAt` : Date d'upload

## 🚀 Déploiement

### Variables d'environnement

Aucune configuration supplémentaire requise - utilise la configuration Firebase existante.

### Permissions

Les permissions Firebase Storage sont automatiquement gérées par les règles existantes.

## 📝️ Notes techniques

### Compatibilité
- **Navigateurs modernes** avec support File API
- **Mobile** via Ionic/Capacitor
- **Firebase Storage** pour le stockage

### Performance
- **Upload progressif** avec feedback visuel
- **Compression** automatique recommandée
- **Cache** des URLs pour affichage rapide

### Limites
- **5 photos** maximum par signalement
- **5MB** maximum par photo
- **Formats** : JPG, PNG, GIF uniquement

## 🔄 Évolutions possibles

1. **Compression automatique** des photos
2. **Édition** de photos (crop, rotation)
3. **Stockage local** temporaire
4. **Sync** avec galerie du téléphone
5. **Métadonnées** EXIF des photos

## 🐛 Dépannage

### Erreurs communes
- **Type non supporté** : Utiliser JPG/PNG/GIF
- **Fichier trop gros** : Maximum 5MB
- **Upload échoué** : Vérifier connexion internet

### Solutions
- Vérifier la **console** pour les erreurs détaillées
- Tester avec des **petites photos** d'abord
- Valider la **configuration Firebase**

---

**Version** : 1.0.0  
**Dernière mise à jour** : 05/02/2026  
**Auteur** : Assistant Cascade
