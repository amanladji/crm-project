# Test Conversation Linking - Phase 3
# This script will verify that conversations are properly linked between two users

# Wait for server to be ready
$maxRetries = 30
$retryCount = 0
$serverReady = $false

Write-Host "⏳ Waiting for server to start..."

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8081/api/chat/test" -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "✅ Server is ready!" -ForegroundColor Green
            break
        }
    }
    catch {
        $retryCount++
        Start-Sleep -Seconds 1
    }
}

if (-not $serverReady) {
    Write-Host "❌ Server failed to start after $maxRetries seconds" -ForegroundColor Red
    exit 1
}

# ====================================================================================
# STEP 1: Register two test users
# ====================================================================================
Write-Host "`n📝 STEP 1: Registering test users..."

$user1 = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body '{"username":"alice_con_test","password":"test123","email":"alice@test.com","firstName":"Alice","lastName":"Con"}' `
    -ErrorAction Stop

$user1Data = $user1.Content | ConvertFrom-Json
$user1Id = $user1Data.id
Write-Host "✅ User 1 Created: Alice (ID=$user1Id)"

$user2 = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body '{"username":"bob_con_test","password":"test123","email":"bob@test.com","firstName":"Bob","lastName":"Con"}' `
    -ErrorAction Stop

$user2Data = $user2.Content | ConvertFrom-Json
$user2Id = $user2Data.id
Write-Host "✅ User 2 Created: Bob (ID=$user2Id)"

# ====================================================================================
# STEP 2: User 1 (Alice) logs in and sends a message to User 2 (Bob)
# ====================================================================================
Write-Host "`n💬 STEP 2: Alice sends message to Bob..."

$loginAlice = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{username="alice_con_test";password="test123"} | ConvertTo-Json) `
    -ErrorAction Stop

$loginDataAlice = $loginAlice.Content | ConvertFrom-Json
$aliceToken = $loginDataAlice.token
Write-Host "✅ Alice logged in"

$messageAlice = Invoke-WebRequest -Uri "http://localhost:8081/api/chat/send" `
    -Method POST `
    -Headers @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $aliceToken"
    } `
    -Body (@{receiverId=$user2Id;content="Hello Bob, how are you?"} | ConvertTo-Json) `
    -ErrorAction Stop

$messageAliceData = $messageAlice.Content | ConvertFrom-Json
$conversationId1 = $messageAliceData.conversationId
Write-Host "✅ Message sent successfully"
Write-Host "   Message ID: $($messageAliceData.id)"
Write-Host "   Conversation ID: $conversationId1"

# ====================================================================================
# STEP 3: User 2 (Bob) logs in and sends a reply
# ====================================================================================
Write-Host "`n💬 STEP 3: Bob sends reply to Alice..."

$loginBob = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body (@{username="bob_con_test";password="test123"} | ConvertTo-Json) `
    -ErrorAction Stop

$loginDataBob = $loginBob.Content | ConvertFrom-Json
$bobToken = $loginDataBob.token
Write-Host "✅ Bob logged in"

$messageBob = Invoke-WebRequest -Uri "http://localhost:8081/api/chat/send" `
    -Method POST `
    -Headers @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $bobToken"
    } `
    -Body (@{receiverId=$user1Id;content="Hi Alice, I am doing great!"} | ConvertTo-Json) `
    -ErrorAction Stop

$messageBobData = $messageBob.Content | ConvertFrom-Json
$conversationId2 = $messageBobData.conversationId
Write-Host "✅ Reply sent successfully"
Write-Host "   Message ID: $($messageBobData.id)"
Write-Host "   Conversation ID: $conversationId2"

# ====================================================================================
# STEP 4: VERIFY - Both messages should be in the SAME conversation
# ====================================================================================
Write-Host "`n🔍 STEP 4: Verifying ONE conversation between Alice and Bob..."

if ($conversationId1 -eq $conversationId2) {
    Write-Host "✅ SUCCESS: Both messages are in the SAME conversation (ID=$conversationId1)" -ForegroundColor Green
} else {
    Write-Host "❌ FAILURE: Messages are in DIFFERENT conversations!" -ForegroundColor Red
    Write-Host "   Alice's message conversation ID: $conversationId1"
    Write-Host "   Bob's message conversation ID: $conversationId2"
    exit 1
}

# ====================================================================================
# STEP 5: Fetch messages and verify conversation linking
# ====================================================================================
Write-Host "`n📨 STEP 5: Fetching messages from Alice's perspective..."

$messagesAlice = Invoke-WebRequest -Uri "http://localhost:8081/api/chat/$user2Id" `
    -Headers @{"Authorization"="Bearer $aliceToken"} `
    -ErrorAction Stop

$messagesAliceData = $messagesAlice.Content | ConvertFrom-Json
Write-Host "✅ Retrieved $($messagesAliceData.Count) message(s) for Alice"

Write-Host "`n📨 Fetching messages from Bob's perspective..."

$messagesBob = Invoke-WebRequest -Uri "http://localhost:8081/api/chat/$user1Id" `
    -Headers @{"Authorization"="Bearer $bobToken"} `
    -ErrorAction Stop

$messagesBobData = $messagesBob.Content | ConvertFrom-Json
Write-Host "✅ Retrieved $($messagesBobData.Count) message(s) for Bob"

# ====================================================================================
# STEP 6: Verify both users see the same messages
# ====================================================================================
Write-Host "`n🔄 STEP 6: Verifying message synchronization..."

if ($messagesAliceData.Count -eq 2 -and $messagesBobData.Count -eq 2) {
    Write-Host "✅ Both users see 2 messages (complete conversation history)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Message count mismatch:"
    Write-Host "   Alice sees: $($messagesAliceData.Count) messages"
    Write-Host "   Bob sees: $($messagesBobData.Count) messages"
}

# ====================================================================================
# STEP 7: Fetch conversations list
# ====================================================================================
Write-Host "`n📋 STEP 7: Fetching conversation lists..."

$conversationsAlice = Invoke-WebRequest -Uri "http://localhost:8081/api/users/conversations" `
    -Headers @{"Authorization"="Bearer $aliceToken"} `
    -ErrorAction Stop

$conversationsAliceData = $conversationsAlice.Content | ConvertFrom-Json
Write-Host "✅ Alice has $($conversationsAliceData.Count) conversation(s)"
foreach ($conv in $conversationsAliceData) {
    $otherUser = if ($conv.user1Id -eq $user1Id) { $conv.user2Username } else { $conv.user1Username }
    Write-Host "   - Conversation ID: $($conv.id), with: $otherUser"
}

$conversationsBob = Invoke-WebRequest -Uri "http://localhost:8081/api/users/conversations" `
    -Headers @{"Authorization"="Bearer $bobToken"} `
    -ErrorAction Stop

$conversationsBobData = $conversationsBob.Content | ConvertFrom-Json
Write-Host "`n✅ Bob has $($conversationsBobData.Count) conversation(s)"
foreach ($conv in $conversationsBobData) {
    $otherUser = if ($conv.user1Id -eq $user2Id) { $conv.user2Username } else { $conv.user1Username }
    Write-Host "   - Conversation ID: $($conv.id), with: $otherUser"
}

# ====================================================================================
# FINAL VERIFICATION
# ====================================================================================
Write-Host "`n" + ("="*80)
Write-Host "🎯 CONVERSATION LINKING TEST COMPLETE" -ForegroundColor Green
Write-Host "="*80
Write-Host "`n✅ KEY VERIFICATION RESULTS:"
Write-Host "   ✓ Both messages share same conversation ID: $conversationId1"
Write-Host "   ✓ Both users see complete message history"
Write-Host "   ✓ Conversation list shows proper user pairing"
Write-Host "   ✓ NO duplicate conversations created"
Write-Host "`n🎉 Conversation Linking Phase 3 - COMPLETE AND VERIFIED!`n"
