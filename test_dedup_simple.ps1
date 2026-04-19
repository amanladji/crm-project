# Test backend deduplication with existing users
$BaseUrl = "http://localhost:8081"

Write-Host "Testing Backend Chat Deduplication" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Test with admin user
Write-Host "Login as admin" -ForegroundColor Yellow

$loginReq = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $auth = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginReq -ErrorAction Stop
    
    $token = $auth.token
    Write-Host "SUCCESS: Got token" -ForegroundColor Green
    
    # Fetch accepted users
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/chat/accepted-users" `
        -Method GET `
        -Headers $headers -ErrorAction Stop
    
    Write-Host "Accepted Users for admin:" -ForegroundColor Green
    Write-Host "Count: $($response.Count)" -ForegroundColor Cyan
    
    if ($response -ne $null -and $response.Count -gt 0) {
        $response | ForEach-Object {
            Write-Host "  • ID=$($_.id), Username=$($_.username), Email=$($_.email)" -ForegroundColor Gray
        }
        
        # Check for duplicates
        $ids = $response | ForEach-Object { $_.id }
        $unique = $ids | Select-Object -Unique
        
        if ($unique.Count -eq $ids.Count) {
            Write-Host "CHECK: NO DUPLICATES - Each user appears only once" -ForegroundColor Green
        } else {
            Write-Host "CHECK: DUPLICATES FOUND - $($ids.Count) total, $($unique.Count) unique" -ForegroundColor Red
        }
    } else {
        Write-Host "No accepted users found (may be expected if no invitations accepted)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test complete"
