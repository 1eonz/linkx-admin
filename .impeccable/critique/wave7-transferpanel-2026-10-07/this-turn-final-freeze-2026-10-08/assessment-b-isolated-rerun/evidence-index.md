# Assessment B Evidence Index

All artifacts are confined to this directory.

- `assessment-b-report.md`: 中文静态扫描与浏览器证据报告，包含运行边界和 skipped-questions close.
- `source-hashes.md`: 六个目标文件起始/结束 SHA-256 对照。
- `detector/`: 六个 markup target 的 `.command.txt`, `.stdout.json`, `.stderr.txt`, `.exit-code.txt`。各 stdout 是 `[]`，stderr 空，exit code 为 0。
- `browser/capture-pages.mjs`, `capture.command.txt`, `capture.stdout.txt`: 一次性 Edge CDP 采集器、原调用命令和 8 个状态的采集输出；脚本为本次隔离目录内新增。
- `browser/browser-evidence.json`: 两个独立 browser context 的 8 个主题/viewport 记录，包含 preflight、overlay、console、宽度与截图索引。
- `browser/screenshots/`: 两个页面各有 desktop/mobile × light/HUD dark 截图，共 8 张 PNG。
- `browser/edge.command.txt`, `edge.stdout.txt`, `edge.stderr.txt`: Edge 采集浏览器启动命令与进程输出。
- `browser/overlay-server-start.*`: 临时 overlay server 启动命令、stdout JSON、stderr 和退出码。
- `browser/overlay-server-stop.*`: 临时 overlay server 停止命令、stdout、stderr 和退出码。

结束检查：8/8 页面状态均有 preflight 和 overlay 加载成功记录；0 条 browser `error`/`exception`；8400 已停止，4174/PID 27132 仍运行；六个目标 SHA-256 无变化。
