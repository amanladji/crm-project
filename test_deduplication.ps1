# Simple backend verification test
param(
    [string]$BaseUrl = "http://localhost:8081"
)

Write-Host "Testing Backend Chat Deduplication" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get JWT token for masroor
Write-Host "Test 1: Login as masroor" -ForegroundColor Yellow

$loginReq = @{
    username = "masroor"
    password = "masroor123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginReq
    
    $token = $authResponse.token
    Write-Host "SUCCESS: Token obtained" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
    
    # Test 2: Get accepted users
    Write-Host ""
    Write-Host "Test 2: Fetch accepted users for masroor" -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $acceptedResponse = Invoke-RestMethod -Uri "$BaseUrl/api/chat/accepted-users" `
        -Method GET `
        -Headers $headers
    
    $userCount = $acceptedResponse.Count
    Write-Host "SUCCESS: Got $userCount accepted users" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Returned Users:" -ForegroundColor Cyan
    $acceptedResponse | ForEach-Object {
        $id = $_.id
        $name = $_.username
        $email = $_.email
        Write-Host "  • ID=$id, Name=$name, Email=$email" -ForegroundColor Gray
    }
    
    # Check for duplicates
    Write-Host ""
    Write-Host "Checking for duplicate users..." -ForegroundColor Yellow
    
    $userIds = @()
    foreach ($user in $acceptedResponse) {
        $userIds += $user.id
    }
    
    $uniqueIds = $userIds | Select-Object -Unique
    
    if ($uniqueIds.Count -eq $userIds.Count) {
        Write-Host "SUCCESS: No duplicates found! Each user appears only once." -ForegroundColor Green
    } else {
        Write-Host "FAIL: Duplicates detected!" -ForegroundColor Red
        Write-Host "Total: $($userIds.Count), Unique: $($uniqueIds.Count)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Also test for mani
Write-Host ""
Write-Host "Test 3: Login as mani and fetch accepted users" -ForegroundColor Yellow

$loginReq2 = @{
    username = "mani"
    password = "mani123"
} | ConvertTo-Json

try {
    $authResponse2 = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginReq2
    
    $token2 = $authResponse2.token
    Write-Host "SUCCESS: Token obtained" -ForegroundColor Green
    
    $headers2 = @{
        "Authorization" = "Bearer $token2"
        "Content-Type" = "application/json"
    }
    
    $acceptedResponse2 = Invoke-RestMethod -Uri "$BaseUrl/api/chat/accepted-users" `
        -Method GET `
        -Headers $headers2
    
    $userCount2 = $acceptedResponse2.Count
    Write-Host "SUCCESS: Got $userCount2 accepted users" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Returned Users:" -ForegroundColor Cyan
    $acceptedResponse2 | ForEach-Object {
        $id = $_.id
        $name = $_.username
        Write-Host "  • ID=$id, Name=$name" -ForegroundColor Gray
    }
    
    # Check for duplicates
    $userIds2 = @()
    foreach ($user in $acceptedResponse2) {
        $userIds2 += $user.id
    }
    
    $uniqueIds2 = $userIds2 | Select-Object -Unique
    
    if ($uniqueIds2.Count -eq $userIds2.Count) {
        Write-Host "SUCCESS: No duplicates found!" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Duplicates detected!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
