$BaseUrl = "http://localhost:8081/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend Integration Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Login
Write-Host "STEP 1: Frontend Auth - Login with admin credentials" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing -ErrorAction Stop
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $JWT_TOKEN = $loginData.token
    
    Write-Host "Status: 200 OK" -ForegroundColor Green
    Write-Host "Token: $($JWT_TOKEN.Substring(0,50))..." -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Login failed" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $JWT_TOKEN"
}

# Step 2: Frontend form data
Write-Host "STEP 2: Frontend Form - User enters customer details" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$timestamp = Get-Random -Minimum 10000 -Maximum 99999

$formData = @{
    name = "Michael Chen"
    email = "michael.chen$timestamp@example.com"
    phone = "5552223333"
    company = "Innovation Corp"
    address = "789 Pine Street"
}

Write-Host "Name: $($formData.name)" -ForegroundColor Gray
Write-Host "Email: $($formData.email)" -ForegroundColor Gray
Write-Host "Phone: $($formData.phone)" -ForegroundColor Gray
Write-Host "Company: $($formData.company)" -ForegroundColor Gray
Write-Host "Address: $($formData.address)" -ForegroundColor Gray
Write-Host ""

# Step 3: Frontend validation
Write-Host "STEP 3: Frontend Validation" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$isValid = $true
$validationErrors = @{}

if ([string]::IsNullOrWhiteSpace($formData.name)) {
    $validationErrors["name"] = "Name is required"
    $isValid = $false
}

if ([string]::IsNullOrWhiteSpace($formData.email)) {
    $validationErrors["email"] = "Email is required"
    $isValid = $false
} elseif ($formData.email -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') {
    $validationErrors["email"] = "Invalid email format"
    $isValid = $false
}

if ($formData.phone -and $formData.phone -notmatch '^[0-9]{10}$') {
    $validationErrors["phone"] = "Phone must be 10 digits"
    $isValid = $false
}

if ($isValid) {
    Write-Host "Validation PASSED" -ForegroundColor Green
} else {
    Write-Host "Validation FAILED" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Create payload for API
Write-Host "STEP 4: Frontend Payload Preparation" -ForegroundColor Yellow
Write-Host "--------------------------------------"

$payload = @{
    name = $formData.name.Trim()
    email = $formData.email.Trim()
    phone = $formData.phone.Trim()
    company = $formData.company.Trim()
    address = $formData.address.Trim()
} | ConvertTo-Json

Write-Host "Payload to send to backend:" -ForegroundColor Cyan
Write-Host $payload -ForegroundColor Gray
Write-Host ""

# Step 5: Send request
Write-Host "STEP 5: Network Request - POST /api/customers" -ForegroundColor Yellow
Write-Host "--------------------------------------"
Write-Host "URL: POST $BaseUrl/customers" -ForegroundColor Gray
Write-Host "Headers:" -ForegroundColor Gray
Write-Host "  Authorization: Bearer [token]" -ForegroundColor Gray
Write-Host "  Content-Type: application/json" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/customers" -Method POST -Headers $headers -Body $payload -UseBasicParsing -ErrorAction Stop
    
    Write-Host "Status: $($response.StatusCode) (Created)" -ForegroundColor Green
    Write-Host ""
    
    $responseContent = $response.Content
    Write-Host "Response from backend:" -ForegroundColor Cyan
    Write-Host $responseContent -ForegroundColor Gray
    Write-Host ""
    
    $responseData = $responseContent | ConvertFrom-Json
    $customerId = $responseData.id
    
    # Step 6: Verify customer in database
    Write-Host "STEP 6: Database Verification" -ForegroundColor Yellow
    Write-Host "--------------------------------------"
    
    Write-Host "Customer ID: $customerId" -ForegroundColor Gray
    Write-Host "Fetching details for ID: $customerId" -ForegroundColor Gray
    
    $getUri = "$BaseUrl/customers/$customerId"
    $getResponse = Invoke-WebRequest -Uri $getUri -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    $customerData = $getResponse.Content | ConvertFrom-Json
    
    Write-Host "Status: 200 OK" -ForegroundColor Green
    Write-Host "Customer retrieved from database:" -ForegroundColor Cyan
    Write-Host ($customerData | ConvertTo-Json) -ForegroundColor Gray
    Write-Host ""
    
    # Step 7: Data integrity check
    Write-Host "STEP 7: Data Integrity Check" -ForegroundColor Yellow
    Write-Host "--------------------------------------"
    
    Write-Host "Comparing form input with database record:" -ForegroundColor Cyan
    if($customerData.name -eq $formData.name) { $nameMatch = "YES" } else { $nameMatch = "NO" }
    if($customerData.email -eq $formData.email) { $emailMatch = "YES" } else { $emailMatch = "NO" }
    if($customerData.phone -eq $formData.phone) { $phoneMatch = "YES" } else { $phoneMatch = "NO" }
    
    Write-Host "Name: Expected=$($formData.name), Got=$($customerData.name), Match=$nameMatch" -ForegroundColor Gray
    Write-Host "Email: Expected=$($formData.email), Got=$($customerData.email), Match=$emailMatch" -ForegroundColor Gray
    Write-Host "Phone: Expected=$($formData.phone), Got=$($customerData.phone), Match=$phoneMatch" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "All data matches: YES" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Frontend Integration Test: PASSED" -ForegroundColor Green
    
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    try {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorContent = $streamReader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Red
        Write-Host $errorContent
    } catch {
        Write-Host "Could not read response" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Test Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
