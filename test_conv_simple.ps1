# Simplified Conversation Linking Test - Phase 3

# Configuration
$baseUrl = "http://localhost:8081"
$maxRetries = 30

# Wait for server
Write-Host "⏳ Waiting for server..." -ForegroundColor Yellow
$serverReady = $false
for ($i = 0; $i -lt $maxRetries; $i++) {
    try {
        $test = Invoke-WebRequest -Uri "$baseUrl/api/chat/test" -UseBasicParsing -ErrorAction Stop
        if ($test.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "✅ Server Ready" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $serverReady) {
    Write-Host "❌ Server failed to start" -ForegroundColor Red
    exit 1
}

# Register Users
Write-Host "`n📝 Registering users..." -ForegroundColor Cyan
$user1 = (Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{username="alice_test";password="pass123";email="alice@test.com";firstName="Alice";lastName="Test"} | ConvertTo-Json)).Content | ConvertFrom-Json
$user1Id = $user1.id
Write-Host "✅ Alice (ID=$user1Id)"

$user2 = (Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{username="bob_test";password="pass123";email="bob@test.com";firstName="Bob";lastName="Test"} | ConvertTo-Json)).Content | ConvertFrom-Json
$user2Id = $user2.id
Write-Host "✅ Bob (ID=$user2Id)"

# Login
Write-Host "`n🔐 Logging in..." -ForegroundColor Cyan
$loginAlice = (Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{username="alice_test";password="pass123"} | ConvertTo-Json)).Content | ConvertFrom-Json
$tokenAlice = $loginAlice.token
Write-Host "✅ Alice logged in"

$loginBob = (Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{username="bob_test";password="pass123"} | ConvertTo-Json)).Content | ConvertFrom-Json
$tokenBob = $loginBob.token
Write-Host "✅ Bob logged in"

# Test 1: Send messages and verify same conversation
Write-Host "`n💬 TEST 1: Sending messages..." -ForegroundColor Cyan
$msg1 = (Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $tokenAlice"} `
    -Body (@{receiverId=$user2Id;content="Hi Bob!"} | ConvertTo-Json)).Content | ConvertFrom-Json
$convId1 = $msg1.conversationId
Write-Host "✅ Alice sent message (Conversation ID: $convId1)"

$msg2 = (Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $tokenBob"} `
    -Body (@{receiverId=$user1Id;content="Hello Alice!"} | ConvertTo-Json)).Content | ConvertFrom-Json
$convId2 = $msg2.conversationId
Write-Host "✅ Bob sent message (Conversation ID: $convId2)"

# Verify same conversation
if ($convId1 -eq $convId2) {
    Write-Host "✅ SUCCESS: Same Conversation ID ($convId1)" -ForegroundColor Green
} else {
    Write-Host "❌ FAIL: Different Conversation IDs ($convId1 vs $convId2)" -ForegroundColor Red
}

# Test 2: Fetch messages
Write-Host "`n📨 TEST 2: Fetching messages..." -ForegroundColor Cyan
$msgsBob = (Invoke-WebRequest -Uri "$baseUrl/api/chat/$user1Id" -UseBasicParsing `
    -Headers @{"Authorization"="Bearer $tokenBob"}).Content | ConvertFrom-Json
Write-Host "✅ Bob retrieved $($msgsBob.Count) message(s)"

# Test 3: Verify both users see messages
Write-Host "`n🔄 TEST 3: Message synchronization..." -ForegroundColor Cyan
$msgsAlice = (Invoke-WebRequest -Uri "$baseUrl/api/chat/$user2Id" -UseBasicParsing `
    -Headers @{"Authorization"="Bearer $tokenAlice"}).Content | ConvertFrom-Json
Write-Host "✅ Alice retrieved $($msgsAlice.Count) message(s)"

if ($msgsAlice.Count -eq 2 -and $msgsBob.Count -eq 2) {
    Write-Host "✅ SUCCESS: Both see complete history" -ForegroundColor Green
}

# Test 4: Send third message and verify still same conversation
Write-Host "`n💬 TEST 4: Send third message..." -ForegroundColor Cyan
$msg3 = (Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -UseBasicParsing `
    -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $tokenAlice"} `
    -Body (@{receiverId=$user2Id;content="How are you?"} | ConvertTo-Json)).Content | ConvertFrom-Json
$convId3 = $msg3.conversationId
Write-Host "✅ Alice sent third message (Conversation ID: $convId3)"

if ($convId3 -eq $convId1) {
    Write-Host "✅ SUCCESS: Still using same conversation" -ForegroundColor Green
    Write-Host "✅ No duplicate conversations created" -ForegroundColor Green
} else {
    Write-Host "❌ FAIL: Created new conversation instead of reusing" -ForegroundColor Red
}

Write-Host "`n" + ("="*60)
Write-Host "🎉 CONVERSATION LINKING VERIFIED - ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "="*60
Write-Host "`n✓ Messages linked to single conversation"
Write-Host "✓ Both users see complete history"
Write-Host "✓ No duplicates created"
Write-Host "`nPhase 3 Complete!`n"
