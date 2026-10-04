# Assessment B：LxForm 与 LxDynamicForm

日期：2026-09-30  
范围：仅静态 detector 与浏览器/Overlay 证据；未读取或采用 Assessment A 的结论。

## 检查目标

- linkx-fe/src/components/LxForm/index.vue
- linkx-fe/src/components/LxForm/LxFormItem.vue
- linkx-fe/src/components/LxDynamicForm/index.vue
- linkx-fe/src/components/LxDynamicForm/fields/

## 静态 detector

按 Impeccable Critique 的 JSON 命令对以上四个目标执行一次源码扫描。原始结果为 stdout []、stderr 空、退出码 0，记录见 [detector.stdout.json](form-assessment-b-current-2026-09-30/detector.stdout.json)、[detector.stderr.txt](form-assessment-b-current-2026-09-30/detector.stderr.txt) 和 [detector.exit-code.txt](form-assessment-b-current-2026-09-30/detector.exit-code.txt)。这代表传入的源码目标扫描完成且没有 detector 主要发现，不代表运行页面没有问题。

独立重试目录中的 LxForm 与 LxDynamicForm 源码扫描也各自记录了 stdout []、stderr 空、退出码 0；原始文件保存在 form-assessment-b-current-2026-09-30-retry/。

## 浏览器与 Overlay

CUA 浏览器在第一次尝试后不可用，因此使用工作区随附的 Playwright/Chromium 运行时，在六个新页面中完成了可重复的浏览器捕获。检测脚本注入成功：每条记录的 HTTP 状态为 200、detectorScriptPresent 和 detectorFunctionAvailable 均为 true、injectionError 为空。Playwright 将页面标题标记为 Human 检查页，保存了 Overlay 截图和每个视图的 JSON。脚本及汇总结果分别见 [capture-browser-evidence.cjs](form-assessment-b-current-2026-09-30/capture-browser-evidence.cjs)、[browser-capture.stdout.json](form-assessment-b-current-2026-09-30/browser-capture.stdout.json) 和 [browser-overlay-evidence.json](form-assessment-b-current-2026-09-30/browser/browser-overlay-evidence.json)。

| 视图 | 视口 / 状态 | Overlay 节点（可见） | 发现元素记录 | Console 总数 / error / warning | 截图与逐视图记录 |
|---|---|---:|---:|---:|---|
| LxForm 桌面 | 1280×800，亮色，普通动效 | 6（3） | 9 | 11 / 0 / 0 | [PNG](form-assessment-b-current-2026-09-30/browser/lxform-desktop-overlay.png) · [JSON](form-assessment-b-current-2026-09-30/browser/lxform-desktop.overlay.json) |
| LxForm 窄屏 | 375×812，亮色，普通动效 | 6（3） | 7 | 11 / 0 / 0 | [PNG](form-assessment-b-current-2026-09-30/browser/lxform-375-overlay.png) · [JSON](form-assessment-b-current-2026-09-30/browser/lxform-375.overlay.json) |
| LxDynamicForm 桌面 | 1280×800，亮色，普通动效 | 12（9） | 14 | 17 / 0 / 0 | [PNG](form-assessment-b-current-2026-09-30/browser/lxdynamicform-desktop-overlay.png) · [JSON](form-assessment-b-current-2026-09-30/browser/lxdynamicform-desktop.overlay.json) |
| LxDynamicForm 窄屏 | 375×812，亮色，普通动效 | 12（9） | 13 | 17 / 0 / 0 | [PNG](form-assessment-b-current-2026-09-30/browser/lxdynamicform-375-overlay.png) · [JSON](form-assessment-b-current-2026-09-30/browser/lxdynamicform-375.overlay.json) |
| LxDynamicForm HUD 桌面 | 1280×800，深色，Reduced Motion | 169（15） | 185 | 174 / 0 / 0 | [PNG](form-assessment-b-current-2026-09-30/browser/lxdynamicform-hud-reduced-desktop-overlay.png) · [JSON](form-assessment-b-current-2026-09-30/browser/lxdynamicform-hud-reduced-desktop.overlay.json) |
| LxDynamicForm HUD 窄屏 | 375×812，深色，Reduced Motion | 169（15） | 185 | 174 / 0 / 0 | [PNG](form-assessment-b-current-2026-09-30/browser/lxdynamicform-hud-reduced-375-overlay.png) · [JSON](form-assessment-b-current-2026-09-30/browser/lxdynamicform-hud-reduced-375.overlay.json) |

Overlay 节点数、可见节点数和 detector 发现元素数是不同指标，不能直接当作独立缺陷数量。每个视图均记录 0 个页面级 JavaScript 异常、0 个失败请求、0 条 Console error、0 条 Console warning。请求来源仅有本地文档站 127.0.0.1:4174 与 detector 辅助服务 127.0.0.1:8400。HUD 两个视图的 JSON 都确认 HUD 主题已应用且 prefers-reduced-motion 匹配。

### 命中归属与人工复核边界

- LxForm 两个视图的主要命中落在 VitePress 文档壳、代码示例和页面级文本/过渡规则；发现记录还含一个隐藏的 Element Plus 节点。截图中的表单控件可见。空表单提交另外验证了两项表单校验错误，结果计数为 2，截图见 [lxform-desktop-invalid-overlay.png](form-assessment-b-current-2026-09-30/browser/lxform-desktop-invalid-overlay.png)。
- LxDynamicForm 普通主题中，low-contrast 命中包括两个上传控件的辅助文字及已上传文件状态文字；其余命中还涉及设置摘要、文档代码示例和文档壳。移动截图中表单控件仍可见。
- HUD 视图每次报告 171 个 ai-color-palette 命中。按 selector 归属复核，其中 157 个落在 VitePress Shiki 语法高亮代码片段，14 个落在两个 LxUpload 控件的图标及其子节点。这个计数是 DOM 子节点级规则命中，不是 171 个独立 UI 缺陷。上传控件的青色深色主题提示仍需按设计意图人工判断。其余可见的辅助文字对比度命中也应按实际控件复核，不能只按 detector 数量定性。
- 捕获的 Console 消息总数包含 detector 的分组与逐项报告日志。上表列出各页消息总数，并单独列出 error 和 warning；这两类均为 0。原始 Console、pageErrors、failedRequests 与请求来源记录在逐视图 JSON 中。

## URL detector 失败记录

四次 URL 模式扫描的 stdout 虽然均为 []，但 stderr 均为 Error: puppeteer is required for URL scanning. Install: npm install puppeteer，且真实退出码均为 1。因此这些是扫描失败，不能解释成 URL 检查通过。

| 目标 / 视口 | stdout | stderr | 退出码 |
|---|---|---|---:|
| LxForm / 1280×800 | [JSON](form-assessment-b-current-2026-09-30/lxform-desktop.stdout.json) | [日志](form-assessment-b-current-2026-09-30/lxform-desktop.stderr.txt) | [1](form-assessment-b-current-2026-09-30/lxform-desktop.exit-code.txt) |
| LxForm / 375×812 | [JSON](form-assessment-b-current-2026-09-30/lxform-375.stdout.json) | [日志](form-assessment-b-current-2026-09-30/lxform-375.stderr.txt) | [1](form-assessment-b-current-2026-09-30/lxform-375.exit-code.txt) |
| LxDynamicForm / 1280×800 | [JSON](form-assessment-b-current-2026-09-30/lxdynamicform-desktop.stdout.json) | [日志](form-assessment-b-current-2026-09-30/lxdynamicform-desktop.stderr.txt) | [1](form-assessment-b-current-2026-09-30/lxdynamicform-desktop.exit-code.txt) |
| LxDynamicForm / 375×812 | [JSON](form-assessment-b-current-2026-09-30/lxdynamicform-375.stdout.json) | [日志](form-assessment-b-current-2026-09-30/lxdynamicform-375.stderr.txt) | [1](form-assessment-b-current-2026-09-30/lxdynamicform-375.exit-code.txt) |

## 辅助服务与结论

Playwright 捕获命令退出码为 0、stderr 为空。用于 Overlay 的辅助服务端口 8400（捕获轮 PID 35528）启动和停止命令退出码均为 0；两次记录中的 PID 9148 与 35528 当前都不在运行。停止器 stderr 提示缺少 .impeccable/live/config.json，因此清理 live script tag 的步骤没有执行。detector 是在关闭后的 Playwright 页面上下文中注入的；本次 Assessment B 更新没有修改产品源码。

结论：四个源码目标的静态 detector 扫描有效完成且为 []；Playwright 浏览器注入、Overlay、截图、Console 与网络记录也已采集。四次 URL detector 扫描因缺少 Puppeteer 而失败，所以 Assessment B 不标记为正式 Critique 通过。URL 的 [] 不能覆盖退出码 1；本报告记录的是已完成的静态与浏览器证据，以及未通过的 URL 扫描门槛。