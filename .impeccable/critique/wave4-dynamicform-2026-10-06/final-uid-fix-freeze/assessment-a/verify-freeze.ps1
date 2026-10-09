param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('before', 'after')]
  [string]$Phase
)

$assessmentDirectory = $PSScriptRoot
$freezeDirectory = Split-Path -Parent $assessmentDirectory
$repositoryRoot = (Resolve-Path (Join-Path $assessmentDirectory '..\..\..\..\..')).Path
$freezePath = Join-Path $freezeDirectory 'source-hashes-freeze.json'
$freeze = Get-Content -Raw -LiteralPath $freezePath | ConvertFrom-Json
$results = @(
  foreach ($entry in $freeze.files.PSObject.Properties) {
    $relativePath = $entry.Name
    $fullPath = Join-Path $repositoryRoot ($relativePath -replace '/', '\')
    $actualHash = $null
    if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
      $actualHash = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }

    [PSCustomObject]@{
      path = $relativePath
      expected = [string]$entry.Value
      actual = $actualHash
      matches = ($actualHash -eq [string]$entry.Value)
    }
  }
)

$mismatchCount = @($results | Where-Object { -not $_.matches }).Count
$summary = [PSCustomObject]@{
  phase = $Phase
  verifiedAtUtc = [DateTime]::UtcNow.ToString('o')
  fileCount = [int]$freeze.fileCount
  checkedCount = $results.Count
  mismatchCount = $mismatchCount
  allMatch = ($mismatchCount -eq 0)
  files = $results
}

$outputPath = Join-Path $assessmentDirectory "hash-verification-$Phase.json"
$summary | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $outputPath -Encoding utf8
Write-Output "phase=$Phase checked=$($results.Count) mismatches=$mismatchCount allMatch=$($summary.allMatch)"
Write-Output "evidence=$outputPath"
if ($mismatchCount -gt 0) {
  exit 2
}
