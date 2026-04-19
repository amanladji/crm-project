# E2E Test: Chat Accept Flow - User Disappearance Fix
# Tests: Accept invitation and verify user stays in chat list

param(
    [string]$BaseUrl = "http://localhost:8081",
    [string]$FrontendUrl = "http://localhost:5174"
)

Write-Host "🧪 Chat Accept Flow E2E Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get JWT tokens for both users
Write-Host "📝 Step 1: Get JWT tokens for users" -ForegroundColor Yellow

$loginData1 = @{
    username = "masroor"
    password = "masroor123"
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $loginData1

$token1 = $response1.token
$userId1 = $response1.userId
$username1 = $response1.username

$tokenpreview1 = $token1.Substring(0, 20)
Write-Host "User 1: $username1 ID=$userId1" -ForegroundColor Green
Write-Host "   Token: $tokenpreview1..." -ForegroundColor Gray

$loginData2 = @{
    username = "mani"
    password = "mani123"
} | ConvertTo-Json

$response2 = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $loginData2

$token2 = $response2.token
$userId2 = $response2.userId
$username2 = $response2.username

$tokenpreview2 = $token2.Substring(0, 20)
Write-Host "User 2: $username2 ID=$userId2" -ForegroundColor Green
Write-Host "   Token: $tokenpreview2..." -ForegroundColor Gray
Write-Host ""

# Get pending requests for user 1
Write-Host "📝 Step 2: Get pending chat requests for $username1" -ForegroundColor Yellow

$headers1 = @{
    "Authorization" = "Bearer $token1"
    "Content-Type" = "application/json"
}

$pendingResponse = Invoke-RestMethod -Uri "$BaseUrl/api/chat/requests" `
    -Method GET `
    -Headers $headers1

Write-Host "Pending requests: $($pendingResponse.Count)" -ForegroundColor Green

if ($pendingResponse.Count -gt 0) {
    $firstRequest = $pendingResponse[0]
    $rid = $firstRequest.id
    $sid = $firstRequest.senderId
    $sname = $firstRequest.senderName
    $status = $firstRequest.status
    
    Write-Host "   Request ID: $rid" -ForegroundColor Gray
    Write-Host "   From: $sname ID=$sid" -ForegroundColor Gray
    Write-Host "   Status: $status" -ForegroundColor Gray
    
    $requestId = $firstRequest.id
    $senderId = $firstRequest.senderId
    
    # Accept the invitation
    Write-Host ""
    Write-Host "Step 3: Accept chat invitation" -ForegroundColor Yellow
    
    $acceptResponse = Invoke-RestMethod -Uri "$BaseUrl/api/chat/accept/$requestId" `
        -Method POST `
        -Headers $headers1
    
    Write-Host "Invitation accepted" -ForegroundColor Green
    Write-Host ""
    
    # Fetch accepted users immediately
    Write-Host "Step 4: Fetch accepted users (T+0)" -ForegroundColor Yellow
    
    $acceptedUsersResponse = Invoke-RestMethod -Uri "$BaseUrl/api/chat/accepted-users" `
        -Method GET `
        -Headers $headers1
    
    $count = $acceptedUsersResponse.Count
    Write-Host "Accepted users count: $count" -ForegroundColor Green
    foreach ($user in $acceptedUsersResponse) {
        $uid = $user.id
        $uname = $user.username
        Write-Host "   • ID=$uid, Username=$uname" -ForegroundColor Gray
    }
    
    $userFound = $acceptedUsersResponse | Where-Object { $_.id -eq $senderId }
    if ($userFound) {
        Write-Host "PASS: User found immediately after accept" -ForegroundColor Green
    } else {
        Write-Host "FAIL: User NOT found immediately after accept" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Step 5: Wait 2 seconds and re-fetch" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    $acceptedUsersResponse2 = Invoke-RestMethod -Uri "$BaseUrl/api/chat/accepted-users" `
        -Method GET `
        -Headers $headers1
    
    $count2 = $acceptedUsersResponse2.Count
    Write-Host "Accepted users count: $count2" -ForegroundColor Green
    foreach ($user in $acceptedUsersResponse2) {
        $uid = $user.id
        $uname = $user.username
        Write-Host "   • ID=$uid, Username=$uname" -ForegroundColor Gray
    }
    
    $userFound2 = $acceptedUsersResponse2 | Where-Object { $_.id -eq $senderId }
    if ($userFound2) {
        Write-Host "PASS: User still present after 2 seconds" -ForegroundColor Green
    } else {
        Write-Host "FAIL: User disappeared after 2 seconds" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Step 6: Wait 5 seconds and re-fetch (stress test)" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    $acceptedUsersResponse3 = Invoke-RestMethod -Uri "$BaseUrl/api/chat/accepted-users" `
        -Method GET `
        -Headers $headers1
    
    $count3 = $acceptedUsersResponse3.Count
    Write-Host "Accepted users count: $count3" -ForegroundColor Green
    foreach ($user in $acceptedUsersResponse3) {
        $uid = $user.id
        $uname = $user.username
        Write-Host "   • ID=$uid, Username=$uname" -ForegroundColor Gray
    }
    
    $userFound3 = $acceptedUsersResponse3 | Where-Object { $_.id -eq $senderId }
    if ($userFound3) {
        Write-Host "PASS: User still present after 7+ seconds" -ForegroundColor Green
    } else {
        Write-Host "FAIL: User disappeared after 7+ seconds" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Test Results Summary" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    
    $allPass = ($userFound -and $userFound2 -and $userFound3)
    if ($allPass) {
        Write-Host "ALL TESTS PASSED - User persistence verified!" -ForegroundColor Green
    } else {
        Write-Host "SOME TESTS FAILED - Review results above" -ForegroundColor Red
    }
    
} else {
    Write-Host "No pending requests found for $username1" -ForegroundColor Red
    Write-Host "   Create an invitation first using the UI or another test" -ForegroundColor Yellow
}
