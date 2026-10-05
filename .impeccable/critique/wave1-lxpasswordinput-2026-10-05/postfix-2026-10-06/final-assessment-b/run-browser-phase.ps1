param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('preflight', 'views')]
  [string]$Phase,
  [int]$Port = 0
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path '.').Path
$evidenceRoot = Join-Path $repoRoot '.impeccable/critique/wave1-lxpasswordinput-2026-10-05/postfix-2026-10-06/final-assessment-b'
$runner = Join-Path $evidenceRoot 'browser-evidence.mjs'
$utf8 = [System.Text.UTF8Encoding]::new($false)

if ($Phase -eq 'views' -and $Port -le 0) {
  throw 'Port is required for the views phase.'
}

$stdoutPath = Join-Path $evidenceRoot "browser-$Phase.stdout.txt"
$stderrPath = Join-Path $evidenceRoot "browser-$Phase.stderr.txt"
$exitPath = Join-Path $evidenceRoot "browser-$Phase.exit-code.txt"
$command = if ($Phase -eq 'preflight') {
  "node `"$runner`" preflight"
} else {
  "node `"$runner`" views $Port"
}

$log = Join-Path $evidenceRoot 'browser-commands.tsv'
if (-not (Test-Path $log)) {
  [System.IO.File]::WriteAllText($log, '', $utf8)
}
[System.IO.File]::AppendAllText($log, "command`t$command`n", $utf8)

if ($Phase -eq 'preflight') {
  & node $runner preflight 1> $stdoutPath 2> $stderrPath
} else {
  & node $runner views $Port 1> $stdoutPath 2> $stderrPath
}
$exitCode = $LASTEXITCODE
[System.IO.File]::WriteAllText($exitPath, "$exitCode`n", $utf8)
[System.IO.File]::AppendAllText($log, "result`t$Phase`t$exitCode`t$(Get-Date -Format o)`n", $utf8)
"phase=$Phase exit-code=$exitCode"
