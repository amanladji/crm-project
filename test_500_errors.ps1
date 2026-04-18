# Simple test to find 500 errors
$baseUrl = "http://localhost:8081/api"

Write-Host "[*] Testing endpoints..."

# Test login first
Write-Host "`n[1] Testing login..."
try {
    $json = '{"username":"admin","password":"admin@123"}'
    $resp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $json
    Write-Host "  Status: $($resp.StatusCode) - Login OK"
    $data = $resp.Content | ConvertFrom-Json
    $token = $data.token
} catch {
    Write-Host "  Error: $($_.Exception.Message)"
    $token = $null
}

if ($token) {
    Write-Host "  Token: $($token.Substring(0,20))..."
    
    $authHeader = @{"Authorization" = "Bearer $token"}
    
    # Test customers
    Write-Host "`n[2] Testing /api/customers..."
    try {
        $resp = Invoke-WebRequest -Uri "$baseUrl/customers" -Method GET -Headers $authHeader
        Write-Host "  Status: $($resp.StatusCode) - OK"
    } catch {
        $code = $_.Exception.Response.StatusCode.Value__
        Write-Host "  Status: $code"
        if ($code -eq 500) {
            Write-Host "  !!! FOUND 500 ERROR !!!"
            Write-Host "  Error: $($_.Exception.Message)"
        }
    }
    
    # Test leads
    Write-Host "`n[3] Testing /api/leads..."
    try {
        $resp = Invoke-WebRequest -Uri "$baseUrl/leads" -Method GET -Headers $authHeader
        Write-Host "  Status: $($resp.StatusCode) - OK"
    } catch {
        $code = $_.Exception.Response.StatusCode.Value__
        Write-Host "  Status: $code"
        if ($code -eq 500) {
            Write-Host "  !!! FOUND 500 ERROR !!!"
        }
    }
    
    # Test activities
    Write-Host "`n[4] Testing /api/activities..."
    try {
        $resp = Invoke-WebRequest -Uri "$baseUrl/activities" -Method GET -Headers $authHeader
        Write-Host "  Status: $($resp.StatusCode) - OK"
    } catch {
        $code = $_.Exception.Response.StatusCode.Value__
        Write-Host "  Status: $code"
        if ($code -eq 500) {
            Write-Host "  !!! FOUND 500 ERROR !!!"
        }
    }
    
    # Test conversations
    Write-Host "`n[5] Testing /api/users/conversations..."
    try {
        $resp = Invoke-WebRequest -Uri "$baseUrl/users/conversations" -Method GET -Headers $authHeader
        Write-Host "  Status: $($resp.StatusCode) - OK"
    } catch {
        $code = $_.Exception.Response.StatusCode.Value__
        Write-Host "  Status: $code"
        if ($code -eq 500) {
            Write-Host "  !!! FOUND 500 ERROR !!!"
        }
    }
}

Write-Host "`n[*] Done"
