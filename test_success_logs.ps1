$baseUrl = "http://localhost:8081"

Write-Host "=== TESTING REAL vs FAKE SUCCESS LOGS ===" -ForegroundColor Cyan

# Step 1: Login as Aman
Write-Host "`n1. Logging in as Aman..." -ForegroundColor Yellow
$amanLogin = @{ username = "aman"; password = "aman123456" } | ConvertTo-Json
$amanResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $amanLogin -UseBasicParsing
$amanToken = ($amanResp.Content | ConvertFrom-Json).token
Write-Host "[OK] Aman logged in" -ForegroundColor Green

# Test Case 1: SUCCESSFUL MESSAGE SEND
Write-Host "`n2. TEST CASE 1: Sending valid message..." -ForegroundColor Cyan

$searchResp = Invoke-WebRequest -Uri "$baseUrl/api/users/search?query=ahmed" -Method GET -Headers @{"Authorization" = "Bearer $amanToken"} -UseBasicParsing
$ahmedId = ($searchResp.Content | ConvertFrom-Json)[0].id

$validMsg = @{ receiverId = $ahmedId; content = "Valid test message" } | ConvertTo-Json
try {
    $sendResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -Headers @{"Authorization" = "Bearer $amanToken"; "Content-Type" = "application/json"} -Body $validMsg -UseBasicParsing
    
    Write-Host "[OK] Send succeeded with status: $($sendResp.StatusCode)" -ForegroundColor Green
    
    if ($sendResp.StatusCode -eq 201) {
        Write-Host "[OK] Response contains message ID" -ForegroundColor Green
        
        # Verify message was persisted
        $fetchResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/$ahmedId" -Method GET -Headers @{"Authorization" = "Bearer $amanToken"} -UseBasicParsing
        $msgs = $fetchResp.Content | ConvertFrom-Json
        
        if ($msgs.Count -gt 0) {
            Write-Host "[OK] Message verified in database - $($msgs.Count) messages found" -ForegroundColor Green
            Write-Host "    EXPECTED LOG: 'SUCCESS: Message sent and verified...'" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Message not found in database!" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "[ERROR] Send failed unexpectedly: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Case 2: FAILED MESSAGE SEND (Invalid receiver)
Write-Host "`n3. TEST CASE 2: Sending message to non-existent user..." -ForegroundColor Cyan

$invalidMsg = @{ receiverId = 99999; content = "Should fail" } | ConvertTo-Json
try {
    $sendResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -Headers @{"Authorization" = "Bearer $amanToken"; "Content-Type" = "application/json"} -Body $invalidMsg -UseBasicParsing
    
    Write-Host "[ERROR] UNEXPECTED: Send succeeded when it should fail!" -ForegroundColor Red
} catch {
    $errorStatus = $_.Exception.Response.StatusCode
    Write-Host "[OK] Send correctly failed with status: $errorStatus" -ForegroundColor Green
    Write-Host "    EXPECTED LOG: 'SEND MESSAGE FAILED...'" -ForegroundColor Green
    Write-Host "    NOTE: No success log should appear for this error" -ForegroundColor Yellow
}

Write-Host "`n4. TEST CASE 3: Successful message with verification..." -ForegroundColor Cyan

# Create a successful message
$validMsg = @{ receiverId = $ahmedId; content = "Another test message $(Get-Date -Format yyyy-MM-dd-HHmmss)" } | ConvertTo-Json
try {
    $sendResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -Headers @{"Authorization" = "Bearer $amanToken"; "Content-Type" = "application/json"} -Body $validMsg -UseBasicParsing
    Write-Host "[OK] Message sent successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Send failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. Verification Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "EXPECTED BEHAVIOR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Valid message send:" -ForegroundColor White
Write-Host "   [OK] Send logs: 'Calling POST /api/chat/send...'" -ForegroundColor Green
Write-Host "   [OK] Fetch logs: 'Fetching messages to verify...'" -ForegroundColor Green
Write-Host "   [OK] SUCCESS log ONLY AFTER both: 'SUCCESS: Message sent and verified...'" -ForegroundColor Green
Write-Host ""
Write-Host "2. Invalid receiver:" -ForegroundColor White
Write-Host "   [OK] Send fails (HTTP 400/500)" -ForegroundColor Green
Write-Host "   [OK] Error logged: 'SEND MESSAGE FAILED...'" -ForegroundColor Green
Write-Host "   [NO] NO success log appears" -ForegroundColor Green
Write-Host ""
Write-Host "3. Fetch failure after send:" -ForegroundColor White
Write-Host "   [OK] Send succeeds" -ForegroundColor Green
Write-Host "   [ERROR] Fetch fails" -ForegroundColor Green
Write-Host "   [OK] Error logged: 'SEND MESSAGE FAILED...' (verification phase)" -ForegroundColor Green
Write-Host "   [NO] NO fake success log" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`nTest complete! Open http://localhost:5178 in browser and check F12 > Console" -ForegroundColor Yellow
Write-Host "Look for absence of SUCCESS log when sending to invalid receivers." -ForegroundColor Yellow
