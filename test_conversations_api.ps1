Write-Host "=== Testing /api/conversations Endpoint ===" -ForegroundColor Cyan

# Test 1: Create conversation with user ID 1
Write-Host "`n[TEST 1] Create conversation" -ForegroundColor Yellow
$body = @{ userId = 1 } | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/conversations" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Conversation ID: $($data.id)" -ForegroundColor Green
    Write-Host "User1: $($data.user1Username) (ID: $($data.user1Id))" -ForegroundColor Green
    Write-Host "User2: $($data.user2Username) (ID: $($data.user2Id))" -ForegroundColor Green
    $firstId = $data.id
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Create same conversation again (should return same ID)
Write-Host "`n[TEST 2] Create same conversation again" -ForegroundColor Yellow
try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:8081/api/conversations" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    $data2 = $response2.Content | ConvertFrom-Json
    Write-Host "Conversation ID: $($data2.id)" -ForegroundColor Green
    
    if ($firstId -eq $data2.id) {
        Write-Host "PASS: Same conversation returned (no duplicate)" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Different IDs! $firstId vs $($data2.id)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== All Tests Completed ===" -ForegroundColor Cyan
