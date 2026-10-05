Method: independent Assessment B

## 范围与静态扫描

评估目标为 `linkx-fe/src/components/LxPasswordInput/index.vue`、`demo/basic.vue`、`docs/components/lxpasswordinput.md`，浏览器页面为 `http://127.0.0.1:4195/components/lxpasswordinput.html`。三个 detector 命令及各自 stdout JSON、stderr、退出码保存在 [`run-20261006`](./run-20261006/)；组件、Demo、文档的 stdout 均为 `[]`，stderr 为空，退出码均为 0。`[]` 只表示这三份静态目标没有命中静态规则，不代表运行页面没有问题或 Critique 已通过。

## 浏览器证据

Playwright 控制 Chrome 154 打开页面，HTTP 200。完成桌面 1280px 与 375px 窄屏、亮色与 HUD、显隐、键盘、失焦、只读、禁用和 `prefers-reduced-motion` 共 9 个状态截图；对应尺寸和状态在 `browser-evidence.json`，console、网络、overlay 归因分别见 `browser-console.json`、`browser-network.json`、`browser-findings.json`。九个状态均没有页面横向溢出。显隐按钮桌面为 28×28px、375px 下为 44×44px；键盘 Tab 可到显隐按钮并出现 `:focus-visible`，Space/Enter 均能切换密码类型，失焦触发 blur 状态。只读输入仍可显隐，禁用输入和按钮不可用，关闭 `showPassword` 后按钮消失且输入保持 password 类型。减少动效时按钮 transition 为 `0.00001s`。

检测脚本通过可变 DOM 预检后从 `http://127.0.0.1:8401/detect.js` 成功注入，`window.impeccableScanAsync` 可运行，console 报告 4 个命中（自动扫描与显式扫描各打印一次）。四个目标都属于 VitePress 文档外壳或文档内容，不是 LxPasswordInput 控件：

- `buried-raster`：`.vp-doc ... details.details.custom-block ... button.copy`，是示例代码块的复制按钮。
- `edge-flush-cards`：`.vp-doc ... table:nth-of-type(1)`，是 Props 文档表格。
- `first-viewport-column-overflow`：`.VPDoc ... div.container`，命中整页文档容器，页面较长。
- `layout-transition`：目标为 `body`，overlay 只显示页面级规则说明。

这些命中不能作为组件缺陷计数；若要判断文档站外壳本身，需单独以 VitePress 基线评估。网络记录没有外部请求。浏览器 console 另有一条资源 404，但 console 未给出 URL，sidecar 未捕获对应失败响应；另有 Chrome 对独立 Demo 密码框不在 `<form>` 内的提示。两项均未继续追查。

## 服务与限制

评估前 4195、8400 均无监听。本次仅启动 4195 文档服务和 8401 检测脚本资源服务；脱敏启动、就绪、停止记录及命令位于 `run-20261006`。停止后两个端口均无监听。VitePress stop 命令退出码为 0；检测资源服务由 `Stop-Process` 终止，停止命令退出码为 0，exec 会话退出码为 1，最终端口探测不响应。`.impeccable/live/server.json` 未读取或改写，未启动会读写该文件的 live-server。浏览器证据来自自动化桌面 Chrome，不包括真机触控或读屏器验证；没有发送后端请求。
