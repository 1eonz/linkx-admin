$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$detectorPath = 'C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs'
$outputEncoding = [System.Text.UTF8Encoding]::new($false)
$node = (Get-Command node -ErrorAction Stop).Source
$targets = @(
  @{ name = 'LxCheckbox'; path = 'linkx-fe/src/components/LxCheckbox' },
  @{ name = 'LxCheckboxGroup'; path = 'linkx-fe/src/components/LxCheckboxGroup' },
  @{ name = 'LxRadio'; path = 'linkx-fe/src/components/LxRadio' },
  @{ name = 'LxRadioGroup'; path = 'linkx-fe/src/components/LxRadioGroup' }
)
$summary = [System.Collections.Generic.List[object]]::new()

foreach ($target in $targets) {
  $prefix = Join-Path $PSScriptRoot "detector-$($target.name)"
  $targetPath = Join-Path $repoRoot $target.path
  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $process.StartInfo.FileName = $node
  $process.StartInfo.Arguments = '"{0}" --json "{1}"' -f $detectorPath, $targetPath
  $process.StartInfo.WorkingDirectory = $repoRoot
  $process.StartInfo.UseShellExecute = $false
  $process.StartInfo.CreateNoWindow = $true
  $process.StartInfo.RedirectStandardOutput = $true
  $process.StartInfo.RedirectStandardError = $true

  try {
    if (-not $process.Start()) {
      throw '无法启动 Node.js detector 进程。'
    }

    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    $process.WaitForExit()
    $stdoutText = $stdoutTask.GetAwaiter().GetResult()
    $stderrText = $stderrTask.GetAwaiter().GetResult()
    $exitCode = $process.ExitCode
  }
  catch {
    $stdoutText = ''
    $stderrText = $_.Exception.Message + [Environment]::NewLine
    $exitCode = 127
  }
  finally {
    $process.Dispose()
  }

  [System.IO.File]::WriteAllText("$prefix.stdout.json", $stdoutText, $outputEncoding)
  [System.IO.File]::WriteAllText("$prefix.stderr.txt", $stderrText, $outputEncoding)
  [System.IO.File]::WriteAllText("$prefix.exit-code.txt", "$exitCode`n", $outputEncoding)

  $parseOk = $false
  $findingCount = $null
  $parseError = $null
  if ($stdoutText.Trim() -eq '[]') {
    $parseOk = $true
    $findingCount = 0
  }
  else {
    try {
      $parsed = $stdoutText | ConvertFrom-Json -ErrorAction Stop
      $parseOk = $true
      if ($parsed -is [System.Array]) {
        $findingCount = $parsed.Count
      }
      elseif ($null -ne $parsed) {
        if ($parsed.PSObject.Properties.Name -contains 'findings') {
          $findingCount = @($parsed.findings).Count
        }
        elseif ($parsed.PSObject.Properties.Name -contains 'results') {
          $findingCount = @($parsed.results).Count
        }
      }
    }
    catch {
      $parseError = $_.Exception.Message
    }
  }

  $summary.Add([pscustomobject]@{
    target = $target.name
    relativePath = $target.path
    stdoutFile = [System.IO.Path]::GetFileName("$prefix.stdout.json")
    stderrFile = [System.IO.Path]::GetFileName("$prefix.stderr.txt")
    exitCodeFile = [System.IO.Path]::GetFileName("$prefix.exit-code.txt")
    exitCode = $exitCode
    stdoutJsonParsed = $parseOk
    findingCount = $findingCount
    jsonParseError = $parseError
    zeroFindingsMeaning = if ($parseOk -and $findingCount -eq 0) { '仅表示该目标静态规则零命中，不代表浏览器检查或 Critique 通过。' } else { $null }
  })
}

$summaryJson = ConvertTo-Json -InputObject @($summary) -Depth 6
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot 'detector-summary.json'), $summaryJson + [Environment]::NewLine, $outputEncoding)
$summary | Select-Object target, exitCode, stdoutJsonParsed, findingCount | Format-Table -AutoSize
