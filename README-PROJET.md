# Projet Lalana - Signalement Travaux Routiers Antananarivo

## Architecture du Projet

### Technologies Utilisées
- **API Backend**: Laravel 10 (PHP 8.2) avec Sanctum pour l'authentification
- **Base de données**: PostgreSQL 15
- **Mobile**: Ionic + Vue.js 3
- **Cartes**: Leaflet + OpenStreetMap (serveur offline)
- **Conteneurisation**: Docker & Docker Compose
- **Authentification**: Firebase (online) / PostgreSQL (offline)

## Structure du Projet

```
ProjetP17Lalana/
├── api-laravel/              # API Laravel
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── UserController.php
│   │   │   │   └── SignalementController.php
│   │   │   └── Middleware/
│   │   │       └── RoleMiddleware.php
│   │   └── Models/
│   │       ├── User.php
│   │       ├── Signalement.php
│   │       └── LoginAttempt.php
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php
│   ├── Dockerfile
│   └── .env.example
├── mobile-ionic/             # Application mobile Ionic Vue.js
│   ├── src/
│   │   ├── views/
│   │   │   └── MapView.vue
│   │   ├── stores/
│   │   │   └── auth.ts
│   │   └── services/
│   │       └── api.ts
│   ├── capacitor.config.ts
│   └── package.json
└── docker-compose.yml        # Configuration Docker
```

## Installation et Démarrage

### Prérequis
- Docker & Docker Compose
- Node.js 18+ (pour le développement mobile)
- Android Studio (pour build APK)

### 1. Démarrer les services Docker

```bash
# Cloner le projet
cd ProjetP17Lalana

# Démarrer tous les services
docker-compose up -d

# Attendre que les services démarrent (environ 2-3 minutes)
```

### 2. Configuration Laravel API

```bash
# Entrer dans le container Laravel
docker exec -it lalana_api bash

# Copier le fichier .env
cp .env.example .env

# Générer la clé d'application
php artisan key:generate

# Exécuter les migrations
php artisan migrate

# Créer les comptes par défaut (Manager + User test)
php artisan db:seed

# Sortir du container
exit
```

### 3. Configuration Mobile

```bash
cd mobile-ionic

# Installer les dépendances
npm install

# Créer le fichier .env
echo "VITE_API_URL=http://localhost:8000/api" > .env
echo "VITE_FIREBASE_API_KEY=your_firebase_key" >> .env
echo "VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com" >> .env
echo "VITE_FIREBASE_PROJECT_ID=your_project_id" >> .env

# Lancer en mode développement
npm run dev

# Pour build Android APK
npm run build
npx cap add android
npx cap sync
npx cap open android
```

## Services Disponibles

| Service | URL | Description |
|---------|-----|-------------|
| API Laravel | http://localhost:8000 | API REST Backend |
| PostgreSQL | localhost:5432 | Base de données |
| Tile Server | http://localhost:8080 | Serveur de cartes offline |
| Mobile Dev | http://localhost:5173 | Application mobile (dev) |

## Comptes par Défaut

### Manager
- Email: `manager@lalana.mg`
- Password: `manager123`
- Rôle: Gestion complète

### Utilisateur Test
- Email: `user@lalana.mg`
- Password: `user123`
- Rôle: Utilisateur standard

## API Endpoints

### Authentification (Public)
- `POST /api/register` - Inscription
- `POST /api/login` - Connexion

### Utilisateur (Authentifié)
- `GET /api/user` - Profil utilisateur
- `PUT /api/user/update` - Modifier profil
- `POST /api/logout` - Déconnexion

### Signalements (Authentifié)
- `GET /api/signalements` - Liste tous les signalements
- `POST /api/signalements` - Créer un signalement
- `GET /api/signalements/{id}` - Détails d'un signalement
- `GET /api/signalements/user/mine` - Mes signalements

### Manager uniquement
- `POST /api/sync/firebase` - Synchroniser avec Firebase
- `GET /api/users/blocked` - Liste utilisateurs bloqués
- `POST /api/users/{id}/unblock` - Débloquer un utilisateur
- `PUT /api/signalements/{id}/status` - Modifier statut
- `PUT /api/signalements/{id}/details` - Modifier détails (surface, budget, entreprise)

## Fonctionnalités Implémentées

### Module Authentification ✅
- Inscription/Connexion email/password
- Firebase (online) + PostgreSQL (offline)
- Limite de 3 tentatives de connexion (paramétrable)
- Blocage automatique après échec
- API de déblocage pour Manager
- Durée de vie des sessions (120 min par défaut)
- Modification des informations utilisateur

### Module Signalements ✅
- Création de signalements avec géolocalisation
- Statuts: nouveau, en_cours, terminé
- Informations: surface m², budget, entreprise
- Filtrage par utilisateur
- Synchronisation Firebase (structure prête)

### Module Cartes ✅
- Serveur de tuiles OpenStreetMap offline
- Leaflet pour affichage/manipulation
- Markers avec popup d'informations
- Centré sur Antananarivo

### Profils Utilisateurs ✅
- Visiteur (sans compte) - lecture seule
- Utilisateur - création signalements
- Manager - gestion complète

## Configuration Firebase

1. Créer un projet Firebase
2. Activer Authentication (Email/Password)
3. Créer une Realtime Database
4. Télécharger les credentials
5. Mettre à jour les variables d'environnement

## Prochaines Étapes

1. **Swagger Documentation**: Installer L5-Swagger pour documenter l'API
2. **Upload Photos**: Implémenter l'upload d'images pour les signalements
3. **Synchronisation Firebase**: Compléter la logique de sync bidirectionnelle
4. **Tests**: Ajouter des tests unitaires et d'intégration
5. **Build APK**: Finaliser la configuration Android
6. **Documentation Technique**: Ajouter le MCD et les captures d'écran

## Commandes Utiles

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart laravel_api

# Arrêter tous les services
docker-compose down

# Supprimer les volumes (reset complet)
docker-compose down -v

# Accéder à PostgreSQL
docker exec -it lalana_postgres psql -U lalana_user -d lalana_db
```

## Support

Pour toute question, contactez l'équipe de développement.
