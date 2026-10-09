# 证据索引

- `assessment-b-report.md`：预检结论与七项冻结哈希对照。
- `hash-check.mjs`、`hash-check.node.command.txt`：权威 SHA256 核对脚本和命令。
- `hash-check.node.stdout.json`、`hash-check.node.stderr.txt`、`hash-check.node.exit-code.txt`：权威核对的原始 stdout、stderr、退出码；退出码 `2` 表示存在不匹配。
- `hash-check.ps1`、`hash-check.command.txt`、`hash-check.stdout.json`、`hash-check.stderr.txt`、`hash-check.exit-code.txt`：辅助 PowerShell 尝试；系统 Windows PowerShell 没有 `Get-FileHash`，失败退出码为 `1`，不作为结论依据。
- `detector.command.txt`：用户要求的 detector 命令文本。命令未执行；`detector.not-run.md` 说明冻结门槛阻止执行，因此没有 detector 原始输出或退出码。
- `preview-service-check.command.txt`、`preview-service-check.stdout.json`：目标 URL 与 4174 监听状态的收尾检查。
- `screenshots/NOT-CAPTURED.md`：截图未生成的原因。没有浏览器上下文或 overlay 注入证据。

产品源码未修改。本目录不包含 Assessment A 或综合评审报告内容。
