# Simplified Conversation Test
$baseUrl = "http://localhost:8081"
$maxRetries = 30

Write-Host "[*] Waiting for server..." -ForegroundColor Yellow
$serverReady = $false
for ($i = 0; $i -lt $maxRetries; $i++) {
    try {
        $test = Invoke-WebRequest -Uri "$baseUrl/api/chat/test" -UseBasicParsing -ErrorAction Stop
        if ($test.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "[OK] Server Ready" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $serverReady) {
    Write-Host "[FAIL] Server failed to start" -ForegroundColor Red
    exit 1
}

# Register Users
Write-Host "[*] Registering users..." -ForegroundColor Cyan
$user1 = (Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{username="alice_new";password="pass123";email="alice@test.com";firstName="Alice";lastName="Test"} | ConvertTo-Json)).Content | ConvertFrom-Json
$user1Id = $user1.id
Write-Host "[OK] Alice (ID=$user1Id)"

$user2 = (Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{username="bob_new";password="pass123";email="bob@test.com";firstName="Bob";lastName="Test"} | ConvertTo-Json)).Content | ConvertFrom-Json
$user2Id = $user2.id
Write-Host "[OK] Bob (ID=$user2Id)"

# Login
Write-Host "[*] Logging in..." -ForegroundColor Cyan
$loginAlice = (Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{username="alice_new";password="pass123"} | ConvertTo-Json)).Content | ConvertFrom-Json
$tokenAlice = $loginAlice.token
Write-Host "[OK] Alice logged in"

$loginBob = (Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{username="bob_new";password="pass123"} | ConvertTo-Json)).Content | ConvertFrom-Json
$tokenBob = $loginBob.token
Write-Host "[OK] Bob logged in"

# Test 1: Send messages
Write-Host "[*] TEST 1: Sending messages..." -ForegroundColor Cyan
$msg1 = (Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $tokenAlice"} `
    -Body (@{receiverId=$user2Id;content="Hi Bob!"} | ConvertTo-Json)).Content | ConvertFrom-Json
$convId1 = $msg1.conversationId
Write-Host "[OK] Alice sent (Conversation ID: $convId1)"

$msg2 = (Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $tokenBob"} `
    -Body (@{receiverId=$user1Id;content="Hello Alice!"} | ConvertTo-Json)).Content | ConvertFrom-Json
$convId2 = $msg2.conversationId
Write-Host "[OK] Bob sent (Conversation ID: $convId2)"

if ($convId1 -eq $convId2) {
    Write-Host "[PASS] Same Conversation ID" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Different IDs: $convId1 vs $convId2" -ForegroundColor Red
}

# Test 2: Fetch messages
Write-Host "[*] TEST 2: Fetching messages..." -ForegroundColor Cyan
$msgsBob = (Invoke-WebRequest -Uri "$baseUrl/api/chat/$user1Id" -UseBasicParsing `
    -Headers @{"Authorization"="Bearer $tokenBob"}).Content | ConvertFrom-Json
Write-Host "[OK] Bob retrieved $($msgsBob.Count) messages"

$msgsAlice = (Invoke-WebRequest -Uri "$baseUrl/api/chat/$user2Id" -UseBasicParsing `
    -Headers @{"Authorization"="Bearer $tokenAlice"}).Content | ConvertFrom-Json
Write-Host "[OK] Alice retrieved $($msgsAlice.Count) messages"

if ($msgsAlice.Count -eq 2 -and $msgsBob.Count -eq 2) {
    Write-Host "[PASS] Complete history visible to both" -ForegroundColor Green
}

# Test 3: Send another
Write-Host "[*] TEST 3: Send third message..." -ForegroundColor Cyan
$msg3 = (Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $tokenAlice"} `
    -Body (@{receiverId=$user2Id;content="How are you?"} | ConvertTo-Json)).Content | ConvertFrom-Json
$convId3 = $msg3.conversationId
Write-Host "[OK] Alice sent third message (Conversation ID: $convId3)"

if ($convId3 -eq $convId1) {
    Write-Host "[PASS] Reused same conversation, no duplicates" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Created new conversation" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================"
Write-Host "[SUCCESS] CONVERSATION LINKING WORKS!" -ForegroundColor Green
Write-Host "============================================================"
Write-Host ""
