$body = @{ 
    username = "testuser1"
    email = "test1@example.com"
    password = "short"
} | ConvertTo-Json

try {
    Write-Host "Testing short password endpoint..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.Value)" -ForegroundColor Red
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    $reader.Close()
    Write-Host "Error Response: $errorBody" -ForegroundColor Yellow
    
    # Parse as JSON
    try {
        $errorJson = $errorBody | ConvertFrom-Json
        Write-Host "Parsed Error Message: $($errorJson.message)" -ForegroundColor Red
    } catch {
        Write-Host "Could not parse JSON" -ForegroundColor Red
    }
}

Write-Host "`n=== Test 2: Valid Signup ===" -ForegroundColor Cyan
$body2 = @{
    username = "newuser123"
    email = "newuser@example.com"
    password = "ValidPassword123"
} | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/register" -Method POST -ContentType "application/json" -Body $body2 -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response2.Content)" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
