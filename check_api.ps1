$baseUrl = "http://localhost:8081"

Write-Host "Logging in..." 

$loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body '{"username":"aman","password":"aman123456"}' -UseBasicParsing -ErrorAction Stop

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.token

Write-Host "Token: $token"
Write-Host "Fetching conversations..."

$response = Invoke-WebRequest -Uri "$baseUrl/api/users/conversations" -Method GET -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} -UseBasicParsing -ErrorAction Stop

$data = $response.Content | ConvertFrom-Json
$data | ConvertTo-Json -Depth 10
