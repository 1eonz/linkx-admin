$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path '.').Path
$evidenceRoot = Join-Path $repoRoot '.impeccable/critique/wave1-lxpasswordinput-2026-10-05/postfix-2026-10-06/final-assessment-b'
$serverScript = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs'
$serverInfoPath = Join-Path $evidenceRoot 'live-server-info.json'
$serverInfo = Get-Content -Raw $serverInfoPath | ConvertFrom-Json
$serverScriptPath = Join-Path $repoRoot '.impeccable/live/server.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)

if (-not (Test-Path $serverScriptPath)) {
  throw 'Live-server ownership record is missing; refusing to stop an unverified service.'
}
$liveRecord = Get-Content -Raw $serverScriptPath | ConvertFrom-Json
if ($liveRecord.pid -ne $serverInfo.pid -or $liveRecord.port -ne $serverInfo.port) {
  throw 'Live-server ownership record does not match the instance started by this assessment.'
}

$stdoutPath = Join-Path $evidenceRoot 'live-server-stop.stdout.txt'
$stderrPath = Join-Path $evidenceRoot 'live-server-stop.stderr.txt'
$exitPath = Join-Path $evidenceRoot 'live-server-stop.exit-code.txt'
$command = "node `"$serverScript`" stop --keep-inject"
$log = Join-Path $evidenceRoot 'service-commands.tsv'
[System.IO.File]::AppendAllText($log, "command`t$command`n", $utf8)

& node $serverScript stop --keep-inject 1> $stdoutPath 2> $stderrPath
$exitCode = $LASTEXITCODE
[System.IO.File]::WriteAllText($exitPath, "$exitCode`n", $utf8)
Start-Sleep -Milliseconds 250
$tcpOpen = Test-NetConnection -ComputerName '127.0.0.1' -Port $serverInfo.port -InformationLevel Quiet -WarningAction SilentlyContinue
$pidAlive = $false
try {
  Get-Process -Id $serverInfo.pid -ErrorAction Stop | Out-Null
  $pidAlive = $true
} catch {
  $pidAlive = $false
}
$result = [ordered]@{
  stopExitCode = $exitCode
  stopStdout = [System.IO.Path]::GetFileName($stdoutPath)
  stopStderr = [System.IO.Path]::GetFileName($stderrPath)
  port = $serverInfo.port
  portOpenAfterStop = $tcpOpen
  processAliveAfterStop = $pidAlive
  verifiedClosed = (-not $tcpOpen) -and (-not $pidAlive)
}
[System.IO.File]::WriteAllText((Join-Path $evidenceRoot 'live-server-stop-verification.json'), ($result | ConvertTo-Json -Depth 5) + "`n", $utf8)
[System.IO.File]::AppendAllText($log, "stop-verification`t$($result.verifiedClosed)`t$(Get-Date -Format o)`n", $utf8)
$result | ConvertTo-Json -Depth 5
