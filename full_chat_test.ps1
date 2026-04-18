$baseUrl = "http://localhost:8081"

Write-Host "=== CHAT SYSTEM TEST ===" -ForegroundColor Cyan

# Step 1: Login as aman
Write-Host "`n1. Logging in as Aman..." -ForegroundColor Yellow
$amanLogin = @{ username = "aman"; password = "aman123456" } | ConvertTo-Json

$amanResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body $amanLogin `
  -UseBasicParsing

$amanToken = ($amanResp.Content | ConvertFrom-Json).token
Write-Host "✓ Aman logged in" -ForegroundColor Green

# Step 2: Login as ahmed
Write-Host "`n2. Logging in as Ahmed..." -ForegroundColor Yellow
$ahmedLogin = @{ username = "ahmed"; password = "ahmed123456" } | ConvertTo-Json

$ahmedResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body $ahmedLogin `
  -UseBasicParsing

$ahmedToken = ($ahmedResp.Content | ConvertFrom-Json).token
Write-Host "✓ Ahmed logged in" -ForegroundColor Green

# Step 3: Get Ahmed's ID
Write-Host "`n3. Getting Ahmed's user ID..." -ForegroundColor Yellow
$searchResp = Invoke-WebRequest -Uri "$baseUrl/api/users/search?query=ahmed" `
  -Method GET `
  -Headers @{"Authorization" = "Bearer $amanToken"; "Content-Type" = "application/json"} `
  -UseBasicParsing

$users = $searchResp.Content | ConvertFrom-Json
$ahmedId = $users[0].id
Write-Host "✓ Ahmed's ID: $ahmedId" -ForegroundColor Green

# Step 4: Aman creates conversation with Ahmed
Write-Host "`n4. Creating conversation (Aman -> Ahmed)..." -ForegroundColor Yellow
$createConv = @{ userId = $ahmedId } | ConvertTo-Json

try {
    $convResp = Invoke-WebRequest -Uri "$baseUrl/api/conversations" `
      -Method POST `
      -Headers @{"Authorization" = "Bearer $amanToken"; "Content-Type" = "application/json"} `
      -Body $createConv `
      -UseBasicParsing

    $conversation = $convResp.Content | ConvertFrom-Json
    Write-Host "✓ Conversation created!" -ForegroundColor Green
    Write-Host "  ID: $($conversation.id)"
    Write-Host "  User1: ID=$($conversation.user1Id), Name=$($conversation.user1Username)"
    Write-Host "  User2: ID=$($conversation.user2Id), Name=$($conversation.user2Username)"
}
catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Get Aman's conversations
Write-Host "`n5. Fetching Aman's conversations..." -ForegroundColor Yellow
$amanConvResp = Invoke-WebRequest -Uri "$baseUrl/api/users/conversations" `
  -Method GET `
  -Headers @{"Authorization" = "Bearer $amanToken"; "Content-Type" = "application/json"} `
  -UseBasicParsing

$amanConversations = $amanConvResp.Content | ConvertFrom-Json

Write-Host "✓ Aman's conversations:" -ForegroundColor Green
foreach ($conv in $amanConversations) {
    Write-Host "  • Conv ID: $($conv.id)"
    Write-Host "    User1: ID=$($conv.user1Id), Username=$($conv.user1Username)"
    Write-Host "    User2: ID=$($conv.user2Id), Username=$($conv.user2Username)"
    
    if ($null -eq $conv.user1Username -or $conv.user1Username -eq "") {
        Write-Host "    ⚠️  WARNING: user1Username is NULL/EMPTY!" -ForegroundColor Red
    }
    if ($null -eq $conv.user2Username -or $conv.user2Username -eq "") {
        Write-Host "    ⚠️  WARNING: user2Username is NULL/EMPTY!" -ForegroundColor Red
    }
}

# Step 6: Get Ahmed's conversations
Write-Host "`n6. Fetching Ahmed's conversations..." -ForegroundColor Yellow
$ahmedConvResp = Invoke-WebRequest -Uri "$baseUrl/api/users/conversations" `
  -Method GET `
  -Headers @{"Authorization" = "Bearer $ahmedToken"; "Content-Type" = "application/json"} `
  -UseBasicParsing

$ahmedConversations = $ahmedConvResp.Content | ConvertFrom-Json

Write-Host "✓ Ahmed's conversations:" -ForegroundColor Green
foreach ($conv in $ahmedConversations) {
    Write-Host "  • Conv ID: $($conv.id)"
    Write-Host "    User1: ID=$($conv.user1Id), Username=$($conv.user1Username)"
    Write-Host "    User2: ID=$($conv.user2Id), Username=$($conv.user2Username)"
    
    if ($null -eq $conv.user1Username -or $conv.user1Username -eq "") {
        Write-Host "    ⚠️  WARNING: user1Username is NULL/EMPTY!" -ForegroundColor Red
    }
    if ($null -eq $conv.user2Username -or $conv.user2Username -eq "") {
        Write-Host "    ⚠️  WARNING: user2Username is NULL/EMPTY!" -ForegroundColor Red
    }
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan
