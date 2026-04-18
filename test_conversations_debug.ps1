# Test conversations API
$baseUrl = "http://localhost:8081"

# Step 1: Login and get token
Write-Host "🔐 Logging in as aman..." -ForegroundColor Cyan

$loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body '{"username":"aman","password":"aman123456"}' `
  -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.token

Write-Host "✓ Token: $token" -ForegroundColor Green

# Step 2: Get conversations
Write-Host "`n📋 Fetching conversations..." -ForegroundColor Cyan

$conversationsResponse = Invoke-WebRequest -Uri "$baseUrl/api/users/conversations" `
  -Method GET `
  -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} `
  -UseBasicParsing

$conversations = $conversationsResponse.Content | ConvertFrom-Json

Write-Host "`n✓ Conversations Response:" -ForegroundColor Green
$conversations | ConvertTo-Json -Depth 10 | Write-Host

# Step 3: Check structure of first conversation
if ($conversations.Count -gt 0) {
  $conv = $conversations[0]
  Write-Host "`n🔍 First Conversation Details:" -ForegroundColor Cyan
  Write-Host "  ID: $($conv.id)" 
  Write-Host "  User1: ID=$($conv.user1Id), Username=$($conv.user1Username)"
  Write-Host "  User2: ID=$($conv.user2Id), Username=$($conv.user2Username)"
  
  if ([string]::IsNullOrWhiteSpace($conv.user1Username)) {
    Write-Host "  ⚠️ User1Username is NULL/EMPTY!" -ForegroundColor Red
  }
  if ([string]::IsNullOrWhiteSpace($conv.user2Username)) {
    Write-Host "  ⚠️ User2Username is NULL/EMPTY!" -ForegroundColor Red
  }
}
