$BaseUrl = "http://localhost:8081/api"
$JWT_TOKEN = ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CRM API Testing - Postman Simulation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# STEP 1: Login
Write-Host "STEP 1: Login to get JWT Token" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$loginBody = @{
    email = "test@gmail.com"
    password = "Test@12345"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing -ErrorAction Stop
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $JWT_TOKEN = $loginData.token
    Write-Host "Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Token received: $($JWT_TOKEN.Substring(0,30))..." -ForegroundColor Green
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Headers for authenticated requests
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $JWT_TOKEN"
}

# STEP 2: Valid Customer Creation
Write-Host "STEP 2: POST /api/customers - Valid Customer" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$testCustomer1 = @{
    name = "Test User"
    email = "test@gmail.com"
    phone = "9876543210"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $testCustomer1 -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode) - Created" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: " -ForegroundColor Red
    $_.Exception.Response.Content.ToString() | Write-Host
}
Write-Host ""

# STEP 3: Duplicate Email (409 Conflict)
Write-Host "STEP 3: POST /api/customers - Duplicate Email" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$testCustomer2 = @{
    name = "Another User"
    email = "test@gmail.com"
    phone = "1234567890"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $testCustomer2 -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: Should have failed!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Expected 409 Conflict - Got: $statusCode" -ForegroundColor Green
    Write-Host "Error Response:" -ForegroundColor Cyan
    $_.Exception.Response.Content.ToString() | Write-Host
}
Write-Host ""

# STEP 4: Missing Email (400 Bad Request)
Write-Host "STEP 4: POST /api/customers - Missing Email" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$testCustomer3 = @{
    name = "Test User"
    phone = "1234567890"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $testCustomer3 -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: Should have failed!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Expected 400 Bad Request - Got: $statusCode" -ForegroundColor Green
    Write-Host "Error Response:" -ForegroundColor Cyan
    $_.Exception.Response.Content.ToString() | Write-Host
}
Write-Host ""

# STEP 5: Invalid Phone (400 Bad Request)
Write-Host "STEP 5: POST /api/customers - Invalid Phone" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$testCustomer4 = @{
    name = "Test User"
    email = "test2@gmail.com"
    phone = "123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $testCustomer4 -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: Should have failed!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Expected 400 Bad Request - Got: $statusCode" -ForegroundColor Green
    Write-Host "Error Response:" -ForegroundColor Cyan
    $_.Exception.Response.Content.ToString() | Write-Host
}
Write-Host ""

# STEP 6: GET All Customers
Write-Host "STEP 6: GET /api/customers - Fetch All Customers" -ForegroundColor Yellow
Write-Host "--------------------------------------"

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Customers found: $($data.Length)" -ForegroundColor Cyan
    if ($data.Length -gt 0) {
        Write-Host "Sample customer:" -ForegroundColor Cyan
        $data[0] | ConvertTo-Json | Write-Host
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# STEP 7: Malformed JSON (400 Bad Request)
Write-Host "STEP 7: POST /api/customers - Malformed JSON" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$malformedBody = '{invalid json}'

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $malformedBody -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: Should have failed!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Expected 400 Bad Request - Got: $statusCode" -ForegroundColor Green
    Write-Host "Error Response:" -ForegroundColor Cyan
    $_.Exception.Response.Content.ToString() | Write-Host
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETE" -ForegroundColor Green
Write-Host "========================================"
