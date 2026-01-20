# Guide d'Installation - Projet Lalana

## Installation Rapide (Windows)

### Étape 1: Installer Docker Desktop
1. Télécharger Docker Desktop: https://www.docker.com/products/docker-desktop
2. Installer et redémarrer l'ordinateur
3. Vérifier l'installation:
```cmd
docker --version
docker-compose --version
```

### Étape 2: Cloner et Démarrer le Projet

```cmd
cd ProjetP17Lalana

REM Démarrer tous les services Docker
docker-compose up -d

REM Attendre 2-3 minutes que tout démarre
```

### Étape 3: Configurer Laravel

```cmd
REM Entrer dans le container Laravel
docker exec -it lalana_api bash

REM Dans le container:
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed

REM Sortir du container
exit
```

### Étape 4: Tester l'API

Ouvrir un navigateur: http://localhost:8000

Ou tester avec curl:
```cmd
curl -X POST http://localhost:8000/api/login -H "Content-Type: application/json" -d "{\"email\":\"manager@lalana.mg\",\"password\":\"manager123\"}"
```

### Étape 5: Installer l'Application Mobile

```cmd
cd mobile-ionic

REM Installer Node.js si nécessaire: https://nodejs.org/

npm install

REM Créer le fichier .env
echo VITE_API_URL=http://localhost:8000/api > .env

REM Lancer en mode dev
npm run dev
```

Ouvrir: http://localhost:5173

## Build APK Android

### Prérequis
- Android Studio installé
- Java JDK 11+

### Commandes

```cmd
cd mobile-ionic

npm run build
npx cap add android
npx cap sync
npx cap open android
```

Dans Android Studio:
1. Build > Build Bundle(s) / APK(s) > Build APK(s)
2. Le APK sera dans: `mobile-ionic/android/app/build/outputs/apk/debug/`

## Vérification de l'Installation

### Services qui doivent tourner:
```cmd
docker ps
```

Vous devez voir:
- lalana_postgres (port 5432)
- lalana_api (port 8000)
- lalana_tile_server (port 8080)

### Tester la base de données:
```cmd
docker exec -it lalana_postgres psql -U lalana_user -d lalana_db -c "\dt"
```

Vous devez voir les tables: users, signalements, login_attempts

### Tester le serveur de cartes:
Ouvrir: http://localhost:8080

## Problèmes Courants

### Docker ne démarre pas
- Vérifier que Docker Desktop est lancé
- Redémarrer Docker Desktop
- Vérifier que la virtualisation est activée dans le BIOS

### Port déjà utilisé
```cmd
REM Changer les ports dans docker-compose.yml
REM Par exemple: "8001:8000" au lieu de "8000:8000"
```

### Erreur de migration Laravel
```cmd
docker exec -it lalana_api php artisan migrate:fresh --seed
```

### L'application mobile ne se connecte pas à l'API
- Vérifier que l'API tourne: http://localhost:8000
- Sur Android émulateur, utiliser: `http://10.0.2.2:8000/api`
- Sur appareil physique, utiliser l'IP locale: `http://192.168.x.x:8000/api`

## Configuration Firebase (Optionnel)

1. Aller sur: https://console.firebase.google.com
2. Créer un nouveau projet
3. Activer Authentication > Email/Password
4. Créer une Realtime Database
5. Dans Project Settings > Service accounts > Generate new private key
6. Copier le fichier JSON dans `api-laravel/storage/firebase-credentials.json`
7. Mettre à jour `.env`:
```
FIREBASE_CREDENTIALS=storage/firebase-credentials.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
USE_FIREBASE=true
```

## Commandes de Maintenance

```cmd
REM Voir les logs
docker-compose logs -f laravel_api

REM Redémarrer un service
docker-compose restart laravel_api

REM Arrêter tout
docker-compose down

REM Reset complet (supprime les données)
docker-compose down -v
docker-compose up -d
docker exec -it lalana_api php artisan migrate:fresh --seed
```
