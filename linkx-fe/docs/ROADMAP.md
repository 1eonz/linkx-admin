# lx-ui 路线图

## 2026-10-19 LxSectionTitle Demo 契约回归

- Demo 增加自定义 `leading` 图标并验证其优先级；文档明确 `leading` 插槽覆盖 `icon` 属性。
- 文档 E2E **1/1**、单测 **14/14**、目标 Prettier 通过；三路 detector 合法 `[]`/空 stderr/退出码 `0`，并保留 HUD、键盘、320/375px 证据。
- 组件公开 API、业务 API、权限和宿主 Element Plus 依赖未改变，正式全库 UI-10/UI-11 仍开放。

## 2026-10-19 LxSectionTitle 当前版双路评审

- 当前版单测 **14/14**、文档 E2E **1/1**、typecheck 和目标 Prettier 通过；A **32/40（Good）**，B 已保存 detector 三件套与 Light/HUD、1280/375/320px、键盘、reduced-motion、360px 容器浏览器证据。
- B 记录 375px `documentWidth=478` 页面级横溢出信号和不完整 HUD 主题证据，需继续归因；真实内容 Demo、extra/leading 契约列为 P2。UI-10 行不关闭，宿主迁移与全站 Critique 继续后置。

## 2026-10-19 LxPagination 当前版复验

- 当前实现与中文 API、Demo 和迁移契约一致；单测 **5/5**、4177 文档 E2E **3/3**，覆盖受控分页、条数切换、滚动、主题和窄屏局部滚动。
- 独立 Pagination Critique 快照未找到，后续需按当前版补独立 A/B 或保留明确降级记录；不以 detector `[]` 关闭 UI-10。

## 2026-10-19 LxFormErrorBanner 当前版复验与证据修正

- 当前实现、Demo、API、单测 **2/2** 和 4177 文档 E2E **1/1** 已复核；组件没有业务 API，slot 操作由宿主提供。
- 正式 Impeccable A/B 仍开放，不能复用 G2 SearchBar/StatusSwitch 浏览器证据；空 `title` live region 记录为后续 P3。

## 2026-10-19 LxEmpty 当前版复验

- 当前版行为已复核：默认/紧凑尺寸、图标尺寸、图标与 footer 插槽、创建/筛选恢复、HUD、键盘及窄屏状态均有证据；单测 **5/5**、4177 文档 E2E **1/1**。
- 现有 Assessment A **35/40**、B 证据保持有效；正式独立 A/B 需后续按当前版重跑，静态 detector 结果不单独构成通过。

## 2026-10-19 LxInput 真实输入盒模型高度修复

- `.el-input__inner`、`prefix`、`suffix` 和内部槽位统一使用描边内内容轨道；32px 档为 30px，窄屏 44px 档为 42px，外侧复合块不变。
- 定向 Playwright **1/1**、LxInput 单测 **13/13**、typecheck/build 和目标格式检查通过；后续视觉审查仍需保留独立 Impeccable A/B 证据，静态 `[]` 不单独代表通过。

## 2026-10-19 LxMetricCard 窄卡与宿主状态契约补强

- 指标卡在自身容器不超过 320px 时将标题、角标、数值和 `extra` 分层，避免长内容横向竞争；Demo 增加宿主 loading/empty/error 组合和重试反馈。
- `status`、`badgeStatus`、`trendStatus` 的独立语义写入中文 API；单测 **15/15**、文档 E2E **3/3**、typecheck/build、目标格式和 ESLint 通过。正式 UI-10 关闭和宿主迁移仍开放。

## 2026-10-19 LxInput 前后缀槽位垂直居中修复

- `prefix/suffix` 及内部槽位保留扣除上下描边后的内容高度，并在完整输入外框内居中，修复槽位顶部贴边、底部少 2px 的视觉错位；窄屏 44px 外框同样适用。
- Playwright **1/1**、LxInput 单测 **13/13**、typecheck/build 和目标格式检查通过；页面 detector 的低对比度建议登记为既有页面问题，未扩大本波组件范围。

## 2026-10-19 LxSectionTitle 容器响应式与标签语义修复

- 窄屏布局保留 viewport 回退，并增加宿主 `@container` 规则，使嵌套卡片/抽屉在 400px 以下也能将标题与操作区拆行；`extra` 支持多控件换行并保持操作目标间距。
- `tag` 增加中文 `aria-label`（标题标记），单测 **14/14**、文档 E2E **1/1**、lx-ui typecheck/build、目标格式检查和 `git diff --check` 通过；detector JSON/stderr/退出码为合法 `[]`/空/`0`，正式双路 Critique 仍需独立代理可用后补齐。

## 2026-10-19 LxInput 前后缀内容轨道对齐

- 修复 `prefix/suffix` 及内部槽位被错误拉伸到完整控件高度的问题：wrapper 保留 `sm/md/lg` 与窄屏 44px 外框，内部槽位改用扣除上下 1px 描边后的内容轨道（26/30/38px，窄屏 42px），与真实输入内容行高一致。
- 定向 Playwright **1/1**、LxInput 单测 **13/13**、lx-ui typecheck、206 modules 生产构建、目标 Prettier 和 `git diff --check` 通过；后续 Impeccable A/B 仍按独立证据门禁执行。

## 2026-10-19 LxSectionTitle 窄屏 extra 布局修复

- 窄屏（400px 及以下）将标题区与 `extra` 操作区拆为两行，长标题继续换行，操作区右对齐并保留宿主 44px 触控目标，避免标题与操作互相挤压。
- 单测 **14/14**、文档 E2E **1/1**、lx-ui typecheck、生产构建、目标 Prettier、定向 ESLint 和 `git diff --check` 通过；覆盖 375px/320px、HUD、减少动效和键盘操作。
- 当前 B 证据三路 detector 为合法 `[]`/空 stderr/退出码 `0`；Assessment A 使用 2026-10-18 基线，正式 UI-10 严格矩阵行和整库 Critique 仍开放。

## 2026-10-19 LxDescriptions 长值展开状态修复

- 长值与长状态的焦点、收起、展开视觉状态已统一；新增 `chevron-down` 旋转图标，避免仅靠悬停或辅助技术描述推断状态。
- 窄屏收起态保留两行可见摘要，展开后允许完整换行；长状态省略规则不再被通用 `.lx-status-dot__text` 样式覆盖。
- 单测 **10/10**、文档 E2E **3/3**、类型检查通过；本轮不增加 UI-10 关闭数，继续等待独立 B 与正式归档。

## 2026-10-18 LxInput 前后缀直接令牌高度回归

- `prefix/suffix` 及内部槽位直接绑定 `--lx-input-track-height`，消除 Element Plus 内容尺寸参与 flex 计算时的高度回退；sm/md/lg、390px 44px 触屏和统一焦点环契约保持不变。
- 复合前后缀 E2E **1/1**、LxInput 单测 **13/13**、lx-ui typecheck/build/build:docs、目标 ESLint/Prettier 和差异检查通过。
- 本轮不增加 UI-10 关闭数；Impeccable A/B 仍必须同时记录 detector JSON、stderr、退出码和浏览器证据，静态 `[]` 不代表正式通过。

## 2026-10-18 LxCodeSlot 当前版复核与窄屏补强

- 独立 Assessment A **30/40（Good）**；修复固定 aria 名称覆盖、复制竞态/空值静默、窄屏触控高度和长值 flex 溢出，中文 API、文档 E2E 和交接台账已同步。
- 文档 Playwright **1/1**，lx-ui 类型检查/构建/目标格式检查通过。B 的 Light/HUD × 桌面/窄屏 4 视图均注入成功，页面错误和失败请求为 0；源码/Demo/文档 detector 的 JSON/stderr/退出码为合法 `[]`/空/`0`。
- 文档壳层与示例代码高亮命中已归因，不能替代正式视觉结论；真实读屏器、系统剪贴板和宿主组合仍开放。下一入口继续 UI-10 未关闭矩阵。
- 独立代码复审后的外部禁用透传、动态 aria 名称和卸载竞态已修复；复修后文档 E2E、类型检查和构建通过。

## 2026-10-18 LxInput 普通前后缀根节点高度补强

- **改动**：普通 `LxInput` 根节点现在与 `--lx-input-track-height` 同步设置 `box-sizing`、`height`、`min-height` 和 `align-items: stretch`，使输入包装器、`prefix/suffix` 内槽与外侧复合块共享同一条高度轨道；不改变尺寸、事件、校验和插槽契约。
- **验证**：LxInput 单测 **13/13**；lx-ui 类型检查、生产库构建、VitePress 文档构建、目标 Prettier 通过。使用 `playwright.lxui.config.ts` 指向 4177 文档服务后，文档 E2E **2/2** 通过，覆盖根节点、包装器和前后缀上下边界。
- **Impeccable 边界**：独立 A/B 已完成；B detector 的 JSON/stderr/退出码为合法 `[]`/空/`0`，Light/HUD × 桌面/390px 共 8/8 视图完成截图、DOM、几何和 overlay 证据。390px 文档壳层 `scrollWidth=630` 与 detector 命中保留待归因；`[]` 仅表示静态零命中，不能脱离浏览器证据代表正式 Critique 通过，本轮不增加 UI-10 关闭数。
- **后续**：继续处理减少动效、触屏清空语义和真实浏览器证据；页面操作引导、Vue3 Element Plus 替换、权限与真实后端联调仍按既定优先级后置。

## 2026-10-18 LxVirtualTree/TransferPanel 组合 P2 复验

- 固定行虚拟化、`nodeSummary`、筛选隐藏项、批量上下限、长名称、未加载项、320/375px、键盘焦点恢复和主题状态通过当前文档证据复验。
- `lx-virtual-tree-docs.spec.ts` 与 `lx-transfer-panel-docs.spec.ts` 合计 **48/48**；`pnpm typecheck`、206 modules 构建通过。未发现组件级 P0/P1/P2。
- 宿主 `DataPermissionTree` 的保存/权限 API 仍需真实契约，继续留在 UI-04；下一入口是剩余基础组件矩阵和 Vue3 分批替换准备。

## 2026-10-18 LxDescriptions 当前版门禁复验

- 当前组件、Demo、中文 API 与设计稿对照重新冻结；两端布局、双列/窄屏单列、32px 行高、长值/状态键盘读取、复制、抽屉和状态组合均保持契约。
- 组件单测 **9/9**，文档 Playwright **3/3**（lx-ui 专用 `4177` 入口）；全量 Vue3 Vitest **603/603**。未发现需要修改的组件级 P0/P1/P2。
- 本条只补齐当前版验证证据，不把 detector `[]` 单独视为视觉通过，也不代表宿主替换或真实后端联调完成。下一波为 `LxVirtualTree`/`LxTransferPanel` 组合 P2 与宿主契约复核。

## 2026-10-18 UI-13 / Wave 28 LxUpload 进度真实性与 Demo 可访问结构收口

- 批量上传进度在文件大小完整时按字节权重计算，未知大小回退等权平均；新增大/小文件进度回归。Demo 上传字段改为普通容器并通过 `aria-labelledby` 关联标题，避免嵌套 `label`。
- LxUpload 单测 **39/39**、lx-ui 类型检查/构建、目标 Prettier 和差异检查通过；Assessment A **29/40**，B 8 视图浏览器证据有效，detector `[]` 仅表示静态零命中。
- 本波不关闭 UI-10；真实上传协议和宿主迁移仍开放。综合报告和快照见 `linkx-fe/.impeccable/critique/upload-wave-2026-10-18/` 与 `.impeccable/critique/2026-10-17T19-25-22Z__linkx-fe-src-components-lxupload-index-vue.md`。

## 2026-10-18 LxInput 前后缀尺寸切换过渡修复

- **根因**：Element Plus 的 `prefix/suffix` 默认使用 `transition: all`，Demo 切换 `sm/md/lg` 时高度在过渡帧中介于旧值和新值之间，造成输入框与前后缀上下边界短暂不一致。
- **修复**：`LxInput` 的前后缀及内部槽位继续绑定 Lx 尺寸令牌，禁止高度参与过渡，仅保留颜色过渡；窄屏 44px 触控轨道保持不变。
- **验证**：复合前后缀 Playwright **1/1**、LxInput 单测 **13/13**、lx-ui 类型检查和生产构建通过；完整 Input 相关 E2E **5/6**，剩余 1 项为既有清空按钮可见性断言失败，与本次尺寸轨道修复无关。
- **审查边界**：detector JSON 为合法 `[]`、stderr 为空、退出码 `0`，只表示静态规则零命中；本条使用浏览器几何回归作为修复证据，不新增 UI-10 严格矩阵关闭数。

## 2026-10-18 LxUpload fallback UID 与 abort 组合回归

- 已确认 fallback UID 生成、跨实例隔离、受控模型回灌后的公开 `abort()`、字符串/数字 UID 映射、单请求取消和迟到回调隔离均有当前测试覆盖。
- `other-admin/admin-vue3/tests/unit/lx-upload.test.ts` **38/38**；`lx-upload-docs.spec.ts` **9/9**，覆盖成功、失败重试、取消、移除、格式校验、禁用、HUD、320/375px 触控和拖拽提示恢复。
- 该波只收口行为回归，不关闭 `LxUpload` UI-10 严格矩阵；设计图逐项对照、正式 Impeccable、真实上传协议与宿主迁移仍开放。

## 2026-10-18 LxInput 前后缀高度轨道最终收敛

- 复合输入根节点、输入内框、`prepend/append` 以及 `prefix/suffix` 内部槽位统一采用根节点完整高度的 `border-box` 伸展轨道；外侧块不再独立声明令牌高度，避免 Element Plus flex 内容尺寸在主题或尺寸切换时造成上下边界视觉不一致。
- 定向 Playwright **1/1**（sm/md/lg、390px 触屏、根节点/输入框/前后缀上下边界、内部槽位高度及统一焦点环）、LxInput 单测 **13/13**、lx-ui `vue-tsc --noEmit`、库构建、目标 ESLint/Prettier、`git diff --check` 通过。
- 本轮按规则保留 detector 的 JSON/stderr/退出码记录；合法 `[]` 仅表示静态规则零命中，不能替代正式 Impeccable A/B 或快照。该修复不增加 UI-10 关闭数，Vue3 宿主替换、真实后端联调和权限任务继续后置。
- 新版 URL detector 对完整 VitePress 页面返回退出码 **2**，命中归因于文档壳层辅助文本和代码高亮色；组件本身未发现对应颜色缺陷，不能将 URL 扫描写成全页通过。

## 2026-10-18 LxForm 通栏文本域宽度修复

- `LxFormItem span="full"` 的网格跨列语义保持不变，`LxTextarea` 根节点新增 `width: 100%`，使通栏备注文本域真正填满双列表单项内容轨道。
- LxTextarea 单测 **14/14**、LxForm 文档 E2E **6/6**、lx-ui 类型检查、目标格式/Lint 通过；浏览器实测 608px 通栏宽度一致。LxForm/LxTextarea detector 为合法 `[]`、stderr 空、退出码 `0`，不把静态零命中单独作为 Critique 通过依据。
- 该项不增加 UI-10 全库关闭数；后续仍按计划进行 LxForm 逐项设计收口、正式 Critique 和 Vue3 宿主替换。

## 2026-10-18 LxInput 复合输入统一外框修复

- 复合输入根节点现在裁切为单一圆角外框，输入内框取消独立圆角和焦点环，`prepend/append` 仅保留内部垂直分隔线；聚焦时由整个复合控件承载同一焦点环，避免前后缀与输入框边界出现视觉高低差。
- 定向 Playwright **1/1**（sm/md/lg、390px 触屏、前后缀/输入框上下边界及统一焦点环）、LxInput 单测 **13/13**、lx-ui `vue-tsc --noEmit`、目标 ESLint/Prettier、`git diff --check` 通过。Impeccable detector JSON 为合法 `[]`、stderr 为空、退出码 `0`；该结果只表示静态规则零命中，浏览器证据仍是本次视觉回归依据。
- 本次不改变事件、校验、API 或 `.then().catch().finally()` 风格，不增加 UI-10 全库关闭数；Vue3 Element Plus 替换、真实后端联调和页面操作引导继续按既定顺序后置。

## 2026-10-18 LxInput 复合前缀内框高度收敛

- 复合输入根节点、输入内框、`prepend/append` 统一使用同一伸展轨道，内框明确继承 `--el-input-height`，避免 Element Plus 内容尺寸在特定主题或尺寸下造成前后缀与输入框边界不一致。
- 几何 E2E 增加根节点与输入框上下边界断言；后续验证需同时记录浏览器证据、detector JSON、stderr 和退出码，`[]` 仅表示静态规则零命中。

## 2026-10-18 LxTag 关闭操作与状态契约复核

- `LxTag` 关闭按钮改用 `LxIcon`，补齐“关闭标签”名称和提示；实现 `large` 独立尺寸，并为三档标签设置稳定最小高度；disabled 使用专用禁用令牌保持文字可读性，长文本在可用宽度内省略。
- 单测 **5/5**、文档 Playwright **2/2**、lx-ui typecheck/build、VitePress build、Prettier/ESLint 通过。修后 B 五视图和 detector 证据见 `.impeccable/critique/lxtag-assessment-b-2026-10-18-recheck/`；detector `[]` 只作为静态零命中记录。
- Assessment A **27/40（Good）** 的禁用对比度与 large 缺口已修复；`cramped-padding` 命中与设计稿 small 档 2px/6px 内距一致。宿主迁移与 UI-10 全库门禁仍后置。

## 2026-10-18 LxInput 前后置复合块视觉对齐修复

- `prepend/append` 统一采用完整高度的 flex 居中轨道，清除 Element Plus 默认上下内边距并收敛行高，避免外侧复合块文字与输入框边界看起来不等高。
- 定向 Playwright **1/1**（sm/md/lg、390px 触屏及上下边界对齐）、lx-ui `vue-tsc --noEmit`、`git diff --check` 通过；detector JSON 为合法 `[]`、stderr 为空、退出码 `0`。静态零命中不替代浏览器证据或正式双路 Critique。

## 2026-10-17 DynamicForm/Form 正式 Critique 归档

- Assessment A/B 综合 **28/40（Good）**；两页 detector 的 JSON/stderr/退出码分别为 `[]`/空/`0`，Light/HUD 与 375px 浏览器证据已归档。
- 375px 页面级横溢出和字段错误可见性 P1 已关闭；P2 文档信息密度、HUD 层级和 P3 键盘效率提示保留在后续文档优化队列。该项不增加 UI-10 完成计数。

## 2026-10-17 DynamicForm/Form 文档信息层级复验（阶段性）

- DynamicForm 最小配置已前置；LxForm API 与设计/迁移说明分组折叠；`.lx-doc-details` summary 统一 44px 触达区、焦点环、开合态和减少动效。
- 文档 Playwright **17/17**，VitePress 构建成功；Markdown detector 合法 `[]`/空 stderr/退出码 `0`，仅记录静态零命中。
- Assessment A **30/40（Good）**；Luna B 通道两次 503，正式双路 Critique 未完成。P2 表格提示、outline 与折叠粒度继续开放。

## 2026-10-17 DynamicForm/Form Assessment B 宽度归因复验

- `browser-evidence.mjs` 在首次加载和每次视口切换后增加 250ms 布局稳定等待并重跑；DynamicForm、LxForm 在 375px 下的页面级 `document/body.scrollWidth` 均为 375，overlay 后仍为 375。旧报告中的 474/525 属于未稳定布局的测量中间态，代码块长行和 API 表格内部滚动由各自容器承载，不构成页面级横溢出。
- 文档 Playwright **15/15** 通过，覆盖 375/320px 单列、错误/ARIA、首错聚焦、HUD、禁用、减少动效、自适应列、上传失败恢复和远程请求竞态；B 重跑退出码 `0`、stderr 为空。A 的两个 P1 观察已由当前证据关闭。
- P2 文档信息密度、HUD 文档层级和 P3 键盘效率提示仍开放；正式 snapshot/trend 与独立代码复审完成前，不将本次复验登记为 UI-10 或 UI-11 全库关闭。

## 2026-10-17 LxInput 前后缀内容轨道回归修复

- Element Plus wrapper 的默认上下内边距使输入值、prefix、suffix 少 2px；现已统一填满 `--el-input-height`，复合输入在 sm/md/lg 及 390px 触屏视口中保持同高，左右内边距和 44px 触控规则不变。
- 定向 Playwright **1/1**、`LxInput` 单测 **13/13**、lx-ui 类型检查和目标格式检查通过。detector 合法 `[]` 仅作为静态零命中证据，不替代浏览器和正式 Impeccable A/B；本次不增加 UI-10 关闭数。

## 2026-10-17 LxDynamicForm/LxForm 窄屏与错误焦点修复

- 密码输入在窄屏/触屏下的输入外框统一为 44px；静态 `LxForm` 错误选择器只保留错误边框，动态表单继续保留键盘焦点环，避免跨宿主契约相互覆盖。
- DynamicForm/Form 单测 **30/30**、文档 E2E **15/15**，类型检查和目标差异检查通过。Assessment A **28/40（Good）**；其 P1 观察和源码 detector 的降级限制待 Assessment B 独立证据确认。

## 2026-10-17 LxInput 前后缀高度修复

- 复合输入的 prepend/append 高度固定跟随 `--el-input-height`；窄屏/触屏下与输入框一起满足 44px 高度。浏览器 E2E 覆盖 sm/md/lg、prefix/suffix 垂直中心，以及 390px 视口。
- 此项是已完成 `LxInput` 的局部回归修复，不增加 UI-10 严格矩阵计数；整库 Impeccable、Vue3 宿主替换和真实后端联调状态不变。

> **文档职责（2026-10-17）**：本文只维护 lx-ui 组件路线和组件级未完成项，不重复记录全局波次台账。全局计划见 `doc/PROJECT-DELIVERY-PLAN.md`，交接与审查证据见 `doc/PROJECT-HANDOFF.md`。

## 2026-10-17 G2 当前版验证补记

### 修后布局增量

- SearchBar 四字段标准态前三项各占 4 列，最后集成字段占 12 列；选择器与查询/重置按钮桌面同排、底边对齐，375px 时操作组独占下一行，选择器保持 44px 全宽。
- 定向单测 **10/10**、文档 Playwright **5/5**、类型检查和 VitePress 构建通过；修后 detector 三件套（源码、Demo）均为合法 `[]`、空 stderr、退出码 `0`，浏览器八视图完成复验。Assessment A/B、代码复审和综合报告已收口，snapshot 已写入并读取 trend；历史评分口径不同，趋势仅作记录。

- `LxSearchBar` 与 `LxStatusSwitch` 当前实现已通过 Vue3 全量单测 **598/598**，其中定向组件单测分别为 **9/9**、**21/21**；文档 Playwright **8/8**。
- lx-ui `vue-tsc --noEmit`、206 modules 库构建和 VitePress 文档构建均通过。VitePress 仅保留既有大 chunk 警告，不影响构建退出码。
- 已执行 `npx impeccable update`，退出码 **0**，Impeccable 引擎更新为 **0.1.15**；后续 Critique 必须继续保存 detector JSON、stderr、退出码和 Light/HUD、桌面/窄屏浏览器证据，不能以 `[]` 单独结论通过。
- 本补记只确认当前实现验证，不提前关闭整库 UI-10 或 Vue3 宿主替换；下一步为 G2 正式独立 Assessment A/B、代码复审和综合 snapshot/trend。

## 2026-10-17 LxPageCard 正式审查

- 单测 **3/3**、文档 Playwright **1/1**；Assessment A **33/40（Good）**，B detector 合法 `[]`/空 stderr/退出码 0，五视图注入成功。
- 标题、插槽、loading、`aria-busy`、主题和窄屏通过；宿主替换仍待全库门禁。

## 2026-10-17 LxFormErrorBanner 阶段审查

- 单测 **2/2**、文档 Playwright **1/1**；Assessment A **32/40（Good）**，B detector 为合法 `[]`/空 stderr/退出码 0，五视图注入成功。
- 移动 overlay 的 `scrollWidth=462 > 375` 已由无覆盖层 Playwright 基线归因为检测覆盖层/文档壳层；组件窄屏正式收口，高缩放说明文字保留为 P2。

## 2026-10-17 LxPagination 正式审查

- 单测 **5/5**、文档 Playwright **3/3**；Assessment A **32/40（Good）**，B detector 为合法 `[]`/空 stderr/退出码 0，五视图注入成功。
- 受控分页、自动回顶、条数重置、局部滚动、主题和减少动效通过；宿主替换仍待全库门禁。

## 2026-10-17 LxDrawer 正式审查

- 单测 **4/4**、文档 Playwright **1/1**；Assessment A **32/40（Good）**，B 五视图注入成功，detector 为合法 `[]`/空 stderr/退出码 0。
- 详情抽屉的 480px 设计、视口约束、HUD、键盘和减少动效通过；长标题、移动 footer 和高缩放标题可读性列为 P2。

## 2026-10-17 LxDialog 正式审查

- 定向单测 **4/4**、文档 Playwright **3/3**、类型检查和目标格式检查通过；Assessment A **28/40（Good）**。
- Assessment B 证据见 `.impeccable/critique/dialog-assessment-b-2026-10-17/`；detector 三件套为合法 `[]`/空 stderr/退出码 0，五个 Light/HUD/减少动效视图在启动 8400 live-server 后重试注入成功。
- P1/P2 观察项已登记：提交中关闭、脏表单离开保护、长内容滚动、重复错误反馈、拖拽光标、长标题和 danger 文案范围；本波不改变现有关闭契约。

## 2026-10-17 LxEmpty 组件门禁

- 定向单测 **5/5**、文档 Playwright **1/1**、lx-ui 类型检查通过；Assessment A **35/40（Good）**。
- Assessment B 证据见 `.impeccable/critique/empty-assessment-b-2026-10-17/`；三路 detector 为合法 `[]`/空 stderr/退出码 0，浏览器 JSON 可解析且退出码 0。
- UI-10 严格矩阵登记为 **12/52**；Vue3 15 处 `el-empty` 仍待 UI-04 逐页迁移和空/错/加载回归。

## 2026-10-17 LxTransferPanel 与 LxVirtualTree 当前版复验

- 定向单测 **67/67**、TransferPanel 文档 Playwright **33/33**；覆盖桌面/窄屏、键盘、筛选批量、空/错/加载、确认清空、长名称、HUD 和减少动效。
- Assessment B 证据见 `.impeccable/critique/transferpanel-virtualtree-assessment-b-2026-10-17/`；四路 detector 为合法 `[]`/空 stderr/退出码 0，浏览器 JSON 可解析且退出码 0。
- 桌面按钮 32px、移动触控按钮 44px 的尺寸差异符合设计约束；`LxInputNumber` 桌面步进目标 P2 保持开放。

## 2026-10-17 LxCascader 与 LxTreeSelect 正式组件门禁

- 定向单测 **32/32**、文档 Playwright **10/10**；覆盖键盘、单选/多选、空态、loading、失败重试、禁用、Escape、窄屏、HUD 和减少动效。
- Assessment B 证据见 `.impeccable/critique/treeselect-cascader-assessment-b-2026-10-17/`；六路 detector 为合法 `[]`/空 stderr/退出码 0，浏览器 JSON 可解析且退出码 0。当前组件范围无 P0-P2。
- UI-10 严格矩阵登记为 **11/52**；真实宿主替换、权限/后端联调和整库正式 Critique 继续后置。

## 2026-10-17 LxDynamicForm 当前版复验

- 单测 **30/30**、文档 E2E **12/12**；schema 字段 renderer、Lx 基础控件、单图/多图上传、远程状态、受控值和自适应列布局均有证据。
- Assessment B 证据见 `.impeccable/critique/dynamicform-assessment-b-2026-10-17/`；静态 detector 三件套有效，浏览器状态覆盖窄屏、主题、减少动效、校验/ARIA 和全部字段类型。
- 组件库复验通过；真实宿主 API、权限和上传联调，以及 Element Plus 替换继续后置。

## 2026-10-17 LxStatusSwitch 当前版复验

- 单测 **21/21**、文档 Playwright **4/4**、Vue3 类型检查通过；新增 `contextKey`、确认互斥和自定义 `aria-label` 保留。复验 B 证据见 `.impeccable/critique/statusswitch-assessment-b-2026-10-17-reverify/`。
- 三路 detector 均为合法 `[]`/空 stderr/退出码 0，浏览器 JSON 可解析且退出码 0，覆盖确认竞态、权限降级、失败恢复、窄屏、HUD 和减少动效；当前组件范围无 P0-P2。
- Vue3 宿主仍待 UI-04 逐页替换，整库正式 Impeccable 仍待 UI-10/UI-11 门禁。

## 2026-10-16 UI-04 前置组件：LxSectionTitle 当前版复核

- Vue3 `SectionTitle` 适配器已补 `subtitle` 属性/插槽和 `leading` 插槽优先级，兼容旧标题、图标、extra 与 `dashed` 默认；库组件继续保留 `border`/`dashed`/`plain` 三变体。
- 单测 **18/18**、文档 Playwright **1/1**、类型检查、ESLint、Prettier 通过。Assessment A/B 无 P0–P2；B 证据覆盖 Light/HUD、1280/375/320、RTL、减少动效，8/8 无横溢出、页面错误或失败请求。
- 三个静态 detector 均为有效 `[]`/空 stderr/0；8 条组件/Demo 命中按 HUD 令牌和 LxTag 设计尺寸归类，其他命中为 VitePress 壳层。历史组件规范中的单 variant 表述已标记为过时。
- 真实宿主组合、权限/后端联调和读屏器仍后置；下一波进入 G2 `LxSearchBar`/`LxStatusSwitch`。

## 2026-10-16 G2 LxSearchBar 当前修复

- 四字段标准态按设计稿改为四列 `span 6`，第四列内含查询/重置操作；Vue3 适配器隐藏默认状态行，恢复批量操作 `selectedCount` 禁用与 `action` key 事件。
- 库单测 **9/9**、适配器单测 **2/2**（合计定向测试 **11/11**）、文档 E2E **4/4**；组织树、日期格式和旧参数协议仍按页面迁移清单逐项接入。

## 2026-10-16 UI-04 前置组件：LxMetricCard 趋势语义补强

- `LxMetricCard` 新增可选 `trendDirection`，支持 `up`、`down`、`flat`；未传入时按旧 `trendStatus` 推断，保持现有宿主兼容。Badge 状态点改为装饰性读屏隐藏。
- 定向单测 **15/15**、文档 Playwright **3/3**、lx-ui 类型检查/构建通过；E2E 覆盖显式上升/下降/持平箭头、旧 `error` 回退、进度 ARIA、320px、HUD 与减少动效。独立复跑受登录鉴权和代理超时阻断，单列为环境失败。
- B 证据目录为 `.impeccable/critique/metriccard-assessment-b-2026-10-16-recheck/`，detector 的 `[]`、空 stderr、0 只记录静态零命中；浏览器五视图无页面错误或失败请求，非零命中归因于文档壳层。A/B 复核未发现组件 P0–P2。
- 本波不关闭 UI-10 严格矩阵，不替换 Vue3 业务页，不删除宿主 `element-plus`；下一入口为 `LxSectionTitle`，然后继续基础控件、动态图标和 `LxDynamicForm`。

## 2026-10-16 UI-10 / Wave 25 LxAuthImg 竞态与加载尺寸修复

- 修复 `LxAuthImg` 在已成功加载的同一回退图被主图切为空地址时错误保持 loading 的问题；复用已加载资源时补发一次完成事件。回退图 A→B→A 切换增加当前 DOM 图片身份校验，迟到事件不会污染新状态；显式 `width`/`height` 不再被加载期最小尺寸撑大。
- 定向单测 **17/17**、LxAuthImg 文档 Playwright **5/5**、lx-ui 类型检查、206 modules 库构建、VitePress 文档构建、Vue3 类型检查、目标 Prettier 与 `git diff --check` 通过。linkx-fe 没有独立 ESLint CLI 配置，不能把宿主 ESLint 命令失败误记为组件源码失败。
- Assessment B 已完成：源码 detector 为合法 JSON `[]`、stderr 空、退出码 0；Light/HUD × 1280×800/375×812 四个新浏览器上下文均 HTTP 200、可变注入成功，page error、失败请求和 HTTP 400+ 响应均为 0；overlay 命中归因于 VitePress 壳层、代码块、props 滚动容器和 HUD 主题规则，未命中 `.lx-auth-img*`。证据见 `.impeccable/critique/authimg-assessment-b-final-2026-10-16/`。`[]` 仅代表静态规则零命中。
- 当前版 Assessment A **37/40（Good）**，B 四视图与 detector 证据有效，代码复审无可复现 P0–P2；综合报告与趋势见 `.impeccable/critique/authimg-assessment-b-final-2026-10-16/`。UI-10 更新为 **9/52**。请求失败并显示 fallback 时的 `error-actions` 重试契约已补测；真实鉴权后端联调、Vue3 宿主适配与整库 Element Plus 删除仍待可信契约及全库门禁。下一入口为 `LxMetricCard` 与 `LxSectionTitle`，随后进入 G2 `LxSearchBar` 与 `LxStatusSwitch`。

## 2026-10-14 UI-10 / Wave 21 LxTextarea 严格矩阵关闭

- `LxTextarea` 按 `design/表单控件八件套/code.html` 第 08 区完成严格矩阵核验；定向单测 14/14、共享基础控件文档 E2E 11/11，隔离端口 4179 完整通过。lx-ui 类型检查、206 modules 构建、VitePress、Vue3 生产构建及目标格式/Lint/Stylelint 通过。
- Assessment A 31/40（Good），无组件级 P0–P3；Assessment B 两个 detector 为有效 JSON `[]`、stderr 空、退出码 0，六个主题/视口浏览器视图完成；独立代码复审无 P0–P3。detector `[]` 只代表静态规则零命中。A/B 与代码复审材料见 `.impeccable/critique/lxtextarea-wave-2026-10-13/current-final/`。
- 设计稿 `p-2.5` 的 10px 内边距与现有 8px 垂直/12px 水平令牌、约 74px 与实测 76px 高度差已在矩阵如实登记；本次结论不表示像素值完全一致。UI-10 当前 **6/52**。下一项进入 `LxInput`；`LxInputNumber` 桌面目标尺寸 P2 保持开放，待设计决策后复验；Vue3 Element Plus 替换继续等待全库门禁。

## 2026-10-14 UI-10 / Wave 20 LxSelect 严格矩阵关闭

- `LxSelect` 按 `design/表单控件八件套/` 完成组件、Demo、中文 API、状态和交互严格复核；定向单测 15/15、文档 E2E 8/8，Vue3 全量 Vitest 565/565，隔离 Mock 预览与竞态 E2E 10/10。
- Impeccable 双代理 Assessment A 36/40（Excellent），无开放 P0–P2；B 四个 detector 为有效 JSON `[]`、stderr 空、退出码 0，六个浏览器上下文注入成功，无页面错误、失败请求或 HTTP 错误响应。`[]` 只表示静态规则零命中。loading 有确定性 E2E 文案断言，但没有可信的 loading 专属截图。当前源码锁、A/B 和复审材料见 `.impeccable/critique/lxselect-final-2026-10-14-post-fix/`；综合 snapshot 和趋势见 `.impeccable/critique/2026-10-14T00-42-11Z__linkx-fe-src-components-lxselect-index-vue.md`、33/40 → 35/40 → 36/40。
- UI-10 当前 **5/52**；共享参考页约 10 项目录锚点为 P3 后续整理。该关闭仅针对 LxSelect 严格矩阵，不代表 Vue3 宿主替换、真实后端联调或人工读屏完成。下一步对 `LxTextarea` 取证后继续其他未关闭矩阵组件和已登记 P1/P2；Vue3 Element Plus 保留至全库门禁完成；页面操作引导暂缓、不列入待办或排期。

## 2026-10-13 LxInputNumber 当前版复核：桌面目标尺寸 P2 保持开放

- 独立 Assessment A **29/40（Good）**；Assessment B 对组件、样式、Demo 和中文文档执行四次 detector，均为合法 JSON `[]`、stderr 为空、退出码 `0`。Light/HUD × 1440px 桌面/375px 触屏四视图均完成浏览器注入。
- sm/md/lg 桌面外框为 28/32/40px，步进目标高 13/15/19px；触屏目标均为 44×44px。键盘操作、边界禁用和焦点可见；无页面横向溢出。overlay 命中归因到文档及 VitePress 外壳、HUD 令牌，不将静态 `[]` 单独作为视觉通过。
- 桌面目标低于 24px 的 P2 尚待设计决策；未获确认前保留设计稿竖向布局，不增加 UI-10 关闭数，`LxInputNumber` 严格矩阵行保持开放。完整 A/B 及截图见 `.impeccable/critique/lxinputnumber-wave19-current-2026-10-13/`。`LxTextarea` 已完成当前版组件级复核；下一项核验尚未关闭严格矩阵行的 `LxSelect`。

## 2026-10-13 Wave 18 / Checkbox 与 Radio 当前版复核及文档窄屏 P2 收口

- Checkbox/Radio 样式、Demo 与中文 API 按设计稿复核。Checkbox Demo 区分知情确认和通知渠道并演示 LxForm 必填校验；Radio Demo 分离当前选择和只读历史快照并演示必填校验。禁用勾选/半选、Radio hover/纵向选中/禁用文字均按设计与主题令牌调整。
- 375px 浏览器回归覆盖 7 张明显溢出表的提示、固定首列、ARIA 和方向键，以及 3 张短溢出表不进入 Tab 顺序。定向单测 **20/20**、当前文档 E2E **10/10**；lx-ui 类型检查、206 modules 构建、VitePress、Vue3 类型检查、目标 Prettier、E2E 测试文件 ESLint 和 `git diff --check` 通过。Vue3 ESLint 忽略 `linkx-fe` 源文件，未计作组件库 ESLint 通过。
- Assessment A **34/40（Good）**；两个示例分组 P3 已由 Light/HUD 桌面与 375px 视觉复验关闭，无开放 P0–P2。B 四个 detector 均为合法 `[]`/空 stderr/退出码 0，8 个独立视图无页面错误或失败请求。Radio HUD 两个选中标签命中符合主色令牌；375px 根宽增加仅发生在 overlay 注入后。独立代码复审确认旧版证据 P2 已在各交付台账关闭，无开放 P0–P2。桌面 VitePress 文档导航密度留为共享外壳 P3 单独评估。
- 当前 A/B、截图、源码指纹、综合报告和代码复审见 `.impeccable/critique/checkbox-radio-component-final-2026-10-13/`。旧版文档 P2 的 **8/8** 和六视图是历史结果；detector `[]` 只表示静态规则零命中。
- 本波不改变 UI-10 全库 **0/52** 口径，不代表四个组件严格矩阵全部关闭、Vue3 页面替换或真实后端联调。下一步按审计矩阵补齐 Checkbox/CheckboxGroup/Radio/RadioGroup 尚未关闭项；页面操作引导整体暂缓，只有用户重新提出需要时才恢复评估。

## 2026-10-13 Wave 17 / LxSelect 当前版组件级复核完成

- `LxSelect` 的实现、Demo 与中文 API 已按 `design/表单控件八件套/` 对照，覆盖 Light/HUD、禁用值对比度、远程空/错与重试、键盘操作及窄屏触控。390px 下触发器、选项行均为 44px；320px 注入前页面无横向溢出。
- 单测 11/11、文档 E2E 3/3；定向 ESLint、Prettier、`git diff --check` 通过。lx-ui 类型检查、206 modules 构建、VitePress 文档构建与 Vue3 生产构建在本波实现阶段通过。
- 正式 Impeccable A 33/40（Good），无 P0–P3；B 两个 detector 为 JSON `[]`/空 stderr/退出码 0，五种浏览器状态注入成功、浏览器错误为 0。overlay 命中按目标节点归因到文档内容、代码复制控件、页面外壳及设计令牌；注入导致的窄屏根宽变化未影响 body 或 Select Demo。独立代码复审无 P0–P3；完整 A/B、综合报告、snapshot/trend 见 `.impeccable/critique/lxselect-wave-2026-10-13/`。
- 本波关闭 LxSelect 当前版组件级复核，不增加 UI-10 全库 0/52 计数，也不代表 Vue3 宿主替换或真实后端联调完成。下一项修复 Checkbox/Radio 文档在 375px 下的 API 表格可读性 P2，再继续动态图标、`LxDynamicForm` 和其余矩阵项目。页面操作引导暂缓且不排期。

## 2026-10-13 Wave 16 / LxTextarea 当前版组件级复核完成

- `LxTextarea` 当前组件、Demo、中文 API 和主题/状态按设计源复核完成；初始到限/超限保持播报静默，正常转到到限/超限只播报一次。disabled/readonly 校验态隐藏计数但保留错误说明。
- 单测 14/14、共享基础控件文档 E2E 11/11；lx-ui typecheck、206 modules build、VitePress build、Vue3 `build:prod`、定向 ESLint/Prettier、组件 CSS/HUD token Stylelint 与 diff check 通过。`custom.css` 既有 14 个属性顺序错误均在本次未改动行。
- Impeccable A 31/40（Good），无 P0–P3；B detector `[]`/空 stderr/退出码 0，六个 Light/站点深色/HUD × 桌面/移动视图已完成。overlay 注入后移动根文档宽 630px，基线 390px 无溢出，E2E 无 overlay 的 320/375px 通过；归为检测覆盖层/页面外壳副作用。代码复审无 P0–P3，证据见 `.impeccable/critique/lxtextarea-wave-2026-10-13/current-final/`。
- 本波仅关闭 LxTextarea 组件级审查，不代表 Vue3 Textarea 宿主已替换，也不增加 UI-10 全库 0/52 计数。其后顺序为 LxSelect（已由 Wave 17 收口）、Checkbox/Radio 文档 P2、其他基础控件和动态图标，再进入 `LxDynamicForm` 与全库门禁。页面操作引导暂缓且不排期。

## 2026-10-12 Wave 15 / LxInputNumber 当前版组件级复核完成

- 组件、Demo 和中文 API 已按表单控件设计源复核；sm/md/lg 外框严格为 28/32/40px，步进按钮中间无间距，`controls` 参数可显示或隐藏。readonly 仍允许步进但不允许直接键入，边界禁用、方向键、Enter/空格、长按和卸载清理均有回归。
- 单测 18/18、文档 E2E 2/2；类型检查、206 modules 构建、VitePress、Vue3 类型检查与生产构建、目标 Stylelint/ESLint/Prettier 和 `git diff --check` 通过。最终生产构建保留仓库既有的 Element Plus 大 chunk、Less 变量导出和循环 chunk 警告。
- Impeccable A 31/40（Good）；B 两个 detector 为合法 JSON `[]`、stderr 空、退出码 0，四个 Light/HUD × 1440/390px 浏览器场景成功注入，页面错误和失败请求为 0。A/B 原始证据见 `.impeccable/critique/lxinput-wave-2026-10-12/final-stepper-event-fix/`；综合 snapshot 为 `.impeccable/critique/2026-10-12T14-02-10Z__127-0-0-1-components-lxinputnumber.md`，趋势首条 31/40。
- 桌面上下步进目标约 13/15/19px 高度保留为设计权衡：设计稿限定外框和分半布局；窄屏目标 44×44px，键盘操作已实测。该记录不代表桌面指针目标达到 24px 下限。表单错误态 Demo、重复尾注保留为 P3 后续项。
- 桌面目标高度 P2 尚待设计决策，严格矩阵行保持开放；下一项仍进入 `LxTextarea` 独立严格复核。页面操作引导保持暂缓，历史草案不计入当前任务和排期。

## 2026-10-12 Wave 14 / LxInput 当前版组件级复核完成

- 已对照表单控件设计源复核 `LxInput`、Demo 与中文 API；清空按钮支持键盘操作，触屏目标为 44×44px，补齐必填语义、禁用/只读差异、公开方法示例和窄屏布局。Demo 分组标题改为连续的 H2/H3 层级。
- 复审发现 `autocomplete="off"` 不应描述为隐私保障，现已在组件类型、API 文档和 Demo 中明确它只是浏览器提示，浏览器或密码管理器可能忽略，不能用来保护敏感信息。
- 单测 **13/13**（含父级 `LxForm disabled`、显式禁用和只读清空）、LxInput 文档 E2E **3/3**、邻接 InputNumber E2E **1/1**；共享基础控件 E2E 全量 6/8 的两项既有标签断言失配见交接记录。类型检查、205 个模块的库构建、VitePress 文档构建、Vue3 类型检查、相关 ESLint/Prettier 和 `git diff --check` 通过。Stylelint 因环境缺少 `postcss-less` 未能启动。
- 最终 Assessment A **34/40（Good）**，未发现 P0–P2；B 的组件与 Demo detector 均为合法 JSON `[]`、stderr 空、退出码 0。Light/HUD × 1440/390px 四视图成功注入，页面错误和失败请求均为 0。截图、overlay 归因、源码指纹和停服证据见 `.impeccable/critique/lxinput-wave-2026-10-12/`。
- overlay 行长命中在文档与 Demo 说明，移动裁切命中在 VitePress 导航，遮罩命中在代码块复制控件；未命中 LxInput 输入控件。注入造成的文档宽度变化属于标记层影响，注入前页面无横向溢出。
- codeview 提出的涉密文案、清空时 `change` 事件说明、显式禁用/只读清空回归与 `clearable` 类型注释问题均已修复；静态 detector 的 `[]` 只表示零条静态规则命中。
- codeview 未发现 P0–P2；联系电话计数文案与窄屏工具栏键盘焦点两项 P3 测试增强建议留待后续，不阻塞下一波。
- 本波不增加 UI-10 全库 52 项关闭数，不代表 Vue3 业务页替换、真实权限或后端联调完成。下一基础控件严格复核项为 `LxInputNumber`；页面操作引导继续暂缓，后续有需要再执行。

## 2026-10-12 Wave 13 / LxButton 当前版正式收口

- `LxButton` 已按按钮体系设计补齐语义变体、纯图标提示协调、明暗主题、减少动效、窄屏可见图标标签及 Demo 渐进展示；提示延迟 200ms，关闭 Element Plus 默认淡入淡出以避免提示重叠；320px/375px 折叠摘要触达高度至少 44px。
- 定向单测 **33/33**、文档 Playwright **19/19**、`vue-tsc --noEmit`、205 modules 库构建、VitePress 文档构建、目标 ESLint/Prettier 与 `git diff --check` 通过。E2E 通过 `playwright.lxui.config.ts` 和共用 Mock 拦截后端请求；首次错误配置导致的真实代理超时不计为产品失败。
- 代码复审原发现的 Tooltip 动效白名单、`md` 字号、触摸聚焦和标签可见断言问题均已修复。A 为 **32/40（Good）**，桌面纯图标标签 P2 已关闭；320px 工具栏高度与完整演示区焦点框两项 P3 决定保留并后置。B 的三个 detector 均为合法 JSON `[]`、stderr 空、退出码 0；8/8 Light/HUD 浏览器视图注入成功。overlay 命中归因、源码指纹和停服证据已归档；静态 `[]` 只代表零命中。
- 最终复审提出的 Ctrl+点击原页状态、主题迁移 Tooltip 可见性和位置两项 E2E 缺口已关闭：新增用例实际触发 Ctrl+点击，并检查迁移后 Tooltip 在按钮上方可见；没有增加组件实现改动。
- 组件单测 **33/33**、文档 Playwright **19/19**、`vue-tsc --noEmit`、205 modules 库构建、VitePress 构建、目标 ESLint/Prettier、差异检查及最终代码复审均通过。正式报告和 snapshot/trend 见 `.impeccable/critique/lxbutton-wave-2026-10-12/final-after-label-fix/`。
- 本波仅完成 lx-ui 组件与 Demo，不代表 Vue3 业务页按钮已全面替换，也不增加 UI-10 全库矩阵关闭数；后续先严格复核 `LxInput`（已于 Wave 14 完成），再继续表单基础控件与动态图标矩阵，随后进入 `LxDynamicForm`。

## 2026-10-11 Wave 11 / LxDescriptions 当前版正式收口

- `LxDescriptions` 当前版已完成 Demo 控件、长值/长状态、复制触控、窄屏 API 表格、错误重试、HUD 和 reduced-motion 的严格复核；中文文档、9 项单测和 3 项文档 E2E 同步。
- `typecheck`、203 modules 库构建、VitePress 构建、目标 Prettier 和差异检查通过。Assessment A 原始 4.1/5，综合按 0-4 口径为 31/40；Assessment B 42/42 视图完整，当前 detector 三件套为有效 `[]`、空 stderr、退出码 0。
- overlay 命中已归因到 VitePress 壳层、代码区、隐藏折叠内容或主题令牌；`[]` 不单独代表视觉通过。报告、snapshot/trend 和停服证据见 `.impeccable/critique/descriptions-wave-2026-10-11/`。
- 后续观察为桌面表格提示一致性和采集 role 字段；真实读屏器、后端、宿主页面迁移和 Vue3 `element-plus` 删除仍未关闭。下一项按组件审计矩阵进入未正式关闭的基础控件批次。

## 2026-10-11 UI-10 / Wave 12 LxMetricCard 与 LxSectionTitle 正式收口

- `LxMetricCard` 已补正常/成功/警告/危险读屏文本、进度 ARIA、0–100 边界、RTL 和减少动效；旧宿主 `valueType`、`title`、`footer`、`extra` props/slots 保留。
- `LxSectionTitle` 已补 `headingLevel`、副标题、插槽、320/375px 长标题换行和 Demo “查看”键盘反馈；Vue3 适配器与 `LxSectionTitleHeadingLevel` 根入口类型同步。
- `LxTag` small 为 `11px/16px`、上下 2px、左右 6px，来自设计稿 `py-0.5 px-1.5`。B 的 `cramped-padding` 命中因此记录为设计依据观察项。
- 定向单测 **32/32**、文档 E2E **4/4**、类型、203 modules 构建、VitePress、Vue3 生产构建、目标 ESLint/Prettier 和差异检查通过。A **37/40**；B 三 detector 为合法 `[]`/空 stderr/exit 0，10 个视图 overlay 成功；代码复审无 P0–P2。报告见 `.impeccable/critique/metric-section-wave-2026-10-11/`。
- 本波不关闭 UI-10 全库矩阵或宿主迁移；下一项是 `LxDescriptions` 正式 A/B，随后继续基础控件和 Vue3 页面组合回归。宿主 `element-plus`、权限和真实后端继续保留/后置。

## 2026-10-11 Wave 11 / LxVirtualTree 插槽布局与 TransferPanel 联回归完成

- `LxVirtualTree` 新增 `rowLayout`、`nodeSummary` 及公开插槽类型；`stacked`/`responsive` 统一固定行高和虚拟占位，`node` 插槽限定为展示型元信息，完整摘要通过 `nodeSummary` 暴露给辅助技术和标题提示。
- `LxTransferPanel` 改用公开行布局，移除树行元信息 `:deep` 覆盖；窄屏长名称增加键盘可操作的全文展开。组件 Demo/API、单测和文档 E2E 已同步。
- 定向单测 **67/67**、VirtualTree 文档 E2E **14/14**、TransferPanel 文档 E2E **33/33**，类型、203 modules 构建、文档构建、Vue3 生产构建和目标格式/Lint 通过。A **31/40**；B 四个 detector 均为有效 `[]`/空 stderr/exit 0，六个浅色/HUD 视图 overlay/DOM/键盘证据完整；代码复审批准。报告见 `.impeccable/critique/lxvirtualtree-wave11-2026-10-11/`。
- 遗留 P2：窄屏已选首屏密度、批量操作层级和 Demo 控制墙；P1 插槽风险已通过固定行公开契约与 `nodeSummary` 摘要边界化，不把多行 slot 当成可撑高内容。Vue3 页面替换、真实权限保存和 UI-10 仍未关闭。

## 2026-10-11 Wave 11 / LxDescriptions Demo 控件密度阶段性收口

- Demo 已将布局控制增加可见组名，数据状态统一为带标签的 `LxSelect`，保留边框、HUD、加载/空/错误/重试演示；状态 E2E 使用可访问 `combobox` 并覆盖键盘打开、移动和确认。
- 单测 6/6、文档 E2E 3/3、类型、目标格式和差异检查通过；A 31/40。B 三个 detector 为合法 `[]`/空 stderr/exit 0，但 Edge 启动失败，未形成 overlay，正式 Critique 仍未关闭。
- 后续 P1/P2：状态选项可发现性、窄屏首屏控件密度、HUD 影响范围和复制入口触达高度；下一项为当前版 `LxVirtualTree` 固定插槽行高与 TransferPanel 联回归。

## 2026-10-11 Wave 10 / TransferPanel 密度复验完成

- 已修复复选框视觉尺寸，树节点元数据可在 820px 文档预览列宽内收缩；折叠的 Demo 状态/主题区显示当前选择摘要。
- 修后文档 E2E 33/33，类型检查、203 模块库构建、VitePress 文档构建、目标 ESLint/Prettier 通过。窄屏拥挤观察复核为误报，桌面树行拥挤已处理。
- 最终 A 35/40，B 三 detector 为有效 `[]`/空 stderr/exit 0 且浏览器 overlay/截图证据齐备，代码复审无 P0–P3；综合报告与 snapshot/trend 已完成，详见 `.impeccable/critique/transferpanel-final-2026-10-11/`。先处理 `LxDescriptions` Demo 控件密度，再复验 `LxVirtualTree` 当前版固定插槽行高与 TransferPanel 联回归。

## 2026-10-10 Wave 9 / LxUpload 回灌 abort 回归完成

- 已补无 UID 文件生成 fallback UID、父级回灌后公开 `abort()` 的组合测试；单测 38/38 通过。
- 文档 E2E 首次 7/9，两个连接拒绝用例独立重跑 2/2 通过，当前证据合计 9/9；环境细节见 `.impeccable/critique/wave9-upload-2026-10-10/agent-notes.md`。
- 真实上传协议和业务页替换继续后置；下一入口为 `LxDescriptions`、`LxVirtualTree` 当前版正式复验。

## 2026-10-10 G2 修复复验（待最终快照收口）

- SearchBar Demo 已补四字段标准态并移除重复等待反馈；StatusSwitch 确认层已支持影响范围/审计提示，全部只读、loading、无权限行补齐可访问名称关联。
- 定向单测 `26/26`，类型、目标格式和 ESLint 通过；Assessment A/B 修后证据已落盘，最终综合报告和 snapshot/trend 仍是 G2 正式关闭门槛。

## 2026-10-10 G2 阶段性复核（历史记录，降级未正式完成）

- `LxSearchBar`：单测 8/8、文档 E2E 3/3；已完成搜索语义、loading/折叠字段提示、移动 44px 触控和减少动效处理。Assessment A 因浏览器不可启动降级为 **31/40（Good）**；B 的三个 detector 为有效 `[]`、stderr 空、exit 0，截图/DOM 证据已保存，但 overlay 注入未稳定完成。
- `LxStatusSwitch`：单测 14/14、文档 E2E 3/3，G2 合并 E2E 6/6；确认竞态、外部 modelValue/权限源变化、权限撤销、loading/只读 ARIA、Space 键盘和失败重试已覆盖。
- 库构建、单测/E2E、类型和目标格式检查已完成；本轮没有可用综合 Impeccable 报告、snapshot/trend，不能标记正式 Critique 通过。P1：SearchBar 四字段操作行与设计稿不一致、StatusSwitch HUD 与 Teleport 确认层可能脱节；P2：SearchBar 无 `meta` 时结果/错误状态、StatusSwitch 行名可访问名称、375px 复杂状态及确认/失败/只读路径实图、文档页 404 归因待补。Vue3 宿主替换继续后置。

## 2026-10-10 Wave 7 正式完成 / G2

`LxTransferPanel` 已完成组件级交付：定向单测 64/64、文档 E2E 32/32；组件与 Demo 采用 5:2:5 桌面布局，文档预览最大 820px，窄屏长名称两行折叠并支持全文展开，筛选隐藏后恢复展开状态，移除按钮在移动端保持 44×44px。lx-ui 类型检查、203 模块构建、VitePress 文档构建、目标格式/ESLint 和 Vue3 生产构建通过。

正式 Impeccable A 为 32/40；B 三个 detector 均为有效 `[]`、stderr 空、退出码 0，并完成浅色/HUD × 1440/390/320px overlay。代码复审无 P0–P3。P2/P3 密度建议进入后续台账；综合报告和快照见 `.impeccable/critique/wave7-transferpanel-2026-10-09/final-density-61/`。下一入口为 `LxSearchBar` + `LxStatusSwitch`，继续组件库优先和 Vue3 宿主替换后置规则。

## 2026-10-09 Wave 7 / LxTransferPanel 820px 预览复验

- 文档 Demo 预览最大宽度为 `820px` 并居中，窄屏铺满正文可用宽度；默认面板高度保留 `240px` 紧凑档，选择器现常显于预览上方，可切换 `300px`/`380px`。组件 API `panelHeight` 仍默认为 `380px`，窄屏保留 `352px` 最小面板高度。桌面待选标题与反选入口同行；组件和 Demo 局部重置 VitePress `details summary` 外边距。
- 修复桌面超长名称展开后的滚动边界：按展开正文和可视列表高度动态计算最多 8px 留白，紧凑面板也能完整显示正文；反选说明浮层改以待选面板标题区定位并校准到筛选框与树视口之间，避免说明宽度为 0 或遮挡树内容。
- 窄屏数量标签使用“待选”并在无障碍名称同步；组件文档在交互示例旁说明本地选择不代表权限已保存，真实保存状态仍由 UI-04 宿主按接口结果处理。
- 定向单测 `lx-transfer-panel.test.ts` + `lx-virtual-tree.test.ts` **64/64**；TransferPanel 文档 Playwright **30/30**，覆盖 1440px 下 820px 居中、390px 正文可用宽度匹配及无横向溢出。lx-ui/Vue3 类型检查、目标 Prettier、203 模块库构建和 Vue3 生产构建通过；文档构建待完成。
- 独立代码复审未发现 P0-P2；P3 旧交接计数/哈希已修正。最终版 Impeccable A/B 与正式 snapshot/trend 正在收口；在完成前不登记正式 Critique 通过。`[]` 仅代表静态规则零命中。
- UI-10 仍为 0/52，Vue3 `DataPermissionTree` 与真实保存反馈仍属 UI-04；保留 Vue3 `element-plus`。完成 A/B 和白名单提交推送后进入 G2 `LxSearchBar` + `LxStatusSwitch`。

## 2026-10-08 Wave 7 / LxTransferPanel 修后复验中

- 当前实现按设计稿提供 `5:2:5` 桌面布局、380px 同高面板、名称/部门编码筛选、节点元数据和未加载授权回显；`panelHeight` 默认 380px、最小 240px，非有限值回退为 380px；`LxVirtualTree.filterMethod(node, keyword)` 保留默认名称过滤并支持自定义匹配。桌面树项基准行高为 32px，普通短名称保持约 32px 紧凑单行，名称省略且编码/状态同行，未加载项标记与原始键值在名称下第二行，实际截断的长名称才提供 disclosure。TransferPanel 在 320–420px 窄屏为 64px、421px 起为 44px，VirtualTree 窄屏行高为 44px；窄屏名称完整换行，行高跨断点时焦点恢复到 `treeitem` 的 P2 已修，VitePress 文档站 SVG favicon 已加入。
- 两组件定向单测合计 64/64，`lx-transfer-panel-docs.spec.ts` 28/28；VirtualTree 文档 E2E 的 13 项另行统计。lx-ui typecheck、Vue3 `lint:ts`、目标 ESLint/Prettier、`git diff --check`、203 modules lx-ui build、VitePress docs build、Vue3 `build:prod` 均通过。保留 Vue3 构建既有 Less 导出、Element Plus circular chunk 与 chunk size 警告，VitePress 保留大 chunk 警告。独立代码复审批准，无 P0–P3。
- 当前旧 A/B 只作修复前基线、不计正式通过；Assessment B 浏览器证据已完成 **20/20**，正在收口证据索引及综合 snapshot/trend。Wave 7 为**正式审查收口中**。UI-10 仍为 0/52；Vue3 `DataPermissionTree` 替换属 UI-04，真实权限/后端联调需真实契约；保留 Vue3 `element-plus`。
- 新的严格隔离 A/B 正式完成后再提交、推送并进入 G2 `LxSearchBar` + `LxStatusSwitch`。

## 2026-10-07 Wave 6 / Cascader、Descriptions、VirtualTree 正式收口

当前源码、Demo 和中文文档已完成统一版本的组件级验收：VirtualTree/Descriptions 单测 18/18、6/6，文档 E2E 各 3/3，lx-ui 类型检查、库构建和文档构建通过。Cascader HUD 弹层、Descriptions 术语、VirtualTree 键盘事件/键碰撞/空键焦点和移动控件均已修复。Impeccable A 35/40；B 7 个 detector 为有效 `[]`、stderr 空、exit 0，四页浏览器 overlay 证据和当前源码指纹已保存。`[]` 只表示静态零命中；综合报告见 `.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/final-report.md`。

保留后续 P2/P3：Demo 控制区分组、VirtualTree 自定义插槽行高契约、Cascader loading 语义。下一入口 `LxTransferPanel` 已完成实现与行为回归，当前统一冻结版 A/B 收口中；正式归档后进入 G2 `LxSearchBar` + `LxStatusSwitch`，再回归宿主适配。Vue3 `element-plus` 直接依赖继续保留。

## 2026-10-07 Wave 5 / TreeSelect、Cascader 与 SelectPagination

- 当前版本实现、中文 Demo/API、行为回归和宿主文档 E2E 已收口：单测 **36/36**、文档 E2E **15/15**；覆盖键盘/清空、错误焦点和英文提示、移动触控、表单禁用继承、请求取消与迟到隔离、续页失败同页重试。
- 独立 Impeccable A **32/40**，B 9 个目标 detector 为有效 `[]`/空 stderr/exit 0，并完成 9 个浏览器 overlay 场景；代码复审无 P0–P2。A 的四项 P2 和长节点 E2E P3 进入后续文档/壳层整改。静态 `[]` 不等于视觉通过。
- 当前不增加 UI-10 52 项严格关闭数，不迁移 Vue3 业务页面，也不删除宿主 `element-plus`。先完成组件库下一批，再按矩阵替换宿主。
- 下一入口：Upload fallback UID/公开 `abort()` 组合回归，然后进入 Descriptions、VirtualTree、TransferPanel、MetricCard、SectionTitle、StatusSwitch、SearchBar 的设计对照、行为测试、浏览器证据、代码复审与 A/B。

## 2026-10-07 UI-13 / DynamicForm、DatePicker 与 Upload 正式收口

- 修复 LxUpload 根节点模板 ref 的 Vue 类型边界，并补齐必填字段 ARIA 回归；另修 `LxFormItem` 同批次移除反馈与清校验时的内部错误 ID 缓存及非幂等属性写入。字段类型预览测试逐类精确核对四组候选项。
- DatePicker/DynamicForm/Upload 定向单测 **89/89**、当前三份文档 E2E 合并 **43/43**（最新 DatePicker/Upload 子集 31/31）；Vue3/lx-ui 类型检查、目标 ESLint/Prettier、203 模块库构建和 VitePress 文档构建通过。文档构建保留既有 chunk 大小警告及 pnpm 旧配置提示。
- lx-ui Playwright 已从冲突的 4176 隔离到 4177；DynamicForm/Switch 来源拦截同步修正，Switch 兼容用例 6/6 通过。
- 独立代码复审未发现 P0–P2；fallback UID 回灌后公开 `abort()` 的组合测试留待后续 Upload 复验。Impeccable A 为 30/40；B 六个静态目标均为有效 JSON `[]`、stderr 空、退出码 0，10 个浏览器 overlay 场景已完成归因。综合报告和 snapshot 已归档；trend 只有本目标首次 30/40 记录。`[]` 只表示静态零命中，不单独代表视觉通过。
- 下一项按依赖顺序为 TreeSelect/Cascader 当前版本复核及 `LxSelectPagination` 禁用继承、竞态和续页失败恢复闭环。Vue3 宿主 Element Plus 替换仍等待全库门禁。

## 2026-10-06 UI-13 / LxUpload 跨实例 UID 修复

独立代码复审发现不同上传实例可能为相同无 UID 文件生成重复回退 UID。已将前缀生成改为模块级序列并新增双实例回归；DatePicker、DynamicForm、Upload 单测 69/69、文档 E2E 13/13、lx-ui 类型检查、203 模块构建、文档构建、目标格式和 Vue3 ESLint 通过，VitePress 保留大 chunk 警告。第二次独立代码复审批准，未发现可复现 P0–P2。旧 Assessment A/B 源码冻结不匹配且 B 浏览器证据不完整，须重建统一冻结后正式复验，不能登记 UI-10 严格矩阵关闭。

## 2026-10-06 UI-13 / DynamicForm 与 Upload 组件验收

- DynamicForm 字段已按 schema 类型拆成独立文件并组合公开 `Lx*` 控件；`value`/`change(nextValue)` 与 `v-model` 兼容，覆盖密码、远程选择、日期范围和单/多文件上传。
- `daterange` 使用默认日期清空行为时发出 `null`；DatePicker 公共事件类型、DynamicForm 字段 renderer、Demo 与宿主规范已对齐。
- 修复 LxUpload 受控队列重试时序、取消后迟到回调和 UID/URL/response/error 映射；Mock Demo 与中文 API 同步。
- 定向单测 69/69、UID 修复后文档 Playwright 13/13；lx-ui 类型检查、目标 ESLint/Prettier、203 模块构建和 VitePress 文档构建通过，文档构建保留既有大 chunk 警告。
- 独立代码复审发现并修复跨实例 fallback UID 重号；修后复审批准，未发现可复现 P0–P2。旧 Impeccable A/B 源码冻结不一致且 B 浏览器证据不完整，当前版本须重新执行；完成前仍标记为组件集成验收，不关闭 UI-10 严格矩阵。真实上传协议、LxForm 完整设计对照和 Vue3 页面替换仍待后续波次。
- 下一入口：按详细计划进行 TreeSelect/Cascader 当前版正式复验与远程分页选择闭环。

## 2026-10-06 Wave 3 / LxIcon 修后严格复核

`LxIcon` 对未知运行时名称显示有访问名称的问号图标；侧栏菜单先解析图标键并安全回退，设置入口改用现存 `setting` 名称；Upload 状态图标补充名称类型。中文总览增加语义检索、普通文档流搜索、清空回焦、P1 别名计数说明、暗色主题映射和高对比空态。组件单测 7/7、文档 E2E 当前复跑 2/2（单 Chromium 项目，含桌面及 320px 窄屏交互路径；375px 由独立浏览器评估覆盖）；Vue3/lx-ui 类型检查、Vue3 测试文件 ESLint、目标 Prettier、196 模块构建和文档构建通过。lx-ui 没有独立 ESLint 配置。

Impeccable A 修后为 37/40（修前 33/40）。独立 B 对 `LxIcon` 组件和中文文档分别保存 detector JSON、stderr、退出码，两个静态结果均为有效 `[]`；另在五种浏览器状态成功注入 overlay 并保存截图。命中逐项归为 CJK 行长误报、Shiki/VitePress 代码与导航壳层规则提示，没有命中图标控件；浅色默认页一条无 URL 的 console 404 未归因。静态 `[]` 只表示静态规则零命中。真实读屏器播报、权限菜单异常图标和 Firefox/Safari 尚未覆盖。展开 P1/P2 后的 26/29 项长列表保留 P2。综合报告为 `.impeccable/critique/wave3-lxicon-2026-10-06/final-report.md`，正式 snapshot 为 `.impeccable/critique/2026-10-06T02-52-50Z__linkx-fe-docs-components-lxicons-md.md`。

DynamicForm/Upload 组件级验收状态见本文件顶部；完成 Impeccable A/B 收口后，下一入口按详细计划转为 TreeSelect/Cascader 当前版正式复验与远程分页选择闭环。完整只读审计见 `.impeccable/critique/wave4-dynamicform-agent-audit/followup-review.md`。全库 UI-10/UI-11 完成前保留 Vue3 宿主 Element Plus。

## 2026-10-06 Wave 1 / LxPasswordInput 修后复核

320px 页内“交互示例”锚点现在避开 VitePress 移动目录；普通暗色文档主题同步映射到 Demo 和内部输入面，HUD 仍可独立切换；窄屏工具栏和展开的高级设置标签均达到 44px。单测 10/10、文档 E2E 9/9、类型检查、目标 ESLint/Prettier、lx-ui 类型检查与文档构建通过。独立代码复审批准；Impeccable A 32/40，B 的 3 个 detector 都是有效 `[]`/空 stderr/退出码 0，overlay 11 个目标归因为 HUD 主题提示或 VitePress 文档壳层。证据见 `.impeccable/critique/wave1-lxpasswordinput-2026-10-05/final-recheck-2026-10-06/`。密码字段宿主校验集成示例留在后续 Form/DynamicForm；移动目录项高度留在共享壳层。下一步先严格复核动态图标，再做 `LxDynamicForm`。

## 2026-10-05 Wave 2 / LxSwitch 复验

`LxSwitch` 的组件、Demo、中文 API、行为回归和独立代码复核已完成。单测 14/14、文档 Playwright 6/6；Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、196 模块构建和文档构建通过。代码复核批准，未发现可复现的 P0–P2 问题。Impeccable A/B 综合 32/40，是基于 29/40 的三项有界修后评分；源码、Demo、文档的 detector 结果均为有效 `[]`、stderr 空、退出码 0，仅代表静态规则零命中。报告与浏览器证据见 `.impeccable/critique/wave2-lx-switch-2026-10-05/`，实现提交为 `1679d9c`。

移动文档侧栏隐藏时的键盘顺序需在共享壳层波次复验；生产高影响开关的确认、授权审计和失败补偿由宿主依据真实业务契约确定；中文术语释义作为文档改进继续跟踪。`LxPasswordInput` 当前复核已记录在本文件顶部，动态图标严格复核已完成，当前进入 `LxDynamicForm`。这些交叉残项没有关闭前，不将组件计入统一严格矩阵关闭数。完成一波后继续下一波，组件实现/E2E 与项目计划/审计/Critique 证据分开提交并推送。

## 2026-10-05 Wave 2 / LxCheckbox 与 LxRadio 复验

`LxCheckbox`/`LxCheckboxGroup` 与 `LxRadio`/`LxRadioGroup` 的当前实现、Demo、中文 API、行为回归和独立审查已完成。定向单测 20/20、文档 Playwright 4/4；Vue3 类型检查、目标 ESLint/Prettier、lx-ui 类型检查、196 模块构建和文档构建通过。独立代码复审批准，未发现 P0–P2 代码问题。Impeccable A 为 34/40；B 覆盖 Checkbox/Radio 的亮色、HUD、375px 触屏、禁用、键盘和减少动效状态，Radio 最新矩阵 overlay 注入 16/16；四个组件目录与最终 Radio Demo 的 detector 均为有效 `[]`、stderr 空、退出码 0。`[]` 只代表静态规则零命中。A 留下 375px API 表格扫描效率 P2，窄屏虽有表格自身滚动且页面无横向溢出，阅读体验仍待优化；真实触屏高度已由 B 验证为 44px。报告、截图和综合 Critique 见 `.impeccable/critique/wave2-checkbox-radio-2026-10-05/`。严格矩阵行保留上述文档 P2。

## 2026-10-05 Wave 2 / LxSelect 交互复验

LxSelect 已完成配置式选项与插槽、远程空/失败状态和弹层开合两态恢复、HUD 弹层主色隔离、离线禁用候选项和窄屏触控选项。组件单测 10/10、当前文档 Playwright 3/3；Vue3 类型检查/目标 ESLint/Prettier、lx-ui 类型检查、库构建（196 modules）和文档构建通过，Luna max 独立代码复审最终批准。E2E 首次精确化时暴露 Select 下拉与折叠标签 tooltip 同带锚定类的问题，最终限定 `.el-select-dropdown.lx-select__popper` 后全绿。Assessment A-only 暂定 29/40；本波没有成功注入 overlay，也未生成当前版本持久截图或 snapshot/trend；detector 的有效 `[]` 只代表静态零命中，因此 LxSelect 严格矩阵行暂不关闭。下一项为 Checkbox/Radio。

## 2026-10-05 Wave 2 / LxDatePicker 短视口复验

DatePicker 短视口修复按实际边界选择原生锚点或居中浮层，日历面板独立滚动，弹层完整留在视口内。文档 Playwright 16/16，DatePicker/DynamicForm 定向单测 39/39；类型检查、库构建 196 modules、文档构建与目标 ESLint/Prettier 通过。正式 Impeccable A 为 31/40，B 覆盖 9 个浏览器场景并记录 detector、覆盖层与生命周期证据，独立代码审核批准。字段上下文遮挡、短屏末行滚动提示、桌面标签遮挡和底边距仍有 3 项 P2、1 项 P3 建议；DatePicker 严格矩阵行不关闭，后续按整改台账跟踪。报告位于 `.impeccable/critique/wave2-date-range-2026-10-05/final-review/`，综合快照为 `.impeccable/critique/2026-10-04T21-53-59Z__linkx-fe-src-components-lxdatepicker-index-vue.md`。下一项为 `LxSelect`；52 项矩阵与 UI-11 仍未关闭。

## 2026-10-05 Wave 2 / LxDatePicker Demo 子项

DatePicker 文档 Demo 已完成信息层级与窄屏弹层专项复核：日期区间示例前移，尺寸/扩展说明默认折叠，HUD 分隔符使用正文对比令牌，弹层宽度按视口减 16px 限制。文档 Playwright 12/12、lx-ui 类型/库构建/文档构建、Vue3 目标 ESLint/Prettier 通过；独立代码审核批准。375×812 下快捷范围弹层初始底部超出 54px，页面滚动后末行可见并可选，记录为需滚动查看的边界。当前组件评审 A/B 和综合 Critique 状态见本波归档；该子项不等于 Wave 2 全部组件或 52 项矩阵关闭。下一项为 `LxSelect`。

## 2026-10-04 基础控件复核状态

`LxPasswordInput` 的透传 `type` 不能覆盖内部密码遮罩；调用方传入 `type="text"` 的回归、显隐往返和只读组合单测 7/7 通过，修后独立代码复审批准，未发现 P0–P2。剪贴板默认允许，`preventClipboard` 只阻止前端事件，不构成凭据安全控制。Wave 1 的正式 Impeccable overlay/snapshot 因浏览器注入限制仍待补；当前按总计划继续 Wave 2 交互修复。

## 2026-10-04 后续任务拆分入口

组件库严格对照、DynamicForm/Form、基础控件、TreeSelect/Cascader、动态图标、登录页、Vue3 宿主替换和整站审查已按 Wave 0–12 拆分，详见仓库文档 `doc/PROJECT-FOLLOWUP-BREAKDOWN.md`。Wave 0 的 `LxDatePicker` 字段说明隔离修复、代码审核和定向回归已完成；正式 Impeccable A/B、overlay 与 snapshot/trend 仍待补。当前进入 Wave 1 基础控件批次。新增文档和注释使用中文；API 请求链保持 `.then().catch().finally()`；静态 detector `[]` 不作为正式视觉通过。

## 2026-10-03 Wave 6 交付与审查状态

TreeSelect/Cascader 的实现、Demo、API 和行为验收已完成：单测 17/17，VitePress 文档 Playwright 8/8（`playwright.lxui.config.ts`）。新增组件总览页和 Cascader 独立页均有可见交互 Demo。当前四个源码/文档 detector 结果均为有效 `[]`、stderr 空、exit 0，仅表示静态规则零命中。当前版本 overlay 注入预检被浏览器策略拒绝，10 月 2 日旧 overlay 早于当前代码/文档修改，因此 Wave 6 正式 Impeccable Critique 尚未完成，两个组件不登记为严格 UI-10 已关闭。基础控件批次按计划继续；Vue3 Element Plus 替换仍保持冻结。

## 2026-10-02 LxInputNumber 步进器修复

`LxInputNumber` 的 sm/md/lg 右侧步进器已改为按实际触发器高度连续贴合，Demo 增加 `controls` 参数开关，可验证显示与纯数字输入两种形态。InputNumber 定向单测 12/12、文档 E2E 1/1；基础控件批次和正式 Impeccable 审查继续进行。

## 2026-09-30 基础组件严格对照批次（新增）

在 TreeSelect/Cascader 之后，单独完成按钮和基础表单控件批次：`LxButton`、`LxInput`、`LxInputNumber`、`LxTextarea`、`LxSelect`、`LxDatePicker`、`LxCheckbox`/`LxCheckboxGroup`、`LxRadio`/`LxRadioGroup`、`LxSwitch`、`LxPasswordInput`。验收必须覆盖设计尺寸、边框/聚焦、错误/禁用/加载、主题、键盘、窄屏和减少动效，并补齐 Demo、API、测试、浏览器证据和 A/B 复验；未完成前保持 Vue3 Element Plus 替换冻结。

## UI-10 Wave 5 postfix 复验（2026-09-30）

Wave 5 独立 Assessment A 为 34/40；Assessment B 覆盖亮色/HUD、桌面/375px、Escape、错误恢复和 API 表格滚动，保存 16 张截图及 sidecar，外部请求 0。B 因 CUA 不可用使用 Playwright fallback，保留 `DEGRADED` 标记；P2/P3 建议和 UI-11 全库矩阵继续跟踪。

## UI-13 复修状态（2026-09-30）

`LxDynamicForm` 自适应布局已修正为由 container query 选择 3/2/1 列 span，避免行内样式覆盖两列断点；固定列、通栏、默认值和 reset 契约保留。新增公开 `LxTreeSelect`，树字段不再直接由 DynamicForm 引用 `ElTreeSelect`。LxForm 两个 Demo 也已切换到公开 Lx 基础控件。Form Assessment A 29/40 与 B 证据为历史记录；TreeSelect/Cascader 的实现和文档行为验收已完成，当前正式 Critique 仍待 overlay 与复验。

目标是让 lx-ui 与 LinkX 管理端的实际密度、交互、主题和状态保持一致，同时保持组件库业务无关。

## 优先级

| 优先级 | 内容                                                                                                                                                          | 验收重点                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| P0     | 先完成 `design/` 基础控件（button、表单八件套等）的 Element Plus 样式桥接并复核动态图标；再完成 `LxDynamicForm`；随后验收 SearchBar/StatusSwitch 等待替换控件 | 库级 Demo、键盘、窄屏、明暗主题、减少动效 |
| P1     | Upload、SelectPagination、Descriptions、人员选择弹窗壳、useTable、统一 loading/empty/error                                                                    | adapter 注入、取消、重试、分页和错误恢复  |
| P2     | VirtualTree、TransferPanel、motion primitives、低频业务组件                                                                                                   | 大数据量、动画降级和多场景复用            |

## 与 Vue3 宿主的执行顺序

### UI-13 表单第一波实施状态（2026-09-30）

`LxDynamicForm` 已完成字段子组件拆分、Lx 基础控件组合、`value`/`change` 受控契约、单/多文件列表和容器自适应布局；自适应 span 覆盖问题已修复。`tree-select` 已由公开 `LxTreeSelect` 承接，TreeSelect/Cascader 的文档行为验收已完成；当前正式组件 Critique 尚未完成。LxForm 设计稿逐项浏览器证据、基础控件及全库 UI-10 和 UI-11 Critique 仍未完成。

2026-10-19：`LxDescriptions` 当前版复验收口。单测 10/10、文档 E2E 3/3、typecheck 通过；长值/长状态的键盘、触屏、HUD、375px 和 reduced-motion 状态已验证。旧 Assessment A 的 27/40 标为修前基线，Assessment B 当前版证据已归档；真实业务详情宿主和 UI-11 整库 Critique 仍未完成。

Vue3 页面中的共享控件替换会重复影响表单、弹窗、表格、搜索、树、键盘焦点和窄屏行为，因此组件库的高频契约先于整页深交互验收。执行时保留 API、字段、状态值和 Vue2 既有菜单/按钮权限等不依赖视觉组件的核查；已通过的页面测试作为基线，不因排期变化作废。

| 顺序 | 工作                                                                                      | 进入下一步的条件                                                                                                                               |
| ---- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 对照 `design/` 完成基础控件桥接与状态 Demo；复核 `doc/LxIcon*` 动态图标                   | 按钮、表单八件套及其他基础控件的键盘、窄屏、主题和减少动效有浏览器证据；图标已有单测与浏览器证据                                               |
| 2    | 按 UI-13 对照设计重做 `LxForm` / `LxDynamicForm`                                          | fields 通过独立子组件只组合 Lx 基础组件；React/TSX 友好受控值并保留 v-model；单/多图片列表；容器自适应 1/2/3 列；状态、键盘、Mock 与浏览器检查 |
| 3    | 对所有 lx-ui 组件逐项核对 design 并修正，再完成 Impeccable 组件/动效审查                  | 建立完整映射；按状态、尺寸、间距、焦点、主题、窄屏和减少动效逐项对照；建议修复并复验后才进入宿主替换                                           |
| 4    | Vue3 统一从 lx-ui 导入 Element Plus 组件、服务、类型和 locale，并按组件影响面分批替换页面 | pnpm 严格依赖解析、类型检查、构建与受影响页面回归通过；保留适配层的分页、选择、取消和校验语义                                                  |
| 5    | 完成业务 Mock/E2E、整站 Impeccable 审查，最后移除 Vue3 宿主的 element-plus 直接依赖       | 页面交互、默认/全菜单 E2E、类型、Lint、单测、生产构建及浏览器检查通过；真实联调单独记录                                                        |

`design/` 是控件视觉和交互规格的当前来源，`doc/LxIcon*` 是动态图标清单来源。每项都要跟踪设计源、lx-ui 实现、Vue3 采用位置和对应验证。动态图标和基础控件桥接已有库级浏览器验收；`LxDynamicForm` 旧版已验收，但按 UI-13 重新打开架构任务：当前 `columns` 固定指定列数、`upload` 依赖宿主插槽、字段由单文件条件分支渲染，尚未满足 type 子组件、Lx 基础控件、受控值式 API、单图/多图列表与容器自适应要求。`LxSearchBar` 的成功/空/错、loading、重置、展开及 375px 窄屏也已验收。`LxDialog` 有独立 API/Demo、4 项宿主单测和 3 项文档 Playwright；375px 下弹窗在视口内、表单单列、页面无横向溢出、触屏目标至少 44px，另覆盖标题可访问名称、焦点环、减少动效、校验、提交、ESC 和自定义 footer。`LxUpload` 已新增设计映射、注入式 Mock、独立 API/Demo、4 项单测和 3 项 Chromium 文档验收，覆盖进度、成功/失败重试、取消、格式校验、禁用、触屏、主题和减少动效。`LxDescriptions` 已对照详情描述行设计补齐 32px 行高、标签宽度/布局、复制字段与状态点；6 项单测、3 项文档 Playwright 覆盖复制键盘焦点、状态、375/320px 布局、480px 抽屉、主题和减少动效，组件级 Impeccable 定向检查 19/20 且 detector 为 `[]`。其他待替换组件仍需补齐独立证据；组件库闭环后先用 Impeccable 审查组件与动效，再迁移 Vue3 页面，Vue3 替换完成后再审查全站页面。Vue2 代码作为迁移对照；迁入 Vue3 的页面直接采用 lx-ui，Vue2 运行时不直接依赖 Vue3 组件。

不为清单中的每种 Element Plus 标签都新增 Lx 包装；没有通用封装时直接从 lx-ui 使用其导出的 Element Plus 控件。每个组件替换波次之前仍要以一个真实宿主场景校验库组件组合，避免只在独立 Demo 中通过。

### 2026-09-30 优先级调整

最新提交 `2a93ef1` 已加入 LxInput、LxInputNumber、LxTextarea、LxSelect、LxDatePicker、LxCheckbox/Group、LxRadio/Group、LxSwitch、LxButton 等基础封装。先对照 `design/` 严格复核并调整 LxForm 与 LxDynamicForm；动态表单的字段子组件只组合公开 Lx 控件，Element Plus 仅保留在 Lx 封装内部。随后建立全部 lx-ui 组件与设计源的逐项映射并修正视觉/交互差异，完成正式 Impeccable 组件与动效审查后，才开始 Vue3 Element Plus 全量替换。

LxIcon 图标总览页已有一次正式单目标 Critique，评分 27/40，快照见 `.impeccable/critique/2026-09-27T22-24-39Z__linkx-fe-src-components-lxicon-index-vue.md`。静态源码扫描 `[]` 不表示浏览器页面或动效通过；浏览器 overlay 列出 4 个文档壳层命中，但标题计为 3 个。随后主会话浏览器抽查 `delete`：hover 触发 `lx-icon-delete-shake`，`prefers-reduced-motion: reduce` 下 animation/transform 关闭且 transition 为 `0s`；键盘焦点边框已通过文档 Playwright 验收，其他代表性动效仍待覆盖，整库 UI-11 仍待 UI-10 其他候选闭环后完成。

## 组件行为证据

| 组件                 | 当前证据                                                                                                                                                                                                                                                                             | 未完成                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LxIcon`             | 94 个标准图形、96 个可用名称；静态 detector `index.vue` 返回 `[]`/exit 0；图标总览页正式 Critique 27/40，snapshot 已保存；浏览器 overlay 细项 4 条而标题计数为 3 条；delete hover/reduced-motion 抽查通过；键盘焦点边框已通过文档 Playwright 验收，当前只显示一条贴合卡片的主色边框  | 处理暗色标题对比、分组浏览和尺寸引用；补测其他代表性图标动效；该目标评审不代表整库 UI-11 完成                                                                                  |
| `LxVirtualTree`      | Vue3 宿主单测覆盖虚拟窗口、过滤祖先、禁用节点选择、键盘焦点、公开方法与 node 插槽；独立 Demo/API 页覆盖 props、events、slots、exposes、状态、级联切换及 HUD 主题                                                                                                                     | 文档构建通过；Chrome 桌面交互/方向键、375px HUD 深色、错误/空状态与无横向溢出通过                                                                                              |
| `LxForm`             | 基础 wrapper 与焦点、错误、禁用、网格已有浏览器回归；最新提交增加 LxInput/LxSelect/LxDatePicker 等独立基础封装                                                                                                                                                                       | UI-13 待对照设计稿核验标签、宽度/间距、组件边框/焦点、错误/禁用、明暗主题、窄屏；业务组合只使用 LxForm/LxFormItem 与 Lx 控件；补正式浏览器证据                                 |
| `LxDynamicForm`      | 旧版 Vue3 宿主定向单测 5 项；独立 Demo/API 页覆盖成功/空/错、联动、禁用、重置、栅格和注入式 Mock（作为回归基线）；最新提交的 Lx 基础控件尚未接入                                                                                                                                     | UI-13 待做：按 type 拆独立字段子组件且只组合 Lx 基础控件、value/change + v-model 兼容、单图/多图上传列表、容器自适应 1/2/3 列、完整类型/文档/Mock/浏览器及正式 Impeccable 验收 |
| `LxSidebar`          | 独立中文 API/Demo；文档 Playwright 2/2 覆盖 expanded/rail 分组键盘、单次 select、浮层焦点与 Escape、移动模态抽屉焦点循环/返回、HUD 主题及减少动效；VitePress 浏览器已检查实际渲染                                                                                                    | UI-11 正式视觉/动效审查待 UI-10 闭环；Vue3 现有权限菜单外壳仍未采用，后续替换需保留动态菜单、搜索和“全部菜单”目录契约                                                          |
| `LxBreadcrumb`       | 独立中文 API/Demo；壳层 Playwright 覆盖键盘选择、宿主 `preventDefault()` 与外部原生导航边界                                                                                                                                                                                          | Demo 使用 `.test` 外部地址以避开 VitePress 同源路由接管；实际 Vue Router 宿主契约仍需页面级复验；UI-11 正式 Critique 未完成                                                    |
| `LxNavbar`           | 独立中文 API/Demo；壳层 Playwright 覆盖搜索、通知、用户菜单和 375px 组件容器宽度；修复 `99+` 徽标覆盖通知按钮点击区域                                                                                                                                                                | 真实宿主组合仍按 UI-04 逐页回归；UI-11 正式视觉/动效审查待 UI-10 闭环                                                                                                          |
| `LxTabsBar`          | 独立中文 API/Demo；壳层 Playwright 覆盖切换、关闭、右键事件、新建和 375px 局部滚动容器                                                                                                                                                                                               | Vue3 实际业务页的动态页签持久化与路由回归仍待 UI-04；UI-11 正式 Critique 未完成                                                                                                |
| `LxPageCard`         | 独立中文 API/Demo；壳层 Playwright 覆盖插槽、加载遮罩、`aria-busy`、具名 region、内边距/边框开关和 375px 容器                                                                                                                                                                        | Vue3 实际业务组合仍待 UI-04 回归；UI-11 正式视觉/动效审查待 UI-10 闭环                                                                                                         |
| `LxSplitLayout`      | 独立中文 API/Demo；3 项单测和 3 项文档 Playwright 覆盖 200–480px 限宽、折叠布局、键盘/拖动、375px 表格局部滚动、HUD 深色和减少动效                                                                                                                                                   | Vue3 业务页尚未采用；UI-11 正式组件/动效 Critique 待 UI-10 闭环；容器限宽与主区同行已按浏览器行为复验                                                                          |
| `LxDutyCalendar`     | 独立中文 API/Demo；8 项单测、3 项文档 Playwright 覆盖 42 格、周起始、日期选择、月份边界焦点、slot、宿主状态、375/320px、HUD、对比度和减少动效                                                                                                                                        | 没有专属 `design/` 日历稿；Vue3 排班日历需适配班次详情 popover、loading、月份查询事件和实例方法；UI-11 正式 Critique 待 UI-10 闭环                                             |
| `LxSearchBar`        | Vue3 宿主定向单测 3 项，覆盖受控值更新、默认值重置并立即查询、loading 禁止查询及展开字段                                                                                                                                                                                             | 文档构建通过；Chrome 成功/空/错和失败恢复通过；375px 展开全部 10 项条件且页面宽度保持 375px                                                                                    |
| `LxDialog`           | Vue3 宿主单测 4 项，覆盖可访问标题契约、确认/loading、取消/关闭和 footer；独立 Demo 提供表单、危险操作与自定义 footer                                                                                                                                                                | 文档构建通过；文档 Playwright 3/3，覆盖 375px 面板尺寸、单列表单、44px 触屏目标、键盘焦点、减少动效、校验/提交/ESC/footer                                                      |
| `LxProTable`         | 独立中文 API/Demo；Vue3 文档 Playwright 4 项覆盖跨页选择、清空、加载/减少动效、空/错恢复、排序、375px 局部滚动/键盘、44px 复选目标及 HUD 深色；宿主兼容层另有 4 项单测                                                                                                               | `tableAttrs`/自定义列/脱敏边界和真实业务宿主回归仍待后续组件替换波次；整库 Impeccable 审查未完成                                                                               |
| `LxPagination`       | 中文 API/Demo；5 项库单测、2 项 Vue3 适配器单测及文档 Playwright 3/3，覆盖事件顺序、autoReset/autoScroll、旧 `page/limit/pagination` 契约、自定义 layout、背景、zh-cn locale、主题和 375px 键盘局部滚动                                                                              | Vue3 仍有 4 处页面直接使用 `el-pagination`，须按各页契约迁移；当前 detector `[]` 只表示静态规则零命中，正式 Impeccable Critique 仍待 UI-10 闭环                                |
| `LxSelectPagination` | 独立中文 API/Demo；文档 Playwright 3 项覆盖 targetMap 跨页回显、远程搜索、旧请求取消、失败重试、空结果、375px 弹层边界、Escape 和 48px 分页按钮；兼容 `api`/`valueMap`                                                                                                               | 人员/部门实际宿主替换和 Vue2 取消语义核对仍待 UI-04 波次；整库 Impeccable 审查未完成                                                                                           |
| `LxUpload`           | 独立中文 API/Demo；宿主内存 Mock 适配器注入；单测 4 项，文档 Playwright 3 项覆盖手动/自动提交、进度、成功/失败重试、取消、格式校验、禁用、375px 触屏、HUD 深色和减少动效                                                                                                             | 地图/图标/Excel 业务页替换及真实上传协议联调仍待迁移波次；`chunkSize` 只透传给宿主，不代表组件内置分片实现；整库 Impeccable 审查未完成                                         |
| `LxDescriptions`     | 独立中文 API/Demo；单测 6 项覆盖布局、紧凑行、脱敏和插槽；文档 Playwright 3 项覆盖 32px 行高、复制键盘焦点、状态点、375/320px 抽屉边界、主题及减少动效                                                                                                                               | 阶段性组件启发式复核 19/20，建议已吸收；detector `[]` 只表示静态规则零命中，不是正式 Critique 通过；Vue3 业务详情页仍待替换，整库 Impeccable 审查未完成                        |
| `LxMetricCard`       | 对照 `design/指标卡 MetricCard/`；独立 API/Demo；6 项单测覆盖宿主旧 props/slots、语义色优先级、趋势箭头映射、进度边界/读屏/对比度、RTL 与长标题；文档 Playwright 2 项覆盖 LxIcon 趋势图标、320px、HUD 深色和减少动效                                                                 | Vue3 详情抽屉 6 处宿主引用尚未替换，需在 UI-04 对照实际页面组合；UI-11 整库 Impeccable 审查未完成                                                                              |
| `LxAuthImg`          | 独立中文 API/Demo；6 项单测覆盖公开 URL、Blob 请求、载入事件、对象 URL 回收、取消竞态、回退和空状态；3 项文档 Playwright 覆盖本地 Blob、失败恢复、375px/HUD、键盘和减少动效                                                                                                          | Vue3 AuthImg 适配器仍持有鉴权请求，待 UI-04 注入 `.then().catch().finally()` Blob 适配器并逐页回归；真实鉴权联调未执行；UI-11 整库审查未完成                                   |
| `LxStatusSwitch`     | 对照 `design/状态开关 StatusSwitch/`；独立中文 API/Demo；宿主单测 6 项、文档 Playwright 3 项覆盖旧 `0/1` 值、关闭确认/取消、只读、loading、失败恢复、4.5:1 对比度、焦点、42×20px 轨道与 375px 44×44px 点按区、HUD 深色及减少动效                                                     | 库级设计和交互验收完成；Vue3 业务适配器仍使用 Element Plus，尚待宿主替换；整库 Impeccable 审查未完成                                                                           |
| `LxPasswordInput`    | 独立中文 API/Demo；文档 Playwright 3 项覆盖明文切换、清空、focus/blur/select、剪贴板拦截、只读/禁用和 375px HUD；Vue3 宿主适配器单测纳入全量回归                                                                                                                                     | 组件文档和状态演示已补；真实登录/改密联调仍依赖后端；整库 Impeccable 审查未完成                                                                                                |
| `LxTransferPanel`    | 对照 `design/虚拟滚动树 + 双栏穿梭/`；独立中文 API/Demo；30 项单测、文档 E2E 28/28，覆盖全选/反选、树外键保留、禁用节点、上限、清空、宿主状态、窄屏触控、键盘焦点及 HUD 深色；桌面 32px 基准行高、320–420px 为 64px、421px 起为 44px；VirtualTree 34 项单测、文档 E2E 13/13 另行统计 | 库级验收完成后仍需对 Vue3 `DataPermissionTree` 的 props、exposes、勾选与回传契约做宿主替换回归；整库 Impeccable 审查未完成                                                     |
| `LxSectionTitle`     | 独立中文 API/Demo；11 项库单测和 2 项 Vue3 适配器单测通过；文档 Playwright 1/1 覆盖三种变体、字号/标签、键盘操作、HUD 主题、长标题和 320/375px 窄屏                                                                                                                                  | 配置页真实组合回归仍待 UI-04 波次；UI-11 整库 Impeccable 审查未完成                                                                                                            |
| 其他高频组件         | 类型检查、组件库构建及文档构建通过                                                                                                                                                                                                                                                   | 按宿主实际采用范围补行为单测、状态 Demo、键盘/窄屏/主题浏览器验收                                                                                                              |
| `LxEmpty`            | API/Demo 已对齐 64px/48px 尺寸、`imageSize` 兼容和 `default`/`footer` 插槽；历史阶段性评审 28/40、修正后 34/40，均未满足 skill 正式 Critique 的独立评审和快照要求；detector `[]` 只表示对应源码静态零命中                                                                            | UI-11 正式组件/动效审查仍待 UI-10 闭环后按 skill 补齐；Vue3 15 处 `el-empty` 尚未替换，之后按实际 `image-size`/`class` 用法逐页回归                                            |

`LxActionButtons` 已按 `design/按钮体系/` 完成 UI-10 严格矩阵复核；当前 18 项单测、9 项文档 Playwright、A 33/40、B 八视图和代码复审均通过，显式空权限与公开操作的 Demo P2 已关闭。Vue3 仍有 29 处使用宿主 `ActionButtons`，组件替换和契约适配尚未开始；真实权限后端未联调，整库 Impeccable 审查仍待全部候选闭环。

## 多场景矩阵

| 场景       | 必须覆盖                                                                          |
| ---------- | --------------------------------------------------------------------------------- |
| 管理表格   | 加载、空态、失败、重试、分页、排序、跨页选择、窄屏横向滚动                        |
| 动态表单   | 单列/双列/三列、必填、联动、异步选择、上传、插槽、校验失败                        |
| 弹窗和抽屉 | 键盘焦点、Escape、确认关闭、重复提交、失败重试、窄屏全屏化                        |
| 导航与状态 | 侧栏折叠、面包屑、状态点文字、权限隐藏、主题切换                                  |
| Demo       | props/events/slots/exposes、loading/error/empty/disabled、320/390/768、light/dark |

## 动画策略

- 动画只表达状态变化、层级进入和操作反馈，不延迟关键提交或错误信息。
- 统一使用 token 控制时长和缓动，提供短、中两档；列表和表格避免逐行长动画。
- 所有过渡在 `@media (prefers-reduced-motion: reduce)` 下缩短为近乎即时或禁用，仍保留焦点和状态变化。
- Demo 必须展示正常动效与减少动效两种结果；浏览器验收记录实际状态，不以源码推断。

## 发布与兼容

- 公共组件 API 变更必须同步类型、Demo、变更说明和宿主适配层。
- lx-ui 不依赖业务请求、Router、Pinia 或登录凭据；网络能力通过 adapter 注入。
- 构建顺序固定为 typecheck、library build、docs build，再由 Vue3 宿主执行页面和浏览器回归。

## 图标清单进度

| 阶段                        | 状态   | 证据                                                                                                               |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| P0 规范归并与 13 个核心动效 | 已完成 | `docs/components/lxicons.md`、宿主 `tests/unit/lx-icon.test.ts`、`pnpm test:e2e:icons`                             |
| P1 业务语义与 29 枚扩展动效 | 已完成 | 69 个去重名称单测；桌面悬浮/键盘、对齐卡片边界的焦点样式、Chromium 触屏、减少动效和 320px 浏览器验收见总计划 UI-08 |

### 2026-09-30 UI-13 LxForm 首错焦点修复复验

- 修复 `linkx-fe/src/components/LxForm/index.vue` 的首个无效字段聚焦：表单组件挂载后记录真实 `<form>` 根节点，校验失败时按 `.then().catch()` 契约在当前帧、下一帧和事件队列末尾重试聚焦。
- 新增 `other-admin/admin-vue3/tests/e2e/lx-form-docs.spec.ts` 断言，桌面与窄屏提交失败后首个错误输入必须获得焦点并保留 `aria-invalid="true"`。
- 浏览器证据：`.impeccable/critique/form-focus-postfix-2026-09-30/browser-evidence.json`，桌面 1280px 和移动 375px 均首错聚焦、无横向溢出、无外部请求；静态 detector 四个目标 JSON 有效为 `[]`、stderr 为空、退出码 0，仅记静态零命中。
- 验证：LxForm 文档 Playwright 3/3；Vue3 定向单测 34/34；lx-ui `vue-tsc --noEmit`；`git diff --check` 通过。Form 正式 Impeccable 综合仍未关闭，下一步继续 Wave 5 A/B 与全库严格矩阵。

### 2026-09-30 UI-10 Wave 3 LxSidebar reduced-motion 复验

- 修复 `LxGauge` 在 `prefers-reduced-motion` 下的 transition 覆盖优先级，使用 `transition: none !important` 保证基础 token 的全局 `0.01ms` 降级不会被组件 scoped 规则覆盖。
- 修正文档 E2E 的状态定位：`LxGauge` 只在 Sidebar rail footer 渲染，测试改为先切换受控示例到 rail，再检查圆环动效；移动抽屉回归保持。
- 验证：`lx-sidebar-docs.spec.ts` 2/2；LxUI 全量文档回归 67 项中 66 通过、1 项旧 Sidebar 测试失败已修复后单独 2/2；LxGauge 与 LxSidebar detector 均为有效 JSON `[]`、stderr 0 字节、退出码 0。`[]` 仅代表静态规则零命中，Wave 3 仍需正式 A/B Critique。

## 2026-10-04 Wave 0 复验

`LxDatePicker` 字段说明已按实例同步到实际输入，单值、区间和相邻实例回归通过；当前工作区 DatePicker/DynamicForm 单测 36/36，组件库类型、构建和文档构建通过。正式 Impeccable A/B 和修复后 overlay/snapshot 仍待补；进入 Wave 1 基础控件第一组。

### 2026-10-11 UI-10 Wave 11 P2：TransferPanel 与 VirtualTree 结项

- `LxTransferPanel` 与 `LxVirtualTree` 完成当前源码冻结版的 P2 收口：Demo 标准高度默认为 380px，支持 240/300px 边界；长名称可展开；VirtualTree summary 使用 LxIcon chevron；批量栏显示可加入/已选计数，禁用摘要短提示与完整 ARIA 原因分层；减少动效和原生 details marker 均已处理。
- 单测合计 67/67，文档 E2E 合计 48/48；类型检查、203 modules 构建、VitePress、Vue3 生产构建、目标 Prettier 和 diff 检查通过。新增注释和文档均使用中文，API 请求规则未改变。
- Impeccable 正式双路已完成：A 36/40（Good），B 5 个 detector 为合法 `[]`/空 stderr/退出码 0，9 个独立浏览器视图完成 overlay、DOM、键盘和截图证据；代码复审 P0-P3 全部为 0。综合报告和正式 snapshot/trend 见 `.impeccable/critique/transferpanel-p2-2026-10-11/`。
- `[]` 仅表示静态 detector 零命中；本波只有 Demo 设置区展开后选项较多的 P3。宿主保存状态、真实权限联调、读屏器专项和 `DataPermissionTree` 迁移仍未完成。下一步进入 `LxMetricCard` + `LxSectionTitle` 严格审查，再收口 G2 `LxSearchBar`/`LxStatusSwitch`。

2026-10-17：`LxPasswordInput` 修后验证完成，单测 11/11、文档 E2E 9/9；清空操作不抢占显隐按钮后的 Tab 顺序，窄屏 44px 触控按钮不改变尺寸档外框。Impeccable A 32/40，B detector `[]`/空 stderr/退出码 0，桌面与 375px 浏览器证据通过。下一批为 `LxMetricCard` 与 `LxSectionTitle`。

2026-10-17：`LxMetricCard` 与 `LxSectionTitle` 单测 33/33、文档 E2E 4/4；两个 detector 为 `[]`/空 stderr/0，1280px/375px 浏览器注入通过。独立评审代理服务 503，本轮为降级设计评估，待恢复后补完整 A；下一批进入 G2 搜索栏/状态开关。
2026-10-18 `LxDynamicForm`/`LxForm` 文档 P2 收口：20/20 文档 E2E、lx-ui 类型检查和 VitePress 构建通过；折叠 API、44px 键盘 summary、窄屏表格导航、普通暗色令牌桥接及 SPA 重绑定已完成。四个 detector 均为合法 `[]`/空 stderr/0，清洁 Light/HUD 桌面/移动浏览器证据无页面级溢出；`[]` 不单独作为正式 Critique 通过。首列 sticky、API 锚点、真实读屏器和 MutationObserver 性能仍开放。
2026-10-18 `LxStatusSwitch` 无权限状态可访问性补强：无权限降级标签保留当前状态并播报只读原因，支持 `aria-description` 透传；组件单测 21/21、宿主适配器单测 2/2、文档 E2E 4/4、typecheck/build 通过。detector 三件套均为 `[]`/空 stderr/0，静态结果不单独代表正式 Critique；真实权限保存和宿主全量迁移仍后置。

## 2026-10-18 LxInput 前后缀统一高度轨道

- **问题**：仅依赖 Element Plus `--el-input-height` 时，输入内容、prefix/suffix 与 prepend/append 在主题或尺寸切换时可能分别计算高度，出现上下边界不一致。
- **改动**：新增组件级 `--lx-input-track-height`，由输入框根节点统一提供；所有输入内框、内容输入节点、前后缀槽位及外侧复合块从同一轨道取值，窄屏触控态统一切换为 44px，并同步 Element Plus 输入行高变量。
- **验证**：复合前后缀文档 E2E 增加轨道令牌与输入行高断言，覆盖 sm/md/lg 与 390px 窄屏；类型检查、构建、格式、单测 13/13 通过。Impeccable A 32/40；B detector 合法 `[]`/空 stderr/退出码 0，8/8 浏览器视图注入成功。移动文档壳层横向溢出保留为待归因信号。
## 2026-10-18 G2 LxSearchBar Escape 语义收口

- 默认 Escape 遵循原生退出语义，`escapeReset` 仅用于兼容旧页面的全量重置；选择器、日期和级联弹层行为不变。
- 13/13 单测、5/5 文档 E2E、lx-ui 类型/构建/文档构建及目标格式检查通过；A 34/40，B 已保存独立静态与浏览器证据。
- 下一步继续 UI-10 未关闭组件和宿主契约回归，完成整库 UI-11 后才进入 Vue3 Element Plus 分批替换。
## 2026-10-18 LxCodeSlot 复制中反馈收口

- 复制中展示 `loading` 图标、`aria-busy` 和“正在复制”，并阻止重复点击；文档和受控剪贴板 E2E 已同步。
- lx-ui 专用 E2E **1/1**，typecheck、格式和差异检查通过。真实剪贴板权限、宿主组合和 UI-10 全库审查继续开放。

## 2026-10-19 LxInput 高度轨道补强

- 前后缀与输入框统一使用 lx-ui 控件高度令牌，避免 Element Plus 主题变量变化造成上下边界不一致；窄屏仍保持 44px 触控高度。
- 复合前后缀 E2E **1/1**、组件单测 **13/13**、typecheck 通过；detector 的 JSON/stderr/退出码为合法 `[]`/空/`0`，结合浏览器几何断言验收。

## 2026-10-19 LxDescriptions 长值交互

- 长普通值与长状态改为显式展开/收起按钮，键盘和触屏均可操作；窄屏保持自动换行，短状态不进入 Tab 顺序。
- 单测 **10/10**、文档 E2E **3/3**、typecheck 和目标格式检查通过；静态 detector `[]` 仅作辅助证据，正式 Impeccable A/B 待补。

## 2026-10-19 LxInput 前后缀行高

- 已完成前后缀与输入内容行高令牌统一，覆盖 sm/md/lg、HUD 和 390px 触屏；E2E 1/1、typecheck/build/格式检查通过。
- A 31/40，B detector 合法 []/空/0 并保存浏览器证据。宿主可访问命名、错误关联和语义图标说明继续列入表单可访问性 backlog。

## 2026-10-19 LxInput 前后缀完整高度

- 输入真实节点、prefix/suffix 及内部槽位改为完整控件轨道，消除外框 32/44px 与内部 30/42px 的视觉高度差；prepend/append、焦点环和尺寸映射保持不变。
- 复合前后缀 E2E **1/1**、单测 **13/13**、typecheck 通过；静态 detector `[]` 不单独作为 Impeccable 通过。
# 2026-10-19 LxProTable 当前版行为门禁复验

- 当前版复验覆盖跨页选择、全量清空、加载/空/错恢复、排序、局部滚动、方向键、44px 复选目标、HUD、减少动效和卸载清理；选择逻辑已按当前页差集合并，取消一页不会丢失其他页选择，公开清空方法不会残留远端页 key。宿主单测 4/4、文档 E2E 4/4，类型、构建、文档构建和目标格式检查通过。
- Assessment A 29/40（Good）；跨页选择 P1 已修复，危险操作、Demo 控制密度和横向滚动发现性继续登记。源码 detector 为合法 `[]`、空 stderr、退出码 `0`，headless 页面截图为空白，独立浏览器 overlay/snapshot/trend 仍待完成，暂不关闭 UI-10。

## 2026-10-19 LxPagination 当前版证据复核

- 组件/适配器单测 **7/7**、文档 E2E **3/3** 通过，覆盖事件顺序、自动重置、自定义布局、主题、键盘和窄屏滚动。
- 正式 B 证据目录当前缺失，历史静态 `[]` 只作源码零命中记录；补齐独立浏览器证据与 snapshot/trend 前，不标记 Impeccable 通过。

## 2026-10-19 宿主 Mock 预览复验

- Vue3 隔离预览 **10/10** 通过，作为 lx-ui 组件库之外的宿主入口证据，覆盖全部 33 个现役菜单首屏和已登记的竞态、分页、失败恢复场景。
- 该证据不替代组件级 Impeccable A/B，也不代表真实后端、权限或 Element Plus 删除已完成。

## 2026-10-19 LxPagination 宿主接入首批

- Vue3 三个业务场景已接入 `LxPagination`，保留旧分页状态和 `change(page, pageSize)` 事件适配；业务请求仍由宿主按 `.then().catch().finally()` 管理。
- 组件库正式 A/B、真实分页 API、权限联调及剩余直接 `el-pagination` 页面继续开放。
