param()

Write-Host "Chat Message Delivery Test" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8081"

# Test Step 1: Create two users
Write-Host "STEP 1: Setup two test users" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

function Register-User {
    param([string]$username, [string]$email, [string]$password)
    
    $body = @{
        username = $username
        email    = $email
        password = $password
        role     = "USER"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST `
            -Body $body -ContentType "application/json" `
            -UseBasicParsing -ErrorAction SilentlyContinue
        
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Login-User {
    param([string]$username, [string]$password)
    
    $body = @{
        username = $username
        password = $password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST `
            -Body $body -ContentType "application/json" `
            -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $auth = $response.Content | ConvertFrom-Json
            return @{ id = $auth.id; token = $auth.token; username = $auth.username }
        }
    } catch {}
    return $null
}

# Register and login users
Register-User "testuser_a" "testuser_a@test.com" "password123" | Out-Null
Register-User "testuser_b" "testuser_b@test.com" "password123" | Out-Null

$userA = Login-User "testuser_a" "password123"
$userB = Login-User "testuser_b" "password123"

if (-not $userA -or -not $userB) {
    Write-Host "ERROR: Failed to setup users" -ForegroundColor Red
    exit 1
}

Write-Host "User A: ID=$($userA.id), Username=$($userA.username)" -ForegroundColor Green
Write-Host "User B: ID=$($userB.id), Username=$($userB.username)" -ForegroundColor Green
Write-Host ""

# Test Step 2: User A sends message to User B
Write-Host "STEP 2: User A sends message to User B" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Yellow

$messageContent = "Hello User B, this is a test message from User A"
$sendBody = @{
    receiverId = $userB.id
    content    = $messageContent
} | ConvertTo-Json

Write-Host "Sending message from User A (ID=$($userA.id)) to User B (ID=$($userB.id))" -ForegroundColor Cyan
Write-Host "Content: $messageContent" -ForegroundColor Gray

try {
    $headers = @{ "Authorization" = "Bearer $($userA.token)" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST `
        -Body $sendBody -Headers $headers -ContentType "application/json" `
        -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 201) {
        $msgData = $response.Content | ConvertFrom-Json
        $messageId = $msgData.id
        Write-Host "SUCCESS: Message sent with ID=$messageId" -ForegroundColor Green
        Write-Host "  Sender: $($msgData.senderName) (ID: $($msgData.senderId))" -ForegroundColor Green
        Write-Host "  Receiver: $($msgData.receiverName) (ID: $($msgData.receiverId))" -ForegroundColor Green
        Write-Host "  Content: $($msgData.content)" -ForegroundColor Green
        Write-Host "  Timestamp: $($msgData.timestamp)" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR sending message: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test Step 3: User B fetches messages - should see message from User A
Write-Host "STEP 3: User B fetches messages from conversation with User A" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------" -ForegroundColor Yellow

try {
    $headers = @{ "Authorization" = "Bearer $($userB.token)" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/$($userA.id)" -Method GET `
        -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $messages = $response.Content | ConvertFrom-Json
        
        if ($messages -and $messages.Count -gt 0) {
            Write-Host "SUCCESS: Retrieved $($messages.Count) message(s) from conversation" -ForegroundColor Green
            
            $messages | ForEach-Object {
                Write-Host "  Message ID: $($_.id)" -ForegroundColor Green
                Write-Host "    From: $($_.senderName) (ID: $($_.senderId))" -ForegroundColor Green
                Write-Host "    To: $($_.receiverName) (ID: $($_.receiverId))" -ForegroundColor Green
                Write-Host "    Content: $($_.content)" -ForegroundColor Green
                Write-Host "    Timestamp: $($_.timestamp)" -ForegroundColor Green
                Write-Host ""
            }
            
            # Verify message content
            $foundMessage = $messages | Where-Object { $_.content -eq $messageContent }
            if ($foundMessage) {
                Write-Host "VERIFIED: Message from User A is visible to User B" -ForegroundColor Green
            } else {
                Write-Host "ERROR: Expected message not found in conversation" -ForegroundColor Red
            }
        } else {
            Write-Host "ERROR: No messages found in conversation" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "ERROR fetching messages: $_" -ForegroundColor Red
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    Write-Host "Response: $($reader.ReadToEnd())" -ForegroundColor Red
}
Write-Host ""

# Test Step 4: User A sends another message and User B fetches again
Write-Host "STEP 4: User A sends second message and User B fetches again" -ForegroundColor Yellow
Write-Host "-----------------------------------------------------------" -ForegroundColor Yellow

$messageContent2 = "This is the second message"
$sendBody2 = @{
    receiverId = $userB.id
    content    = $messageContent2
} | ConvertTo-Json

try {
    $headers = @{ "Authorization" = "Bearer $($userA.token)" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST `
        -Body $sendBody2 -Headers $headers -ContentType "application/json" `
        -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 201) {
        Write-Host "Second message sent successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR sending second message: $_" -ForegroundColor Red
}

# Fetch again as User B
try {
    $headers = @{ "Authorization" = "Bearer $($userB.token)" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/$($userA.id)" -Method GET `
        -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $messages = $response.Content | ConvertFrom-Json
        
        if ($messages -and $messages.Count -eq 2) {
            Write-Host "SUCCESS: Both messages now visible to User B" -ForegroundColor Green
            Write-Host "  Message count: $($messages.Count)" -ForegroundColor Green
            
            $messages | ForEach-Object {
                Write-Host "    - $($_.content) (from $($_.senderName))" -ForegroundColor Green
            }
        } else {
            Write-Host "ERROR: Expected 2 messages, got $($messages.Count)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "ERROR fetching messages second time: $_" -ForegroundColor Red
}
Write-Host ""

# Test Step 5: User B sends message back to User A
Write-Host "STEP 5: User B sends message back to User A" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Yellow

$replyContent = "Hello User A, thanks for the message!"
$replyBody = @{
    receiverId = $userA.id
    content    = $replyContent
} | ConvertTo-Json

try {
    $headers = @{ "Authorization" = "Bearer $($userB.token)" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST `
        -Body $replyBody -Headers $headers -ContentType "application/json" `
        -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 201) {
        Write-Host "User B sent reply successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR sending reply: $_" -ForegroundColor Red
}

# User A fetches and should see User B's message
try {
    $headers = @{ "Authorization" = "Bearer $($userA.token)" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/chat/$($userB.id)" -Method GET `
        -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $messages = $response.Content | ConvertFrom-Json
        $replyFound = $messages | Where-Object { $_.content -eq $replyContent }
        
        if ($replyFound) {
            Write-Host "SUCCESS: User A received reply from User B" -ForegroundColor Green
            Write-Host "  Message: $($replyFound.content)" -ForegroundColor Green
        } else {
            Write-Host "ERROR: User A did not see reply from User B" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "ERROR fetching reply: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Chat Message Delivery Test Complete" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
