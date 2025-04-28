# Read the SQL file
$sql = Get-Content -Path .\exam_migration.sql -Raw

# Prepare the JSON payload
$body = @{
    sql = $sql
} | ConvertTo-Json

# Send the request to the API
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/execute-sql" -Method POST -ContentType "application/json" -Body $body
    
    # Output the result
    Write-Host "Migration applied successfully!"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error applying migration: $_"
    Write-Host "Error details: $($_.Exception.Response.StatusCode) $($_.Exception.Response.StatusDescription)"
} 