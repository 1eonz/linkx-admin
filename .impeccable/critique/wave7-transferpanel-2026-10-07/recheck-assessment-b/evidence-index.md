# Wave 7 Assessment B 证据索引

本目录是独立 Assessment B 复验的完整证据集；未读取或写入 Assessment A，也未修改产品源码。

| 证据 | 用途 |
| --- | --- |
| `recheck-assessment-b.md` | 中文复验报告与结论 |
| `detector.command.txt` | detector 完整命令 |
| `detector.stdout.json` | detector 原始 stdout，严格为 `[]` |
| `detector.stderr.txt` | detector 原始 stderr，空文件 |
| `detector.exitcode.txt` | detector 退出码 `0` |
| `detector-index-vue.*` / `detector-demo-basic-vue.*` / `detector-docs-lxtransferpanel-md.*` | 三个目标分别执行 detector 的 stdout、stderr、退出码（均为 `[]`、空 stderr、0） |
| `target-slug.txt` | Impeccable 目标 slug |
| `access-checks.json` | VitePress 与 overlay endpoint HTTP 200 访问检查 |
| `browser-attempt-1-failed.md` | 首次 about:blank 空白采集失败记录，未计入结论 |
| `browser-evidence.mjs` | 第二次有效 CDP 采集脚本 |
| `browser-evidence.json` | 最终 URL、appReady、overlay、布局、状态、交互、请求、console、页面错误原始证据 |
| `browser.stdout.json` / `browser.stderr.txt` / `browser.exitcode.txt` | 有效浏览器采集 stdout、stderr、退出码 |
| `runtime-summary.json` | 浏览器证据关键字段摘要 |
| `external-requests-summary.json` | 外部请求分类，HTTP(S) 为 0、data URI 为 6 |
| `desktop-light-overlay.png` | Desktop light + overlay |
| `desktop-hud.png` | Desktop HUD 深色主题 |
| `state-loading.png` | loading 状态 |
| `state-error.png` | error 状态 |
| `state-empty.png` | empty 状态 |
| `keyboard-focus.png` | 键盘 Tab 焦点路径 |
| `reduced-motion.png` | `prefers-reduced-motion: reduce` |
| `mobile-375-light.png` | 375px 初始视图 |
| `mobile-375-interactions.png` | 375px 批量选择、筛选与清除后的视图 |
| `target-loaded.html` | 有效页面导航后的 HTML 快照 |
| `source-hashes.json` | 三个冻结目标文件的 SHA-256 |
| `vitepress.stdout.log` / `vitepress.stderr.log` / `vitepress.pid` | VitePress 启动日志与 PID |
| `overlay.start.stdout.json` / `overlay.start.stderr.txt` / `overlay.start.exitcode.txt` | overlay 启动证据 |
| `overlay.stop.stdout.txt` / `overlay.stop.stderr.txt` / `overlay.stop.exitcode.txt` | overlay 停止证据 |
| `vitepress.stop.command.txt` / `vitepress.stop.targets.json` / `vitepress.stop.remaining.json` / `vitepress.stop.exitcode.txt` | VitePress 停止命令、进程和端口清理证据 |
| `services.before-stop.json` / `services.after-stop.json` | 临时服务停止前后端口记录 |
