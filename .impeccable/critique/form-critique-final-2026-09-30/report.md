Method: dual-agent (A: Assessment A isolated design review · B: Assessment B isolated detector + Playwright browser evidence)

# LxForm / LxDynamicForm — Impeccable 综合 Critique Snapshot

日期：2026-09-30（Asia/Shanghai）  
目标：linkx-fe/src/components/LxForm、linkx-fe/src/components/LxDynamicForm（含 fields、Demo）及对应中文文档页 /components/lxform.html、/components/lxdynamicform.html。

## 评估来源与隔离边界

- **Assessment A（设计评审）**：`.impeccable/critique/form-a-final-2026-09-30.md`。该文件记录了独立的设计特异性、启发式、认知负荷、情绪旅程、可访问性和优先问题评审；在读取 B 结果前完成。
- **Assessment B（detector + 浏览器证据）**：`.impeccable/critique/form-assessment-b-final-2026-09-30/assessment-b-report.md`。该文件记录了静态 detector、URL detector 边界、Playwright 新页面、可写注入、overlay、状态和截图证据；评估过程与 A 隔离。
- 本报告在 A、B 均完成后才进行综合，未把 detector 输出提前提供给设计评审，也未修改产品源码。

## Review Status

**正式 Critique 尚未完全关闭。** 组件的基础交互和大部分视觉状态有有效浏览器证据，静态 detector 目标也均为零命中；但仍有待处理的错误定位、上传约束文案和多处对比度建议。特别是动态表单设置提示、上传辅助/成功文字和 HUD 标签/上传文字的真实运行时命中仍标记为待修复或待设计复核，不能把本轮标为“通过”。

### Strict current recheck freshness note

工作区另有一组更晚的严格对照证据：`.impeccable/critique/form-assessment-a-strict-current-2026-09-30.md`（07:53）和 `.impeccable/critique/form-assessment-b-strict-2026-09-30.md`（07:52）。它们针对当前源码重新检查，覆盖了 final A 之后的 ARIA、首错聚焦和 Demo 折叠改动；因此下方遇到冲突时，以 strict current B 的运行时结果作为当前状态，并把 final A 的旧观察标为已被新证据修正。Strict current A 本身没有浏览器截图，不能替代 B 的 Playwright 证据。

## Design Health Score

| # | 启发式 | 评分 | 关键观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3/4 | 行内校验、候选加载/失败/重试、上传成功均有反馈；移动端校验 toast 会压住文档顶栏。 |
| 2 | 系统与现实世界匹配 | 3/4 | 任务名称、责任网格、支援说明等业务语义清楚；schema、TSX、24 栅格仍要求开发者背景。 |
| 3 | 用户控制与自由 | 3/4 | 有重置、取消、关闭、清空、移除；没有已提交操作的撤销。 |
| 4 | 一致性与标准 | 3/4 | 两组件字段和错误样式统一并遵循令牌；toast 与窄屏固定导航发生遮挡。 |
| 5 | 错误预防 | 3/4 | 必填、手机号规则、受限下拉、上传限制可防常见错误；多文件数量上限未在控件旁说明。 |
| 6 | 识别而非记忆 | 3/4 | 标签、占位和文件状态可见；image/*、remote-select 等技术概念增加理解成本。 |
| 7 | 灵活性与效率 | 3/4 | 支持 schema、v-model 或 value + change，并可选固定/自适应列；未见快捷操作。 |
| 8 | 美观与简约 | 3/4 | 层级、留白、控件比例整齐；strict current 源码显示演示设置已默认折叠，仍需关注上传文字对比度。 |
| 9 | 错误识别、诊断与恢复 | 2/4 | DynamicForm 已能定位首错；strict current B 仍看到 LxForm 提交后焦点停在提交按钮。 |
| 10 | 帮助与文档 | 3/4 | API、迁移指南、代码示例和边界说明充分；帮助主要面向开发者，缺少上下文提示。 |
| **总分** |  | **29/40** | **Good（72.5%）；10 项均适用。该分数是当前基线，不代表正式审查已关闭。** |

## Design Specificity Verdict

### LLM assessment

组件视觉有 LinkX/LxUI 来源：深海蓝主色、32px 控件、12px 上置标签、4px 圆角，错误态使用指定红边和浅红底；示例中的巡防任务、责任网格、警员候选等语义也属于 LinkX 场景。作为复用组件，克制外观合理，但单看控件和文档壳层仍接近 Element Plus 管理后台通用形态。产品个性主要来自令牌和示例内容，而不是控件结构本身。

**判断：部分为产品所著；业务示例比基础控件更有 LinkX 特征。**

### Deterministic scan

源码和 Demo 的六个静态目标均为 JSON `[]`、stderr 为空、退出码 0：

- linkx-fe/src/components/LxForm
- linkx-fe/src/components/LxDynamicForm
- linkx-fe/docs/components/lxform.md
- linkx-fe/docs/components/lxdynamicform.md
- linkx-fe/src/components/LxForm/demo/basic.vue
- linkx-fe/src/components/LxDynamicForm/demo/basic.vue

这只表示静态规则在这些目标上零命中，不代表页面整体无问题。

四次 URL detector 均尝试过，但均为失败边界：stdout 为 `[]`，stderr 为 `Error: puppeteer is required for URL scanning. Install: npm install puppeteer`，退出码为 1，涉及 lxform-desktop、lxform-375、lxdynamicform-desktop、lxdynamicform-375。退出码非 0，因此这些 `[]` 不能解读为页面清洁结果。Strict current B 另对四个源码目标做了独立静态扫描，仍为 JSON `[]`、stderr 0 字节、退出码 0；这同样只表示静态规则零命中。

### Playwright browser evidence

B 评估为六个独立的新建 Playwright 页面，全部 HTTP 200，页面可写预检成功，marker 执行成功，detect.js 注入成功，pageErrors 和 failedRequests 均为空。覆盖范围如下：

| 视图 | 视口/主题 | 状态覆盖 | overlay 记录 |
|---|---|---|---:|
| LxForm 桌面 | 1280px、亮色 | 空提交错误 2 项 | 7（可见 2） |
| LxForm 窄屏 | 375px、亮色 | 空提交错误 2 项 | 7（可见 3） |
| LxDynamicForm 桌面 | 1280px、亮色 | 候选加载/失败/重试、上传列表 2 个文件 | 8（可见 5） |
| LxDynamicForm 窄屏 | 375px、亮色 | 候选加载/失败/重试、上传列表 2 个文件 | 9（可见 6） |
| LxDynamicForm 桌面 HUD | 1280px、HUD、reduced motion | HUD、候选错误、上传列表 | 194（可见 28） |
| LxDynamicForm 窄屏 HUD | 375px、HUD、reduced motion | HUD、候选错误、上传列表 | 195（可见 29） |

注入曾成功并保存了六张 overlay 截图和逐视图 JSON；捕获结束后 Playwright 页面已关闭，因此不能声称当前仍有可见的 `[Human]` 浏览器标签。CUA in-app browser 本轮不可用，Playwright/Chromium 是有记录的浏览器回退证据。注入 detector 后 375px 页面的 scroll width 变为 615px，是 overlay 自身扩展页面；未注入基线仍为 375px，不能据此判定产品横向溢出。

## 运行时命中与误报归因

### 真实命中或需要产品复核的命中

| 证据 | 位置 | 判断 | 处理状态 |
|---|---|---|---|
| low-contrast 3.2:1 | 亮色 LxDynamicForm 的 `p.dynamic-form-demo__settings-hint`，#86909c on #ffffff | 真实的 Demo 设置提示对比度不足 | **待修复，正式审查未关闭** |
| low-contrast 3.7:1 | HUD LxDynamicForm 的同一设置提示，#64748b on #101a2c | HUD 令牌下仍低于 4.5:1，应调整文字令牌或背景 | **待修复，正式审查未关闭** |
| gray-on-color | HUD 上传空态 `p.lx-upload__title`，#e2e8f0 on #152e44 | 位于组件目标内的真实色彩信号，需要按设计图和 WCAG 复核 | **待设计复核/待修复，正式审查未关闭** |
| Strict current B Playwright | LxForm 与 LxDynamicForm 无效输入均呈现 aria-invalid、aria-describedby；DynamicForm 提交后焦点落在任务名称，final A 的“ARIA 缺失/动态首错缺失”观察已被当前证据修正 | ARIA 关联和 DynamicForm 首错定位已得到运行时确认 | **已处理；仍需保持回归** |
| Strict current B Playwright | LxForm 提交后焦点仍停在“提交校验”按钮 | 两个表单的错误恢复行为不一致，LxForm 键盘用户仍需自行寻找第一个错误 | **待修复** |
| Assessment A 手工观察 | 375/390px 校验 toast 遮挡 Menu/On this page 固定导航 | 可见提示与文档导航层级冲突；strict current B 未将其作为新命中 | **待复核/待修复** |
| Strict current A/B | 动态 Demo 设置已默认折叠，首屏层级问题已由当前源码和 strict current 浏览器状态修正 | final A 的“默认展开”观察属于较早工作树状态 | **已处理；保留回归检查** |
| Strict current B Playwright | 亮色 LxUpload 辅助/成功文字 3.2:1；HUD 上传字段标签 2.8:1、辅助文字 3.7:1 | 当前可见的小字号文字低于 4.5:1 | **待修复/待设计复核** |

### 误报或低置信度命中

- HUD 的 187 个 `ai-color-palette` 命中主要落在预期的青色 HUD 控件、上传图标/按钮和 Shiki 代码语法；它们是设计令牌或示例语法的信号，不能按数量当作 187 个缺陷。
- `text-occlusion` 中的“✦ ai color palette”文字由 detector overlay 自己插入，后被工具栏、上传拖拽层或提示文案覆盖；属于 overlay 自碰撞候选。代码区的 `span.lang`、示例代码文字覆盖也主要属于 VitePress/文档壳层。
- `buried-raster` 命中隐藏的文档复制按钮，`span.container` 的 `clipped-overflow-container` 命中与文档壳层或 overlay 定位有关；基线页面没有横向溢出。
- body 的 `em-dash-overuse`、`layout-transition`、`bounce-easing` 以及隐藏元素的 `gpt-thin-border-wide-shadow` 是文档/演示壳层或 advisory 信号，不作为组件发布阻断项。

## Overall Impression

基础 LxForm 清爽、稳健，校验态贴合视觉稿；LxDynamicForm 展示了条件字段、候选状态、上传列表和 HUD 主题等真实扩展能力。当前源码已经补上 ARIA 关系、DynamicForm 首错聚焦和 Demo 设置折叠，剩余重点是统一 LxForm 的首错焦点、修复上传相关文字对比度、补齐上传约束文案，并复核移动 toast。静态 detector 清洁不能抵消这些人工和运行时证据。

## What's Working

- 32px 控件、12px 标签、4px 圆角与设计基线接近；必填错误红边、浅红底、11px 文案和感叹图标形成明确状态。
- 动态表单能按任务类型显示“支援说明”，并呈现候选成功/空结果/失败与重试、上传列表、HUD 主题等真实交互；375px 下字段和弹窗折为单列，基线无横向溢出。
- 文档提供“何时使用”、Props/schema/events、迁移指南和边界说明；桌面双列、窄屏单列的操作路径清楚。

## Cognitive Load

**当前 strict recheck：低负荷倾向，0 项已确认失败，1 项需要浏览器复验。** Strict current A 显示 Demo 设置已默认折叠、条件字段按当前类型展示；strict current B 的桌面/移动页面也复现了当前状态。视觉层级和触控长度仍应在后续改动后复验，不能把源码结构当作最终视觉验收。

- **单一焦点**：当前通过，核心表单先于演示配置。
- **一次一个决策**：当前通过，配置矩阵已收进折叠设置。
- **渐进披露**：当前通过，details 默认关闭；若后续改动重新展开，应重新打开此项。

## Emotional Journey

标题和“何时使用”先建立方向感；业务字段、具体行内错误、候选重试和上传成功状态会增加信心。低谷在窄屏：LxForm 提交后焦点仍停在底部按钮，用户要自行回顶部找字段；toast 还可能遮住文档导航，需在 strict current 后续复验。若不统一 LxForm 的首错定位，用户会以滚动搜错结束流程。

## Priority Issues

### [P1][已修复，保留为历史观察] LxForm 提交失败后没有统一定位首个错误

**为什么重要：** Strict current B 已确认 LxForm 的无效输入带有 aria-invalid 和 aria-describedby，但提交后焦点仍停在“提交校验”按钮；DynamicForm 已将焦点移到任务名称。两个同源表单的恢复路径不一致，键盘和读屏用户在 LxForm 长表中仍需自行寻找错误。  
**修复：** 让 LxForm 与 DynamicForm 共用首错滚动和焦点策略；若某些调用方不能主动聚焦，则在表单顶部提供可键盘操作的错误摘要。保留 strict current B 的 ARIA 关联回归断言。  
**建议命令：** /impeccable harden  
**历史状态：已修复并复验。** 该结论来自修复前证据；postfix 浏览器证据已确认桌面 1280px 与移动 375px 提交失败后焦点落在首个错误输入，并保留 `aria-invalid`/`aria-describedby` 关系。该项不再作为当前阻断项。

### [P2] 动态设置提示和 HUD 上传文字对比度不足

**为什么重要：** Playwright overlay 在亮色设置提示中记录 3.2:1，在 HUD 设置提示中记录 3.7:1；strict current B 还确认亮色 LxUpload 辅助/成功文字为 3.2:1，HUD 上传字段标签为 2.8:1、辅助文字为 3.7:1，HUD 上传空态标题另有 gray-on-color 命中。它们直接位于目标组件/Demo 内，影响低视力用户和 HUD 主题下的可读性。  
**修复：** 提高 `dynamic-form-demo__settings-hint` 和 LxUpload 辅助/成功文字的前景对比度；为 HUD 上传标签、辅助文字和空态标题选用达到 AA 的文字/背景令牌，并在亮色、HUD、reduced motion 视图复验。  
**建议命令：** /impeccable colorize  
**状态：** **待修复/待设计复核；本项使正式审查保持开放。**

### [P2] 移动端校验 toast 遮挡固定文档导航

**为什么重要：** 提示内容正确，但短时间内覆盖 Menu 和 On this page，用户无法判断当前文档位置或继续导航。  
**修复：** 将 toast 起点避开固定顶栏；或在文档 Demo 中使用表单内联错误状态，避免顶部浮层参与示例流程。  
**建议命令：** /impeccable adapt  
**状态：待复核/待修复；strict current B 未将其作为新 detector 命中。**

### [P2] 上传约束说明仍不够面向使用者

**为什么重要：** 组件提示使用 `image/*` 和单文件 10MB，但动态示例还配置了单张 1 个、多张 5 个的 limit；strict current A/B 均把数量上限视为仍需处理的文案缺口。  
**修复：** 显示可识别的格式名称、单文件大小和文件数量上限；若限制来自 schema，考虑由 accept、maxSize、limit 生成一致提示。Demo 设置已默认折叠，不应回滚为默认展开。  
**建议命令：** /impeccable clarify  
**状态：待修复。**

## Persona Red Flags

### Jordan（第一次使用）

- 当前 strict A/B 显示 Demo 设置已默认折叠，首屏层级问题已处理；剩余迟疑点是 `image/*` 与隐去的数量上限仍要求用户猜测接受规则。
- 候选失败和上传状态虽有文案，但缺少一句“点提交查看校验”的主路径提示。

### Sam（辅助技术依赖）

- Strict current B 已确认两套表单的无效输入都有 aria-invalid 和 aria-describedby，方向已落实；仍需修复 LxForm 提交后焦点停在按钮的问题。
- 对比度命中涉及小字号辅助文字、成功状态和 HUD 标签，必须确保文字关系和状态播报不只靠颜色。

### Casey（分心的移动用户）

- 375/390px 已折单列且没有基线横向滚动，这是优点；但测试设置、远程候选和两组上传列表拉长路径，用户需要多次滚动。
- 32px 视觉控件符合库基线，但正式移动场景应额外保留至少 44px 的触控热区。

## Minor Observations

- 候选失败文案同时出现在候选状态和 footer，信息重复；保留带“重试”的一处即可。
- 上传示例只写 image/* 和单文件 10MB，没有说明实际最多 5 个文件；strict current A/B 均仍将其列为待处理的内容清晰度问题。
- final A 中关于 ARIA 缺失、DynamicForm 首错聚焦缺失和 Demo 默认展开的观察来自较早工作树；strict current B 已分别确认 ARIA 关联、DynamicForm 首错聚焦和设置折叠，不能继续作为当前未修复项。
- HUD 深色示例的白色控件边界清楚，reduced motion 证据通过；仍需完成 HUD 上传标题对比度复核。
- 本轮没有发现基础组件的真实横向溢出；注入 overlay 后的 615px scroll width 不可作为产品缺陷。

## Priority and Processing Status Matrix

| 项目 | 来源 | 当前状态 | 正式审查结论 |
|---|---|---|---|
| aria-invalid / aria-describedby（LxForm、DynamicForm） | Strict current B Playwright | 已处理 | 保持回归；不作为当前阻断项 |
| DynamicForm 首个错误字段聚焦 | Strict current B Playwright | 已处理 | 保持回归 |
| LxForm 首个错误字段聚焦或错误摘要 | Strict current B Playwright | 待修复 | 未关闭 |
| 移动 toast 与固定导航遮挡 | A 手工评审；strict current B 未复现为 detector 命中 | 待复核/待修复 | 未关闭 |
| Demo 设置默认展开、首屏层级 | Strict current A/B | 已处理 | 保持回归；不作为当前阻断项 |
| 设置提示对比度 3.2:1 / 3.7:1 | B Playwright overlay | 待修复 | 未关闭 |
| 亮色 LxUpload 辅助/成功文字 3.2:1 | Strict current B Playwright | 待修复 | 未关闭 |
| HUD 上传字段标签 2.8:1、辅助文字 3.7:1、空态标题命中 | Strict current B Playwright | 待设计复核/待修复 | 未关闭 |
| 上传格式、大小、数量说明 | Strict current A/B | 待修复 | 未关闭 |
| 187 个 ai-color-palette、overlay 自碰撞文字、文档壳层命中 | B 归因 | 记录为误报候选 | 不作为产品缺陷 |

## Questions to Consider

- LxForm 是否应与 DynamicForm 统一首错滚动和焦点策略，避免同源组件的恢复行为不同？
- 设置提示、亮色上传辅助/成功文字和 HUD 上传标签的前景色，是否应统一收敛到满足 WCAG AA 的 LxUI 令牌？
- 上传限制是否应从 accept、maxSize、limit 自动生成面向使用者的完整说明？

## Evidence Index

- Assessment A：`.impeccable/critique/form-a-final-2026-09-30.md`
- Assessment B：`.impeccable/critique/form-assessment-b-final-2026-09-30/assessment-b-report.md`
- B 静态 detector 原始文件：`.impeccable/critique/form-assessment-b-final-2026-09-30/*detector.*`
- B URL detector 失败文件：`.impeccable/critique/form-assessment-b-final-2026-09-30/*url-detector.*`
- B 浏览器状态：`.impeccable/critique/form-assessment-b-final-2026-09-30/browser/browser-evidence.json`
- B overlay 状态：`.impeccable/critique/form-assessment-b-final-2026-09-30/browser/overlay-evidence.json`
- B overlay 截图：`.impeccable/critique/form-assessment-b-final-2026-09-30/browser/*.overlay.png`
- Strict current A（源码对照）：`.impeccable/critique/form-assessment-a-strict-current-2026-09-30.md`
- Strict current B（当前 Playwright）：`.impeccable/critique/form-assessment-b-strict-2026-09-30.md`
- Strict current B 原始证据：`.impeccable/critique/form-assessment-b-strict-2026-09-30-fresh-0738/`

## 2026-09-30 Postfix resolution

本轮复验对应当前工作树，不沿用此前“LxForm 焦点仍停在提交按钮”的旧结论：

- `LxForm` 已在真实表单根节点挂载后执行首错定位，校验失败后的桌面 1280px 和移动 375px 浏览器证据均显示焦点落在“任务名称”输入框，且 `aria-invalid="true"`。
- `LxForm` 文档 Playwright 3/3、Vue3 定向 Vitest 34/34、lx-ui `vue-tsc --noEmit` 通过；新证据位于 `.impeccable/critique/form-focus-postfix-2026-09-30/`。
- 新一轮四个源码 detector 输出均为有效 JSON `[]`、stderr 为空、退出码 0；这仍只是静态零命中，不能替代浏览器视觉证据或正式 A/B Critique。
- 原报告中设置提示、上传辅助文字和 HUD 标签的对比度问题已有 Form postfix 证据记录；当前仍需一次正式综合复评确认令牌在所有主题/状态下符合设计稿，并复核移动 toast 与文档固定导航的层级关系。

**当前结论：** LxForm 首错焦点缺陷已修复并验证；Form 组件的正式 Impeccable 关闭、52 项全库严格矩阵以及后续 Vue3 Element Plus 替换仍未完成。
