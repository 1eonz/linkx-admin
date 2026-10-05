# LxSwitch Assessment B 独立审核报告

日期：2026-10-05  
结论：**DEGRADED**。本次只读审核限定于 LxSwitch 当前组件、Demo、对应文档与 `.impeccable/critique/wave2-lx-switch-2026-10-05/assessment-b-final-final-rerun/` 的持久产物；未读取 Assessment A 或目录外旧 Critique/B 证据，也未重新运行 detector 或浏览器采集。

证据采集由主会话单上下文执行；本审核独立复核仅基于已保存文件，因此不构成独立采集的第二路浏览器证据。另有 375px 指标不一致、loading 状态未注入 overlay detector 等缺口，故不能记为正式通过。

## Detector

组件与 Demo 的首轮结果均是 JSON `[]`，但退出码为 `1`，stderr 分别报告无法访问 `linkx-fe/src/components/LxSwitch/index.vue` 与 `linkx-fe/src/components/LxSwitch/demo/basic.vue`。这两份结果是失败扫描，不能作为零命中结论。对应 `*-rerun` 产物退出码均为 `0`、stderr 为空、JSON 为 `[]`；仅接受这两次复跑作为有效静态扫描证据。

## 浏览器矩阵

指定目录内 8 组 JSON/PNG 配对齐全，目标均为本地 `LxSwitch 状态开关` 文档页。所有已保存状态的 `pageErrors`、`failedRequests`、`externalRequests` 均为空。

| 状态 | 持久证据核对 | 结论与限制 |
|---|---|---|
| 浅色桌面 | 1280×720；页面无横向溢出 | 文档样例与标准状态可见 |
| HUD 深色 | 1280×720；`hudTheme=true`；overlayCount 167 | HUD 页面可见；大量调色板命中见下节，不能把命中数当组件缺陷数 |
| 禁用 | 1280×720；锁定开关 `disabled=true` | 禁用态、外部状态文字和锁定说明可见 |
| Loading | 1280×720；同步开关采集时 `disabled=true`；截图可见 loading 状态 | 最终采集无页面错误；此状态设置了 `injectDetector=false`，overlayCount 0 仅表示未注入 detector，不是零命中。另有一次旧尝试因点击隐藏 input 超时，最终采集改为点击可见开关宿主后成功 |
| 键盘焦点 | 1280×720；焦点 role 为 switch，`focusVisible=true`，Space 后 `aria-checked=true` | 焦点外环和切换结果有证据 |
| 375px 触屏 | PNG 为 375×812，开关命中框均为 44×44 | JSON 却记录 `window.innerWidth=615`、`innerHeight=1332`，而 bodyWidth 为 375。配置值与 PNG 尺寸是 375，但 CSS viewport 指标不一致，不能据此确认 375 CSS px 下的断点布局 |
| 减少动效 | 1280×720；`reducedMotion=true`；采样到的 switch transition/animation 均为 `1e-05s` | 与减少动效偏好相符 |
| Props 表横向滚动 | PNG 为 375×812；表格 `scrollWidth=624`、`clientWidth=327`、`scrollLeft=297`，页面无横向溢出 | 表格自身承载滚动，第一列 sticky 规则见文档主题 CSS；JSON viewport 同样记录 615×1332，因此窄屏断点仍有上述限制 |

## Overlay 命中分类

本目录没有单独的 overlay 命中明细 JSON；逐条核对依据为各浏览器 JSON 的 console 规则文本、metrics 与对应截图。`overlayCount` 是 `.impeccable-overlay` 元素数量，和规则日志条数不完全相等，不能把它当作缺陷总数。

| 命中 | 分类 | 复核依据 |
|---|---|---|
| HUD `ai-color-palette` 共 163 条：161 条紫/紫红，2 条青色 | 设计主题令牌命中 2 条；VitePress 代码语法高亮误报 161 条 | LxSwitch 样式只引用 `--lx-*` 颜色；HUD 主色是 `#38bdf8`，用于焦点环的青色命中有令牌依据。紫色命中来自页面内嵌 Demo 源码的高亮文本，不是开关控件配色 |
| `buried-raster`，每个注入 detector 的视图 2 条 | VitePress 外壳误报 | 组件与 Demo 源码没有对应 raster 背景；截图未显示相关图像内容，JSON 未保存命中节点定位 |
| `first-viewport-column-overflow`，桌面、HUD、禁用、焦点、减少动效各 1 条 | VitePress 外壳误报 | 日志目标为通用 `div.container`；长文档正文与目录栏同屏是文档页结构，截图未显示组件列溢出 |
| `clipped-overflow-container`，375px 与 Props 各 1 条 | VitePress 外壳/预期表格滚动误报 | 命中 `span.container`，不是组件节点；窄屏表格自身 `overflow-x:auto` 是文档主题 CSS 明确设计，页面整体无横向溢出 |
| `text-occlusion`，Props 状态 48 条 | VitePress 表格结构误报 | 日志报告文本 span 被其所在 `td` 覆盖；截图中单元格内容可见，符合文本位于表格单元格内的结构 |
| `layout-transition`，每个注入 detector 的视图 1 条 | VitePress 外壳误报，定位证据不足 | 日志只给出 `height/padding` 属性，没有节点信息；LxSwitch 样式未设置这些过渡属性，命中无法归因到组件 |
| `em-dash-overuse`，每个注入 detector 的视图 1 条 | 文档规则误报，不是组件问题 | 文档中的 `—` 用于 Props 默认值/不适用项和对齐表格，不是正文连续滥用；此项不属于外壳或主题令牌命中，单列说明避免误记为组件缺陷 |

## 最终判断

有效的静态 detector 复跑为零命中；浏览器证据支持桌面浅色/HUD、禁用、键盘切换、减少动效和表格横向滚动的基本观察，未发现已证实的 LxSwitch 组件缺陷。正式状态仍为 **DEGRADED**：证据采集与独立复核不在隔离上下文中分别执行，375px JSON viewport 与截图/配置不一致，Loading 视图没有 detector overlay 数据，且 loading 首次采集失败记录仍保留。该报告只表达 Assessment B 持久证据能支持的结论，不代替独立重采集或真实浏览器联验。
