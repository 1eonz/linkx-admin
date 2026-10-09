# Assessment B 证据索引

范围：DynamicForm 文档页修复后的独立 detector + browser overlay 检查。冻结基准在上级 `source-hashes-freeze.json`；起止哈希快照均在本目录。

- 报告：[report.md](report.md)
- 源码冻结起点：[hashes-start.json](hashes-start.json)
- 源码冻结终点：[hashes-end.json](hashes-end.json)
- Detector 总表及逐目标命令、stdout JSON、stderr、exit code：[detector-summary.json](detector-summary.json)、[detector/](detector/)
- 三视图浏览器证据：[browser-evidence.json](browser-evidence.json)
- 375px 注入前后对照：[browser-mobile-control-evidence.json](browser-mobile-control-evidence.json)
- 桌面浅色截图：[screenshots/desktop-light.png](screenshots/desktop-light.png)
- 桌面深色截图：[screenshots/desktop-dark.png](screenshots/desktop-dark.png)
- 375px overlay 截图：[screenshots/mobile-375-touch.png](screenshots/mobile-375-touch.png)
- 375px 无 overlay 控制截图：[screenshots/mobile-375-touch-no-overlay.png](screenshots/mobile-375-touch-no-overlay.png)
- 浏览器与服务清理：[service-lifecycle.md](service-lifecycle.md)
- 可复现采集脚本：[run-detector.mjs](run-detector.mjs)、[capture-browser.mjs](capture-browser.mjs)、[run-browser.mjs](run-browser.mjs)、[snapshot-hashes.mjs](snapshot-hashes.mjs)

`detector/` 目录中每个冻结 markup 目标各有 `.command.txt`、`.stdout.json`、`.stderr.txt`、`.exit-code.txt` 四个文件；扁平文件名前的 `__` 对应原相对路径分隔符。
