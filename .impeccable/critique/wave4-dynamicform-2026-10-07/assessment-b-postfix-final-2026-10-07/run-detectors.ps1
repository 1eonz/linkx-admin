$ErrorActionPreference = 'Continue'
$detector = 'C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs'
$targets = @(
  @{ Slug = 'LxDynamicForm-source'; Target = 'linkx-fe/src/components/LxDynamicForm' },
  @{ Slug = 'LxDatePicker-source'; Target = 'linkx-fe/src/components/LxDatePicker' },
  @{ Slug = 'LxUpload-source'; Target = 'linkx-fe/src/components/LxUpload' },
  @{ Slug = 'lxdynamicform-doc'; Target = 'linkx-fe/docs/components/lxdynamicform.md' },
  @{ Slug = 'lxdatepicker-doc'; Target = 'linkx-fe/docs/components/lxdatepicker.md' },
  @{ Slug = 'lxupload-doc'; Target = 'linkx-fe/docs/components/lxupload.md' }
)
$out = '.impeccable/critique/wave4-dynamicform-2026-10-07/assessment-b-postfix-final-2026-10-07/detector'
foreach ($item in $targets) {
  $cmdText = "node `"$detector`" --json `"$($item.Target)`""
  Set-Content -NoNewline -Encoding utf8 (Join-Path $out "$($item.Slug).command.txt") $cmdText
  & node $detector --json $item.Target 1> (Join-Path $out "$($item.Slug).stdout.json") 2> (Join-Path $out "$($item.Slug).stderr.txt")
  $exit = $LASTEXITCODE
  Set-Content -NoNewline -Encoding ascii (Join-Path $out "$($item.Slug).exit-code.txt") ([string]$exit)
  [PSCustomObject]@{ Target = $item.Target; ExitCode = $exit; Stdout = Join-Path $out "$($item.Slug).stdout.json"; Stderr = Join-Path $out "$($item.Slug).stderr.txt" }
}
