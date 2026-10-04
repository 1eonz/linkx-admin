# Assessment B：LxForm / LxDynamicForm（2026-09-30 当前源码复验）

## 结论

本轮 Assessment B 已完成有效的源码 detector 与隔离浏览器证据采集，但不能将本轮标记为“无问题通过”。源码 detector 对两个组件目录均返回 `[]`、stderr 为空、退出码 `0`，这只表示当前静态规则没有命中。URL 形式的 detector 因运行时缺少 Puppeteer 返回 `[]` 但退出码为 `1`，属于扫描失败，不能按清洁结果解释。

浏览器页面均可访问，注入预检、detector 脚本注入和 overlay DOM 均成功。普通主题覆盖 LxForm 与 LxDynamicForm 的桌面/375px 视图，LxForm 另执行空表单提交校验；LxDynamicForm 覆盖 HUD 深色主题、375px 和 `prefers-reduced-motion: reduce`。页面错误和失败请求均为 0。Overlay 命中包含文档站代码/壳层、检测器自身提示和组件页面规则命中；这些命中必须结合目标 DOM 和设计依据逐条归因，不能把 headline 数量直接当成产品缺陷数。

## 目标与运行环境

- 源码目标：`linkx-fe/src/components/LxForm/`、`linkx-fe/src/components/LxDynamicForm/`（含 fields 子组件）。
- 文档 URL：`http://127.0.0.1:4174/components/lxform.html`、`http://127.0.0.1:4174/components/lxdynamicform.html`。
- 首次 CUA 标签访问后浏览器连接在本轮重试中不可用；随后使用本机已安装的 Playwright/Chromium 运行时，针对每个视图创建独立新页面，完成标题可变注入和 `detect.js` 注入。该降级仅影响浏览器自动化入口，不影响产品源码。
- 临时 Impeccable live server：端口 `8400`，启动记录在 `live-server.start.log`；捕获完成后应执行 `node C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs stop`，并保留 stop 输出。文档预览服务器 `4174` 不属于本轮 detector helper。

## 源码 detector 三件套

| 目标 | JSON stdout | stderr | 退出码 | 判读 |
|---|---|---|---:|---|
| `linkx-fe/src/components/LxForm` | `[]` | 0 字节 | 0 | 静态规则零命中，不代表浏览器页面通过 |
| `linkx-fe/src/components/LxDynamicForm` | `[]` | 0 字节 | 0 | 静态规则零命中，不代表浏览器页面通过 |
| `linkx-fe/docs/components/lxform.md` | `[]` | 0 字节 | 0 | 文档目标静态规则零命中 |
| `linkx-fe/docs/components/lxdynamicform.md` | `[]` | 0 字节 | 0 | 文档目标静态规则零命中 |
| `linkx-fe/src/components/LxForm/demo/basic.vue` | `[]` | 0 字节 | 0 | Demo 静态规则零命中 |
| `linkx-fe/src/components/LxDynamicForm/demo/basic.vue` | `[]` | 0 字节 | 0 | Demo 静态规则零命中 |

文件：

- `lxform.detector.stdout.json`
- `lxform.detector.stderr.txt`
- `lxform.detector.exit-code.txt`
- `lxdynamicform.detector.stdout.json`
- `lxdynamicform.detector.stderr.txt`
- `lxdynamicform.detector.exit-code.txt`
- `lxform-doc.detector.*`、`lxdynamicform-doc.detector.*`
- `lxform-demo.detector.*`、`lxdynamicform-demo.detector.*`

URL detector 也按四个视图各保存了三件套。四次均为 stdout `[]`、stderr `Error: puppeteer is required for URL scanning. Install: npm install puppeteer`、退出码 `1`：

- `lxform-desktop.url-detector.*`
- `lxform-375.url-detector.*`
- `lxdynamicform-desktop.url-detector.*`
- `lxdynamicform-375.url-detector.*`

## 浏览器证据矩阵

| 视图 | HTTP | 注入 | overlay 节点（可见） | reduced motion | HUD | 额外验证 |
|---|---:|---|---:|---|---|---|
| LxForm 桌面亮色 | 200 | 成功 | 6（3） | 否 | 否 | 空提交后错误项 2 |
| LxForm 375px 亮色 | 200 | 成功 | 6（3） | 否 | 否 | 无 page error / failed request |
| LxDynamicForm 桌面亮色 | 200 | 成功 | 8（4） | 否 | 否 | 无 page error / failed request |
| LxDynamicForm 375px 亮色 | 200 | 成功 | 8（4） | 否 | 否 | 无 page error / failed request |
| LxDynamicForm 桌面 HUD | 200 | 成功 | 176（11） | 是 | 已生效 | `dynamic-form-demo lx-theme-hud` |
| LxDynamicForm 375px HUD | 200 | 成功 | 176（11） | 是 | 已生效 | `dynamic-form-demo lx-theme-hud` |

HUD 视图先展开“演示设置”后切换“HUD 深色主题”；`hudControl.count=1`、可见且点击成功。之前未展开 details 的尝试被单独记录为不可见控件超时，不能作为 HUD 失败结论；最终 `hud-open` 证据已覆盖它。

每个视图的 `pageErrors` 和 `failedRequests` 均为空；请求来源只包含本地文档站 `127.0.0.1:4174` 和 detector helper `127.0.0.1:8400`。LxForm 普通视图各有 11 条 console 消息，LxDynamicForm 普通视图各有 13 条，HUD/reduced 各有 181 条；绝大多数是 detector 分组/规则日志，不是浏览器错误。

## Overlay 规则摘要

- LxForm 桌面：`buried-raster`、`gpt-thin-border-wide-shadow`、`em-dash-overuse`、`layout-transition`、`first-viewport-column-overflow`；移动视图另有 `clipped-overflow-container`。
- LxDynamicForm 桌面：`buried-raster`、`gpt-thin-border-wide-shadow`、`text-occlusion`、`bounce-easing`、`layout-transition`、`first-viewport-column-overflow`；移动视图另有 `clipped-overflow-container`。
- HUD/reduced：两视图各报告 176 条 headline，规则类型包含 `ai-color-palette`、`buried-raster`、`gpt-thin-border-wide-shadow`、`text-occlusion`、`bounce-easing`、`layout-transition`，移动视图另有 `clipped-overflow-container`。`ai-color-palette` 大量来自文档代码与 HUD 检测标记，需按组件归属复核，不能按计数直接开缺陷。

这些命中已保留原始 console、逐视图 JSON 和截图；本报告不把文档壳层命中自动归为 LxForm/LxDynamicForm 产品缺陷。Assessment A 的设计评分未在本报告中引用，等待父任务综合。

## 证据路径

目录：`.impeccable/critique/form-assessment-b-current-2026-09-30-retry2/`

- `assessment-b-report.md`：本报告。
- `browser-safe/browser-overlay-evidence.json`：六视图汇总（HUD 记录已用成功展开 details 的版本合并）。
- `browser-safe/*.overlay.json`：逐视图运行记录。
- `browser-safe/*-overlay.png`：普通、HUD、375px 截图；`lxform-desktop-invalid-overlay.png` 为提交校验错误态。
- `browser-safe/hud-reduced-evidence.json`：HUD/reduced 的独立汇总。
- `browser-safe.stdout.json`、`browser-safe.stderr.txt`、`browser-safe.exit-code.txt`：浏览器捕获进程三件套（退出码 `0`）。
- `lxform.detector.*`、`lxdynamicform.detector.*`：源码 detector 三件套。
- `*.url-detector.*`：URL detector 失败三件套，保留 stdout `[]`、stderr 和退出码 `1`。
- `capture-browser-safe.cjs`、`capture-hud-open.cjs`：本轮证据脚本，未修改产品源码。

## 限制与后续归因

1. URL detector 缺 Puppeteer，不能据此判定 URL 页面静态扫描通过；Playwright overlay 证据是本轮页面运行证据。
2. detector overlay 自身可能遮挡文档内容；截图中的 banner/代码区命中需与组件 DOM 分离核验。
3. 本轮未把 detector 计数直接转换成 P1/P2；需要父任务结合 Assessment A、设计图、组件 DOM 归属和交互状态决定修复优先级。
4. 预览服务器可能被其他开发会话复用；若停止 8400 helper 后再次复验，必须重新确认端口和注入状态。
