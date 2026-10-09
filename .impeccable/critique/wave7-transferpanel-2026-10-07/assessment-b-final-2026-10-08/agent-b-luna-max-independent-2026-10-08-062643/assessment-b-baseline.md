# Assessment B：Wave 7 修复前基线

**结论：仅供修复前对照，本报告不是最终版验收，也不能据此标记 Critique 通过。** 本评估独立执行，只读取指定范围的目标源码、Demo、两份中文文档及 Impeccable 工具说明；没有读取 Assessment A、代码审查报告或任何其他 Assessment A/B 输出。用户要求由 gpt-6-luna/max 执行；本次 Assessment B 子任务在分配给我的运行模型上完成，配置差异应由主任务记录。

## 静态 detector

五个目标文件逐个运行 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json <target>`。每次的完整命令、原始 stdout JSON、stderr 和退出码均在证据目录中分别保存。

| Target | stdout JSON | stderr | exit |
| --- | --- | --- | --- |
| `linkx-fe/src/components/LxVirtualTree/index.vue` | `[]` | 空 | 0 |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `[]` | 空 | 0 |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `[]` | 空 | 0 |
| `linkx-fe/docs/components/lxtransferpanel.md` | `[]` | 空 | 0 |
| `linkx-fe/docs/components/lxvirtualtree.md` | `[]` | 空 | 0 |

这只表示这些目标的静态 detector 规则没有命中，不表示运行页面没有问题，也不等于正式 Critique 通过。

## 浏览器证据

本次用独立 headless Chromium/Edge 154.0.4258.53 会话，经 CDP 新建每个页面；注入前通过设置标题并追加 DOM meta 节点确认可变注入可用。五个 TransferPanel 状态/主题页面和独立 VirtualTree 文档页共 6 页，均成功注入 `http://127.0.0.1:8417/detect.js`，并产生 `[impeccable] ... anti-patterns found` console 输出。成功运行的命令、exit 0 和空 stderr 见 `browser-capture-final.*`；完整 DOM 指标、console、异常、命中规则、交互结果和截图文件名见 `browser-evidence.json`。

| View | Overlay | 关键结果 |
| --- | --- | --- |
| 1280×900 TransferPanel light | 19 条 overlay 记录 | 组件本身宽 705、`scrollWidth=705`；document/body 均无横向溢出。DEPT-03 搜索命中目标部门和一个已选回显项。 |
| 1280×900 TransferPanel dark | 209 条 overlay 记录 | 组件宽 705，document/body 无横向溢出。 |
| 1280×900 TransferPanel HUD | 242 条 overlay 记录 | HUD 令牌触发大量颜色规则标签；组件宽 705，document/body 无横向溢出。 |
| 375×812 TransferPanel empty | 5 条 overlay 记录 | 空树恢复正常数据成功；组件宽 312、无自身横向溢出。document scrollWidth 600，body 为 360，`.vp-doc` scrollWidth 336 / clientWidth 312。 |
| 320×812 TransferPanel error | 5 条 overlay 记录 | 错误提示与禁用面板可见，重试恢复成功；组件宽 272、无自身横向溢出。document scrollWidth 560，body 为 320，`.vp-doc` scrollWidth 296 / clientWidth 272。 |
| 1280×900 VirtualTree 文档 | 7 条 overlay 记录 | 文档单独新页面打开并成功注入；标题正确，渲染 1 棵树，document/body scrollWidth 均为 1265。 |

在 375px 和 320px 两种窄屏：复选框触控层均为 44×44px、视觉框 24×24px、展开按钮 44×44px；触控区之间有 4px 间隔，无重叠。实际触摸能够收起及重新展开根节点，并勾选子节点。禁用节点带 `aria-disabled="true"` 且 checkbox 为 disabled。搜索 `DEPT-03` 显示一个真实树节点命中并保留机构祖先行，筛选状态报告 `筛选结果已全部选择，共 1 项`；第二个同编码 DOM 节点是已选列表回显，不是重复树结果。

窄屏截图能看到文档页面的横向滚动条，`document.documentElement.scrollWidth` 明显高于请求视口宽度；TransferPanel 组件自己的 `clientWidth` 与 `scrollWidth` 相等，因此当前证据把溢出定位在文档根/内容区域，不能归因于组件容器。文档外壳仍有 24px 的 `.vp-doc` 内容溢出，overlay 与长文档代码表格可能参与根溢出；具体超宽元素来源尚未在本轮 DOM 中逐节点定位。最终浏览器运行无未捕获 JS 异常；light 页面记录到一次未解析来源的 404 资源错误。

## Overlay 归因

overlay 的总命中数量包含重复元素，不能直接等同缺陷数。静态 detector 与浏览器 overlay 是不同信号；逐项检查之后的归因如下：

| Rule / target | 归因 |
| --- | --- |
| `line-length`（文档 `p`、`li`） | Markdown 示例说明、API 和规则长文本触发；是文档可读性提示，需结合实际阅读版面判断。 |
| `buried-raster`（`button.copy`） | VitePress 代码块复制按钮图标，不是 TransferPanel 业务操作。 |
| `edge-flush-cards`（`table`） | 两份文档的 API Markdown 表格，不是组件内数据卡片。 |
| `first-viewport-column-overflow`（`section.lx-transfer-panel`） | 规则把 380px 面板高度与文档正文长内容一起计算；组件内列宽正常，但需要结合文档首屏上下文复核。 |
| `first-viewport-column-overflow`（VirtualTree 文档 `div.container`） | VitePress 文档容器，不是 Vue 组件。 |
| `clipped-overflow-container`（窄屏 `span.container`） | VitePress 全站外层容器命中；组件树触控区未重叠，目标不在组件 DOM 内。 |
| `bounce-easing`、`layout-transition`（`body`） | 文档站全局 CSS 的动画/过渡命中，不在两个目标组件样式中。 |
| `ai-color-palette` | VitePress 默认暗色主题的品牌紫色在 `.dark` 页面触发大量 span；HUD 主题额外命中组件的 sky-blue 主题令牌及其行、图标和状态标签。这些值来自已登记的 HUD 设计 token，规则名称本身不证明令牌选择有问题。 |

## 执行边界与限制

- 第一轮 PowerShell 启动 Chromium 时含空格的可执行文件路径被拆开，9337/9338 CDP 初始化失败；失败 stderr 与 partial JSON 保留。后续改为直接 Node 启动，正式 capture exit 0，临时 profile 清理成功。
- 一轮浏览器脚本错误地让 VirtualTree 文档等待 TransferPanel 的状态控件，导致该页超时；最终成功轮等待 `.vp-doc` 并独立打开 VirtualTree 文档，记录标题、树数量、DOM 宽度、overlay、console 和截图。
- 服务启动期间 4184 和 8417 仅供本次独立 Assessment B 使用。停止命令成功，端口核验无本次服务残留；4174 未被本次服务监听。启动/停止命令、PID 和验证见 `vitepress.*`、`overlay-server.*`、`server-shutdown-verification.json`。
- 这份 B 仅作修复前基线，没有 Assessment A 的独立视觉判断，也未生成综合评分或正式趋势快照。源码冻结后仍需对最终版重新执行隔离的 A/B，并在综合时逐条核对命中与建议。
