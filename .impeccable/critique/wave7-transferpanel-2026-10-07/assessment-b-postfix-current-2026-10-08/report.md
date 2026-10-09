# Wave 7 LxTransferPanel Assessment B

日期：2026-10-08。范围为当前修后源码的静态 detector 与文档预览页的浏览器 overlay 证据。本报告只记录 Assessment B，不读取 Assessment A 或代码复审报告，也不构成两项评估的综合 Critique。

## 结论

三个源码目标的静态 detector 均为有效扫描：stdout 是合法 JSON `[]`，stderr 为空，进程退出码为 0。`[]` 只表示这些源码文件没有命中 detector 的静态规则。

五个全新 Chrome 页面均通过 DOM 可变更预检，成功加载 `/detect.js`，并由 `window.impeccableScan()` 实际运行 detector、创建 overlay。截图和逐页 JSON 证据见 [evidence-index.md](browser/evidence-index.md)。

## 静态扫描

三个命令都使用 `node C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs --json <target>`，工作目录为 `F:/work/linkx-admin`。

| 目标 | stdout JSON | stderr | 退出码 | sidecar |
| --- | --- | --- | --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `[]` | 空 | 0 | [component](detector/component.command.txt) |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `[]` | 空 | 0 | [demo](detector/demo.command.txt) |
| `linkx-fe/docs/components/lxtransferpanel.md` | `[]` | 空 | 0 | [docs](detector/docs.command.txt) |

每个目标另有 `.stdout.json`、`.stderr.txt` 和 `.exit-code.txt`，作为该命令的独立原始记录。

## 浏览器证据

预览页 `http://127.0.0.1:4174/components/lxtransferpanel.html` 返回 HTTP 200。使用 headless Chrome 154 和 DevTools Protocol 创建五个新页面；每页将 title 改为 `[Human] Assessment B <case>` 并附加 script 节点，随后通过 detector script 的 `onload`、全局扫描函数和实际 overlay 节点确认注入与扫描成功。

| 视图 | 状态 / 主题 | detector overlay 数 | 注入前页面宽度 | 注入后页面宽度 | 面板横向溢出 |
| --- | --- | ---: | --- | --- | --- |
| 桌面 1440×1100 | 正常 / 浅色 | 36 | 1425 / 1425 | 1425 / 1425 | 否 |
| 窄屏 390×844 | 正常 / 浅色 | 5 | 390 / 390 | 390 / 630 | 否 |
| 桌面 1440×1100 | 空结果 / 浅色 | 36 | 1425 / 1425 | 1425 / 1425 | 否 |
| 窄屏 390×844 | 加载中 / HUD 深色 | 224 | 390 / 390 | 390 / 630 | 否 |
| 桌面 1440×1100 | 加载失败 / HUD 深色 | 239 | 1425 / 1425 | 1425 / 1425 | 否 |

宽度列按 `documentElement.clientWidth / scrollWidth` 记录。窄屏注入前无页面级横向溢出；注入后根节点宽度增加到 630px，但 `body.scrollWidth` 和穿梭面板宽度仍为 390px / 342px。该差异由 detector 自身页面级 banner 的布局引入，不能归因于产品页面。桌面与窄屏的面板本身均无横向溢出。

## 命中归因

- 浅色初始与空结果视图没有 overlay 指向 LxTransferPanel；命中指向 VitePress 文档内容、表格、代码示例和导航壳层。
- `line length too long` 命中中文说明段落和列表项。截图中这些中文内容按容器宽度自然换成多行；按字符总量触发的长度判断不代表界面出现单行横溢。
- `text occluded by an overlapping element` 指向 Shiki 代码块中的 `span`，其祖先是 `pre.shiki` 和收起的 `details` 示例区；属于代码/文档 DOM 的几何误报，不是穿梭面板文字重叠。
- `cards flush against the scroller edge` 的目标是 Markdown Props `table`，不是卡片组件。`raster buried under a wash or opacity` 的目标是 VitePress 代码围栏 `button.copy`。两者均不属于 LxTransferPanel。
- 窄屏 `positioned child clipped by overflow container` 的目标是 VitePress `span.container`，祖先为 `.VPNavBarHamburger`，目标在当前滚动位置上方（y=-378）；不属于面板。
- `bounce or elastic easing` 和 `layout property animation` 被合并显示在页面级 banner，console 目标为 `body`，属于文档预览外壳样式。
- HUD 深色视图中组件本身有 29 个 `ai color palette` 命中，目标为已选树行、复选框、图标和节点元数据。它们使用 `theme-hud.css` 定义的 `--lx-color-primary: #38bdf8`，与该文件声明的 HUD sky 主色一致；这是 detector 对既有设计令牌的命中，不能只按数量视为缺陷。额外约 189–190 个同类命中来自文档代码块里的 Shiki 语法着色文本。
- 页面每页先自动扫描、随后脚本显式调用一次扫描，因此 console transcript 中扫描摘要和逐项日志各出现两轮；表中 overlay 数取最终显式扫描后的 DOM 节点数。

## 源文件校验

SHA-256 修改前与修改后逐项一致；本次没有修改产品源码。

| 文件 | 修改前 | 修改后 |
| --- | --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `B168DEBA31A595473B9BD4DCEF524300CEC9F8361AA92E6094473FA362397D7D` | 相同 |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `641C38B92B957C2F0335D3939A2D09F953404DC4FE65C0CB605738298F90249B` | 相同 |
| `linkx-fe/docs/components/lxtransferpanel.md` | `C1D9C860B86A6B2205C35AE94CA2ABF89FC9611112483A571CBFBA2F806D6A30` | 相同 |

## 限制与清理

本环境未暴露可呈现的浏览器 GUI 或 Puppeteer 包；使用本机 Chrome 的 headless CDP 完成新页面、可变更注入、运行扫描和截图。浏览器截图可复查，但本次没有真实可见窗口中的人工交互检查。Assessment B 不替代独立 Assessment A，也不单独标记正式 Critique 通过。

临时 detector server 在隔离临时目录启动并已停止；Chrome 已通过 CDP `Browser.close` 关闭。对应命令、端口、PID、退出码和停止证据见 [session-lifecycle.md](browser/session-lifecycle.md)。原有文档预览服务 `4174` 未由本次任务启动或停止。

Questions skipped: Assessment B 子任务不处理后续设计选择；由父级综合评估提出下一步问题。
