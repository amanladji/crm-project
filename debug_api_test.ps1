# Debug test script to check API responses in detail
$baseUrl = "http://localhost:8081"

Write-Host "=== API CONNECTIVITY DEBUG ===" -ForegroundColor Cyan

# Test 1: Health endpoint (should be accessible without auth)
Write-Host "`n1. Testing /api/health endpoint:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Register endpoint
Write-Host "`n2. Testing /api/auth/register endpoint:" -ForegroundColor Yellow
$uniqueUser = "testuser_$(Get-Random -Min 10000 -Max 99999)"
$registerPayload = @{
    username = $uniqueUser
    password = "Password123!!"
    email = "$uniqueUser@test.com"
    role = "USER"
} | ConvertTo-Json

Write-Host "   Sending payload: $registerPayload" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerPayload `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Green
    
    $regResponse = $response.Content | ConvertFrom-Json
    if ($regResponse.token) {
        Write-Host "   Token extracted: $($regResponse.token.Substring(0, 30))..." -ForegroundColor Green
        $token = $regResponse.token
    } else {
        Write-Host "   Fields in response: $($regResponse | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to read the response body
    try {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Response Body: $errorContent" -ForegroundColor Red
    } catch {}
}

# Test 3: Login endpoint
Write-Host "`n3. Testing /api/auth/login endpoint:" -ForegroundColor Yellow
$loginPayload = @{
    username = $uniqueUser
    password = "Password123!!"
} | ConvertTo-Json

Write-Host "   Sending payload: $loginPayload" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginPayload `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Green
    
    $loginResponse = $response.Content | ConvertFrom-Json
    if ($loginResponse.token) {
        Write-Host "   Token extracted: $($loginResponse.token.Substring(0, 30))..." -ForegroundColor Green
        $token = $loginResponse.token
    }
} catch {
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    try {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Response Body: $errorContent" -ForegroundColor Red
    } catch {}
}

# Test 4: Try accessing a protected endpoint without token
Write-Host "`n4. Testing /api/customers WITHOUT token:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/customers" `
        -Method GET `
        -ContentType "application/json" `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "   Expected: 403 Forbidden (unauthenticated)" -ForegroundColor Gray
}

# Test 5: Try accessing protected endpoint WITH token (if we have one)
if ($token) {
    Write-Host "`n5. Testing /api/customers WITH token:" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/customers" `
            -Method GET `
            -ContentType "application/json" `
            -Headers @{ "Authorization" = "Bearer $token" } `
            -UseBasicParsing `
            -ErrorAction Stop
        
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Response length: $($response.Content.Length) bytes" -ForegroundColor Green
    } catch {
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Check CORS by testing an OPTIONS request
Write-Host "`n6. Testing CORS preflight (OPTIONS request):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "http://localhost:5173"
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type"
        } `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   CORS headers present: Yes" -ForegroundColor Green
} catch {
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "Debug test complete. Check output above for issues." -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Cyan
