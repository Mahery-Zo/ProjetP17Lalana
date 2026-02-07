# Lalana Web - Frontend React

Application web React pour la gestion des signalements de routes.

## Installation

```bash
cd web-react
npm install
```

## Configuration

L'API Laravel doit être accessible sur `http://localhost:8000`

Pour changer l'URL de l'API, modifiez `src/services/api.js`:
```javascript
const API_URL = 'http://localhost:8000/api'
```

## Démarrage

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## Comptes de test

- **Manager**: manager@lalana.mg / manager123
- **User**: user@lalana.mg / user123

## Structure

```
src/
├── context/
│   └── AuthContext.jsx      # Gestion de l'état d'authentification
├── services/
│   └── api.js               # Configuration Axios et services API
├── pages/
│   ├── Login.jsx            # Page de connexion
│   ├── Register.jsx         # Page d'inscription
│   ├── Dashboard.jsx        # Tableau de bord
│   └── Signalements.jsx     # Liste des signalements
└── App.jsx                  # Routes et configuration
```

## Fonctionnalités

- ✅ Connexion / Inscription
- ✅ Protection des routes privées
- ✅ Gestion du token Bearer dans localStorage
- ✅ Intercepteurs Axios pour l'authentification
- ✅ Déconnexion automatique sur 401
- ✅ Affichage des signalements
- ✅ Interface responsive

## Build production

```bash
npm run build
```

Les fichiers seront générés dans le dossier `dist/`
