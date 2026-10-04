# LxDynamicForm Assessment B（当前版本）

Method: Assessment B only; independently captured from Assessment A.

本目录记录 `linkx-fe/src/components/LxDynamicForm/`、Demo 与中文文档的 detector 和浏览器证据。未读取 Assessment A，未修改产品源码，也未对真实后端发请求。此前 9 月 30 日的完整浏览器记录早于当前组件、字段子组件和 Demo 变更；10 月 3 日 B 记录因浏览器不可写而没有 overlay，因此本报告重新采集了当前版本。

## Detector

| 目标 | JSON stdout | stderr | 退出码 | 结果 |
| --- | --- | --- | ---: | --- |
| `linkx-fe/src/components/LxDynamicForm`（含 `fields/`） | `[]` | 空 | 0 | 静态规则零命中 |
| `linkx-fe/src/components/LxDynamicForm/demo/basic.vue` | `[]` | 空 | 0 | 静态规则零命中 |
| `linkx-fe/docs/components/lxdynamicform.md` | `[]` | 空 | 0 | 静态规则零命中 |

每个目标的 stdout、stderr 和进程退出码分别留档。静态 `[]` 只代表这三个源码/文档目标没有静态规则命中，不表示浏览器页面无问题。

## Browser

目标页 `http://127.0.0.1:4189/components/lxdynamicform.html` 返回 HTTP 200。CUA 没有可用的浏览器表面，故使用独立 Playwright 页面和本机 Chrome；5 个新页面的标题修改及内联脚本预检全部成功，随后注入 `detect.js` 并调用页面内 `window.impeccableScanAsync()`。四个主题/响应式基线和桌面 8 状态矩阵共 12 次扫描，均产生 detector 结果和 overlay 截图。

基线覆盖桌面 `1440×900`、移动 `375×812`，亮色与 HUD 深色；HUD 页面同时启用 `prefers-reduced-motion: reduce`。动态状态包含空提交校验、候选项 loading/empty/error 与重试入口、条件显示“支援说明”、禁用表单，以及内存 Mock 上传成功。校验错误出现 1 个必填错误；候选 loading、empty、error 分别可见；错误状态显示重试按钮；切换“应急支援”后出现条件字段；禁用时 11 个字段/控件带禁用状态。新增的 Mock 图片在约 1 秒后显示为成功文件，成功文件数从 2 增至 3。约 100ms 的上传过渡截图记录了新文件已接收，但该时刻未观测到 `uploading` 文件项，因此不把上传中的视觉状态记为已验证。

四个视图的产品基线都没有页面横向溢出。移动基线 `document.scrollWidth` 为 `375`；注入 detector 后 overlay 标签把文档页宽扩到 `615`，该变化来自 detector 标注，不能归因给表单。浏览器没有 page error、失败请求或外部请求。唯一 console error 是文档站 `/favicon.ico` 返回 404，与组件无关。

## Overlay 归因

| 视图 | Findings | Overlay nodes |
| --- | ---: | ---: |
| 桌面亮色 | 15 | 13 |
| 移动亮色 | 10 | 8 |
| 桌面 HUD + 减少动效 | 209 | 207 |
| 移动 HUD + 减少动效 | 207 | 205 |

桌面状态矩阵的 8 个状态各记录 15 项、13 个标记节点。逐项核对结果：

- `bounce-easing` 和 `layout-transition` 命中 `body`，来自 VitePress 文档壳层的页面动效，不是 DynamicForm 行为。
- `buried-raster` 命中 5 个 `button.copy`，对应文档代码示例的复制按钮，不属于表单。
- `line-length` 命中 6 个文档段落（检测约 86 字符/行）；这是文档说明长度信号，可由文档维护时精简，不代表表单布局溢出。
- 移动页 `clipped-overflow-container` 命中文档容器 `span.container`。未注入页面基线无溢出，注入后宽度变化由 overlay 标签造成。
- `gpt-thin-border-wide-shadow` 命中两个运行时生成的 Element Plus ID（`#el-id-1024-3`、`#el-id-1024-8`）。截图显示的是表单中的常规选择控件边界；自动 ID 与规则命中数不能直接视作两个产品缺陷。
- HUD 的 `ai-color-palette` 分别命中 196/199 项。紫/紫罗兰文本命中位于 VitePress 代码语法高亮；实际表单命中包括 `.el-checkbox__label`、`.lx-upload__drop-icon`、`.lx-upload__browse`、`.lx-upload__over-title` 和图标 SVG。HUD 主题在 `linkx-fe/src/styles/element-theme.css` 显式把 Element Plus 主色切换为 `#38bdf8` 战术蓝，因此这些青色命中符合既有主题令牌；本轮没有独立做颜色对比度测量。

浏览器截图、overlay 明细、console/network 原始记录和起止指纹均保存在本目录。16 个组件、字段、Demo 与文档目标在采集期间哈希未变。

## 生命周期与边界

本轮 VitePress 文档服务由 Assessment B 在端口 `4189` 后台启动，记录 PID `40912`，结束时确认进程及监听已退出。Impeccable helper `8400` 的停止退出码为 `0`，停止后健康检查不可达。Assessment B 只提供 detector 和浏览器证据；是否完成正式 Critique 仍须由父级结合独立 Assessment A 综合，静态 detector 零命中不替代真实后端联调。
