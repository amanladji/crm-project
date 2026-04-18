param()

Write-Host "Chat Send API Test Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8081"

# Admin credentials (created by DataSeeder)
$admin = @{ username = "admin"; password = "admin123" }

Write-Host ""
Write-Host "STEP 1: Login with admin account" -ForegroundColor Cyan

$loginUrl = "$baseUrl/api/auth/login"
$body = @{
    username = $admin.username
    password = $admin.password
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $loginUrl -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        $auth = $response.Content | ConvertFrom-Json
        $adminToken = $auth.token
        $adminId = $auth.id
        Write-Host "Login successful" -ForegroundColor Green
        Write-Host "User ID: $adminId" -ForegroundColor Green
    } else {
        Write-Host "Login failed with status: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Login error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "STEP 2: Register test users" -ForegroundColor Cyan

function Register-User {
    param([string]$username, [string]$email, [string]$password)
    
    $regUrl = "$baseUrl/api/auth/register"
    $body = @{
        username = $username
        email    = $email
        password = $password
        role     = "USER"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri $regUrl -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "Registered: $username" -ForegroundColor Green
            return $true
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq "BadRequest") {
            Write-Host "User already exists: $username" -ForegroundColor Yellow
            return $true
        }
        Write-Host "Registration error: $_" -ForegroundColor Red
        return $false
    }
}

# Register test users
Register-User "user1" "user1@test.com" "password123"
Register-User "user2" "user2@test.com" "password123"

Write-Host ""
Write-Host "STEP 3: Get user IDs and tokens" -ForegroundColor Cyan

function Login-User {
    param([string]$username, [string]$password)
    
    $loginUrl = "$baseUrl/api/auth/login"
    $body = @{
        username = $username
        password = $password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri $loginUrl -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $auth = $response.Content | ConvertFrom-Json
            return @{ id = $auth.id; token = $auth.token }
        }
    } catch {}
    return $null
}

$user1 = Login-User "user1" "password123"
$user2 = Login-User "user2" "password123"

if (-not $user1 -or -not $user2) {
    Write-Host "Failed to login test users" -ForegroundColor Red
    exit 1
}

Write-Host "User 1 ID: $($user1.id), Token: $($user1.token.Substring(0,10))..." -ForegroundColor Green
Write-Host "User 2 ID: $($user2.id), Token: $($user2.token.Substring(0,10))..." -ForegroundColor Green

Write-Host ""
Write-Host "STEP 4: Test POST /api/chat/send" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$sendUrl = "$baseUrl/api/chat/send"
$testsPassed = 0
$testsFailed = 0

# Test 1: Send message from user1 to user2
Write-Host ""
Write-Host "Test 1: Send message from user1 to user2" -ForegroundColor Yellow

$body = @{
    receiverId = $user2.id
    content    = "Hello from user1"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $($user1.token)"
        "Content-Type"  = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri $sendUrl -Method POST `
        -Body $body `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 201) {
        $msg = $response.Content | ConvertFrom-Json
        Write-Host "SUCCESS - Message sent" -ForegroundColor Green
        Write-Host "Message ID: $($msg.id)" -ForegroundColor Green
        Write-Host "Content: $($msg.content)" -ForegroundColor Green
        Write-Host "Receiver: $($msg.receiverName)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "FAILED - Status: $($response.StatusCode)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host "$($_.Exception.Response)" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Send message back from user2 to user1
Write-Host ""
Write-Host "Test 2: Send message back from user2 to user1" -ForegroundColor Yellow

$body = @{
    receiverId = $user1.id
    content    = "Hello from user2"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $($user2.token)"
        "Content-Type"  = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri $sendUrl -Method POST `
        -Body $body `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction Stop
    
    if ($response.StatusCode -eq 201) {
        $msg = $response.Content | ConvertFrom-Json
        Write-Host "SUCCESS - Message sent" -ForegroundColor Green
        Write-Host "Message ID: $($msg.id)" -ForegroundColor Green
        Write-Host "Content: $($msg.content)" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Send empty message should fail
Write-Host ""
Write-Host "Test 3: Empty message should fail" -ForegroundColor Yellow

$body = @{
    receiverId = $user2.id
    content    = ""
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $($user1.token)"
        "Content-Type"  = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri $sendUrl -Method POST `
        -Body $body `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -ne 201) {
        Write-Host "CORRECT - Empty message rejected" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq "BadRequest") {
        Write-Host "CORRECT - Empty message rejected with 400" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "ERROR: Unexpected status" -ForegroundColor Red
        $testsFailed++
    }
}

# Test 4: Invalid receiver should fail
Write-Host ""
Write-Host "Test 4: Invalid receiver ID should fail" -ForegroundColor Yellow

$body = @{
    receiverId = 99999
    content    = "This should fail"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $($user1.token)"
        "Content-Type"  = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri $sendUrl -Method POST `
        -Body $body `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -ne 201) {
        Write-Host "CORRECT - Invalid receiver rejected" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq "BadRequest") {
        Write-Host "CORRECT - Invalid receiver rejected with 400" -ForegroundColor Green
        $testsPassed++
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Results" -ForegroundColor Green
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host "All tests passed - Chat API working correctly" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed" -ForegroundColor Red
    exit 1
}
