$ErrorActionPreference = 'Stop'

$evidenceDir = $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $evidenceDir '..\..\..\..\..')).Path
$nodePath = (Get-Command node -ErrorAction Stop).Source
$detectorPath = 'C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs'
$scanTargets = @(
  @{ Key = 'transferpanel-component'; Target = 'linkx-fe/src/components/LxTransferPanel/index.vue' },
  @{ Key = 'transferpanel-demo'; Target = 'linkx-fe/src/components/LxTransferPanel/demo/basic.vue' },
  @{ Key = 'transferpanel-docs'; Target = 'linkx-fe/docs/components/lxtransferpanel.md' },
  @{ Key = 'virtualtree-component'; Target = 'linkx-fe/src/components/LxVirtualTree/index.vue' },
  @{ Key = 'virtualtree-demo'; Target = 'linkx-fe/src/components/LxVirtualTree/demo/basic.vue' },
  @{ Key = 'virtualtree-docs'; Target = 'linkx-fe/docs/components/lxvirtualtree.md' }
)

$index = [System.Collections.Generic.List[object]]::new()
foreach ($scan in $scanTargets) {
  $scanDir = Join-Path $evidenceDir (Join-Path 'detectors' $scan.Key)
  New-Item -ItemType Directory -Path $scanDir -Force | Out-Null

  $commandText = 'node "{0}" --json "{1}"' -f $detectorPath, $scan.Target
  [System.IO.File]::WriteAllText((Join-Path $scanDir 'command.txt'), $commandText + "`r`n", [System.Text.UTF8Encoding]::new($false))

  $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $startInfo.FileName = $nodePath
  $startInfo.WorkingDirectory = $repoRoot
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.StandardOutputEncoding = [System.Text.UTF8Encoding]::new($false)
  $startInfo.StandardErrorEncoding = [System.Text.UTF8Encoding]::new($false)
  [void]$startInfo.ArgumentList.Add($detectorPath)
  [void]$startInfo.ArgumentList.Add('--json')
  [void]$startInfo.ArgumentList.Add($scan.Target)

  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $startInfo
  [void]$process.Start()
  $stdoutTask = $process.StandardOutput.ReadToEndAsync()
  $stderrTask = $process.StandardError.ReadToEndAsync()
  $process.WaitForExit()
  $stdout = $stdoutTask.GetAwaiter().GetResult()
  $stderr = $stderrTask.GetAwaiter().GetResult()
  $exitCode = $process.ExitCode

  [System.IO.File]::WriteAllText((Join-Path $scanDir 'stdout.json'), $stdout, [System.Text.UTF8Encoding]::new($false))
  [System.IO.File]::WriteAllText((Join-Path $scanDir 'stderr.txt'), $stderr, [System.Text.UTF8Encoding]::new($false))
  [System.IO.File]::WriteAllText((Join-Path $scanDir 'exit-code.txt'), [string]$exitCode + "`r`n", [System.Text.UTF8Encoding]::new($false))

  $findingCount = $null
  $validJson = $false
  try {
    $parsed = $stdout | ConvertFrom-Json -ErrorAction Stop
    $validJson = $true
    if ($parsed -is [System.Array]) { $findingCount = $parsed.Count }
    elseif ($null -eq $parsed) { $findingCount = 0 }
    else { $findingCount = 1 }
  } catch {}

  $index.Add([ordered]@{
    key = $scan.Key
    target = $scan.Target
    command = $commandText
    stdout = "detectors/$($scan.Key)/stdout.json"
    stderr = "detectors/$($scan.Key)/stderr.txt"
    exitCode = $exitCode
    validJson = $validJson
    findingCount = $findingCount
    validStaticZero = ($validJson -and $findingCount -eq 0 -and [string]::IsNullOrWhiteSpace($stderr) -and $exitCode -eq 0)
  })
}

$index | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidenceDir 'detector-index.json') -Encoding utf8
Write-Output (Join-Path $evidenceDir 'detector-index.json')
