$baseUrl = "http://localhost:8081"

Write-Host "=== FINAL E2E TEST ===" -ForegroundColor Cyan

# Create 3 users with conversations
Write-Host "`n1. Creating conversations between multiple users..." -ForegroundColor Yellow

# Aman login
$amanLogin = @{ username = "aman"; password = "aman123456" } | ConvertTo-Json
$amanResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $amanLogin -UseBasicParsing
$amanToken = ($amanResp.Content | ConvertFrom-Json).token

# Ahmed login
$ahmedLogin = @{ username = "ahmed"; password = "ahmed123456" } | ConvertTo-Json
$ahmedResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $ahmedLogin -UseBasicParsing
$ahmedToken = ($ahmedResp.Content | ConvertFrom-Json).token

# Sarah login
$sarahLogin = @{ username = "sarah"; password = "sarah123456" } | ConvertTo-Json
try {
    $sarahResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $sarahLogin -UseBasicParsing
    $sarahToken = ($sarahResp.Content | ConvertFrom-Json).token
    Write-Host "OK: Sarah token obtained" -ForegroundColor Green
}
catch {
    Write-Host "Note: Sarah might not exist yet" -ForegroundColor Yellow
}

# Search users
$searchResp1 = Invoke-WebRequest -Uri "$baseUrl/api/users/search?query=ahmed" -Method GET -Headers @{"Authorization" = "Bearer $amanToken"} -UseBasicParsing
$users1 = $searchResp1.Content | ConvertFrom-Json
$ahmedId = $users1[0].id

$searchResp2 = Invoke-WebRequest -Uri "$baseUrl/api/users/search?query=sarah" -Method GET -Headers @{"Authorization" = "Bearer $amanToken"} -UseBasicParsing
$users2 = $searchResp2.Content | ConvertFrom-Json
$sarahId = $users2[0].id

# Create conversations
Write-Host "`n2. Creating conversations..." -ForegroundColor Yellow

# Aman -> Ahmed
$conv1Body = @{ userId = $ahmedId } | ConvertTo-Json
$conv1 = (Invoke-WebRequest -Uri "$baseUrl/api/conversations" -Method POST -Headers @{"Authorization" = "Bearer $amanToken"; "Content-Type" = "application/json"} -Body $conv1Body -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "OK: Aman-Ahmed conversation created" -ForegroundColor Green

# Aman -> Sarah
$conv2Body = @{ userId = $sarahId } | ConvertTo-Json
$conv2 = (Invoke-WebRequest -Uri "$baseUrl/api/conversations" -Method POST -Headers @{"Authorization" = "Bearer $amanToken"; "Content-Type" = "application/json"} -Body $conv2Body -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "OK: Aman-Sarah conversation created" -ForegroundColor Green

# Get all conversations
Write-Host "`n3. Verifying conversation data..." -ForegroundColor Yellow

$amanConvs = (Invoke-WebRequest -Uri "$baseUrl/api/users/conversations" -Method GET -Headers @{"Authorization" = "Bearer $amanToken"} -UseBasicParsing).Content | ConvertFrom-Json
$ahmedConvs = (Invoke-WebRequest -Uri "$baseUrl/api/users/conversations" -Method GET -Headers @{"Authorization" = "Bearer $ahmedToken"} -UseBasicParsing).Content | ConvertFrom-Json

Write-Host "`nAman's Conversations:" -ForegroundColor Yellow
foreach ($conv in $amanConvs) {
    $otherUser = if ($conv.user1Id -eq 2) { "$($conv.user2Username)(ID=$($conv.user2Id))" } else { "$($conv.user1Username)(ID=$($conv.user1Id))" }
    Write-Host "  • Conv $($conv.id): Other user = $otherUser"
    
    if ($conv.user1Username -eq "Unknown" -or $conv.user2Username -eq "Unknown") {
        Write-Host "    ERROR: 'Unknown' found!" -ForegroundColor Red
    } else {
        Write-Host "    OK: Usernames populated" -ForegroundColor Green
    }
}

Write-Host "`nAhmed's Conversations:" -ForegroundColor Yellow
foreach ($conv in $ahmedConvs) {
    $otherUser = if ($conv.user1Id -eq 3) { "$($conv.user2Username)(ID=$($conv.user2Id))" } else { "$($conv.user1Username)(ID=$($conv.user1Id))" }
    Write-Host "  • Conv $($conv.id): Other user = $otherUser"
    
    if ($conv.user1Username -eq "Unknown" -or $conv.user2Username -eq "Unknown") {
        Write-Host "    ERROR: 'Unknown' found!" -ForegroundColor Red
    } else {
        Write-Host "    OK: Usernames populated" -ForegroundColor Green
    }
}

# Summary
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan

$totalConvs = $amanConvs.Count + $ahmedConvs.Count
$unknownCount = 0

foreach ($conv in $amanConvs) {
    if ($conv.user1Username -eq "Unknown" -or $conv.user2Username -eq "Unknown") { $unknownCount++ }
}
foreach ($conv in $ahmedConvs) {
    if ($conv.user1Username -eq "Unknown" -or $conv.user2Username -eq "Unknown") { $unknownCount++ }
}

if ($unknownCount -eq 0) {
    Write-Host "SUCCESS: All usernames populated correctly!" -ForegroundColor Green
    Write-Host "Total conversations verified: $totalConvs" -ForegroundColor Green
    Write-Host "Unknown count: 0" -ForegroundColor Green
} else {
    Write-Host "FAILED: Still finding 'Unknown' values" -ForegroundColor Red
    Write-Host "Unknown count: $unknownCount" -ForegroundColor Red
}
