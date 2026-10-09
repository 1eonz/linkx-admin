# Assessment B：Detector 与浏览器证据

目标页面：`http://127.0.0.1:4174/components/lxdynamicform.html`  
冻结清单：`source-hashes-freeze.json`，34 个文件  
浏览器自动化：Playwright（项目已安装的 `@playwright/test`）驱动系统 Edge `154.0.4258.53`；本环境没有可操作的原生 browser MCP。所有浏览器产物和临时服务状态均保存在本目录。

## 静态 Detector

冻结清单中有 18 个 `.vue` markup 文件；detector 的 `SCANNABLE_EXTENSIONS` 包含 `.vue`，不包含 `.md`，所以 3 个 Markdown 文档不作为 markup 扫描目标。`.ts` 与 `.css` 文件也不属于本轮 markup 目标。

对 18 个目标分别执行：

```text
node "C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs" --json "<frozen .vue file>"
```

18/18 个 stdout 都是有效 JSON 空数组 `[]`，stderr 均为空，进程退出码均为 `0`，静态规则命中数为 0。逐目标命令、stdout JSON、stderr 文件、退出码与解析结果见 `detector/summary.json`、`detector/records/` 和同目录的原始流文件。

这里的 `[]` 只表示这些 `.vue` 源文件未命中 detector 的静态规则，不代表运行页面无问题，也不构成 Critique 通过结论。

## 浏览器 Overlay

预检使用新 context/page 打开目标，HTTP 200；设置 `document.title` 成功，追加的内联 `<script>` 节点成功执行并写入 marker。预检通过后，在 `assessment-b` 工作目录启动 Impeccable live-server；每个代表视图使用独立的新 context/page，通过 `<script src="http://localhost:8400/detect.js">` 注入，并等待 2.5 秒读取 `[impeccable]` console 消息及页面 overlay。

| 视图 | 实际页面状态 | Console 汇总 | Overlay 节点 | 页面异常 / 水平溢出 | 截图 |
|---|---|---:|---:|---|---|
| 亮色桌面，1440×1000 | 白底 | 16 项 | 16 | 0 / 无 | `browser/light-desktop.png` |
| 深色桌面，1440×1000 | `html.dark`，背景 `rgb(27, 27, 31)` | 323 项 | 323 | 0 / 无 | `browser/dark-desktop.png` |
| 触屏窄屏，375×812 | 白底，`isMobile` 与 `hasTouch` 开启 | 10 项 | 10 | 0 / 无 | `browser/light-touch-375.png` |

三视图均 HTTP 200，未发现 page error 或失败请求。每个视图的完整 console、viewport、页面状态、selector、命中规则和目标元素祖先链分别保存在 `browser/<view>.json`；预检截图与全量运行记录在 `browser/preflight.png`、`browser/evidence.json`。初始成功批次另存于 `browser/first-successful-batch/`。

浏览器规则命中已逐条按目标节点核对：

- 深色视图的 307 个 `ai-color-palette` 全部命中 `.vp-doc` 代码块内的 Shiki `pre > code > span.line > span` 语法着色 token，没有命中表单控件；这是代码示例配色被当作页面紫色强调色的误报。
- 5 个 `buried-raster` 命中 VitePress 代码示例内的 `button.copy`，属于文档代码复制控件，不是 DynamicForm 控件。
- 3 个 `gpt-thin-border-wide-shadow` 命中 body portal 下 `el-popper ... lx-select__popper` 元素；采集时均未渲染（隐藏下拉层），不属于截图中的可见阴影问题。此证据没有确认它们对应的阴影是否来自统一 elevation token，因此不作 token 命中结论。
- 7 个 `line-length` 命中 `.vp-doc` 的说明段落，不在表单 DOM 中。Detector 对中文技术文案给出约 86 chars/line 的通用估算；截图可见文本正常换行，该结果更适合作为文档文案提示，未据此认定组件缺陷。
- 1 个 `text-occlusion` 命中 `.impeccable-overlay` 自己的 label（文本为 “✦ ai color palette”），是 detector 注入后再调用序列化查询产生的自引用误报。
- `bounce-easing` 与 `layout-transition` 命中 `body` 全局节点，无法归因到 DynamicForm；`clipped-overflow-container` 命中移动视图的 VitePress `span.container` 文档外壳。375px 页面整体无水平溢出，截图未见内容截断，均不作为已确认的表单问题。

Console 汇总来自自动 overlay scan；序列化 selector 详情是在 overlay 显示后再次读取，因此深色视图的详情包含 324 个分组、325 条规则记录，比自动 scan 的 323 个 overlay 多出的自引用目标已单独标注，不把两种计数混为一个缺陷数。

## 服务与冻结校验

Impeccable live-server 在 `assessment-b` 目录以后台模式启动，PID `2212`、端口 `8400`；停止命令为 `node "C:\Users\Administrator\.codex\skills\impeccable\scripts\live-server.mjs" stop --keep-inject`，退出码 `0`，停止后 health 请求失败，确认服务已关闭。用户已有的 4174 服务未停止，浏览器批次结束后仍返回 HTTP 200。

扫描前与结束后的 34 个冻结文件 SHA-256 均与冻结清单一致，结束时 `34/34` 匹配、`0` 个差异。比对明细见 `hashes-before.json` 与 `hashes-after.json`。
