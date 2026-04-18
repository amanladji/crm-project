# Comprehensive test of all endpoints
$baseUrl = "http://localhost:8081/api"

Write-Host "`n=== COMPREHENSIVE ENDPOINT TEST ===" -ForegroundColor Green

# Login
Write-Host "`n[1] Authentication..."
$json = '{"username":"admin","password":"admin123"}'
$loginResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $json -UseBasicParsing
$token = ($loginResp.Content | ConvertFrom-Json).token
Write-Host "✓ Login - Status: $($loginResp.StatusCode)"

$headers = @{"Authorization" = "Bearer $token"}

# Test endpoints
Write-Host "`n[2] Testing All Authenticated Endpoints..."
try {
    $r1 = Invoke-WebRequest -Uri "$baseUrl/customers" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✓ Customers - $($r1.StatusCode)"
} catch { Write-Host "✗ Customers error" }

try {
    $r2 = Invoke-WebRequest -Uri "$baseUrl/leads" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✓ Leads - $($r2.StatusCode)"
} catch { Write-Host "✗ Leads error" }

try {
    $r3 = Invoke-WebRequest -Uri "$baseUrl/activities" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✓ Activities - $($r3.StatusCode)"
} catch { Write-Host "✗ Activities error" }

try {
    $r4 = Invoke-WebRequest -Uri "$baseUrl/users/conversations" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✓ Conversations - $($r4.StatusCode)"
} catch { Write-Host "✗ Conversations error" }

Write-Host "`n=== ALL TESTS COMPLETED ===" -ForegroundColor Green
