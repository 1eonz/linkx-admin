Method: Assessment B 独立执行（只采集静态 detector 与浏览器证据；未读取 Assessment A 的目录、报告、截图或交互证据）

# LxDynamicForm Assessment B

目标：`http://127.0.0.1:4174/components/lxdynamicform.html`，本次冻结版本含字段类型分组。

## 冻结与静态扫描

冻结清单共 39 个文件。扫描前与扫描后均核验 39 个 SHA-256，均完全匹配，无缺失或不一致；结果分别保存在 `hash-before.json` 和 `hash-after.json`。

冻结清单中的 19 个 `.vue` 文件逐一运行 Impeccable detector。19 份 stdout 均为有效 JSON `[]`，stderr 均为空，进程退出码均为 0。这表示本次 Vue 静态扫描零命中，不代表运行页面无问题。逐文件原始 stdout、stderr、退出码、解析摘要见 `detector-results/`，索引见 `detector-summary.json`。

detector 支持 `.ts`，因此冻结清单内 12 个 `.ts` 文件也逐一扫描；12 份输出同样为有效 JSON `[]`、空 stderr、退出码 0，详见 `typescript-detector-summary.json` 及对应逐文件目录。冻结清单有 4 个 `.md` 文件，但 `.md` 不在 detector 的 `SCANNABLE_EXTENSIONS` 中，未扫描。清单另有 4 个 `.css` 文件；虽然扩展注册表识别 `.css`，Critique 指令要求不要将 CSS-only 文件作为 CLI target，因此未扫描。

## 浏览器证据

新建 Playwright context/page 后，页面 `document.title` 修改成功，内联 `<script>` 插入并执行成功，证明注入能力可用。预检记录在 `preflight.json`，截图在 `preflight.png`。随后每种视图均创建独立 context 和 page，向目标页注入 `http://localhost:8400/detect.js`，等待 3 秒后采集 console、页面错误、失败请求、HTTP 错误、selector 和 overlay。

| 视图 | 页面状态 | Detector 结果 | Overlay | Console / 页面错误 |
|---|---|---:|---:|---|
| 亮色桌面，1440×1000 | 200，亮色 | 16 组 / 17 条 finding | 16 个，12 个可见 | `[impeccable] 16 anti-patterns found`；无 pageerror、失败请求或 HTTP 错误 |
| 深色/HUD，1440×1000 | 200，`html.dark`，背景 `rgb(27, 27, 31)` | 332 组 / 333 条 finding | 331 个，24 个可见 | `[impeccable] 331 anti-patterns found`；无 pageerror、失败请求或 HTTP 错误 |
| 375px 触屏，375×812、`hasTouch=true` | 200，亮色 | 10 组 / 11 条 finding | 10 个，6 个可见 | `[impeccable] 10 anti-patterns found`；无 pageerror、失败请求或 HTTP 错误 |

完整浏览器事件和 findings 在 `browser-summary.json` 与 `browser/<view>/evidence.json`。每个 overlay 已映射到检测 selector；body 级横幅对应 `body` finding。每组 target 的实际 class、祖先链、可见性和计算样式见 `browser/<view>/selector-context.json`。逐条 overlay 归因及按规则/节点/祖先链聚合见 `overlay-attribution.json`。

三种视图截图：亮色桌面 [viewport](browser/desktop-light/desktop-light-viewport.png)、深色/HUD [viewport](browser/dark-hud/dark-hud-viewport.png)、375px 触屏 [viewport](browser/mobile-375-touch/mobile-375-touch-viewport.png)。相应完整页截图也保存在各自的 `browser/<view>/` 目录。

## 归因与范围

- 深色视图 315 条 `ai-color-palette` 命中都落在 `pre.shiki.shiki-themes...vp-code` 下的语法高亮 `span`，示例 token 为 `setup`、`lang`、`ref`，计算颜色为 `rgb(179, 146, 240)`。这属于文档代码主题，不是表单控件配色；对 LxDynamicForm 组件审查应视为文档壳层误报。完整 selector 和祖先链已保存。
- 三个视图反复命中的 `buried-raster` 指向 VitePress `button.copy`。selector context 显示其背景图是内联 SVG 复制图标，静止态 opacity 为 0；它是文档代码块复制控件的预期状态，不是表单字段里的不可见产品图片。
- `gpt-thin-border-wide-shadow` 指向 `.el-popper.is-pure.is-light.el-tooltip.el-select__popper.lx-select__popper`。命中节点在采集时均不可见，边界框为 0×0；记录为隐藏 popper 的静态候选，不作为当前截图中的可见问题。三个代表 ID 为 `#el-id-1024-5`、`#el-id-1024-10`、`#el-id-1024-15`。
- 深色视图唯一未能在干净页面复现的 selector 为 `div:nth-of-type(8) > div > span`，finding 文本是 `span "✦ ai color palette" is 100% covered by overlapping text (span)`。同一视图的截图中能看到 detector 自己插入的 `✦ ai color palette` overlay 标签；该 selector 在未注入 detector 的新页面中匹配数为 0。明确归因为 detector overlay 自指产生的 `text-occlusion` 误报，不归于产品源码。
- `bounce-easing` 与 `layout-transition` 归在 `body` 级 VitePress 页面 shell。375px 视图的 `clipped-overflow-container` selector 是导航汉堡按钮 `.VPNavBarHamburger` 内的 `span.container`，属于 VitePress 文档导航，不是动态表单字段。
- 375px 触屏视图的 visual viewport 为 375px，但 `documentElement.scrollWidth=615`、`clientWidth=375`，记录到 240px 水平溢出；页面布局 `innerWidth` 为 615px。该值保存在浏览器证据中，供综合评估确认其属于当前 docs shell 还是组件展示区。

## 服务与工作区

临时 Impeccable live server 使用 `assessment-b/live-server-work-374f61fcc05e4b87999b872aa6f0896c/` 作为工作目录，端口 8400；启动 stdout 中的 token 已脱敏。通过该目录执行 stop，退出码 0，端口监听已清空；临时目录只剩用于隔离 root 的 `vite.config.mjs`。用户服务 4174 未停止，结束后目标页仍返回 200。清理证据见 `server-start.json`、`server-stop.json` 和 `service-cleanup-verification.json`。

本 Assessment B 未修改冻结源码。浏览器证据、静态日志、报告和临时服务目录均位于本 `assessment-b/` 目录。
