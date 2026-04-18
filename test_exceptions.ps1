# Test script to trigger backend exceptions

Write-Host "[*] Testing various APIs to find hidden exceptions..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8081"

# Test 1: Try customer endpoints
Write-Host "[Test 1] Testing /api/customers endpoint..."
try {
    $resp = Invoke-WebRequest -Uri "$baseUrl/api/customers" -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Status: $($resp.StatusCode)"
} catch {
    Write-Host "[ERROR] Failed with error"
}

# Test 2: Try chat with auth
Write-Host "[Test 2] Testing chat endpoint without auth..."
try {
    $resp = Invoke-WebRequest -Uri "$baseUrl/api/chat/999" -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Status: $($resp.StatusCode)"
} catch {
    Write-Host "[ERROR] Status: $($_.Exception.Response.StatusCode)"
}

# Test 3: Register and login 
Write-Host "[Test 3] Testing register endpoint..."
try {
    $user = @{username="test_exc_$(Get-Random)";password="pass";email="test_$(Get-Random)@test.com";firstName="Test";lastName="Exc"} | ConvertTo-Json
    $resp = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -UseBasicParsing `
        -Headers @{"Content-Type"="application/json"} -Body $user -ErrorAction Stop
    Write-Host "[OK] Status: $($resp.StatusCode)"
    $userData = $resp.Content | ConvertFrom-Json
    $userId = $userData.id
    Write-Host "    User ID: $userId"
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)"
}

# Test 4: Send message without proper conversation
Write-Host "[Test 4] Testing message send with missing fields..."
try {
    $msgResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -UseBasicParsing `
        -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer invalid_token"} `
        -Body '{"receiverId":999,"content":"test"}' -ErrorAction Stop
    Write-Host "[OK] Status: $($msgResp.StatusCode)"
} catch {
    Write-Host "[ERROR] Status: $($_.Exception.Response.StatusCode)"
}

Write-Host ""
Write-Host "[*] All tests completed. Check backend logs for hidden exceptions."
