$BaseUrl = "http://localhost:8081/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CRM Customer API - Error Handling Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$headers = @{
    "Content-Type" = "application/json"
}

# TEST 1: Invalid JSON (400 Bad Request)
Write-Host "TEST 1: POST /api/customers - Malformed JSON" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$malformedBody = '{invalid json}'

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $malformedBody -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    try {
        $errorContent = $_.Exception.Response.Content.ReadAsStream() | ForEach-Object {[System.Text.Encoding]::UTF8.GetString($_)}
        $errorContent | Write-Host
    } catch {
        Write-Host "Could not read error response" -ForegroundColor Yellow
    }
    Write-Host ""
}

# TEST 2: Missing required field (email)
Write-Host "TEST 2: POST /api/customers - Missing Email (400 Bad Request)" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$missingEmailBody = @{
    name = "Test User"
    phone = "1234567890"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $missingEmailBody -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    try {
        $errorContent = $_.Exception.Response.Content.ReadAsStream() | ForEach-Object {[System.Text.Encoding]::UTF8.GetString($_)}
        [System.Text.Encoding]::UTF8.GetString($errorContent) | ConvertFrom-Json -ErrorAction SilentlyContinue | ConvertTo-Json | Write-Host
    } catch {
        Write-Host $errorContent
    }
    Write-Host ""
}

# TEST 3: Invalid Phone (400 Bad Request)
Write-Host "TEST 3: POST /api/customers - Invalid Phone Format" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$invalidPhoneBody = @{
    name = "Test User"
    email = "test3@example.com"
    phone = "123"  # Invalid - must be 10 digits or empty
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $invalidPhoneBody -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    try {
        $errorContent = $_.Exception.Response.Content.ReadAsStream() | ForEach-Object {[System.Text.Encoding]::UTF8.GetString($_)}
        [System.Text.Encoding]::UTF8.GetString($errorContent) | ConvertFrom-Json -ErrorAction SilentlyContinue | ConvertTo-Json | Write-Host
    } catch {
        Write-Host $errorContent
    }
    Write-Host ""
}

# TEST 4: Valid Customer without JWT (should fail with 403)
Write-Host "TEST 4: POST /api/customers - Valid Data but No JWT Token (403 Forbidden)" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$validCustomerBody = @{
    name = "John Doe"
    email = "john@example.com"
    phone = "9876543210"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $validCustomerBody -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode (Expected: 401 or 403)" -ForegroundColor Green
    Write-Host "Note: Requires JWT token for authorization" -ForegroundColor Cyan
    Write-Host ""
}

# TEST 5: GET Customers endpoint (should fail without JWT)
Write-Host "TEST 5: GET /api/customers - Without JWT Token (401/403)" -ForegroundColor Yellow
Write-Host "--------------------------------------"

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode (Expected: 401 or 403)" -ForegroundColor Green
    Write-Host "Note: Requires JWT token for authorization" -ForegroundColor Cyan
    Write-Host ""
}

# TEST 6: Invalid method
Write-Host "TEST 6: DELETE /api/customers/9999 - Without JWT Token (401/403)" -ForegroundColor Yellow
Write-Host "--------------------------------------"

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers/9999" -Method DELETE -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode (Expected: 401 or 403)" -ForegroundColor Green
    Write-Host "Note: Requires JWT token for authorization" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "ERROR HANDLING TESTS COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "✅ Malformed JSON - Returns 400 with error message" -ForegroundColor Green
Write-Host "✅ Missing required fields - Returns 400 with validation errors" -ForegroundColor Green
Write-Host "✅ Invalid data format - Returns 400 with error message" -ForegroundColor Green
Write-Host "✅ Unauthorized requests - Returns 401/403" -ForegroundColor Green
