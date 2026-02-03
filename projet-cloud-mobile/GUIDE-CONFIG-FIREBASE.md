# Guide de Configuration Firebase - Étapes à Suivre

## 📋 Checklist de Configuration

### ✅ Étape 1 : Activer Firestore Database
- [x] Authentication activée
- [ ] **Firestore Database configuré**
- [ ] **Règles de sécurité déployées**
- [ ] **Indexes créés**

### ✅ Étape 2 : Activer Storage (pour les photos)
- [ ] **Storage activé**
- [ ] **Règles Storage déployées**

---

## 🔥 ÉTAPES DÉTAILLÉES

### 1️⃣ Configuration Firestore Database

#### A. Créer la base de données (Console Firebase)
1. Aller sur https://console.firebase.google.com
2. Sélectionner votre projet **projet-cloud-s5-47ed8**
3. Menu latéral → **Firestore Database**
4. Cliquer sur **Créer une base de données**
5. Mode : Sélectionner **Mode production**
6. Emplacement : Choisir **europe-west** (ou plus proche)
7. Cliquer sur **Activer**

#### B. Déployer les règles Firestore

**Option 1 : Via la Console Firebase (Simple)**
1. **Firestore Database** → onglet **Règles**
2. Copier tout le contenu du fichier `firestore.rules` (à la racine du projet)
3. Coller dans l'éditeur
4. Cliquer sur **Publier**

**Option 2 : Via Firebase CLI (Recommandé)**
```bash
# Dans le dossier racine du projet (ProjetP17Lalana)
firebase login
firebase use projet-cloud-s5-47ed8
firebase deploy --only firestore:rules
```

#### C. Créer les indexes Firestore

**Les indexes se créeront automatiquement** lors des premières requêtes. Si vous voyez une erreur avec un lien, cliquez simplement dessus pour créer l'index.

**Ou déployez-les manuellement :**
```bash
firebase deploy --only firestore:indexes
```

---

### 2️⃣ Configuration Firebase Storage

#### A. Activer Storage (Console Firebase)
1. Menu latéral → **Storage**
2. Cliquer sur **Commencer**
3. Mode : Sélectionner **Mode production**
4. Emplacement : Choisir la **même région que Firestore**
5. Cliquer sur **Terminé**

#### B. Déployer les règles Storage

**Option 1 : Via la Console Firebase**
1. **Storage** → onglet **Règles**
2. Copier le contenu de `storage.rules`
3. Coller dans l'éditeur
4. Cliquer sur **Publier**

**Option 2 : Via Firebase CLI**
```bash
firebase deploy --only storage
```

---

### 3️⃣ Vérifier Authentication

#### Configuration déjà faite ✅
Votre Authentication Email/Password est déjà activée. Parfait !

#### Créer un utilisateur de test (optionnel)
1. **Authentication** → onglet **Users**
2. Cliquer sur **Ajouter un utilisateur**
3. Email : `test@example.com`
4. Mot de passe : `Test123!`
5. Cliquer sur **Ajouter un utilisateur**

**Note :** Normalement, les utilisateurs seront créés via le Manager (app web).

---

### 4️⃣ Structure des Collections Firestore

#### Collections à créer (se créeront automatiquement avec les données)

1. **signalements** : Stocke tous les signalements
2. **entreprises** : Liste des entreprises (synchronisée par l'API Laravel)
3. **users** (optionnel) : Profils utilisateurs étendus

Pas besoin de les créer manuellement, elles apparaîtront automatiquement lors du premier ajout de données.

---

## 🧪 Tester la Configuration

### Test 1 : Connexion Firebase
Lancez l'app mobile et essayez de vous connecter avec un utilisateur existant.

### Test 2 : Vérifier Firestore
Dans la console Firebase :
1. **Firestore Database** → onglet **Données**
2. Vous devriez voir les collections apparaître après les premiers tests

### Test 3 : Ajouter un signalement (via l'app)
Testez l'ajout d'un signalement depuis l'application mobile.

---

## 🛠️ Installation Firebase CLI (si nécessaire)

```bash
# Installer Firebase CLI globalement
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser le projet (si pas déjà fait)
cd D:\S5\Web-Cloud\Mobile\Groupe\ProjetP17Lalana
firebase init

# Sélectionner :
# - Firestore
# - Storage
# - (Optionnel) Hosting

# Sélectionner le projet existant :
# projet-cloud-s5-47ed8

# Utiliser les fichiers déjà créés :
# - firestore.rules (déjà créé)
# - firestore.indexes.json (déjà créé)
# - storage.rules (déjà créé)
```

---

## 📊 Résumé des Fichiers Créés

| Fichier | Emplacement | Description |
|---------|-------------|-------------|
| `firestore.rules` | Racine projet | Règles de sécurité Firestore |
| `firestore.indexes.json` | Racine projet | Configuration des indexes |
| `storage.rules` | Racine projet | Règles de sécurité Storage |
| `firebase.json` | Racine projet | Configuration Firebase |
| `FIREBASE-CONFIG.md` | `projet-cloud-mobile/` | Documentation complète |
| `firebase.types.ts` | `projet-cloud-mobile/src/types/` | Types TypeScript |

---

## ⚠️ Points Importants

1. **Règles de sécurité** : Ne pas utiliser le "mode test" en production
2. **Indexes** : Se créent automatiquement ou via le fichier JSON
3. **Region** : Utiliser la même région pour Firestore et Storage (latence)
4. **Limites gratuites** :
   - Firestore : 50K lectures/jour, 20K écritures/jour
   - Storage : 5 GB stockage, 1 GB download/jour
   - Authentication : Illimité

---

## 🎯 Prochaines Étapes (après configuration)

1. ✅ Configuration Firebase → **EN COURS**
2. 🔄 Implémenter la carte Leaflet avec OpenStreetMap
3. 📍 Géolocalisation et ajout de signalements
4. 📊 Affichage du récap et filtres
5. 📸 Upload de photos
6. 🔄 Mode offline avec synchronisation

---

## 📞 En cas de problème

### Erreur : "Missing or insufficient permissions"
→ Les règles Firestore ne sont pas déployées. Suivre l'étape 1B.

### Erreur : "The query requires an index"
→ Cliquer sur le lien dans l'erreur pour créer l'index automatiquement.

### Erreur de connexion
→ Vérifier que l'utilisateur existe dans **Authentication → Users**.

---

**Configuration préparée par GitHub Copilot**
Date : 27 janvier 2026
