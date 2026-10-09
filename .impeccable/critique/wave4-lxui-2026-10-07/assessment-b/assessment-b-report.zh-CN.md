# Wave 4 lx-ui Assessment B

本报告记录静态 detector 与浏览器 overlay 证据。覆盖 `LxDatePicker`、`LxDynamicForm`、`LxUpload` 的当前源码目录和对应文档演示页；未读取或引用 Assessment A 结论，也未修改产品代码。

## 静态 detector

每个组件目录分别调用一次：`node "C:/Users/Administrator/.codex/skills/impeccable/scripts/detect.mjs" --json "<目标目录>"`。三份 stdout 都是原始 `[]\n`（3 bytes），stderr 均为 0 bytes，退出码均为 0。这里仅表示源码规则扫描没有命中，不表示页面整体通过评审。

| 目标 | 目录 SHA-256 | 当前哈希复核 | Detector |
|---|---|---|---|
| LxDatePicker | `3a502946d9f6af0193f267ebc31731ef333a43abb2f3317cbc961fdc353040f4` | 一致，4 个文件 | `[]`, stderr 空, exit 0 |
| LxDynamicForm | `7fac41cdaf40f9626d26302c2c947b87016084685ac60faecd2512a1eb381837` | 一致，18 个文件 | `[]`, stderr 空, exit 0 |
| LxUpload | `009c07420539a58441983b3f7740cf4c29a3c6fe5d5826c26521e39187279077` | 一致，4 个文件 | `[]`, stderr 空, exit 0 |

逐目标原始 stdout、stderr、exit code、完整命令、目标文件清单与哈希保存在同目录的 `*-detector.*` 和 `*-target.json` 中；最终哈希复核在 `source-hash-confirmation.json`。

## 浏览器证据

`http://127.0.0.1:4174/components/lxdatepicker`、`/components/lxdynamicform`、`/components/lxupload` 的 HTTP 状态均为 200。使用独立 Playwright context/page 与本机 Chromium headless shell，对每个页面分别检查 light 和 dark；DatePicker 另有一个演示状态页。每页均成功设置 document title、追加 inline script，随后加载 bundled `/detect.js`；`window.impeccableDetect` 与 `window.impeccableScan` 均存在。各页页面错误数和失败请求数均为 0。

| 视图 | 浏览器自动扫描 console 计数 | 截图 |
|---|---:|---|
| DatePicker / light / default | 19 | `lxdatepicker-light-default.png` |
| DatePicker / dark / default | 246 | `lxdatepicker-dark-default.png` |
| DatePicker / light 页面、HUD 深色演示状态 | 47 | `lxdatepicker-light-calendar-open.png` |
| DynamicForm / light / default | 19 | `lxdynamicform-light-default.png` |
| DynamicForm / dark / default | 359 | `lxdynamicform-dark-default.png` |
| Upload / light / default | 10 | `lxupload-light-default.png` |
| Upload / dark / default | 157 | `lxupload-dark-default.png` |

console 中的计数均来自页面自动扫描的 `[impeccable] N anti-patterns found` 消息，逐页原文在 `browser-evidence.json`。截图里的黄色框和顶端提示条是 detector overlay，不属于产品 UI；它们仅保存在本次 headless 页面截图中，没有打开或改变用户标签。

首选 Chromium executable 启动时报 `spawn UNKNOWN`、退出码 1；诊断记录在 `browser-launch-failure-first-attempt.md`。本机配套的 `chromium_headless_shell-1243` 随后启动成功并完成上述浏览器检查。`live-server.mjs --background` 启动退出码 0，服务地址为 `http://127.0.0.1:8400`；检测脚本从该服务加载。结束时执行 `live-server.mjs stop --keep-inject`，退出码 0，服务已停止，且没有清除或写入页面注入代码。启动与停止记录分别在 `live-server-start.json`、`live-server-stop.json`；token 未保存。

## 命中解释

- **Line length too long**：DatePicker 6 处、DynamicForm 9 处、Upload 6 处，主要落在文档说明段落，Upload 另有演示说明文字。它们是可见文案，值得人工看宽度；规则按字符数估算，中文一行包含的全角字数不能直接等同英文 80 字符阈值。截图显示正文列宽约 688px，建议按实际中文阅读宽度判断，不要仅凭命中数加宽整个页面。
- **Hairline border with wide shadow**：DatePicker 9 处、DynamicForm 4 处，全部命中当前关闭且 0×0 的 Element Plus popper（日历或下拉面板）。这是隐藏状态误报候选；只有面板打开后仍能看到该边框与阴影组合时才应当修复。
- **Raster buried under a wash or opacity**：分别 2、5、1 处，目标是文档代码块的 `button.copy`，并非组件上传/日期控件。按文档外壳或 copy 图标样式处理，不作为组件缺陷。
- **AI color palette**：dark 文档页面新增大量命中：DatePicker 227、DynamicForm 340、Upload 147。它们指向 Shiki 代码示例中的语法 token；大部分在折叠代码块里，其他命中仍位于代码 token，不是用户界面的颜色配置问题。DatePicker 的 HUD 深色演示状态另有 37 处，29 处可见命中落在日历图标的 cyan `i/svg/path` 上；这是图标而非文字，且属于有意的 HUD 深色预览，属于规则误报。
- **Em-dash overuse**：DatePicker 页面级 `body` 命中 14 个 em dash，扫描范围包含文档正文和示例代码。可作为中文文档标点的弱提醒，不应据此改组件代码。
- **Layout property animation**：三个页面都命中 `body` 上 `transition: height, padding-top, padding-bottom`。这是 VitePress 文档页面级命中；在 `linkx-fe` 源码中没有找到该声明的字面字符串。不要据此归因到三个组件。
- **Bounce or elastic easing**：DynamicForm 页面的 `body` 命中 `cubic-bezier(.71, -.46, .29, 1.46)`；它不是组件节点命中，组件源码中也没有该字面声明。归属仍需追到浏览器载入的依赖样式后再决定是否处理。
- **Cards flush against the scroller edge**：DatePicker 与 Upload 各 1 处，命中 API props 说明 `<table>`，不是横向卡片列表；属于文档表格误报。
- **Text occlusion**：Upload 的自动扫描计数包含折叠代码块中的 `.lang` 标签候选。额外调用 `window.impeccableDetect()` 读取 overlay 后，会把 detector 自己新增的 “line length too long” 标签再次报成重叠文字；这个自命中只出现在二次读取，不在自动扫描 console 计数中，应排除。

DatePicker 的状态截图文件名 `lxdatepicker-light-calendar-open.png` 与实际操作不符：脚本点击 `.VPDoc input` 的第一个控件后，切换的是 Demo 的 HUD 深色主题 checkbox，没有打开日期面板。截图因此作为 HUD 深色演示状态证据，不能当作日历展开状态；本次没有有效的日历展开 overlay 截图。

## 证据边界

Assessment B 的源码扫描、浏览器注入与截图证据已完成。Detector 的浏览器规则扫描覆盖了 VitePress 文档、示例、代码块和依赖样式，因此命中需按上文逐条核对真实目标与外壳误报；规则总数不等于缺陷数。本报告不替代 Assessment A，也不构成整体验收通过结论。
