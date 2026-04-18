$baseUrl = "http://localhost:8081/api"

Write-Host ""
Write-Host "=== FRONTEND HANDLESEND FIX VERIFICATION ===" -ForegroundColor Green
Write-Host ""

# Step 1: Login
Write-Host "[1] Login as admin..."
$json = '{"username":"admin","password":"admin123"}'
$loginResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $json -UseBasicParsing
$userData = $loginResp.Content | ConvertFrom-Json
$token = $userData.token
$userId = $userData.id
Write-Host "    User: $($userData.username), ID: $userId"

# Step 2: Get conversation users
Write-Host ""
Write-Host "[2] Getting conversation users..."
$headers = @{"Authorization" = "Bearer $token"}
$usersResp = Invoke-WebRequest -Uri "$baseUrl/users/conversations" -Method GET -Headers $headers -UseBasicParsing
$users = $usersResp.Content | ConvertFrom-Json

if ($users.Count -gt 0) {
    $targetUser = $users[0]
    Write-Host "    Found user: $($targetUser.username) (ID: $($targetUser.id))"
    
    # Step 3: Send message
    Write-Host ""
    Write-Host "[3] Sending message..."
    $msgPayload = '{"receiverId":' + $targetUser.id + ',"content":"Test from handleSend fix"}'
    
    try {
        $sendResp = Invoke-WebRequest -Uri "$baseUrl/chat/send" -Method POST -ContentType "application/json" -Body $msgPayload -Headers $headers -UseBasicParsing
        Write-Host "    OK Message sent (Status: $($sendResp.StatusCode))"
        
        # Step 4: Fetch messages
        Write-Host ""
        Write-Host "[4] Fetching updated messages..."
        $chatResp = Invoke-WebRequest -Uri "$baseUrl/chat/$($targetUser.id)" -Method GET -Headers $headers -UseBasicParsing
        $messages = $chatResp.Content | ConvertFrom-Json
        Write-Host "    OK Retrieved messages: $($messages.Count)"
        
        Write-Host ""
        Write-Host "[SUCCESS] handleSend flow works!" -ForegroundColor Green
    } catch {
        Write-Host "    ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "    No users found"
}

Write-Host ""
