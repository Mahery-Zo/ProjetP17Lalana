# Script de test des signalements
$API_URL = "http://localhost:8000/api"

Write-Host "=== TEST SIGNALEMENTS LALANA ===" -ForegroundColor Cyan
Write-Host ""

# 1. Connexion
Write-Host "1. Connexion..." -ForegroundColor Yellow
$loginBody = @{
    email = "manager@lalana.mg"
    password = "manager123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "✓ Connecté en tant que: $($loginResponse.user.name)" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Erreur de connexion: $_" -ForegroundColor Red
    exit
}

Write-Host ""

# 2. Créer un signalement
Write-Host "2. Création d'un signalement..." -ForegroundColor Yellow
$signalementBody = @{
    latitude = -18.8792
    longitude = 47.5079
    description = "Test: Route endommagée - $(Get-Date -Format 'HH:mm:ss')"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $createResponse = Invoke-RestMethod -Uri "$API_URL/signalements" -Method Post -Body $signalementBody -Headers $headers
    Write-Host "✓ Signalement créé avec succès!" -ForegroundColor Green
    Write-Host "  ID: $($createResponse.id)" -ForegroundColor Gray
    Write-Host "  Latitude: $($createResponse.latitude)" -ForegroundColor Gray
    Write-Host "  Longitude: $($createResponse.longitude)" -ForegroundColor Gray
    Write-Host "  Status: $($createResponse.status)" -ForegroundColor Gray
    $signalementId = $createResponse.id
} catch {
    Write-Host "✗ Erreur création: $_" -ForegroundColor Red
}

Write-Host ""

# 3. Lister tous les signalements
Write-Host "3. Liste de tous les signalements..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$API_URL/signalements" -Method Get -Headers $headers
    Write-Host "✓ $($listResponse.Count) signalement(s) trouvé(s)" -ForegroundColor Green
    
    foreach ($sig in $listResponse | Select-Object -First 5) {
        Write-Host "  - ID $($sig.id): $($sig.description) [$($sig.status)]" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Erreur liste: $_" -ForegroundColor Red
}

Write-Host ""

# 4. Voir mes signalements
Write-Host "4. Mes signalements uniquement..." -ForegroundColor Yellow
try {
    $myResponse = Invoke-RestMethod -Uri "$API_URL/signalements/user/mine" -Method Get -Headers $headers
    Write-Host "✓ $($myResponse.Count) de mes signalement(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur: $_" -ForegroundColor Red
}

Write-Host ""

# 5. Modifier le statut (Manager uniquement)
if ($signalementId) {
    Write-Host "5. Modification du statut..." -ForegroundColor Yellow
    $statusBody = @{
        status = "en_cours"
    } | ConvertTo-Json
    
    try {
        $statusResponse = Invoke-RestMethod -Uri "$API_URL/signalements/$signalementId/status" -Method Put -Body $statusBody -Headers $headers
        Write-Host "✓ Statut modifié: $($statusResponse.status)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Erreur modification: $_" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # 6. Ajouter les détails (Manager uniquement)
    Write-Host "6. Ajout des détails techniques..." -ForegroundColor Yellow
    $detailsBody = @{
        surface_m2 = 15.5
        budget = 500000
        entreprise = "SECREN"
    } | ConvertTo-Json
    
    try {
        $detailsResponse = Invoke-RestMethod -Uri "$API_URL/signalements/$signalementId/details" -Method Put -Body $detailsBody -Headers $headers
        Write-Host "✓ Détails ajoutés:" -ForegroundColor Green
        Write-Host "  Surface: $($detailsResponse.surface_m2) m²" -ForegroundColor Gray
        Write-Host "  Budget: $($detailsResponse.budget) Ar" -ForegroundColor Gray
        Write-Host "  Entreprise: $($detailsResponse.entreprise)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Erreur détails: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== TEST TERMINÉ ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour voir dans le navigateur:" -ForegroundColor Yellow
Write-Host "  http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Pour tester avec l'interface:" -ForegroundColor Yellow
Write-Host "  start test-api.html" -ForegroundColor White
