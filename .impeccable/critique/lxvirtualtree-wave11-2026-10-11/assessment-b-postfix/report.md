Method: dual-agent (A: pending · B: virtualtree_assessment_b_postfix_luna)

# Assessment B：LxVirtualTree / LxTransferPanel

本报告记录 Assessment B 的确定性 detector 和浏览器证据，供最终双评估报告综合使用。它不替代 Assessment A 的设计判断。

## 检测目标与三件套

对以下四个 markup 目标执行了 `detect.mjs --json`：

| 目标 | JSON stdout | stderr | 退出码 |
|---|---|---|---:|
| `linkx-fe/src/components/LxVirtualTree/index.vue` | `[]` | 0 字节 | 0 |
| `linkx-fe/src/components/LxVirtualTree/types.ts` | `[]` | 0 字节 | 0 |
| `linkx-fe/src/components/LxVirtualTree/demo/basic.vue` | `[]` | 0 字节 | 0 |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `[]` | 0 字节 | 0 |

每项的三件套分别保存在同名的 `*.stdout.json`、`*.stderr.log`、`*.exit-code.txt` 文件中。`[]` 只表示这些静态目标没有命中 detector 规则，不代表运行时页面、VitePress 文档外壳或窄屏布局没有问题。

## 浏览器覆盖

使用系统 Chrome（Playwright bundled Chromium 不存在）启动 VitePress `5194` 和 live overlay server `8427`，完成六个独立 context/tab。所有视图均完成可变 DOM 注入，`scriptPresent=true`、`injected=true`，页面错误和请求失败均为 0。

| 视图 | 视口 | overlay | 交互证据 |
|---|---:|---:|---|
| VirtualTree 桌面浅色 | 1440×900 | 9 | 树渲染 21 项；无运行时错误 |
| VirtualTree HUD | 375×812 | 20 | HUD class 生效；树与搜索控件可操作 |
| VirtualTree 多行 slot | 1280×900 | 7 | slot 文案保持在行内，树渲染 21 项 |
| VirtualTree 键盘窄屏 | 390×844 | 7 | 键盘选择后焦点落在 `role=treeitem`，行带 `is-checked` |
| TransferPanel 桌面待选/已选 | 1440×900 | 25 | Space 选择后已选数 4→5；长名称展开；焦点落在已选列表 |
| TransferPanel HUD + 减少动效 | 390×844 | 49 | 切换到已选面板并展开长名称；`prefersReducedMotion=true`；HUD class 生效 |

窄屏文档测量需要保留限制说明：VirtualTree 375px 的 `documentScrollWidth=615`、390px 的 `documentScrollWidth=630`，TransferPanel 390px 也是 `630`；对应 `bodyScrollWidth` 分别等于 viewport（375/390）。因此不能据此宣称整个页面没有横向溢出；证据更准确地说明溢出宽度出现在文档级布局或被 body 隐藏的层级，组件自身测量框仍在 viewport 内。

## Overlay 归因

浏览器 detector 发现的规则及归因如下。overlay 数量是命中节点数，重复节点可能对应同一规则。

### 组件或示例实现

- `gpt-thin-border-wide-shadow`：桌面 TransferPanel 的 `.lx-transfer-panel__scope-action-content`，报告为 1px 边框叠加 16px 阴影；这是组件 scope 操作区的实际样式，需由组件视觉审查决定是否收敛。
- `cramped-padding`：HUD VirtualTree 的 `.virtual-tree-demo__preview`，以及移动 TransferPanel 的 `.lx-transfer-panel__selected-item`，命中内容贴近带背景/边框的容器边缘；这些属于示例或组件内容区，应结合窄屏实际间距修复。
- `ai-color-palette`：HUD 主题中的 VirtualTree 已选行和 TransferPanel 移动视图多个节点。该规则只描述“深色背景上的青色霓虹”，而 HUD 是显式的主题状态，因此属于设计意图待确认的提示，不能按命中数量直接视为缺陷。

### 文档外壳或规则误报

- `span.container` 的 `clipped-overflow-container` 命中 VitePress 移动导航汉堡按钮容器，不是 VirtualTree/TransferPanel 的业务节点。
- `buried-raster` 命中 VitePress 代码块的 copy 按钮；`line-length` 命中文档段落；`edge-flush-cards` 命中文档 API 表格；这些均是页面文档外壳。
- `first-viewport-column-overflow` 命中 VitePress `.VPDoc` 页面容器，描述的是很长文档与侧栏的折叠比例，不是组件内部列布局。
- `layout-transition`（`body`）和 TransferPanel 桌面的 `bounce-easing`（`body`）来自运行时页面的全局/文档样式选择器；当前证据不能把它们归因到组件源码，需在组件独立宿主中复验。

因此，静态 `[]` 与浏览器 overlay 并不矛盾：前者是四个源码文件的零静态命中，后者扫描的是包含 VitePress 外壳和主题状态的完整运行页面。

## 页面与服务状态

- 六个视图 `page-errors.json` 和 `request-failures.json` 均为空；VirtualTree 桌面控制台额外记录一次 `/favicon.ico` 404，这是文档站未提供 favicon 的资源提示，不是 page error，也未进入 requestfailed 统计。
- 每个视图目录均保存 `screenshot.png`、`dom.html`、`dom-measure.json`、`script-injection.json`、`console.json`、`page-errors.json`、`request-failures.json`、`summary.json`。
- 服务停止记录位于 `service-stop.txt`，包含 VitePress 的 `taskkill /PID ... /T /F` 和 overlay server 的 `live-server.mjs stop --keep-inject`。复核时 `5194` 与 `8427` 均无监听进程。
