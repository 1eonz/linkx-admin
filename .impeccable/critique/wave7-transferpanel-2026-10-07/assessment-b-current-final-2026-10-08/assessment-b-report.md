# Wave 7 LxTransferPanel：Assessment B 当前工作树证据

执行方式：由独立子 Agent 执行 Assessment B；本报告只记录 detector 与浏览器证据。未读取 Assessment A 或任何综合报告。

## 范围与限制

- 静态目标：`linkx-fe/src/components/LxTransferPanel/index.vue`、`linkx-fe/src/components/LxTransferPanel/demo/basic.vue`、`linkx-fe/docs/components/lxtransferpanel.md`。
- 页面目标：`http://127.0.0.1:4174/components/lxtransferpanel`。
- 浏览器使用外部 Puppeteer 与本机 Google Chrome headless。每张视图均创建新的 BrowserContext 和 Page，并在 `newPage()` 后显式调用 `page.setViewport({ width, height })`。
- 原生浏览器标签工具不可用，因此 overlay 只在隔离的 headless 页面中注入；不声称用户的 `[Human]` 浏览器标签中存在 overlay。基础截图和注入后的 overlay 截图均保存在本目录。
- detector overlay 仅注入 6 个代表视图；其余 12 个视图保留基础截图，不把未注入状态写成 overlay 检查通过。
- demo 状态来自页面本地示例，不涉及真实后端。每个视图 `pageErrors` 与 `requestFailures` 均为 0。
- detector 规则数量在两次独立 HUD 页面注入间不完全稳定，且同一规则会标记一个树行的多个后代。规则数量不等于独立缺陷数。

## 静态 Detector

正确命令的逐次原始 stdout、stderr、退出码及命令行分别保存在同名 `detector-*.{command.txt,stdout.json,stderr.txt,exit-code.txt}` 文件中。

| 目标 | 命令结果 | 结论 |
|---|---|---|
| 组件 | `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "F:\work\linkx-admin\linkx-fe\src\components\LxTransferPanel\index.vue"`；stdout `[]`；stderr 空；真实退出码 0 | 有效静态扫描，无规则命中 |
| Demo | `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "F:\work\linkx-admin\linkx-fe\src\components\LxTransferPanel\demo\basic.vue"`；stdout `[]`；stderr 空；真实退出码 0 | 有效静态扫描，无规则命中 |
| 文档，首次路径错误 | 命令误写为 `F:\work\linkx-admin\linkx-fe\linkx-fe\docs\components\lxtransferpanel.md`；stdout `[]`；stderr `Warning: cannot access ...`；真实退出码 1 | 无效路径尝试，不能算扫描结果；原始失败证据保留在 `detector-docs.*` |
| 文档，正确路径重扫 | `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "F:\work\linkx-admin\linkx-fe\docs\components\lxtransferpanel.md"`；stdout `[]`；stderr 空；真实退出码 0 | 有效静态扫描，无规则命中 |

三个有效 `[]` 只表示这三个静态目标没有命中 detector 规则；它们不能单独证明页面设计或交互通过。

## 浏览器与注入

4174 恢复后，先用独立 Puppeteer context 确认目标页面返回 200、标题为 `LxTransferPanel 双栏穿梭 | LxUI`、`.transfer-panel-demo` 存在。每个页面通过真实 `<script src="http://localhost:8400/detect.js">` 加载 detector，等待 2.5 秒，读取 console 的 `[impeccable]` 输出与 overlay DOM。

突变预检的 `document.title` 修改、追加 `<script>` 和脚本执行标记均为 `true`。正式注入的 6 个新页面均为 `loaded`。第一次 capture runner 曾在 `networkidle2` 导航条件停住，在突变预检前被终止，没有视图结果；`browser-capture-attempt-2.failure.json` 和停止命令 sidecar 保留了原因与实际退出码。之后使用 `domcontentloaded` 加目标组件就绪检查重新完成正式采集。

## 视图截图索引

每行的基础 PNG 都在 `screenshots/` 中。`overlay` 列为实际注入结果和该次 capture 的 console 计数；“未注入”表示只有基础截图。所有基础截图拍摄前 document/body `scrollWidth` 均与 viewport 宽度一致。

| 视图 | viewport | 主题 / 状态 | 额外检查 | 基础 `scrollWidth` 文档/body | overlay 结果 | 截图 |
|---|---:|---|---|---:|---|---|
| 1440-light-normal | 1440×1000 | 浅色 / 正常，树 1,420 项 | 默认预选 4 项 | 1440 / 1440 | 已注入；console 15 条 anti-pattern 总数 | `1440-light-normal.png`、`1440-light-normal-overlay.png` |
| 1440-hud-normal | 1440×1000 | HUD / 正常，树 1,420 项 | 默认预选 4 项 | 1440 / 1440 | 已注入；首次 console 239，复注入 console 225 | `1440-hud-normal.png`、`1440-hud-normal-overlay.png` |
| 1440-light-empty | 1440×1000 | 浅色 / 空结果 | 待选树 0 项，原有已选 4 项保留 | 1440 / 1440 | 未注入 | `1440-light-empty.png` |
| 1440-light-error | 1440×1000 | 浅色 / 加载失败 | alert 显示“组织权限数据加载失败，当前选择仍然保留。重试”；截图可见错误条 | 1440 / 1440 | 未注入 | `1440-light-error.png` |
| 1440-light-reduced-motion | 1440×1000 | 浅色 / 正常 | `prefers-reduced-motion: reduce` 为 true；组件 computed transition/animation 均为 `0s` | 1440 / 1440 | 未注入 | `1440-light-reduced-motion.png` |
| 1440-light-keyboard | 1440×1000 | 浅色 / 正常 | Tab 后焦点在树 `treeitem`，outline 为 solid 2px | 1440 / 1440 | 未注入 | `1440-light-keyboard.png` |
| 375-light-normal | 375×844 | 浅色 / 正常，树 1,420 项 |  | 375 / 375 | 未注入 | `375-light-normal.png` |
| 375-hud-normal | 375×844 | HUD / 正常，树 1,420 项 |  | 375 / 375 | 未注入 | `375-hud-normal.png` |
| 375-light-empty | 375×844 | 浅色 / 空结果 | 面板显示“暂无数据”；原有已选项保留 | 375 / 375 | 已注入；console 9 条 anti-pattern 总数 | `375-light-empty.png`、`375-light-empty-overlay.png` |
| 375-light-error | 375×844 | 浅色 / 加载失败 | alert 存在于 DOM；当前视口截图显示禁用/降低透明度的面板，错误条在视口下方 | 375 / 375 | 已注入；console 5 条 anti-pattern 总数 | `375-light-error.png`、`375-light-error-overlay.png` |
| 375-light-reduced-motion | 375×844 | 浅色 / 正常 | `prefers-reduced-motion: reduce` 为 true；computed transition/animation 均为 `0s` | 375 / 375 | 未注入 | `375-light-reduced-motion.png` |
| 375-light-keyboard | 375×844 | 浅色 / 正常 | Tab 后树 `treeitem` 获焦，2px 实线焦点轮廓可见 | 375 / 375 | 未注入 | `375-light-keyboard.png` |
| 320-light-normal | 320×844 | 浅色 / 正常，树 1,420 项 |  | 320 / 320 | 已注入；console 9 条 anti-pattern 总数 | `320-light-normal.png`、`320-light-normal-overlay.png` |
| 320-hud-normal | 320×844 | HUD / 正常，树 1,420 项 |  | 320 / 320 | 未注入 | `320-hud-normal.png` |
| 320-hud-reduced-motion | 320×844 | HUD / 正常，树 1,420 项 | `prefers-reduced-motion: reduce` 为 true；computed transition/animation 均为 `0s` | 320 / 320 | 已注入；console 227 条 anti-pattern 总数 | `320-hud-reduced-motion.png`、`320-hud-reduced-motion-overlay.png` |
| 320-light-empty | 320×844 | 浅色 / 空结果 | 待选树 0 项，原有已选 4 项保留 | 320 / 320 | 未注入 | `320-light-empty.png` |
| 320-light-error | 320×844 | 浅色 / 加载失败 | alert 存在于 DOM；当前视口截图显示禁用/降低透明度的面板，错误条在视口下方 | 320 / 320 | 未注入 | `320-light-error.png` |
| 320-light-keyboard | 320×844 | 浅色 / 正常 | Tab 后树 `treeitem` 获焦，2px 实线焦点轮廓可见 | 320 / 320 | 未注入 | `320-light-keyboard.png` |

`browser-evidence.json` 保存每个视图的 viewport、截图前尺寸、状态、焦点、reduced-motion 值、请求失败与页面错误。`overlay-dom-evidence.json` 保存 6 次复注入的 console、banner、overlay 标签、矩形和目标节点样本。

## Overlay 目标与归因

| Detector 标签 | 可见目标节点 | 归因 |
|---|---|---|
| `ai color palette` | HUD 下 `.lx-virtual-tree__row`，并重复圈中其 checkbox、icon、label、code/status 后代 | 重复命中归为误报。组件按 `online / processing / busy / error / offline` 使用成功、主色、警告、错误、信息语义令牌，源码见 `index.vue` 状态样式约第 1303–1348 行；不是同一元素堆叠的任意色板。标记数量不能按节点后代数解释为缺陷数。 |
| `line length too long` | 文档示例说明段落“默认样例在本地生成 1,420 个树节点……”；页面节点为 `p:nth-of-type(2)`，对应文档约第 13 行 | 是文档内容的有效候选信号：1440 视口正文列宽约 884px，段落分两行；没有横向溢出或遮挡。中文行长阈值可能偏宽，需人工判断，不能直接当成已确认缺陷。相同标签也落在 `VPNavBarSearch` 等文档外壳节点，属范围外命中。 |
| `positioned child clipped by overflow container` | `#app ... .VPLocalNavOutlineDropdown`（VitePress“本页导航”） | 文档外壳节点，不是 TransferPanel；在滚动后处于屏幕上方，规则按绝对位置报出。截图中的导航控件仍可见，归为范围外/视口位置误报。 |
| `text occluded by an overlapping element` | VitePress `.VPLocalNav` 的菜单按钮等导航外壳节点；部分命中矩形为 0×0 | 隐藏或零尺寸的文档外壳节点，不能归为组件文本遮挡。 |
| `raster buried under a wash or opacity` | error 状态 `.transfer-panel-demo__surface.is-blocked` | 组件包裹示例按设计设置 `inert` 并降低透明度，同时在面板下显示明确错误和重试；这条规则把禁用状态误识别为 raster 被遮蔽。正常态的同标签命中 footer 也没有 raster 目标。 |
| `cards flush against the scroller edge` | `.vp-doc._components_lxtransferpanel` 文档内容容器 / Props 区域 | 容器里是文档正文与表格，并非重复卡片列表；截图中 TransferPanel 两侧面板之间有清楚留白。该命中对这个文档壳层目标不适用。 |
| `bounce or elastic easing` 与 `layout property animation` 顶部 banner | Banner 报告 `cubic-bezier(.71, -.46, .29, 1.46)`、`transition: height, padding-top, padding-bottom` | 这两段声明未出现在本次限定的三个目标源码中；证据只能确认 live page 检测到了声明，不能归到组件或文档目标。静态搜索未在三个目标内发现该曲线或该 transition。 |

overlay 注入后，1440 视图的 document/body 宽度仍为 1440/1440；375 视图变为 615/375，320 视图变为 560/320。两种移动 viewport 的基础截图在注入前均为 viewport 宽度。这个差值只在 detector 注入后出现，属于 overlay 页面证据的副作用，不能记作被测页面本身的横向溢出。

## 哈希与服务收尾

| 源文件 | 开始 SHA-256 | 结束 SHA-256 | 是否一致 |
|---|---|---|---|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `5B7894661907FA727987CA8647FE848CA2B796EF3667DD755AEE8659A9245F8F` | `5B7894661907FA727987CA8647FE848CA2B796EF3667DD755AEE8659A9245F8F` | 是 |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `641C38B92B957C2F0335D3939A2D09F953404DC4FE65C0CB605738298F90249B` | `641C38B92B957C2F0335D3939A2D09F953404DC4FE65C0CB605738298F90249B` | 是 |
| `linkx-fe/docs/components/lxtransferpanel.md` | `D456EE971747095267CBD434C1CD3DC9502DB30390AAF33824A8384DDD900CE6` | `D456EE971747095267CBD434C1CD3DC9502DB30390AAF33824A8384DDD900CE6` | 是 |

官方 `live-server.mjs --background --port=8400` 使用 PID 14272 启动。已执行 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" stop --keep-inject`，真实退出码 0；随后确认 8400 无 Listen socket。4174 未由本次任务停止或重启；收尾后 4174 页面经独立 Puppeteer context 再次返回 200，`.transfer-panel-demo` 存在，viewport/doc/body 为 1440/1440/1440。

所有命令原始输出、stderr、退出码、浏览器 JSON、截图、服务启动/停止记录和起止哈希 sidecar 均在本目录。没有修改组件、Demo、文档或测试文件。
