$ErrorActionPreference = "Stop"
$detector = "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs"
$outputDir = Join-Path (Get-Location).Path ".impeccable/critique/wave4-dynamicform-2026-10-06/final-unified-freeze/assessment-b"
$targets = @(
  @{ key = "source-dynamicform"; target = "linkx-fe/src/components/LxDynamicForm" },
  @{ key = "source-upload"; target = "linkx-fe/src/components/LxUpload" },
  @{ key = "source-datepicker-index"; target = "linkx-fe/src/components/LxDatePicker/index.vue" },
  @{ key = "docs-page-url"; target = "http://127.0.0.1:4174/components/lxdynamicform.html" }
)

$summaries = foreach ($item in $targets) {
  $stdoutPath = Join-Path $outputDir ($item.key + ".stdout.json")
  $stderrPath = Join-Path $outputDir ($item.key + ".stderr.txt")
  $commandPath = Join-Path $outputDir ($item.key + ".command.txt")
  $exitPath = Join-Path $outputDir ($item.key + ".exit-code.txt")
  $validPath = Join-Path $outputDir ($item.key + ".json-valid.txt")
  $commandText = "node `"$detector`" --json `"$($item.target)`""

  Set-Content -LiteralPath $commandPath -Value $commandText -Encoding utf8
  $process = Start-Process -FilePath "node" -ArgumentList @($detector, "--json", $item.target) -WorkingDirectory (Get-Location).Path -Wait -PassThru -NoNewWindow -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
  Set-Content -LiteralPath $exitPath -Value $process.ExitCode -Encoding ascii

  $valid = $false
  $findingsCount = $null
  try {
    $parsed = Get-Content -Raw -LiteralPath $stdoutPath | ConvertFrom-Json -ErrorAction Stop
    $valid = $true
    if ($parsed.PSObject.Properties.Name -contains "findings") {
      $findingsCount = @($parsed.findings).Count
    } elseif ($parsed -is [array]) {
      $findingsCount = $parsed.Count
    }
  } catch {
    $valid = $false
  }

  Set-Content -LiteralPath $validPath -Value "valid=$valid; findingsCount=$findingsCount" -Encoding utf8
  [pscustomobject]@{
    key = $item.key
    target = $item.target
    exitCode = $process.ExitCode
    jsonValid = $valid
    findingsCount = $findingsCount
    stdoutBytes = (Get-Item -LiteralPath $stdoutPath).Length
    stderrBytes = (Get-Item -LiteralPath $stderrPath).Length
  }
}

$summaries | ConvertTo-Json -Depth 4
