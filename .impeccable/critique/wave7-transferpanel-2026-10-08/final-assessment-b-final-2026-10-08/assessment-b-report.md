# Wave7 LxTransferPanel Assessment B

执行方式：独立 Assessment B；对目标 `.vue` 做一次有效静态扫描，并用三个全新 Chromium context 检查桌面浅色、深色 HUD、375px 键盘焦点与减少动效视图。评审仅使用指定组件源码、指定页面运行结果和本目录生成的证据。

## 静态扫描

有效命令保存在 `detector-command.txt`。目标是 `linkx-fe/src/components/LxTransferPanel/index.vue`，stdout 为 `[]`，stderr 为空，exit code 为 `0`。这只表示当前组件源码的静态规则零命中，不代表页面运行时零问题。

证据脚本第一次计算仓库根目录时多回退一级，调用没有指向目标文件，exit code 为 `1`；原始命令、stdout、stderr 和退出码保存在 `detector-attempt-1-*`。修正根目录后才执行上述唯一一次有效组件扫描。

## 浏览器证据

先在每个新页面设置标题并附加 inline script，三个页面都确认标题、脚本节点和 marker 可变更。随后以 `script.onload`、资源 HTTP 200、页面 console、`impeccable` DOM 节点和截图共同确认 `detect.js` 已运行；各视图均保存 overlay 前后截图。

| 视图 | 视口与检测器标题 | 规则消息数 | 页面横向溢出 | 焦点 / 偏好 |
|---|---|---:|---|---|
| 桌面浅色 | 1440 × 960；23 | 24 | 无，document scrollWidth 1425px | 不适用 |
| 深色 HUD | 1440 × 960；184 | 185 | 无，document scrollWidth 1425px | 深色主题已生效 |
| 窄屏 | 375 × 812；11 | 12 | 无，document scrollWidth 375px | 第 1 次 Tab 聚焦“待选 2”，`:focus-visible` 为真，按钮高 44px；`prefers-reduced-motion` 为真 |

每个视图的 console 规则行数都比 `[impeccable] N anti-patterns found` 标题多 1 行（23/24、184/185、11/12）。原始 console event 保存在 `browser-evidence.json`，整理版在 `browser-console.log`；计数差异仍未能从 detector 的浏览器输出解释，应保留为 detector 计数不一致。

各视图命中分布：

| 规则 | 桌面浅色 | 深色 HUD | 375px | 归因与判定 |
|---|---:|---:|---:|---|
| `line-length` | 17 | 17 | 0 | 命中 VitePress 文档 `p` / `li`，包括示例说明，不是组件源码命中。截图里的说明段落可读并正常换行，低优先级文档排版提示。 |
| `buried-raster` | 3 | 3 | 3 | 命中文档代码块 `button.copy`；截图中代码折叠，隐藏复制图标属于 hover 控件，按当前画面属于文档壳层提示。 |
| `clipped-overflow-container` | 1 | 1 | 2 | 一条命中 `div#lx-transfer-panel-161-source-panel.lx-transfer-panel__panel`，截图确有组件面板边框标记。源码 `linkx-fe/src/components/LxTransferPanel/index.vue` 的 `.lx-transfer-panel__panel` 设 `overflow: hidden`，其 header 内的 `.lx-transfer-panel__scope-action-content` 是绝对定位菜单。菜单在截图中关闭，因此已证实的是结构风险，是否实际裁切仍需打开菜单到边界复核。另一条 375px 命中 `span.container`，归属 VitePress 外壳。 |
| `edge-flush-cards` | 1 | 1 | 0 | 命中文档 `table` 的 11 个单元格，属于属性/说明表，不是穿梭面板卡片。 |
| `bounce-easing` | 1 | 1 | 1 | 目标是 `body`，命中 VitePress 全局外壳的弹性 easing。 |
| `layout-transition` | 1 | 1 | 1 | 目标是 `body`，命中 VitePress 全局高度与 padding 过渡。 |
| `ai-color-palette` | 0 | 161 | 0 | 深色模式报告 161 个通用 `span`，截图呈现的是主题选中态和文档代码/强调色；它不等于 161 个独立组件问题，属于高重复候选，需逐节点核对后再当作缺陷。 |
| `text-occlusion` | 0 | 0 | 5 | 命中“加载中”“加载失败”“最多 5 项”“HUD 深色主题”“提供继承说明”等 Demo 状态/主题控件。截图里的“示例状态与主题” disclosure 是关闭状态，当前组件可见区域的文本没有被覆盖；这些命中更像扫描了折叠 Demo 内容。 |

静态 `[]` 与运行时有命中并不冲突：前者扫描一个 `.vue` 源文件，后者扫描整个渲染页 DOM，包含 VitePress 壳层、Demo、文档表格、折叠内容及视口外节点。除组件面板 overflow 结构风险外，运行时大部分命中属于 Demo 或文档壳层。窄屏截图中焦点环清晰，组件与 document 均无横向溢出；截图显示面板会在页面纵向延伸，属于正常滚动，不是 viewport 横向溢出。

浏览器还记录到一条不带 URL 的普通资源 404；`/detect.js` 自身 HTTP 200 且 load 成功，这条 404 不影响 overlay 验证。

## 启停与预览保全

本次 detector live-server 在系统临时目录启动，端口 `8400`，启动命令 exit `0`。停止命令 exit `0`，输出 `Stopped live server on port 8400.`；stderr 有 `config_missing`，因为隔离临时目录没有 live 模式配置，且没有托管的 `live.js` 标签可移除。随后 GET detector 端口失败，确认端口已释放；临时 server root 与 Chromium profile 均已清理。原有 `4177` 路由结束后仍返回 HTTP `200`，未启动或停止该预览。

工作区状态显示目标组件文件原本为 modified；本次未编辑源码或项目文档，扫描评估的是当前工作区字节。

## 证据文件

- 静态扫描：`detector-command.txt`、`detector-stdout.json`、`detector-stderr.log`、`detector-exit-code.txt`；无效首跑另存为 `detector-attempt-1-*`。
- 浏览器原始记录与规则整理：`browser-evidence.json`、`browser-console.log`、`browser-rule-summary.json`、`detector-asset-http.json`。
- 浏览器脚本：`run-browser.mjs`、`summarize-browser.mjs`；静态扫描脚本：`run-static.mjs`。
- 桌面浅色截图：[desktop-light-before-overlay.png](desktop-light-before-overlay.png)、[desktop-light-overlay.png](desktop-light-overlay.png)。
- 深色 HUD 截图：[dark-hud-before-overlay.png](dark-hud-before-overlay.png)、[dark-hud-overlay.png](dark-hud-overlay.png)。
- 375px 焦点与减少动效截图：[mobile-375-keyboard-reduced-motion-before-overlay.png](mobile-375-keyboard-reduced-motion-before-overlay.png)、[mobile-375-keyboard-reduced-motion-overlay.png](mobile-375-keyboard-reduced-motion-overlay.png)。
- 服务启停和端口验证：`live-server-start.*`、`live-server-stop.*`、`live-server-port-cleanup.json`、`chromium-launch.command.txt`。
