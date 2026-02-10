docker compose exec app composer require google/cloud-firestore -W

docker compose exec app composer require google/cloud-firestore -W

# test

$token = "CVluh1CHUROgliIMkKQ4yZ0yG3SxqpuIwV8tEg8t9ad45803"

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8000/api/sync/firebase" `
  -Headers @{
    Authorization = "Bearer $token"
    Accept = "application/json"
  }




 