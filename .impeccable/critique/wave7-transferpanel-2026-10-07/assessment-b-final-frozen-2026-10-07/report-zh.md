# Assessment B：检测器与浏览器证据（冻结版本）

本文件只记录 Assessment B 的静态检测器与浏览器证据，供独立设计评审完成后综合使用；不包含 Assessment A、代码审查或最终启发式评分。本轮未修改产品源码、Demo、文档或测试。

**目标：** `linkx-fe/src/components/LxTransferPanel/index.vue`、`linkx-fe/src/components/LxTransferPanel/demo/basic.vue`、`linkx-fe/docs/components/lxtransferpanel.md`；浏览器路由 `http://127.0.0.1:4174/components/lxtransferpanel`。

## 静态检测器

对组件 Vue 文件、基础 Demo Vue 文件和 Markdown 文档各执行一次 Impeccable JSON 扫描。三个结果均为退出码 `0`、stdout 为可解析的 JSON 空数组 `[]`、stderr 为空；这是有效的静态零命中记录，但不能推出运行页面没有问题，也不能代替可访问性或浏览器验证。

| 目标 | 退出码 | stdout | stderr |
| --- | ---: | --- | --- |
| `LxTransferPanel/index.vue` | 0 | `[]` | 空 |
| `LxTransferPanel/demo/basic.vue` | 0 | `[]` | 空 |
| `docs/components/lxtransferpanel.md` | 0 | `[]` | 空 |

命令、原始 stdout/stderr、退出码与汇总见 `detector/`。浏览器运行时扫描与这三项源码扫描是不同证据，不能混为同一份静态结果。

## 浏览器结果

使用 Playwright Chromium `154.0.8037.95`，创建 7 个相互独立的浏览器上下文和页面。七次导航均返回 HTTP 200；每个场景都确认可更改标题并执行内联脚本，Detector 脚本已添加且存在于页面，Impeccable 运行已由控制台或页面标记确认。七个场景均无页面异常、失败请求或记录到的错误响应；所有视口的文档宽度均未超过视口宽度。

| 场景 | 视口 / 状态 | 可见问题标记数 | 主要归因 |
| --- | --- | ---: | --- |
| `desktop-light-default` | 1440×1000，浅色、正常数据 | 7 | 全部落在 VitePress 文档正文、代码复制按钮或文档表格 |
| `desktop-hud` | 1440×1000，HUD 深色、正常数据 | 43 | HUD 调色板标记 35 个；Demo 说明文字对比度 1 个；其余 7 个为文档页面标记 |
| `desktop-empty` | 1440×1000，浅色、空结果 | 7 | 同浅色默认场景，均非组件节点 |
| `desktop-loading` | 1440×1000，浅色、加载中 | 8 | 文档页面标记 7 个；Demo 加载消息低对比度 1 个 |
| `desktop-error` | 1440×1000，浅色、加载失败 | 7 | 同浅色默认场景，均非组件节点 |
| `mobile-375-keyboard-focus` | 375×900，浅色、筛选中、键盘焦点 | 4 | 组件标题溢出 1 个；VitePress 外壳裁切 1 个；文档复制按钮 2 个 |
| `desktop-reduced-motion` | 1440×1000，浅色、减少动效 | 7 | 同浅色默认场景，均非组件节点 |

这些数值是页面上的运行时标记，不是独立缺陷数。控制台摘要计入顶部 Banner；对应的 `issueOverlayCount` 只计有目标节点的标记。完整目标元素、控制台记录、状态文本、选中项和视口信息保存在 `browser-evidence/browser-evidence-final-recheck.json`。

## 组件与 Demo 命中

- **窄屏标题被挤压：** 375px、待选树筛选文本为“情指行”时，Detector 在 `.lx-transfer-panel__title` 上报告容器溢出 56px；截图中左面板标题显示不全，而全选/反选操作仍占用同一行。页面本身没有横向滚动。源码中标题为不换行、溢出隐藏，操作区不收缩；移动断点只增加按钮触控尺寸，没有调整两者布局。建议在窄屏把筛选批量操作移到次行或允许操作换行，确保面板名称仍可辨认。关联位置：组件模板标题和操作区、标题样式、移动断点样式。
- **加载消息对比度略低：** 加载场景命中 Demo 的 `.transfer-panel-demo__message`。使用浅色令牌 `#6b7280` 文本与 `#f2f4f8` 表面计算约为 **4.39:1**，略低于普通小字号文本的 WCAG AA 4.5:1。可加深文字或提高表面亮度差。
- **HUD Demo 说明文字对比度不足：** HUD 场景命中 `.transfer-panel-demo__note`。`theme-hud.css` 将次级文字设为 `#94a3b8`；该说明位于白色 VitePress 画布上，没有随深色面板提供深色底，截图中也可见其偏淡。按截图中的白底计算约 **2.56:1**。应为说明提供相配的深色表面，或使用适合白底的文字令牌。
- **HUD 调色板提示需设计上下文裁定：** 35 个 `✦ ai color palette` 标记集中在 HUD 主题下同一组虚拟树行、复选框、图标和标签，另有一个 Demo 状态按钮。它们共享同一套深海军蓝表面、天蓝主色与语义状态色，不能将 35 次元素级标记算成 35 个独立问题。`theme-hud.css` 明确把 HUD 定义为大屏指挥中心预设，因此这不是自动成立的误报；最终应由独立设计评审判断这种颜色集中度是否符合该预设与项目设计约束。

## 页面外壳命中与未归因信号

以下运行时标记的目标是 VitePress 文档，不是穿梭面板组件；若评审范围包括文档可读性，应单独人工复核：

- 四个 `line length too long` 命中都指向 `.vp-doc` 的说明段落，Detector 报约 86 字符/行。
- 两个 `raster buried under a wash or opacity` 命中指向 `.vp-doc` 的代码复制按钮。
- 一个 `cards flush against the scroller edge` 命中指向文档 API 表格。
- 移动场景的 `positioned child clipped by overflow container` 指向 VitePress 外壳 `span.container`。

浏览器顶端 Banner 在所有场景均报告 `cubic-bezier(.71, -.46, .29, 1.46)` 和 `transition: height, padding-top, padding-bottom`，但没有附带目标节点。本轮在组件、Demo 与 `linkx-fe` 源文件中未找到这些声明，因此保留为未归因运行时信号，不计作已确认的组件问题。减少动效场景确实观察到 `prefers-reduced-motion: reduce`；Banner 本身不足以证明组件在该偏好下仍运行这类动画。

默认浅色场景另记录一条 `http://127.0.0.1:4174/favicon.ico` 的控制台 404。组件路由本身仍返回 200；其他六个场景无控制台错误。这是文档站资源信号，不是组件请求失败。

## 边界与完成状态

Browser overlay 的注入预检、脚本执行确认、静态扫描原始结果、截图、服务生命周期和开始/结束指纹均已留档。第一次浏览器尝试未完整跑完移动与减少动效场景；`screenshots/final-recheck/` 中的七场景完整重检是本报告采用的最终证据，目录根部的早期截图不用于本结论。

开始与结束两次检查的 8 个冻结文件 SHA-256 全部一致。专用 Detector 服务已按记录使用 `--keep-inject` 在 8491 端口停止，并确认无监听；4174 页面复验仍返回 HTTP 200，未停止该文档服务。

本次不包含真实后端联调、读屏器验收、浏览器缩放至 200%、慢网测试或完整业务交互 E2E；这些项目不能由本次证据宣称通过。
