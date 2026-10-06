# LinkX 后续任务完整拆分与执行规范

> 更新时间：2026-10-06
>
> 本文是 `doc/PROJECT-DELIVERY-PLAN.md` 的执行拆分入口。它把当前仍未完成、证据不足或明确阻塞的工作按依赖顺序拆成可交付波次。每个波次完成后，必须先完成验证、代码审核、样式与动效审查，再进入下一波；不得用“代码已经存在”“构建通过”或 detector 输出 `[]` 代替交付证据。

### 当前执行指针（2026-10-06）

- `LxPasswordInput` 已完成当前实现、行为回归、正式 A/B、overlay 归因和独立代码复审。A 为 32/40；单测 10/10、文档 E2E 9/9、类型/构建/目标 ESLint/Prettier 通过。修复了 320px 目录锚点、文档暗色表面和 44px 移动工具标签。
- 三个 detector 均为有效 JSON `[]`、stderr 空、退出码 0；浏览器 overlay 11 个目标均归为 HUD 主题提示或文档壳层目标，不计为密码控件缺陷。该证据不关闭全库 52 项严格矩阵。
- 尚有一项 P2 集成文档建议：用真实 `LxForm/LxFormItem` 展示密码字段校验错误、文案和 ARIA 关联；它由 Form/DynamicForm 宿主组合负责，禁止在独立 PasswordInput Demo 伪造。另将移动 Props 表和 VitePress 页内目录触控高度列入共用文档壳层体验任务。
- 动态图标已完成修后独立 A/B、浏览器复验、独立代码复审和交接。A 修前基线 33/40、修后 37/40；B 的组件和文档 detector 均为有效 JSON `[]`、空 stderr、退出码 0，并有五个成功 overlay 浏览器视图。A 留下展开后 P1/P2 长分组 26/29 项的 P2；代码复审留下一项名称集合断言 P3；完整边界见 Wave 3 台账与正式 snapshot `.impeccable/critique/2026-10-06T02-52-50Z__linkx-fe-docs-components-lxicons-md.md`。较早一次修后 B 已排除，正式结果来自全新隔离 agent；无法从现存材料唯一定位交叉风险所对应的旧文件，候选分报告均不得代替正式报告。
- 下一入口为 `LxDynamicForm`。先按 schema `type` 拆分独立字段文件，包括 `password`、`remote-select` 和 `daterange`；字段只组合公开 `Lx*` 基础组件。补真实 `LxForm/LxFormItem` 密码校验错误和 ARIA、宿主可取消的远程查询乱序/失败重试、单图/多图上传失败恢复和值映射、`daterange` 回显/更新/清空、真实容器 1/2/3 列断点、父级受控值回灌。详细审计见 `.impeccable/critique/wave4-dynamicform-agent-audit/followup-review.md`；真实业务接口、上传字段和 AbortSignal 适配必须按宿主契约确认。完成独立代码复审、Impeccable A/B 与修后复验后，按 `fix(lx-ui)` 和 `docs(project)` 两笔提交并推送，再自动进入剩余组件。

## 一、当前事实与完成口径

### 1. 已确认的项目边界

| 区域        | 位置                                                    | 事实与约束                                                                                 |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Vue2 对照源 | `src/`                                                  | 业务接口、权限键、菜单、状态值和旧交互的主要对照来源。Vue2 运行时不直接加载 Vue3 组件库。  |
| Vue3 目标   | `other-admin/admin-vue3/`                               | 页面迁移目标，使用 Vue3、TypeScript、Pinia 和宿主 Element Plus；后续按矩阵逐批改用 lx-ui。 |
| 组件库      | `linkx-fe/`                                             | `lx-ui` 的实现、类型、Demo 和中文 API 文档；Element Plus 只能作为库内部实现依赖。          |
| 设计依据    | `design/`、`doc/lx-ui/`、`doc/登录1/`、`doc/登录2/`     | 视觉、状态、动效和登录页的事实来源；没有专属画板的组件必须记录采用的规范映射。             |
| 权限依据    | `doc/PERMISSION-CONTRACT.md`、Vue2/Vue3 路由、API、Mock | 未有后端或 Vue2 证据的权限码不得猜测；文本/字段权限仍等待可信契约。                        |
| 本地验收    | `mock-preview`、`tests/e2e/preview.spec.ts`             | 只证明前端 Mock 链路；真实后端、真实权限身份、上传协议和生产配置单独记录。                 |

### 2. 当前未关闭项

1. **DynamicForm/Form**：`LxDatePicker` 的说明 ID 实例隔离缺陷已按 Wave 0 修复，独立代码审核未发现可复现缺陷；日期与 DynamicForm 单测、类型、库构建、文档构建和日期文档 E2E 已通过。修复后的正式 Impeccable A/B、overlay、综合报告和 snapshot/trend 尚未关闭，因此整体仍为阶段性完成。
2. **基础控件**：`LxButton`、`LxInput`、`LxTextarea`、`LxInputNumber`、`LxSelect`、`LxDatePicker`、Checkbox/Radio 组、`LxSwitch`、`LxPasswordInput` 仍需逐项完成严格设计矩阵。LxPasswordInput 的正式 A/B 与代码复核已补，A 为 32/40；密码字段的真实宿主校验示例 P2 留待 Form/DynamicForm 组合验收。LxSelect 的严格行仍有建议待办；Checkbox/Radio 的 375px API 表格 P2 仍开放。上述事项关闭前对应严格矩阵行保持打开。
3. **TreeSelect/Cascader**：实现、Demo、单测和文档 E2E 已完成；当前版本的正式 overlay 证据和复验仍缺，旧截图不得沿用为当前版本通过证据。
4. **其余 lx-ui**：组件审查矩阵中的 52 个公开组件尚未逐项完成设计差异、状态证据、代码审核和正式 Critique；已有专项证据只作阶段性材料。
5. **Vue3 Element Plus 替换**：宿主仍有直接导入和模板使用，尚未按映射矩阵分批替换；在库级门槛和页面回归完成前不得删除宿主 `element-plus`。删除目标是 Vue3 宿主直依赖，保留 `lx-ui` 内部依赖。
6. **权限**：菜单和部分页面访问有 Mock/单测证据；全量按钮权限仍缺可信码，文本/字段权限缺后端契约，真实管理员/普通用户/License/全局开关联调未完成。
7. **业务迁移**：部分页面仍需保留 Element Plus 适配或补 lx-ui 缺口；迁移时必须保留旧 props、事件、插槽、分页、选择、校验和请求竞态语义。
8. **登录页与动态图标**：登录设计稿、动态 Logo/图标、减少动效和登录错误/加载/失效状态仍按 UI-05/UI-11 补齐并复核；不能只以现有登录逻辑通过推断视觉完成。
9. **Mock 全菜单**：当前已覆盖 33 个入口的首屏和部分北向操作；每个入口的空、失败、权限不足、取消、分页和重复提交状态仍需按模块补齐。

### 3. 完成状态定义

每项任务分别记录下列五种证据，缺一项就保持“进行中”或“阶段性完成”：

- **源码对照**：设计源、Vue2 对照、类型和实现差异已逐项记录。
- **单元/行为测试**：覆盖可观察行为、边界和公开契约，不照抄实现。
- **Mock 验收**：成功、空、失败、权限不足、取消、分页、重复提交等状态可重复触发。
- **浏览器 E2E**：真实 DOM、键盘、焦点、响应式、亮色/HUD、减少动效和无外部请求证据。
- **真实联调**：真实后端、账号、权限、文件协议或生产配置验证；没有环境时明确标记阻塞。

## 二、跨任务必须遵守的规则

### 1. 代码和架构规则

- Vue3 宿主的业务 API 请求统一使用 `.then().catch().finally()`；不得把既有 API 链改写为 `async/await`。`async/await` 只用于不直接访问 API 的本地异步流程。
- `loading`、提交锁、请求代次、取消和卸载保护必须在正确的 `.finally()` 或清理路径释放；取消请求不弹失败提示，迟到响应不能回写新对象或新账号状态。
- 公共展示组件不调用 Axios、Router、Pinia 或登录凭据；请求、上传、权限源由宿主注入。
- `LxDynamicForm` 的字段按 `type` 分发到独立文件，只组合公开 `Lx*` 控件；单图、多图、列表、预览和移除在上传字段子组件中维护。
- DynamicForm 同时保留 `v-model`/`modelValue` 和 React/TSX 友好的 `value` + `change(nextValue)`；改变契约必须同步类型、Demo、中文文档和行为测试。
- 不使用 `as any`、`as never`、`@ts-ignore` 或关闭 Lint 掩盖契约问题；不手改构建产物、自动声明和依赖目录。
- 保留工作区已有改动，不重置、不覆盖无关文件，不进行全库无关格式化；接口、字段、权限码和状态值没有证据时标记未知并阻塞相应实现。
- 所有新增和实质修改的代码注释、交接文档、审核备注和 Demo 说明使用中文；代码标识符、接口字段和既有英文 API 名称按原契约保留。

### 2. 视觉和交互规则

- 优先使用 lx-ui 令牌和组件；业务页不得复制颜色、间距和控件样式。
- 输入框、选择框、文本域、日期等焦点态必须与自身边界贴合，不能出现与控件错位的第二层外框；错误态、禁用态、只读态、空态和加载态需分别核对。
- 可点击元素使用语义化 button/link，提供可访问名称、键盘操作和可见焦点；字段说明必须关联到实际可聚焦控件。
- 动画必须尊重 `prefers-reduced-motion`，提供关闭或降级路径，并检查加载、成功、错误、空、禁用和窄屏状态。
- 窄屏至少检查 375px；长表格在自身容器滚动，不能让页面整体横向溢出；触控目标按设计和可访问性要求检查。

### 3. Impeccable 审查规则

- 每个组件波次都要有独立 Assessment A（设计评审）和 Assessment B（detector + 浏览器证据），两个评估隔离执行。
- detector 必须同时保存 JSON、stderr 和进程退出码；`[]` 只代表静态规则零命中，不代表页面视觉通过。
- 浏览器需要覆盖目标组件的实际页面、主题、尺寸、状态、键盘和减少动效，并保存截图、overlay、请求记录和目标版本指纹。
- 目标无法访问、Puppeteer 缺失、退出码非 0、缺少独立视觉证据或 snapshot 时，只能标记阶段性/降级检查，不能登记正式 Critique 通过。
- 逐条核对 overlay 命中，区分真实组件问题、文档外壳误报和有设计依据的令牌命中；修复后做有界复验并保存处理结论。
- lx-ui 全量替换完成后，再对 Vue3 代表性页面和整站组合执行一次 Impeccable；这次审查不能由组件库审查替代。

### 4. 文档、交接和提交规则

每个波次结束必须同步修改：

1. `doc/PROJECT-DELIVERY-PLAN.md`：状态、证据、未完成项、下一步。
2. `doc/PROJECT-MAP.md`：入口、依赖、路由/API/组件关系。
3. `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`：迁移影响和页面回归边界。
4. `doc/PROJECT-HANDOFF.md`：交接记录、验证命令、限制和下一波入口。
5. 涉及组件时同步 `linkx-fe/docs/ROADMAP.md`、`DELIVERY-CHECK.md`、中文 API 和 `doc/lx-ui/COMPONENT-AUDIT.md`。

交接记录固定包含：目标、改动文件、完成内容、实际验证、未完成/阻塞、风险、下一步和本波提交范围。提交前只暂存本波文件，使用 Conventional Commit；推送前做 `git diff --check`、目标 Prettier、类型检查、Lint、单测和相关 E2E。

## 三、按依赖顺序的执行波次

### Wave 0：恢复当前基线并修复审核缺陷

**目标**：让上一波 DynamicForm/Form 的证据与代码一致。

- 修复 `LxDatePicker` Fragment 根回退导致的相邻实例 `aria-describedby` 串联；限定当前实例触发器查询范围。
- 补两个相邻单值 Picker、相邻区间 Picker、说明更新/移除和 DynamicForm 两个日期字段的回归。
- 清理临时调试输出，检查所有新注释为中文。
- 重跑 DynamicForm/DatePicker 单测、lx-ui 类型/构建/文档构建和文档 E2E。
- 由独立代码审核复核；审核结论必须写入 `CODE-REVIEW-VALIDATION.md` 和交接记录。
- 在可用浏览器能力恢复后补当前版本 Impeccable A/B；未补前维持“阶段性”状态。

**完成门槛**：单测全绿、类型和构建通过、相邻实例 DOM 属性互不污染、没有调试输出、四份台账同步；否则不得进入基础控件正式关闭。

**Wave 0 执行结果（2026-10-04）**：DatePicker/DynamicForm 定向单测 36/36；lx-ui 类型检查、构建（196 modules）、VitePress 文档构建、DatePicker 文档 E2E 1/1、目标 ESLint/Prettier 和 `git diff --check` 通过。独立代码审核未发现可复现缺陷，建议补充的相邻区间说明隔离测试已加入。正式 Impeccable A/B、当前版本 overlay 和 snapshot/trend 仍待完成；此项不阻断基础控件实现和行为检查，但不能标记为正式视觉审查通过。

### Wave 1：基础控件第一组——按钮与输入

**范围**：`LxButton`、`LxActionButtons`、`LxInput`、`LxTextarea`、`LxInputNumber`、`LxPasswordInput`。

- 按 `design/按钮体系/` 和 `design/表单控件八件套/` 建立状态矩阵：默认、悬停、按下、焦点、禁用、加载、危险、错误、只读、前后缀、尺寸和长文本。
- 核对 Button 层级、图标间距、真实 button 语义、键盘激活、加载锁和危险确认；ActionButtons 核对隐藏、溢出菜单、Escape 和 44px 热区。
- 核对 Input/Textarea 的 32px 令牌、清空、字数、错误关联、焦点贴边、自动完成、只读和窄屏；PasswordInput 核对显隐按钮、选择/焦点、清空和禁用。
- 密码遮罩必须由组件显隐状态控制，`$attrs` 中的 `type` 不得覆盖内部值；剪贴板默认允许以兼容密码管理器，显式 `preventClipboard` 仅是前端交互策略，不得描述成安全边界。
- 核对 InputNumber 的 sm/md/lg、步进器连续贴合、`controls` 显隐、边界、键盘和表单校验。
- 每个组件补中文 Demo/API、公开类型、单测和文档 E2E；覆盖亮色/HUD、375px、键盘和减少动效。
- 批次完成后执行独立代码审核、Impeccable A/B、建议修复和复验，记录 detector JSON/stderr/exit code。

### Wave 2：基础控件第二组——选择与日期

**范围**：`LxSelect`、`LxDatePicker`、`LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup`、`LxSwitch`。

- 核对单选/多选的自身边框、标签收敛、清空、远程加载、空结果、失败重试、错误关联和弹层定位。
- 核对日期单值/区间、范围分隔符、禁用日期、面板插槽、实际输入 ID、说明 ID 隔离、窄屏弹层和 Escape。
- 2026-10-04 当前版本独立评审记录：Assessment A 为 30/40，390×844 首屏只显示区间标题，主要区间输入约在首屏下方 65px；建议把区间示例前移或压缩首屏内容。Assessment B 在区间输入按 ArrowDown 聚焦日期格后按 Escape，弹层仍可见。Escape 关闭已在当前工作树修复，11 项文档 E2E 通过；该修复尚未纳入本波提交，且修复后尚未重跑独立 A/B/overlay。对应证据见 `.impeccable/critique/wave0-datepicker-2026-10-04/assessment-a-post-doc-2026-10-04/` 与 `assessment-b-post-doc-2026-10-04/`。
- 关闭条件：390×844 首屏内可直接操作区间字段；开始/结束端点的日期格焦点上按 Escape 均关闭弹层并返回原输入；修复后重新执行独立 A/B、浏览器 overlay 和 snapshot/trend。不得引用修复前指纹作为修复后视觉通过依据。
- 核对 Checkbox 三态、全选/半选、组方向和禁用；Radio 组的方向、键盘箭头和状态；Switch 的 20px 轨道、状态文本、加载和减少动效。
- 统一中文 API、Demo、行为单测、桌面/375px/HUD/减少动效 E2E；补充容器宽度和 Teleport 弹层证据。
- 批次完成后执行代码审核、Impeccable A/B、复验和四份台账更新。

**LxSelect 当前子项进度（2026-10-05）**：实现、中文 API/Demo 与行为测试已完成；HUD token 局部作用域、Teleported option 样式、弹层开合两态就近重试、错误关联清理和窄屏 44px 选项行已复验。组件单测 10/10、文档 E2E 3/3、类型/库构建/文档构建与目标 ESLint/Prettier 通过；最终独立代码复审批准。Assessment A-only 暂定 29/40；Assessment B detector JSON 为有效 `[]`、stderr 为空、退出码 0，浏览器交互仅为阶段性证据，overlay、当前版持久截图及正式 snapshot/trend 未完成，不能记为 UI-10 严格关闭。下一项为 Checkbox/Radio，提交顺序、中文文档和 Vue3 API Promise 链风格保持不变。

**Checkbox/Radio 当前子项进度（2026-10-05）**：`LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup` 的实现、中文文档/Demo、单测 20/20 和文档 E2E 4/4 已完成；Vue3 类型、目标 ESLint/Prettier、lx-ui 类型、196 模块库构建和文档构建通过。独立代码复审批准。Impeccable A 34/40；B 覆盖 Checkbox/Radio 亮色、HUD、禁用、375px 触屏、键盘和减少动效，Radio 与 RadioGroup 最终注入 16/16；触控目标 44px 已验证。四个组件目录与最终 Radio Demo 的 detector 都是有效 JSON `[]`、stderr 空、退出码 0，仅表示静态零命中。P2：窄屏 API 多列表格仍不易扫描，尽管容器已有横向滚动且页面没有整体溢出；此项列入文档体验整改，不关闭严格矩阵行。综合报告、截图、代码审核与 snapshot/trend 见 `.impeccable/critique/wave2-checkbox-radio-2026-10-05/`。实现/E2E 提交为 `be86f10`；下一项自动进入 `LxSwitch`，不得提前开始 Vue3 Element Plus 全量替换。

### Wave 3：表单和动态表单正式 Critique 收口

- 逐项对照 `LxForm`、`LxFormItem`、`LxDynamicForm` 的布局、标签、错误、首错焦点、描述关联、插槽、受控值、重置和分区边界。
- 固定 loading、远程候选成功/空/失败/重试/取消和旧请求保护；上传单图/多图列表、预览、移除和宿主 adapter 契约要能重复演示。
- 补 320/375/768px 和窄容器的 1/2/3 列证据；长表单说明由宿主使用分区/步骤承载。
- 完成当前版本独立 A/B、overlay、截图、综合报告、snapshot/trend；建议逐条处理并复验。
- 代码审核必须确认没有把 API 链改为 `async/await`，没有直接在字段层引入 `El*`。

### Wave 4：TreeSelect/Cascader 正式复验与远程选择

- 对当前源码和文档重新运行 TreeSelect/Cascader A/B，不能引用旧版本 overlay；补 English locale、移动触控、错误焦点和文档壳层误报区分。
- 收口 `LxSelectPagination`：防抖、追加分页、跨页回显、取消、失败恢复、空结果、键盘和窄屏。
- 运行行为单测、文档 E2E、detector JSON/stderr/退出码、浏览器截图和无外部请求检查。

### Wave 5：数据展示与复杂交互组件

按组件逐项完成 `LxUpload`、`LxDescriptions`、`LxVirtualTree`、`LxTransferPanel`、`LxMetricCard`、`LxSectionTitle`、`LxStatusSwitch`、`LxSearchBar`：

- Upload：格式校验、进度 transform、失败/重试/取消、列表、拖放、单/多文件、鉴权由宿主注入。
- Descriptions/MetricCard/SectionTitle：标签和值层级、复制键盘、语义色、趋势图标、进度读屏、标题截断和窄屏。
- VirtualTree/TransferPanel：虚拟滚动、禁用键、树外键、全选/反选、上限、空/加载/错误和触控。
- StatusSwitch/SearchBar：旧值映射、确认取消、只读/加载/失败恢复、字段展开/收起、远程竞态和重置。

每个子批次都要有设计差异表、中文 Demo/API、行为测试、浏览器证据、代码审核和正式 A/B；不得把已有阶段性专项证据直接改成关闭。

### Wave 6：壳层、反馈和服务组件

范围包括 `LxSidebar` 全套、`LxNavbar`、`LxBreadcrumb`、`LxTabsBar`、`LxSplitLayout`、`LxPageCard`、`LxDialog`、`LxDrawer`、`LxEmpty`、`LxFormErrorBanner`、`LxPagination`、`LxTag`、`LxStatusDot`、`LxCodeSlot`、`LxDutyCalendar`、`LxProTable`、`lxMessage`/`lxConfirm`。

- 核对导航层级、rail/expanded、选中/禁用/键盘、抽屉、Escape、portal HUD 令牌、焦点恢复、错误/空/加载和减少动效。
- 表格/分页核对密度、跨页选择、滚动、空错态、写操作锁和请求取消；服务反馈核对语义色、位置、时长、键盘关闭和读屏。
- 统一 375px 和长文本证据，修复文档外壳溢出与组件自身溢出的边界误判。

### Wave 7：图标、登录页和动效系统

- 按 `doc/LxIcon*` 和 `design/LxIcon*` 逐项核对图标路径、命名、尺寸、主题和动态图标触发/结束状态。
- 把 `doc/登录1/`、`doc/登录2/` 的登录布局、Logo、背景、输入、验证码/失败、加载、记住账号、失效跳转和错误恢复落实到 Vue3 登录页；图标动画使用 lx-ui 导出的图标能力。
- 动画使用自然减速曲线，所有动画提供 `prefers-reduced-motion` 降级；补桌面、375px、HUD、键盘、错误和加载浏览器证据。
- 完成 LxIcon 与登录页独立 Impeccable A/B；正式 snapshot 前不得宣称动效完成。

### Wave 8：lx-ui 全库门禁

- 将 52 个公开组件逐行标记为“设计对照、类型/API、Demo、单测、Mock、浏览器、代码审核、Impeccable A/B、复验、snapshot/trend”十项状态。
- 关闭所有 P1/P2 视觉和可访问性建议，保留 P3 观察但写明不阻塞原因；统一中文文档、导航分组和示例信息架构。
- 运行库 typecheck、build、docs build、相关单测/E2E、全库 detector 证据核验；VitePress 大 chunk 等环境警告单独记录。
- 只有当矩阵、正式 Critique 和复验均达到门槛，才允许进入 Vue3 宿主 Element Plus 替换。

### Wave 9：Vue3 Element Plus 到 lx-ui 的宿主替换

依照 `ELEMENT-PLUS-LX-UI-MATRIX.md` 分批，不复制组件源码：

1. **基础表单批**：输入、选择、日期、开关、单选/多选、密码、数字和表单容器。
2. **反馈/浮层批**：Dialog、Drawer、Empty、PageCard、ErrorBanner、Message/Confirm。
3. **数据批**：Upload、Descriptions、Pagination、ProTable、MetricCard。
4. **树与权限批**：TreeSelect、Cascader、VirtualTree、TransferPanel、DataPermissionTree 适配。
5. **壳层批**：Sidebar、Navbar、Breadcrumb、TabsBar、SplitLayout、SectionTitle、StatusSwitch、SearchBar。
6. **登录/鉴权批**：登录页、AuthImg、动态图标、错误和会话失效。
7. **业务页面批**：基础数据、权限中心、协同、第三方、排班、位置、警信扩展、H5、节点管理。

每批先列直接 `El*` 使用点和缺口，再替换导入/模板，保持 API 链、权限键、分页/选择/校验/取消语义；运行受影响页面 Mock E2E、类型、Lint、Prettier 和代码审核。缺少专用 Lx 组件时只能使用 lx-ui 导出的 Element Plus 桥接并登记缺口。

### Wave 10：权限、菜单和业务迁移闭环

- 菜单层：管理员、普通用户、空菜单、停用菜单、License、全局开关、账号切换和直接地址访问。
- 页面层：逐路由核对 `filterChain`、守卫、动态注册、404/回退、缓存清理和登出。
- 按钮层：只使用 `doc/PERMISSION-CONTRACT.md`、Vue2 或后端证据中的权限码；逐页面覆盖隐藏、禁用、确认、重复提交和失败恢复。
- 文本/字段层：继续保留框架和测试，等待后端 `maskedFields`/字段权限契约；没有契约不得实施脱敏。
- 业务页面：每个页面完成首屏、读接口、写接口、空/失败/取消/分页/权限不足 Mock，随后做真实联调门禁清单。
- 角色“设置用户”、IM 权限完整工作流、文件上传下载、地图/地理编码、布局子页和真实 License/菜单字段继续以阻塞项记录，不能猜接口。

### Wave 11：Mock 全菜单与完整首屏数据

- 固定首页加 10 组、32 个动态入口保持与 Vue2 现役菜单和 Vue3 路由一致；每个入口的标题、URL、父子关系和首屏样例数据都写入 Mock 契约。
- 为每个读接口提供成功、空、失败、取消、权限不足、分页和迟到响应场景；写接口提供成功、业务失败、网络失败、重复提交和恢复重试。
- `preview.spec.ts` 逐入口检查菜单可见、导航成功、首屏内容、未处理 API 返回 501，北向 CRUD 与轮播分页继续独立断言。
- Mock 服务只能拦截本地读写请求，不发送真实写操作；测试报告明确“不代表真实后端联调”。

### Wave 12：整站审查、发布门禁和交付

- Vue3 全量直用 Element Plus 清单归零，确认依赖删除只发生在宿主，lx-ui 依赖保留。
- 运行 Vue3 typecheck、Lint、Prettier、单测、Mock E2E、生产构建；检查 bundle、路由、缓存、权限和错误上报。
- 用 Impeccable 审查登录页、侧栏、列表/表单/弹窗/上传/权限页等代表性页面以及整站组合，覆盖亮色/HUD、桌面/375px、键盘、减少动效和外部请求。
- 更新全量项目地图、交付计划、迁移矩阵、权限契约、代码审核台账和交接记录；提交按波次拆分，推送后记录提交号和验证环境。
- 真实后端、真实账号、文件协议、生产 License 和文本权限若仍无环境，保持明确阻塞，不把 Mock 结果写成发布完成。

## 四、每波交付清单模板

```text
### [日期] Wave X / 名称

- 目标：
- 设计源与对照范围：
- 改动文件：
- 实现与契约变化：
- 单测/行为测试：命令、结果、覆盖边界
- Mock E2E：命令、结果、请求拦截和未覆盖项
- 浏览器证据：视口、主题、状态、键盘、减少动效、截图/overlay 路径
- Impeccable A：结论、评分、建议处理
- Impeccable B：JSON、stderr、退出码、overlay、截图、外部请求
- 代码审核：发现、修复、复验结论
- 文档同步：计划、项目地图、迁移台账、交接、组件文档
- 未完成/阻塞：可信来源、影响和解除条件
- 本波提交范围与提交号：
- 下一步：
```

## 五、当前执行入口

Wave 1 密码框透传 `type` 遮罩覆盖的 P1 已由提交 `2762816` 修复，定向单测 7/7；Vue3 类型检查、lx-ui 类型检查/构建/文档构建及目标 Prettier 检查通过。独立代码复审批准，未发现 P0–P2；新增用例覆盖 `readonly` 与 `attrs.type` 组合。Assessment A 最新静态复评为暂定 30/40，已检查修复后的组件源码和文档，但没有修复后的浏览器行为证据；Assessment B 六个静态扫描均有效返回 `[]`、stderr 为空、退出码为 0。浏览器策略拒绝可变页面/overlay 注入，本轮未运行文档 E2E，也无修复后的 overlay、截图或 snapshot/trend，因此 Wave 1 及 Wave 0 正式视觉 Critique 仍未关闭。当前继续 **Wave 2：选择与日期** 的实现和行为检查；检测器空数组、普通文档 E2E 和构建通过均不能替代正式 overlay 与快照证据。
