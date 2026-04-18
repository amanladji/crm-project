$baseUrl = "http://localhost:8081/api"

Write-Host "Testing conversation users endpoint..."

$json = '{"username":"admin","password":"admin123"}'
$loginResp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $json -UseBasicParsing
$userData = $loginResp.Content | ConvertFrom-Json
$token = $userData.token

$headers = @{"Authorization" = "Bearer $token"}

Write-Host ""
Write-Host "Calling /api/users/conversations..."
try {
    $resp = Invoke-WebRequest -Uri "$baseUrl/users/conversations" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "Status: $($resp.StatusCode)"
    Write-Host "Response:"
    Write-Host $resp.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Calling /api/customers..."
try {
    $resp = Invoke-WebRequest -Uri "$baseUrl/customers" -Method GET -Headers $headers -UseBasicParsing
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "Status: $($resp.StatusCode)"
    Write-Host "Customer count: $($data.Count)"
    if ($data.Count -gt 0) {
        Write-Host "First customer: $($data[0] | ConvertTo-Json)"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
