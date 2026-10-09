# Assessment B：LxDynamicForm / LxUpload

本记录只包含 Assessment B 的静态 detector 与浏览器证据，未读取或引用 Assessment A，也不构成两项评估合成后的正式 Critique 结论。

## 静态 Detector

对最新工作树的 4 个目标分别运行 Impeccable `detect.mjs --json`：

| 目标 | JSON | 退出码 | stderr | 命中 |
|---|---|---:|---|---:|
| `linkx-fe/src/components/LxDynamicForm` | 有效数组 `[]` | 0 | 空 | 0 |
| `linkx-fe/src/components/LxUpload` | 有效数组 `[]` | 0 | 空 | 0 |
| `linkx-fe/docs/components/lxdynamicform.md` | 有效数组 `[]` | 0 | 空 | 0 |
| `linkx-fe/docs/components/lxupload.md` | 有效数组 `[]` | 0 | 空 | 0 |

扫描覆盖的 20 个源文件在 detector 执行前后哈希一致。这里的 `[]` 只说明静态 detector 对这四个目标没有命中，不表示浏览器状态无问题或 Critique 通过。

## 浏览器证据

目标页 `http://127.0.0.1:4174/components/lxdynamicform.html` 与 `http://127.0.0.1:4174/components/lxupload.html` 均返回 HTTP 200。动态注入预检通过，`[Human]` 标记、`/detect.js` 脚本连接以及页面内 scan/detect API 均确认可用。浏览器采集共保存 13 张带 overlay 的截图：DynamicForm 8 种状态，Upload 5 种状态；无页面异常、失败请求、状态采集错误或源文件哈希变化。

第一次已归档的截图组存在 viewport 与 PNG 尺寸不一致：13 张 PNG 都是 `1440×950`，但对应的移动页状态记录为 `615×1332`，HUD 暗色状态记录为 `929×917`。这组图片不作为移动尺寸或 HUD viewport 的有效证据。`attempt-2/` 是修正后的最终采集：通过 Playwright viewport API 设置触屏宽高，并把错误状态滚入截图视口；13/13 PNG 像素尺寸与该状态的页面 viewport 一致，桌面为 `1440×950`、触屏为 `375×812`，触屏媒体特征为 `pointer: coarse`。

Upload 的本地 Mock 失败状态实际显示失败条目、错误文案和重试操作。上传请求由内存 Mock 适配器处理，浏览器没有观察到任何远端请求。采集启动的 Impeccable 临时服务已停止；端口 `4174` 属于当时已存在的文档服务，本轮未停止它。

## Overlay 核验

静态 detector 没有命中；注入式浏览器扫描仍报告可供人工复核的候选项。按元素归属核对后，不能把页面总数直接当成组件缺陷数：扫描覆盖整篇文档、语法高亮代码块、站点导航和 demo 控件。

**组件范围内需优先复核的命中**

- `lx-upload-demo` 的 HUD 暗色状态中，拖区标题测得 `1.1:1`（`#e2e8f0` / `#dfe2e7`），提示文字 `2.0:1`（`#94a3b8` / `#dfe2e7`）；同一状态的说明文字、列表标题和状态标签为 `3.7:1`（`#64748b` / `#101a2c`）。这些命中均归属于 Upload demo，暗色面板中的拖区仍呈浅底，属于可复核的对比度问题候选。证据见 `attempt-2/screenshots/upload-desktop-hud-dark.png` 及浏览器扫描详情。
- Upload 亮色状态说明文字、列表标题及状态标签测得 `3.2:1`（`#86909c` / `#ffffff`）。DynamicForm 的禁用状态中，内嵌上传提示文字测得 `3.1:1`（`#606266` / `#b5bac4`）。禁用态命中需要结合控件是否确为禁用组件文字判断适用标准，不单独据 detector 计数下结论。
- `cramped-padding` 命中落在组件范围内的 `div.el-upload-dragger`，报告其左右子项贴近边界。截图显示触屏拖区较紧；保留为间距复核候选。

**Docs shell、代码块及启发式命中**

- `clipped-overflow-container` 的归属为 VitePress 移动端导航 `button.VPNavBarHamburger.hamburger`，不是目标组件。单独浏览器审计中两页的 `documentElement` 与 `body` 均为 `clientWidth=scrollWidth=375`；没有证据表明整个页面发生水平溢出。
- `line-length` 的 `~86 chars/line` 命中位于中文文档段落。该规则按字符数提示，中文混合代码行不宜直接按英文行长阈值计为缺陷。
- `buried-raster` 命中位于文档代码块的复制按钮；`gpt-thin-border-wide-shadow` 命中包含零尺寸隐藏的 select popper；`edge-flush-cards` 命中位于 API 文档表格。它们不是 LxDynamicForm/LxUpload 的有效组件命中。
- `ai-color-palette` 在禁用状态骤增（DynamicForm 317 项、Upload 147 项），归属为未映射的语法高亮 span，示例文本包括 `setup`、`lang`、类型名；不是对应数量的独立界面问题。HUD 状态中仍有少量命中落在 demo 本身，属于主题色规则的主观告警，需结合页面设计意图判断。
- `text-occlusion` 命中为文档代码片段中的 `span.lang`（文字 `vue`）与相邻段落重叠，未映射到组件 owner；作为文档内容候选保留。

## 运行边界

采集控制台记录了一个 DynamicForm 页面的 `404 (Not Found)` 资源错误，但该捕获未提供 URL；之后对两个文档页单独监听响应均未复现 4xx/5xx，因此具体资源未能归因。Upload 失败状态另有一次 `UploadAjaxError: 上传服务暂不可用，请重试` 控制台错误，发生在显式触发的本地 Mock 失败路径，与截图中的失败状态一致。两者均保留在浏览器 JSON 证据中。

浏览器截图、scan JSON、detector JSON、stderr、退出码和哈希清单位于 `attempt-2/`；原始第一次采集和启动失败材料保留在本目录，避免把尺寸不匹配的 PNG 与修正后证据混用。
