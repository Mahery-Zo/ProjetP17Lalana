# Démarrage Rapide - Projet Lalana

## Étape 1: Lancer Docker

```cmd
docker-compose up -d
```

Attendez 2-3 minutes que tout démarre (surtout le tile_server qui télécharge la carte de Madagascar).

## Étape 2: Vérifier que tout tourne

```cmd
docker ps
```

Vous devez voir 4 containers:
- lalana_app (PHP-FPM)
- lalana_nginx (Serveur web)
- lalana_postgres (Base de données)
- lalana_tile_server (Serveur de cartes)

## Étape 3: Installer les dépendances Laravel

```cmd
docker exec -it lalana_app bash
```

Dans le container:
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
exit
```

## Étape 4: Tester l'API

Ouvrir dans le navigateur: http://localhost:8000

Ou tester la connexion:
```cmd
curl -X POST http://localhost:8000/api/login -H "Content-Type: application/json" -d "{\"email\":\"manager@lalana.mg\",\"password\":\"manager123\"}"
```

## Comptes de test

**Manager:**
- Email: manager@lalana.mg
- Password: manager123

**Utilisateur:**
- Email: user@lalana.mg
- Password: user123

## Problèmes?

### Docker ne démarre pas
```cmd
docker-compose down
docker-compose up -d
```

### Erreur de migration
```cmd
docker exec -it lalana_app php artisan migrate:fresh --seed
```

### Voir les logs
```cmd
docker-compose logs -f app
docker-compose logs -f web
```

### Permissions
```cmd
docker exec -it lalana_app chown -R www-data:www-data storage bootstrap/cache
docker exec -it lalana_app chmod -R 775 storage bootstrap/cache
```

## Prochaine étape: Mobile

Voir `INSTALLATION.md` section Mobile pour installer l'application Ionic.
