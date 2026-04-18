# Comprehensive CRM QA Testing Script
# Tests all features: Registration, Login, Chat, Campaign, Activity

$ErrorActionPreference = "SilentlyContinue"
$baseUrl = "http://localhost:8081"
$frontendUrl = "http://localhost:5173"

# Test counters
$passedTests = 0
$failedTests = 0
$testResults = @()

function Write-TestHeader {
    param([string]$title)
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "TEST: $title" -ForegroundColor Cyan
    Write-Host "="*60 -ForegroundColor Cyan
}

function Write-TestResult {
    param([string]$test, [string]$status, [string]$details)
    $color = if ($status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$status] $test" -ForegroundColor $color
    if ($details) { Write-Host "  Details: $details" -ForegroundColor Gray }
    $global:testResults += @{
        Test = $test
        Status = $status
        Details = $details
        Timestamp = Get-Date
    }
    if ($status -eq "PASS") { $global:passedTests++ } else { $global:failedTests++ }
}

# ====== TEST 1: USER REGISTRATION ======
Write-TestHeader "User Registration"

$uniqueUsername = "testuser_$(Get-Random -Minimum 1000 -Maximum 9999)"
$registerPayload = @{
    username = $uniqueUsername
    password = "Test@123"
    email = "$uniqueUsername@test.com"
    role = "USER"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerPayload `
        -UseBasicParsing

    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
        Write-TestResult "Register endpoint accessible" "PASS" "Status: $($response.StatusCode)"
        
        # Extract token if returned
        try {
            $regResult = $response.Content | ConvertFrom-Json
            if ($regResult.token) {
                Write-TestResult "JWT token generated" "PASS" "Token received: $($regResult.token.Substring(0,20))..."
                $testToken = $regResult.token
            } else {
                Write-TestResult "JWT token generated" "WARN" "No token in registration response"
            }
        } catch {
            Write-TestResult "JWT token generated" "WARN" "Could not parse response"
        }
    } else {
        Write-TestResult "Register endpoint accessible" "FAIL" "Status: $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Register endpoint accessible" "FAIL" "Error: $($_.Exception.Message)"
}

# ====== TEST 2: USER LOGIN WITH JWT ======
Write-TestHeader "User Login with JWT"

$loginPayload = @{
    username = $uniqueUsername
    password = "Test@123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginPayload `
        -UseBasicParsing

    if ($response.StatusCode -eq 200) {
        Write-TestResult "Login endpoint accessible" "PASS" "Status: 200"
        
        try {
            $loginResult = $response.Content | ConvertFrom-Json
            if ($loginResult.token) {
                Write-TestResult "Login returns JWT token" "PASS" "Token: $($loginResult.token.Substring(0,20))..."
                $authToken = $loginResult.token
            } elseif ($loginResult.jwtToken) {
                Write-TestResult "Login returns JWT token" "PASS" "Token: $($loginResult.jwtToken.Substring(0,20))..."
                $authToken = $loginResult.jwtToken
            } else {
                Write-TestResult "Login returns JWT token" "FAIL" "No token in response: $($response.Content)"
            }
        } catch {
            Write-TestResult "Login returns JWT token" "FAIL" "Could not parse: $($_.Exception.Message)"
        }
    } else {
        Write-TestResult "Login endpoint accessible" "FAIL" "Status: $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Login endpoint accessible" "FAIL" "Error: $($_.Exception.Message)"
}

# ====== TEST 3: CUSTOMER MANAGEMENT ======
Write-TestHeader "Customer Management"

$customerPayload = @{
    name = "Test Company $(Get-Random -Minimum 1000 -Maximum 9999)"
    email = "customer_$(Get-Random)@test.com"
    phone = "+1234567890"
    company = "Test Corp"
    address = "123 Test Street"
} | ConvertTo-Json

try {
    $headers = @{}
    if ($authToken) {
        $headers["Authorization"] = "Bearer $authToken"
    }
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/customers" `
        -Method POST `
        -ContentType "application/json" `
        -Body $customerPayload `
        -Headers $headers `
        -UseBasicParsing

    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
        Write-TestResult "Create customer" "PASS" "Status: $($response.StatusCode)"
        
        try {
            $customerResult = $response.Content | ConvertFrom-Json
            if ($customerResult.id) {
                Write-TestResult "Customer ID generated" "PASS" "ID: $($customerResult.id)"
                $customerId = $customerResult.id
            }
        } catch {
            Write-TestResult "Customer ID generated" "WARN" "Could not parse response"
        }
    } else {
        Write-TestResult "Create customer" "FAIL" "Status: $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Create customer" "FAIL" "Error: $($_.Exception.Message)"
}

# Verify customer fetch
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/customers" `
        -Method GET `
        -ContentType "application/json" `
        -Headers $headers `
        -UseBasicParsing

    if ($response.StatusCode -eq 200) {
        Write-TestResult "Fetch customers list" "PASS" "Status: 200"
        
        try {
            $customers = $response.Content | ConvertFrom-Json
            if ($customers -is [array]) {
                Write-TestResult "Customers data retrievable" "PASS" "Found $($customers.Count) customers"
            } elseif ($customers) {
                Write-TestResult "Customers data retrievable" "PASS" "Single customer retrieved"
            }
        } catch {
            Write-TestResult "Customers data retrievable" "WARN" "Could not parse response"
        }
    }
} catch {
    Write-TestResult "Fetch customers list" "FAIL" "Error: $($_.Exception.Message)"
}

# ====== TEST 4: CHAT MESSAGING (if endpoints exist) ======
Write-TestHeader "Chat Messaging"

# Try to get conversations
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/conversations" `
        -Method GET `
        -ContentType "application/json" `
        -Headers $headers `
        -UseBasicParsing

    if ($response.StatusCode -eq 200) {
        Write-TestResult "Conversations endpoint accessible" "PASS" "Status: 200"
    } elseif ($response.StatusCode -eq 401) {
        Write-TestResult "Conversations endpoint accessible" "WARN" "Requires authentication (401)"
    }
} catch {
    Write-TestResult "Conversations endpoint accessible" "FAIL" "Error: $($_.Exception.Message)"
}

# ====== TEST 5: CAMPAIGN CREATION ======
Write-TestHeader "Campaign Creation"

$campaignPayload = @{
    name = "Test Campaign $(Get-Random -Minimum 1000 -Maximum 9999)"
    description = "Campaign for QA testing"
    message = "Hello, this is a test campaign message"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/campaigns" `
        -Method POST `
        -ContentType "application/json" `
        -Body $campaignPayload `
        -Headers $headers `
        -UseBasicParsing

    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
        Write-TestResult "Create campaign" "PASS" "Status: $($response.StatusCode)"
        
        try {
            $campaignResult = $response.Content | ConvertFrom-Json
            if ($campaignResult.id) {
                Write-TestResult "Campaign ID generated" "PASS" "ID: $($campaignResult.id)"
                $campaignId = $campaignResult.id
            }
        } catch {
            Write-TestResult "Campaign ID generated" "WARN" "Could not parse response"
        }
    } else {
        Write-TestResult "Create campaign" "FAIL" "Status: $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Create campaign" "FAIL" "Error: $($_.Exception.Message)"
}

# Verify campaign fetch
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/campaigns" `
        -Method GET `
        -ContentType "application/json" `
        -Headers $headers `
        -UseBasicParsing

    if ($response.StatusCode -eq 200) {
        Write-TestResult "Fetch campaigns list" "PASS" "Status: 200"
    }
} catch {
    Write-TestResult "Fetch campaigns list" "FAIL" "Error: $($_.Exception.Message)"
}

# ====== TEST 6: ACTIVITY LOGGING ======
Write-TestHeader "Activity Logging"

# Try to get activities
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/activities" `
        -Method GET `
        -ContentType "application/json" `
        -Headers $headers `
        -UseBasicParsing

    if ($response.StatusCode -eq 200) {
        Write-TestResult "Activities endpoint accessible" "PASS" "Status: 200"
        
        try {
            $activities = $response.Content | ConvertFrom-Json
            if ($activities -is [array]) {
                Write-TestResult "Activities data retrievable" "PASS" "Found $($activities.Count) activities"
            } elseif ($activities) {
                Write-TestResult "Activities data retrievable" "PASS" "Single activity retrieved"
            } else {
                Write-TestResult "Activities data retrievable" "WARN" "No activities found (may be normal)"
            }
        } catch {
            Write-TestResult "Activities data retrievable" "WARN" "Could not parse response"
        }
    } elseif ($response.StatusCode -eq 401) {
        Write-TestResult "Activities endpoint accessible" "WARN" "Requires authentication (401)"
    }
} catch {
    Write-TestResult "Activities endpoint accessible" "FAIL" "Error: $($_.Exception.Message)"
}

# ====== FRONTEND CONNECTIVITY TEST ======
Write-TestHeader "Frontend Connectivity"

try {
    $response = Invoke-WebRequest -Uri $frontendUrl `
        -Method GET `
        -UseBasicParsing -ErrorAction SilentlyContinue

    if ($response.StatusCode -eq 200) {
        Write-TestResult "Frontend accessible" "PASS" "Frontend running on $frontendUrl"
    } else {
        Write-TestResult "Frontend accessible" "FAIL" "Status: $($response.StatusCode)"
    }
} catch {
    Write-TestResult "Frontend accessible" "FAIL" "Could not reach frontend"
}

# ====== TEST SUMMARY ======
Write-Host "`n" + "="*60 -ForegroundColor Yellow
Write-Host "TEST SUMMARY" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Yellow
Write-Host "Total Tests: $($passedTests + $failedTests)" -ForegroundColor Cyan
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red

if ($failedTests -eq 0) {
    Write-Host "`n[PASS] ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "`n[FAIL] Some tests failed. Review details above." -ForegroundColor Red
}

# Export results
$global:testResults | ConvertTo-Json | Out-File "test_results_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"

Write-Host "`nTest results saved to: test_results_*.json" -ForegroundColor Gray
Write-Host "`nBackend: $baseUrl" -ForegroundColor Cyan
Write-Host "Frontend: $frontendUrl" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Yellow
