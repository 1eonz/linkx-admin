# Wave 7 Assessment B：LxTransferPanel 与 LxVirtualTree

**状态：P2 修复前基线，不是最终通过。** 本次截图、detector 输出和页面观察固定当前取证时的状态。修复页面 favicon 的 404 后，需要重新运行 B 评估；本报告不能代替修复后复验。

## 静态 Detector

六个指定 markup 目标均执行了 `node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json <target>`。六项 stdout 都是有效 JSON `[]`，stderr 为 0 字节，退出码均为 0。`[]` 只表示本次静态规则零命中。

每项独立保存了 `.command.txt`、`.stdout.json`、`.stderr.txt` 和 `.exit-code.txt`，位置在 `detector/`。汇总校验见 `detector-validation.json`。六个目标的取证前后 SHA-256 一致，见 `source-sha256-before.json`、`source-sha256-after.json` 与 `source-sha256-comparison.json`。

## 浏览器证据

使用 Playwright 启动独立 headless Microsoft Edge；每个状态新建 BrowserContext 和 page，没有复用用户标签。10/10 个状态均通过 document title 与 script 元素 preflight，均成功加载 `http://localhost:8400/detect.js`。浏览器原始记录在 `browser/browser-evidence.json`，汇总在 `browser/browser-summary.json`，10 张 overlay 截图在 `browser/screenshots/`。

当前工具未提供可展示并标记 `[Human]` 的原生浏览器标签，因此本次只保存 Playwright 截图证据，没有打开用户可见的 overlay 标签。

| 页面状态 | 视口 | detector overlay 报告数 | 横向溢出 | 截图 |
|---|---:|---:|---|---|
| TransferPanel light ready | 1440×1000 | 20 | 无 | `transfer-light-desktop-ready.png` |
| TransferPanel HUD ready | 1440×1000 | 253 | 无 | `transfer-hud-desktop-ready.png` |
| TransferPanel HUD ready | 375×844 | 240 | 无 | `transfer-hud-mobile-375-ready.png` |
| TransferPanel HUD loading | 1440×1000 | 253 | 无 | `transfer-hud-desktop-loading.png` |
| TransferPanel HUD error | 1440×1000 | 253 | 无 | `transfer-hud-desktop-error.png` |
| VirtualTree light ready | 1440×1000 | 7 | 无 | `tree-light-desktop-ready.png` |
| VirtualTree HUD ready | 1440×1000 | 202 | 无 | `tree-hud-desktop-ready.png` |
| VirtualTree HUD ready | 375×844 | 202 | 无 | `tree-hud-mobile-375-ready.png` |
| VirtualTree HUD empty | 1440×1000 | 191 | 无 | `tree-hud-desktop-empty.png` |
| VirtualTree HUD error | 1440×1000 | 192 | 无 | `tree-hud-desktop-error.png` |

这些数量是 detector 对整张 VitePress 文档页运行后的 overlay 数量，页面含文档外壳、属性表、说明和代码片段，不能直接解释为组件缺陷数。截图可见命中散布在文档正文、表格、示例代码和组件演示区。CLI 静态零命中与浏览器整页 overlay 数量测量范围不同。

本次注入会创建 `.impeccable-overlay` 与 `.impeccable-label` DOM 元素。页面 DOM 检查发现并记录了这些由 detector 自己添加的标记；它们和标签文字不是产品目标节点，需从目标问题中排除。overlay 上重复出现的 `✦ ai color palette`、`line length too long` 等标签也只作为检测器提示留档，不能按标签个数当成确认缺陷。

浏览器测得 light 文档底色/文字为 `rgb(255, 255, 255)` / `rgb(60, 60, 67)`；HUD 下文档为 `rgb(27, 27, 31)` / `rgb(223, 223, 214)`。TransferPanel 演示状态条的 HUD 底色为 `rgb(16, 26, 44)`、文字为 `rgb(148, 163, 184)`；VirtualTree 演示根区为 `rgb(11, 18, 32)`、文字为 `rgb(148, 163, 184)`。这些计算样式来自注入前页面 DOM，未把 overlay 的高亮颜色算作产品颜色。

TransferPanel light desktop 控制台有一条 404：`http://127.0.0.1:4174/favicon.ico`。其余九个状态未记录 console error。补充追踪见 `browser/transfer-light-network-trace.json`；错误 location 明确指向文档站 favicon，不是组件数据请求。此问题作为本轮 P2 复验门槛记录。

## 服务与清理

预览 `http://127.0.0.1:4174` 保持监听。临时 Impeccable 服务记录 PID `21028`、端口 `8400`，已执行 `node C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs stop --keep-inject`：退出码 0，PID 和端口均已关闭，仓库 `.impeccable/live/server.json` 已清除。完整生命周期在 `browser/live-server.lifecycle.json`，stop 命令输出在同目录 `live-server.stop.*`。

浏览器执行记录：`browser/browser-capture.command.txt`、`browser-capture.stdout.json`、`browser-capture.stderr.txt`、`browser-capture.exit-code.txt`。404 定位执行记录：`browser/network-trace.command.txt`、`network-trace.stdout.json`、`network-trace.stderr.txt`、`network-trace.exit-code.txt`。
