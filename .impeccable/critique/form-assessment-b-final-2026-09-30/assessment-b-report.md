Method: Assessment B only (detector + isolated browser evidence; independent from Assessment A)

# LxForm / LxDynamicForm — Impeccable Assessment B

日期：2026-09-30（Asia/Shanghai）
目标：`linkx-fe/src/components/LxForm/`、`linkx-fe/src/components/LxDynamicForm/`（含 fields）、对应中文文档与 Demo。

## 结论

本轮 Assessment B 的源码扫描和浏览器证据均已落盘，但当前不能标记为完整 Impeccable Critique 通过：完整门槛仍要求与独立 Assessment A 合并，并且四次 URL detector 因运行环境缺少 Puppeteer 以退出码 1 失败。源码 detector 的 `[]` 只表示静态规则零命中，浏览器 overlay 仍检测到需要人工归因的运行时命中，因此没有把 `[]` 当作通过。

浏览器证据本身有效：六个新建 Playwright 页面均返回 HTTP 200，页面可写注入预检成功，`detect.js` 注入成功，所有视图无 `pageError` 和失败网络请求。覆盖了桌面、375px、亮色、HUD 深色、表单错误、动态候选加载/错误、上传文件列表以及 `prefers-reduced-motion: reduce`。

## Detector 三件套

### 源码与文档目标

| 目标 | JSON stdout | stderr | 退出码 | 判读 |
|---|---|---|---:|---|
| `linkx-fe/src/components/LxForm` | `[]` | 空（0 字节） | 0 | 静态规则零命中 |
| `linkx-fe/src/components/LxDynamicForm` | `[]` | 空（0 字节） | 0 | 静态规则零命中 |
| `linkx-fe/docs/components/lxform.md` | `[]` | 空（0 字节） | 0 | 静态规则零命中 |
| `linkx-fe/docs/components/lxdynamicform.md` | `[]` | 空（0 字节） | 0 | 静态规则零命中 |
| `linkx-fe/src/components/LxForm/demo/basic.vue` | `[]` | 空（0 字节） | 0 | 静态规则零命中 |
| `linkx-fe/src/components/LxDynamicForm/demo/basic.vue` | `[]` | 空（0 字节） | 0 | 静态规则零命中 |

每个目标的原始 JSON、stderr 和退出码文件都在本目录，文件名以 `.detector.stdout.json`、`.detector.stderr.txt`、`.detector.exit-code.txt` 结尾。

### URL 目标

四个 URL detector 结果完全一致：stdout 为 `[]`，stderr 为：

`Error: puppeteer is required for URL scanning. Install: npm install puppeteer`

退出码均为 `1`。对应文件为：

- `lxform-desktop.url-detector.*`
- `lxform-375.url-detector.*`
- `lxdynamicform-desktop.url-detector.*`
- `lxdynamicform-375.url-detector.*`

这是扫描失败证据，不是 URL 页面清洁结果；本轮以隔离 Playwright 浏览器证据替代页面访问验证。

## 浏览器证据

预览页：

- `http://127.0.0.1:4174/components/lxform.html`
- `http://127.0.0.1:4174/components/lxdynamicform.html`

每个视图都是独立新页面。预检通过追加并执行 `script#impeccable-b-final-overlay-preflight`，再修改标题为 `[Human] ...`；六个页面均记录 `markerPresent=true`、`markerExecuted=true`。注入 `http://127.0.0.1:8400/detect.js` 后均记录 `detectorScriptPresent=true`、`detectorFunctionAvailable=true`。

| 视图 | HTTP | Overlay 节点（可见） | 主题 / 动效 | 状态证据 |
|---|---:|---:|---|---|
| LxForm 桌面亮色 | 200 | 7（2） | light / normal | 空提交错误项 2 |
| LxForm 375px 亮色 | 200 | 7（3） | light / normal | 空提交错误项 2 |
| LxDynamicForm 桌面亮色 | 200 | 8（5） | light / normal | 候选加载、失败、重试；上传列表 2 个文件 |
| LxDynamicForm 375px 亮色 | 200 | 9（6） | light / normal | 候选加载、失败、重试；上传列表 2 个文件 |
| LxDynamicForm 桌面 HUD | 200 | 194（28） | HUD / reduced | HUD 已生效，reduced media match=true；上传列表 2 个文件 |
| LxDynamicForm 375px HUD | 200 | 195（29） | HUD / reduced | HUD 已生效，reduced media match=true；上传列表 2 个文件 |

普通页面每个视图的 `pageErrors` 和 `failedRequests` 均为空。HUD 页面 console 数量较高，主要由 detector 对文档代码和 HUD 色彩的逐节点报告组成，不代表同等数量的产品错误。

基础状态记录在 `browser/browser-evidence.json`，注入后 overlay 证据记录在 `browser/overlay-evidence.json`。六张注入后截图为：

- `browser/lxform-desktop-light-overlay.png`
- `browser/lxform-375-light-overlay.png`
- `browser/lxdynamicform-desktop-light-overlay.png`
- `browser/lxdynamicform-375-light-overlay.png`
- `browser/lxdynamicform-desktop-hud-reduced-overlay.png`
- `browser/lxdynamicform-375-hud-reduced-overlay.png`

状态脚本还保存了未注入 overlay 的基线 scroll width：375px 视图为 375px；注入 detector 后 scroll width 变成 615px，是 overlay 标注自身扩展页面宽度，不能作为产品横向溢出的结论。

## Overlay 归因摘要

以下是运行时命中，不把命中数直接等同于缺陷数：

- 亮色 LxDynamicForm 的 `p.dynamic-form-demo__settings-hint` 命中 `low-contrast`：`#86909c` on `#ffffff`，对比度 `3.2:1`，规则要求 `4.5:1`。该选择器直接属于 Demo 设置提示，应作为真实 P2 可访问性候选复核。
- HUD LxDynamicForm 的 `p.dynamic-form-demo__settings-hint` 命中 `low-contrast`：`#64748b` on `#101a2c`，对比度 `3.7:1`，应结合 HUD 令牌复核。
- HUD 上传空态的一个 `p.lx-upload__title` 命中 `gray-on-color`：`#e2e8f0` on `#152e44`。这是组件目标内的真实色彩信号，需按设计图和对比度要求复核。
- HUD 中大量 `ai-color-palette` 命中位于预期的青色 HUD 控件、上传图标/按钮以及 Shiki 代码语法；其中代码命中和 neon 设计令牌命中不能按数量直接列为缺陷，但组件内的上传图标、浏览按钮和已选控件需人工对照设计图确认。
- `text-occlusion` 多数标记的是 detector 自己生成的 `✦ ai color palette` 标签被文档或上传拖拽层遮挡，是 overlay 自碰撞候选，不能直接归因于产品文本；文档代码区 `buried-raster`、`text-occlusion`、`body` 的 transition/bounce 命中同样主要属于 VitePress 壳层或示例页面。
- 375px 的 `clipped-overflow-container` 命中 `span.container`，与文档壳层/检测器标注相关；基线页面没有横向 overflow，需避免把注入后的 615px scroll width 当成业务组件缺陷。

## 生命周期与限制

- 本轮为浏览器可写注入后回退到 Playwright/Chromium 隔离新页面；CUA in-app browser 在本轮不可用，未把不可用的 CUA 结果伪装成成功。
- 4174 VitePress 服务和 8400 Impeccable helper 都为本轮验证临时启动；4174 通过终端 Ctrl+C 停止，8400 的 `live-server-overlay.stop.exit-code.txt` 为 `0`，停止器仅报告项目缺少 `.impeccable/live/config.json`，因此不能执行 live script tag 清理步骤，但 Playwright 页面已关闭、注入上下文已结束。
- 浏览器捕获进程退出码为 `0`，原始 stdout/stderr 在 `browser-capture.*`；overlay 截图捕获进程退出码为 `0`，原始 stdout/stderr 在 `overlay-capture.*`。
- 本轮没有修改任何产品源码。

## 文件索引

目录：`.impeccable/critique/form-assessment-b-final-2026-09-30/`

- `assessment-b-report.md`：本报告。
- `browser/browser-evidence.json`：六视图状态、错误、上传、候选加载/错误与网络/console 记录。
- `browser/overlay-evidence.json`：六视图注入后的 detector 函数、overlay 节点和状态记录。
- `browser/*.overlay.json`：逐视图 overlay 原始 JSON。
- `browser/*-overlay.png`：注入后的桌面、375px、亮色、HUD/reduced 截图。
- `browser-capture.*`、`overlay-capture.*`：捕获 stdout、stderr、退出码。
- `capture-form-assessment-b-final.cjs`、`capture-overlay-final.cjs`：本轮浏览器证据脚本。
- `server-lifecycle.md`、`live-server*.start.*`、`live-server*.stop.*`：临时服务生命周期记录。
