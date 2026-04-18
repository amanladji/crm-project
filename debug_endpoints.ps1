Write-Host "=== DEBUGGING CRM BACKEND ENDPOINTS ===" -ForegroundColor Cyan
Write-Host "
[1] TESTING REGISTER ENDPOINT" -ForegroundColor Yellow
Write-Host "Payload: {username: testdebug_[random], password: Pass123!!, email: debug@test.com}" -ForegroundColor Gray

$registerPayload = @{ 
    username="testdebug_517194016"
    password="Pass123!!"
    email="debug@test.com" 
} | ConvertTo-Json

Write-Host "Sending to http://localhost:8081/api/auth/register" -ForegroundColor Gray

Try {
    $reg = Invoke-WebRequest -Uri "http://localhost:8081/api/auth/register" -Method POST -ContentType "application/json" -Body $registerPayload -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Register Response Status: $($reg.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Green
    Write-Host $reg.Content -ForegroundColor White
    
    # Try to extract token if present
    $regContent = $reg.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($regContent.token) {
        Write-Host "Token extracted: $($regContent.token.Substring(0, 20))..." -ForegroundColor Green
    }
} 
Catch {
    Write-Host "✗ Register Error Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $sr = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($sr)
    $errorBody = $reader.ReadToEnd()
    Write-Host "Error Response:" -ForegroundColor Red
    Write-Host $errorBody -ForegroundColor White
}

Write-Host "
[2] TESTING CREATE CUSTOMER ENDPOINT" -ForegroundColor Yellow
Write-Host "Payload: {name: Test Corp, email: corp@test.com, phone: +1234567890, company: Test, address: 123 Test St}" -ForegroundColor Gray

$customerPayload = @{ 
    name="Test Corp"
    email="corp@test.com"
    phone="+1234567890"
    company="Test"
    address="123 Test St" 
} | ConvertTo-Json

Write-Host "Sending to http://localhost:8081/api/customers" -ForegroundColor Gray

Try {
    $custResp = Invoke-WebRequest -Uri "http://localhost:8081/api/customers" -Method POST -ContentType "application/json" -Body $customerPayload -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Create Customer Response Status: $($custResp.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Green
    Write-Host $custResp.Content -ForegroundColor White
} 
Catch {
    Write-Host "✗ Create Customer Error Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Try {
        $sr = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($sr)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor White
    } Catch {
        Write-Host "Could not read error stream: $_" -ForegroundColor Red
    }
}

Write-Host "
[3] TESTING CONVERSATIONS ENDPOINT" -ForegroundColor Yellow
Write-Host "Testing GET http://localhost:8081/api/conversations" -ForegroundColor Gray

Try {
    $convResp = Invoke-WebRequest -Uri "http://localhost:8081/api/conversations" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Conversations Response Status: $($convResp.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Green
    Write-Host $convResp.Content -ForegroundColor White
} 
Catch {
    Write-Host "✗ Conversations Error Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Try {
        $sr = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($sr)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor White
    } Catch {
        Write-Host "Could not read error stream: $_" -ForegroundColor Red
    }
}

Write-Host "
[4] TESTING CAMPAIGNS ENDPOINT" -ForegroundColor Yellow
Write-Host "Testing GET http://localhost:8081/api/campaigns" -ForegroundColor Gray

Try {
    $campResp = Invoke-WebRequest -Uri "http://localhost:8081/api/campaigns" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Campaigns Response Status: $($campResp.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Green
    Write-Host $campResp.Content -ForegroundColor White
}
Catch {
    Write-Host "✗ Campaigns Error Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Try {
        $sr = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($sr)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor White
    } Catch {
        Write-Host "Could not read error stream: $_" -ForegroundColor Red
    }
}

Write-Host "
=== DEBUG TEST COMPLETE ===" -ForegroundColor Cyan
