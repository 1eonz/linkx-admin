# 证据索引

- `assessment-b-report.md`：本轮 Assessment B 中文报告，包含哈希、detector、浏览器 finding 归属和清理状态。
- `hash-check.mjs`、`hash-check.command.txt`、`hash-check.stdout.json`、`hash-check.stderr.txt`、`hash-check.exit-code.txt`：七项冻结文件的 SHA256 核对脚本、命令和原始结果。
- `detector.command.txt`、`detector.stdout.json`、`detector.stderr.txt`、`detector.exit-code.txt`、`validate-detector.mjs`、`detector-validation.json`：detector 命令及原始三件套、JSON/退出码校验。
- `browser-run.mjs`、`browser-run.command.txt`、`browser-run.wrapper.exit-code.txt`、`browser-run.wrapper-note.md`：新 Chrome context/CDP 采集器和 wrapper 生命周期记录；浏览器采集器在完整写入证据后因 CDP socket 未关闭而被中断。
- `browser-evidence.json`、`browser-injection.json`：目标响应、预检、真实脚本注入、逐视图扫描、DOM 归属和截图路径。
- `browser-console.json`：impeccable console 发现、其他浏览器 console 与 Log 条目，包括本地 favicon 404。
- `browser-network.json`、`browser-network-summary.json`：原始请求分类候选和按 HTTP(S) 校正的摘要；六个 data URI 未计为外部网络请求。
- `browser-summary.json`、`summarize-browser.mjs`、`browser-summary.command.txt`：逐状态 rule 计数、demo 与 VitePress 外壳归属汇总。
- `screenshots/`：`page-top.png`、`default.png`、`default-overlay.png`、`default-overlay-scan.png`、`hud-overlay.png`、`empty-overlay.png`、`loading-overlay.png`、`error-overlay.png`、`mobile-overlay.png`。
- `live-server-start.command.txt`、`live-server-start.stdout.json`、`live-server-start.stderr.txt`、`live-server-start.exit-code.txt`、`live-server-root.txt`：隔离 overlay 服务启动命令和去除 token 后的端口/PID记录。
- `live-server-stop.command.txt`、`stop-live-server.mjs`、`live-server-stop.stdout.txt`、`live-server-stop.stderr.txt`、`live-server-stop.exit-code.txt`：停止命令与结果。
- `ports-before-stop.json`、`ports-after-stop.json`：4174、8489、8512、9515 的清理前后监听记录及最终 4174 HTTP 状态。
- `browser-stop.attempt.stderr.txt`、`browser-stop.attempt.exit-code.txt`、`browser-stop.result.md`：CDP 清理尝试时 9515 已关闭的原始错误及随后确认进程/端口已退出的结果。

所有新增报告与运行证据仅在本目录。未打开其他评审目录或修改产品源码。
