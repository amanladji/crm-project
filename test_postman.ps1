$BaseUrl = "http://localhost:8081/api"
$JWT_TOKEN = ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CRM Customer API - Postman Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# STEP 1: Login with default admin user
Write-Host "STEP 1: POST /api/auth/login - Get JWT Token" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing -ErrorAction Stop
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $JWT_TOKEN = $loginData.token
    Write-Host "✅ Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    Write-Host "✅ JWT Token received: $($JWT_TOKEN.Substring(0,40))..." -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login FAILED: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Response content:" -ForegroundColor Red
    try {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $streamReader.ReadToEnd() | Write-Host
    } catch {
        Write-Host "Could not read response" -ForegroundColor Yellow
    }
    Write-Host ""
    exit 1
}

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $JWT_TOKEN"
}

# STEP 2: Create valid customer
Write-Host "STEP 2: POST /api/customers - Create Valid Customer" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$customer1 = @{
    name = "John Doe"
    email = "john.doe@example.com"
    phone = "9876543210"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Gray
Write-Host $customer1 -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $customer1 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode) (Created)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Cyan
    $responseData = $response.Content | ConvertFrom-Json
    $responseData | ConvertTo-Json | Write-Host
    $customerId = $responseData.id
    Write-Host ""
} catch {
    Write-Host "❌ Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    try {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $streamReader.ReadToEnd() | Write-Host
    } catch {
        Write-Host "Could not read error response" -ForegroundColor Yellow
    }
    Write-Host ""
}

# STEP 3: Get created customer
Write-Host "STEP 3: GET /api/customers/$customerId - Retrieve Created Customer" -ForegroundColor Yellow
Write-Host "--------------------------------------"

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers/$customerId" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
    Write-Host ""
} catch {
    Write-Host "❌ Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host ""
}

# STEP 4: Duplicate Email (409 Conflict)
Write-Host "STEP 4: POST /api/customers - Duplicate Email" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$customer2 = @{
    name = "Jane Smith"
    email = "john.doe@example.com"  # Duplicate email
    phone = "1234567890"
} | ConvertTo-Json

Write-Host "Request Body (Duplicate Email):" -ForegroundColor Gray
Write-Host $customer2 -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $customer2 -UseBasicParsing -ErrorAction Stop
    Write-Host "❌ ERROR: Should have failed!" -ForegroundColor Red
    Write-Host ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✅ Expected Error Status: $statusCode (Expecting 409)" -ForegroundColor Green
    Write-Host "Error Response:" -ForegroundColor Cyan
    try {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorContent = $streamReader.ReadToEnd()
        $errorContent | ConvertFrom-Json -ErrorAction SilentlyContinue | ConvertTo-Json | Write-Host
    } catch {
        Write-Host $errorContent
    }
    Write-Host ""
}

# STEP 5: Missing Email Field (400 Bad Request)
Write-Host "STEP 5: POST /api/customers - Missing Email (Validation Error)" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$customer3 = @{
    name = "Bob Johnson"
    phone = "5555555555"
} | ConvertTo-Json

Write-Host "Request Body (Missing Email):" -ForegroundColor Gray
Write-Host $customer3 -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $customer3 -UseBasicParsing -ErrorAction Stop
    Write-Host "❌ ERROR: Should have failed!" -ForegroundColor Red
    Write-Host ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✅ Expected Error Status: $statusCode (Expecting 400)" -ForegroundColor Green
    Write-Host "Error Response:" -ForegroundColor Cyan
    try {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorContent = $streamReader.ReadToEnd()
        $errorContent | ConvertFrom-Json | ConvertTo-Json | Write-Host
    } catch {
        Write-Host $errorContent
    }
    Write-Host ""
}

# STEP 6: Invalid Phone (400 Bad Request)
Write-Host "STEP 6: POST /api/customers - Invalid Phone Format" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$customer4 = @{
    name = "Alice Brown"
    email = "alice@example.com"
    phone = "123"  # Too short
} | ConvertTo-Json

Write-Host "Request Body (Invalid Phone):" -ForegroundColor Gray
Write-Host $customer4 -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $customer4 -UseBasicParsing -ErrorAction Stop
    Write-Host "❌ ERROR: Should have failed!" -ForegroundColor Red
    Write-Host ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✅ Expected Error Status: $statusCode (Expecting 400)" -ForegroundColor Green
    Write-Host "Error Response:" -ForegroundColor Cyan
    try {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorContent = $streamReader.ReadToEnd()
        $errorContent | ConvertFrom-Json | ConvertTo-Json | Write-Host
    } catch {
        Write-Host $errorContent
    }
    Write-Host ""
}

# STEP 7: Malformed JSON (400 Bad Request)
Write-Host "STEP 7: POST /api/customers - Malformed JSON" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$malformedBody = '{invalid json here}'

Write-Host "Request Body (Malformed):" -ForegroundColor Gray
Write-Host $malformedBody -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $malformedBody -UseBasicParsing -ErrorAction Stop
    Write-Host "❌ ERROR: Should have failed!" -ForegroundColor Red
    Write-Host ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✅ Expected Error Status: $statusCode (Expecting 400)" -ForegroundColor Green
    Write-Host "Error Response:" -ForegroundColor Cyan
    try {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorContent = $streamReader.ReadToEnd()
        $errorContent | ConvertFrom-Json | ConvertTo-Json | Write-Host
    } catch {
        Write-Host $errorContent
    }
    Write-Host ""
}

# STEP 8: non-existent customer (404 Not Found)
Write-Host "STEP 8: GET /api/customers/9999 - Customer Not Found" -ForegroundColor Yellow
Write-Host "--------------------------------------"

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers/9999" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "❌ ERROR: Should have failed!" -ForegroundColor Red
    Write-Host ""
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✅ Expected Error Status: $statusCode (Expecting 404)" -ForegroundColor Green
    Write-Host "Error Response:" -ForegroundColor Cyan
    try {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorContent = $streamReader.ReadToEnd()
        $errorContent | ConvertFrom-Json | ConvertTo-Json | Write-Host
    } catch {
        Write-Host $errorContent
    }
    Write-Host ""
}

# STEP 9: Get All Customers
Write-Host "STEP 9: GET /api/customers - List All Customers" -ForegroundColor Yellow
Write-Host "--------------------------------------"

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    $customers = $response.Content | ConvertFrom-Json
    Write-Host "Total customers in database: $($customers.Length)" -ForegroundColor Cyan
    if ($customers.Length -gt 0) {
        Write-Host "Sample customer:" -ForegroundColor Cyan
        $customers[0] | ConvertTo-Json | Write-Host
    }
    Write-Host ""
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Customer API Postman Testing COMPLETE" -ForegroundColor Green
Write-Host "========================================"
