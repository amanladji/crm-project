# Comprehensive test to find hidden exceptions

$baseUrl = "http://localhost:8081"

Write-Host "[*] Testing to find hidden exceptions..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Register users
Write-Host "[Step 1] Registering users..."
try {
    $u1 = @{username="exc_user1_$(Get-Random)";password="pass123";email="exc1_$(Get-Random)@test.com";firstName="Exc";lastName="User1"} | ConvertTo-Json
    $u1Resp = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -UseBasicParsing `
        -Headers @{"Content-Type"="application/json"} -Body $u1 -ErrorAction Stop
    $u1Data = $u1Resp.Content | ConvertFrom-Json
    $u1Id = $u1Data.id
    Write-Host "[OK] User 1 ID: $u1Id"
    
    $u2 = @{username="exc_user2_$(Get-Random)";password="pass123";email="exc2_$(Get-Random)@test.com";firstName="Exc";lastName="User2"} | ConvertTo-Json
    $u2Resp = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -UseBasicParsing `
        -Headers @{"Content-Type"="application/json"} -Body $u2 -ErrorAction Stop
    $u2Data = $u2Resp.Content | ConvertFrom-Json
    $u2Id = $u2Data.id
    Write-Host "[OK] User 2 ID: $u2Id"
} catch {
    Write-Host "[ERROR] Registration failed"
    exit 1
}

# Step 2: Login
Write-Host "[Step 2] Logging in..."
try {
    $login1 = @{username=$u1Data.username;password="pass123"} | ConvertTo-Json
    $login1Resp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -UseBasicParsing `
        -Headers @{"Content-Type"="application/json"} -Body $login1 -ErrorAction Stop
    $login1Data = $login1Resp.Content | ConvertFrom-Json
    $token1 = $login1Data.token
    Write-Host "[OK] User 1 logged in"
} catch {
    Write-Host "[ERROR] Login failed: $($_.Exception.Message)"
    exit 1
}

# Step 3: Try to get customers (potential null pointer)
Write-Host "[Step 3] Getting customers list (might trigger exception)..."
try {
    $custResp = Invoke-WebRequest -Uri "$baseUrl/api/customers" -UseBasicParsing `
        -Headers @{"Authorization"="Bearer $token1"} -ErrorAction Stop
    Write-Host "[OK] Got $($custResp.Content.Length) bytes"
} catch {
    Write-Host "[WARN] Customer endpoint error (expected): $($_.Exception.Response.StatusCode)"
}

# Step 4: Send message to non-existent user (potential foreign key error)
Write-Host "[Step 4] Sending message to non-existent user (receiver ID 9999)..."
try {
    $msg = @{receiverId=9999;content="Test message"} | ConvertTo-Json
    $msgResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -UseBasicParsing `
        -Headers @{
            "Content-Type"="application/json"
            "Authorization"="Bearer $token1"
        } -Body $msg -ErrorAction Stop
    Write-Host "[OK] Status: $($msgResp.StatusCode)"
} catch {
    Write-Host "[EXPECTED] Error: $($_.Exception.Response.StatusCode)"
}

# Step 5: Send valid message
Write-Host "[Step 5] Sending valid message..."
try {
    $msg = @{receiverId=$u2Id;content="Test valid message"} | ConvertTo-Json
    $msgResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -UseBasicParsing `
        -Headers @{
            "Content-Type"="application/json"
            "Authorization"="Bearer $token1"
        } -Body $msg -ErrorAction Stop
    Write-Host "[OK] Status: $($msgResp.StatusCode)"
} catch {
    Write-Host "[ERROR] Message send failed: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "[*] Tests completed. Monitor backend logs for exceptions."
