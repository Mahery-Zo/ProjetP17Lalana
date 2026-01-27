npm init -y
npm install firebase-admin axios

=====RUN=====
 npm run import



in  api laravel
---------------

 docker compose exec app php artisan optimize:clear
docker compose exec api php artisan config:clear
docker compose exec laravel php artisan route:list



Fix Laravel storage permissions in Docker (immediate fix)
Run these from your project root (where docker-compose.yml is):
--------------------------------------------------------------

docker compose exec app sh -lc "ls -ld storage bootstrap/cache && ls -ld storage/logs || true"


Now apply the fix:
-----------------
docker compose exec app sh -lc "mkdir -p storage/logs storage/framework/{cache,sessions,views} bootstrap/cache && chown -R www-data:www-data storage bootstrap/cache && chmod -R 775 storage bootstrap/cache"


If your container runs as a different user than www-data, do the broad safe dev fix:
-----------------------------------------------------------------------------------
docker compose exec app sh -lc "chmod -R 777 storage bootstrap/cache"


CACHE_STORE=file
# ou si tu as encore CACHE_DRIVER :
CACHE_DRIVER=file
# Puis :

docker compose exec app php artisan config:clear
#  Après ça, php artisan optimize:clear ne tentera plus delete from "cache".

# Option “propre” si tu veux VRAIMENT cache en DB : créer la table

docker compose exec app php artisan cache:table
docker compose exec app php artisan migrate




i mean not push and pool signialment but push and pull users 