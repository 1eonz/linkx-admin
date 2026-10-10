# Assessment B：Detector 与浏览器证据

本报告只记录 Assessment B 的静态扫描和浏览器证据，未读取 Assessment A 文件或其结论；它不是最终综合 Critique。

## 目标与源码版本

- 组件：`linkx-fe/src/components/LxTransferPanel/index.vue`
- Demo：`linkx-fe/src/components/LxTransferPanel/demo/basic.vue`
- 文档：`linkx-fe/docs/components/lxtransferpanel.md`
- 浏览器目标：`http://127.0.0.1:43620/components/lxtransferpanel`

以下 SHA-256 是本次复核时目标源码的当前哈希：

| 目标                                                     | SHA-256                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| `linkx-fe/src/components/LxTransferPanel/index.vue`      | `664D2A40474AB9C19C1C529D32EB8F7D86BB336C4ABB2DC6B13EB5030C3BC0B3` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `E52C441C3514299DCF9CA52AD49B1D990D1CEF28E40613A40803941A0D2FA823` |
| `linkx-fe/docs/components/lxtransferpanel.md`            | `4F5BDB6BB993F7BD65FC51201E3CA91BB7B16B6AC7795FC0DA98542CC928F5D5` |

## 静态 Detector

三次 `detect.mjs --json` 均成功：JSON 为 `[]`、stderr 为空、退出码为 `0`。这只表示这些静态目标没有命中 Detector 规则，不代表运行页面没有问题。

| 目标 | JSON                                    | stderr                                | exit code                                |
| ---- | --------------------------------------- | ------------------------------------- | ---------------------------------------- |
| 组件 | `detector-component.stdout.json` (`[]`) | `detector-component.stderr.txt`（空） | `detector-component.exit-code.txt` (`0`) |
| Demo | `detector-demo.stdout.json` (`[]`)      | `detector-demo.stderr.txt`（空）      | `detector-demo.exit-code.txt` (`0`)      |
| 文档 | `detector-docs.stdout.json` (`[]`)      | `detector-docs.stderr.txt`（空）      | `detector-docs.exit-code.txt` (`0`)      |

## 浏览器结果

隔离 Chrome 的可变注入预检通过：页面标题可变更，脚本节点可插入并执行。随后从 `http://localhost:8400/detect.js` 注入官方 Detector，script `load` 事件成功；控制台出现 `[impeccable] 28 anti-patterns found`，用户可见标注截图已保存。覆盖桌面亮色/HUD 和 320px CSS 视口亮色/HUD。

### 窄屏根宽度归因

320×900 CSS 视口的 `visualViewport.width` 为 305px（含浏览器滚动条影响）。无 overlay 时，`documentElement` 与 `body` 均为 `clientWidth/scrollWidth = 305/305`；`.vp-doc`、Demo、预览和 `.lx-transfer-panel` 均为 `257/257`。Props 表自身是 `overflow-x:auto`，宽度为 `client/scroll = 257/997`，横向滚动局限在表格内。桌面 1280×900 CSS 视口下，文档根宽度为 `1265/1265`，Demo 组件宽 705px。

注入后，移动视口 `documentElement` 变为 `305/545`，而 `body` 仍为 `305/305`，`.vp-doc`、Demo、预览及组件宽度均未改变。定位到 Detector 自身 `.impeccable-label` 的 bounds 为 `left=261, right=545`（宽 284px）；该标注使根滚动宽度增加 240px。通过移除本次 MutationObserver 记录的 8 个 Detector 注入节点（script、style 和标注层），再次测得根宽度回到 `305/305`，且无剩余 Impeccable 标记节点。由注入前、注入后、移除后的三次测量可确认：这次横向滚动差异由可见 Detector 标注层造成，不是产品页面溢出。

数据保存在 `browser-overlay-bounds.json`，页面窄屏结构数据保存在 `browser-narrow-probe.json`。

### Overlay 命中分类

控制台分组标题报告 28 项；归档的逐条 console log 按规则计数为 29 条。原始记录保留在 `browser-overlay.json`，该数量不一致未被静默归一；以下按逐条日志分类，因此总数为 29。

| 规则                                 | 日志数 | 归因                                                                                                                                                                                                                                                                 |
| ------------------------------------ | -----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `line-length`                        |     19 | 目标是文档中的段落和列表项，不是组件节点。文档为中文，规则按字符数估算行长；截图中正文仍在受限文档列内。记录为文档可读性提示，不能据此认定 19 个组件缺陷。                                                                                                           |
| `buried-raster`                      |      3 | 命中 VitePress 文档代码块的 `button.copy`，属于文档外壳的复制控件，不属于穿梭组件。                                                                                                                                                                                  |
| `edge-flush-cards`                   |      1 | 命中 Props API 表格；11 个单元格使用紧邻的表格网格边界，不是独立卡片堆叠。                                                                                                                                                                                           |
| `text-occlusion`                     |      2 | 命中 Demo 中“空结果”和“加载中”按钮。按钮位于默认关闭的 `<details>`；关闭时按钮没有可见文本，Detector 的几何命中点落在高度 `<select>` 上。展开 details 后，按钮中心命中各自的 `BUTTON`，按钮位于 y=388–480，select 位于 y=604–634，互不重叠。属于折叠内容的检测误报。 |
| `text-overflow`                      |      1 | 命中组件源标题。桌面标题 `scrollWidth=176`、`clientWidth=144`，CSS 明确使用 `overflow:hidden` 和 `text-overflow:ellipsis`，且 `title` 保留完整文本；320px 视口标题为 `231/231`。这是受限标题行的预期省略，不是页面根溢出。                                           |
| `gpt-thin-border-wide-shadow`        |      1 | 命中组件的反选操作面板，该面板使用库令牌 `--lx-shadow-pop`（定义为 16px blur），用于 popover 表面；属于令牌命中，不能仅按命中数量视为缺陷。面板收起时不显示。                                                                                                        |
| `bounce-easing`、`layout-transition` |   各 1 | 命中全局 `body`，是文档/演示外壳级样式，不是 `LxTransferPanel` 选择逻辑。B 记录其位置，不将其归为组件缺陷；减少动效行为留待整页审查确认。                                                                                                                            |

额外观察：窄屏树行内长编码会被限宽截断，例如 `DEPT-03` 在 320px 视口为 `47/53`，桌面为 `53/53`；编码元素保留完整 `title` 值。窄屏 Props 表按自身容器横向滚动，页面根宽度不增加。

## 截图与原始证据

截图文件和对应视图列于 [screenshot-index.md](screenshot-index.md)。预检、浏览器进程、Overlay console、根宽度测量及三目标 Detector 原始 stdout/stderr/退出码均保存在本目录。

## 清理

- 官方 live-server 停止后，端口 `8400` 拒绝 TCP 连接，PID `17332` 已退出；结果在 `live-server-stop.json`。
- 隔离 Chrome target/context 已关闭，PID `8204` 已退出；结果在 `browser-context-closed.json`。
- Assessment B 完成时 `43620` 仍监听；随后主 Agent 停止该预览服务，并在波次收尾复查时确认 `43620`、`8400` 均无监听。`4174` 当时已未监听，未对其执行操作或重启。
- stop helper 的退出码为 `0`、8400 端口已关闭，但 stderr 报告临时目录缺少 `.impeccable/live/config.json`，因此未能移除 live script tag。该警告原样保存在 `live-server-stop.json`；隔离浏览器随后关闭。该清理警告不改变端口关闭和本机浏览器 context 已关闭的复查结果。
