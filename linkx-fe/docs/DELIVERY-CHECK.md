# lx-ui 交付核查

## 2026-10-04 密码输入框回归约定

`LxPasswordInput` 必须以组件显隐状态控制密码类型，调用方透传的 `type` 不能覆盖遮罩。剪贴板默认允许；宿主显式开启 `preventClipboard` 时组件只阻止前端事件，不得将其作为服务端安全边界。Wave 1 行为修复与 Impeccable 正式视觉审查分别记录。

## 2026-10-04 后续交付拆分

Wave 0–12 的完整任务、证据门槛和阻塞口径见仓库文档 `doc/PROJECT-FOLLOWUP-BREAKDOWN.md`。Wave 0 已修复 `LxDatePicker` 相邻实例说明 ID 隔离，36 项 DatePicker/DynamicForm 单测、组件库构建、文档构建和 DatePicker 文档 E2E 通过；正式 Impeccable Critique 仍未关闭。基础控件统一严格审查、TreeSelect/Cascader 当前版本 overlay 及全库 52 项矩阵继续进行。所有新备注和组件说明使用中文，`[]` 仅记静态 detector 零命中。

## 2026-10-03 UI-13 DynamicForm 字段反馈复验

- 日期输入框接收字段 `aria-describedby`；字段说明更新/移除及相邻两个日期字段互不串联由单测覆盖。字段反馈 ID 实例级唯一，loading 时重试按钮禁用，上传和自定义 slot 将描述 ID 传到实际控件。
- Demo 增加可固定查看的候选项加载状态；API 文档新增最小 schema 示例，并说明较长表单的分区标题或步骤由宿主编排。
- 定向单测 34/34，动态表单文档 Playwright 1/1；lx-ui `typecheck`、库构建及文档构建通过，Vue3 类型检查、目标 ESLint/Prettier、差异空白检查通过。VitePress 有既有的大 chunk 警告。
- Impeccable Assessment A 桌面评审 29/40（Good），加载状态、最小示例和宿主分区说明已落实；文档侧栏同级入口过多登记为全站后续项。Assessment B 和当前 detector 的 `[]`、空 stderr、退出码 0 只表示静态零命中；浏览器页面可访问，但没有可用的动态注入接口，overlay 未运行，因此正式 Impeccable Critique 仍待补，不能记为组件通过。

## 2026-10-03 TreeSelect/Cascader 交付与审查状态

- `LxTreeSelect`、`LxCascader` 的组件单测 17/17、文档 Playwright 8/8；测试使用 `playwright.lxui.config.ts` 和 VitePress 4176。“新增组件”总览与 Cascader 独立页都展示交互 Demo。
- 当前两份组件源码与两份文档的 detector 均为有效 JSON `[]`、stderr 空、exit 0，仅表示静态规则零命中。浏览器策略拒绝当前 overlay 注入预检；旧 overlay 早于当前代码/文档，不能登记为当前版本正式 Critique 通过。正式 Impeccable Critique 仍待补。
- 既有 Assessment A 建议已落实；保留 P3 与文档壳层观察，不把本波写成全库完成。基础控件统一桌面/375px/HUD/减少动效审查继续进行，Vue3 Element Plus 替换门槛不变。

## 2026-10-02 LxInputNumber 增量

- sm、md、lg 步进按钮按触发器高度连续贴合，中间保留 1px 分隔线；Demo 提供 `controls` 显示/隐藏开关。
- 实际数字输入同步 `id/name/autocomplete/aria-*`，可见字段标签可关联原生输入；定向单测 12/12、InputNumber 文档 E2E 1/1。
- lx-ui `pnpm typecheck`、库构建（195 modules）和 VitePress 文档构建已复验通过；文档构建保留仓库已有的大 chunk 警告。
- 基础控件综合文档 E2E 已 4/4：Select、DatePicker、InputNumber 的标签/键盘行为，以及 375/320px、HUD、减少动效和页面宽度均通过；DatePicker 禁用/只读区间的窄屏默认宽度问题已修复。
- 仍待基础控件批次统一的桌面/375px/HUD/减少动效证据及 Impeccable A/B。

## 2026-09-30 基础组件审查门禁

基础组件批次包含 `LxButton`、`LxInput`、`LxInputNumber`、`LxTextarea`、`LxSelect`、`LxDatePicker`、Checkbox/Radio 组、`LxSwitch` 和 `LxPasswordInput`。各项必须有设计源映射、中文 API/Demo、状态与键盘行为测试、桌面/375px/HUD/减少动效浏览器证据、代码审核及 Impeccable A/B 记录；静态 detector `[]` 不单独构成通过。

## 2026-09-30 UI-13 复修增量

- 自适应布局已修复：字段不再通过行内 `grid-column` 固定三列 span，容器在 760px/520px 断点分别选择两列/单列；固定列与 `span=24` 通栏保持兼容。
- 新增公开 `LxTreeSelect` 并接入 DynamicForm；Element Plus 仅保留在 Lx 封装内部。新增 API 文档和侧栏入口；Wave 6 已补成功/空/失败/禁用、键盘、HUD、窄屏浏览器证据及文档 E2E，正式 Critique 仍待当前 overlay 证据，详情见本页顶部记录。
- LxForm 基础/弹窗 Demo 改用 `LxInput`、`LxSelect`、`LxTextarea`，避免新示例直接使用 `El*`。
- Assessment A 29/40；Assessment B 的 detector `[]`（stderr 空、exit 0）已记录，浏览器 overlay/截图与综合快照待收尾。静态 `[]` 不代表组件审查完成。

## 本次组件

新增 18 个组件并从 `src/index.ts` 命名导出：`LxPageCard`、`LxSectionTitle`、`LxMetricCard`、`LxDescriptions`、`LxCodeSlot`、`LxSearchBar`、`LxStatusSwitch`、`LxUpload`、`LxSelectPagination`、`LxPasswordInput`、`LxVirtualTree`、`LxTransferPanel`、`LxAuthImg`、`LxNavbar`、`LxTabsBar`、`LxBreadcrumb`、`LxSplitLayout`、`LxDutyCalendar`。对应公共 Props 类型也从入口导出。`LX_ICONS` 提供 94 个标准图形，`LX_ICON_ALIASES` 提供 `date` -> `calendar` 和 `eye-on` -> `eye` 两个兼容名称；`LxIconName` 覆盖共 96 个可用名称。

## 接入契约

### UI-13 表单验收记录（2026-09-30）

- 已完成：字段独立子组件、Lx 基础控件组合、`value` + `change` 与旧 `v-model` 兼容、LxUpload 单/多文件列表、3/2/1 列容器自适应、固定列兼容模式。
- 已验证：类型检查、库构建、文档构建、Vue3 定向单测 40/40、本地 Mock 浏览器成功/空/错/禁用/HUD/375px/无外部请求。
- 待完成：LxForm 设计图逐项浏览器证据；TreeSelect/Cascader 当前版本正式 Critique；基础控件及其余组件的全库 UI-10 严格设计对照和 UI-11 正式 Impeccable 双路 Critique。

- `LxForm` 与 `LxDynamicForm` 依 UI-13 逐项对照 `design/` 参考验收。动态表单按字段 `type` 分发至独立子组件，只组合公开 `Lx*` 控件（Element Plus 可留在这些封装内部），不以 `El*` 字段控件代替设计实现；补 React/TSX 友好的受控 `value` + `change(nextValue)` 与旧 `v-model` 兼容、单图/多图上传列表、容器宽度自适应 1/2/3 列。全库组件也须逐项对照设计源，不能以构建或 detector `[]` 代替设计验收。

- 库入口为 `lx-ui`，样式入口为 `lx-ui/style.css`；本地消费保留 `src` 入口，发布配置指向 `dist/lx-ui.js`、`dist/style.css` 和 `dist/index.d.ts`。
- 选择、树、穿梭、上传的值由宿主通过 `v-model` 管理。`LxSelectPagination.api({ page, pageSize, keyword, ...params })` 返回 `{ records, total }` 或 `{ data: { records, total } }`，初始跨页标签可由 `valueMap` 提供；请求变化、搜索和卸载会使旧响应失效，续页失败可重试。
- `LxUpload` 默认手动提交；`action` 或 `httpRequest` 由宿主配置。文件校验、进度/状态展示、失败重试、取消和 `clearFiles()` 回写由库处理；自定义适配器收到 `chunkSize` 提示，但分片协议仍由宿主实现。独立 Mock Demo、4 项单测和 3 项 Chromium 用例已通过，未触发真实上传。
- `LxVirtualTree` 的禁用节点不可勾选；`LxTransferPanel` 在树勾选更新时保留暂未加载和禁用节点，支持全选/反选、上限禁用和清空事件。其 `change.nodes` 只包含当前树可解析的节点，未加载键只通过 keys 回传。
- `LxSplitLayout.asideWidth` 接受数值像素或 CSS 宽度字符串；拖拽、方向键调整及容器变窄限宽时发出像素 `resize`，折叠后主区保持同行。
- `LxProTable` 的默认插槽可覆盖配置列，`empty` 插槽覆盖空态；`tableAttrs` 透传 Element Plus 表格属性与原生事件。实例暴露 `getTableRef()`、`clearSelection()`、`toggleRowSelection(row, selected?)`、`getSelectionRows()`，原 `row-click` 语义事件仍保留。
- `LxProTable` 的独立文档 Playwright 4/4 通过：跨页选择/清空、加载读屏状态与减少动效、空结果/失败重试/排序反馈、375px 局部滚动与方向键、44px 复选目标和 HUD 深色令牌。选择状态由 `selectedKeys` 驱动；分页切换时保留已选记录并更新当前页复选框。示例数据和状态只存在于浏览器内存。
- `LxPagination` 增加 `layout`、`background`，默认行为不变；局部滚动页面使用 `autoScroll=false`。`LxSearchBar.controls` 覆盖内置查询/重置按钮，原 `actions` 插槽保留。`LxNavbar.showFullscreen` 默认 `true`。`LxBreadcrumb.select` 传 `(item, MouseEvent)`。`LxSectionTitle` 默认插槽和 `LxMetricCard` 的 `label`、`value`、`footer` 插槽均有原内容回退。
- `LxMetricCard` 按设计稿支持 `title`、语义 `status`、`badgeText`、进度标签与格式化值，并继续兼容 lx-ui `label`/`badge` 和 Vue3 宿主 `valueType`/`footer` 及 `title`/`value`/`footer`/`extra` 插槽；进度值被限制到 `0–100` 并提供 ARIA 名称和值文本；固定轨道内使用 transform 更新填充，并支持 RTL 起点。
- 权限消费层已提供 `setupLxPermission`、`hasPermission`、`isFieldMasked` 和 `maskValue`；`LxActionButtons.auth`、`LxProTable`/`LxDescriptions` 的 `mask` 只消费宿主注入的权限源。

## 验证

在 `linkx-fe` 目录执行：

| 命令              | 结果                                              |
| ----------------- | ------------------------------------------------- |
| `pnpm typecheck`  | 通过，包含 `docs/**/*.vue` 的类型检查             |
| `pnpm build`      | 通过，130 个模块；生成 JS、CSS 与声明文件         |
| `pnpm build:docs` | 通过，页面渲染完成；存在大于 500 kB 的 chunk 提示 |

Vue3 宿主 `tests/unit/lx-virtual-tree.test.ts` 覆盖虚拟窗口、过滤祖先、禁用节点选择、键盘展开/焦点移动、全部公开方法和 node 插槽。独立中文 Demo/API 页位于 `docs/components/lxvirtualtree.md`，状态示例中的加载和错误由宿主展示。Chrome 浏览器已验证桌面筛选/选择/键盘焦点、空结果/错误恢复、375px HUD 深色令牌和无横向溢出；不等于 Vue3 业务宿主替换或真实后端联调。

Vue3 宿主 `tests/unit/lx-search-bar.test.ts` 覆盖受控值更新、默认值重置并立即查询、loading 锁定和展开字段。SearchBar 文档 Demo 的成功/空/错、失败恢复、重置和 loading 已通过桌面浏览器检查；375px 展开十项条件时页面没有横向溢出。

Vue3 宿主 `tests/unit/lx-dialog.test.ts` 覆盖标题关联、确认与 loading 锁、取消/关闭和自定义 footer 共 4 项。`tests/e2e/lx-dialog-docs.spec.ts` 的 3 项 Playwright 浏览器检查覆盖 375px 面板收缩/页面无横向溢出/单列布局/44px 点按目标、键盘焦点环、减少动效、校验失败、loading、防重复确认、提交成功、ESC 与自定义 footer。弹窗标题由 Element Plus `titleId` 关联到标题文本；示例提交只使用本地内存 Mock。

以下组件已有专项证据：LxIcon、LxVirtualTree、LxTransferPanel、LxDialog、LxSelectPagination、LxUpload、LxDescriptions、LxMetricCard、LxAuthImg、LxStatusSwitch、LxActionButtons、LxEmpty、LxSidebar、LxBreadcrumb、LxNavbar、LxTabsBar、LxPageCard、LxSplitLayout、LxDutyCalendar、LxPagination、基础控件桥接、LxDynamicForm 和 LxSearchBar。壳层组件 Playwright 4/4 覆盖键盘路由接管、通知和用户菜单、页签交互、具名 region 及组件容器窄屏布局；修复了通知徽标遮挡点击的问题。其余组件尚未完成真实浏览器下的鼠标、键盘、响应式和深色主题验收，不能由构建通过推断。

Impeccable `detect.mjs` 的源码输出 `[]` 且退出码为 0，只代表本次静态规则没有命中；URL 扫描的非零退出码即使同时输出 `[]` 仍是失败。LxIcon 文档页已有一份正式单目标 Critique 快照（27/40）；静态 `index.vue` 扫描为 `[]`，浏览器 overlay 则列出 4 条细项、标题计数为 3，命中主要在 VitePress 文档外壳。主会话浏览器另抽查 `delete` hover 动画和 `prefers-reduced-motion` 降级均符合预期。键盘 focus 现仅将卡片自身 1px 边框切换为主色并应用主题浅底，不叠加 inset 阴影或额外轮廓；文档 Playwright 检查焦点颜色、底色及焦点前后尺寸一致。其余图标动效仍待覆盖。该快照不关闭整库 UI-11；整库评审仍需在 UI-10 闭环后覆盖其他组件、主题/状态与动效，并按组件边界复核 overlay 命中。

`LxSidebar` 有独立中文 API/Demo；文档 Playwright 2/2 覆盖分组键盘与 `aria-expanded`、菜单单次选择、rail 浮层焦点和 Escape、移动模态抽屉的焦点循环/关闭后返回、HUD 深色及减少动效。当前证据为组件库级验证；Vue3 现有侧栏仍使用 Element Plus 菜单和权限路由数据，尚未替换为 `LxSidebar`。整库 Impeccable 视觉/动效审查仍待 UI-10 完成。

`LxForm` 桌面网格沿用设计稿 16px 列距和 `span="full"` 通栏字段；视口不大于 640px 时折成单列并让所有字段占满宽度。输入、数字、日期范围和文本域聚焦使用贴边 1px 状态边线与紧邻的 2px、15% 主色光晕；单选与多选下拉统一由控件自身 1px `border-box` 实体边框表达焦点，不在控件外叠加第二圈。普通焦点显示主色边框，错误焦点保留错误色边框；下拉不使用 `box-shadow` 或 `outline`，焦点时控件维持 32px 尺寸。复选框保留 14px 方框和 1px 状态边线，焦点环在方框外零间隙显示 2px 主色光晕，不使用偏移 outline 或改变尺寸；HUD 未选复选框采用深色填充与可辨边线。Demo 将“全选通知渠道”与缩进子项分行展示半选/全选，定向 Playwright 覆盖单选/多选边框、错误态、分行位置、真实未选中/已选中/半选、HUD 和 375px。多选边线已加入桌面、深色、错误及窄屏回归，正式 Critique 结果见本轮交接；此前发现的错误文案约 4.4:1、375px 弹层遮挡字段标签和 34px 选项行高仍作为后续独立任务。组件级评审不代表 UI-11 整库审查。Vue3 业务表单尚未替换，仍需按原表单校验和提交契约做宿主适配。

`LxSplitLayout` 有独立中文 API/Demo；宿主单测 3/3 覆盖键盘宽度边界、受控折叠和 `ResizeObserver` 清理；文档 Playwright 3/3 覆盖 1920px 键盘/拖动限宽、桌面折叠主区同行、375px 局部表格滚动/44px 按钮、HUD 深色和减少动效。库类型检查、134 模块构建与文档构建通过。Vue3 业务页仍待 UI-04 契约迁移；UI-11 正式 Critique 未完成，本次不以 detector `[]` 作为验收。

`LxDutyCalendar` 有独立中文 API/Demo；8 项单测与文档 Playwright 3/3 覆盖 42 格、月份边界与年份切换、键盘焦点、slot、宿主空/加载/失败/只读状态、375/320px、触控尺寸、HUD 深色、文字对比度和减少动效。库类型检查、134 模块构建及 VitePress 构建通过。无专属 `design/` 日历稿；Vue3 旧排班页的班次详情、加载、查询和实例方法契约需在 UI-04 适配，UI-11 正式 Critique 仍待 UI-10 闭环。

`LxPagination` 的中文 API/Demo 覆盖默认与自定义 layout、背景样式、自动重置/滚动和站点明暗主题；5 项组件单测验证受控事件顺序与滚动开关，2 项适配器单测保留旧 `page/limit/pagination` 契约，文档 Playwright 3/3 覆盖条数切换、主题、375px 局部滚动及键盘焦点。文档 Demo 使用 `zh-cn` locale；detector 对组件、Demo、文档和 Vue3 适配器 stdout `[]`、stderr 空、退出码 0，仅表示本次静态规则零命中；UI-11 正式 Critique 仍待 UI-10 其余组件闭环。

`LxPasswordInput` 已补独立中文 API/Demo；既有文档 Playwright 覆盖密码显隐与清空、输入事件、focus/blur/select 实例方法、默认剪贴板可用与显式阻止、只读/禁用语义和窄屏布局。`preventClipboard` 只阻止前端剪贴板事件，不是安全边界；Demo 使用内存样例，不访问登录接口。组件级验收不代表真实认证联调或 UI-11 整库 Critique 完成。

`LxEmpty` 有独立中文 API/Demo；5 项单测覆盖默认文案、status 语义、紧凑档、自定义尺寸校验、图标/操作插槽与宿主 class 透传。文档 Playwright 覆盖默认 64px、`image-size=80`、键盘操作、筛选恢复、两主题对比度、长描述和 375/320px 无横向溢出。阶段性启发式评审曾记 28/40，亮色浏览器 overlay 发现 5 项真实低对比度文字；已改用正文令牌并补对比度回归。后续流程审计确认该评分没有对应的 Impeccable Critique 快照，且设计评审未在独立新标签检查页面，因此不能视为正式 Impeccable 验收，需在 UI-11 按 skill 规范补齐。detector `[]` 仅表示静态规则零命中。Vue3 15 处 `el-empty` 仍待 UI-04 替换，组件证据不代表宿主页面已经采用。

VirtualTree 已检查桌面浅色与 375px HUD 深色；TransferPanel 已通过 4 项单测及文档 Playwright 3/3，覆盖树外键/禁用键保留、全选/反选、上限与清空、宿主状态、375px 触控、键盘焦点及 HUD 深色；Dialog 已通过桌面手动检查和 375px Chromium 测试；SelectPagination 已通过跨页回显、搜索取消、失败恢复、空结果、375px 弹层和触屏按钮 Playwright 3/3；LxUpload 已通过手动 Mock 上传、进度、失败恢复、取消、校验及 375px 交互；LxDescriptions 已通过 6 项单测、3 项文档 Playwright 和阶段性组件级 Impeccable 定向检查（19/20），覆盖 32px 行高、复制键盘焦点、状态点、375/320px 抽屉边界、主题及减少动效；其 detector `[]` 仅代表静态规则零命中，不是正式 Critique 通过；LxMetricCard 已通过 6 项单测和 2 项文档 Playwright，覆盖旧宿主契约、趋势图标、语义色、进度读屏、对比度及 320px/HUD/减少动效；LxAuthImg 已通过 6 项单测和 3 项文档 Playwright，覆盖 Blob Mock、取消竞态、对象 URL 清理、失败回退、空源及 375px/HUD/减少动效；LxStatusSwitch 已通过 6 项单测和 3 项文档 Playwright，覆盖旧值映射、确认取消、只读、失败恢复、4.5:1 对比度、焦点、42×20px 轨道、375px 44×44px 点按区、HUD 深色和减少动效；LxActionButtons 已通过 3 项单测和文档 Playwright 3/3，覆盖 hidden/disabled、click 事件、键盘展开、Escape 焦点恢复、焦点移出/外部点击收起、375px 44×44px 点按区、HUD 深色和减少动效；基础控件桥接、DynamicForm 和 SearchBar 已检查桌面及 375px。这些证据不代表全部组件矩阵、Vue3 业务宿主回归或真实上传协议联调。文档站演示使用本地示例数据，上传网络接口需由宿主提供。

## 设计来源与宿主采用

`design/` 中的按钮、表单控件、检索、状态开关、远程分页选择、描述行、虚拟树/穿梭、上传、指标卡和区块标题是当前视觉/交互源；`doc/LxIcon*` 的动态图标已进入 LxIcon 目录和文档 Demo。基础控件桥接页 `/components/element-bridge` 现覆盖按钮、表单八件套、Tabs、Card、Tree、Descriptions，并通过桌面、HUD 深色和 375px 检查；`LxDynamicForm` 独立页覆盖 Mock 成功/空/错、联动、禁用、重置、栅格和 375px；`LxSearchBar` 独立页覆盖成功/空/错、失败恢复、展开、重置、loading 与 375px 全字段布局；`LxSelectPagination` 独立页覆盖 300ms 防抖、远程追加分页、targetMap 跨页标签、取消和错误恢复；`LxUpload` 独立页覆盖内存 Mock 进度、成功/失败重试、取消、文件校验、两种列表布局、375px 触屏和 HUD 深色；`LxDescriptions` 独立页覆盖 32px 紧凑行、复制字段、状态点、主题及窄屏抽屉边界；`LxMetricCard` 独立页按指标卡设计稿展示语义色、角标、趋势与进度，趋势箭头采用 LxIcon，兼容宿主旧属性，6 项单测及 320px/HUD/减少动效文档浏览器用例通过；`LxAuthImg` 独立 API/Demo 使用本地 PNG 和宿主 Blob Mock，6 项单测、3 项文档 Playwright 覆盖成功、失败回退、空源、取消、对象 URL 清理、375px、HUD 深色、键盘与减少动效；`LxStatusSwitch` 独立页覆盖 `boolean`/旧 `0/1`、关闭确认、只读、loading、Mock 失败恢复、对比度、焦点、轨道尺寸、375px 点按区、HUD 深色及减少动效；`LxTransferPanel` 独立页覆盖全选/反选、上限、树外既有键、禁用项、清空和宿主 loading/empty/error 状态。库内已有实现不等于 Vue3 已采用，宿主页面映射及状态见 `other-admin/admin-vue3/docs/ELEMENT-PLUS-LX-UI-MATRIX.md`。

Vue3 的 SearchBar、ProTable、PasswordInput、Breadcrumb、Navbar、SectionTitle 适配器已使用 lx-ui；侧栏、Navbar、SearchBar 和 GroupTags 的首批图标也已改用 LxIcon，其他页面的 Element Plus 图标仍待分批迁移。GroupTags 表格与分页在窄屏使用独立键盘可聚焦滚动区，Mock E2E 4/4。ActionButtons、StatusSwitch 等仍由宿主独立实现。组件库行为和 Demo 完成后再执行 Impeccable 组件/动效审查；Vue3 全量替换后执行 Impeccable 页面审查。二者均需写入交接记录，不能由构建通过代替。

## LxIcon 设计清单验收

- 94 个标准图形键和 2 个兼容名称已归并；名称/路径单测位于 Vue3 宿主 `tests/unit/lx-icon.test.ts`。
- P0 13 个核心图标、P1 27 个业务图标和 29 枚扩展清单均映射至可用图形；其中 `date`、`eye-on` 复用既有图形。
- 组件测试覆盖 69 个去重动效名称；专项浏览器验收 `pnpm test:e2e:icons` 分别验证桌面悬浮、键盘焦点、减少动效，以及 Chromium 触屏按压、剪贴板操作和 320px 窄屏。
- 扩展清单沿用 P1 语义动效；29 枚清单使用与参考稿一致的放大和蓝色阴影反馈。所有动效尊重 `prefers-reduced-motion`。
- Impeccable 定向预检后，LxIcon hover/focus 使用自然减速曲线；warning 与 email 动效仍提供轻微语义反馈。桌面和 Pixel 7 浏览器均验证 hover/键盘/触屏及减少动效。
- `LxUpload` 进度填充已改为固定轨道上的 `transform` 缩放，并在减少动效设置下关闭过渡；Chromium 文档 E2E 覆盖进度、重试、取消和该偏好。
- 本阶段验证：图标单测 5 项、桌面/移动专项 E2E 各 1 项通过；Vue3 与 lx-ui 类型检查、Vue3 定向 ESLint、Prettier、组件库构建和文档构建通过。组件库未配置独立 ESLint。

### 2026-09-30 UI-13 LxForm 首错焦点修复复验

- 状态：实现与回归已完成，正式 UI-11 仍未关闭。
- 证据：`.impeccable/critique/form-focus-postfix-2026-09-30/browser-evidence.json`；LxForm 桌面/375px 提交失败后首个错误输入获得焦点，`aria-invalid` 和页面宽度契约保持。
- detector：LxForm、LxFormItem、LxDynamicForm 及 fields 目录均为有效 JSON `[]`，stderr 为空、退出码 0；该结果只代表静态规则零命中。
- Form 综合报告中的旧“焦点未修复”结论已由 postfix 证据标记为历史观察；当前首错焦点已在桌面/375px 复验。Wave 5 独立 A/B、综合报告和 snapshot 已保存，B 保留 CUA 不可用的 `DEGRADED` 限制；下一步继续处理剩余 P2/P3 建议并推进全库 52 项矩阵。

## 2026-10-04 Wave 0 日期说明关联

- 当前工作区 DatePicker/DynamicForm 定向单测 36/36；lx-ui 类型、构建、文档构建通过，DatePicker 文档 E2E 1/1。
- 代码审核未发现可复现缺陷；新增区间起止和相邻区间说明 ID 隔离断言。
- 正式 Impeccable A/B、overlay 和 snapshot/trend 仍待完成；该行为修复不代表基础控件严格视觉矩阵关闭。
