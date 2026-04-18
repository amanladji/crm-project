# Test login with CORRECT admin password
$baseUrl = "http://localhost:8081/api"

Write-Host "[*] Testing login with correct password..."

try {
    $json = '{"username":"admin","password":"admin123"}'
    Write-Host "Sending login request..."
    $resp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $json -UseBasicParsing
    Write-Host "  Status: $($resp.StatusCode) - SUCCESS"
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "  User ID: $($data.id)"
    Write-Host "  Username: $($data.username)"
    Write-Host "  Role: $($data.role)"
    
    $token = $data.token
    $headers = @{"Authorization" = "Bearer $token"}
    
    Write-Host "`n[Testing endpoints WITH token...]"
    $customersResp = Invoke-WebRequest -Uri "$baseUrl/customers" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "OK /api/customers - Status: $($customersResp.StatusCode)"
    
    $leadsResp = Invoke-WebRequest -Uri "$baseUrl/leads" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "OK /api/leads - Status: $($leadsResp.StatusCode)"
    
    $activitiesResp = Invoke-WebRequest -Uri "$baseUrl/activities" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "OK /api/activities - Status: $($activitiesResp.StatusCode)"
    
    Write-Host "`n[SUCCESS] All endpoints working!"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
