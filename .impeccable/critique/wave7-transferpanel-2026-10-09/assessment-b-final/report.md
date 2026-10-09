Method: Assessment B（独立子 Agent；未读取 Assessment A、设计评审或代码复审报告）

# LxTransferPanel Assessment B

评估目标为 `http://127.0.0.1:4174/components/lxtransferpanel`，静态目标为 `linkx-fe/src/components/LxTransferPanel/index.vue` 与 `linkx-fe/src/components/LxTransferPanel/demo/basic.vue`。本报告只记录 detector 与浏览器证据，不替代 Assessment A 的设计判断。

## 静态 Detector

两个 Vue 文件分别运行了以下命令。对应 stdout 文件保留原始 JSON（`[]` 加换行），stderr 为空，退出码为 0。

| 目标 | 命令 | JSON stdout | stderr | 退出码 |
| --- | --- | --- | --- | --- |
| 组件 | `node "C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs" --json "linkx-fe/src/components/LxTransferPanel/index.vue"` | `[]` | 空 | 0 |
| Demo | `node "C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs" --json "linkx-fe/src/components/LxTransferPanel/demo/basic.vue"` | `[]` | 空 | 0 |

`[]` 只表示各自目标文件对应的静态规则零命中，不表示运行页面没有问题，也不代表浏览器 Critique 通过。每条命令、原始 stdout、stderr、退出码及解析摘要分别保存在 `detector/` 下的 sidecar 文件中。

## 源码指纹

| 文件 | 开始 SHA-256 | 结束 SHA-256 | 结果 |
| --- | --- | --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `1f25cda89c6ebf235957a68c4b140d9e1cef0eac7ce8e60f258b8b47a34b8555` | `1f25cda89c6ebf235957a68c4b140d9e1cef0eac7ce8e60f258b8b47a34b8555` | 未变化 |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `0be694a2ebb457b10872441fa986606335d229d9b953bf7771b99f587836e054` | `0be694a2ebb457b10872441fa986606335d229d9b953bf7771b99f587836e054` | 未变化 |

前后指纹原件位于 `source-sha256-before.json` 与 `source-sha256-after.json`。本次没有改动目标源码。

## 浏览器证据

使用独立的 headless Chrome 临时配置、新建 browser context 和 page。页面变更预检通过：标题设为 `[Human] LxTransferPanel Assessment B`，动态 script 节点成功追加并执行标记代码。随后启动 Impeccable live-server，`http://localhost:8400/detect.js` 的 `onload` 成功，脚本节点仍在页面中，server health 返回 200。浏览器 console 报告 `[impeccable] 25 anti-patterns found`；没有 JavaScript exception。另有一个 VitePress `favicon.ico` 404，不影响目标页加载。

Assessment 自行启动的 live-server 已通过 `node "C:/Users/Administrator/.codex/skills/impeccable/scripts/live-server.mjs" stop --keep-inject` 停止，退出码 0；随后 `/health` 不可达，4174 预览仍返回 HTTP 200。启动/停止命令、脱敏 stdout、stderr 和退出码保存在 `live-server-start.*` 与 `live-server-stop.*`。浏览器使用 headless context，因此 overlay 出现在证据截图中，没有声称它留在用户可见的浏览器标签页。

| 截图 | 证据状态 |
| --- | --- |
| `browser/screenshots/01-desktop-default-overlay.png` | 1440×1050；默认面板 computed height 与 `--lx-transfer-panel-height` 都是 300px；桌面 document 横向溢出为 0。 |
| `browser/screenshots/02-long-name-expanded.png` | 1440×1050；页面没有生成目标名称的 `<details>` disclosure，截图不能证明名称已展开。 |
| `browser/screenshots/03-more-reverse-options-expanded.png` | 1440×1050；“更多反选选项”内容已显示；展开是键盘尝试后由脚本设置 `details.open`，不是键盘成功的证据。 |
| `browser/screenshots/04-hud-dark-theme.png` | 1440×1050；预览使用 `lx-theme-hud`，computed 背景色为 `rgb(11, 18, 32)`。 |
| `browser/screenshots/05-mobile-390-selected-panel.png` | 图片为 390×844；窄屏切换器显示且已选面板被选中。 |

默认桌面下，前三个已选行高 32px，超长但未加载的历史授权行高 50.8px；选中列表可视高度约 131px、scrollHeight 199px，滚动提示已出现。窄屏截图对应的浏览器仿真中，普通行高约 54.8px，历史授权行高约 137.2px。

**Disclosure 与焦点边界：**样例里的超长项 `legacy-unit-08` 不在当前树中，实际以未加载行呈现并换行；DOM 没有 `.lx-transfer-panel__selected-name-disclosure`，所以无法读取该 disclosure summary 的 computed margin，也没有完成名称展开验证。“更多反选选项” summary 的 computed margin 是 `0px`。程序将焦点放到了该 summary，但 CDP Enter 后 `details.open` 仍为 false；之后为采集展开态截图才设置 `open=true`。因此本次没有确认这两个 disclosure 的真实键盘展开行为。相关 DOM 和键盘记录位于 `browser/desktop-default.json`、`browser/long-name-expanded.json`、`browser/reverse-options-expanded.json` 与 `browser/browser-evidence.json`。

**390px 页面宽度边界：**截图像素尺寸为 390×844，但首轮 mobile emulation 的 DOM 值是 `documentElement.clientWidth=390`、`scrollWidth=539`，页面级横向溢出 149px；`window.innerWidth` 同时为 539，说明布局视口与截图视口映射不一致。组件及 demo 本身宽 342px，穿梭面板内部宽度没有横向溢出。测量发生在 overlay 注入之后，首轮没有保存注入前基线，也没有记录造成超宽的节点，因此不能确认 149px 是 VitePress 页面壳层溢出还是 overlay 定位节点造成；不能据此归咎于 LxTransferPanel。

## Overlay 命中归因

浏览器扫描的 25 个命中是整张 VitePress 页面结果，不是两个 Vue 文件的静态扫描结果，也不能按命中总数当作缺陷数。

- **实际组件：**1 个 `gpt-thin-border-wide-shadow` 命中 `.lx-transfer-panel__scope-action-content`。该弹出层有 1px 边框和 `var(--lx-shadow-pop)` 阴影，是更多反选选项的浮层外观；按当前组件结构和设计 token 视为有依据的启发式命中。
- **文档控件：**3 个 `buried-raster` 命中 `button.copy`，对应文档代码块复制控件；1 个 `edge-flush-cards` 命中 Props API `table`，属于文档表格，不属于穿梭面板。窄屏表格由自身横向滚动承载。
- **页面级样式：**`bounce-easing` 与 `layout-transition` 各 1 个，命中目标都是 `body`；只能归为页面级/全局样式信号，不能归给组件。
- **文本行长：**18 个 `line-length` 命中落在 `<p>` 与 `<li>`，console 文本报告约 106–108 字符/行。首轮 evidence 保留了标签和规则描述，但没有保存各节点的完整 selector/祖先链；截图可见文档说明段落和 API 表格区域有标注，无法逐一核实这 18 项中每个 `<li>` 的准确所属。它们不作为已确认的组件缺陷。

## 未完成项

Assessment B 已完成静态扫描、overlay 注入与停止、默认桌面、反选展开、HUD 深色和 390×844 图片证据。长名称 disclosure 展开、该 disclosure summary 的 margin、两项键盘展开，以及移动页 149px 溢出的具体所有者没有得到可靠确认，以上均未标记为通过。证据目录没有修复建议复验，因为本任务要求只做独立评估且不改源码。
