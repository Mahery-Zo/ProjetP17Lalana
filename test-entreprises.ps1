# Test de l'API entreprises
Write-Host "=== Test API Entreprises ===" -ForegroundColor Cyan

Write-Host "`nRécupération de la liste des entreprises..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/entreprises" -Method Get
    
    Write-Host "`n✅ Succès! Nombre d'entreprises: $($response.Count)" -ForegroundColor Green
    
    Write-Host "`nListe des entreprises:" -ForegroundColor Cyan
    foreach ($entreprise in $response) {
        Write-Host "  [$($entreprise.id)] $($entreprise.nom)" -ForegroundColor White
        Write-Host "      Contact: $($entreprise.contact)" -ForegroundColor Gray
        Write-Host "      Tél: $($entreprise.telephone)" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "`n❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}
