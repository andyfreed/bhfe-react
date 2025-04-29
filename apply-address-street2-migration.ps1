# PowerShell script to apply the address street2 fields migration

$migrationName = "add_address_street2_fields"
$apiUrl = "http://localhost:3002/api/admin/apply-migration"

$body = @{
    migrationName = $migrationName
} | ConvertTo-Json

Write-Host "Applying migration: $migrationName"

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST -ContentType "application/json" -Body $body
    
    Write-Host "Migration applied successfully!"
    Write-Host "Response:" 
    $response | ConvertTo-Json
} catch {
    Write-Host "Error applying migration: $_"
    Write-Host "Error details: $($_.Exception.Response.StatusCode) $($_.Exception.Response.StatusDescription)"
} 