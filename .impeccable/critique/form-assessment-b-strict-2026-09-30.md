Method: Assessment B only (fresh detector/browser evidence; no Assessment A input used)

# 表单组件 Assessment B：检测器与浏览器证据

本报告只记录静态 detector 与浏览器实测，不包含设计评分或完整 Critique 综合结论。采集时间为 2026-09-30 07:40–07:51（Asia/Shanghai）。早先 05:45 的浏览器证据早于本轮 ARIA、栅格和首错聚焦改动，本报告未将其当作当前证据；旧文件仍保留在 `form-assessment-b-strict-2026-09-30/`。

本轮从现有 VitePress HMR 服务 `http://localhost:4177` 新开五个 Playwright 页面。两个目标路由均返回 HTTP 200，HTML 含 `/@vite/client`。浏览器截图与交互采集时的工作区源码指纹前后一致：HEAD 为 `2a93ef1a447fc4a72f688471cc14a0692703be60`，相关组件及文档仍为未提交的 `M`/`??` 状态；这证明记录对应当前工作树，不代表这些改动已提交。24 个被监测文件的前后 SHA-256 均未变化。

## 静态扫描

四个目标各自的 stdout 都是有效 JSON 数组 `[]`，stderr 为 0 字节，退出码为 0，静态命中数为 0：

| 目标 | JSON | 命中 | stderr | 退出码 |
|---|---|---:|---:|---:|
| `linkx-fe/src/components/LxForm/index.vue` | `[]` | 0 | 0 B | 0 |
| `linkx-fe/src/components/LxForm/LxFormItem.vue` | `[]` | 0 | 0 B | 0 |
| `linkx-fe/src/components/LxDynamicForm/index.vue` | `[]` | 0 | 0 B | 0 |
| `linkx-fe/src/components/LxDynamicForm/fields/` | `[]` | 0 | 0 B | 0 |

`[]` 只说明这些源码目标没有命中静态规则；它不表示浏览器运行时没有问题，也不构成 Critique 通过。对应原始 stdout、stderr、退出码和校验记录见 `form-assessment-b-strict-2026-09-30-fresh-0738/static/`。

## 浏览器复验

每个视图均在 detector 扫描后成功注入可视 overlay；原始 findings 在绘制 overlay 前采集。各视图无页面异常、失败请求、坏响应或被拦请求，页面宽度未超出视口。

| 视图 | 视口 | overlay 分组 / 原始规则命中 |
|---|---:|---:|
| LxForm 桌面 | 1280×800 | 7 / 8 |
| LxForm 移动 | 375×812 | 7 / 8 |
| LxDynamicForm 桌面 | 1280×800 | 12 / 13 |
| LxDynamicForm 移动 | 375×812 | 14 / 15 |
| LxDynamicForm HUD 深色、减少动效 | 1280×800 | 24 / 25 |

当前表单行为：LxForm 的“任务名称”和“责任网格”必填错误都带有 `aria-invalid="true"`，并通过 `aria-describedby` 指向错误文案；焦点仍停在“提交校验”按钮。LxDynamicForm 的“任务名称”错误同样有 ARIA 关联，且提交后焦点落在该输入框；桌面、移动和 HUD 视图均复现。DynamicForm 示例初始已有两条 Mock 上传成功状态（东门现场.jpg、西门现场.jpg）；本轮没有挑选新文件或发起后端写操作。HUD 视图确认 `lx-theme-hud` 和 `prefers-reduced-motion` 生效，计算动效时长为 `1e-05s`，动画名为 `none`。

## 需要带入综合评审的真实组件证据

- DynamicForm 示例中的 `LxUpload` 亮色辅助文字在白底上为 **3.2:1**，两条上传成功状态文字在浅绿底上也为 **3.2:1**；桌面和移动均复现，低于 detector 对普通文字采用的 4.5:1 阈值。
- HUD 深色下，两项上传字段标签为 **2.8:1**（`#606266` / `#101a2c`），两条辅助文字为 **3.7:1**（`#64748b` / `#101a2c`）。这些都是当前可见的小字号文字，属于真实对比度问题。
- LxForm 的错误关联已由 ARIA 证据确认，但错误提交后没有把焦点移到首个无效字段；这与 DynamicForm 当前的首错聚焦行为不同，供综合评审决定是否统一。

## 规则归因与误报边界

HUD 下 14 个 `ai-color-palette` 命中来自两个上传区的青蓝图标、SVG 子路径、浏览按钮及隐藏的拖拽悬停标题。图标和按钮使用 HUD 主题令牌 `--lx-color-primary: #38bdf8`；[HUD 令牌](../../linkx-fe/src/tokens/theme-hud.css) 与 [设计规格](../../doc/lx-ui/DESIGN-SPEC.md)明确采用 sky 青蓝主色，因此这些重复 DOM 命中不是改色依据。两条隐藏的悬停标题也不是当前可见状态。该规则不应与上述真实文字对比度命中混为一谈。

其余命中主要落在文档外壳或隐藏内容：`buried-raster` 与部分 `text-occlusion` 指向 VitePress 代码块/复制按钮；移动视图的 `span.container` 属于 `VPNavBarHamburger`；`gpt-thin-border-wide-shadow` 指向隐藏的 Element Plus Select popper；若干动态表单文字遮挡项处于隐藏的示例控件或下拉状态。`em-dash-overuse`、`layout-transition` 和 `bounce-easing` 是 `body` 级文档页面命中，不能直接归到表单组件。HUD 减少动效视图实测将时长压到 `0.00001s`，没有发现动效未降级的证据。

## 证据索引与运行收尾

- 当前源码及工作区状态：`form-assessment-b-strict-2026-09-30-fresh-0738/source-fingerprint.json`；采集前后对照：`source-state-before.json`、`source-state-after.json`、`freshness-verification.json`（`unchangedDuringCapture: true`）。核心 SHA-256：LxForm `index.vue` 为 `2AD504069920E4E806F342163DBD30EC4F614CCE39EF8BAA5B6405E9A64A7A39`；LxFormItem 为 `0D45D62165CE82967758A433C080CCE2D4A181600C7BD675F3FEC0E897A97AFC`；LxDynamicForm `index.vue` 为 `CF16149AE0F7CCCA2A9944DFBF093E3C5647C0E8C3FA49EC7EB570AAA2A26C4B`；`fields/` 目录聚合指纹为 `815EB0A48CE7A798621E2867B72EB8C480FF0B7EF2FE7F18124CAC99EB552E94`。
- 浏览器摘要与逐页 findings：`form-assessment-b-strict-2026-09-30-fresh-0738/browser/summary.json`、`detector-findings-summary.json`、`detector-attribution.json`。
- 五张 overlay 截图：[LxForm 桌面](form-assessment-b-strict-2026-09-30-fresh-0738/browser/lxform-desktop/viewport-overlay.png)、[LxForm 移动](form-assessment-b-strict-2026-09-30-fresh-0738/browser/lxform-mobile/viewport-overlay.png)、[DynamicForm 桌面](form-assessment-b-strict-2026-09-30-fresh-0738/browser/lxdynamicform-desktop/viewport-overlay.png)、[DynamicForm 移动](form-assessment-b-strict-2026-09-30-fresh-0738/browser/lxdynamicform-mobile/viewport-overlay.png)、[HUD 深色 / 减少动效](form-assessment-b-strict-2026-09-30-fresh-0738/browser/lxdynamicform-hud-dark-reduced-motion/viewport-overlay.png)。
- 本轮启动的 Impeccable detector 服务已停止；停止后端口 8400 无监听。复用的 VitePress HMR 服务没有由本轮启动或停止。

Questions skipped: 这是 Assessment B 的独立证据记录；后续问题留给完整 Critique 综合报告。
