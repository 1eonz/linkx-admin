$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path '.').Path
$evidenceRoot = Join-Path $repoRoot '.impeccable/critique/wave1-lxpasswordinput-2026-10-05/postfix-2026-10-06/final-assessment-b'
$serverScript = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'
$stdoutPath = Join-Path $evidenceRoot 'live-server-start.stdout.json'
$stderrPath = Join-Path $evidenceRoot 'live-server-start.stderr.txt'
$exitPath = Join-Path $evidenceRoot 'live-server-start.exit-code.txt'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$command = "node `"$serverScript`" --background"
$log = Join-Path $evidenceRoot 'service-commands.tsv'
[System.IO.File]::AppendAllText($log, "command`t$command`n", $utf8)

& node $serverScript --background 1> $stdoutPath 2> $stderrPath
$exitCode = $LASTEXITCODE
[System.IO.File]::WriteAllText($exitPath, "$exitCode`n", $utf8)
[System.IO.File]::AppendAllText($log, "start-exit-code`t$exitCode`t$(Get-Date -Format o)`n", $utf8)
if ($exitCode -ne 0) {
  throw "live-server.mjs --background failed with exit code $exitCode"
}

$serverInfo = Get-Content -Raw $stdoutPath | ConvertFrom-Json
[System.IO.File]::WriteAllText((Join-Path $evidenceRoot 'live-server-info.json'), ($serverInfo | ConvertTo-Json -Depth 5) + "`n", $utf8)
"pid=$($serverInfo.pid) port=$($serverInfo.port)"
