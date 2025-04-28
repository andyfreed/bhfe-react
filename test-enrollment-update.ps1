$enrollmentId = "1f4984cf-b57a-4a0c-a47e-6dd90d341430" # replace with a valid enrollment ID

$updateData = @{
    progress = 75
    completed = $false
    enrollment_notes = "Testing exam fields update"
    exam_score = 85
    exam_passed = $true
} | ConvertTo-Json

# Create a session with cookies
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$cookie = New-Object System.Net.Cookie
$cookie.Name = "admin_token"
$cookie.Value = "temporary-token"
$cookie.Domain = "localhost"
$session.Cookies.Add($cookie)

Write-Host "Attempting to update enrollment $enrollmentId with exam data..."

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/enrollments/$enrollmentId" -Method PUT -ContentType "application/json" -Body $updateData -WebSession $session
    
    Write-Host "Successfully updated enrollment!"
    Write-Host "Response:" 
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error updating enrollment: $_"
    Write-Host "Error details: $($_.Exception.Response.StatusCode) $($_.Exception.Response.StatusDescription)"
    
    if ($_.Exception.Response.StatusCode -eq 500) {
        try {
            $errorContent = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorContent)
            $errorContent = $reader.ReadToEnd()
            Write-Host "Server error details: $errorContent"
        } catch {
            Write-Host "Could not read error details"
        }
    }
} 