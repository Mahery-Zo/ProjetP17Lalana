# Script pour configurer la table entreprises
Write-Host "=== Configuration de la table entreprises ===" -ForegroundColor Cyan

# Exécuter les migrations
Write-Host "`nExécution des migrations..." -ForegroundColor Yellow
docker exec lalana-api php artisan migrate

# Exécuter le seeder
Write-Host "`nInsertion des entreprises de test..." -ForegroundColor Yellow
docker exec lalana-api php artisan db:seed --class=EntrepriseSeeder

Write-Host "`n✅ Configuration terminée!" -ForegroundColor Green
Write-Host "`nEntreprises ajoutées:" -ForegroundColor Cyan
Write-Host "  - COLAS Madagascar"
Write-Host "  - SOGEA SATOM"
Write-Host "  - RAZEL-BEC Madagascar"
Write-Host "  - CHINA ROAD"
Write-Host "  - ENTREPRISE RAMANANTSOA"
