Write-Host "=== Testing /api/conversations Endpoint ===" -ForegroundColor Cyan

# First, let's find a valid user in the database or create one for testing
# For now, let's try without auth since the frontend will have it

# Create a simple unauthenticated test
Write-Host "`n[TEST] POST to /api/conversations without auth" -ForegroundColor Yellow
$body = @{ userId = 2 } | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/conversations" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Request successful" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" 
    Write-Host "Response: $($response.Content)" 
} catch {
    Write-Host "✗ Request failed" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value)"
    
    # Try to read error body
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Error Response: $errorBody"
    } catch {
        Write-Host "Could not read error body"
    }
}

# The endpoint should work when called from the browser/frontend with token
# Let's verify the endpoint exists
Write-Host "`n[Check] Verify endpoint exists" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/chat/test" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Chat API endpoints are working" -ForegroundColor Green
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "✗ API not responding" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
