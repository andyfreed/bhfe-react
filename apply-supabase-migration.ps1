# Read Supabase credentials from .env.local
$envVars = Get-Content ".env.local" | Where-Object { $_ -match "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)" }

# Parse the environment variables
$supabaseUrl = ($envVars | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_URL" } | ForEach-Object { $_ -replace "^NEXT_PUBLIC_SUPABASE_URL=", "" })[0]
$supabaseKey = ($envVars | Where-Object { $_ -match "SUPABASE_SERVICE_ROLE_KEY" } | ForEach-Object { $_ -replace "^SUPABASE_SERVICE_ROLE_KEY=", "" })[0]

# Trim any whitespace or quotes
$supabaseUrl = $supabaseUrl.Trim('"', "'", " ")
$supabaseKey = $supabaseKey.Trim('"', "'", " ")

Write-Host "Using Supabase URL: $supabaseUrl"
Write-Host "Service key found: $(if ($supabaseKey) { 'Yes' } else { 'No' })"

# The migration SQL to apply
$sql = @"
-- Add exam_score column to user_enrollments table
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS exam_score INTEGER DEFAULT NULL;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS exam_passed BOOLEAN DEFAULT NULL;
"@

# Prepare the headers with authentication
$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=minimal"
}

# REST API endpoint for PostgreSQL RPC
$endpoint = "$supabaseUrl/rest/v1/rpc/exec_sql"

# Create the request body
$body = @{
    "sql" = $sql
} | ConvertTo-Json

Write-Host "Attempting to apply migration to Supabase..."

try {
    # Send the request
    $response = Invoke-RestMethod -Uri $endpoint -Method POST -Headers $headers -Body $body
    
    Write-Host "Migration successful!"
    Write-Host "Response: $response"
} catch {
    Write-Host "Error applying migration: $_"
    
    # Try to get more error details
    try {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorContent = $reader.ReadToEnd()
        Write-Host "Error details: $errorContent"
    } catch {
        Write-Host "Could not read error details"
    }
} 