<#
cloudcmd-admin-web 静态资源还原 - 一键执行入口

功能: 自动依次执行同目录下的全部 32 个部分脚本(restore-assets-icons-part1.ps1 ~ part32.ps1),
      执行顺序不限, 全部执行完成后 src\assets 与 src\icons 即完整还原。

用法:
  方式一: 将本脚本与全部部分脚本放在目标项目根目录, 直接执行
  方式二: 在任意位置执行, 通过 -TargetRoot 参数指定目标项目根目录:
    powershell -ExecutionPolicy Bypass -File .\restore-all.ps1 -TargetRoot "D:\path\to\target-project"

说明:
  - 每个部分脚本幂等可重复执行, 中断后重新运行本脚本即可
  - 目标位置同名文件会被直接覆盖
#>
param(
    # 目标项目根目录, 默认为脚本所在目录
    [string]$TargetRoot = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'

# 查找同目录下全部部分脚本, 按编号排序保证输出可读(实际执行顺序不影响结果)
$scriptDir = $PSScriptRoot
$parts = @(Get-ChildItem -Path $scriptDir -Filter 'restore-assets-icons-part*.ps1' -File |
    Sort-Object { [int]($_.BaseName -replace '^.*-part', '') })

if ($parts.Count -eq 0) {
    Write-Host "未找到部分脚本(restore-assets-icons-part*.ps1), 请确认它们与本脚本在同一目录: $scriptDir"
    exit 1
}
Write-Host ("找到 {0} 个部分脚本, 开始依次执行..." -f $parts.Count)

# 逐个调用部分脚本, 透传 -TargetRoot 参数
$done = 0
foreach ($p in $parts) {
    Write-Host ("[{0}/{1}] 执行 {2} ..." -f ($done + 1), $parts.Count, $p.Name)
    & $p.FullName -TargetRoot $TargetRoot
    $done++
}

# 最终校验: 统计还原出的文件数与残留分片
$assets = @(Get-ChildItem (Join-Path $TargetRoot 'src\assets') -Recurse -File -ErrorAction SilentlyContinue)
$icons = @(Get-ChildItem (Join-Path $TargetRoot 'src\icons') -Recurse -File -ErrorAction SilentlyContinue)
$leftover = @($assets + $icons | Where-Object { $_.Name -like '*.part*' })

Write-Host ("All restore parts completed: {0}; src\assets files: {1}; src\icons files: {2}" -f $done, $assets.Count, $icons.Count)
if ($leftover.Count -gt 0) {
    Write-Host ("Warning: {0} leftover .part files remain; check whether any restore part is missing." -f $leftover.Count)
} else {
    Write-Host 'Validation: expected 33 src\assets files and 48 src\icons files; no leftover .part files means restore is complete.'
}
