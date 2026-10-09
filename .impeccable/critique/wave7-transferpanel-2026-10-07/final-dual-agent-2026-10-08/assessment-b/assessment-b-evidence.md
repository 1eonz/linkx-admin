# Wave 7 Assessment B 证据

采集日期：2026-10-08（Asia/Shanghai）  
范围：`linkx-fe/src/components/LxTransferPanel/`、`linkx-fe/src/components/LxVirtualTree/`，以及 VitePress 页面 `/components/lxtransferpanel.html`、`/components/lxvirtualtree.html`。未读取 Assessment A 或旧 Critique 报告；`.impeccable/critique/ignore.md` 不存在。

## 静态 Detector

| 目标 | JSON | 命中数 | stderr | 退出码 | 证据文件 |
|---|---|---:|---|---:|---|
| `LxTransferPanel` 源码目录 | 可解析，顶层为数组 `[]` | 0 | 空（0 bytes） | 0 | `detector-transferpanel.*` |
| `LxVirtualTree` 源码目录 | 可解析，顶层为数组 `[]` | 0 | 空（0 bytes） | 0 | `detector-virtualtree.*` |

各目标的精确命令和 cwd 记录在对应 `.command.txt`，原始 stdout 在 `.stdout.json`，stderr 与退出码分别在 `.stderr.txt`、`.exit-code.txt`，解析结果在 `.summary.json`。`[]` 仅表示静态规则零命中，不能单独视为设计验收通过。

## 浏览器与注入

- 使用独立 Edge `Edg/154.0.4258.53` 进程、临时 profile、新建 CDP `BrowserContext` 和新页面；未复用用户 tab。没有可用的 Codex 原生浏览器自动化接口，因此页面以 headless 方式检查，`[Human]` 标题前缀和 overlay 保存在截图中，没有呈现在 Codex 的可见 Human tab。
- 首页 mutation preflight 成功：`document.title` 可写、`<script>` 可追加、内联探针执行为 `true`。结果见 `browser-evidence.json` 的 `mutationPreflight`。
- 本次 live server 命令、端口/PID（控制 token 已脱敏）、stderr 和退出码见 `live-server-start.*`。`/detect.js` 返回 HTTP 200；两个页面的 detector script 都报告 `loaded`，未见浏览器 runtime exception。
- **有效页面证据只来自 `http://localhost:4174`。** 5173 和临时 5174 探测服务已停止，不纳入结果。4174 是既有预览服务，本评估未停止它。

| 页面 | HTTP | 页面标题 | 主标题与 Demo | Detector console 摘要 | 截图 |
|---|---:|---|---|---|---|
| `http://localhost:4174/components/lxtransferpanel.html` | 200 | `[Human] LxTransferPanel 双栏穿梭 \| LxUI` | 标题匹配；首屏可见双栏树与已选项 Demo | `[impeccable] 19 anti-patterns found`；DOM 中记录 19 个 overlay 项 | `lxtransferpanel-overlay.png` |
| `http://localhost:4174/components/lxvirtualtree.html` | 200 | `[Human] LxVirtualTree 虚拟树 \| LxUI` | 标题匹配；首屏可见树 Demo、搜索与节点 | `[impeccable] 8 anti-patterns found`；DOM 中记录 8 个 overlay 项 | `lxvirtualtree-overlay.png` |

两页的实际 h1、response status、标题、console 摘要、overlay DOM 标签和网络响应都记录在 `browser-evidence.json`。截图复核确认 detector 的黄色摘要条和目标标记确实绘制在页面上；DOM 可见状态辅助计数与截图不完全一致，因此不把该辅助计数当作“可见 overlay 数”。

## 误报复核

- `button.copy` 上的 `raster buried under a wash or opacity`、代码块 `span.lang` 上的 `text occluded by an overlapping element`，以及 API 参考 `<table>` 上的 `cards flush against the scroller edge` 都指向 VitePress 文档壳层元素，不是 LxTransferPanel/LxVirtualTree 的交互控件；当前视口截图未见这些位置造成可观察的组件问题，归为文档框架误报。
- 多个 `line length too long` 命中长篇中文说明段落或列表。浏览器中段落正常换行，没有对应的水平溢出；这条规则对文档正文属于布局误报，但内容密度仍可由设计评审判断。
- LxTransferPanel 的 `tiny body text` 命中 `.lx-transfer-panel__scope-hint`，属于组件提示文案，不能按文档壳层误报排除；保留为需设计评审判断的信号。
- `bounce or elastic easing` 与 `layout property animation` 是页面级提示，没有具体目标元素。对目标源码和 `docs/.vitepress` 的精确 CSS 字符串检索无匹配，无法归因到这两个组件；记为未确认的文档/运行时信号，不计作组件缺陷。

停止命令记录在 `live-server-stop.command.txt`；退出码为 0，stdout 为 `Stopped live server on port 8400.`，stderr 为空。结束时 8400 已关闭，4174 仍在监听。
