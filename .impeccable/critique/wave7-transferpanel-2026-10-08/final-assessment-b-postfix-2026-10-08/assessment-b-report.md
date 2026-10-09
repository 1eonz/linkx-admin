# Wave 7 LxTransferPanel：Assessment B

执行方式：独立 detector 与浏览器取证。本次未读取、搜索或引用 Assessment A 的报告、目录或产物；未修改组件、测试或项目文档。

## 静态 detector

执行一次，命令为：

```text
node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json linkx-fe/src/components/LxTransferPanel/index.vue
```

退出码为 `0`；stdout JSON 为 `[]`；stderr 为空。原始内容分别保存在 `detector.stdout.json`、`detector.stderr.txt` 和 `detector.exit-code.txt`。这只表示该 Vue 文件没有命中本次静态规则，不表示组件或运行页面通过评审。

## 浏览器 overlay 证据

使用 Codex 运行时提供的 Playwright Chromium，新建隔离 browser context 和页面，未使用或操作 Codex in-app browser。目标 `http://127.0.0.1:4177/components/lxtransferpanel` 的三次导航均返回 HTTP 200；每页先修改 `document.title` 并追加内联脚本验证可变注入，再从独立 detector server 加载 `/detect.js`。三页脚本响应均为 HTTP 200，console 均输出 `[impeccable]` 分组，截图可见 overlay 标记。页面错误与失败请求均为零。

| 视图 | 浏览器状态 | Overlay 证据 | 截图 |
|---|---|---|---|
| 桌面浅色 | 1440×1000；白色背景；正常动效 | console 汇总 21；DOM 中 21 个 detector 标记 | `desktop-light.png` |
| 桌面深色/HUD | 1440×1000；`html.dark`；背景 `rgb(27, 27, 31)` | console 汇总 182；DOM 中 182 个 detector 标记，重复的 `ai-color-palette` 信号占多数 | `desktop-dark-hud.png` |
| 窄屏、键盘焦点、减少动效 | 375×812；`prefers-reduced-motion: reduce`；Tab 焦点在 Skip to content | console 汇总 12；DOM 中 12 个 detector 标记 | `mobile-375-focus-reduced-motion.png` |

浏览器规则证据包括：

- 桌面浅色和深色均报告 `clipped-overflow-container`（`div.lx-transfer-panel__panel`）、`buried-raster`、`line-length`、`bounce-easing` 与 `layout-transition`；浅色还报告 `edge-flush-cards`。
- 深色页另报告大量 `ai-color-palette`（console 记录 161 条同名命中）。这是整页的重复命中，不等同于 161 个独立缺陷。
- 窄屏页报告两个 `clipped-overflow-container`、五条 `text-occlusion` 以及上述动效/栅格规则。文档 `scrollWidth` 为 615px，大于 375px viewport，显示整页存在横向溢出信号。
- 窄屏的遮挡例子包括组件演示中的“加载中”“加载失败”按钮被 `div.lx-transfer-panel__mobile-switch` 覆盖、标签“最多 5 项”被按钮覆盖，以及“提供继承说明”被 header 覆盖。另有 `LxUI` 标题被当前获得焦点的 `.VPSkipLink` 覆盖；该项可能是跳转链接焦点状态产生的检测误报，需结合截图核对。

## 误报边界与限制

实际浏览器目标是 VitePress 文档页，detector 会扫描整页文档外壳、组件示例、属性/事件表格和代码示例；因此导航文本、文档长行、示例色彩和示例中的重复元素都会进入运行时计数，不能全部归因于 LxTransferPanel 组件本体。深色模式的调色板规则尤其受文档示例和语法色彩影响。应结合截图逐个确认 overlay 命中，不应把规则条数直接当成缺陷数。

console 原始 JSON 已保留，但 Playwright 将 detector 传入的 DOM 节点参数呈现为 `JSHandle@node`，没有把每条命中的稳定 selector 序列化到日志；截图中仍可查看 overlay 位置。桌面深色的 console 汇总数与按 console 行做规则分类得到的计数存在 1 条差异，原始消息保存在 `browser-evidence.json`，本报告采用 detector 自身的汇总和 overlay 标记数。减少动效偏好在窄屏上下文中确实为 `true`，但本次证据不单独证明每个 CSS 动效都已降级。

## 服务与清理

为 detector 注入启动了隔离于仓库之外的 live-server home：`C:\Users\Administrator\AppData\Local\Temp\codex-wave7-assessment-b-live-20261008`。PID 为 `23924`，端口为 `8400`。启动命令是 `node C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs --background`；停止命令是从该 home 执行 `node C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs stop --keep-inject`。停止结果成功，PID 已退出，8400 不再可访问。原有 4177 预览在停止后仍返回 HTTP 200，未被停止。

停止证据保存在 `live-server-stop.txt`；启动 PID、端口和停止命令保存在 `live-server-start.txt`。

## 证据索引

- `detector.stdout.json`、`detector.stderr.txt`、`detector.exit-code.txt`：唯一一次静态 detector 执行的完整分流结果。
- `browser-evidence.json`：每个视图的导航、注入预检、媒体状态、overlay 元素数、完整 console 文本、页面错误、请求失败和截图路径。
- `browser-run.stdout.json`、`browser-run.stderr.txt`、`browser-run.exit-code.txt`：浏览器采集进程输出与退出码。
- `desktop-light.png`、`desktop-dark-hud.png`、`mobile-375-focus-reduced-motion.png`：三种页面状态的全页截图。
- `assessment-b-browser.mjs`：浏览器证据采集脚本。
- `live-server-start.txt`、`live-server-stop.txt`：专用服务生命周期记录。
