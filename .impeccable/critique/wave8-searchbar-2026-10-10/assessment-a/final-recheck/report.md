Method: assessment-a recheck (isolated; compared with Assessment A baseline only)

# LxSearchBar 修后 Assessment A 复验

## 复验范围与证据

本次复验重新读取当前源码与正式文档，并以本次 Assessment A 初始报告作为前后对照基线：

- `linkx-fe/src/components/LxSearchBar/index.vue`
- `linkx-fe/src/components/LxSearchBar/demo/basic.vue`
- `linkx-fe/src/components/LxSearchBar/types.ts`
- `linkx-fe/docs/components/lxsearchbar.md`
- `design/检索面板 SearchBar/code.html`
- 基线：`.impeccable/critique/wave8-searchbar-2026-10-10/assessment-a/report.md`

未读取 Assessment B 或任何 detector/browser 评估报告。当前会话没有浏览器自动化工具，因此未进行 live 页面、焦点、移动触控或 overlay 视觉复验。Detector 脚本在技能目录中可用，但本次只执行 Assessment A recheck，**未运行 detector**；因此下述已解决项均是源码/文档证据，不宣称浏览器验收通过。

## 前后处理状态

| 初始问题 | 当前状态 | 当前证据与剩余风险 |
|---|---|---|
| P1：折叠后隐藏字段没有数量或状态提示 | **部分解决，降为 P2** | `hiddenFieldCount` 计算隐藏项数量，按钮文案和 `aria-label` 同时播报“隐藏 N 项”（`index.vue:76-79,327-343`）；文档同步说明（`lxsearchbar.md:35`）。仍没有“隐藏字段中有几个已激活”、当前条件摘要或展开后定位，用户只能知道数量，不知道隐藏值是否影响结果。 |
| P1：组件缺少 `role="search"`/查询中状态 | **已解决（源码层）** | 根节点新增 `role="search"` 和 `aria-busy`（`index.vue:220-224`）；loading 期间根节点可被辅助技术识别。仍未通过浏览器/屏幕阅读器复验。 |
| P2：移动触控目标小 | **已解决（源码层）** | 767px 以下折叠按钮和 actions 内按钮设置 `min-height: 44px`（`index.vue:510-513`），文档同步描述（`lxsearchbar.md:35`）。仍未在真实 375px/缩放环境确认文字换行和按钮间距。 |
| P2：减少动效偏好未处理 | **已解决（源码层）** | `prefers-reduced-motion: reduce` 下关闭 chevron 过渡（`index.vue:516-520`）。范围只覆盖组件 chevron，宿主插槽/子控件动画仍由宿主或子组件负责。 |
| P1：运行时、文档和设计 API 契约漂移 | **部分解决，降为 P2 文档漂移** | 正式文档继续明确 `search` 无 payload、折叠阈值为 8（`lxsearchbar.md:21-35`），与运行时一致；设计 HTML 仍把 `@search` 写成 `(query) => void`、把折叠阈值写成“超过 4 个”（`code.html:735-756`）。运行时没有错误，但设计源仍会误导接入者。 |
| P1：设计稿 field-level error 没有类型/组件契约 | **未解决，降为 P2** | `LxSearchFieldBase` 仍没有 `error/invalid/help/aria-describedby`（`types.ts:22-30`），模板没有字段错误节点（`index.vue:229-313`），设计矩阵仍展示错误文案（`code.html:476-498`）。宿主只能借助外部 meta/自定义 slot 反馈，无法将错误绑定到对应控件。 |
| P2：Esc 全局重置且无撤销 | **未解决，P2** | section 仍监听 `@keyup.esc="reset"`（`index.vue:220-224`），`reset()` 仍清空模型并立即 search（`index.vue:200-206`）。本次没有加入确认、Undo 或“仅关闭控件”的判定。 |

## 设计特异性复验

**判定仍为中等特异性。**

修复增加了可访问性和状态可见性，但没有改变组件的视觉身份：24 列紧凑检索网格、四项首屏、token 卡片和宿主注入状态仍是明确的 LinkX 中台模式；卡片、Element Plus 控件、蓝色主按钮和通用标签仍可原样用于任意后台。设计稿的警务场景仍集中在文案和状态标本，运行时组件保持通用，这是合理的复用边界，但不会自动形成更鲜明的品牌识别。

## 新的 Design Health Score

| # | 启发式 | 分数（0–4） | 修后判断 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3 | `loading` 同时锁定动作、根节点暴露 `aria-busy`，折叠按钮显示隐藏数量；field-level error、内建结果/失败恢复仍依赖宿主。 |
| 2 | 系统与现实世界匹配 | 3 | 中文字段和中台语义自然，Enter/Esc 路径可见；设计 specimen 与正式运行时契约仍有术语/阈值漂移。 |
| 3 | 用户控制与自由 | 2 | 折叠信息更可见，仍保留 Esc 无确认重置、立即请求和无 Undo。 |
| 4 | 一致性与标准 | 2 | runtime/docs 已对齐 8 项阈值和无 payload 的 search，但设计 HTML 仍是旧 API 文字；移动和 reduced-motion 规则已有一致源码表达。 |
| 5 | 防错 | 2 | loading、disabled、`canReset` 能防重复或无效重置；没有 schema 级格式约束、字段错误或未知类型 fallback。 |
| 6 | 识别而非回忆 | 3 | “展开（隐藏 N 项）”同时提供可见和辅助技术线索；仍不显示隐藏条件中的 active 数量/值摘要。 |
| 7 | 灵活与效率 | 3 | schema、插槽、Enter、受控折叠继续支持熟练用户；无保存常用条件、折叠快捷键或批量操作。 |
| 8 | 审美与极简 | 3 | 移动 hit area 和 reduced-motion 处理补齐了使用质量；展开十项字段的认知密度和通用 Element Plus 外观仍在。 |
| 9 | 错误识别、诊断与恢复 | 2 | 宿主可注入 status，但组件依旧没有字段级定位、修复建议或失败重试/保留上次结果。 |
| 10 | 帮助与文档 | 2 | 正式文档补写了 role、busy、隐藏数量和 44px 目标；设计 API 仍过期，字段错误/Esc 风险没有被文档明确解释。 |
| **总计** |  | **25/40** | **可接受（62.5%，较初始 23/40 提升 2 分）。** |

提升来自系统状态可见性、识别线索、移动可触达性和减少动效偏好；未解决的错误契约与重置语义限制了评分进入“良好”区间。

## 认知负荷复验

| 项目 | 当前结论 | 变化 |
|---|---|---|
| 单一焦点 | 通过 | 无变化；搜索仍是唯一主任务。 |
| 分块 | 失败 | 无变化；展开态仍同时呈现 10 个字段，缺少业务分组。 |
| 分组 | 通过 | 无变化；label + control 相邻且 footer/meta 分区清楚。 |
| 视觉层级 | 通过 | 收起按钮信息更明确，层级略有改善。 |
| 一次一个决策 | 部分失败 | 无变化；高级条件没有“基础/更多/状态”分组。 |
| 最少选择 | 失败 | 无变化；展开态字段和动作超过 4 个决策对象。 |
| 工作记忆 | **部分失败** | 隐藏数量已可见，但激活隐藏条件仍需记忆；较初始有所缓解。 |
| 渐进披露 | 通过 | 从仅有折叠变成带隐藏数量的可预测披露。 |

仍有 3 个明显失败项（分块、最少选择、工作记忆；一次一个决策部分失败），总体认知负荷为**中等**。下一步应优先显示“隐藏 N 项，其中 M 项已应用”或提供已应用条件摘要，而不是继续增加视觉装饰。

## 未解决的优先问题（修后）

### P2 — 字段级错误契约缺失

设计参考仍展示错误边框、图标和行间说明，但字段类型没有错误状态，模板没有 `aria-invalid`/`aria-describedby` 或修复动作（`types.ts:22-30`；`index.vue:229-313`；`code.html:476-498`）。真实页面只能通过 meta 或自行包裹 slot 提示，用户在多条件查询失败时无法快速定位。建议明确由 schema 提供 `invalid/error/help`，或正式声明错误完全由宿主 slot 承担并提供可访问关联。

### P2 — Esc 重置仍是不可逆的全局动作

section 仍将 Escape 绑定为 `reset()`，而 `reset()` 会清空所有非默认值并立即发出 `search`（`index.vue:200-206,220-224`）。这与关闭下拉/日期面板的常见 Escape 语义冲突，且没有确认、toast 或 Undo。建议只在输入编辑态且有改动时提供清空快捷键，或为“重置全部”改用明确动作并提供一次恢复。

### P2 — 设计 API specimen 尚未同步

正式文档与运行时已统一为超过 8 项折叠和无 payload 的 `search`，设计 HTML 仍保留“超过 4 个”和 `(query) => void`（`code.html:735-756`）。这是文档/设计资产风险，不是当前组件运行时阻断；在下一次设计审查或发布前应同步。

### P2 — 隐藏条件仅显示数量，不显示已应用状态

修复消除了“用户不知道还有多少项”的主要问题，但若隐藏字段有值，按钮仍只显示“隐藏 6 项”。用户不能判断隐藏条件是否参与当前查询。建议在 count 后加入 active count，并在展开前后保持筛选摘要。

## Persona 复验

### Alex：不耐烦的熟练用户

隐藏数量、Enter 入口和 44px 目标改善了可预测性；Alex 仍会被无确认 Esc 重置打断，且没有保存/恢复常用条件或折叠快捷键。若高级筛选中已有值，只显示“隐藏 N 项”仍不足以判断当前查询上下文。

### Sam：键盘/屏幕阅读器用户

`role="search"`、`aria-busy`、`aria-expanded` 和隐藏数量 `aria-label` 是实质改善（`index.vue:220-224,327-343`）。仍缺少 field-level `aria-invalid`/`aria-describedby`，规范化 key 生成 ID 可能碰撞（如 `a.b` 与 `a-b`），错误状态和 hidden active filters 无法稳定公告。移动 44px 与 reduced-motion 已通过源码补齐，但未做浏览器验证。

### Riley：边界压力测试者

折叠数量和状态语义更容易验证；Riley 仍会发现未知 field type 只呈现 label 不呈现控件（`index.vue:229-313`），错误查询没有重试/保留结果，重复或规范化后冲突的 key 仍无诊断。

### Casey：分心的移动用户

窄屏操作目标增加到至少 44px，减少动效偏好得到处理，主要阻力下降；长字段列表仍需要回到顶部，隐藏 active 条件无摘要，离开页面后没有恢复上下文契约。需浏览器在 375px 和 200% zoom 下确认按钮换行及可视焦点。

## 次要观察

- 组件只在移动媒体查询中把 action buttons 提升为 44px；桌面仍保持 32px 紧凑密度，符合高密度后台但不应直接作为移动设计证据。
- `aria-label` 文案把隐藏数量放进按钮本身，已改善读屏；若后续增加 active count，应避免重复朗读可见文本和 aria-label。
- `filters` slot 仍没有公开 span、label 和错误语义，定制过滤项可能破坏栅格或辅助技术顺序。
- Demo 仍把状态模拟控件放在面板上方；作为开发示例清楚，直接复制到生产页会造成状态控制与结果 meta 重复。

## 复验结论

本轮修复有效解决了初始报告中“完全不知道有多少隐藏字段”、检索容器语义、查询忙碌状态、移动触控高度和减少动效偏好五类问题。其余核心风险集中在业务错误如何落到字段、Escape 的破坏性重置，以及设计资产契约漂移。建议下一轮把 field-level error 与 Esc 策略定为产品契约，再同步设计 HTML；在此之前评分为 25/40（可接受），不能宣称正式 Impeccable 双评审通过。

## 验证可用性声明

- 浏览器自动化：当前 Assessment A 上下文未暴露可用浏览器工具，未运行。
- Detector：技能脚本可用，但本次按任务边界未运行。
- 本复验仅基于当前源码、文档和设计参考的静态证据；未声称视觉截图、overlay、detector 命中或真实屏幕阅读器结果。
