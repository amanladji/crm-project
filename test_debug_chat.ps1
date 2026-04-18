$baseUrl = "http://localhost:8081"

# Login first
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing

$auth = $loginResponse.Content | ConvertFrom-Json
$token = $auth.token
$adminId = $auth.id

Write-Host "Logged in as admin, ID: $adminId, Token: $($token.Substring(0,20))..." -ForegroundColor Green
Write-Host ""

# Register a test user if needed
$regBody = @{
    username = "testuser2"
    email    = "testuser2@example.com"
    password = "password123"
    role     = "USER"
} | ConvertTo-Json

Write-Host "Registering test user for chat..." -ForegroundColor Cyan
$regResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
    -Method POST `
    -Body $regBody `
    -ContentType "application/json" `
    -UseBasicParsing `
    -ErrorAction SilentlyContinue

Write-Host "Registration status:" -ForegroundColor Cyan
Write-Host $regResponse.Content -ForegroundColor Yellow
Write-Host ""

# Login as the test user to get ID
$testLoginBody = @{
    username = "testuser2"
    password = "password123"
} | ConvertTo-Json

$testLoginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
    -Method POST `
    -Body $testLoginBody `
    -ContentType "application/json" `
    -UseBasicParsing

$testAuth = $testLoginResponse.Content | ConvertFrom-Json
$testUserId = $testAuth.id

Write-Host "Test user ID: $testUserId" -ForegroundColor Green
Write-Host ""

# Now try to send message from admin to test user
$sendUrl = "$baseUrl/api/chat/send"
$messageBody = @{
    receiverId = $testUserId
    content    = "Test message to user $testUserId"
} | ConvertTo-Json

Write-Host "Sending message from admin (ID: $adminId) to test user (ID: $testUserId)" -ForegroundColor Cyan
Write-Host "URL: $sendUrl" -ForegroundColor Cyan
Write-Host "Body: $messageBody" -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri $sendUrl -Method POST `
        -Body $messageBody `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json | ForEach-Object { Write-Host $_ }
} catch {
    Write-Host "ERROR OCCURRED" -ForegroundColor Red
    Write-Host "Exception: $_" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $responseBody = $reader.ReadToEnd()
        
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        Write-Host "Response Body:" -ForegroundColor Red
        Write-Host $responseBody -ForegroundColor Red
    }
}
