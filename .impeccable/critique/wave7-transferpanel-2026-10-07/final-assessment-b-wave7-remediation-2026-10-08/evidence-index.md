# Assessment B 证据索引

本目录仅保存 Assessment B 的 detector 与浏览器取证材料。

- `assessment-b-report.md`：中文结果报告，说明未通过 Puppeteer 正式浏览器门槛、静态扫描结果、overlay 命中核验和清理状态。
- `detector.stdout.json`、`detector.stderr.txt`、`detector.exit.txt`：detector 原始 stdout、stderr、退出码。
- `detector.metadata.json`：扫描命令、目标、字节数与退出码。
- `sha256-start.txt`、`sha256-end.txt`：扫描和浏览器检查前后的七个指定文件 SHA256。
- `browser-runtime-probe.txt`：Puppeteer 缺失及本机 Chrome 可用情况。
- `browser-evidence.json`：第二轮五视图 DOM 状态、overlay 注入结果、截图名与完整浏览器 console 事件。
- `browser-evidence-first-attempt.json`：首次恢复筛选交互失败的记录。
- `browser-evidence.mjs`：通过新临时 profile 和 CDP 采集补充浏览器材料的脚本，不属于 Puppeteer 正式验收。
- `desktop-light.png`：浅色桌面 overlay 截图，1365×900。
- `narrow-filtered.png`：375×812 短筛选结果截图。
- `narrow-restored-scrollhint.png`：375×812 清除筛选、恢复列表并显示滚动提示。
- `narrow-scrollhint-dismissed.png`：375×812 已选列表滚至末尾，提示收起。
- `narrow-hud-dark.png`：375×812 HUD 深色视图。
- `desktop-light-first-attempt.png`、`narrow-filtered-first-attempt.png`：首次浏览器尝试的截图，供失败过程核对。
- `live-server.json`、`live-server-stop.stdout.txt`、`live-server-stop.stderr.txt`、`live-server-stop.exit.txt`：短时 detector 注入服务和停止记录。
- `cleanup-status.txt`：Chrome 进程与 8400 端口的最终状态。

最终报告没有把 Puppeteer 缺失下的 CDP 回退描述为正式浏览器通过。
