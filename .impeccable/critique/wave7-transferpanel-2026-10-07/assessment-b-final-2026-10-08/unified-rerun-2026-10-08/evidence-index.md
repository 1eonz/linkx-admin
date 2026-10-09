# Assessment B 证据索引

本目录保存 2026-10-08 最终源码冻结后的 Assessment B 证据与一次只读尺寸补测。没有修改产品源码；Assessment A 和跨评估综合由主控报告处理。

## 报告与机器摘要

- [assessment-b-report.md](assessment-b-report.md)：detector、浏览器状态、响应式归因、限制与清理结论。
- `machine-validation.json`：机器校验的 detector 状态、哈希一致性、浏览器异常与尺寸补测摘要。
- `source-hashes-before.json` / `source-hashes-after.json`：七个源码目标冻结前后的 SHA-256。

## Detector

- `detectors/`：七个目标各自的命令、原始 JSON、stderr 和真实退出码；六个 markup 目标是有效 detector 结果，CSS-only 尝试仅作辅助记录。
- `detector-ignore-context.txt`：扫描时使用的忽略上下文。

## 浏览器与尺寸

- `browser-evidence.json`：四个页面的 CDP 网络/console、overlay 注入与命中、交互状态、视口指标及截图引用。
- `screenshots/`：25 张截图，TransferPanel 桌面/移动共15张，VirtualTree 桌面/移动共10张。
- `overflow-dimensions-supplement.json`：375px/320px 下 TP/VT 的 overlay 注入前后文档、正文、代码块、表格及候选元素宽度；用于区分 VirtualTree 文档列自身的24px溢出与 overlay 添加到根元素的240px滚动宽度。
- `measure-responsive-overflow.mjs`：上述只读补测脚本，包含临时浏览器与服务清理逻辑。

## 服务生命周期

- `browser-runner.command.txt`、`vitepress.command.txt`、`overlay-server.command.txt`：主采集命令。
- `service-health.json`、`browser-runner.exit-code.txt`、`vitepress.process.json`、`overlay-server.process.json`：主采集服务检查与进程信息。
- `overflow-supplement-vitepress.stdout.log` / `overflow-supplement-vitepress.stderr.log`：补测 VitePress 日志。
- `overflow-dimensions-supplement.json.cleanup`：浏览器、VitePress、overlay、临时 profile、临时 overlay 目录及端口关闭状态。

