$ErrorActionPreference = 'Stop'

$evidenceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$debugPort = 43871
$profilePath = Join-Path (Join-Path $env:TEMP 'impeccable-transferpanel-assessment-b') ([guid]::NewGuid().ToString('N'))

if (-not (Test-Path -LiteralPath $chromePath)) {
  throw "Chrome executable not found: $chromePath"
}

New-Item -ItemType Directory -Force -Path $profilePath | Out-Null
$browserProcess = Start-Process -FilePath $chromePath -ArgumentList @(
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-allow-origins=*',
  "--remote-debugging-port=$debugPort",
  "--user-data-dir=$profilePath",
  'about:blank'
) -WindowStyle Hidden -PassThru

$deadline = (Get-Date).AddSeconds(20)
$devtoolsReady = $false
while ((Get-Date) -lt $deadline) {
  try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:$debugPort/json/version" -TimeoutSec 2
    $devtoolsReady = $true
    break
  } catch {
    Start-Sleep -Milliseconds 200
  }
}

if (-not $devtoolsReady) {
  if (Get-Process -Id $browserProcess.Id -ErrorAction SilentlyContinue) {
    Stop-Process -Id $browserProcess.Id -Force
  }
  throw "Chrome DevTools endpoint did not start on port $debugPort"
}

$info = [ordered]@{
  executable = $chromePath
  processId = $browserProcess.Id
  debugPort = $debugPort
  profilePath = $profilePath
  targetUrl = 'http://127.0.0.1:43620/components/lxtransferpanel'
  isolation = 'dedicated temporary user-data directory and CDP browser context'
}
$info | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $evidenceDir 'browser-process.json') -Encoding utf8
$info | ConvertTo-Json -Compress
