$ErrorActionPreference = 'Stop'

$root = 'F:\work\linkx-admin'
$freezePath = Join-Path $root '.impeccable\critique\wave4-dynamicform-2026-10-06\final-uid-fix-freeze\source-hashes-freeze.json'
$outputDir = Join-Path $root '.impeccable\critique\wave4-dynamicform-2026-10-06\final-uid-fix-freeze\assessment-b\detector'
$recordsDir = Join-Path $outputDir 'records'
$detector = 'C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs'
$node = (Get-Command node).Source
$manifest = Get-Content -Raw -LiteralPath $freezePath | ConvertFrom-Json
$targets = @($manifest.files.PSObject.Properties | Where-Object { [IO.Path]::GetExtension($_.Name) -eq '.vue' })
$null = New-Item -ItemType Directory -Path $recordsDir -Force
$index = 0

foreach ($entry in $targets) {
  $index++
  $target = Join-Path $root $entry.Name
  $safeName = $entry.Name -replace '[\\/:*?"<>|]', '__'
  $prefix = '{0:D2}-{1}' -f $index, $safeName
  $stdoutPath = Join-Path $outputDir ($prefix + '.stdout.json')
  $stderrPath = Join-Path $outputDir ($prefix + '.stderr.txt')
  $arguments = @($detector, '--json', $target)
  $process = Start-Process -FilePath $node -ArgumentList $arguments -WorkingDirectory $root -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -Wait -PassThru -NoNewWindow
  $exitCode = $process.ExitCode
  $raw = [string](Get-Content -Raw -LiteralPath $stdoutPath)
  $stderr = [string](Get-Content -Raw -LiteralPath $stderrPath)
  $parsed = $null
  $parseError = $null

  try {
    if ($raw.Trim()) { $parsed = ConvertFrom-Json -InputObject $raw }
  } catch {
    $parseError = $_.Exception.Message
  }

  if ($parsed -is [array]) {
    $findings = @($parsed)
  } elseif ($parsed -and $parsed.PSObject.Properties['findings']) {
    $findings = @($parsed.findings)
  } elseif ($null -eq $parsed) {
    $findings = @()
  } else {
    $findings = @($parsed)
  }

  $findingRows = @($findings | ForEach-Object {
    [pscustomobject]@{
      rule = $_.antipattern
      severity = $_.severity
      file = $_.file
      line = $_.line
      selector = $_.selector
      message = $_.message
      advisory = $_.advisory
    }
  })

  $row = [pscustomobject]@{
    target = $entry.Name
    command = ('node "{0}" --json "{1}"' -f $detector, $target)
    exitCode = $exitCode
    stdoutFile = [IO.Path]::GetFileName($stdoutPath)
    stderrFile = [IO.Path]::GetFileName($stderrPath)
    stdoutJsonParsed = (-not [string]::IsNullOrWhiteSpace($raw) -and $null -eq $parseError)
    parseError = $parseError
    stderr = $stderr
    findingCount = $findingRows.Count
    findings = $findingRows
  }
  $row | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $recordsDir ($prefix + '.result.json'))
}

$rows = @(Get-ChildItem -LiteralPath $recordsDir -Filter '*.result.json' | Sort-Object Name | ForEach-Object { Get-Content -Raw -LiteralPath $_.FullName | ConvertFrom-Json })
$findingTotal = ($rows | Measure-Object -Property findingCount -Sum).Sum
$summary = [pscustomobject]@{
  createdAt = (Get-Date).ToUniversalTime().ToString('o')
  targetUrl = 'http://127.0.0.1:4174/components/lxdynamicform.html'
  freezeFile = 'source-hashes-freeze.json'
  freezeFileCount = $manifest.fileCount
  scannedExtension = '.vue'
  excludedFreezeExtensions = @('.md', '.ts', '.css')
  detector = $detector
  commandPattern = 'node "<detect.mjs>" --json "<frozen .vue file>"'
  targetCount = $rows.Count
  findingCount = $findingTotal
  nonzeroExitCount = @($rows | Where-Object { $_.exitCode -ne 0 }).Count
  invalidJsonCount = @($rows | Where-Object { -not $_.stdoutJsonParsed }).Count
  targets = @($rows)
}

$summary | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $outputDir 'summary.json')
Write-Output ('targets={0}; findings={1}; nonzeroExit={2}; invalidJson={3}' -f $summary.targetCount, $summary.findingCount, $summary.nonzeroExitCount, $summary.invalidJsonCount)
