# lx-ui 路线图

目标是让 lx-ui 与 LinkX 管理端的实际密度、交互、主题和状态保持一致，同时保持组件库业务无关。

## 优先级

| 优先级 | 内容                                                                                                                                                          | 验收重点                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| P0     | 先完成 `design/` 基础控件（button、表单八件套等）的 Element Plus 样式桥接并复核动态图标；再完成 `LxDynamicForm`；随后验收 SearchBar/StatusSwitch 等待替换控件 | 库级 Demo、键盘、窄屏、明暗主题、减少动效 |
| P1     | Upload、SelectPagination、Descriptions、人员选择弹窗壳、useTable、统一 loading/empty/error                                                                    | adapter 注入、取消、重试、分页和错误恢复  |
| P2     | VirtualTree、TransferPanel、motion primitives、低频业务组件                                                                                                   | 大数据量、动画降级和多场景复用            |

## 与 Vue3 宿主的执行顺序

Vue3 页面中的共享控件替换会重复影响表单、弹窗、表格、搜索、树、键盘焦点和窄屏行为，因此组件库的高频契约先于整页深交互验收。执行时保留 API、字段、状态值和 Vue2 既有菜单/按钮权限等不依赖视觉组件的核查；已通过的页面测试作为基线，不因排期变化作废。

| 顺序 | 工作                                                                                      | 进入下一步的条件                                                                                                          |
| ---- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1    | 对照 `design/` 完成基础控件桥接与状态 Demo；复核 `doc/LxIcon*` 动态图标                   | 按钮、表单八件套及其他基础控件的键盘、窄屏、主题和减少动效有浏览器证据；图标已有单测与浏览器证据                          |
| 2    | 完成 `LxDynamicForm` 的 schema 契约、示例和边界测试                                       | 默认值、栅格、联动、校验、重置、禁用插槽及注入式 Mock 均通过库类型、构建、行为和浏览器检查                                |
| 3    | 补齐其他待替换组件，并用 Impeccable 审查组件和动效                                        | props、events、slots、exposes、loading/error/empty/disabled、键盘、响应式、主题和减少动效与实际能力一致；建议已处理并复验 |
| 4    | Vue3 统一从 lx-ui 导入 Element Plus 组件、服务、类型和 locale，并按组件影响面分批替换页面 | pnpm 严格依赖解析、类型检查、构建与受影响页面回归通过；保留适配层的分页、选择、取消和校验语义                             |
| 5    | 完成业务 Mock/E2E、整站 Impeccable 审查，最后移除 Vue3 宿主的 element-plus 直接依赖       | 页面交互、默认/全菜单 E2E、类型、Lint、单测、生产构建及浏览器检查通过；真实联调单独记录                                   |

`design/` 是控件视觉和交互规格的当前来源，`doc/LxIcon*` 是动态图标清单来源。每项都要跟踪设计源、lx-ui 实现、Vue3 采用位置和对应验证。动态图标、基础控件桥接和 `LxDynamicForm` 已完成库级浏览器验收；`LxSearchBar` 的成功/空/错、loading、重置、展开及 375px 窄屏也已验收。`LxDialog` 有独立 API/Demo、4 项宿主单测和 3 项文档 Playwright；375px 下弹窗在视口内、表单单列、页面无横向溢出、触屏目标至少 44px，另覆盖标题可访问名称、焦点环、减少动效、校验、提交、ESC 和自定义 footer。`LxUpload` 已新增设计映射、注入式 Mock、独立 API/Demo、4 项单测和 3 项 Chromium 文档验收，覆盖进度、成功/失败重试、取消、格式校验、禁用、触屏、主题和减少动效。`LxDescriptions` 已对照详情描述行设计补齐 32px 行高、标签宽度/布局、复制字段与状态点；6 项单测、3 项文档 Playwright 覆盖复制键盘焦点、状态、375/320px 布局、480px 抽屉、主题和减少动效，组件级 Impeccable 定向检查 19/20 且 detector 为 `[]`。其他待替换组件仍需补齐独立证据；组件库闭环后先用 Impeccable 审查组件与动效，再迁移 Vue3 页面，Vue3 替换完成后再审查全站页面。Vue2 代码作为迁移对照；迁入 Vue3 的页面直接采用 lx-ui，Vue2 运行时不直接依赖 Vue3 组件。

不为清单中的每种 Element Plus 标签都新增 Lx 包装；没有通用封装时直接从 lx-ui 使用其导出的 Element Plus 控件。每个组件替换波次之前仍要以一个真实宿主场景校验库组件组合，避免只在独立 Demo 中通过。

LxIcon 图标总览页已有一次正式单目标 Critique，评分 27/40，快照见 `.impeccable/critique/2026-09-27T22-24-39Z__linkx-fe-src-components-lxicon-index-vue.md`。静态源码扫描 `[]` 不表示浏览器页面或动效通过；浏览器 overlay 列出 4 个文档壳层命中，但标题计为 3 个。随后主会话浏览器抽查 `delete`：hover 触发 `lx-icon-delete-shake`，`prefers-reduced-motion: reduce` 下 animation/transform 关闭且 transition 为 `0s`；键盘焦点边框已通过文档 Playwright 验收，其他代表性动效仍待覆盖，整库 UI-11 仍待 UI-10 其他候选闭环后完成。

## 组件行为证据

| 组件                 | 当前证据                                                                                                                                                                                                                                                                                                                                           | 未完成                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LxIcon`             | 94 个标准图形、96 个可用名称；静态 detector `index.vue` 返回 `[]`/exit 0；图标总览页正式 Critique 27/40，snapshot 已保存；浏览器 overlay 细项 4 条而标题计数为 3 条；delete hover/reduced-motion 抽查通过；键盘焦点边框已通过文档 Playwright 验收，当前只显示一条贴合卡片的主色边框                                                                | 处理暗色标题对比、分组浏览和尺寸引用；补测其他代表性图标动效；该目标评审不代表整库 UI-11 完成                                                                |
| `LxVirtualTree`      | Vue3 宿主单测覆盖虚拟窗口、过滤祖先、禁用节点选择、键盘焦点、公开方法与 node 插槽；独立 Demo/API 页覆盖 props、events、slots、exposes、状态、级联切换及 HUD 主题                                                                                                                                                                                   | 文档构建通过；Chrome 桌面交互/方向键、375px HUD 深色、错误/空状态与无横向溢出通过                                                                            |
| `LxDynamicForm`      | Vue3 宿主定向单测 5 项；独立 Demo/API 页覆盖成功/空/错、联动、禁用、重置、栅格和注入式 Mock                                                                                                                                                                                                                                                        | 文档构建通过；Chrome 1/2/3 列、24 栅格通栏、错误恢复和 375px 无横向溢出通过                                                                                  |
| `LxForm`             | LxDialog 桌面 2 列/16px 间距和通栏字段；390/320px 自动折单列；输入/数字/日期/文本域焦点采用贴边 1px 主色边线 + 紧邻 2px、15% 主色光晕；单选和多选下拉统一以控件自身 1px `border-box` 实体边框表达焦点，不加外圈；错误态保留错误色边框；尺寸稳定；复选框 14px 方框保留 1px 边线，零间隙 2px 外圈；HUD 与窄屏/错误回归通过；组件级双路 Impeccable Critique 结果记录于交接 | Vue3 业务表单仍按 UI-04 逐页适配并保留原有校验/提交契约；窄屏弹层遮挡字段标签、错误态文字对比度和选项行高作为后续可访问性/布局项；整库 UI-11 仍待 UI-10 闭环 |
| `LxSidebar`          | 独立中文 API/Demo；文档 Playwright 2/2 覆盖 expanded/rail 分组键盘、单次 select、浮层焦点与 Escape、移动模态抽屉焦点循环/返回、HUD 主题及减少动效；VitePress 浏览器已检查实际渲染                                                                                                                                                                  | UI-11 正式视觉/动效审查待 UI-10 闭环；Vue3 现有权限菜单外壳仍未采用，后续替换需保留动态菜单、搜索和“全部菜单”目录契约                                        |
| `LxBreadcrumb`       | 独立中文 API/Demo；壳层 Playwright 覆盖键盘选择、宿主 `preventDefault()` 与外部原生导航边界                                                                                                                                                                                                                                                        | Demo 使用 `.test` 外部地址以避开 VitePress 同源路由接管；实际 Vue Router 宿主契约仍需页面级复验；UI-11 正式 Critique 未完成                                  |
| `LxNavbar`           | 独立中文 API/Demo；壳层 Playwright 覆盖搜索、通知、用户菜单和 375px 组件容器宽度；修复 `99+` 徽标覆盖通知按钮点击区域                                                                                                                                                                                                                              | 真实宿主组合仍按 UI-04 逐页回归；UI-11 正式视觉/动效审查待 UI-10 闭环                                                                                        |
| `LxTabsBar`          | 独立中文 API/Demo；壳层 Playwright 覆盖切换、关闭、右键事件、新建和 375px 局部滚动容器                                                                                                                                                                                                                                                             | Vue3 实际业务页的动态页签持久化与路由回归仍待 UI-04；UI-11 正式 Critique 未完成                                                                              |
| `LxPageCard`         | 独立中文 API/Demo；壳层 Playwright 覆盖插槽、加载遮罩、`aria-busy`、具名 region、内边距/边框开关和 375px 容器                                                                                                                                                                                                                                      | Vue3 实际业务组合仍待 UI-04 回归；UI-11 正式视觉/动效审查待 UI-10 闭环                                                                                       |
| `LxSplitLayout`      | 独立中文 API/Demo；3 项单测和 3 项文档 Playwright 覆盖 200–480px 限宽、折叠布局、键盘/拖动、375px 表格局部滚动、HUD 深色和减少动效                                                                                                                                                                                                                 | Vue3 业务页尚未采用；UI-11 正式组件/动效 Critique 待 UI-10 闭环；容器限宽与主区同行已按浏览器行为复验                                                        |
| `LxDutyCalendar`     | 独立中文 API/Demo；8 项单测、3 项文档 Playwright 覆盖 42 格、周起始、日期选择、月份边界焦点、slot、宿主状态、375/320px、HUD、对比度和减少动效                                                                                                                                                                                                      | 没有专属 `design/` 日历稿；Vue3 排班日历需适配班次详情 popover、loading、月份查询事件和实例方法；UI-11 正式 Critique 待 UI-10 闭环                           |
| `LxSearchBar`        | Vue3 宿主定向单测 3 项，覆盖受控值更新、默认值重置并立即查询、loading 禁止查询及展开字段                                                                                                                                                                                                                                                           | 文档构建通过；Chrome 成功/空/错和失败恢复通过；375px 展开全部 10 项条件且页面宽度保持 375px                                                                  |
| `LxDialog`           | Vue3 宿主单测 4 项，覆盖可访问标题契约、确认/loading、取消/关闭和 footer；独立 Demo 提供表单、危险操作与自定义 footer                                                                                                                                                                                                                              | 文档构建通过；文档 Playwright 3/3，覆盖 375px 面板尺寸、单列表单、44px 触屏目标、键盘焦点、减少动效、校验/提交/ESC/footer                                    |
| `LxProTable`         | 独立中文 API/Demo；Vue3 文档 Playwright 4 项覆盖跨页选择、清空、加载/减少动效、空/错恢复、排序、375px 局部滚动/键盘、44px 复选目标及 HUD 深色；宿主兼容层另有 4 项单测                                                                                                                                                                             | `tableAttrs`/自定义列/脱敏边界和真实业务宿主回归仍待后续组件替换波次；整库 Impeccable 审查未完成                                                             |
| `LxPagination`       | 中文 API/Demo；5 项库单测、2 项 Vue3 适配器单测及文档 Playwright 3/3，覆盖事件顺序、autoReset/autoScroll、旧 `page/limit/pagination` 契约、自定义 layout、背景、zh-cn locale、主题和 375px 键盘局部滚动                                                                                                                                            | Vue3 仍有 4 处页面直接使用 `el-pagination`，须按各页契约迁移；当前 detector `[]` 只表示静态规则零命中，正式 Impeccable Critique 仍待 UI-10 闭环              |
| `LxSelectPagination` | 独立中文 API/Demo；文档 Playwright 3 项覆盖 targetMap 跨页回显、远程搜索、旧请求取消、失败重试、空结果、375px 弹层边界、Escape 和 48px 分页按钮；兼容 `api`/`valueMap`                                                                                                                                                                             | 人员/部门实际宿主替换和 Vue2 取消语义核对仍待 UI-04 波次；整库 Impeccable 审查未完成                                                                         |
| `LxUpload`           | 独立中文 API/Demo；宿主内存 Mock 适配器注入；单测 4 项，文档 Playwright 3 项覆盖手动/自动提交、进度、成功/失败重试、取消、格式校验、禁用、375px 触屏、HUD 深色和减少动效                                                                                                                                                                           | 地图/图标/Excel 业务页替换及真实上传协议联调仍待迁移波次；`chunkSize` 只透传给宿主，不代表组件内置分片实现；整库 Impeccable 审查未完成                       |
| `LxDescriptions`     | 独立中文 API/Demo；单测 6 项覆盖布局、紧凑行、脱敏和插槽；文档 Playwright 3 项覆盖 32px 行高、复制键盘焦点、状态点、375/320px 抽屉边界、主题及减少动效                                                                                                                                                                                             | 阶段性组件启发式复核 19/20，建议已吸收；detector `[]` 只表示静态规则零命中，不是正式 Critique 通过；Vue3 业务详情页仍待替换，整库 Impeccable 审查未完成      |
| `LxMetricCard`       | 对照 `design/指标卡 MetricCard/`；独立 API/Demo；6 项单测覆盖宿主旧 props/slots、语义色优先级、趋势箭头映射、进度边界/读屏/对比度、RTL 与长标题；文档 Playwright 2 项覆盖 LxIcon 趋势图标、320px、HUD 深色和减少动效                                                                                                                               | Vue3 详情抽屉 6 处宿主引用尚未替换，需在 UI-04 对照实际页面组合；UI-11 整库 Impeccable 审查未完成                                                            |
| `LxAuthImg`          | 独立中文 API/Demo；6 项单测覆盖公开 URL、Blob 请求、载入事件、对象 URL 回收、取消竞态、回退和空状态；3 项文档 Playwright 覆盖本地 Blob、失败恢复、375px/HUD、键盘和减少动效                                                                                                                                                                        | Vue3 AuthImg 适配器仍持有鉴权请求，待 UI-04 注入 `.then().catch().finally()` Blob 适配器并逐页回归；真实鉴权联调未执行；UI-11 整库审查未完成                 |
| `LxStatusSwitch`     | 对照 `design/状态开关 StatusSwitch/`；独立中文 API/Demo；宿主单测 6 项、文档 Playwright 3 项覆盖旧 `0/1` 值、关闭确认/取消、只读、loading、失败恢复、4.5:1 对比度、焦点、42×20px 轨道与 375px 44×44px 点按区、HUD 深色及减少动效                                                                                                                   | 库级设计和交互验收完成；Vue3 业务适配器仍使用 Element Plus，尚待宿主替换；整库 Impeccable 审查未完成                                                         |
| `LxPasswordInput`    | 独立中文 API/Demo；文档 Playwright 3 项覆盖明文切换、清空、focus/blur/select、剪贴板拦截、只读/禁用和 375px HUD；Vue3 宿主适配器单测纳入全量回归                                                                                                                                                                                                   | 组件文档和状态演示已补；真实登录/改密联调仍依赖后端；整库 Impeccable 审查未完成                                                                              |
| `LxTransferPanel`    | 对照 `design/虚拟滚动树 + 双栏穿梭/`；独立中文 API/Demo；单测 4 项、文档 Playwright 3 项覆盖全选/反选、树外键保留、禁用节点、上限、清空、宿主状态、375px 触控、键盘焦点及 HUD 深色                                                                                                                                                                 | 库级验收完成后仍需对 Vue3 `DataPermissionTree` 的 props、exposes、勾选与回传契约做宿主替换回归；整库 Impeccable 审查未完成                                   |
| `LxSectionTitle`     | 独立中文 API/Demo；11 项库单测和 2 项 Vue3 适配器单测通过；文档 Playwright 1/1 覆盖三种变体、字号/标签、键盘操作、HUD 主题、长标题和 320/375px 窄屏                                                                                                                                                                                                | 配置页真实组合回归仍待 UI-04 波次；UI-11 整库 Impeccable 审查未完成                                                                                          |
| 其他高频组件         | 类型检查、组件库构建及文档构建通过                                                                                                                                                                                                                                                                                                                 | 按宿主实际采用范围补行为单测、状态 Demo、键盘/窄屏/主题浏览器验收                                                                                            |
| `LxEmpty`            | API/Demo 已对齐 64px/48px 尺寸、`imageSize` 兼容和 `default`/`footer` 插槽；历史阶段性评审 28/40、修正后 34/40，均未满足 skill 正式 Critique 的独立评审和快照要求；detector `[]` 只表示对应源码静态零命中                                                                                                                                          | UI-11 正式组件/动效审查仍待 UI-10 闭环后按 skill 补齐；Vue3 15 处 `el-empty` 尚未替换，之后按实际 `image-size`/`class` 用法逐页回归                          |

`LxActionButtons` 已补 disabled 原生按钮、可点按的「更多」展开、Escape 焦点返回、失焦/外部点击收起和长文本窄屏约束；独立 API 示例配有 3 项单测与 3 项文档 Playwright，覆盖操作事件、隐藏项、键盘、375px 44×44px 触控尺寸、HUD 深色和减少动效。Vue3 仍有 29 处使用宿主 `ActionButtons`，组件替换和契约适配尚未开始；整库 Impeccable 审查仍在候选组件闭环之后。

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
