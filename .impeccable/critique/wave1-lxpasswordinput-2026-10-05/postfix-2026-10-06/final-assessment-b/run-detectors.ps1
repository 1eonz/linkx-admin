$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path '.').Path
$evidenceRoot = Join-Path $repoRoot '.impeccable/critique/wave1-lxpasswordinput-2026-10-05/postfix-2026-10-06/final-assessment-b'
$detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs'
$targets = @(
  'linkx-fe/src/components/LxPasswordInput/index.vue',
  'linkx-fe/src/components/LxPasswordInput/demo/basic.vue',
  'linkx-fe/docs/components/lxpasswordinput.md'
)
$utf8 = [System.Text.UTF8Encoding]::new($false)
$commandLog = Join-Path $evidenceRoot 'detector-commands.tsv'
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("started`t$([DateTimeOffset]::Now.ToString('o'))")
$lines.Add("cwd`t$repoRoot")
$lines.Add("node`t$(& node --version)")

foreach ($target in $targets) {
  $key = ($target -replace '[^A-Za-z0-9]+', '-') -replace '(^-|-$)', ''
  $stdoutPath = Join-Path $evidenceRoot "$key.stdout.json"
  $stderrPath = Join-Path $evidenceRoot "$key.stderr.txt"
  $exitPath = Join-Path $evidenceRoot "$key.exit-code.txt"
  $command = "node `"$detector`" --json `"$target`""
  $lines.Add("command`t$command")
  $lines.Add("stdout`t$([System.IO.Path]::GetFileName($stdoutPath))")
  $lines.Add("stderr`t$([System.IO.Path]::GetFileName($stderrPath))")
  $lines.Add("exit-code`t$([System.IO.Path]::GetFileName($exitPath))")

  & node $detector --json $target 1> $stdoutPath 2> $stderrPath
  $exitCode = $LASTEXITCODE
  [System.IO.File]::WriteAllText($exitPath, "$exitCode`n", $utf8)
  $lines.Add("result`t$target`t$exitCode")
}

$lines.Add("finished`t$([DateTimeOffset]::Now.ToString('o'))")
[System.IO.File]::WriteAllLines($commandLog, $lines, $utf8)
$lines | Where-Object { $_ -like 'result*' }
