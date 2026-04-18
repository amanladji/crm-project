$baseUrl = "http://localhost:8081"

# 1. Login
Write-Host "Step 1: Login" -ForegroundColor Cyan
$loginBody = @{ username = "admin"; password = "admin123" } | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST `
    -Body $loginBody -ContentType "application/json" -UseBasicParsing

$auth = $loginResponse.Content | ConvertFrom-Json
$token = $auth.token
Write-Host "Token obtained" -ForegroundColor Green
Write-Host ""

# 2. Test GET endpoint
Write-Host "Step 2: Test GET /api/chat/test" -ForegroundColor Cyan
$headers = @{ "Authorization" = "Bearer $token" }
try {
    $testResponse = Invoke-WebRequest -Uri "$baseUrl/api/chat/test" -Method GET `
        -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($testResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($testResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""

# 3. Test POST with admin to admin (self)
Write-Host "Step 3: Test POST /api/chat/send (admin to self - ID: 1)" -ForegroundColor Cyan
$sendBody = @{
    receiverId = 1
    content = "Message from admin to self"
} | ConvertTo-Json

try {
    $sendResponse = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST `
        -Body $sendBody -Headers $headers -ContentType "application/json" `
        -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($sendResponse.StatusCode)" -ForegroundColor Green
    $sendResponse.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
} catch {
    Write-Host "Error: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    } else {
        Write-Host $_ -ForegroundColor Red
    }
}
