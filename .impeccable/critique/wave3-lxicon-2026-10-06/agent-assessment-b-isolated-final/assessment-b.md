# LxIcon 修后 Assessment B

本轮 Assessment B 与 Assessment A 的执行上下文完全隔离；未读取 Assessment A 报告、截图、JSON、摘要或目录，也未记录 Assessment A 的评分与建议。此报告只记录 detector 与浏览器证据，不代表 Assessment A 或合并后的 Critique 结论。

## 静态扫描

使用 bundled `detect.mjs --json` 分别扫描两个 markup 目标。`.vue` 组件和 Markdown 文档各自输出 JSON `[]`、stderr 为空、退出码 `0`。这只表示两个目标的静态规则零命中，不表示运行页面零命中。

| 目标 | stdout | stderr | 退出码 | 原始记录 |
| --- | --- | --- | --- | --- |
| `linkx-fe/src/components/LxIcon/index.vue` | `[]` | 空 | `0` | `detector-component.command.txt`、`detector-component.stdout.json`、`detector-component.stderr.txt`、`detector-component.exit-code.txt` |
| `linkx-fe/docs/components/lxicons.md` | `[]` | 空 | `0` | `detector-docs.command.txt`、`detector-docs.stdout.json`、`detector-docs.stderr.txt`、`detector-docs.exit-code.txt` |

`icons.ts` 是 TypeScript 图标数据，不是 markup 扫描目标，因此没有传给 CLI。三个指定文件均只读检查，未修改产品源码。

## 浏览器覆盖

以 `other-admin/admin-vue3` 已安装的 Playwright 1.58.0 驱动 Microsoft Edge；五个视图分别建立全新 browser context，实际导航到 `http://127.0.0.1:4174/components/lxicons.html`。每个 context 都将 `document.title` 改为带有 `Assessment B` 标记的标题，注入 `http://127.0.0.1:8400/detect.js`，确认脚本标签存在，调用 `window.impeccableScan()` 并等待 2.5 秒，再留存 console 与视口截图。普通 overlay 模式通过 console 和扫描返回值报告结果；扩展专用的 `impeccable-results` 消息不用于本次确认。

| context | 交互核验 | 规则命中数 / 元素分组数 | overlay DOM 节点 | 截图 |
| --- | --- | ---: | ---: | --- |
| 桌面浅色默认 | 标题、脚本注入、扫描完成 | 6 / 5 | 9 | `desktop-light-default.png` |
| 桌面暗色与键盘 | `<html>` 有 `dark` 类，背景为 `rgb(27, 27, 31)`；Tab 后 `summary.icon-group-title` 获得可见键盘焦点 | 8 / 7 | 13 | `desktop-dark-keyboard.png` |
| 窄屏空结果 | 375×812；空态可见、图标组数为 0、状态文本“无匹配图标”、页面无横向溢出 | 4 / 3 | 5 | `narrow-empty-result.png` |
| 复制失败 | 失败反馈显示；手动复制 textarea 可见、含 `<LxIcon name="delete" :size="20" />` 且已聚焦选中 | 4 / 3 | 5 | `copy-failure.png` |
| 减少动效 | `prefers-reduced-motion: reduce` 匹配；图标 transition 为 `0s`，卡片为 `0.00001s`（浏览器近零时长） | 6 / 5 | 9 | `prefers-reduced-motion.png` |

每种状态各有一张截图，且五个 context 的页面标题、脚本注入、扫描完成标记均已写入 `browser-evidence.json`。console 中每个 context 有两组相同的 detector 日志：页面注入后自动扫描一次，采集器再显式调用一次；上表按单次扫描的规则命中计数，未把重复日志当成新增命中。console 标题的“anti-patterns found”按元素分组计数，所以与逐条规则命中数不同。

第一次采集曾因等待普通 overlay 模式不会发送的扩展专用 `impeccable-results` 消息而超时，退出码 `1`。原始失败命令、stderr 和退出码保留在 `browser-capture.*`；改按普通模式的 console 与 `impeccableScan()` 返回值采集后，五个 context 全部完成，最终 Playwright 命令退出码 `0`，记录在 `browser-capture-final.*`。

## 命中定位与归属

静态扫描为零，但浏览器扫描能看到页面运行后的规则结果。以下是各 context 的逐条命中；浅色默认与减少动效命中相同内容。

| 页面目标 | 规则 | 视图 | 归属与判断 |
| --- | --- | --- | --- |
| `VPContent` 中“动效仅配置在 69 个名称上……”段落 | `line-length`，约 86 chars/line | 浅色、暗色、减少动效 | 目标文档。截图中的中文行约容纳 43 个全角字形；规则报告的字符数约为其两倍，按 CJK 显示宽度判断属于规则误报。 |
| `VPContent` 中“默认尺寸为 18px……”段落 | `line-length`，约 86 chars/line | 浅色、暗色、减少动效 | 目标文档，同一 CJK 行长规则误报。 |
| `VPContent` 中“在 src/components/LxIcon/icons.ts 中……”段落 | `line-length`，约 86 chars/line | 浅色、暗色、减少动效 | 目标文档，同一 CJK 行长规则误报。 |
| 示例代码块的 `button.copy[title="Copy Code"]` | `buried-raster`，raster background opacity 0 | 全部五种视图 | VitePress 代码块复制控件；规则命中其非活动态图形，归为 VitePress 壳层的规则误报。 |
| `body` | `overused-font`，Inter 占文本 68%（窄屏为 91%） | 全部五种视图 | 页面级统计，来自 VitePress 文档壳层的正文与导航，不是 LxIcon 图标组件。 |
| `body` | `layout-transition`，height / padding-top / padding-bottom | 全部五种视图 | 页面级 VitePress 布局过渡，归为壳层。 |
| Shiki 代码示例中的 `span` 文本 `name` 与 `size` | `ai-color-palette`，紫色代码字色 | 桌面暗色 | 两个命中都在语法高亮 token 上，颜色来自 VitePress/Shiki 暗色代码主题，归为壳层规则误报。 |
| VitePress 菜单图标 `span.container` | `clipped-overflow-container` | 窄屏空结果 | 菜单图标的动画容器裁切内部定位子项，属于 VitePress 壳层；截图中菜单图标可正常显示，规则误报。 |
| VitePress 文档 `div.container` | `first-viewport-column-overflow`，长列约为视口高度的 370% | 复制失败视图 | 文档主栏与短目录栏高度差由长篇组件文档造成；橙色边框覆盖整个文档布局，属于壳层结构上的规则误报。 |

五种状态均未命中 LxIcon SVG、`.icon-tile`、搜索框或复制失败反馈节点。目标文档的三条 `line-length` 命中虽锚定在目标内容，但按中文字形宽度检查为规则误报；其余命中都锚定在 VitePress 代码、导航或文档壳层。

桌面浅色 context 的 console 另有一条 `Failed to load resource: the server responded with a status of 404 (Not Found)`，console 文本未带 URL；同一 context 没有可对应的 HTTP 404 response 事件。按要求将它记为未归因，不推测资源来源。其余 context 没有 console 错误、页面异常或 HTTP 错误；`[vite] connecting/connected` 是开发服务器调试消息。

## 临时服务

Impeccable overlay 服务由 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" --background` 启动，端口 `8400`、PID `45468`。浏览器证据完成后执行 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" stop --keep-inject`：退出码 `0`，8400 监听数为 `0`，PID 已退出，`/health` 不可达。原停止命令与输出在 `server-stop.*`，核验结果在 `server-stop-verification.json`。用户的 4174 服务未停止，停止后目标页仍返回 HTTP `200`。

本目录包含本轮 detector 原始输出、浏览器原始证据、五张截图、采集脚本、临时服务启停记录和本报告；未读取或复用任何 Assessment A 或旧 Assessment B 证据。
