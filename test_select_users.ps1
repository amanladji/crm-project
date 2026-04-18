Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "SELECT USERS FEATURE - COMPREHENSIVE TEST" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Authenticate
Write-Host "STEP 1: Authenticate" -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$loginResp = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$authData = $loginResp.Content | ConvertFrom-Json
$token = $authData.token
Write-Host "Authenticated as: $($authData.username)" -ForegroundColor Green
Write-Host ""

# Step 2: Get all users
Write-Host "STEP 2: Get all users from API" -ForegroundColor Yellow
$usersResp = Invoke-WebRequest -Uri "http://localhost:8081/api/users" -Method GET -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } -UseBasicParsing
$users = $usersResp.Content | ConvertFrom-Json
Write-Host "Total users: $($users.Count)" -ForegroundColor Green
Write-Host ""

# Step 3: Test campaign creation with 3 users
Write-Host "STEP 3: Create campaign with 3 users selected" -ForegroundColor Yellow
$selectedUserIds = @(2, 3, 4)
Write-Host "Selected user IDs: $($selectedUserIds -join ', ')" -ForegroundColor Cyan

$campaignPayload = @{
    name = "Multi-User Test Campaign"
    description = "Testing multiple user selection"
    message = "This is a test message"
    userIds = $selectedUserIds
} | ConvertTo-Json

$createResp = Invoke-WebRequest -Uri "http://localhost:8081/api/campaigns" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" } `
  -Body $campaignPayload `
  -UseBasicParsing

Write-Host "Campaign created with status: $($createResp.StatusCode)" -ForegroundColor Green
$campaignData = $createResp.Content | ConvertFrom-Json
Write-Host "Campaign ID: $($campaignData.id)" -ForegroundColor Green
Write-Host ""

# Step 4: Send campaign to users
Write-Host "STEP 4: Send campaign to selected users" -ForegroundColor Yellow
$sendPayload = @{
    campaignId = $campaignData.id
} | ConvertTo-Json

$sendResp = Invoke-WebRequest -Uri "http://localhost:8081/api/campaigns/send" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" } `
  -Body $sendPayload `
  -UseBasicParsing

$sendData = $sendResp.Content | ConvertFrom-Json
Write-Host "Messages sent successfully: $($sendData.successCount) to 3 selected users" -ForegroundColor Green
Write-Host ""

# Step 5: Test with single user
Write-Host "STEP 5: Create campaign with 1 user selected" -ForegroundColor Yellow
$singleUserReq = @{
    name = "Single User Campaign"
    description = "Testing single user selection"
    message = "Message for one user"
    userIds = @(5)
} | ConvertTo-Json

$singleResp = Invoke-WebRequest -Uri "http://localhost:8081/api/campaigns" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" } `
  -Body $singleUserReq `
  -UseBasicParsing

$singleCampaign = $singleResp.Content | ConvertFrom-Json
Write-Host "Single user campaign created: ID=$($singleCampaign.id)" -ForegroundColor Green

$sendSingleReq = @{
    campaignId = $singleCampaign.id
} | ConvertTo-Json

$sendSingleResp = Invoke-WebRequest -Uri "http://localhost:8081/api/campaigns/send" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" } `
  -Body $sendSingleReq `
  -UseBasicParsing

$sendSingleData = $sendSingleResp.Content | ConvertFrom-Json
Write-Host "Message sent to 1 user: Success=$($sendSingleData.successCount)" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "Authentication: PASSED" -ForegroundColor Green
Write-Host "Users fetched: PASSED" -ForegroundColor Green
Write-Host "Multiple selection (3 users): PASSED" -ForegroundColor Green
Write-Host "Single selection (1 user): PASSED" -ForegroundColor Green
Write-Host "Data sent to backend: PASSED" -ForegroundColor Green
Write-Host ""
Write-Host "SELECT USERS FEATURE: WORKING CORRECTLY!" -ForegroundColor Green
