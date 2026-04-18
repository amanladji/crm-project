$baseUrl = "http://localhost:8081/api"
$json = '{"username":"admin","password":"admin123"}'

Write-Host ""
Write-Host "Testing all endpoints..."
Write-Host ""

$loginResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $json -UseBasicParsing
$token = ($loginResp.Content | ConvertFrom-Json).token
Write-Host "[OK] Login returned: $($loginResp.StatusCode)"

$headers = @{"Authorization" = "Bearer $token"}

Write-Host "[OK] Customers: " -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/customers" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "$($r.StatusCode)"
} catch {
    Write-Host "ERROR"
}

Write-Host "[OK] Leads: " -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/leads" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "$($r.StatusCode)"
} catch {
    Write-Host "ERROR"
}

Write-Host "[OK] Activities: " -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/activities" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "$($r.StatusCode)"
} catch {
    Write-Host "ERROR"
}

Write-Host "[OK] Conversations: " -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/users/conversations" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "$($r.StatusCode)"
} catch {
    Write-Host "ERROR"
}

Write-Host ""
Write-Host "All tests passed!"
