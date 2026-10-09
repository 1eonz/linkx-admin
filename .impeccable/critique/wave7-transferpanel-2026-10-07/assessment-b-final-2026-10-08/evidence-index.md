# Assessment B 证据目录

本目录只包含独立 Assessment B 对修复前冻结版 `9250D31A…4684A0A1` 的过程证据，不含 Assessment A 输入，不用于修复后的最终综合。

| 文件 | 内容 |
|---|---|
| `assessment-b-report.md` | 中文过程报告、哈希、结果和限制 |
| `detector.command.txt` | CLI detector 命令 |
| `detector.stdout.json` | detector 原始 JSON stdout |
| `detector.stderr.txt` | detector 原始 stderr |
| `detector.exit-code.txt` | detector 退出码 |
| `browser-runner.command.txt` | 浏览器采集命令 |
| `browser.command.txt` | Edge 启动命令 |
| `browser-evidence.json` | URL、哈希、预检、注入、发现、视口和截图指纹 |
| `browser-console.json` | 浏览器 console / exception / log 原始记录及筛选结果 |
| `screenshots/` | 桌面注入前、注入后和窄屏注入后的 PNG |
| `live-server-start.*` / `live-server-stop.*` | detector 临时服务的命令、脱敏启动信息、停止输出及退出码 |
| `browser-runner.capture-status.txt` | 采集完成后 runner 被 Ctrl+C 的原因和人工标签窗口状态 |
