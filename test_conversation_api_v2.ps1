$baseUrl = "http://localhost:8081"

Write-Host "1. Testing Login as aman..."
$login = @{
    username = "aman"
    password = "aman123456"
} | ConvertTo-Json

try {
    $loginResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
      -Method POST `
      -Headers @{"Content-Type" = "application/json"} `
      -Body $login `
      -UseBasicParsing -ErrorAction Stop
    
    $loginData = $loginResp.Content | ConvertFrom-Json
    $token = $loginData.token
    
    Write-Host "✓ Login successful. Token: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    Write-Host "`n2. Testing Get Conversations..."
    $convResp = Invoke-WebRequest -Uri "$baseUrl/api/users/conversations" `
      -Method GET `
      -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} `
      -UseBasicParsing -ErrorAction Stop
    
    $conversations = $convResp.Content | ConvertFrom-Json
    
    Write-Host "`n✓ Response received:" -ForegroundColor Green
    $conversations | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($conversations.Count -eq 0) {
        Write-Host "`n⚠️  No conversations found. User may not have any conversations yet." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response.Content
}
