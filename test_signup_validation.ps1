Write-Host "=== Testing Signup Validation ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:8081/api/auth/register"

# Test 1: Short password (less than 8 characters)
Write-Host "`n[TEST 1] Short password" -ForegroundColor Yellow
$body1 = @{
    username = "testuser1"
    email = "test1@example.com"
    password = "short"
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body1 -ErrorAction Stop -UseBasicParsing
    Write-Host "Status: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response1.Content)" -ForegroundColor Green
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value)" -ForegroundColor Red
    $error = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error Message: $($error.message)" -ForegroundColor Red
}

# Test 2: Valid signup first
Write-Host "`n[TEST 2] Valid signup" -ForegroundColor Yellow
$body2 = @{
    username = "unique_user"
    email = "unique@example.com"
    password = "validPassword123"
} | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body2 -ErrorAction Stop -UseBasicParsing
    Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response2.Content)" -ForegroundColor Green
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value)" -ForegroundColor Red
    $error = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error: $($error.message)" -ForegroundColor Red
}

# Test 3: Duplicate email
Write-Host "`n[TEST 3] Duplicate email" -ForegroundColor Yellow
$body3 = @{
    username = "another_user"
    email = "unique@example.com"
    password = "anotherPassword123"
} | ConvertTo-Json

try {
    $response3 = Invoke-WebRequest -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body3 -ErrorAction Stop -UseBasicParsing
    Write-Host "Status: $($response3.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response3.Content)" -ForegroundColor Green
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value)" -ForegroundColor Red
    $error = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error Message: $($error.message)" -ForegroundColor Red
}

# Test 4: Duplicate username
Write-Host "`n[TEST 4] Duplicate username" -ForegroundColor Yellow
$body4 = @{
    username = "unique_user"
    email = "another@example.com"
    password = "validPassword123"
} | ConvertTo-Json

try {
    $response4 = Invoke-WebRequest -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body4 -ErrorAction Stop -UseBasicParsing
    Write-Host "Status: $($response4.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response4.Content)" -ForegroundColor Green
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value)" -ForegroundColor Red
    $error = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error Message: $($error.message)" -ForegroundColor Red
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan
