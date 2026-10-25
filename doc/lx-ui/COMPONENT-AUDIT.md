# LinkX 项目组件审计报告 — lx-ui 覆盖度与设计决策底稿

## 2026-10-25 LxDynamicForm 当前版 Assessment A/B

- Assessment A 独立评分 **29/40（Good）**；字段分组、字段错误与远程/上传恢复路径较清楚。补充浏览器观察确认桌面为两列，未复现默认三列挤压，移除该已证实问题项；Light/HUD 错误辅助文案对比度为 6.46:1 / 7.27:1，关闭对比度疑虑。Demo 设置面板密度、schema 文档入口保留为低优先级 P3 观察。
- Assessment B detector 的组件、Demo、中文文档目标均为合法 JSON `[]`、stderr 空、退出码 0；仅表示静态零命中。浏览器覆盖 Light/HUD、1280/375/320px 与 reduced-motion；注入前无页面横溢、page error 或 failed request，关键字段交互已验证。overlay 注入后的移动宽度扩展属于覆盖层副作用。
- 单测 31/31；lx-ui 类型、206 模块构建、VitePress 文档构建和指定 Prettier 通过。ESLint 尚无可正确跨库根目录应用的配置，此工具限制单独记录，不作为代码缺陷证据。
- **矩阵状态**：该评估没有关闭 UI-10 严格行，当前总数仍 13/52；正式综合 Critique snapshot/trend、Enter 真实键盘焦点复核、真实读屏器和宿主后端提交仍待完成。详细过程见 `doc/PROJECT-DELIVERY-PLAN.md` 与 `doc/PROJECT-HANDOFF.md`。

## 2026-10-24 LxTransferPanel 当前版 A/B 补证

- Assessment A 独立源码/设计评审 **28/40**；未取得 A 自身浏览器证据。筛选态头部、继承授权说明、240px 高度档和中间操作列可发现性列为 P1/P2。
- Assessment B 三目标 detector 均为合法 JSON `[]`、stderr 空、退出码 0；不据此认定通过。独立 Chrome/overlay 复核桌面、375px、HUD、reduced-motion 无横溢或页面异常；组件搜索框 placeholder 实测对比度 **3.1:1**，为目标真实命中；文档站文本和全局 bounce easing 命中不计作 TransferPanel 缺陷。
- 后续先确认两种搜索框 placeholder 的颜色 token/计算样式，并补对比度；再处理筛选头部密度和低高度档的树可见空间。完整报告与证据路径见 `doc/PROJECT-HANDOFF.md` 的本条记录。
- 本次不关闭 UI-10 严格行，计数仍为 **13/52**；组件复核不等于宿主保存/loading/error 状态、真实读屏器或跨浏览器验收。

## 2026-10-25 LxTransferPanel placeholder 对比度修复

- 两个过滤输入显式使用 `--lx-text-placeholder`，修复 Assessment B 确认的 3.1:1 占位文字对比度问题；不改变主题令牌、组件 API 或筛选交互。
- TransferPanel 单测 **30/30**、lx-ui 类型/构建/文档构建通过；UI-10 仍 **13/52**。A 的头部信息密度、继承说明、低高度档和中间操作列问题继续登记，不用 detector `[]` 代替视觉复验。

## 2026-10-24 LxVirtualTree 卸载监听回归补强

- VirtualTree 单测新增 `MediaQueryList.change` 与 `window.resize` 监听器注册/卸载配对断言，**37/37** 通过；Vue3 类型、目标 ESLint/Prettier 通过。组件实现已有正确清理，本次只关闭可选测试 P3。
- 不改变 UI-10 **13/52**；设计源中 VirtualTree/TransferPanel 范围说明、长中文业务数据、真实读屏器与跨浏览器验收仍待处理，严格行保持开放。

## 2026-10-24 LxDatePicker 当前版降级复核

- 正确 lx-ui 文档配置下单测 **26/26**、文档 E2E **34/34**；系统 Chrome 三视图 overlay 无页面错误，短屏弹层保留 8px 视口边界和真实滚动提示。三目标 detector 均为合法 `[]`、空 stderr、exit `0`。
- detector/overlay 命中归因为文档壳层、Element Plus 状态色、Shiki 代码区及弹层覆盖底层 Demo 文本；未确认组件自身缺陷。A 独立评分 **30/40**，保留 320px 区间密度 P2、Demo 首屏密度 P3。
- 双代理服务返回 503，不能登记正式双路 Critique、snapshot/trend 或 UI-10 关闭；本条是降级补证，UI-10 仍 **13/52**。真实读屏器、后端契约和 Vue3 宿主迁移继续开放。

## 2026-10-24 LxDescriptions 当前版窄屏复核

- Assessment A 在 375px 双列组合发现警号复制内容仅 12px、逐字竖排；修复移动复制槽 `width:100%` 与内容 `width:auto`，Demo 对双列标签宽度设响应式上限、警号跨列。E2E 新增文本宽度/高度/横排断言，单测 **10/10**、文档 E2E **3/3**。
- 中文 API 补充复杂 `unknown` 值必须经具名插槽格式化；长状态内部展示点的 `aria-hidden` 已在浏览器证据确认。独立 A **35/40**、B 有效 detector 三件套及 overlay 浏览器证据、代码审核通过；overlay 五项归因为文档外壳。综合快照及趋势见 `doc/PROJECT-DELIVERY-PLAN.md`。
- 维持 UI-10 **13/52**；真实剪贴板授权与 NVDA/VoiceOver 未验证。下一项按矩阵复核 `LxVirtualTree`。

## 2026-10-21 LxButton 严格行关闭

- 加载固有尺寸预留、长文案与初始加载恢复实现；修复短文案居中P3、block父边界P2。普通按钮密度、唯一插槽挂载、纯图标文案例外均有中文契约，详细证据统一见计划与交接当前条目。
- 38/38单测、22/22文档E2E、最终样式专项1/1、Mock11/11；类型/两构建/格式/Lint与独立代码审核通过。隔离A35/40，B四源码合法[]/空stderr/exit0、四视图overlay实际注入并归因；两项建议修后双路定点通过。正式快照已写、趋势30/40→35/40。
- 设计映射：高度28/32/40、图标13/14/16、窄屏最小44、主次/行内语义及主题；危险深字与中性禁用保持既有可读性调整。文档双primary为非阻塞教学观察，真实读屏器/后端/宿主组合单列，不扩大为整体完成。当前严格行 **13/52**。

## 2026-10-21 LxButton SVG 档位修复

- 前置 SVG 使用已定义容器尺寸，消除 EP `1em` 覆盖；独立 A 实测1280/375px × Light/HUD 三档前后置均 **13/14/16px**、纯图标中心差0，无新增视觉问题。关闭此限定范围P3；loading增宽P2仍保留。
- 相关浏览器回归 **3/3**，代码独立审核无阻塞问题；格式/Lint、库构建、文档构建通过。隔离宿主Mock **11/11**，不等于真实业务或权限验收。
- `tmp-lxbutton-svg-a.md`、`tmp-lxbutton-svg-b.md` 保存独立局部复验：B三目标静态合法`[]`/空stderr/exit0，四视图overlay真实注入并逐类归因，无页面错误/失败请求，诊断服务已清理。正式综合评分/快照/趋势仍待补；UI-10 仍 **12/52**，不得用局部视觉或静态零命中代替整库审查。

## 2026-10-21 LxButton 行为修复与证据版本边界

- 关闭本波行为缺陷：父表单禁用被默认 `false` 截断（P1）、动态默认插槽仍沿用纯图标布局与提示（P2）。保留显式 `false` 覆盖表单的现用 EP 契约。
- 单测 **36/36**、完整按钮文档 E2E **20/20**、打开提示后切换状态专项 **1/1**，类型/库构建/文档构建/格式/Lint 通过。独立代码复审未发现阻塞问题。
- 修前 A **34/40** 与 B 三目标合法 `[]`/空 stderr/exit 0 及 overlay 证据仅为修前材料，不替代修后正式 Critique。loading 增宽（P2）、前置 SVG 实测 12/14/14 而非 13/14/16（P3）继续开放；下一波修复后补正式综合快照与趋势。UI-10 关闭数仍 **12/52**。

## 2026-10-21 Descriptions Demo 多实例主题生命周期

- **P2 修复**：独立保存/恢复根主题会造成实例相互覆盖；改用文档内部 `useDemoHudTheme` 会话，同一 Document 内统一基线、各实例独立释放。仅协调已接入的 Demo，其他主题写入者并发仍未验收。
- **验证**：主题单测 **4/4**、Descriptions 文档 E2E **3/3**、库类型、指定文件 Prettier、测试 ESLint、文档构建通过。detector JSON `[]`、stderr 空、exit 0；不据此认定正式 Critique 通过，不更新 UI-10 **12/52** 关闭数。
- **后续**：继续复杂值、复制失败替代路径与当前版正式双路证据；优先完成组件库门禁，再扩大宿主替换。

## 2026-10-20 LxMetricCard 只读语义与运行时复验

- 纯展示卡移除 hover 抬升；趋势文本两行截断并保留 `title`/`aria-label`，值保留完整 `title`，降低长文案和可点击暗示风险。
- 修复 VitePress 直接编译路径使用未暴露 `headingLevel` 的问题，改为读取 `props.headingLevel`；标题节点现可正常渲染。
- 当前证据：单测 **17/17**、文档 E2E **3/3**、类型检查、206 modules 构建、ESLint、Prettier 和差异检查通过。正式 A/B、overlay、snapshot/trend 和 UI-10 全库行仍开放；detector `[]` 不能单独作为通过依据。

## 2026-10-20 LxUpload 手动队列语义与双路评审

- **实现**：默认手动模式不再用“上传”暗示选择后已发送；触发区和按钮明确下一步，`onChange` 通过 live region 播报文件已加入待上传队列。自动上传模式保持原有文案和行为。
- **证据**：单测 **40/40**、4178 文档 E2E **9/9**；三路 detector 均为合法 JSON `[]`、stderr 空、退出码 `0`。B 浏览器覆盖 Light/HUD、1440/375/320px、reduced-motion、成功/失败/取消/禁用/拖拽，页面错误、失败请求和横溢出均为 0；触控主操作均达到 44px。
- **Assessment A**：**29/40（Good）**；P1 为手动语义（已处理）和宿主错误原文展示（待错误契约），P2 为批量聚合面板信息不足、Demo 测试控件与产品路径混杂。
- **边界**：B 记录预期失败 Mock 的 `UploadAjaxError` 控制台输出和文档长页密度，均不归因组件运行失败；detector `[]` 不单独代表正式 Critique。独立 snapshot/trend、UI-10、真实上传协议、权限和宿主迁移继续开放。

## 2026-10-20 LxMetricCard 趋势方向与标题层级复验

- **实现**：移除按 `trendStatus` 自动猜测方向的行为；仅显式 `trendDirection` 渲染 `arrow-up`、`arrow-down` 或 `minus`。新增 `headingLevel`（默认 `h3`），并从库入口导出类型；Demo、中文 API 和测试同步。
- **证据**：LxMetricCard 单测 **16/16**、4178 隔离文档 E2E **3/3**、typecheck、206 modules 构建、目标 Prettier 和差异检查通过。组件、Demo、文档 detector 均为合法 JSON `[]`、退出码 `0`；stderr 含 npm 配置弃用警告。
- **Assessment**：A **31/40**；B 浏览器覆盖 Light/HUD、桌面/窄屏/reduced-motion，卡片自身边界正常，但发现约 `630px > 390px` 的页面级横溢出，暂归文档壳层/表格待归因。
- **边界**：P2（只读 hover 暗示可点击、Demo 密度、长值截断）、正式独立 overlay/snapshot/trend、UI-10 严格矩阵、业务 API/权限和 Vue3 Element Plus 替换继续开放；detector `[]` 不单独代表通过。

## 2026-10-20 LxInput 边框与清空按钮复验

- **边框归因**：前后缀、密码和透传场景的外框由 `LxInput` 组件样式统一绘制；Demo 仅提供插槽和属性示例，不承担控件边框契约。
- **可访问性修复**：窄屏清空入口由 CSS 显示时不再设置 `aria-hidden`，避免可见操作从可访问树消失；桌面隐藏和禁用/只读不可操作语义保持。
- **行为证据**：LxInput 单测 **13/13**，基础控件文档 E2E **14/14**，覆盖普通/密码/透传/复合边框、390px 清空入口、键盘焦点和主题状态。
- **审查边界**：本条是行为与源码复验，不是正式 Impeccable A/B；detector 空数组仍不能替代独立视觉证据，UI-10、宿主迁移、权限和真实接口继续开放。

## 2026-10-20 LxMetricCard detector 复验边界

- 组件、Demo、中文文档 detector 均输出合法 JSON `[]`、退出码 `0`，stderr 含 npm 项目配置弃用警告；静态零命中不等于正式 Critique 通过。
- 当前行为证据为单测 **15/15**、文档 E2E **3/3**；两个 P1 语义风险、独立 A/B、overlay 和 snapshot/trend 仍开放。

## 2026-10-20 LxMetricCard 状态决策矩阵补强

- Demo 增加状态冲突示例，中文 API 明确显式 `status` 覆盖旧 `valueType`、`trendDirection` 决定图标、`badgeStatus` 独立控制角标；宿主失败/stale 不得转为 0。
- 单测 **15/15**、4177 文档 E2E **3/3**、typecheck、目标格式和差异检查通过；Assessment A 记录的两个 P1 语义风险仍待正式 A/B 和真实宿主契约，不关闭 UI-10。

## 2026-10-19 LxSectionTitle Demo 契约与主题证据补强

- Demo 增加 `leading` 自定义 `LxIcon`，实测它覆盖同时传入的 `icon`；中文 API 补充插槽优先级说明。
- 单测 **14/14**、文档 E2E **1/1**、目标格式检查通过；组件、Demo、文档 detector 均为合法 `[]`，stderr 为空，退出码 `0`。
- 当前仍不关闭 UI-10 全库矩阵；HUD、窄屏和键盘证据仅证明组件文档当前行为，宿主页面、权限和真实后端继续由 UI-04 追踪。

## 2026-10-19 LxSectionTitle 当前版双路复核

- 当前版单测 **14/14**、文档 E2E **1/1**、typecheck 和格式检查通过；覆盖变体、尺寸、标签、键盘、HUD、减少动效、320/375px 与 360px 容器查询。
- Assessment A **32/40（Good）**，无 P0/P1；P2 为真实内容 Demo、`extra`/`leading` 契约和 HUD 主题验证，P3 为中等宽度标题发现性与动作反馈位置。
- Assessment B 证据见 `linkx-fe/.impeccable/critique/lxsectiontitle-assessment-b-2026-10-19/`；三路 detector 为合法 `[]`/空 stderr/0，浏览器证据已保存。375px `documentWidth=478` 与 HUD 主题不完整证据保持开放。
- 本条不增加 UI-10 关闭计数；Vue3 宿主配置页、真实权限/后端和 Element Plus 替换仍按 UI-04/UI-11 后置。

## 2026-10-19 LxPagination 当前版复验与证据核对

- **验证**：单测 **5/5**、4177 文档 Playwright **3/3**，覆盖事件顺序、`autoReset`、`autoScroll`、自定义布局、背景、主题、键盘和 375px 局部滚动；未发现可复现 P0–P2。
- **证据状态**：`linkx-fe/.impeccable/critique/pagination-assessment-b-2026-10-17/` 当前不存在，不能把计划旧文案或静态 `[]` 视为正式独立 A/B；组件矩阵行继续开放。
- **宿主边界**：请求、跨页选择、分页回显和权限由宿主负责，接入须保留 `change(page, pageSize)`、`autoReset`、`autoScroll` 契约。

## 2026-10-19 LxFormErrorBanner 当前版复验与证据边界更正

- **结果**：实现/类型/Demo/中文 API 与设计约束一致；单测 **2/2**、4177 文档 E2E **1/1**、lx-ui typecheck 通过，未发现可复现 P0–P2。
- **正式审查状态**：没有独立 FormErrorBanner Critique 快照。`g2-assessment-b-2026-10-17` 的实际浏览器目标是 SearchBar/StatusSwitch，导航文本命中不构成该组件视觉证据；此前关联记录降级，不关闭 UI-10。
- **后续 P3**：`title` 可选导致空 props 生成空 assertive live region；当前真实调用均有标题，待调用契约确认后再决定必填或空状态约束。

## 2026-10-19 LxEmpty 当前版门禁复验

- **结果**：当前实现、类型、Demo、中文 API 与既有设计依据一致，未发现可复现 P0–P2；单测 **5/5**、4177 文档 Playwright **1/1**、lx-ui typecheck 和文档构建通过。
- **审查证据**：既有 Assessment A **35/40** 与 B 浏览器证据继续有效；本轮没有新的独立 Impeccable A/B，因此不把历史 detector 或静态 `[]` 当作当前正式 Critique 通过。
- **入口约定**：LxEmpty 文档 E2E 使用 `playwright.lxui.config.ts` 和 4177 文档服务；宿主 Vite 入口缺少文档页，相关失败属于环境目标错误。
- **矩阵状态**：无源码改动，不增加 UI-10 关闭数；业务页面迁移、权限按钮/文本/字段契约和真实后端联调仍按 UI-04 保持开放。

## 2026-10-19 LxInput 真实输入盒模型与前后缀高度复验

- **修复**：`.el-input__inner` 从完整外框高度改为读取 `--lx-input-content-height`，与 `prefix/suffix` 及内部槽位共用描边内内容轨道；内容元素在外框内居中，避免输入元素比前后缀高 2px。
- **验证**：复合前后缀 Playwright **1/1**、`lx-input.test.ts` **13/13**、lx-ui typecheck/build、目标格式检查通过；浏览器实际几何确认 32px 档内容三者均为 30px，390px 窄屏均为 42px。
- **门禁**：本轮只修复局部几何，不增加 UI-10 严格矩阵关闭数。Impeccable 静态 `[]` 仍需与 stderr、退出码及独立浏览器证据一起解释；页面既有低对比度建议保持原归因。

## 2026-10-19 LxMetricCard 窄卡与宿主状态契约补强

- 处理 Assessment A 的窄卡信息竞争和状态契约建议：新增卡片容器查询，在 320px 以下让标题/角标/数值/extra 分层；Demo 增加宿主 loading、empty、error 和重试反馈。
- 文档明确 `status`、`badgeStatus`、`trendStatus` 是独立维度，失败不得默认渲染为 0；组件仍保持纯展示和宿主注入边界。
- 单测 **15/15**、文档 E2E **3/3**、typecheck/build、目标格式和 ESLint 通过；本条不关闭 UI-10 严格矩阵，正式 A/B 仍需独立复验。

## 2026-10-19 LxInput 前后缀槽位垂直居中修复

- `prefix/suffix` 及内部槽位改为在完整输入外框内垂直居中，保留扣除上下 1px 描边的内容轨道；`prepend/append` 仍使用完整控件高度。
- sm/md/lg 与 390px 窄屏几何回归通过，单测 **13/13**、文档 E2E **1/1**、typecheck/build 和目标格式检查通过。
- detector 页面存在既有低对比度建议；更新技能包因网络失败，不能将本轮记作正式 Impeccable A/B 通过。

## 2026-10-19 LxSectionTitle 容器响应式与标签语义修复

- 修复 Assessment A P2：保留 viewport 回退并增加宿主容器查询；`extra` 多操作换行；`tag` 增加中文 `aria-label`。
- 单测 **14/14**、文档 E2E **1/1**、typecheck/build 通过；静态 detector 为合法 `[]`/空/0。因双路评估代理返回 503，本条仅记为修复后阶段性审查，正式 A/B/snapshot 待补。

## 2026-10-19 LxInput 前后缀内容轨道修复

- 状态：实现与定向回归完成，正式 A/B 视觉审查待独立证据归档。
- 修复：`prefix/suffix` 及内部槽位由完整外框高度改为扣除上下描边后的内容轨道；`prepend/append` 仍使用完整控件高度。
- 证据：E2E **1/1**、单测 **13/13**、typecheck/build 通过；静态 detector 的 `[]` 不单独作为审查通过。

## 2026-10-18 LxDescriptions/LxCodeSlot 双路审查与动态标签回归

- `LxCodeSlot` 现在在初始渲染和组件更新时同步宿主 `aria-label`；`LxDescriptions` 新增字段标签变化回归，单测 **10/10**，文档 E2E **3/3**，CodeSlot E2E **1/1**。
- Assessment A **32/40（Good）**，无 P0，三个 P1 仍开放：Demo 首屏竞争、长值截断发现性、复制中/失败反馈可见性。Assessment B 四个 detector 为合法 `[]`/空 stderr/退出码 `0`，8 个 Light/HUD × 桌面/移动视图注入成功，页面错误和页级横溢出为 0。
- 本条只记录当前版证据和代码回归，不关闭 UI-10 严格矩阵；真实读屏器、剪贴板、跨浏览器和 Vue3 宿主替换仍未完成。证据目录为 `linkx-fe/.impeccable/critique/descriptions-codeslot-browser/`。

## 2026-10-18 LxInput 普通前后缀高度轨道补强

- `linkx-fe/src/components/LxInput/style.css` 将高度轨道提升到所有 `LxInput` 根节点，统一 `box-sizing`、最小高度和 flex 伸展；复合 `prefix/suffix`、`prepend/append`、窄屏 44px 规则与原事件/插槽契约保持不变。
- LxInput 单测 **13/13**，lx-ui 类型检查、206 modules 库构建、VitePress 文档构建和目标 Prettier 通过；使用 `playwright.lxui.config.ts` 指向 4177 文档服务后，新增文档 E2E 与既有复合断言合计 **2/2**，覆盖根节点、包装器及槽位上下边界。
- 独立 Impeccable A/B：B 的源码 detector 为合法 JSON `[]`、stderr 空、退出码 `0`；Light/HUD × 桌面/390px 的 8/8 视图已保存截图、DOM、几何和 overlay 证据，复合根及前后缀在 28/32/40px、窄屏 44px 下对齐。移动文档壳层 `scrollWidth=630` 和 detector 命中保留待归因；静态空数组不替代综合判断，本条不关闭 UI-10 矩阵行。
- 后续登记：A 发现的 `prefers-reduced-motion`、触屏清空按钮 aria/可见性一致性，以及可用浏览器后的 Light/HUD、桌面/窄屏几何证据；`npx impeccable update` 因网络超时未改变本地引擎。

## 2026-10-18 LxVirtualTree/TransferPanel 组合 P2 复验

- `LxVirtualTree` 与 `LxTransferPanel` 当前版固定行、插槽摘要、筛选/批量、长名称、未加载项、窄屏触控和焦点恢复已用文档浏览器重新核对，合计 **48/48** 通过。
- lx-ui `vue-tsc --noEmit` 与 206 modules 构建通过；没有复现组件级 P0/P1/P2。组件库无独立 ESLint 配置，错误路径 glob 的无匹配结果不记为通过。
- `DataPermissionTree` 宿主保存与真实权限联调继续开放；下一步转入剩余基础组件矩阵和 Vue3 Element Plus 替换前置契约审计。

## 2026-10-18 LxDescriptions 当前版门禁复验

- 当前 `LxDescriptions` 源码、Demo、中文 API 和设计稿对照已重新冻结；默认两端布局、双列响应式、32px 行高、长值/状态焦点、复制字段、480px 抽屉、空/加载/错误、HUD 和减少动效均有当前证据。
- 定向单测 **9/9**、lx-ui 文档 E2E **3/3**；全量 Vue3 Vitest **61 文件/603 测试**通过。既有正式 A/B 证据仍见 `.impeccable/critique/descriptions-wave-2026-10-11/`。
- 本次未发现组件级 P0/P1/P2；真实读屏器、跨浏览器、剪贴板、后端联调和 Vue3 宿主替换继续开放。下一个组件门禁为 `LxVirtualTree`/`LxTransferPanel` 的固定行与组合 P2。

## 2026-10-18 UI-13 / Wave 28 LxUpload 进度真实性与 Demo 可访问结构收口

- 批量进度由文件百分比简单平均改为按正数文件大小加权；受控文件缺少大小时回退等权平均。Demo 外层上传字段移除嵌套 `label`，用 `aria-labelledby` 关联标题。
- 单测 **39/39**、类型检查、206 modules 构建、目标格式检查通过；Assessment A **29/40**，Assessment B 8 个 Light/HUD、桌面/375px 状态视图通过，detector 三件套为合法 `[]`/空/`0`。
- 本波修复 P1 进度认知风险，不关闭 LxUpload UI-10 严格矩阵；真实协议、鉴权、服务端取消和宿主迁移仍需可信环境。正式证据见 `linkx-fe/.impeccable/critique/upload-wave-2026-10-18/`。

## 2026-10-18 LxForm 通栏文本域宽度回归

- **实现**：`LxTextarea` 根节点补充 `width: 100%`，修复 `LxFormItem span="full"` 在双列网格中仅占左半列的设计差异；控制壳和计数反馈沿用原有状态与可访问性契约。
- **证据**：LxTextarea 单测 **14/14**、LxForm 文档 E2E **6/6**、lx-ui 类型检查和目标格式/Lint 通过；浏览器实测通栏 608px 内容轨道与文本域完全一致；两个 detector 均为合法 `[]`、空 stderr、退出码 0。
- **审查口径**：这是 LxForm/LxTextarea 的局部设计回归，不新增 UI-10 全库关闭计数；正式双路 Critique 仍需独立评估、浏览器视图和持久快照。

## 2026-10-18 LxInput 复合输入统一外框回归

- **实现**：复合输入根节点统一圆角、外框和裁切；输入内框取消独立圆角/焦点环，`prepend/append` 与输入框继续共享 sm/md/lg 及窄屏 44px 高度轨道；聚焦环由根节点覆盖完整复合控件。
- **证据**：定向 E2E **1/1**、LxInput 单测 **13/13**、lx-ui 类型检查、目标 ESLint/Prettier 和差异检查通过；detector 合法 `[]`、stderr 空、退出码 `0`，浏览器几何和焦点样式已实际核对。
- **矩阵口径**：这是已关闭 LxInput 的局部视觉回归，不增加 UI-10 全库计数；正式双路 Impeccable Critique 需独立评估和持久快照，静态 `[]` 不能单独作为通过依据。

## 2026-10-18 DynamicForm/Form 当前版文档门禁复验

- **浏览器验证**：隔离 lx-ui 文档配置下 `LxDynamicForm` 文档 Playwright **14/14**、`LxForm` 文档 Playwright **6/6**，合计 **20/20**；覆盖 375/320px、键盘展开与方向键表格、HUD/普通暗色、错误/禁用、密码 ARIA、上传单图/多图失败恢复、远程取消与迟到响应隔离。
- **静态证据**：当前源码与文档 detector 均返回合法 JSON `[]`，stderr 为空、退出码为 `0`；该结果只表示静态规则零命中，不能替代独立视觉证据。既有 Assessment B 证据位于 `.impeccable/critique/dynamicform-form-assessment-b-2026-10-17/`。
- **收口边界**：文档 P2 和当前浏览器回归已收口；`LxForm` 设计稿逐项像素对照、真实上传协议联调、Vue3 宿主替换及 UI-10/UI-11 全库门禁仍未完成，不将本条计为全库完成。

## 2026-10-18 LxTag 严格复核完成

- **实现**：关闭操作统一为 `LxIcon`，补齐 `large` 尺寸和稳定最小高度；disabled 改用专用禁用令牌，长文本在可用宽度内省略；中文 Demo/API 同步覆盖 large、disabled、closable、键盘焦点和窄屏。
- **验证**：单测 **5/5**、文档 E2E **2/2**、lx-ui typecheck/build、VitePress build、目标 Prettier/ESLint/diff check 通过。构建保留既有大 chunk 警告。
- **Critique**：A **27/40（Good）**；B 修后证据 `.impeccable/critique/lxtag-assessment-b-2026-10-18-recheck/`，detector JSON/stderr/退出码为合法 `[]`/空/0，Light/HUD × 桌面/375px/减少动效五视图注入成功。唯一组件命中 `cramped-padding` 与设计稿 small 档 `2px 6px` 一致；文档壳层命中逐项归因。
- **边界**：本条只收口 LxTag 当前组件门禁，不增加宿主 Element Plus 替换、权限中心、真实后端联调或页面引导完成度；宿主接入仍需保留 `close` 事件和 disabled 只读语义。

## 2026-10-17 DynamicForm/Form 文档信息层级复验（阶段性）

- 文档 Demo 后置最小配置、API 分组折叠和 summary 触达/焦点样式已完成；DynamicForm/Form 文档 E2E **17/17**，VitePress 构建成功。
- 两个 Markdown detector 均为合法 `[]`、stderr 为空、退出码 `0`；独立 A **30/40（Good）**。Luna B 子代理两次 HTTP 503，未形成新的浏览器 overlay/快照，因此不登记正式 Critique 通过。
- P2：窄屏表格滚动提示、折叠内 H2 的 VitePress outline 行为和更细任务分组待下一次独立 B 复验；不增加 UI-10 关闭数。

## 2026-10-17 DynamicForm/Form Assessment B 宽度归因复验

- 证据脚本在视口切换后补充布局稳定等待并重跑；两页 375px 页面级 `document/body.scrollWidth` 均为 375，overlay 后仍为 375。旧版 `474/525` 属于测量时序中间态，代码块/API 表格内部滚动不等同于页面横溢出。
- DynamicForm/Form 文档 Playwright **15/15** 通过，覆盖移动单列、错误/ARIA、键盘、禁用、HUD、减少动效、上传失败恢复和远程竞态；A 报告的两个 P1 观察已由当前证据关闭。
- P2 文档信息密度、HUD 层级、P3 键盘效率提示仍开放；正式 snapshot/trend、独立代码复审和 UI-10 矩阵登记继续后置，不增加全库关闭数。

## 2026-10-17 LxDynamicForm/LxForm 窄屏与错误焦点修复（B 待收口）

- DynamicForm/Form 单测 **30/30**、文档 E2E **15/15**；密码输入窄屏真实输入外框统一 44px，静态 LxForm 选择器错误态去除外圈，DynamicForm 保留键盘焦点环。
- Assessment A **28/40（Good）** 与 B 已完成；B 四个 detector 均为合法 `[]`、stderr 空、退出码 `0`，浏览器证据覆盖 Light/HUD、桌面/375px、错误、禁用和键盘状态。无覆盖层基线仍记录 DynamicForm `474`、LxForm `525` 的移动宽度异常，需继续定位文档代码块/表格来源；空数组不单独代表通过。
- 当前不增加 UI-10 全库关闭数；正式 snapshot/trend 和代码复审完成后再决定是否收口。真实上传协议、宿主替换和权限/后端联调仍属后置门槛。

## 2026-10-17 G2 SearchBar 与 StatusSwitch 严格矩阵收口

- `LxSearchBar` 修复第四字段选择器被压成 0px 的布局缺陷，前三个字段各占 4 列，集成操作字段占 12 列；`LxStatusSwitch` 保留旧值映射、确认竞态、只读和权限降级契约。
- SearchBar 单测 **10/10**、文档 E2E **5/5**；StatusSwitch 单测 **21/21**、文档 E2E **4/4**；lx-ui 类型检查和文档构建通过。
- Assessment A/B 已隔离复验：SearchBar 综合 **34/40**，无开放 P0/P1；四个 detector 均为合法 JSON `[]`、stderr 为空、退出码 `0`；Light/HUD × 1440/375 八个浏览器视图 HTTP 200、无页面错误和失败请求。证据见 `.impeccable/critique/g2-searchbar-postfix-2026-10-17/` 与 `statusswitch-assessment-b-2026-10-17-reverify/`，`[]` 不单独作为通过依据。
- UI-10 严格矩阵更新为 **11/52**。库级关闭不代表 Vue3 宿主已替换；SearchBar 的组织树/日期业务参数与 StatusSwitch 的宿主 API 仍由 UI-04 逐页注入和回归。
- 下一入口：完成 `LxDynamicForm`/`LxForm` 正式 Critique 和设计差异收口，再处理其余未关闭组件；`LxInputNumber` 桌面步进目标尺寸继续等待设计决策。

## 2026-10-16 UI-10 / Wave 25 LxAuthImg 严格矩阵收口

- **行为修复**：已加载的回退图在主图切为空地址时保持完成态并补发完成事件；回退图 A→B→A 通过当前元素身份校验隔离迟到事件；显式宽高加载框不受默认最小尺寸影响。
- **验证**：定向单测 **17/17**、文档 E2E **5/5**、类型检查、206 modules 构建、VitePress、Vue3 类型检查、目标格式和差异检查通过。当前版 B 证据见 `.impeccable/critique/authimg-assessment-b-final-2026-10-16/`，detector 为有效 `[]`/空 stderr/exit 0，四个浏览器视图无页面错误、失败请求或 HTTP 400+ 响应。
- **Impeccable 收口**：当前版 Assessment A **37/40（Good）**；B 的 overlay 命中全部归因到 VitePress 壳层、代码示例、props 滚动容器或 HUD 主题，未命中 LxAuthImg 节点；代码复审无可复现 P0–P2。综合报告、趋势与复验材料均位于 `.impeccable/critique/authimg-assessment-b-final-2026-10-16/`。`[]` 仅代表静态规则零命中。UI-10 更新为 **9/52**。
- **边界与下一入口**：真实后端鉴权、Vue3 AuthImg 适配和宿主组合回归仍待 UI-04/全库门禁；组件级 Critique 不替代真实联调，也不作为删除宿主 Element Plus 的依据。下一入口为 `LxMetricCard` 与 `LxSectionTitle`，随后进入 G2 `LxSearchBar` 与 `LxStatusSwitch`。

## 2026-10-15 UI-10 / Wave 24 LxActionButtons 严格矩阵关闭

- **设计与权限契约**：对照 `design/按钮体系/` 复核文字形态、三档尺寸与语义色；省略 `auth` 为公开操作，显式空值、缺少权限源或不匹配时隐藏。Demo、API 类型和权限说明一致展示并解释公开/空权限结果。
- **验证**：定向单测 **18/18**，文档 Playwright **9/9**；Vue3 类型检查/目标 ESLint，lx-ui 类型检查与 206 模块构建、VitePress 文档构建、Stylelint、目标 Prettier 和 `git diff --check` 均通过。Mock 不连接真实权限服务。
- **Impeccable 与代码复审**：Assessment A **33/40（Good）**，原权限对照 P2 已关闭，无开放 P0–P3；Assessment B 四个 detector 为有效 JSON `[]`、stderr 空、退出码 `0`，Light/HUD × 桌面/375px 的 8 个浏览器视图成功注入且无页面错误或失败请求。overlay 命中逐项归因，移动端 615px 根宽只在注入后出现，属于 detector 标注层副作用。独立代码复审批准，无可复现 P0–P3。
- **证据与边界**：A 复验见 `.impeccable/critique/assessment-a-actionbuttons-auth-contrast-20261015/assessment-a-recheck.md`；B 原始证据见 `.impeccable/critique/actionbuttons-assessment-b-final-64a2951-2026-10-15/`；综合快照 `.impeccable/critique/2026-10-15T03-34-29Z__linkx-fe-src-components-lxactionbuttons-index-vue.md`，当前趋势首条 **33/40**。UI-10 更新为 **8/52**；这只关闭组件严格矩阵行，不代表 Vue3 29 处宿主替换或真实权限联调完成。
- **下一入口**：按未关闭矩阵进入 `LxAuthImg` 严格复核；真实鉴权联调继续单独阻塞等待可信后端契约与环境。

## 2026-10-15 UI-10 历史交接：LxActionButtons

- 全菜单 Mock 预览与竞态 E2E 使用隔离端口 `31853` 复验 **10/10 通过**；该结果不改变 UI-10 组件矩阵关闭数 **7/52**，也不代表真实后端联调。
- 当时按未关闭矩阵顺序进入 `LxActionButtons` 严格复核；该组件已于 Wave 24 关闭。旧交接时 UI-10 为 7/52，当前计数见本文件顶部 Wave 24 记录。页面操作引导继续暂缓，不进入待办、执行队列或排期。

## 2026-10-15 lx-ui / Wave 23 LxButton Demo 键盘焦点复验

- **范围**：完整演示区以可见标题承接锚点焦点，命名区域通过标题建立名称；尺寸选择框增加键盘 `:focus-visible` 外框。该修复属于文档 Demo，不修改公开组件 API，也不表示 Vue3 业务宿主按钮迁移完成。
- **验证**：文档 E2E 19/19，使用 lx-ui 专用配置、隔离端口 4177；新增主题色断言后焦点专项回归 1/1。覆盖键盘到达、`:focus-visible`、Light/HUD 计算色、2px 实线外框和边界。Prettier、目标 ESLint、`git diff --check` 通过。
- **Impeccable 与代码复审**：A 初评 30/40（Good），尺寸选择器 P2 经 Light/HUD × 1440/320px 四视图复验关闭，旧 320px 工具栏 P3 未复现。B 三个源码检测器输出均为有效 JSON `[]`、stderr 空、退出码 0；四个 Light/HUD × 桌面/390px 视图注入成功且无页面错误、失败请求或 HTTP 错误。覆盖层命中逐项归因：HUD 按钮符合 `--lx-color-primary` 设计令牌，复制按钮、长文档容器、正文规则和导航图标属文档外壳或规则覆盖，不作为按钮 Demo 缺陷；`[]` 只表示静态规则零命中。代码复审曾发现焦点颜色断言缺口，已补齐并复验；最终批准，无未关闭 P0–P3。正式快照见 `.impeccable/critique/2026-10-14T16-33-46Z__linkx-fe-src-components-lxbutton-index-vue.md`。
- **矩阵边界**：本记录产生时不增加 UI-10 全库关闭数，当时为 **7/52**。`LxButton` 的全库严格矩阵行保持开放；既有组件审查与本次文档 Demo 修复均不替代完整 UI-10 行验收。A/B 证据见 `.impeccable/critique/lxbutton-wave-2026-10-14-final/`。

## 2026-10-14 UI-10 / Wave 22 LxInput 严格矩阵关闭

- **设计对照与差异**：依据 `design/表单控件八件套/code.html` 第 01 区，核验 32px 基准高度、4px 圆角、焦点/错误/禁用/只读状态、清空入口和窄屏触控目标。设计标本默认态清空图标常驻；当前实现桌面有值时 hover/focus 显示，触屏或视口不超过 640px 时有值即显示，禁用/只读不允许清空。此差异已在 API、Demo 和复核记录中说明，未发现阻塞问题。
- **行为与浏览器证据**：单测 13/13；共享基础控件文档 E2E 11/11，覆盖计数文案、窄屏工具栏键盘焦点、320/390px 清空入口显现与 44px 触控目标、键盘清空、值变化播报、表单禁用继承及标签/主题/页面宽度。针对最终两段清空说明的 320/390px 目标复验 1/1，无孤字、拆词、额外段距或横向溢出。
- **验证与审查**：lx-ui 类型检查、组件构建、VitePress 文档构建、Vue3 类型检查/生产构建、目标 ESLint/Prettier 与 `git diff --check` 通过。Impeccable Assessment A 34/40（Good），清空说明末行孤字、窄屏方法按钮失衡和桌面清空入口发现性 P3 均已复验关闭；B 的组件、Demo、文档 detector 均为合法 JSON `[]`、stderr 空、退出码 0。Light/HUD × 桌面/390px 四视图均可访问并成功注入 overlay；无页面错误、失败请求或异常响应。独立代码复审无 P0–P3。
- **命中归因、证据与边界**：detector 的 `[]` 只表示静态规则零命中。overlay 的长行命中位于文档说明/Demo 注释，遮罩命中位于 VitePress 代码复制按钮，HUD 命中对应主题令牌；移动端根文档宽度扩张只在 overlay 注入后出现，注入前无横向溢出。A 路最终报告、截图和测量数据见 `.impeccable/critique/lxinput-wave-2026-10-14/assessment-a-final-reverify-2026-10-14/`；B 路原始证据见 `.impeccable/critique/lxinput-wave-2026-10-14/assessment-b-final-content-2026-10-14/`；综合快照为 `.impeccable/critique/2026-10-14T02-31-56Z__linkx-fe-src-components-lxinput-index-vue.md`，趋势最近三次均为 34/40。UI-10 当前 **7/52**；关闭仅表示 LxInput 组件严格矩阵通过，不代表 Vue3 宿主替换、真实后端联调或人工读屏完成。
- **下一入口**：继续处理未关闭的 UI-10 组件矩阵；`LxInputNumber` 桌面步进目标尺寸 P2 仍待设计决策，不擅自改变现有 28/32/40px 外框与上下布局。

## 2026-10-14 UI-10 / Wave 21 LxTextarea 严格矩阵关闭

- **设计对照与差异**：依据 `design/表单控件八件套/code.html` 第 08 区，复核三行基准、`resize-y`、错误态、长度计数与焦点反馈。设计样例使用 `p-2.5`（10px 内边距），组件使用 8px 垂直、12px 水平间距令牌；设计标本高度约 74px，浏览器实测为 76px。2px 内边距映射差与约 2px 高度差如实登记；当前正式复核未将其判为组件级 P0–P3，不宣称像素值完全一致。
- **行为与浏览器证据**：覆盖硬截断/超限校验、初始状态静默与状态变化仅播报一次、禁用/只读计数隐藏和错误说明保留、键盘焦点、Light/站点深色/HUD、320/375px 窄屏及减少动效；overlay 注入后移动根节点扩宽属于检测覆盖层副作用，注入前页面无横向溢出。
- **验证与审查**：定向单测 14/14，共享基础控件文档 E2E 11/11；本次以隔离端口 4179 完整重跑，Select 状态断言限定在 basic Demo 且唯一性断言生效。lx-ui 类型检查、206 modules 构建、VitePress、Vue3 生产构建、目标 ESLint/Prettier、组件 CSS/HUD token Stylelint 和差异检查通过。Assessment A 31/40（Good），无 P0–P3；Assessment B 两个 detector 均为合法 JSON `[]`、stderr 空、退出码 0，六个主题/视口浏览器状态完成；独立代码复审无 P0–P3。
- **证据与边界**：正式 A/B、截图、源码锁和代码复审见 `.impeccable/critique/lxtextarea-wave-2026-10-13/current-final/`；detector `[]` 只表示静态规则零命中。矩阵关闭仅表示当前组件满足本轮已记录的严格验收口径，不代表 Vue3 宿主替换、真实后端联调或 NVDA/VoiceOver 人工读屏完成。UI-10 当前 **6/52**；下一项进入 `LxInput`，`LxInputNumber` 桌面目标尺寸 P2 继续等待设计决策。

## 2026-10-14 UI-10 / Wave 20 LxSelect 严格矩阵关闭

- **设计映射**：`design/表单控件八件套/`；桌面触发器基准 32px，390px 触屏下触发器与选项行 44px。按设计令牌复核默认/hover/focus/error/disabled、单选/多选、清空、过滤、远程加载/空/失败/重试、Light/HUD 与 `prefers-reduced-motion`；不适用的同步控件状态在 Demo/API 说明中界定。
- **行为与浏览器证据**：折叠多选摘要支持键盘展开并按表单上下文同步禁用语义；校验失败后焦点进入 combobox，修正后错误节点及播报清除。远程 loading 有确定性 E2E 文案断言，但没有可信的 loading 专属截图；六个独立浏览器上下文覆盖 Light、多选校验恢复、HUD、390px、远程失败恢复和禁用摘要。
- **验证与审查**：定向单测 15/15（两个文件）、文档 E2E 8/8；全量 Vue3 Vitest 565/565、隔离全菜单与预览回归 10/10；lx-ui 类型检查/构建、VitePress、Vue3 类型检查/生产构建和目标格式/Lint 通过。Assessment A 36/40（Excellent）；Assessment B 四个 detector 均为合法 JSON `[]`、stderr 空、退出码 0；六个独立浏览器上下文成功注入，无页面错误、失败请求或 HTTP 错误响应；独立代码复审无未关闭 P0–P2。
- **剩余与边界**：无组件级 P0–P2；文档页约 10 个目录锚点作为共享 VitePress 外壳 P3 后续整理。loading 有确定性 E2E 文案断言，但没有可信的 loading 专属截图；detector `[]` 仅表示静态规则零命中。此矩阵关闭不代表 Vue3 宿主替换、真实后端联调或读屏器人工验收完成。A/B 当前源码锁、报告、浏览器与截图证据见 `.impeccable/critique/lxselect-final-2026-10-14-post-fix/`，综合快照见 `.impeccable/critique/2026-10-14T00-42-11Z__linkx-fe-src-components-lxselect-index-vue.md`，趋势为 33/40 → 35/40 → 36/40。

## 2026-10-13 UI-10 / LxInputNumber 当前版严格复核，桌面目标尺寸 P2 保持开放

- **评审对象与评分**：本轮独立 Impeccable Assessment A 为 **29/40（Good）**；Assessment B 对组件、样式、Demo 和中文文档逐项执行 detector，均为合法 JSON `[]`、stderr 为空、退出码 `0`。`[]` 只表示静态规则零命中，不代表视觉审查通过。
- **浏览器证据**：Light/HUD × 1440px 桌面/375px 触屏四视图均成功注入 overlay。桌面 sm/md/lg 外框为 28/32/40px，步进目标高 13/15/19px；触屏目标均为 44×44px。键盘方向键、Tab、Enter、空格、边界禁用和步进反馈有效，页面无横向溢出。HUD 青色命中符合主题令牌；其余命中归因到文档长行与 VitePress 外壳。A/B 原始证据见 `.impeccable/critique/lxinputnumber-wave19-current-2026-10-13/`。
- **未关闭问题**：桌面步进目标高度仍低于 24px，列为 **P2**。在保留 28/32/40px 外框和上下竖向等分设计时，两个按钮无法各自达到 24px 高；不得将键盘或触屏证据写成桌面指针目标达标，也不得静默更改设计稿。须由设计决策确认接受密度取舍，或改版目标尺寸和排列后再复验。
- **边界与后续**：本轮没有组件源码改动，不增加 UI-10 全库关闭数；`LxInputNumber` 严格矩阵行继续开放。`LxTextarea` 已在 Wave 16 完成当前版组件级复核；下一项按未关闭的基础控件矩阵进入 `LxSelect` 严格矩阵核验。页面操作引导不在当前待办或排期中，后续由用户明确提出时再确认并纳入计划。

## 2026-10-13 UI-10 / Wave 19 Checkbox 与 Radio 四项严格矩阵登记

- **设计依据与映射**：唯一对照源为 `design/表单控件八件套/screen.png` 与 `code.html` 第 03/04 区。Radio 为 14px 靶环、6px 主色靶心，选中面保持卡片底色；hover 只强调圆环；横向选中标签用主色中字重，纵向列表保持正文色和常规字重。Checkbox 为 14px 选框，选中/半选以主色填充并显示白勾/横杠；标签 12px，图标间距 10px，横向组间距 16px、纵向 Checkbox/Radio 行距分别为 12px/8px。实现使用 `--lx-*` 与 HUD 主题令牌，并在组件级固定样式，避免依赖全局 Element Plus 桥接后发生漂移。
- **契约与适用状态**：四项均覆盖默认、选中、hover、键盘焦点、禁用、组级/`ElForm` 禁用继承、Light/HUD 和触屏 44px。Checkbox 另覆盖半选及旧 `label` 值兼容；Radio 覆盖组内方向键、中文状态播报、横向/纵向选中差异、历史只读值与减少动效。loading/empty 不适用于单个同步选项及纯选项组；字段错误由 `LxForm` 承载，已在真实表单流程验证失败、修正恢复和空错误行收敛。
- **Demo、API 与行为证据**：中文 API 文档列明标本映射、继承边界及不可适用状态；Demo 覆盖独立项、组选项、半选、旧契约、禁用、表单校验和状态反馈。Checkbox/Radio 定向单测合计 23/23，文档 E2E 16/16；包括 375px 触控尺寸、键盘、表单禁用继承、主题、窄屏文档表格及真实 `LxForm` 空错误节点探针。当前版类型检查、206 modules 构建、VitePress 文档构建、Vue3 类型检查、目标 Prettier/ESLint 及 `git diff --check` 均通过。
- **正式评审**：独立 Assessment A 36/40（Excellent）；Assessment B 的 8 个静态目标均为合法 JSON `[]`、stderr 为空、退出码 0，8 个 Light/HUD × 桌面/375px 浏览器视图注入成功且无页面错误或失败请求。`[]` 仅表示静态规则零命中，不单独代表视觉通过。综合报告与 A/B 原始材料见 `.impeccable/critique/checkbox-radio-component-final-2026-10-13/`；正式快照见 `.impeccable/critique/2026-10-13T09-44-41Z__linkx-fe-src-components-lxcheckbox-index-vue.md`，趋势为 34/40 → 36/40。独立代码复审关闭了空错误断言空数组真空通过的 P2。
- **剩余项**：无当前组件级 P0/P1/P2。桌面文档页内目录密度及未来将表格 helper 用于可编辑单元格时的方向键边界，按共享文档外壳 P3 跟踪；两项均不阻塞本次静态 API 表格与四项组件验收。真实屏幕阅读器和 Vue3 业务宿主替换属于其他交付门槛。

## 2026-10-13 UI-10 / Wave 18 Checkbox 与 Radio 当前版复核及文档窄屏 P2 收口

- Checkbox/Radio API 表格中的 `disabled` 长说明改为短摘要加折叠详情；主题颜色、HUD 状态及 `LxCheckboxGroup`/`LxRadioGroup`、`ElForm` 禁用继承边界均保留。折叠摘要最小高度 44px，键盘焦点使用品牌色外框；375px 下 7 张明显溢出表有提示、首列固定、方向键和 ARIA，3 张短溢出表不产生多余停靠。
- Checkbox Demo 区分知情确认与通知渠道，并展示授权范围必填校验、错误恢复和重置；Radio Demo 将历史只读快照独立呈现，并展示响应通道必填校验。禁用勾选/半选标记、Radio hover/纵向选中/禁用文字与中文文档同步按设计调整。
- 定向单测 23/23、当前文档 E2E 16/16；lx-ui 类型检查、206 modules 构建、VitePress、Vue3 类型检查、目标 Prettier、E2E 测试文件 ESLint 和差异检查通过。Vue3 ESLint 忽略 `linkx-fe` 文件，不计作组件库 ESLint 通过。
- 最终全量 Assessment A 为 36/40（Excellent）；Checkbox 分组及 Radio 历史态容器两项 P3 经 Light/HUD 桌面与 375px 复验关闭，无开放 P0–P2。B 的 8 个静态目标均为合法 `[]`/空 stderr/退出码 0，8 个浏览器视图均成功注入且无失败请求或页面错误。Radio HUD 两个颜色命中符合主题主色令牌；375px 根宽增加由注入的 overlay 导致。
- 独立代码复审确认空错误断言真空通过的 P2 已关闭。共享页内导航含约 8–10 个同级锚点，作为 VitePress 文档外壳 P3 留待单独评估；helper 未来如用于带可编辑后代的表格，应避免接管其左右方向键。两项均不阻塞当前静态 API 表格验收。
- 旧版文档窄屏 P2 的 8/8、六视图、A 33/40 和旧证据目录只保留为历史初验，不代表当前 Demo。当前版 A/B、代码复审、detector 三件套、截图、源码指纹、综合报告与趋势见 `.impeccable/critique/checkbox-radio-component-final-2026-10-13/`。
- 本波没有关闭 Checkbox/CheckboxGroup/Radio/RadioGroup 的 UI-10 严格矩阵行；全库仍为 0/52，不代表 Vue3 Element Plus 替换或真实后端联调完成。页面操作引导当前不执行、不纳入待办、自动执行队列或排期；仅保留需求/设计草案，用户后续明确提出时再重新确认范围和计划。

## 2026-10-13 UI-10 / Wave 17 LxSelect 当前版严格复核完成

- `LxSelect` 按 `design/表单控件八件套/` 完成实现、Demo、中文 API、禁用/错误/远程状态、键盘和窄屏对照；禁用值在 Light/HUD 均保持可读，390px 下触发器和选项行均为 44px，320px 文档页无注入前横向溢出。
- 单测 11/11、文档 E2E 3/3；本波复验的定向 ESLint、Prettier、`git diff --check` 通过。lx-ui 类型检查、206 modules 构建、VitePress 文档构建和 Vue3 生产构建已在本波实现阶段通过。
- Impeccable Assessment A 33/40（Good），无 P0–P3；B 两个源码 detector 均为 JSON `[]`、stderr 空、退出码 0，Light/HUD 桌面与窄屏及站点深色桌面五种浏览器状态均成功注入且无浏览器错误。原始 overlay 命中主要落在文档段落/属性表/代码复制控件和页面外壳；少量 Select 标签及选项命中已对照设计令牌和实测对比度检查，不构成组件缺陷。移动根文档 390px → 630px 只发生在 overlay 注入后，body 和 Demo 宽度不变。
- 独立代码复审无 P0–P3；证据与综合 snapshot/trend 见 `.impeccable/critique/lxselect-wave-2026-10-13/`。此结论只关闭 LxSelect 当前版组件级复核，UI-10 全库严格矩阵仍为 0/52，不代表 Vue3 Element Plus 替换或真实后端联调完成。
- 下一项处理 `LxCheckbox`/`LxCheckboxGroup` 与 `LxRadio`/`LxRadioGroup` 在 375px API 表格可读性 P2，随后继续按矩阵逐项复核；页面操作引导不进入当前队列或排期，后续有需要时重新评估。

## 2026-10-13 UI-10 / Wave 16 LxTextarea 当前版严格 UI 复核完成

- 对照 `design/表单控件八件套/` 完成当前版组件、Demo、中文 API、主题、焦点/错误、硬截断/校验、禁用/只读和窄屏审查。初始到限/超限保持播报静默；正常状态转为到限/超限时播报一次。disabled/readonly 校验态隐藏计数并保留错误说明。
- 单测 14/14、共享基础控件文档 E2E 11/11；lx-ui 类型检查、206 modules 构建、VitePress、Vue3 生产构建、目标 ESLint/Prettier、组件 CSS/HUD token Stylelint 和差异检查通过。VitePress `custom.css` 的 14 个属性顺序问题均位于未改动行。
- Assessment A 31/40（Good），无 P0–P3；Assessment B 两个 detector 为合法 `[]`/空 stderr/退出码 0，六个主题/视口 overlay 证据完成。overlay 注入后移动根文档宽度从 390px 扩至 630px，注入前页面无溢出、Demo 宽 342px；无 overlay 的 320/375px E2E 均通过，归因于 overlay/页面外壳副作用。独立代码复审无 P0–P3。完整证据见 `.impeccable/critique/lxtextarea-wave-2026-10-13/current-final/`。
- `LxTextarea` 当前版组件审查行关闭；全库 UI-10 仍保持 0/52，不代表 Vue3 页面替换或人工读屏验收。下一项按矩阵进入 `LxSelect`。

## 2026-10-12 Wave 15 / LxInputNumber 当前版组件级复核完成

- 按表单控件设计源复核组件、Demo、中文 API、状态和键盘行为；sm/md/lg 外框 28/32/40px，右侧上下步进贴合无间隙，`controls` 可切换显示。readonly 步进、边界禁用、长按及清理路径有测试；修正 min/max 禁用方向文案，并避免合成方向键触发宿主快捷键。
- 单测 18/18、文档 E2E 2/2、lx-ui 类型检查、206 modules 构建、VitePress、Vue3 类型检查和生产构建、目标格式/Lint 通过。正式 A 31/40（Good）；B 两个 detector 为合法 `[]`/空 stderr/退出码 0，四个 Light/HUD × 1440/390px 视图注入成功。A/B 原始证据见 `.impeccable/critique/lxinput-wave-2026-10-12/final-stepper-event-fix/`；综合 snapshot 为 `.impeccable/critique/2026-10-12T14-02-10Z__127-0-0-1-components-lxinputnumber.md`。
- 代码复审无新的 P0–P3。桌面步进目标 13/15/19px 高度依照设计稿固定外框与上下均分规则保留为待设计决策项；窄屏按钮 44×44px，键盘路径通过。错误态 Demo 和重复说明为后续 P3。桌面目标高度 P2 尚未决策，故 `LxInputNumber` 严格矩阵行保持开放，不增加 UI-10 全库 52 项关闭数；该项不阻止下一基础控件 `LxTextarea` 独立复核。

## 2026-10-12 Wave 14 / LxInput 当前版组件级复核完成

- 当前版组件、Demo 和中文 API 已按 `design/表单控件八件套/` 对照复核；已修正必填语义、清空按钮键盘支持与 44×44px 触屏目标、禁用/只读演示差异及 320px Demo 网格边界。Demo 的分组标题层级已修复为 H2 → H3。
- 最终 Assessment A 为 34/40（Good），未发现 P0–P2；组件与 Demo detector 均为合法 JSON `[]`、stderr 空、退出码 0，Light/HUD × 1440/390px 四个浏览器视图均成功注入。完整报告、overlay 归因、截图和 snapshot/trend 见 `.impeccable/critique/lxinput-wave-2026-10-12/`。
- 代码复审发现的 `autocomplete="off"` 隐私保障误述、父级表单禁用时清空按钮仍可用、清空时 `change` 说明及缺少显式禁用/只读回归均已修正。1440px 旧版文档行长命中不再作为当前结论。
- 单测 **13/13**（含父级表单禁用继承）、LxInput 文档 E2E **3/3**、邻接 InputNumber E2E **1/1**；共享基础控件 E2E 全量 6/8 的两个既有标签断言失配见交接记录。类型检查、205 个模块构建、VitePress 文档构建、Vue3 类型检查、相关 ESLint/Prettier 和差异检查通过。Stylelint 因缺少 `postcss-less` 未能启动。
- 当前版组件级复核完成；两项 P3 测试增强建议保留待后续处理。本条不增加 UI-10 全库 52 项关闭数，也不代表宿主表单、真实权限/后端或 Vue3 Element Plus 替换完成。下一基础控件项为 `LxInputNumber`。

## 2026-10-12 Wave 13 / LxButton 组件级正式复核

- 当前版 A **32/40（Good）**；Assessment B 三个 detector 均为有效 JSON `[]`、stderr 空、退出码 0，8 个 Light/HUD × 320/375/1024/1280 浏览器视图注入成功；独立代码复审无未关闭发现。
- 桌面纯图标短标签 P2 与四个标签逐项可见性测试缺口已处理；复审指出的 Ctrl+点击原页保护和主题迁移 Tooltip 可见/定位两项 E2E 缺口已补齐，完整文档 E2E 19/19。320px 工具栏高度及整段演示 region 焦点框两项 P3 决定后置。注入 overlay 引起的宽度扩张已按标签 `x + width` 归因；不得将其记录为页面自身溢出，也不得把静态 `[]` 单独视为视觉通过。
- 当前版组件级复核完成，但不增加 UI-10 全库关闭计数。下一入口为 `LxInput` 的设计严格对照、状态 Demo、行为测试和浏览器证据。
- 原始评估、综合报告和 snapshot/trend：`.impeccable/critique/lxbutton-wave-2026-10-12/final-after-label-fix/`。

## 2026-10-11 UI-10 / Wave 11 LxDescriptions 当前版正式 A/B 收口

`LxDescriptions` 已完成当前源码、Demo 和中文文档的正式双路复核。长值和长状态支持键盘读取，复制目标在窄屏达到 44px，状态/错误/重试、HUD、主题、表格焦点和 reduced-motion 均有证据；单测 **9/9**、文档 E2E **3/3**、类型、203 modules 构建、VitePress 构建、目标 Prettier 和差异检查通过。

Assessment A 原始评分 **4.1/5**，综合按 0-4 口径为 **31/40（Good）**，未确认 P0-P3。Assessment B 完成 42 个独立浏览器样本；三个当前目标 detector 均为合法 `[]`、stderr 空、退出码 0，扫描前后指纹一致。动态 overlay 归因为文档壳层、代码区、隐藏折叠内容和 HUD 令牌，不能把 `[]` 单独作为视觉通过依据。完整报告、snapshot/trend、代码复审和停服证据见 `.impeccable/critique/descriptions-wave-2026-10-11/`。

本条关闭 `LxDescriptions` 当前版组件级审查，不增加 UI-10 全库计数；桌面滚动提示一致性、采集 role 指标、真实读屏器/缩放/跨浏览器/剪贴板/后端联调和 Vue3 宿主替换仍开放。下一批按本文件基础控件矩阵继续，组件库门禁完成前保留 Vue3 `element-plus`。

## 2026-10-11 UI-10 / Wave 12 LxMetricCard 与 LxSectionTitle 正式复核

- `LxMetricCard` 完成设计稿对照、状态读屏、进度 ARIA、趋势图标、RTL、减少动效和 320/375px 验收；`LxSectionTitle` 完成三变体、标题层级、副标题/插槽、长标题和键盘反馈验收。
- A **37/40**；B 三个 detector 输出均为合法 `[]`、stderr 空、退出码 `0`，10 个新浏览器 context 的注入/overlay/DOM 证据完整；独立代码复审关闭根入口类型缺口后无 P0–P2。证据见 `.impeccable/critique/metric-section-wave-2026-10-11/`。
- LxTag 紧凑档 `padding: 2px 6px` 是设计稿 `py-0.5 px-1.5` 的实现，B 的紧凑留白命中保留为设计观察项；不因 detector 数字改规格。
- 状态：**组件库当前版正式复核完成，宿主组合回归待 UI-04**。UI-10 全库 52 项仍不因本波增加关闭数；权限、真实联调和 Vue3 Element Plus 删除继续后置。

## 2026-10-11 UI-10 / Wave 11 LxVirtualTree 插槽布局与 TransferPanel 联回归

`LxVirtualTree` 已补齐 `rowLayout`、`nodeSummary`、公开插槽 scope 类型及固定行虚拟化契约；`LxTransferPanel` 改用公开行布局，移除树行元信息的 `:deep` 依赖，窄屏长名称提供全文展开入口。定向单测 **67/67**、VirtualTree 文档 E2E **14/14**、TransferPanel 文档 E2E **33/33**，类型、203 modules 构建、VitePress、Vue3 生产构建和目标格式/Lint 通过。

Assessment A **31/40（Good）**；Assessment B 四个源码目标的 detector 均为有效 JSON `[]`、stderr 空、退出码 `0`，六个浅色/HUD × 桌面/窄屏 context 成功注入 overlay，并保存长筛选、DOM、键盘和截图证据。独立代码复审批准，无 P0-P3；旧 P3 类型注释已修正。固定行虚拟化不支持任意多行 slot 撑高，完整信息由 `nodeSummary` 的 `aria-label/title` 兜底；窄屏首屏密度、批量操作层级和 Demo 控件墙记为后续 P2。本条不增加 UI-10 `0/52` 关闭数，不代表 Vue3 页面替换或真实权限联调完成。完整证据见 `.impeccable/critique/lxvirtualtree-wave11-2026-10-11/`。

## 2026-10-11 UI-10 / Wave 11 LxDescriptions Demo 控件密度阶段性核查

`LxDescriptions` Demo 已完成控件分组和状态选择器改造，组件单测 6/6、文档 E2E 3/3、类型/格式检查和修后代码复审通过。Assessment A 为 31/40；Assessment B 三个 detector 均为合法 `[]`、空 stderr、退出码 0，但 Edge 启动失败、overlay 缺失，因此只登记阶段性证据。首屏控件密度、状态可发现性、HUD 影响范围和复制触达高度进入后续 P1/P2；本条不增加 UI-10 52 项关闭数。

## 2026-10-11 UI-10 / Wave 10 TransferPanel 选择框与桌面树行复验完成

树节点与页脚继承复选框的视觉盒统一为 14×14px；树节点点击区桌面保留 24×24px、窄屏保留 44×44px，页脚 `LxCheckbox` 标签点击区桌面最小高度 32px、无悬停设备最小高度 44px。键盘焦点和原有树行键盘模型保留。尺寸修复已合入 `ad797971`。

修前独立 Assessment A 为 33/40（Good）：桌面 820px Demo 树行名称、编码和状态挤压的 P2 由截图确认，已使元数据可收缩并由 title 保留完整值；320px 动作区拥挤的 P2 经浏览器 DOM、按钮位置和整页宽度测量排除为误报；状态/主题默认折叠的 P3 已通过动态摘要处理。Demo 交互用例现在覆盖摘要更新。

改后验证：`linkx-fe` 类型检查、203 模块构建、VitePress 文档构建、TransferPanel 文档 E2E 33/33、目标 ESLint/Prettier 和 `git diff --check` 通过。正式 A 为 35/40（Good）；B 三个目标 detector 均为有效 JSON `[]`、空 stderr、退出码 0，浏览器 overlay 成功并完成桌面/窄屏浅色/HUD 取证；隔离代码复审无 P0–P3。综合报告与 snapshot/trend 见 `.impeccable/critique/transferpanel-final-2026-10-11/`。宿主保存状态归 UI-04，元信息字号和触屏长编码全文入口留给 VirtualTree 复验。本波不增加 UI-10 52 项矩阵关闭数。

## 2026-10-10 UI-13 / Wave 9 LxUpload 回灌 abort 回归

`LxUpload` 已补 fallback UID 回灌后公开 `abort()` 的组合回归，单测 38/38；文档 E2E 首次为 7/9，服务恢复后两个用例独立重跑 2/2，当前证据合计 9/9。记录见 `.impeccable/critique/wave9-upload-2026-10-10/agent-notes.md`。真实上传协议和服务端 AbortSignal 联调仍属 UI-04，下一项进入 `LxDescriptions`、`LxVirtualTree` 当前版正式审查。

## 2026-10-10 UI-10 / G2 SearchBar、StatusSwitch 阶段性审查（降级，未正式关闭）

`LxSearchBar` 已完成当前修复：`role=search`、loading/折叠字段 ARIA、移动 44px 触控和减少动效降级；单测 8/8、文档 E2E 3/3，Assessment A 降级评分 31/40。`LxStatusSwitch` 已完成确认竞态、外部 modelValue/权限源变化和权限撤销保护、loading/只读 ARIA、Space 键盘和失败重试；单测 14/14、文档 E2E 3/3，G2 合并 E2E 6/6。

SearchBar 修后 Assessment B 的组件、Demo、文档 detector 均为有效 JSON `[]`，stderr 为空、退出码 0，并已保存亮色/HUD、1440/375px、减少动效和交互截图/DOM 证据；overlay 注入未稳定完成，`[]` 仅表示静态规则零命中。Assessment A 因浏览器不可启动为降级评审，评分 **31/40（Good）**。报告位于 `.impeccable/critique/g2-complete-2026-10-10/assessment-a/report.md` 与 `assessment-b/report.md`；没有可用统一综合报告、snapshot/trend，故 G2 与全库 UI-10 **0/52** 均保持阶段性状态。

当前仅关闭实现级检查：`linkx-fe` 的库构建、定向单测/E2E、类型和格式检查通过。不能把构建、Mock 或 detector `[]` 当作正式 Critique 通过。P1：SearchBar 四字段操作行与设计稿不一致、StatusSwitch HUD 与 Teleport 确认层可能脱节；P2：SearchBar 无 `meta` 时结果/错误状态不可见、StatusSwitch 行名未进入可访问名称、375px 复杂状态及确认/失败/只读路径缺少完整实图、文档页资源 404 待归因。Vue3 宿主 `element-plus`、权限中心和字段权限仍按计划冻结；页面操作引导当前不考虑，后续按需重新评估。

## 2026-10-10 UI-10 / Wave 7 LxTransferPanel 正式关闭

`LxTransferPanel` 已完成当前源码冻结后的严格组件审查。定向单测 **64/64**，TransferPanel 文档 E2E **32/32**；覆盖 820px 文档预览、5:2:5 桌面布局、320/390px 长名称折叠展开、筛选恢复、键盘、触控和无横向溢出。Assessment A **32/40（Good）**；Assessment B 的组件、Demo、文档 detector 均为有效 JSON `[]`、stderr 空、退出码 0，并完成浅色/HUD × 1440/390/320px overlay 和浏览器测量。`[]` 仅表示静态规则零命中，不能替代视觉证据。独立代码复审无 P0–P3。

综合报告与 snapshot/trend：`.impeccable/critique/wave7-transferpanel-2026-10-09/final-density-61/final-report.md`、`.impeccable/critique/2026-10-09T16-43-08Z__linkx-fe-src-components-lxtransferpanel-index-vue.md`。P2/P3 保留 1024px 元信息扫描密度、窄屏条目内距、整树反选发现成本和滚动提示位置；不增加 Vue3 宿主替换或 UI-10 之外的关闭数。下一项为 G2 `LxSearchBar` + `LxStatusSwitch`。

## 2026-10-09 UI-10 / Wave 7 LxTransferPanel 820px 预览复验

根据页面宽度反馈，文档 Demo 预览最大宽度设为 `820px` 并居中，窄屏使用正文可用宽度；组件 API 默认高度仍为 `380px`。`240px` 紧凑档保留为 Demo 默认，高度选择器移至示例上方常显；300px 和 380px 作为可选档。移动候选计数改为“待选”，无障碍名称同步；文档在示例旁明确本地选择不是已保存权限。

定向单测 **64/64**、TransferPanel 文档 E2E **30/30**；E2E 覆盖 1440px 居中限宽、390px 正文可用宽度、页面无横向溢出及移动标签。lx-ui/Vue3 类型检查、目标 Prettier、203 模块构建、Vue3 生产构建通过。VitePress 文档构建与最终独立 A/B 正在完成。Luna 代码复审无 P0-P2；旧完成记录中的测试计数和哈希已按 P3 建议修正。

## 2026-10-08 UI-10 / Wave 7 LxTransferPanel 正式审查收口中

`LxTransferPanel`/`LxVirtualTree` 的组件实现、中文 Demo/API 和修复已完成；桌面采用 5:2:5 轨道与 380px `border-box` 同高面板，`panelHeight` 默认 380px、最小 240px，非有限值回退为 380px。桌面树项基准行高为 32px；普通短名称保持约 32px 紧凑单行，名称省略且编码/状态同行，未加载项标记与原始键值移至名称下第二行，实际截断的长名称才提供 disclosure；窄屏保持 380px 面板并完整换行，TransferPanel 在 320–420px 窄屏为 64px、421px 起为 44px，VirtualTree 窄屏行高为 44px。行高跨断点时焦点恢复到 `treeitem` 的 P2 已修，文档站 SVG favicon 已加入。当前两组件定向单测合计 64/64，TransferPanel 文档 E2E 28/28；VirtualTree 文档 E2E 的 13 项另行统计。lx-ui typecheck、TransferPanel E2E ESLint、目标 Prettier、`git diff --check`、203 模块 lx-ui 构建、VitePress 文档构建和 Vue3 `build:prod` 均通过。Range 文本片段顶部计数曾将单行误判为折行，现以行盒高度、`nowrap` 与横向裁切重新断言，320/390/880px 通过。Vue3 构建保留既有 Less 导出、Element Plus circular chunk 与 chunk size 警告，VitePress 保留大 chunk 警告。此前组件代码复审已批准；本次断言修订的独立复审待确认。

旧 A/B 只作为修复前基线且不计正式通过；当前冻结版 Assessment B 浏览器证据已完成 **20/20**，正在收口证据索引及综合 snapshot/trend。完成综合报告和 snapshot/trend 前不登记正式通过。UI-10 仍为 0/52；Vue3 `DataPermissionTree` 替换和真实权限/后端联调属 UI-04，后者须依据真实契约验收。保留 Vue3 `element-plus`；新的严格隔离 A/B 与最新代码复审完成后再提交、推送并进入 G2 `LxSearchBar` + `LxStatusSwitch`。

## 2026-10-07 UI-13 / Wave 6 Cascader、Descriptions、VirtualTree 正式审计

当前版本 `LxCascader`、`LxDescriptions`、`LxVirtualTree` 及文档侧栏已完成统一源码冻结后的组件级行为、浏览器和视觉复验。VirtualTree/Descriptions 定向单测 18/18、6/6，文档 E2E 3/3、3/3；Vue3 全量单测 58 个文件/457 个测试；lx-ui 类型检查、库构建、文档构建和 Vue3 类型检查通过。独立代码复审批准，无可复现 P0-P3。

Assessment A 为 35/40（Good）。Assessment B 的 7 个源码/文档目标均保存 JSON、stderr、退出码，结果为有效 `[]`、stderr 空、exit 0；四个新标签完成 overlay、键盘、HUD、错误/空态和 375px 证据。`[]` 仅表示静态规则零命中，B 使用隔离 Playwright fallback 的限制已写入报告。正式综合报告为 `.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/final-report.md`，原始证据、指纹和生命周期记录位于同目录。

本波关闭组件级审核门禁，但不增加 UI-10 52 项全库严格矩阵关闭数。Demo 控制区渐进披露、VirtualTree 自定义插槽行高契约和 Cascader loading 触发器语义列入后续 P2/P3；`LxTransferPanel` 进入下一波，继续对照 `design/虚拟滚动树 + 双栏穿梭/` 后再进行 Vue3 `DataPermissionTree` 宿主替换。

## 2026-10-07 Wave 5 选择器组件正式审计

`LxTreeSelect`、`LxCascader`、`LxSelectPagination` 已完成当前源码冻结后的行为、浏览器和视觉复验。定向单测 36/36、文档 E2E 15/15；A 32/40（Good），B 对 9 个源码/Demo/文档目标取得有效 JSON `[]`、空 stderr、退出码 0，并完成 9 个独立 overlay 场景；独立代码复审无 P0–P2。完整证据见 `.impeccable/critique/wave5-tree-select-pagination-2026-10-07/`。

本波修复了 SelectPagination HUD 令牌、Cascader 375px 长标签和三份文档选型说明。A 保留四项 P2：移动换行密度、错误后的旧成功状态、主题开关入口不对称、文档侧栏同级密度；另有长节点实际换行 E2E 的 P3 覆盖增强。静态 detector `[]` 只表示零命中，不作为视觉通过；本波不增加 UI-10 52 项矩阵关闭数。下一批按审计优先级进入 Upload 组合 abort 回归及数据展示/复杂交互组件。

## 2026-10-07 UI-13 / Wave 4 严格复验结论

`LxDatePicker`、`LxDynamicForm`、`LxUpload` 已完成统一源码冻结后的独立 A/B、代码复审和浏览器复验。A 设计评分 30/40（Good），没有 P0–P2；B 对三组件源码和三份中文文档共六个目标保存 JSON、stderr、退出码，均为有效 `[]`、stderr 为空、exit 0，并在 10 个新 context 覆盖 Light/HUD、桌面/375px、校验/上传/日期弹层状态。Overlay 命中已归因到 HUD 令牌、文档壳层、预期浮层覆盖和隐藏节点；移动文件名省略由 `title`、完整文本和操作标签保留可访问名称。定向单测 89/89，文档 E2E 43/43，目标格式、类型、203 模块构建和文档构建通过。

端口复验：4176 被另一项目占用后，lx-ui Playwright 与 DynamicForm/Switch 本地来源校验已统一隔离到 4177；三页组件 E2E 43/43、Switch 兼容 6/6 均通过。

本结果关闭本波组件级行为与视觉复验，不增加 UI-10 52 项严格矩阵的全库关闭数：`LxForm` 设计图逐项对照、真实上传服务端协议/取消、真实业务页面采用和整站 UI-11 Critique 仍开放。Wave 5 A 32/40、B 9 项 detector 与 9 个浏览器场景、代码复审无 P0–P2；移动换行密度、错误旧状态、主题入口不对称和侧栏密度四项 P2，以及长节点 E2E P3，列入下一批文档/壳层整改。Snapshot 已保存；下一审查批次为 Upload 组合 abort 回归和数据展示/复杂交互组件。

## 2026-10-07 UI-13 / DynamicForm、DatePicker 与 Upload 修后复验（过程记录）

本条保留统一冻结前的过程数据：DatePicker/DynamicForm/Upload 定向单测 **88/88**、文档 Playwright **36/36**；随后补充短视口与文件名回归并以顶部正式结论为准。真实上传服务端联调及 `LxForm` 设计图完整对照仍不包含在本次验收内。

## 2026-10-06 UI-13 / DynamicForm 与 Upload 复审更正

独立复审发现并修复了 `LxUpload` 多实例回退 UID 冲突：UID 前缀序列现由 `LxUpload/uid.ts` 模块级工厂生成，同一父组件内两个实例对相同无 UID 文件的单测通过。DatePicker/DynamicForm/Upload 单测为 69/69、修复后文档 E2E 13/13，lx-ui 类型检查、203 模块构建、VitePress 文档构建和目标 Prettier/Vue3 ESLint 通过，文档构建保留大 chunk 警告。第二次独立代码复审核准，未发现可复现 P0–P2。此前 Impeccable A 与 B 使用不同文件冻结且 B 浏览器证据不完整，不能登记为正式 Critique；当前统一冻结后的隔离 A/B 待完成。该复审修复和组件级验收仍不关闭 `LxForm` 设计差异、真实上传联调或 52 项 UI-10 严格矩阵，当前仍为 0/52。

## 2026-10-06 UI-13 / DynamicForm 与 Upload 组件验收

`LxDynamicForm` 的字段子组件、公开 Lx 控件组合、受控值兼容、远程查询、日期范围与上传映射已完成组件级实现和行为回归；默认 `daterange` 清空值明确为 `null`，并由 LxDatePicker 类型、DynamicForm 事件、Demo 和测试共同覆盖。`LxUpload` 受控重试队列、取消迟到回调、文件元数据回灌和跨实例 fallback UID 唯一性由回归覆盖。定向单测 69/69、UID 修复后文档 Playwright 13/13，lx-ui 类型检查和目标 Prettier/Vue3 ESLint 通过；生产库及文档构建待修后补跑。独立代码复审发现的 UID 重号已修复。此前 Impeccable A/B 源码冻结不匹配且 B 浏览器证据不完整，统一冻结后的正式 A/B 与 snapshot/trend 待重新执行。即使组件级 Critique 完成，也不等于 `LxForm` 全部设计差异关闭或本组件行达到统一 UI-10 严格口径。严格矩阵仍为 0/52。真实 adapter 服务端取消另需宿主协议验收。

## 2026-10-06 Wave 3 / LxIcon 修后复核

`LxIcon` 修后独立 Assessment A/B、浏览器 overlay 和代码复审均已完成。A 修后 37/40（修前基线 33/40）；B 对组件与文档各扫描一次，均为有效 JSON `[]`、stderr 0 字节、退出码 0，并在五个新浏览器 context 成功注入 overlay。命中已逐项归因到 CJK 字符宽度误报、Shiki/VitePress 文档壳层或 code-copy/导航规则误报，没有落在图标控件节点。单测 7/7、文档 E2E 当前配置复跑 2/2（单 Chromium 项目，独立浏览器评估覆盖 375px）。展开 P1/P2 分组仍需浏览 26/29 项，保留 P2；代码复审建议 E2E 直接比较图标名称集合，保留 P3，因此不增加 52 项严格矩阵关闭数。真实读屏器、真实权限菜单畸形数据和无 URL console 404 仍未覆盖/归因。综合报告为 `.impeccable/critique/wave3-lxicon-2026-10-06/final-report.md`，snapshot 为 `.impeccable/critique/2026-10-06T02-52-50Z__linkx-fe-docs-components-lxicons-md.md`。

## 2026-10-06 LxPasswordInput 严格复核进度

当前版独立 Assessment A 为 32/40，Assessment B 完成源码/Demo/文档三项有效 detector 与浏览器 overlay；三个 JSON 均为 `[]`、stderr 空、退出码 0。11 个 overlay 目标归因为 HUD 深色主题提示重复节点及 VitePress 文档表格/壳层，不是密码输入控件缺陷。修复后的移动锚点、暗色 Demo 和 44px 设置标签均经浏览器与 E2E 验证，独立代码复审批准。正式证据见 `.impeccable/critique/wave1-lxpasswordinput-2026-10-05/final-recheck-2026-10-06/`。仍需在 Form/DynamicForm 波次补真实宿主表单校验失败集成示例，严格矩阵行暂不关闭。

## 2026-10-05 Wave 2 / LxSwitch 复验状态

`LxSwitch` 已完成组件实现、Demo、中文 API、行为回归及独立代码复核。单测 14/14、文档 Playwright 6/6；Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、196 模块构建和文档构建通过。独立代码复核批准，未发现可复现的 P0–P2 代码问题。Impeccable 双路评审为 32/40；这是以 29/40 为基线的有界复评，仅更新三项启发式，不是全量重新评分。组件、Demo、中文文档 detector 都是有效 `[]`、stderr 空、退出码 0，仅代表静态规则零命中。实现提交为 `1679d9c`，综合报告和浏览器证据见 `.impeccable/critique/wave2-lx-switch-2026-10-05/`。

剩余事项分属共享文档壳层与宿主业务：移动侧栏关闭时的键盘顺序列入后续壳层复验；生产高影响操作的确认、审计和失败补偿须按真实宿主/API 契约验收；专业术语释义列为中文文档改进。它们不应由 LxSwitch 通用组件臆造。本次完成 LxSwitch 组件级复核，但以上交叉事项未关闭前不增加 52 项统一严格矩阵的关闭计数。其后续基础控件及动态图标子项已处理，DynamicForm/Upload 当前状态见本文件顶部；下一项按详细计划为 TreeSelect/Cascader 当前版正式复验。

## 2026-10-05 Wave 2 / Checkbox 与 Radio 复验状态

`LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup` 的实现、中文 API/Demo、单测 20/20、文档 E2E 4/4、构建及独立代码复审已完成。Impeccable A 为 34/40；B 完成两组亮色/HUD/触屏/禁用/键盘/减少动效状态检查，Radio 与 RadioGroup 的最终版 overlay/preflight 16/16，触屏目标 44px 实测通过。四个源码目录和最终 Radio Demo 的 detector 均为有效 `[]`、stderr 空、退出码 0；仅代表静态扫描零命中。A 提出的 375px API 表格阅读 P2 仍开放；严格矩阵行继续保持待整改。证据及综合快照见 `.impeccable/critique/wave2-checkbox-radio-2026-10-05/`。源码/E2E 提交 `be86f10`。

## 2026-10-05 Wave 2 / LxSelect 复验状态

`LxSelect` 已补齐远程失败时弹层开合两态就近恢复、HUD token 局部作用域、Teleported option 描述样式、设计样本中的单项离线禁用状态及触屏/窄屏 44px 选项行；中文 API/Demo 已同步，组件单测 10/10、当前文档 E2E 3/3，类型、库构建、文档构建和 Luna max 独立代码复审通过。主会话阶段检查及独立评估的证据边界见 `.impeccable/critique/wave2-lx-select-2026-10-05/`。Assessment A-only 暂定 29/40；正式 Critique 仍缺当前版 overlay、持久截图和 snapshot/trend；detector 有效 `[]` 只代表静态零命中。本矩阵仍为 **0/52 个公开组件按统一严格口径关闭**；下一基础控件子项为 Checkbox/Radio。

## 2026-10-04 基础控件 P1 复核

代码审核发现并定位到 `LxPasswordInput` 透传 `$attrs` 会允许 `type="text"` 绕过密码遮罩；当前已从透传属性中剔除 `type`，新增显隐往返及只读组合回归，7/7 通过，修后独立代码复审批准、未发现 P0–P2。剪贴板契约统一为默认允许，`preventClipboard` 仅为前端事件策略。Wave 1 的正式浏览器 overlay/snapshot 尚缺，因此该批不计入 52 项严格关闭数。

## 2026-10-03 UI-10 Wave 6 交付与审查状态更正

`LxTreeSelect` 与 `LxCascader` 的实现、Demo、API、单测和文档 E2E 已完成：单测 17/17，VitePress Playwright 8/8。当前源码与两份文档的 detector 均为有效 `[]`、stderr 为空、退出码 0，仅代表静态规则零命中。现存 10 月 2 日 overlay 截图早于当前代码/文档修改；本次浏览器策略拒绝 overlay 注入预检，因此当前版本缺少正式 Critique 所需的 overlay/复验，两个组件不登记为严格 UI-10 已关闭。既有 Assessment A 建议已落实，P3 观察项继续跟踪。本矩阵当前 **0/52 个公开组件按统一严格口径关闭**。

## 2026-10-02 UI-10 Wave 6 修后复验进行中

- TreeSelect 多选 footer 的内置中文硬编码改为 locale-aware 中英文默认和逐项覆盖；`selectedText` 支持 `{count}`。多选提交/取消语义及 footer slot 未改。
- Cascader 对并发 `loading`/`error` 采用 loading 优先规则，只有 loading 结束后 error 仍然存在才暴露错误、无效输入状态及 retry；Demo 删除路径与 last-action 双重读屏播报并分组演示控制。
- 修后行为单测 17/17、文档 E2E 5/5、lx-ui typecheck/build/docs build 及 Vue3 vue-tsc/Prettier 通过。组件库无独立 ESLint 配置；Vue3 ESLint ignored 外部路径不计通过。
- 前置 A/B 仅用于确定本次问题；修后 A/B 正在独立评估。完成建议复验、综合 snapshot/trend 前，矩阵状态仍“待严格复核”，不增加 0/52 严格关闭计数。前置 detector `[]` 是静态零命中，不是视觉通过。

## 2026-09-30 基础组件审查批次登记

除 `LxForm`/`LxDynamicForm` 外，基础控件本身也必须逐项严格对照设计：`LxButton`、`LxInput`、`LxInputNumber`、`LxTextarea`、`LxSelect`、`LxDatePicker`、`LxCheckbox`/`LxCheckboxGroup`、`LxRadio`/`LxRadioGroup`、`LxSwitch`、`LxPasswordInput`。矩阵关闭条件与其他组件相同：设计源、实现/token、Demo/API、行为测试、浏览器状态证据、代码审核和 Impeccable A/B 均齐备；不以 Element Plus 内核可用或 detector `[]` 代替视觉对照。

## Wave 5 postfix 审计状态（2026-09-30）

- `LxDialog`、`LxDrawer`、`LxEmpty`、`LxPageCard`、`LxFormErrorBanner` 已完成实现、定向行为回归和独立 A/B 证据收集；Assessment A 为 34/40（Good）。
- Assessment B 的源码/文档 detector 均为有效 `[]`、stderr 为空、退出码 0；Playwright 证据覆盖亮色/HUD、桌面/375px 和关键交互，保存 16 张截图及 sidecar，外部请求 0。因 CUA 不可用，B 标记为 `DEGRADED`。
- 已关闭上一轮 P1：portal HUD 主题断层、Drawer Escape 默认关闭、PageCard 错误恢复和窄屏 API 表格撑破页面。仍保留 P2/P3 设计建议，且 UI-11 全库正式矩阵不能由本波单独关闭。

## Wave 5 组件证据（2026-09-30）

本波完成 `LxDialog`、`LxDrawer`、`LxEmpty`、`LxPageCard`、`LxFormErrorBanner` 的实现与阶段性验收：对应 Demo/API、17 项定向单测和 7 项文档 Playwright 均通过；lx-ui 类型检查、构建和文档构建通过。浏览器证据保存在 `.impeccable/critique/wave5-2026-09-30/`，包含亮色/HUD、桌面/375px 截图、可访问性状态和无外部请求结果；Drawer 移动端截图在过渡完成后重拍，面板为 375px 全宽且页面无横向溢出。源码 detector JSON `[]`、stderr 为空、退出码 0 只代表静态规则零命中。

Wave 5 的独立 Assessment A/B、综合报告和 snapshot/trend 已落盘；B 由于 CUA 不可用使用 Playwright fallback，保留 `DEGRADED` 限制和剩余 P2/P3 建议。另登记 Element Plus 桥接缺口：`linkx-fe/src/components/LxForm/demo/control-bridge.vue` 直接使用 `ElTabs`/`ElTabPane`，待后续 UI-10 对照时补齐专用封装或明确桥接边界。

## UI-13 表单专项复验补丁（2026-09-30）

- 根据 Form/DynamicForm Assessment A 的真实发现，`LxDynamicForm` 新增可选 `field.feedback` 契约：状态文案贴在对应控件下方，并支持由宿主注入 `retry()` 与自定义按钮文案；错误反馈使用 `role="alert"`、稳定 ID 和 `aria-describedby`，不再把远程负责人失败提示孤立放在演示设置或表单底部。
- 动态表单 Demo 默认仍只展示可填写表单；布局、禁用、HUD 与候选 Mock 控制保留在默认关闭的“演示设置（布局、禁用、主题与 Mock 状态）”中。候选成功数量仍只在设置区显示，空结果/加载/失败状态移到“负责人”字段，避免重复错误文案。
- `LxDynamicFormFieldFeedback` 已同步导出、中文 API 文档、类型回归测试；宿主 `retry` 只触发已有恢复流程，网络请求继续由宿主按 `.then().catch().finally()` 编排。该补丁不改变 52 个组件“0/52 正式关闭”口径，仍需库级 UI-10 矩阵与 Impeccable 正式 A/B。

## 2026-09-30 当前完整清点（后续以本节为准）

旧版调研是 15 个组件时期的历史快照，不能代表当前库规模或 Element Plus 覆盖度。按 `linkx-fe/src/index.ts` 的 `componentRegistry` 逐项核对，当前公开注册 **52 个 Lx 组件**，另有 `lxMessage`、`lxConfirm` 两个反馈服务 API；源码中有 47 个组件目录，Sidebar 的子组件和 FormItem 等复合导出共用父目录，因此目录数不等于公开组件数。表格下方的旧统计和“明确排除组件”结论只保留作历史调研，不作为当前实施清单。

当前任务是对 52 个注册组件逐项做严格视觉对照。此前的单组件功能测试、局部截图或桥接页验收可作为证据，但没有完成本轮统一矩阵记录前，一律不视为全库严格对照完成。**基础组件内部使用 Element Plus 作为行为内核是允许的；对外公开和业务组合必须使用 Lx 封装，并由 Lx token/样式落实视觉稿。**

### 有直接视觉资产的组件

| 当前设计源                                                                                | 必须纳入对照的公开组件                                                                                                                                                                                                                 | 严格对照状态                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design/按钮体系/`                                                                        | `LxButton`、`LxActionButtons`                                                                                                                                                                                                          | LxButton 当前版组件级 A/B 与代码复审于 2026-10-12 完成；两项 P3 后置。LxActionButtons 与 UI-10 全库矩阵仍开放                                                                                    |
| `design/表单控件八件套/`                                                                  | `LxForm`、`LxFormItem`、`LxDynamicForm`、`LxInput`、`LxTextarea`、`LxRadio`、`LxRadioGroup`、`LxCheckbox`、`LxCheckboxGroup`、`LxSwitch`、`LxSelect`、`LxDatePicker`、`LxInputNumber`、`LxPasswordInput`、`LxCascader`、`LxTreeSelect` | TreeSelect/Cascader 当前版 A/B、浏览器和代码复审已完成，保留移动密度与状态一致性 P2；LxForm/DynamicForm 与基础控件仍按设计逐项核验。无 Cascader 专属稿时按 Select 控件外形与本设计源状态令牌验收 |
| `design/高频核心 13 枚/`、`design/中频 27 枚/`、`design/常用联想 29 枚/` 与 `doc/LxIcon*` | `LxIcon`                                                                                                                                                                                                                               | 按图标路径、命名、尺寸、动效触发/结束、主题、键盘及减少动效逐项核验                                                                                                                              |
| `design/检索面板 SearchBar/`                                                              | `LxSearchBar`                                                                                                                                                                                                                          | 待纳入全库矩阵复核字段密度、展开/收起、响应式及操作层级                                                                                                                                          |
| `design/状态开关 StatusSwitch/`                                                           | `LxStatusSwitch`                                                                                                                                                                                                                       | 待纳入全库矩阵复核开关轨道、状态色、只读/加载及确认反馈                                                                                                                                          |
| `design/上传拖拽区 Upload/`                                                               | `LxUpload`                                                                                                                                                                                                                             | 待纳入全库矩阵复核拖放区、列表、进度/失败/重试及移动操作                                                                                                                                         |
| `design/详情描述行 Descriptions/`                                                         | `LxDescriptions`                                                                                                                                                                                                                       | 当前版长值/长状态展开收起、键盘、HUD、375px 和 reduced-motion 已有单测 10/10、文档 E2E 3/3 与 B 证据；真实详情宿主和 UI-10 全库 Critique 仍开放 |
| `design/虚拟滚动树 + 双栏穿梭/`                                                           | `LxVirtualTree`、`LxTransferPanel`                                                                                                                                                                                                     | 待纳入全库矩阵复核树密度、选中/禁用、双栏比例、空/加载和窄屏交互                                                                                                                                 |
| `design/远程分页下拉 SelectPagination/`                                                   | `LxSelectPagination`                                                                                                                                                                                                                   | 当前版行为、15 项文档 E2E、A/B 和代码复审已完成；保留严格矩阵中的设计差异与 P2 文档壳层整改                                                                                                      |
| `design/指标卡 MetricCard/`                                                               | `LxMetricCard`                                                                                                                                                                                                                         | 待纳入全库矩阵复核数值层级、语义色、趋势/进度和窄屏排列                                                                                                                                          |
| `design/区块标题 SectionTitle/`                                                           | `LxSectionTitle`                                                                                                                                                                                                                       | 待纳入全库矩阵复核变体、图标、标签、标题截断和对齐                                                                                                                                               |

### 按组件规范和既有唯一视觉源对照的组件

下列组件没有单独的 `design/` 画板时，不能据此沿用 Element Plus 默认视觉；须以 `doc/lx-ui/DESIGN-SPEC.md`、`COMPONENT-SPEC.md`、`COMPONENT-STYLE-INTERACTION.md` 中适用章节为准。侧栏家族的唯一视觉源是 `doc/stitch_侧边栏/stitch_/`。每个条目同样要补当前源码、Demo、主题/尺寸/状态浏览器证据和复验结论。

| 规范/视觉源                                     | 必须纳入对照的公开组件                                                                                                                                                                                                                            | 严格对照状态                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `doc/stitch_侧边栏/stitch_/` + `DESIGN-SPEC.md` | `LxSidebar`、`LxSidebarBrand`、`LxSidebarItem`、`LxSidebarGroup`、`LxSidebarFooter`、`LxGauge`、`LxNodeBadge`                                                                                                                                     | 待全库视图逐项复核 rail/expanded、菜单状态、焦点、动效和窄屏抽屉               |
| `DESIGN-SPEC.md` + 对应组件 API/交互规范        | `LxNavbar`、`LxBreadcrumb`、`LxTabsBar`、`LxSplitLayout`、`LxPageCard`、`LxProTable`、`LxPagination`、`LxEmpty`、`LxStatusDot`、`LxTag`、`LxCodeSlot`、`LxSelectTree`、`LxDialog`、`LxDrawer`、`LxFormErrorBanner`、`LxDutyCalendar`、`LxAuthImg` | 待全库视图逐项复核；已有专项行为证据保留，但需补齐当前实现与规范的视觉差异记录 |
| `DESIGN-SPEC.md` §2、§6–§9 + `LxDialog` 规范    | `lxMessage`、`lxConfirm`（服务 API，不计入 52 个注册组件）                                                                                                                                                                                        | 对照反馈类型、语义色、字号、位置、时长、键盘关闭和减少动效                     |

### UI-10 统一完成门槛

1. 每个注册组件对应一个可信设计源，并记录关键数值或状态；直接设计资产优先于通用规范，旧版/压缩包仅用于追溯。
2. 对照默认、hover、focus、disabled、loading、error、empty、明暗主题、窄屏和 `prefers-reduced-motion` 中适用的状态；不可适用项说明原因。
3. 公共组合只使用 `Lx*` 导出；若库内暂时没有专用控件，则明确登记缺口和允许从 lx-ui 导出的 Element Plus 备选。Element Plus 实现可作为 Lx 包装内部的行为内核，不等于视觉对照完成。
4. Demo、中文 API 文档、行为测试和浏览器证据同步；记录 `component → design source → implementation/token → evidence → residual issues`。检测器 `[]` 只代表对应源码静态规则零命中。
5. 全量矩阵关闭后，先完成 lx-ui 组件/动效 Impeccable 正式复验和建议处理，再进入 Vue3 Element Plus 替换；替换完成后另做 Vue3 整站审查。

### 52 个公开组件逐项验收矩阵

本矩阵与 `src/index.ts` 的 `componentRegistry` 对齐。只有“当前矩阵状态”更新为已关闭，且记录设计差异、修改、Demo/API、行为测试、浏览器状态证据与剩余项，组件才算通过 UI-10。已有单测、局部截图或旧 Critique 只作支持证据。当前 **13/52 已按统一严格口径关闭**；TreeSelect/Cascader/SelectPagination 的组件级 A/B 已完成，但各自 P2 与全库设计矩阵仍未关闭。

| 公开组件             | 唯一对照源                                        | 当前矩阵状态                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LxActionButtons`    | `design/按钮体系/`                                | **已关闭（Wave 24）**；33/40，原权限对照 P2 关闭，18/18 单测、9/9 文档 E2E、8 个 A/B 浏览器视图及独立代码复审通过；Vue3 宿主替换待 UI-04                                                     |
| `LxAuthImg`          | `DESIGN-SPEC.md` + 组件 API/Demo                  | **已关闭（Wave 25）**；A 35/40、B 四视图及 detector 证据、15/15 单测、5/5 文档 E2E 和代码复审通过；真实鉴权联调与 Vue3 宿主适配另列阻塞                                                      |
| `LxBreadcrumb`       | `DESIGN-SPEC.md` + 导航规范                       | 待严格复核；保留现有宿主导航契约                                                                                                                                                             |
| `LxButton`           | `design/按钮体系/`                                | **已关闭（2026-10-21）**；当前A35/40、B四视图及四源码三件套、独立代码复核与正式快照/趋势齐备；38单测、22文档E2E、最终样式专项通过。loading/居中/block边界已修，文档教学观察与真实宿主验收单列 |
| `LxCascader`         | `design/表单控件八件套/`（无专属画板）            | 当前版单测/E2E、A/B 和代码复审完成；P2 为移动换行密度、错误旧状态、主题入口；按 Select 控件外形与状态令牌映射                                                                                |
| `LxCheckbox`         | `design/表单控件八件套/`                          | **已关闭（Wave 19）**；14px 三态、hover/focus/disabled、旧 label 兼容、Light/HUD 与 44px 触屏均有当前版证据；23/23 单测及 16/16 合并 E2E 见 Wave 19 记录                                     |
| `LxCheckboxGroup`    | `design/表单控件八件套/`                          | **已关闭（Wave 19）**；16px 水平/12px 垂直间距、半选、禁用继承、值过滤及键盘/触屏行为均有当前版证据；剩余仅非阻塞 P3                                                                         |
| `LxCodeSlot`         | `DESIGN-SPEC.md` + 组件 API/Demo                  | 当前版 A 30/40、B 四视图与 detector 三件套完成；已补 aria 名称合并、复制忙态/空值、44px 窄屏触控和长值 flex 收缩。设计 HTML 标本旧 onclick/失败提示、真实读屏器和宿主组合仍待后续；严格矩阵继续按全库门禁口径复验 |
| `LxDatePicker`       | `design/表单控件八件套/`                          | Wave 2 E2E 16/16、单测 39/39；A 31/40、B 9 场景、代码复审通过；4 项 P2/P3 未结，严格矩阵行保持打开                                                                                           |
| `LxDescriptions`     | `design/详情描述行 Descriptions/`                 | 部分证据；19/20 阶段审查不是正式关闭                                                                                                                                                         |
| `LxDialog`           | `DESIGN-SPEC.md` + Dialog API/Demo                | Wave 5 实现/17 项定向单测与文档证据完成；正式 Critique 待收口（焦点、确认、窄屏和动效）                                                                                                      |
| `LxDrawer`           | `DESIGN-SPEC.md` + Drawer API/Demo                | Wave 5 实现/文档证据完成；移动端稳态截图已复拍；正式 Critique 待收口（宽度、焦点、遮罩与窄屏）                                                                                               |
| `LxDutyCalendar`     | `DESIGN-SPEC.md` + Calendar API/Demo              | 待严格复核；无专属画板，需记录规范映射                                                                                                                                                       |
| `LxDynamicForm`      | `design/表单控件八件套/`                          | 实现、46 项单测、13 项文档 E2E 和代码复审通过；正式 Critique 收口中；`LxForm` 设计差异及统一 UI-10 严格矩阵仍开放                                                                            |
| `LxEmpty`            | `DESIGN-SPEC.md` + Empty API/Demo                 | Wave 5 实现/文档证据完成；正式 Critique 待收口，阶段性评分不替代本矩阵                                                                                                                       |
| `LxForm`             | `design/表单控件八件套/`                          | UI-13 实现/回归通过；首错焦点已修复并有桌面/375px 浏览器证据；正式 Critique 仍待综合关闭（移动提示层级与整库门槛）                                                                           |
| `LxFormErrorBanner`  | `DESIGN-SPEC.md` + 表单错误态规范                 | Wave 5 实现/文档证据完成；正式 Critique 待收口（图标、文案、语义色及窄屏）                                                                                                                   |
| `LxFormItem`         | `design/表单控件八件套/`                          | UI-13 本波；错误/必填 ARIA 与样式待正式 Critique                                                                                                                                             |
| `LxGauge`            | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；尺寸、比例、数值和深浅主题                                                                                                                                                       |
| `LxIcon`             | `design/LxIcon*` + `doc/LxIcon*`                  | A/B 与代码复审通过；真实读屏及权限菜单数据未覆盖，暂不计入严格矩阵                                                                                                                           |
| `LxInput`            | `design/表单控件八件套/`                          | **已关闭（2026-10-21当前版复验）**；19单测、Input文档E2E9/9及最终专项1/1；A36/40、B合法扫描三件套/四视图overlay、独立代码审核、正式快照与趋势齐备；单层边框/密码键盘/HUD占位字已修，非阻塞Demo对齐P3保留，不重复增加13/52 |
| `LxInputNumber`      | `design/表单控件八件套/`                          | 当前版 A 29/40、B 四目标 detector 均为合法 `[]`，四个 Light/HUD × 桌面/375px 视图有证据；桌面步进目标 13/15/19px 的 P2 未决，严格矩阵行开放，不增加 UI-10 全库关闭数                         |
| `LxMetricCard`       | `design/指标卡 MetricCard/`                       | 2026-10-19 已补 320px 以下窄卡分层、宿主 loading/empty/error 与重试反馈；单测 15/15、文档 E2E 3/3。Assessment A 32/40 的状态维度建议已写入 API；正式 A/B 和 UI-10 严格行仍开放 |
| `LxNavbar`           | `DESIGN-SPEC.md` + Navbar API/Demo                | 待严格复核；导航密度、焦点、菜单与窄屏                                                                                                                                                       |
| `LxNodeBadge`        | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；节点状态、字号和对齐                                                                                                                                                             |
| `LxPageCard`         | `DESIGN-SPEC.md` + PageCard API/Demo              | Wave 5 实现/文档证据完成；正式 Critique 待收口（表面、内距、加载及插槽态）                                                                                                                   |
| `LxPagination`       | `DESIGN-SPEC.md` + Pagination API/Demo            | 待严格复核；密度、分页按钮、背景与窄屏                                                                                                                                                       |
| `LxPasswordInput`    | `design/表单控件八件套/` + PasswordInput API/Demo | A 32/40、B overlay/浏览器、代码复审通过；10/10 单测、9/9 E2E；宿主校验失败集成示例 P2 待 Form 波次，因此严格行保持打开                                                                       |
| `LxProTable`         | `DESIGN-SPEC.md` + ProTable API/Demo              | 待严格复核；表头/行密度、选择、空错态和滚动                                                                                                                                                  |
| `LxRadio`            | `design/表单控件八件套/`                          | **已关闭（Wave 19）**；14px 靶环/6px 靶心、横纵选中色差、中文播报、禁用、减少动效与 44px 触屏均有当前版证据                                                                                  |
| `LxRadioGroup`       | `design/表单控件八件套/`                          | **已关闭（Wave 19）**；16px 水平/8px 垂直间距、方向键、禁用继承、历史只读值及 Light/HUD 行为均有当前版证据                                                                                   |
| `LxSearchBar`        | `design/检索面板 SearchBar/`                      | **已关闭（G2，2026-10-17）**；单测 10/10、文档 E2E 5/5、综合 34/40；第四字段 4/4/4/12 栅格、桌面同行和窄屏独占操作行已复验；宿主业务参数映射仍待 UI-04 |
| `LxSectionTitle`     | `design/区块标题 SectionTitle/`                   | 当前版 A 32/40；B 三路 detector 合法 `[]`/空/0，Light/HUD、1280/375/320px、键盘、减少动效和 360px 容器证据已归档；375px 页面级横溢出与 HUD 主题证据待归因，真实内容 Demo、extra/leading 契约仍为 P2，UI-10 严格行开放 |
| `LxSelect`           | `design/表单控件八件套/`                          | **已关闭（Wave 20）**；桌面 32px、390px 触控目标/选项行 44px；定向单测 15/15、文档 E2E 8/8、A/B 36/40 与六场景浏览器证据、代码复审无未关闭 P0–P2；目录密度 P3 留后续整理                     |
| `LxSelectPagination` | `design/远程分页下拉 SelectPagination/`           | 当前版行为 4 项单测、文档 E2E、A/B 和代码复审完成；严格矩阵仍待 P2 处理与全库复验                                                                                                            |
| `LxSelectTree`       | `DESIGN-SPEC.md` + 组织树选择 API/Demo            | 待严格复核；与独立 TreeSelect 的视觉语义区分                                                                                                                                                 |
| `LxSidebar`          | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；rail/expanded、菜单态、动效和抽屉                                                                                                                                                |
| `LxSidebarBrand`     | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；品牌锁定区、折叠态与对齐                                                                                                                                                         |
| `LxSidebarFooter`    | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；底部操作、焦点与窄屏                                                                                                                                                             |
| `LxSidebarGroup`     | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；分组层级、展开态和动效                                                                                                                                                           |
| `LxSidebarItem`      | `doc/stitch_侧边栏/stitch_/`                      | 待严格复核；选中/禁用/悬停/键盘态                                                                                                                                                            |
| `LxSplitLayout`      | `DESIGN-SPEC.md` + SplitLayout API/Demo           | 待严格复核；分栏比例、拖动、键盘和折叠态                                                                                                                                                     |
| `LxStatusDot`        | `DESIGN-SPEC.md` §2 + 状态点 API/Demo             | 待严格复核；状态语义、动画和减少动效                                                                                                                                                         |
| `LxStatusSwitch`     | `design/状态开关 StatusSwitch/`                   | **已关闭（G2，2026-10-17）**；单测 21/21、文档 E2E 4/4，确认竞态、旧值映射、权限降级、HUD/窄屏和减少动效证据完成；Vue3 宿主替换仍待 UI-04 |
| `LxSwitch`           | `design/表单控件八件套/`                          | 组件级复核已完成；共享壳层与宿主契约仍跟踪，暂不计入全库严格关闭                                                                                                                             |
| `LxTabsBar`          | `DESIGN-SPEC.md` + TabsBar API/Demo               | 待严格复核；页签层级、关闭/拖动和横向滚动                                                                                                                                                    |
| `LxTag`              | `DESIGN-SPEC.md` §2 + Tag API/Demo                | **已关闭（Wave 26，2026-10-18）**；A 27/40、修后 B 五视图与 detector 三件套、5/5 单测、2/2 文档 E2E、typecheck/build 和代码复审通过；small 档 2px/6px 紧凑内距有设计依据，宿主迁移仍待 UI-04 |
| `LxTextarea`         | `design/表单控件八件套/`                          | 严格矩阵已关闭；单测 14/14、文档 E2E 11/11、主题/状态浏览器证据、正式 Impeccable A/B 与代码复审通过；记录 8/12px 间距令牌对照设计稿 10px 及约 2px 高度差；全库 6/52                          |
| `LxTransferPanel`    | `design/虚拟滚动树 + 双栏穿梭/`                   | 当前实现、30 项单测、文档 E2E 28/28、名称/编码筛选及移动触控修复完成；桌面 32px 基准行高、320–420px 为 64px、421px 起为 44px；最新断言修订代码复审与正式 A/B 收口中；全库严格矩阵当前为 6/52 |
| `LxTreeSelect`       | `design/表单控件八件套/` + TreeSelect API/Demo    | 当前版单测/E2E、A/B 和代码复审完成；P3 为长节点换行 E2E 覆盖增强，严格矩阵仍待全库复验                                                                                                       |
| `LxUpload`           | `design/上传拖拽区 Upload/`                       | fallback UID/abort 组合回归已补齐（单测 38/38、文档 E2E 9/9）；设计图严格对照、提示文字视觉复核和正式 Critique 仍开放，真实上传协议另列 UI-04 阻塞 |
| `LxVirtualTree`      | `design/虚拟滚动树 + 双栏穿梭/`                   | 当前 34 项行为单测、文档 E2E 13/13，含自定义 `filterMethod`、44px 移动触控和跨行高断点焦点回归；与 TransferPanel 联合参与本次严格 A/B，UI-10 全库矩阵仍待关闭                                |

---

> 用途：组件库样式与交互设计的依据文档。
> 调研范围：Vue2 老工程（`src/`，Vue 2.6 + Element UI 2.15）、Vue3 新工程（`other-admin/admin-vue3/`，Vue 3 + Element Plus 全量，全局 `size='large'`）、lx-ui（`linkx-fe/`，15 组件 + 2 函数式 API）。
> 统计口径：Grep count 实测按文件统计后汇总；数字为两工程合并值（标注分代的除外）。
> 结论速览：核心 15 类场景已覆盖 13 类；三大缺口 = SearchBar / StatusSwitch / EP 桥接样式层补齐。

---

## 一、项目全景

| 工程                                      | 技术栈                                | 组件形态                                                     | 业务模块                                                                                |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Vue2 老工程** `src/`                    | Vue 2.6 + Element UI 2.15（全局注册） | el-xxx + 自研组件全局注册（components/index.js install）     | 权限中心、通知、基础数据、协同岗、位置、排班、三方对接、警信扩展、多节点管理（10 大块） |
| **Vue3 新工程** `other-admin/admin-vue3/` | Vue 3 + EP 全量注册（`size='large'`） | el-xxx 按需 + 22 个自研组件按需 import                       | 同上 10 大块迁移；ProTable 三模式成熟化                                                 |
| **lx-ui** `linkx-fe/`                     | Vue3 + EP 二次封装 + 设计令牌         | 15 组件 + lxMessage/lxConfirm + `--lx-*` 令牌 + HUD 深色主题 | 目标：统一两代工程视觉与交互                                                            |

**两代工程交互范式高度一致**（迁移友好）：

```
列表页 = SearchBar + ProTable + 分页 + N 个弹窗子组件
弹窗   = init(type, row) 回显 → validate 校验 → 提交 → message + refresh
危险操作 = MessageBox.confirm 二次确认
加载态 = v-loading（表格） + 按钮 loading（提交防抖） + ElLoading.service（全屏轮询）
```

---

## 二、EP 组件使用全景（按频率分层）

### T0 高频核心（样式设计最高优先级）

| 组件                            | 次数                        | 项目中的作用与交互                                                                                                      |
| ------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| el-button                       | **~687**（V2 458 / V3 229） | 所有操作触发：搜索/重置/新增/批量删除/行内编辑/弹窗确定取消；V3 大量 `link` 型行内按钮                                  |
| el-table / el-table-column      | ~58 / ~418 列               | 列表数据展示；绝大多数经自研 ProTable 封装；行 hover、固定操作列、多选列（reserve-selection 跨页保留）                  |
| el-form / el-form-item          | ~447 / ~620                 | 弹窗表单（label-width 100~200px，90% label-position=left）+ 行内搜索表单（68px）；rules 校验（输入 blur / 选择 change） |
| el-input                        | **~436**                    | 文本/密码/textarea；clearable、回车搜索、前缀图标（唯一允许的装饰=搜索放大镜）                                          |
| el-select / el-option           | ~130 / ~159                 | 下拉枚举选择，大量 v-for 动态 options                                                                                   |
| el-dialog                       | **~128**                    | 编辑/详情/选择弹窗；标准配置 `close-on-click-modal=false` + `append-to-body` + `align-center`，宽 500~800px             |
| $message / ElMessage            | **~950**                    | 操作结果反馈之首；成功绿/失败红；http 拦截器统一 4 处提示                                                               |
| $confirm / ElMessageBox.confirm | **~117**                    | 删除/解绑/退出登录危险操作二次确认，warning 图标，取消走 `.catch(() => {})` 静默                                        |
| v-loading                       | ~100                        | 表格/树/抽屉加载遮罩 + ElLoading.service 全屏轮询（"数据同步中…"，5s 轮询）                                             |

### T1 中频

| 组件                    | 次数                  | 作用                                                                            |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------- |
| el-pagination           | ~14 直用 + 全部经封装 | 列表分页；pageSizes [10,20,50,100]，切条数回第 1 页                             |
| el-tag                  | ~89                   | 状态标记、已选人员标签、关键词标签                                              |
| el-card                 | ~63（集中 V3）        | V3 列表页标准容器（`.app-container > el-card shadow="always"`）                 |
| el-tabs / el-tab-pane   | ~30 / ~72             | 模块内多 Tab；**9 处 `type="border-card"`**                                     |
| el-tree                 | ~38                   | 权限树/部门树/菜单树勾选与展示（区别于选择器形态）                              |
| el-tooltip              | ~41                   | 长文本提示、详情抽屉指标说明（9 处集中）                                        |
| el-descriptions(+item)  | ~36 / ~57             | 详情键值对展示（客户端详情、授权详情、抽屉内）                                  |
| el-empty                | ~35                   | 树/列表/穿梭无数据占位                                                          |
| el-upload               | ~20                   | 头像/图标手动上传（`action="#" + auto-upload=false`）、Excel 导入、地图底图上传 |
| el-popover              | ~23                   | 组织树下拉容器（OrgTreeSelect 基座）、选中项详情弹出                            |
| el-date-picker          | ~21                   | 日期范围筛选、授权到期日                                                        |
| el-switch               | ~22                   | 启用/禁用行内切换（loading 防抖，inline-prompt 内嵌文字）                       |
| el-radio(+group)        | ~75                   | 表单单选、推送方式选择                                                          |
| el-checkbox(+group)     | ~33                   | 多选、记住密码、树节点勾选                                                      |
| el-input-number         | ~15                   | 端口/排序号/有效期                                                              |
| el-dropdown(+menu/item) | ~23                   | Navbar 用户菜单、"更多操作"折叠                                                 |
| el-row / el-col         | ~92                   | 表单栅格双列布局                                                                |
| el-scrollbar            | ~19                   | 侧边栏/弹窗滚动（仅 V2）                                                        |
| el-icon                 | ~46                   | EP 图标承载（仅 V3）                                                            |

### T2 低频

el-divider(12)、el-color-picker(6)、el-menu(3)、el-alert(3)、el-collapse(2)、el-breadcrumb(2)、el-progress(2)、el-drawer(2)、el-image(2)

### 完全未使用（0 次 → 明确排除出组件库范围）

`el-cascader、el-tree-select、el-steps、el-timeline、el-carousel、el-transfer、el-slider、el-rate、el-skeleton、el-result、el-badge、el-avatar、el-notification、el-popconfirm、el-statistic、el-select-v2、el-table-v2、el-autocomplete、el-time-picker、el-calendar、el-watermark、el-tour、el-anchor、el-float-button` 等。
**结论：项目重度依赖 表格 / 表单 / 弹窗 / 消息 四类，组件库以此为核心；上表零使用组件不设计、不封装。**

---

## 三、自研组件全景（两工程合并去重，30+）

### 3.1 表格与搜索（列表页骨架）

| 组件              | 频次                         | 作用 / 关键交互逻辑                                                                                                                                                                                                                                                                             |
| ----------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ProTable**      | V2 8 / **V3 49（绝对核心）** | 配置式 columns + 内置分页。**三种数据模式**：纯 data / fetchApi 自治 / fetchApi 受控 + @response 回调（项目主流）；AbortController 竞态取消；reserve-selection 跨页保留选中；defaultTableFormatter 兼容 4 种后端结构；expose `init()`（回第 1 页）`refresh()`（保持页码）`mutate()`（乐观更新） |
| **SearchBar**     | V2 8 / **V3 25**             | V2：props 全配置（searchKey/showOrg/showDateRange/actions）+ ResizeObserver 自动换行。V3：`#filters` 插槽 + 关键字框（220px 回车搜索）+ 搜索/重置 + 右侧 actions 配置按钮（label/type/icon/onClick）                                                                                            |
| **Pagination**    | V2 26                        | v-model page/limit；**切 pageSize 自动回第 1 页**；autoScroll 回顶；`@pagination {page, limit}`                                                                                                                                                                                                 |
| **ActionButtons** | V3 29                        | 行内操作：`buttons` 配置或 `actions` **预设语义**（view/edit/disable/enable/delete → 自动图标+配色）；el-button link 型                                                                                                                                                                         |

### 3.2 选择器类

| 组件                                            | 频次     | 作用 / 关键交互逻辑                                                                                                                            |
| ----------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **SelectTree / SelectTreeLazy / OrgTreeSelect** | 合计 ~36 | 组织树选择：popover + input + tree 组合；懒加载/同步双模式（读全局配置 DEPARTMENT_SYNC_SIGN）；非 admin 自动定位本部门；搜索过滤；选中回填关闭 |
| **SelectPagination**                            | V3 6     | **远程分页下拉**：remote 搜索 + 滚动加载更多（v-loadmore）；内部 targetMap 解决回显（已选项不在当前页仍显示）；api 必传注入                    |
| **SelectPopper**                                | 1        | 多选下拉容器基座（搜索 + 已选 tag 区 + footer）                                                                                                |
| **VirtualTree**                                 | 7        | 万级树虚拟滚动（可视区渲染）；getCheckedKeys/expandAll/filter 全量树方法                                                                       |
| **VirtualCheckboxList**                         | 1        | 花名册虚拟勾选列表（卡片式 checkbox + 计数）                                                                                                   |
| **DataPermissionTree**                          | 3        | **左树右已选双栏穿梭**：VirtualTree + VirtualCheckboxList + 全选/取消                                                                          |
| **RelatedUserSelect**                           | 1        | 协同人员选择：**树模式/搜索模式自动切换**，双数组 v-model（value + labels）                                                                    |

### 3.3 弹窗类

| 组件                                                   | 频次 | 作用                                                                                                       |
| ------------------------------------------------------ | ---- | ---------------------------------------------------------------------------------------------------------- |
| UserSelectDialog / PoliceSelectDialog / UserBindDialog | 各 1 | 搜索 + ProTable 跨页选人弹窗；标题实时"已选 N 人"；确认回传数组                                            |
| createDialog（V2 工厂函数）                            | 多处 | Promise 弹窗：`await dialogFn()` 拿提交数据；ok/cancel/close 三态 resolve/reject；全局登记 closeAllDialogs |
| Upload（V2）                                           | 2    | 拖拽/点击上传弹窗：格式大小校验 → uploadApi(FormData) 注入式 → 成功关闭                                    |

### 3.4 展示与状态类

| 组件                                  | 频次   | 作用                                                                                                         |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| **StatusSwitch**                      | 14     | **业务值反向映射 0=启用/1=禁用**；disabled 降级显示 el-tag；loading 防抖；开关内嵌文字                       |
| **StatusDot / ConnectionStatusDot**   | 8+     | 五态呼吸灯；**code 0-7 数字兼容层**（4→online，1/2/7→processing，0/5→busy，3/6→error，对齐后端连接状态枚举） |
| **SectionTitle**                      | 20     | 区块标题三 variant（dashed 虚线 / border 主色竖条 / plain）；icon + #extra                                   |
| **MetricCard**                        | 8      | 指标卡：title / 等宽字体大数值 / valueType 语义配色 / footer —— 客户端详情抽屉 6 连用                        |
| ModernCard / PersonnelCard / PoliceId | 储备   | 白底卡片容器 / 人员卡（头像+警号+状态点）/ 警号高亮标签                                                      |
| AuthImg                               | 12     | XHR 带 token 拉 blob 图片（鉴权头像/图标）                                                                   |
| PasswordInput                         | 9      | 密码框禁 copy/paste/cut；透传 el-input 全量                                                                  |
| Breadcrumb / Hamburger / SvgIcon      | 布局级 | 面包屑自动生成 / 侧边栏折叠 / svg sprite                                                                     |

### 3.5 Composables

`useTable`（分页/搜索/刷新/多选/乐观更新 + 竞态取消，API 与 ProTable expose 对齐）、`useFetch`、`v-loadmore` 指令。

---

## 四、lx-ui 现有组件清单

| 分类       | 组件                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| 布局导航   | LxSidebar（+Brand/Item/Group/Footer）、LxGauge、LxNodeBadge、LxSelectTree            |
| 数据展示   | LxProTable、LxPagination、LxStatusDot、LxTag、LxEmpty、LxActionButtons               |
| 数据录入   | LxForm / LxFormItem（$attrs 透传 + 错误态接管 + columns 网格）                       |
| 反馈与浮层 | LxDialog、LxDrawer、LxFormErrorBanner、lxMessage、lxConfirm                          |
| 基础设施   | LxIcon（内置 24px stroke1.5 图标集）、`--lx-*` 全量令牌、HUD 深色主题、EP 变量桥接层 |

---

## 五、对比矩阵：lx-ui 覆盖度评估

### A. 已覆盖且满足 ✅

| 项目需求                        | lx-ui 对应          | 符合度说明                                                          |
| ------------------------------- | ------------------- | ------------------------------------------------------------------- |
| el-table + ProTable             | LxProTable          | 纯受控（columns/data/分页/多选/插槽）；数据模式差异见 B-1           |
| el-form 全家                    | LxForm / LxFormItem | $attrs 透传 + 五方法 + 错误态接管；label 上置/left 双形态兼容老项目 |
| el-dialog 弹窗                  | LxDialog            | close-on-click-modal=false 防误触、672px 双列、loading              |
| el-drawer 详情抽屉              | LxDrawer            | 480px 右滑、图标标题、footer 插槽                                   |
| $message / ElMessage            | lxMessage           | 时长差异见 B-2                                                      |
| $confirm / ElMessageBox.confirm | lxConfirm           | Promise\<boolean\> 优于项目 then/catch 写法                         |
| SelectTree 系组织树选择         | LxSelectTree        | 懒加载注入式、搜索过滤、checked-keys 受控                           |
| StatusDot / ConnectionStatusDot | LxStatusDot         | 五态 + code 0-7 兼容层已有 + pulse 节流建议                         |
| el-tag                          | LxTag               | 四语义 + closable                                                   |
| el-menu + Hamburger + 侧边栏    | LxSidebar           | rail/expanded 双态、HUD 风格，超出项目现状                          |
| SvgIcon / el-icon               | LxIcon              | 内置图标集                                                          |
| el-empty                        | LxEmpty             | —                                                                   |
| el-alert（表单阻断场景）        | LxFormErrorBanner   | report 图标 + 深红标题规格                                          |

### B. 已覆盖但存在交互差异 ⚠️（需设计决策）

| #   | 差异点                 | 项目现状                                                               | lx-ui 现状                                           | 建议                                                                            |
| --- | ---------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | **表格数据模式**       | fetchApi 三模式 + 竞态取消 + mutate 乐观更新 + formatter 兼容 4 种后端 | 纯受控 data/total（P7 零请求铁律）                   | 保持 P7；竞态取消/乐观更新下沉到 **useTable composable**（纯前端逻辑不违反 P7） |
| 2   | **Message 时长**       | 3s                                                                     | 设计稿 1.6s                                          | 设计稿为准；duration 参数已有可覆盖                                             |
| 3   | **ActionButtons 图标** | V3 带图标 + 预设语义（view/edit/delete 自动配色）                      | 默认纯文字；按设计拍板 #2 可选左置图标，文字标签必需 | **已解决**：以具体拍板 #2 为准；禁止纯图标，保留既有语义映射                    |
| 4   | **控件密度**           | V3 `size='large'`（40px）                                              | `--lx-control-height: 32px`（设计稿紧凑密度）        | 设计稿为准；迁移时控件变紧凑属预期视觉升级                                      |
| 5   | **分页回第 1 页**      | 封装内置"切 pageSize 回第 1 页" + autoScroll                           | 纯受控，业务自行处理                                 | 可加可选 `autoReset`，或文档推荐惯用法                                          |
| 6   | **弹窗宽度**           | 500~800px 不等                                                         | 默认 672                                             | width 可覆盖，兼容 ✅                                                           |

### C. 未覆盖 — EP 原生组件（不封装，但**桥接样式层需补齐**）⚠️

`element-theme.css` 目前只桥接颜色/圆角/字体基础变量，以下高频组件的**视觉规格尚未按设计稿定制**：

| 优先级 | 组件                                                                               | 理由                                                                     |
| ------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| P0     | **el-button**（687 次）                                                            | 第一大组件；主/次/link 三态需对齐设计规范（32px 高、4px 圆角、主色三态） |
| P0     | **表单八件套**：input/select/radio/checkbox/switch/input-number/date-picker/upload | LxForm 只接管错误态；控件本身的边框/焦点环/尺寸需桥接覆盖                |
| P1     | **el-tabs**（30 次，9 处 border-card）                                             | 设计稿已有 `--lx-bg-tabsbar` 专用 token，桥接待接                        |
| P1     | **el-card**（63 次）                                                               | V3 列表页容器；卡片阴影需对齐 `--lx-shadow-card`                         |
| P1     | **el-tree**（38 次）                                                               | 树勾选/展示形态（LxSelectTree 只覆盖选择器形态）                         |
| P1     | **el-descriptions**（36 次）                                                       | LxDrawer 详情内容主力，标签-值对齐规格                                   |
| P2     | tooltip / popover / dropdown 浮层三件套（92 次）                                   | 阴影/圆角对齐 `--lx-shadow-pop`                                          |
| P2     | collapse / divider / progress / scrollbar / breadcrumb / color-picker / image      | 低频，桥接兜底即可                                                       |

### D. 未覆盖 — 业务封装层缺口（lx-ui 高价值新增）

| 优先级 | 组件                                      | 频次 | 设计稿标本                                   | 封装要点（P7 兼容设计）                                                                                      |
| ------ | ----------------------------------------- | ---- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **P0** | **LxSearchBar**                           | 33   | 有（GRID 4-COL 检索面板 + ACTION 行）        | COMPONENT-SPEC 已有签名规划：字段驱动 `LxSearchField[]` + `#filters` 插槽 + actions 配置 + search/reset 事件 |
| **P0** | **LxStatusSwitch**                        | 14   | 有（胶囊滑块内嵌"开启/关闭"）                | 0/1 反向映射 + disabled 降级 Tag + loading 防抖，纯前端可封装                                                |
| P1     | **LxUpload**                              | 20   | 有（UploadDropZone 虚线拖拽区标本）          | V2 已是 uploadApi 注入式 → 不违反 P7；拖拽区 + 格式/大小校验 + tips                                          |
| P1     | **LxSelectPagination**                    | 6    | 无专门标本                                   | 远程分页下拉；api 注入 + **targetMap 回显**是项目独有难点                                                    |
| P1     | **LxDescriptions**                        | 36   | 有（抽屉标签-值两端对齐行）                  | 配 LxDrawer 的详情行组件                                                                                     |
| P1     | **LxSectionTitle / LxMetricCard**         | 28   | 有                                           | 区块标题三 variant / 指标卡等宽数值；V3 已有成熟原型可直接吸收                                               |
| P2     | **LxVirtualTree / LxCheckboxList**        | 8    | 有（花名册勾选标本：卡片式 checkbox + 计数） | 万级虚拟滚动，纯前端可封装                                                                                   |
| P2     | **LxTransferPanel**（DataPermissionTree） | 3    | 有                                           | 左树右已选双栏 + 全选/取消                                                                                   |
| P2     | **LxPasswordInput**                       | 9    | 无                                           | 复用 LxInput、显隐切换；默认允许剪贴板，显式事件拦截不作为安全控制                                           |
| P2     | **LxAuthImg**                             | 12   | 无                                           | 请求函数由业务传入（P7）                                                                                     |
| P3     | 人员选择弹窗壳                            | 3    | 无                                           | "SearchBar + ProTable + 多选"壳组件，fetchApi 注入                                                           |
| P3     | LxBreadcrumb                              | 2    | 无                                           | 路由自动生成                                                                                                 |
| P3     | **useTable composable**                   | —    | —                                            | 竞态取消/乐观更新/搜索刷新语义，纯前端逻辑（B-1 配套）                                                       |

### E. 明确不做 ❌

cascader / steps / timeline / carousel / transfer(EP 原生) / slider / rate / skeleton / result / badge / avatar / notification / popconfirm —— 项目 0 使用 + 设计稿无标本。

---

## 六、结论与建议

**覆盖度**：项目实际使用的 **15 类核心场景中 lx-ui 已覆盖 13 类**（表格/表单/弹窗/抽屉/消息/确认/树选择/标签/状态点/操作按钮/空态/侧边栏/错误横幅），核心骨架完整。

**三大缺口**（按投入产出排序）：

1. **P0**：LxSearchBar（33 次最大缺口、有设计稿标本、有规范签名）+ LxStatusSwitch（14 次）+ **EP 桥接样式补齐**（el-button 687 次与表单八件套是视觉统一主战场）
2. **P1**：LxUpload（有标本）、LxSelectPagination、LxDescriptions、el-tabs/el-card/el-tree/el-descriptions 桥接、LxSectionTitle/LxMetricCard
3. **P2**：虚拟滚动双件、双栏穿梭、PasswordInput、AuthImg、Breadcrumb、useTable

**待拍板的两个交互冲突**：

| 冲突               | 选项 A                 | 选项 B                                                 |
| ------------------ | ---------------------- | ------------------------------------------------------ |
| ActionButtons 形态 | 设计稿 P2 铁律：纯文字 | 项目现状：图标 + 预设语义（view/edit/delete 自动配色） |
| 控件密度           | 设计稿：32px 紧凑      | V3 现状：size='large' 40px                             |

---

_调研方法：Grep count 实测 + 关键文件精读（appForm.vue / editPerson.vue / ServerFormDialog.vue / thirdPartyEdit.vue / ProTable / SearchBar / OrgTreeSelect / SelectPagination 等 30+ 文件）。本文件为设计工作底稿，后续按 P0 → P1 → P2 顺序补齐。_

## 2026-10-04 Wave 0 复验记录

`LxDatePicker` 的单值说明更新/移除、相邻单值实例、区间起止输入及相邻区间实例隔离已通过行为回归。该修复只关闭可访问性关联缺陷；输入边界、弹层、范围视觉、窄屏和正式 Impeccable Critique 仍按基础控件批次复核，52 项严格关闭数不变。

## 2026-10-11 Wave 11 P2 审计结论：LxTransferPanel 与 LxVirtualTree

- **设计对照**：完成 `design/虚拟滚动树 + 双栏穿梭/` 对应的 5:2:5 桌面轨道、380px 标准高度、240/300px 边界、窄屏分段、树行元数据、长名称 disclosure、批量操作和 VirtualTree 折叠入口复核。
- **行为与可访问性**：节点视觉盒与触控区保持分离；可加入数量只统计已加载、未禁用且未选节点；达到上限的短提示与完整 `title`/`aria-describedby` 分层；键盘、焦点、错误/空/加载、HUD 和 `prefers-reduced-motion` 均有证据。
- **验证**：单测合计 67/67，文档 E2E 合计 48/48；类型、203 modules 构建、文档构建、Vue3 生产构建和目标格式检查通过；代码复审批准，无 P0-P3。
- **正式审查**：Assessment A 36/40；Assessment B 5 个静态目标均为合法 `[]`/空 stderr/退出码 0，9 个浏览器视图注入和截图成功；综合报告与 snapshot/trend 见 `.impeccable/critique/transferpanel-p2-2026-10-11/` 和 `.impeccable/critique/2026-10-10T23-03-08Z__linkx-fe-src-components-lxtransferpanel-index-vue.md`。本条关闭当前组件批次证据，不增加 UI-10 全库 52 项计数。
- **后续待办**：Demo 设置区展开后的控制项密度列为 P3；宿主保存状态、真实权限后端、读屏器专项、`DataPermissionTree` 适配和 Vue3 Element Plus 替换仍按 UI-04。下一组件批次为 `LxMetricCard` + `LxSectionTitle`，先做独立 A/B 和浏览器证据，再处理 G2 未关闭项。

### LxInput 前后缀高度轨道复验（2026-10-18）

- **修复**：组件根节点新增 `--lx-input-track-height`，输入内框、prefix/suffix、prepend/append 及内部槽位统一读取同一轨道；窄屏统一为 44px，并同步 Element Plus 输入行高变量。
- **证据**：类型检查和生产构建通过；复合前后缀 Playwright 用例新增 `sm/md/lg` 轨道令牌断言并保留 390px 窄屏覆盖。
- **审查状态**：Assessment A **32/40**；B detector 为合法 `[]`/空 stderr/退出码 0，8 个 Light/HUD 桌面/窄屏视图注入成功。综合报告、截图和快照见 `linkx-fe/.impeccable/critique/lxinput-height-wave-2026-10-18/` 与 `.impeccable/critique/2026-10-17T19-42-24Z__linkx-fe-src-components-lxinput-index-vue.md`。移动文档壳层 `scrollWidth=630` 保留为待归因信号；本条不增加 UI-10 关闭数。
## 2026-10-18 G2 LxSearchBar 当前版复核

- **契约**：新增 `escapeReset`，默认关闭文本 Escape 全量重置；显式开启保留兼容行为，复合控件 Escape 仍由自身处理。
- **证据**：单测与适配器 **13/13**，文档 E2E **5/5**；独立 A 修后综合 **34/40（Good）**。B 的源码/Demo detector 三件套均为合法 JSON `[]`、空 stderr、退出码 `0`，Light/HUD × 桌面/375px 浏览器视图已保存。
- **结论**：G2 组件级交互收口；文档壳层 side-tab 作为 P3 观察登记，不归因于组件。宿主全量迁移、真实权限和后端联调仍开放。\n
## 2026-10-18 LxCodeSlot 复制反馈 P1 收口

- 复制按钮在异步剪贴板尚未完成时显示加载图标、`title="正在复制"`、`aria-busy` 并禁用重复操作；成功/失败提示和 `copy` 事件契约保持不变。
- lx-ui 专用文档 E2E **1/1**，覆盖键盘、HUD、窄屏、长值和复制中状态；默认 Vue3 配置误指向登录页的失败已记录为配置问题。
- 真实剪贴板权限、读屏器、跨浏览器和宿主组合仍开放，不增加 UI-10 全库关闭数。\n

## 2026-10-19 LxInput 前后缀行高修复

- 改动：prefix/suffix、内部槽位及 prepend/append 的行高绑定内容轨道令牌，消除 Element Plus 默认 line-height 对文字和图标垂直位置的影响。
- 证据：复合前后缀 E2E 1/1；lx-ui typecheck/build、目标格式和 ESLint 通过；sm/md/lg 与 390px 窄屏几何保持稳定。
- 审查：A 31/40；B detector JSON/stderr/退出码为合法 []/空/0，桌面/HUD/窄屏浏览器证据已保存。一次错误节点的焦点读数由复合输入断言排除，[] 不单独表示正式 Critique 通过。
# 2026-10-19 LxProTable 当前版复验

- **行为**：跨页 `selectedKeys` 由当前页差集合并，公开 `clearSelection()` 清除全部页，受控选择、排序、加载/空态/错误重试、局部横向滚动、方向键、44px 复选目标、HUD 和 `ResizeObserver` 卸载清理均有当前版证据。
- **结果**：单测 4/4、文档 E2E 4/4、类型/构建/文档构建/格式检查通过，未发现可复现 P0–P2。
- **审查**：Assessment A 29/40（Good）；跨页选择 P1 已修复。Demo 危险操作、工具栏密度和横向滚动可发现性仍列为后续 P1/P2。`maskValue` 仍只消费宿主注入权限源；真实权限和后端契约未联调。detector 合法 `[]`/空 stderr/0 不替代独立 A/B，UI-10 严格矩阵保持开放。

## 2026-10-19 LxInput 前后缀完整高度

- 输入节点、prefix/suffix 及内部槽位改用完整 `--lx-input-track-height`，修复内容轨道比外框少 2px 的视觉差异；窄屏使用 44px 完整触控轨道。E2E **1/1**、单测 **13/13**、typecheck 通过。

## 2026-10-19 LxPagination 当前版门禁复核

- 单测 **7/7**、文档 Playwright **3/3** 通过，覆盖受控分页、条数切换、`autoReset`、自定义布局、主题、键盘和 375px 局部滚动。
- 复核确认 `linkx-fe/.impeccable/critique/pagination-assessment-b-2026-10-17/` 当前不存在；旧台账中的正式 B 结论降级为历史记录，不能把 detector `[]` 当作正式 Critique 通过。
- 待补独立 A/B、浏览器证据和 snapshot/trend；宿主分页请求、权限和真实后端继续由迁移适配层负责。

## 2026-10-19 LxSectionTitle Assessment B 当前版复验

- 证据目录为 `linkx-fe/.impeccable/critique/lxsectiontitle-assessment-b-2026-10-19-recheck/`；组件、Demo 和文档 detector 均为合法 `[]`、stderr 空、退出码 `0`。
- 浏览器覆盖 Light/HUD、1280/375/320px、键盘、`leading` 插槽优先级和 reduced-motion；375/320px 文档页出现 `scrollWidth=615/560`，命中节点主要属于 VitePress 外壳，暂记文档壳层 P2，不关闭组件矩阵。
- 后续需区分文档壳层溢出与组件自身布局，并在修复后复验 snapshot/trend；空数组不能单独代表正式 Critique 通过。

## 2026-10-19 宿主 Mock 预览复验边界

- Vue3 隔离 Mock 预览套件 **10/10** 通过，覆盖 33 个现役菜单首屏和关联人员、北向接入、轮播、鉴权图片专项行为。
- 该结果只证明宿主入口与本地 Mock 的可执行性，不改变 lx-ui 组件正式 Critique、真实权限/后端联调或 Element Plus 分批替换门禁。

## 2026-10-19 LxPagination 首批宿主接入

- 三个业务宿主场景已改用 `LxPagination`：双 Tab 预警推送、北向接入列表、协同岗挂靠弹窗。
- 适配保留 `pageNum/pageSize`、`change(page, pageSize)`、请求序号、注入式 `fetchList` 和局部滚动语义；组件仍不请求业务 API。
- 该批只证明宿主接入类型和 Mock 行为可运行，不关闭 LxPagination 正式 Impeccable A/B 或 UI-10 严格矩阵。

## 2026-10-19 LxInput 复合边框

- 根因是复合输入 inset 阴影被 prepend/append 背景遮挡；已改为真实 1px 外边框并保留焦点、悬停、错误态。
- 组件单测 **13/13**、复合文档 E2E **1/1**；detector 合法 `[]`/空/0，仅代表静态零命中，正式 A/B 仍按 UI-10 门禁记录。

## 2026-10-19 LxDialog footer 契约

- `hideFooter` 与 `footer` 插槽已按 API 说明实现互斥分支：自定义底栏只显示调用方内容，隐藏且无插槽时没有空 footer。
- 单测 **6/6**、文档 E2E **3/3**；组件 detector 为合法 `[]`/空/0，正式 UI-10 A/B 仍保持开放。

## 2026-10-19 ProTable 宿主隐藏列契约

- 本波审计对象是 Vue3 `ProTable` 适配层；`ITableColumn.hide` 已在宿主模板中生效，隐藏字段不再生成表格列。
- 宿主单测 **5/5**、LxProTable 文档 E2E **4/4**；detector 合法 `[]`/空/0 仅为静态零命中，未关闭 lx-ui ProTable 正式 Impeccable A/B。

## 2026-10-19 LxPagination 当前版复验边界

- 文档 E2E **3/3** 通过，覆盖受控翻页、条数切换、布局/主题、375px 局部滚动和键盘焦点；源码 detector 合法 `[]`/空/0。
- 本次没有隔离 Assessment A/B、可写 overlay、截图和 snapshot/trend，已按降级证据归档；不能因此关闭 LxPagination 的正式 UI-10 行。
## 2026-10-19 LxInput 普通/密码/透传边框复验

- 组件将普通、密码和透传输入包装器改为真实 `1px` 外边框，复合前后缀保留根节点连续外框；焦点、错误和尺寸令牌保持原契约。
- 单测 **13/13**；边框专项和复合尺寸 E2E **2/2**。完整基础控件仍有既有清空按钮窄屏可见性失败，未归因于本波。
- 尚未增加 UI-10 关闭数；正式 Impeccable A/B、宿主组合和真实后端仍开放。
## 2026-10-19 LxSelectPagination 防抖契约复验

- 修复公开 `debounce` 与实现不一致的问题：有限值原样保留，非法值 300ms，负数 0ms。
- 单测 **5/5**、文档 E2E **6/6**、detector 合法 `[]`/空/0；当前没有独立 A/B 和 snapshot/trend，不关闭 UI-10。
## 2026-10-19 LxSectionTitle Demo 图标名复验

- 修复 Demo 使用未注册 `settings` 图标造成的类型检查失败，改用现有 `setting` 图标并同步 E2E 断言。
- lx-ui typecheck、单测 **14/14**、文档 E2E **1/1** 和格式检查通过；不增加 UI-10 关闭数。

## 2026-10-20 LxSectionTitle Demo 操作契约补强

- 当前 Demo 增加 `icon` 属性可见示例和两个 `extra` 操作，并保留 `leading` 插槽覆盖 `icon` 的优先级；文档同步说明。
- 单测 **14/14**、文档 E2E **1/1**，覆盖图标优先级、键盘焦点、Enter 状态反馈、HUD、减少动效和 320/375px 场景。
- 该项只补当前版 Demo 证据，不关闭 UI-10；375px 页面级横溢出归因、正式 Critique、业务权限和 Vue3 宿主迁移仍开放。

## 2026-10-20 LxSectionTitle Assessment B 归因补充

- detector 的组件、Demo、文档目标均为合法 JSON `[]`、stderr 为空、退出码 `0`；仓库 Playwright 配置下 `lx-section-title-docs.spec.ts` **1/1** 通过，包含 375/320px 操作区边界和页面宽度断言。
- 独立 headless fallback 的窄屏裁切截图与当前可执行 E2E 结果不一致，暂归为运行时/文档壳层信号；HUD 点击、Tab 全序列、reduced-motion runtime 和 overlay 未完成，不能关闭 UI-10 严格行或宣称正式 Critique 通过。
