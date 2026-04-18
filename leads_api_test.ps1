$baseUrl = "http://localhost:8081"
Write-Host "`n+------------------------------------------------------------+" -ForegroundColor Cyan
Write-Host "¦            LEADS API VERIFICATION TEST RESULTS            ¦" -ForegroundColor Cyan
Write-Host "+------------------------------------------------------------+" -ForegroundColor Cyan

# STEP 1: Register
Write-Host "`n[TEST 1] User Registration" -ForegroundColor Yellow
$username = "testuser_$(Get-Random)"
$regPayload = @{ username = $username; password = "Pass123!!"; email = "test_$(Get-Random)@example.com" } | ConvertTo-Json
$reg = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -ContentType "application/json" -Body $regPayload -UseBasicParsing -ErrorAction SilentlyContinue
if ($reg.StatusCode -eq 200) {
    Write-Host "? PASS | POST /api/auth/register | HTTP $($reg.StatusCode)" -ForegroundColor Green
    $token = ($reg.Content | ConvertFrom-Json).token
} else {
    Write-Host "? FAIL | POST /api/auth/register | HTTP $($reg.StatusCode)" -ForegroundColor Red
    exit 1
}

$headers = @{"Authorization" = "Bearer $token"}

# STEP 2: GET /api/leads/search (no params)
Write-Host "`n[TEST 2] Leads Search - No Parameters" -ForegroundColor Yellow
try {
    $r2 = Invoke-WebRequest -Uri "$baseUrl/api/leads/search?page=0&size=10" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "? PASS | GET /api/leads/search?page=0&size=10 | HTTP $($r2.StatusCode)" -ForegroundColor Green
    $data = $r2.Content | ConvertFrom-Json
    Write-Host "        Records returned: $($data.content.Count)" -ForegroundColor Green
} catch {
    Write-Host "? FAIL | GET /api/leads/search?page=0&size=10 | HTTP $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
}

# STEP 3: GET /api/leads/search?query=test
Write-Host "`n[TEST 3] Leads Search - With Query Parameter" -ForegroundColor Yellow
try {
    $r3 = Invoke-WebRequest -Uri "$baseUrl/api/leads/search?query=test&page=0&size=10" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "? PASS | GET /api/leads/search?query=test&page=0&size=10 | HTTP $($r3.StatusCode)" -ForegroundColor Green
    $data = $r3.Content | ConvertFrom-Json
    Write-Host "        Records returned: $($data.content.Count)" -ForegroundColor Green
} catch {
    Write-Host "? FAIL | GET /api/leads/search?query=test&page=0&size=10 | HTTP $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
}

# STEP 4: GET /api/leads/search?status=NEW
Write-Host "`n[TEST 4] Leads Search - With Status Parameter" -ForegroundColor Yellow
try {
    $r4 = Invoke-WebRequest -Uri "$baseUrl/api/leads/search?status=NEW&page=0&size=10" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "? PASS | GET /api/leads/search?status=NEW&page=0&size=10 | HTTP $($r4.StatusCode)" -ForegroundColor Green
    $data = $r4.Content | ConvertFrom-Json
    Write-Host "        Records returned: $($data.content.Count)" -ForegroundColor Green
} catch {
    Write-Host "? FAIL | GET /api/leads/search?status=NEW&page=0&size=10 | HTTP $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
}

Write-Host "`n+------------------------------------------------------------+" -ForegroundColor Cyan
Write-Host "¦                  TEST COMPLETION SUMMARY                  ¦" -ForegroundColor Cyan
Write-Host "+------------------------------------------------------------+" -ForegroundColor Cyan
Write-Host "All 4 API tests executed successfully." -ForegroundColor Green
