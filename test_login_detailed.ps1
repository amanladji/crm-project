# Test to see the actual 500 error details
$baseUrl = "http://localhost:8081/api"

Write-Host "[*] Testing login with detailed error output..."

try {
    $json = '{"username":"admin","password":"admin@123"}'
    Write-Host "Sending login request..."
    $resp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $json
    Write-Host "  Status: $($resp.StatusCode) - SUCCESS"
    Write-Host "  Response: $($resp.Content)"
} catch {
    Write-Host "  Status: $($_.Exception.Response.StatusCode.Value__)"
    Write-Host "  Error: $($_.Exception.Message)"
    Write-Host "`nResponse Content:"
    Write-Host $_.Exception.Response.Content
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $content = $reader.ReadToEnd()
        Write-Host "`nFull Response Body:"
        Write-Host $content
    } catch {
        Write-Host "Could not read response body"
    }
}
