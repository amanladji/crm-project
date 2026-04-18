$baseUrl = "http://localhost:8081"

Write-Host "=== MESSAGE SHARING TEST ===" -ForegroundColor Cyan

# Step 1: Login users
Write-Host "`n1. Logging in users..." -ForegroundColor Yellow

$amanLogin = @{ username = "aman"; password = "aman123456" } | ConvertTo-Json
$amanResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $amanLogin -UseBasicParsing
$amanToken = ($amanResp.Content | ConvertFrom-Json).token

$ahmedLogin = @{ username = "ahmed"; password = "ahmed123456" } | ConvertTo-Json
$ahmedResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $ahmedLogin -UseBasicParsing
$ahmedToken = ($ahmedResp.Content | ConvertFrom-Json).token

Write-Host "OK: Both users logged in" -ForegroundColor Green

# Step 2: Get Ahmed's ID
Write-Host "`n2. Getting Ahmed's ID..." -ForegroundColor Yellow
$searchResp = Invoke-WebRequest -Uri "$baseUrl/api/users/search?query=ahmed" -Method GET -Headers @{"Authorization" = "Bearer $amanToken"} -UseBasicParsing
$ahmedId = ($searchResp.Content | ConvertFrom-Json)[0].id
Write-Host "Ahmed's ID: $ahmedId" -ForegroundColor Green

# Step 3: Aman sends message to Ahmed
Write-Host "`n3. Aman sending message to Ahmed..." -ForegroundColor Yellow
$msgBody = @{ receiverId = $ahmedId; content = "Hello Ahmed, this is Aman! TEST MESSAGE 1" } | ConvertTo-Json
$sendResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -Headers @{"Authorization" = "Bearer $amanToken"; "Content-Type" = "application/json"} -Body $msgBody -UseBasicParsing

$sentMsg = $sendResp.Content | ConvertFrom-Json
Write-Host "Message sent!" -ForegroundColor Green
Write-Host "  Message ID: $($sentMsg.id)"
Write-Host "  Conversation ID: $($sentMsg.conversationId)"
Write-Host "  Sender ID: $($sentMsg.senderId)"
Write-Host "  Receiver ID: $($sentMsg.receiverId)"
Write-Host "  Content: '$($sentMsg.content)'"

# Step 4: Fetch messages as Aman
Write-Host "`n4. Aman fetching messages with Ahmed..." -ForegroundColor Yellow
$amanMsgsResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/$ahmedId" -Method GET -Headers @{"Authorization" = "Bearer $amanToken"} -UseBasicParsing
$amanMsgs = $amanMsgsResp.Content | ConvertFrom-Json

Write-Host "Aman sees messages:" -ForegroundColor Green
if ($amanMsgs.Count -eq 0) {
    Write-Host "  ERROR: No messages found!" -ForegroundColor Red
} else {
    foreach ($msg in $amanMsgs) {
        Write-Host "  • From: $($msg.senderName) - Content: '$($msg.content)'"
    }
}

# Step 5: Fetch messages as Ahmed
Write-Host "`n5. Ahmed fetching messages with Aman..." -ForegroundColor Yellow
$ahmedMsgsResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/2" -Method GET -Headers @{"Authorization" = "Bearer $ahmedToken"} -UseBasicParsing
$ahmedMsgs = $ahmedMsgsResp.Content | ConvertFrom-Json

Write-Host "Ahmed sees messages:" -ForegroundColor Green
if ($ahmedMsgs.Count -eq 0) {
    Write-Host "  ERROR: No messages found!" -ForegroundColor Red
} else {
    foreach ($msg in $ahmedMsgs) {
        Write-Host "  • From: $($msg.senderName) - Content: '$($msg.content)'"
    }
}

# Step 6: Ahmed sends reply
Write-Host "`n6. Ahmed sending reply to Aman..." -ForegroundColor Yellow
$replyBody = @{ receiverId = 2; content = "Hi Aman! This is Ahmed's reply!" } | ConvertTo-Json
$replyResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/send" -Method POST -Headers @{"Authorization" = "Bearer $ahmedToken"; "Content-Type" = "application/json"} -Body $replyBody -UseBasicParsing

$replyMsg = $replyResp.Content | ConvertFrom-Json
Write-Host "Reply sent!" -ForegroundColor Green
Write-Host "  Message ID: $($replyMsg.id)"
Write-Host "  Content: '$($replyMsg.content)'"

# Step 7: Fetch messages again
Write-Host "`n7. Aman fetching updated messages..." -ForegroundColor Yellow
$amanUpdatedResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/$ahmedId" -Method GET -Headers @{"Authorization" = "Bearer $amanToken"} -UseBasicParsing
$amanUpdatedMsgs = $amanUpdatedResp.Content | ConvertFrom-Json

Write-Host "Aman now sees:" -ForegroundColor Green
foreach ($msg in $amanUpdatedMsgs) {
    Write-Host "  • [$($msg.senderName)] $($msg.content)"
}

Write-Host "`n8. Ahmed fetching updated messages..." -ForegroundColor Yellow
$ahmedUpdatedResp = Invoke-WebRequest -Uri "$baseUrl/api/chat/2" -Method GET -Headers @{"Authorization" = "Bearer $ahmedToken"} -UseBasicParsing
$ahmedUpdatedMsgs = $ahmedUpdatedResp.Content | ConvertFrom-Json

Write-Host "Ahmed now sees:" -ForegroundColor Green
foreach ($msg in $ahmedUpdatedMsgs) {
    Write-Host "  • [$($msg.senderName)] $($msg.content)"
}

# Summary
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan
$totalMsgsAman = $amanUpdatedMsgs.Count
$totalMsgsAhmed = $ahmedUpdatedMsgs.Count

if ($totalMsgsAman -eq $totalMsgsAhmed -and $totalMsgsAman -gt 0) {
    Write-Host "SUCCESS: Both users see the same $totalMsgsAman messages!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Message count mismatch!" -ForegroundColor Red
    Write-Host "  Aman sees: $totalMsgsAman messages"
    Write-Host "  Ahmed sees: $totalMsgsAhmed messages"
}
