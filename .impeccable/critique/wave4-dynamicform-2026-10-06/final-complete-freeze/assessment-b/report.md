# Assessment B：Detector 与浏览器证据

目标：`http://127.0.0.1:4174/components/lxdynamicform.html`  
冻结：`source-hashes-freeze.json`，39 个文件，冻结时间 `2026-10-06T13:30:42.561Z`  
浏览器：Playwright（项目依赖 `@playwright/test`）驱动 Microsoft Edge `154.0.4258.53`。本环境未暴露原生 browser MCP，使用独立 Chromium context/page 与截图作为浏览器检查路径。本评估未访问 Assessment A 的目录、报告、截图或交互 JSON。

## 冻结校验

扫描前，39/39 文件 SHA-256 与冻结清单一致，0 个差异，明细见 `hashes-before.json`。完成后再次校验为 39/39 一致，0 个差异，明细见 `hashes-after.json`。评估中未编辑冻结范围内的源文件。

## 静态 Detector

冻结清单包含 19 个 `.vue` 文件、12 个 `.ts`、4 个 `.md`、4 个 `.css`。detector 支持 `.vue` markup，不支持 Markdown；TypeScript 测试/类型文件及 CSS 也不是本轮 markup 目标。故逐个对全部 19 个 `.vue` 文件执行：

```text
node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "<frozen .vue file>"
```

19/19 个 stdout 都是有效 JSON 空数组 `[]`，19 个 stderr 文件均为空，19 个进程退出码均为 `0`，静态命中数为 0。每个目标的完整命令、参数、解析结果、退出码、stderr、计数和规则列表保存在 `detector/summary.json` 与逐目标 `detector/*.result.json`；未经处理的 stdout JSON 和 stderr 分别保存在 `detector/raw/`。

`[]` 仅表示这 19 个 Vue 源文件未命中 detector 的静态规则，不表示运行页面没有问题，也不能单独视为 Critique 通过。

## 浏览器预检与运行

预检在新建 context/page 中访问目标页，HTTP 200；修改 `document.title` 成功，追加的内联 `<script>` 节点连接成功且实际执行并设置 marker。预检过程、console、页面状态和截图见 `browser/preflight.json`、`browser/preflight.png`。

预检成功后，在 `assessment-b` 目录通过 `node "...live-server.mjs" --background` 启动临时 Impeccable live-server（PID `13052`，端口 `8400`），并为三个视图分别创建全新 browser context/page，加载页面后注入 `http://localhost:8400/detect.js`，等待约 2.8 秒再读取 console、overlay 与序列化 selector。

| 视图 | 页面状态 | Detector console | Overlay 节点 | 水平溢出 / 页面 JS 错误 / 失败请求 | 截图 |
|---|---|---:|---:|---|---|
| 亮色桌面，1440×1000 | `html` 亮色，白底 | 16 项 | 16 | 无 / 0 / 0 | `browser/light-desktop.png` |
| HUD 深色桌面，1440×1000 | `html.dark`，深色背景 `rgb(27, 27, 31)`，Impeccable HUD 可见 | 325 项 | 325 | 无 / 0 / 0 | `browser/dark-desktop-hud.png` |
| 375px 触屏，375×812 | 亮色，`isMobile` 和 `hasTouch` 开启 | 10 项 | 10 | 无 / 0 / 0 | `browser/touch-375.png` |

三种状态都返回 HTTP 200；没有 page error 或 failed request。每视图的完整 console、页面主题与 viewport、overlay 数量、序列化 selector、命中规则、目标元素类别和祖先链分别在 `browser/light-desktop.json`、`browser/dark-desktop-hud.json`、`browser/touch-375.json`。批次服务生命周期与聚合结果在 `browser/evidence.json`。

## Overlay 命中核对

以下是运行时 overlay 对目标节点的逐条归因；规则条数是检测信号，不直接等于组件缺陷数。

- 亮色桌面序列化读取到 17 条规则：7 个 `line-length` 命中 `.vp-doc` 文档段落，5 个 `buried-raster` 命中代码示例的 `button.copy`，3 个 `gpt-thin-border-wide-shadow` 命中隐藏 select popper，`bounce-easing` 与 `layout-transition` 各命中全局 `body`。
- 深色桌面序列化读取到 327 条规则：309 个 `ai-color-palette` 全部命中 `.vp-doc` 内 Shiki 代码高亮 token，没有命中表单；5 个 `buried-raster` 命中代码示例复制按钮；7 个 `line-length` 命中文档段落；3 个阴影命中隐藏 select popper；全局 `body` 各有一个动效/布局命中；另有一个 `text-occlusion` 的目标是 detector 自己的 overlay label（“✦ ai color palette”），属于注入后的自引用误报。
- 375px 触屏视图序列化读取到 11 条规则：5 个 `buried-raster` 命中文档代码复制按钮，3 个阴影命中隐藏 select popper；`bounce-easing` 与 `layout-transition` 命中全局 `body`；一个 `clipped-overflow-container` 命中 VitePress 文档外壳 `span.container`。页面整体 `scrollWidth` 等于 375px，截图中没有水平溢出；该规则未归因到表单字段。
- 3 个 `gpt-thin-border-wide-shadow` selector 为 `#el-id-1024-5`、`#el-id-1024-10` 与 `#el-id-1024-15`，节点 class 均为 `el-popper ... el-select__popper lx-select__popper`，采集时 `getClientRects().length` 为 0。它们是未展开下拉层，不是当时可见的卡片阴影；本证据也不足以证明其是否使用了设计令牌。
- 深色 overlay 自动汇总为 325 项，注入后调用 `impeccableDetect()` 的序列化读取则返回 326 个分组、327 条规则记录，其中明确可归到 detector overlay 的是 `text-occlusion` 自引用项。自动 scan 与随后序列化不是同一时刻/同一 DOM 状态的计数，因此在报告中分别保留，未把差值计为产品问题。

## 服务与结束状态

Impeccable live-server 以后台模式启动，关闭命令为 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" stop --keep-inject`；退出码 `0`，stderr 空，停止后对端口 `8400/health` 的请求失败，确认临时服务已停止。用户已有的 4174 服务未关闭；批次结束后目标页仍返回 HTTP 200。

浏览器批次完成并写入全部截图、逐页 JSON 与服务停止状态后，Playwright Node 驱动进程仍保留浏览器句柄，因此通过 Ctrl+C 结束了该驱动进程；这发生在三个页面检查和临时服务关闭之后，不影响已落盘的浏览器证据。三页记录的页面错误、失败请求均为 0。
