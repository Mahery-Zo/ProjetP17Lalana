 docker compose exec app composer require kreait/laravel-firebase

 docker compose exec app php artisan vendor:publish --provider="Kreait\Laravel\Firebase\ServiceProvider" --tag=config



docker compose exec app php artisan config:clear
docker compose exec app php artisan optimize:clear


# in firebase folder

docker compose cp .\serviceAccountKey.json app:/var/www/html/storage/app/firebase/serviceAccountKey.json

# then:

docker compose exec app chown -R www-data:www-data storage/app/firebase
docker compose exec app php artisan config:clear
docker compose exec app php artisan optimize:clear

# verify if json exist
docker compose exec app ls -l storage/app/firebase
 

 # test realtime database 
 docker compose exec app php artisan tinker --execute="Firebase::database()->getReference('test/ping')->set(['ok'=>true]); echo 'OK';"


# test 
 

$body = @{
  email = "manager@lalana.mg"
  password = "manager123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/login" -ContentType "application/json" -Body $body


# test url with token 
$TOKEN = "14|epWTy0iyvHvOyOZKP60FQInGX3VyittW47NhGBYu89db2699"

curl.exe -i -X POST "http://127.0.0.1:8000/api/sync/firebase" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Accept: application/json"




# sync button calls this 

POST /api/sync/firebase
POST /api/push/firebase
