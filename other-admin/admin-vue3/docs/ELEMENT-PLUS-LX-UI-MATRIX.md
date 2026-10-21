# Vue3 Element Plus 与 lx-ui 替换清单

## 2026-10-21 LxButton 加载布局接入规则

- 组件严格行已关闭，宿主应提前绑定loading初值false或提前声明loadingText来获得稳定文字布局；原默认插槽在加载文案出现时保持挂载，副作用由宿主管理。纯图标加载文案/首次动态声明例外见中文API。
- 本波不增加宿主替换数；UI-10当前13/52，整库门禁与页面验收完成前继续保留Vue3 Element Plus。证据统一见全局计划、交接和组件审计当前条目。

## 2026-10-21 按钮 SVG 档位复验

- LxButton前置SVG按既有13/14/16px容器渲染，前后置/纯图标在桌面及窄屏、Light/HUD均有实际尺寸断言；相关回归 **3/3**、Mock完整回归 **11/11**，未增加宿主替换数量。
- loading布局稳定性与正式视觉综合门禁仍开放；Vue3 Element Plus删除前置条件未满足。

## 2026-10-21 LxButton 契约门禁进展

- 组件库修复未传 `disabled` 的父表单继承，以及动态默认插槽的纯图标/Tooltip 状态。显式 `false` 保留 EP 覆盖语义；宿主接入时不得将未传与显式 false 视为等价。
- 单测 **36/36**、文档 E2E **20/20**、补强专项 **1/1**，类型与两类构建通过。loading/SVG 及正式修后视觉门禁仍开放，本波不增加宿主替换数量、不删除 Vue3 Element Plus。

## 2026-10-21 组件库门禁优先级校正

- 当前先回到 lx-ui 严格组件矩阵开放项，完成门禁后再扩大 Vue3 替换；最近已迁移成果保留，Element Plus 删除门槛未满足。
- Descriptions Demo 主题生命周期修复已有单测 **4/4** 和文档 E2E **3/3**，不等于 Vue3 详情宿主或正式 UI-10 已完成。

## 2026-10-21 三方应用编辑专项 Mock 证据

- 两个 `LxInput` 已有浏览器专项 **1/1**：校验、业务失败重试、提交锁及创建/编辑/删除；测试位于 `tests/e2e/preview.spec.ts`，只运行本地 Mock。
- 本波不变更组件引用数量，不关闭网络失败、权限、真实联调或 UI-10/UI-11 门禁。

## 2026-10-21 三方应用编辑文本输入迁移

- `baseData/thirdParty/components/thirdPartyEdit.vue` 两个普通字符串输入改用 `LxInput`；剩余密码、数字有效期、textarea 和隐藏选择器未迁移。
- 当前源码 `src` 的直接 `<el-input>`（排除 `el-input-number`）为 **123** 处；计数只表示引用情况，不代表业务验收或依赖删除门禁通过。

## 2026-10-20 三方应用输入迁移

- `baseData/thirdParty/index.vue` 的搜索输入和只读密码输入改用 `LxInput`，保留前端过滤事件、密码显隐和禁用状态。
- 页面级直接 `el-input` 再减少 2 处；不能据此删除 `element-plus`，其余输入继续按契约迁移。

## 2026-10-20 Sidebar 菜单输入迁移

- 侧栏两个菜单输入已改用 `LxInput`，保留 `size="sm"`、clearable、prefix、回车/搜索状态和目录筛选契约。
- 虚拟用户表单的普通、密码和 textarea 输入暂保留 `el-input`：当前接口类型把文本字段声明为 number，与 `LxInput` 字符串 `v-model` 契约不一致，待类型来源确认后再迁移。

## 2026-10-20 SearchBar 默认输入迁移

- 共享 `SearchBar` 的默认关键字输入改用 `LxInput`，保留 `clearable`、回车、前缀图标和 `update:searchKey` 事件；自定义 filters 插槽不受影响。
- 业务页面直接 `el-input` 计数减少 1；页面级输入仍需按类型、表单上下文、插槽和校验规则继续核对，不能据数量删除 `element-plus`。

## 2026-10-20 LxSwitch 宿主替换完成

- 统一通信、警务上报、协同成员和第三方应用页面的剩余 6 个开关改用 `LxSwitch`；页面原有异步 `@change`、loading、失败回滚和 AppManage `before-change` 均保留。
- 重新扫描 `other-admin/admin-vue3/src` 后业务页面直接 `<el-switch>` 为 **0**；该事实不等于可以删除 `element-plus`，其他组件迁移和 lx-ui 内核依赖仍在。
- 下一批转入 `el-input`/`el-select`/`el-dialog` 等矩阵项，继续按真实 props、事件、插槽和表单上下文核对。

## 2026-10-20 LxSwitch 第三批宿主替换

- 南向 `TaskConfigModal`、PC 页签编辑和 H5 板块编辑共 4 处表单开关改用 `LxSwitch`；保留 `active-value/inactive-value`、`v-model`、表单条件和提交时机。
- Vue3 业务源码直接 `<el-switch>` 重新扫描为 **6** 处；剩余项包含统一通信筛选、异步状态表格和警务上报等复杂契约。
- 本批不删除 `element-plus`，不改变 API、权限或请求链。

## 2026-10-20 LxSwitch 第二批宿主替换

- AgentConfig、`baseData/mapConfig/EditMap.vue`、`baseData/thirdParty/thirdPartyEdit.vue` 共 4 个简单表单开关改用 `LxSwitch`；保留 `v-model`、`active-value/inactive-value`、文字和 `inline-prompt`。
- 重新扫描 Vue3 业务源码后直接 `<el-switch>` 为 **10** 处；剩余场景含统一通信、南向配置、警务上报、布局配置、协同或异步状态保存，需按契约继续迁移。
- 本批不删除 `element-plus`，不改变 API、权限或请求链。

## 2026-10-20 LxStatusSwitch 首批宿主替换

- `eventType/thirdParty/index.vue` 的编辑表单状态已改用 `LxStatusSwitch`；页面将 `form.status === 1` 映射为开启布尔值，事件回写为 `1/0`，不改变提交 API。
- Vue3 业务页面直接 `el-switch` 由历史 **15** 降为 **14**；剩余场景需逐一核对 `before-change`、数值映射、插槽、loading 和权限契约。
- `AppManage` 的双向确认及 API 成功前置切换不满足当前组件语义，暂保留 Element Plus 并列入能力差异，不删除宿主 `element-plus`。

## 2026-10-20 LxTag 第六批宿主替换

- 南向接口应用类型、用户选择弹窗状态、代理管理分类/优先级/可见范围改用 `LxTag`；保留循环、关闭回调、条件和文案。
- 代理优先级的 `danger` 映射为 `error`；LxTag 的 `close` 事件通过原分类删除闭包承接。
- 重新扫描后 Vue3 直接 `<el-tag>` 为 **9** 处，剩余均为权限树路径或用户/角色权限状态场景，按后置策略跟踪。

## 2026-10-20 LxTag 第五批宿主替换

- 客户端详情授权状态、第三方应用分组/类型、代理文件请求方式改用 `LxTag`；保留循环、条件、文案和现有 class。
- 客户端详情 `danger` 状态改为 lx-ui `error`；无关闭事件或自定义 effect 契约。
- 重新扫描后 Vue3 直接 `<el-tag>` 为 **14** 处；权限树/路径和复杂代理分类标签仍需单独核对。

## 2026-10-20 LxTag 第四批宿主替换

- 事件类型第三方状态、PC 布局打开方式、H5 布局类型和显示状态改用 `LxTag`，保留表格 slot、状态条件和中文文案。
- `danger` 映射为 `error`；本批没有关闭事件、effect 或自定义内容契约。
- 重新扫描后 Vue3 直接 `<el-tag>` 为 **18** 处。

## 2026-10-20 LxTag 第三批宿主替换

- `nodeManage/inboundData`、`outboundData`、`clientManage` 的标签和授权状态列改用 `LxTag`，保留原条件、文案和表格插槽。
- `danger` 映射为 `error`；授权状态、过期状态和空标签的显示语义不变。
- 重新扫描后 Vue3 直接 `<el-tag>` 为 **22** 处；剩余场景继续按 effect、关闭、插槽和权限状态核对。

## 2026-10-20 LxTag 第二批宿主替换

- `baseData/thirdParty`（列表紧凑/标准状态列）、第三方详情弹窗和 `baseData/mapConfig` 激活状态列改用 `LxTag`；保留状态条件、文案和原有 class。
- `danger` 统一映射为 lx-ui `error`；本批无 `effect`、关闭事件或自定义插槽契约。
- 重新扫描后 Vue3 直接 `<el-tag>` 为 **31** 处；剩余场景仍需逐页核对能力差异。

## 2026-10-20 LxTag 首批宿主替换

- `baseData/globals` 状态列和 `nodeManage/serverManage` 标签列改用 `LxTag`；Element Plus `danger` 映射为 lx-ui 的 `error`，展示文案和表格插槽保持不变。
- 源码盘点显示业务侧直接 `<el-tag>` 为 **35** 处，原记录 38 处已校正；剩余场景需逐页核对 `effect`、关闭按钮、插槽和状态语义后再替换。
- Vue3 类型检查和目标文件 Prettier 通过；本批不改变权限、请求链或 Element Plus 删除门禁。

## 2026-10-20 LxEmpty 宿主空态迁移完成

- 5 个剩余复杂空态已改用 `LxEmpty`：保留表格 `#empty` 插槽、条件渲染、`image-size="80"`、自定义 class 和原有业务文案。
- Vue3 源码直接使用 `el-empty` 数量由 5 降为 **0**；类型、目标格式和 Mock 全菜单回归需在本波交付记录中核对。
- 组件库和宿主仍保留 Element Plus 作为传递/兼容依赖；UI-10/UI-11 和删除门禁未完成前不得删除。

## 2026-10-17 LxCascader 与 LxTreeSelect 组件门禁

- lx-ui 组件、Demo、中文文档和宿主 Mock 浏览器证据已完成；定向单测 **32/32**、文档 E2E **10/10**。
- Assessment B 证据见 `.impeccable/critique/treeselect-cascader-assessment-b-2026-10-17/`，六路 detector 三件套与浏览器 JSON 均已核验；静态 `[]` 不是单独通过条件。
- UI-10 当前 **11/52**。Vue3 业务页面仍需按真实 props、事件、表单上下文和错误恢复逐页替换，不能据此删除宿主 `element-plus`。

## 2026-10-16 UI-04 前置组件：LxSectionTitle 适配器复核

- Vue3 `SectionTitle` 已补 `subtitle` 与 `leading` 插槽透传，`leading` 可覆盖映射图标和未映射 Element Plus 图标回退；库组件继续使用三变体设计。
- 单测 **18/18**、文档 E2E **1/1**、类型/ESLint/Prettier 通过；B 证据目录 `.impeccable/critique/sectiontitle-assessment-b-2026-10-16/` 保存 8 视图截图、DOM 和 detector 三件套。静态 `[]` 仅代表零命中，浏览器无错误、失败请求和横溢出。
- 真实宿主组合与权限/后端联调未完成，不能据此删除 `element-plus`；下一替换候选为 G2 `LxSearchBar`/`LxStatusSwitch`。

## 2026-10-16 G2 LxSearchBar 当前修复

- `LxSearchBar` 标准态第四字段内部承载查询/重置，适配器恢复批量 action `selectedCount` 禁用和 `action` key 事件，并隐藏默认状态行。
- 库单测 **9/9**、适配器单测 **2/2**（合计定向测试 **11/11**）、文档 E2E **4/4**，类型和格式检查通过。组织树、日期格式和旧业务参数契约仍是逐页迁移缺口，不能据此删除 `element-plus`。

## 2026-10-16 UI-04 前置组件：LxMetricCard 当前版语义复核

- `LxMetricCard` 公开 `trendDirection` 类型，显式控制上升/下降/持平图标；不传值继续按旧 `trendStatus` 回退。Badge 状态点已标记为装饰性内容，避免重复读屏。
- 定向单测 **15/15**、文档 Playwright **3/3**，lx-ui 类型检查、构建和目标格式检查通过。B 证据目录 `.impeccable/critique/metriccard-assessment-b-2026-10-16-recheck/` 保存三个目标 detector 三件套与 Light/HUD 桌面/移动浏览器证据；静态 `[]` 仅为零命中，浏览器无页面错误或失败请求，命中归因于文档壳层。
- 该项仍属于 UI-04 前置组件语义收口，不增加 UI-10 52 项关闭数；`ClientDetailDrawer.vue` 的 6 处实例、宿主组合回归、真实后端和全库 UI-11 仍未完成。Vue3 `element-plus` 继续保留。
- 当前独立 A/B 复核完成后再记录最终评分；下一入口为 `LxSectionTitle`，之后继续基础控件、动态图标和 `LxDynamicForm`。

## 2026-10-16 LxAuthImg 组件库修复，宿主适配未启动

- lx-ui `LxAuthImg` 当前版已修复回退图复用、旧元素迟到事件和小尺寸加载 frame，单测 **17/17**、文档 E2E **5/5**，B 路证据见 `.impeccable/critique/authimg-assessment-b-final-2026-10-16/`。
- 当前版 Assessment A **37/40（Good）**；请求失败并显示 fallback 时的 `error-actions` 重试契约已补测。宿主 `AuthImg` 适配、真实鉴权联调和全库 UI-10/UI-11 门禁仍未完成。
- Vue3 旧 `AuthImg` 的鉴权请求头、取消、Blob URL 生命周期和业务失败契约仍需适配层保留；在全库 UI-10/UI-11 与宿主组合回归完成前，不删除 Vue3 `element-plus` 直接依赖，也不把组件库 B 证据当作宿主替换证据。

## 2026-10-13 Wave 19 UI-10 组件矩阵进度

- `LxCheckbox`、`LxCheckboxGroup`、`LxRadio`、`LxRadioGroup` 已完成统一严格矩阵登记；UI-10 当前 **4/52**。本次只更新 lx-ui 组件审计，不代表 Vue3 宿主组件已替换，也不代表 Element Plus 可以移除。
- 下一步先复核 `LxInputNumber` 桌面步进目标尺寸 P2，再继续基础控件、动态图标、`LxDynamicForm` 与剩余组件门禁；Vue3 Element Plus 分批替换仍在其后。
- 页面操作引导当前不执行、不纳入待办、执行队列或排期；后续明确有需要时再重新确认范围并纳入计划。

## 2026-10-13 Wave 18 范围进度

- Checkbox/Radio 文档 375px 可读性 P2 已关闭；文档 E2E 8/8，正式 A/B 和独立代码复审通过。
- 此项不关闭 Checkbox、CheckboxGroup、Radio、RadioGroup 的 UI-10 严格矩阵行，全库仍为 0/52；也不改变 Vue3 Element Plus 直接依赖保留至替换门槛满足后的规则。
- 页面操作引导继续暂缓、不进入当前替换计划，后续确有需要时再重评估。

## 2026-10-11 UI-04 前置组件证据：MetricCard 与 SectionTitle

- `LxMetricCard` 已具备旧宿主 `valueType`/`title`/`footer`/`extra` 兼容层和进度可访问性；`LxSectionTitle` 适配器已透传 `headingLevel`、`size`、`tag`、`tagType`，并补齐根入口类型出口。
- 组件库证据：定向单测 32/32、文档 E2E 4/4、A 37/40、B 三 detector 合法 `[]`/空 stderr/exit 0、10 个视图 overlay、代码复审无 P0–P2。库级完成不等于宿主替换完成。
- `ClientDetailDrawer.vue` 中 6 处 MetricCard 标记为 **待 UI-04 宿主回归**；配置页 SectionTitle 同样需核对真实组合、权限反馈、loading/error、插槽和窄屏，不得只改标签名。
- 当前 UI-10 全库门禁未完成，Vue3 `element-plus` 直接依赖与 `@element-plus/icons-vue` 保持；只有剩余组件、宿主组合回归和整站 Impeccable 完成后才评估删除。

## 2026-10-09 Wave 7 当前状态

- Wave 7 `LxTransferPanel`/`LxVirtualTree` 定向单测合计 **64/64**、`LxTransferPanel` 文档 E2E **29/29**，VirtualTree 文档 E2E 的 13 项单独统计；`panelHeight` 默认 380px、最小 240px，Demo 默认 240px，长名称展开和反选浮层定位已修复。指定类型、Lint、格式、构建检查已通过；独立代码复审无 P0–P3。Assessment A **33/40**；Assessment B 两个 detector 均为有效 `[]`/空 stderr/exit 0，并完成独立浏览器证据。完整材料见 `.impeccable/critique/wave7-transferpanel-2026-10-09/`。
- UI-10 保持 0/52。Vue3 `DataPermissionTree` 替换仍属 UI-04，须依据真实组件契约和真实权限/后端接口验收。保留 Vue3 `element-plus`；新的严格隔离 A/B 正式完成后再提交、推送并进入 G2 `LxSearchBar` + `LxStatusSwitch`。

## 结论

可以移除 Vue3 应用 package.json 中的 element-plus 直接依赖，但前提是先把宿主源码、自动导入、类型声明、样式入口和构建分包都改为经 lx-ui 解析。Element Plus 仍会作为 linkx-fe 的传递依赖保留；这项工作统一依赖入口，不代表从运行时或产物中移除 Element Plus。

Vue3 目前有 103 个 Vue/TS 源文件直接从 element-plus 包导入组件、服务、类型或子路径；模板里出现 46 种 el-* 标签。lx-ui 入口已 export * from element-plus，因此没有专用 Lx 封装的控件也能继续通过 lx-ui 使用。不能只删除宿主 package.json 的依赖项：当前自动导入解析器和源码仍会尝试从 element-plus 解析，pnpm 严格依赖模式下会失败。

当前安装树的版本不同：Vue3 宿主解析到 Element Plus 2.14.2，lx-ui 解析到 2.14.6。迁移必须以 lx-ui 的版本为统一来源，并通过类型检查、构建和浏览器回归确认行为。

## 依赖入口

| 位置                                           | 当前直接依赖                                                                                    | 迁移要求                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| other-admin/admin-vue3/package.json            | 声明 element-plus 运行时依赖                                                                    | 最后移除此项；pnpm-lock.yaml 中仍保留 lx-ui 所需版本                                                                     |
| other-admin/admin-vue3/src/main.ts             | 导入 ElementPlus 插件和 element-plus/dist/index.css，同时导入 lx-ui/style.css                   | 插件从 lx-ui 导入；去除重复的全量 Element Plus 样式入口，验证 lx-ui/style.css 覆盖                                       |
| other-admin/admin-vue3/src/App.vue             | 从 element-plus 导入 ElConfigProvider，并从 element-plus/es/locale/lang/zh-cn 导入中文 locale   | ElConfigProvider 经 lx-ui 导入；中文 locale 需要由 lx-ui 公共导出，或确认宿主可维护独立 locale 包                        |
| other-admin/admin-vue3/vite.config.mts         | AutoImport 和 Components 使用 ElementPlusResolver；dedupe 和 manualChunks 直接列出 element-plus | 改为从 lx-ui 导入生成的组件/服务，更新声明生成和分包规则，并验证链接工作区包解析                                         |
| Vue3 src/**/\*.vue、src/**/*.ts                | 103 个源文件直接引用组件、ElMessage、ElMessageBox、Element Plus 类型及树组件深层路径            | 公共导入统一改到 lx-ui；深层 locale、树实例等类型/值要显式纳入 lx-ui 出口                                                |
| other-admin/admin-vue3/package.json            | 直接依赖 @element-plus/icons-vue                                                                | 侧栏、Navbar、SearchBar、GroupTags 首批图标已映射到 LxIcon；其他页面仍有直接导入，全部迁移后再核对剩余引用并决定是否删除 |
| linkx-fe/package.json 与 linkx-fe/src/index.ts | lx-ui 依赖 element-plus 并全量导出 Element Plus                                                 | 保留，这是 Vue3 应用的唯一 Element Plus 依赖所有者                                                                       |

移除 Vue3 的直接依赖不会自动减小 bundle。当前入口仍调用 app.use(ElementPlus)，会注册整个 Element Plus 插件；若未来目标包含减小产物，需要另行去掉全局插件注册并确认 lx-ui 内部组件的注册方式和按需样式。

## 控件映射

使用次数统计 Vue3 src 下模板中的标签出现次数，表示迁移范围，不代表每个用法都可以机械替换。

### 有 lx-ui 封装候选的标签

这些组件可以先逐页核对 props、事件、插槽、实例方法和样式，再替换为对应 Lx 组件。

`LxEmpty` 已补齐 `description`、`image-size` 到 `imageSize` 的显示映射和根节点 `class` 透传，并通过 5 项单测和文档 Playwright 1/1。Vue3 当前已无直接 `el-empty`；宿主迁移仍需继续核对每页空/加载/失败/权限状态，不将库级验收当作业务完成。

| Vue3 当前标签                          |     次数 | lx-ui 候选                                                             |
| -------------------------------------- | -------: | ---------------------------------------------------------------------- |
| el-descriptions / el-descriptions-item |   9 / 33 | LxDescriptions                                                         |
| el-dialog                              |       57 | LxDialog                                                               |
| el-drawer                              |        1 | LxDrawer                                                               |
| el-empty                               |        0 | LxEmpty                                                                |
| el-form / el-form-item                 | 58 / 278 | LxForm / LxFormItem                                                    |
| el-pagination                          |        0 | LxPagination                                                           |
| el-table / el-table-column             |  10 / 73 | LxProTable；宿主 ProTable 已使用该组件，但页面中的原始表格仍需逐页迁移 |
| el-tag                                 |        9 | LxTag                                                                  |
| el-upload                              |        8 | LxUpload                                                               |
| el-switch                              |       16 | LxStatusSwitch；校验值映射和开关事件契约                               |

`LxForm` 桌面多列采用设计稿 16px 列距；视口不大于 640px 时自动单列，保留桌面跨列语义并让窄屏字段通栏。基础控件桥接页的输入、数字、日期和文本域焦点使用贴边 1px 主色边线与紧邻的 2px、15% 主色光晕；单选和多选下拉统一使用控件自身 1px `border-box` 实体边框，不在控件外加第二圈，错误态保留错误色边框；焦点时控件尺寸不变。文档 Playwright 覆盖键盘展开、浅色/HUD、普通/错误状态及 375px 窄屏；多选单边线复修及 Impeccable 复评结果见交接。此为组件库级证据，Vue3 的 58 处 `el-form` 和 278 处 `el-form-item` 仍须逐场景适配，不能据此标记宿主替换完成。

Vue3 共享 `src/components/Pagination` 已使用 `LxPagination`，并通过适配器单测验证旧 `page/limit/pagination` 事件映射、`hidden`、layout/background 和宿主禁用自动滚动。当前源码盘点显示业务页面直接使用 `el-pagination` 的数量为 **0**；仅共享适配器内部保留分页组件适配。页面的真实接口、空结果、失败恢复、权限不足和嵌套滚动容器仍需在 Mock/真实契约门禁中继续验证，不能把适配器已接入扩大解释为所有分页业务已完成验收。

首批 6 个纯占位空态、第二批 4 个条件空态以及最后 5 个复杂空态页面均已改用 `LxEmpty`。最后一批保留了表格空插槽、条件表达式、`image-size` 和页面 class；后续仍需补齐各页面的空/加载/失败/权限状态回归，不能把标签归零解释为业务验收完成。

### 仅部分场景适用的封装

这些 Lx 组件不是 Element Plus 的通用等价替代，原控件超出封装场景时继续从 lx-ui 使用 Element Plus。

| Vue3 当前标签         |    次数 | lx-ui 相关组件                   | 边界                                                            |
| --------------------- | ------: | -------------------------------- | --------------------------------------------------------------- |
| el-button             |     266 | LxActionButtons                  | 只覆盖操作按钮组，不替代单个按钮的全部属性和插槽                |
| el-card               |      36 | LxPageCard                       | 页面容器有固定设计和布局语义，不是通用卡片                      |
| el-icon               |      51 | LxIcon                           | 提供 LinkX 图标资产和别名，不覆盖所有 Element Plus 图标组件能力 |
| el-input              |     204 | LxPasswordInput、LxDynamicForm   | 分别用于密码字段和 schema 表单，不替代通用输入框                |
| el-select             |      51 | LxSelectPagination、LxSelectTree | 覆盖远程分页或树选择，不替代普通本地 Select                     |
| el-tabs / el-tab-pane | 14 / 34 | LxTabsBar                        | 用于统一页签导航；内容面板、懒加载等要确认后再替换              |
| el-tree               |      15 | LxVirtualTree                    | 虚拟树的数据结构、节点插槽和方法需逐项适配                      |

### 没有 Lx 通用封装的标签

下列 25 种标签当前没有专用 Lx 组件。它们并非功能缺失：lx-ui 全量导出了 Element Plus，可以从 lx-ui 导入并继续使用。后续按页面需要决定保留原控件还是新建有真实复用价值的封装，不为减少标签数量强行包装。

| 标签            | 次数 | 标签             | 次数 | 标签              | 次数 |
| --------------- | ---: | ---------------- | ---: | ----------------- | ---: |
| el-alert        |    4 | el-checkbox      |    8 | el-checkbox-group |    4 |
| el-col          |   23 | el-collapse      |    1 | el-collapse-item  |    1 |
| el-color-picker |    3 | el-date-picker   |   11 | el-divider        |   12 |
| el-dropdown     |    4 | el-dropdown-item |   12 | el-dropdown-menu  |    4 |
| el-input-number |    8 | el-menu          |    1 | el-menu-item      |    3 |
| el-option       |   53 | el-popover       |    5 | el-progress       |    1 |
| el-radio        |   31 | el-radio-button  |    2 | el-radio-group    |   17 |
| el-result       |    1 | el-row           |   12 | el-sub-menu       |    1 |
| el-tooltip      |   14 |                  |      |                   |      |

## 迁移步骤

1. 先按 `design/` 完成按钮、表单八件套等 lx-ui 基础控件桥接、状态 Demo 和键盘/窄屏/主题浏览器验收；复核 `doc/LxIcon*` 动态图标已完成的库级证据。没有真实复用价值的控件不新增通用包装。
2. 基础控件稳定后完成 `LxDynamicForm` 的 schema、联动、默认值、重置、禁用和注入式 Mock 验收；再补弹窗、表格、搜索、树等其他待替换组件的契约、状态 Demo 和行为测试。库内组件和 Demo 完成后，先用 Impeccable 审查组件与动效并记录修复/复验。
3. 为 Element Plus 的 locale、服务、组件实例类型和当前深层导入补齐 lx-ui 的明确公共出口，并统一 Element Plus 版本来源。
4. 更新 Vue3 的直接导入、自动导入 resolver、组件/自动导入类型生成、全局插件注册、CSS 入口、dedupe 和 manualChunks；按表单/弹窗/表格/搜索/导航/树等共享影响面逐批替换适配器、Vue3 页面和图标。用代表页面检查组合和 pnpm 严格依赖解析；每批只回归受影响页面，并保留原有校验、事件、分页/跨页选择、上传、键盘、权限与失败恢复语义。
5. 相应组件替换稳定后，再补该业务模块完整 Mock/E2E；此前已通过的业务测试继续作为基线，不要求无改动重复验收。API、字段和 Vue2 已有权限契约可并行核查。
6. Vue3 组件和图标全部替换后，用 Impeccable 审查全站页面并记录修复/复验；全部直接引用迁移后，从 Vue3 package.json 移除 element-plus 直接依赖并更新锁文件；核对 pnpm 解析只经 lx-ui 传递依赖，并在 @element-plus/icons-vue 无直接引用或已明确由 lx-ui 兼容导出后再决定是否移除，然后运行类型检查、Lint、Vitest、生产构建、默认 Playwright、全菜单 Mock 预览及浏览器窄屏/键盘/错误空态检查。

## 设计资产与 Vue3 宿主采用映射

`design/` 当前目录中的非旧版设计是视觉和交互源；同名 zip、旧版文件夹不重复计作组件。下表区分库内实现与宿主采用，库中存在组件不代表 Vue3 页面已经替换。

| 设计来源                                                                                  | lx-ui 实现/样式目标                                                                       | Vue3 宿主候选                                                           | 当前状态                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design/按钮体系/`                                                                        | `element-theme.css` 的 ElButton 桥接、`LxActionButtons`                                   | `src/components/ActionButtons` 与共享工具栏                             | UI-10 严格矩阵已关闭（A 33/40、B 八视图、18 项单测、9 项文档 E2E）；Vue3 29 处宿主引用仍未替换，需适配 `buttons`/预设 `actions`、`onClick`、图标映射、`gap`、权限和 disabled 语义                                                                                                    |
| `design/表单控件八件套/`                                                                  | Element Plus 表单主题桥接、`LxForm`、`LxDynamicForm`、`LxPasswordInput`、`LxStatusSwitch` | 登录、配置、编辑弹窗及搜索表单适配器                                    | `LxPasswordInput` 已补独立中文 API/Demo 和文档 Playwright 3/3，覆盖显隐、清空、只读/禁用、exposes、剪贴板拦截及 375px HUD；其余表单控件按实际宿主契约继续补证，登录/改密真实联调待后端                                                                                               |
| `design/检索面板 SearchBar/`                                                              | `LxSearchBar`                                                                             | `src/components/SearchBar`、协同及值班检索                              | 库级已有中文 API/Demo 和 8 项单测，但缺少直接操作 SearchBar Demo 的组件级 Playwright；G2 补浏览器回归并盘点 Vue2 组织/日期、action/org-change 和实例方法与 Vue3 包装器的差异                                                                                                         |
| `design/状态开关 StatusSwitch/`                                                           | `LxStatusSwitch`                                                                          | `src/components/StatusSwitch`、列表启停项                               | 库级中文 API/Demo、8 项单测及文档 Playwright 3/3 已完成；宿主适配器仍独立使用 ElSwitch/ElTag，G2 复核 0/1 与 change(number)，宿主替换留到 UI-04                                                                                                                                      |
| `design/远程分页下拉 SelectPagination/`                                                   | `LxSelectPagination`                                                                      | 人员/部门选择弹窗                                                       | 库级独立 API/Demo 和文档 Playwright 3/3 已覆盖 targetMap 跨页回显、搜索取消、失败/空态和 375px；Vue3 业务页面仍无实际采用证据，替换时核对旧值回显和取消语义                                                                                                                          |
| `design/详情描述行 Descriptions/`                                                         | `LxDescriptions` 与 ElDescriptions 桥接                                                   | 详情弹窗、详情抽屉                                                      | 有封装/主题；宿主直接使用情况待逐页迁移                                                                                                                                                                                                                                              |
| `design/虚拟滚动树 + 双栏穿梭/`                                                           | `LxVirtualTree`、`LxTransferPanel`                                                        | 权限、部门、协同组织树                                                  | VirtualTree 当前 34 项单测和 13 项文档 E2E；TransferPanel 当前 30 项单测和 30 项文档 E2E，文档预览限宽 820px，并覆盖窄屏正文可用宽度；两者库级类型/构建通过。最终 Impeccable A/B 收口中。UI-10 仍为 0/52；Vue3 `DataPermissionTree` 替换及 props/exposes/勾选/回传契约回归仍待 UI-04 |
| `design/上传拖拽区 Upload/`                                                               | `LxUpload` 与 ElUpload 桥接                                                               | 地图、图标、Excel 和配置上传                                            | 库级独立 API/Demo、宿主注入式 Mock、4 项单测与 Chromium Playwright 3/3 已完成；真实业务页替换和各上传协议联调待迁移波次，分片仅由宿主适配器实现                                                                                                                                      |
| `design/指标卡 MetricCard/`                                                               | `LxMetricCard`                                                                            | 首页与详情统计区                                                        | 独立 API/Demo、6 项单测和 2 项文档 Playwright 覆盖语义色、LxIcon 趋势箭头、宿主旧 props/slots、进度边界与读屏、320px/HUD/减少动效；详情抽屉 6 处宿主引用仍待 UI-04 替换和真实组合回归                                                                                                |
| Vue2/Vue3 `AuthImg` 鉴权图片契约及 `COMPONENT-STYLE-INTERACTION.md` §6.2                  | `LxAuthImg`                                                                               | 统一通信设备类型、应用/代理商、H5 轮播、地图配置                        | 独立 API/Demo、6 项单测和 3 项文档 Playwright 覆盖注入式 Blob、取消竞态、对象 URL 清理、错误回退、空源及 375px/HUD/减少动效；Vue3 AuthImg 适配器仍待 UI-04 替换回归，真实鉴权联调未执行                                                                                              |
| `design/区块标题 SectionTitle/`                                                           | `LxSectionTitle`                                                                          | `src/components/SectionTitle`、配置页分区标题                           | Vue3 适配器保留旧 props、图标回退和 dashed 默认，并透传 `size`/`tag`/`tagType`；11 项库单测、2 项适配器单测及文档 Playwright 1/1 覆盖 320/375px、字号、标签和键盘操作；配置页真实组合回归待 UI-04                                                                                    |
| `doc/stitch_侧边栏/stitch_/`                                                              | `LxSidebar`                                                                               | `src/layout/components/Sidebar`                                         | 独立中文 API/Demo 和文档 Playwright 2/2 已验证键盘分组、rail 焦点、移动模态抽屉、HUD 及减少动效；Vue3 宿主仍以权限路由渲染 `el-menu`/`SidebarItem`，替换待 UI-11 后的 UI-04 波次并需保留搜索与全部菜单目录                                                                           |
| Vue3 现有日历契约（未发现专属 `design/` 日历稿）                                          | `LxDutyCalendar`                                                                          | `src/views/shiftScheduling/dutyInformation/components/DutyCalendar.vue` | 库级通用网格已验收；UI-04 需适配 `calendarList`/`loading`、班次详情 popover 和 `dutyTypeFilter` 显示规则，并保留父级月份查询事件与 `getSearchObj`/`goPrevMonth`/`goNextMonth` 实例方法，不可直接替换                                                                                 |
| `design/高频核心 13 枚/`、`design/中频 27 枚/`、`design/常用联想 29 枚/` 与 `doc/LxIcon*` | `LxIcon`：94 个标准图形/96 个名称、69 个设计清单动效名称                                  | Vue3 路由侧栏、登录、操作按钮、GroupTags 旧图标值及其他页面图标         | 库和独立浏览器证据已有；侧栏、Navbar、SearchBar、GroupTags 首批采用；GroupTags 旧字符串映射单测 22 项、Mock E2E 4/4 含 375px 滚动；其他页面仍有直接图标导入，接口继续保存旧值                                                                                                        |

每波替换后在交接记录中列出宿主页面、契约保持情况、Mock/浏览器验证及剩余未覆盖组件。未来 Vue2 页面迁入 Vue3 时按本表直接采用 lx-ui；不在 Vue2 运行时直接加载 Vue3 组件。

## 删除宿主直依赖的验收门槛

- Vue3 源码、Vite 配置和生成的类型声明不再从 element-plus 包名解析；@element-plus/icons-vue 要另行确认无宿主直接引用或已明确经 lx-ui 兼容导出。
- locale、FormInstance、UploadFile、ElTree 实例等目前走深层路径的入口已由 lx-ui 稳定导出。
- Element Plus 在 Vue3 的 pnpm 依赖树中只由 lx-ui 提供；版本锁定一致，构建不会依赖被提升到宿主 node_modules 的偶然结果。
- UI 组件替换逐页保留业务行为，并有可定位的 Mock 或浏览器验收证据。
- package.json、pnpm-lock.yaml、PROJECT-MAP、迁移矩阵和交接记录一致；产物与运行时验证通过。

当前状态：用量和依赖入口盘点已完成；lx-ui 高频组件浏览器验收、代码替换及宿主直依赖移除尚未完成。按总交付计划，组件库和接入层先于业务页面深交互验收；直接依赖在全部迁移后移除。

## 2026-10-20 输入控件迁移计数更新

- `authority/person/index.vue` 与 `authority/imPerson/index.vue` 共 4 个筛选 `el-input` 已替换为 `LxInput`，保留清空、回车和原值类型适配。
- 本批完成后 `el-input` 计数应以最新源码盘点为准；不要将组件库 Demo 中的 Element Plus 内核实现计入业务页面未迁移数量。
- `LxInput` 普通、密码、透传及复合前后缀边框由组件样式统一提供真实 `1px` 边界，专项 E2E **2/2**；Demo 问题反馈先按组件层、主题变量、宿主覆盖三层排查。
- 仍需逐页处理剩余输入、选择、弹窗和表单项；`element-plus` 依赖删除门槛未满足。

## 2026-10-20 dutyType 输入计数更新

- `shiftScheduling/dutyType/index.vue` 的排班类型名称输入已由 `el-input` 改为 `LxInput`，保留表单校验和最大长度 100。
- LxInput 的数值属性使用显式数字绑定；页面请求、权限和弹窗契约未改变。剩余 `el-input` 继续按页面和字段类型逐项迁移。

## 2026-10-20 userManage 输入计数更新

- `authority/userManage/components/EditUser.vue` 的用户名称 `el-input` 已替换为 `LxInput`，保留禁用、校验和长度限制。
- 数据权限树仍是业务宿主组件，不能因单个输入替换而扩大解释为权限迁移完成；`element-plus` 删除门槛仍未满足。

## 2026-10-20 location 输入计数更新

- `location/components/EditLocation.vue` 的经纬度 `el-input` 已替换为 `LxInput`，保留校验和长度限制。
- 组织选择和坐标业务校验仍由宿主维护；剩余表单输入继续按字段类型迁移，不能据此关闭全库门禁。

## 2026-10-20 dutyInformation 输入计数更新

- `shiftScheduling/dutyInformation/components/DutySearchBar.vue` 的人员 ID、姓名 `el-input` 已替换为 `LxInput`，保留搜索和清空行为。
- 日期、下拉和上传控件仍按各自契约保留；`element-plus` 删除门槛未满足。

## 2026-10-20 H5 输入计数更新

- `h5/quick/LookLabel.vue` 的警员姓名 `el-input` 已替换为 `LxInput`，保留前端过滤与键盘搜索。
- 标签树和详情接口仍由页面维护；剩余 H5 输入继续逐项迁移，不能据此关闭全库门禁。

## 2026-10-20 H5 快捷标签输入计数更新

- `h5/quick/index.vue` 的名称、图标、颜色三个 `el-input` 已替换为 `LxInput`，保留长度、统计、颜色同步和校验。
- 标签树、下拉和颜色选择器仍按业务契约保留；`element-plus` 删除门槛未满足。

## 2026-10-20 alertPush 输入计数更新

- `notification/alertPush/index.vue` 双 Tab 搜索区的 4 个 `el-input` 已替换为 `LxInput`，保留清空、回车和查询契约。
- 类型选择、表格、分页和写操作仍按页面契约保留；`element-plus` 删除门槛未满足。

## 2026-10-20 eventType 输入计数更新

- `eventType/thirdParty/index.vue` 搜索区的应用名称 `el-input` 已替换为 `LxInput`。
- 密码、数字有效期和 textarea 仍属于待核对复杂字段，不计为已完成的全页替换；依赖删除门槛未满足。

## 2026-10-20 IcpAuthManage 输入计数更新

- `IcpAuthManage.vue` 的姓名、身份证号、组织树三个 `el-input` 已替换为 `LxInput`，保留树过滤和查询契约。
- 授权树与后端权限字段仍待联调；不能据此关闭权限迁移或 Element Plus 删除门禁。

## 2026-10-20 IcpServerConfig 输入计数更新

- `IcpServerConfig.vue` 的 IP、WSS、用户名、只读节点和树搜索 `el-input` 已替换为 `LxInput`。
- 密码、端口及服务配置接口仍按原契约保留；复杂字段未完成前不能关闭 Element Plus 删除门槛。

## 2026-10-20 南向与应用管理输入计数更新

- `southInterface/index.vue`、`app/components/AppManage.vue` 的应用名称 `el-input` 已替换为 `LxInput`。
- 映射、任务配置、状态和真实第三方接口仍按页面契约保留；全库依赖删除门槛未满足。

## 2026-10-21 应用分类与授权树输入计数更新

- `GroupManage.vue` 分类搜索/名称和 `AuthTreeModal.vue` 树过滤共 3 个 `el-input` 已替换为 `LxInput`。
- 排序数字、应用编辑条件字段、权限保存和 Element Plus 依赖删除仍未完成。

## 2026-10-21 AppForm 输入计数更新

- `AppForm.vue` 的 7 个普通文本 `el-input` 已替换为 `LxInput`，保留条件渲染和长度校验。
- 上传、选择器、排序数字及真实接口仍按页面契约保留；全库删除门槛未满足。

## 2026-10-21 南向任务配置输入计数更新

- `TaskConfigModal.vue` 的任务名称、开始时间、结束时间三个 `el-input` 已替换为 `LxInput`。
- 任务内容 textarea、等级、紧急开关和远程配置接口仍按页面契约保留；依赖删除门槛未满足。

## 2026-10-21 警务上报输入计数更新

- `TypeManage.vue`、`TypeEdit.vue` 的类型标签 2 个 `el-input` 已替换为 `LxInput`，保留搜索和表单契约。
- 节点服务混合类型字段仍待迁移，不能关闭全库依赖删除门槛。

## 2026-10-21 节点服务输入计数更新

- `ServerFormDialog.vue` 的 IP、名称、标签、备注 4 个 `el-input` 已替换为 `LxInput`，保留禁用和校验契约。
- 端口及真实节点接口仍按原控件处理；全库删除门槛未满足。

## 2026-10-21 警务对接输入计数更新

- `DockManage.vue`、`EditDock.vue` 共 8 个普通 `el-input` 已替换为 `LxInput`，保留搜索和表单契约。
- 端口、JSON/脚本 textarea 与真实警务接口仍待处理，不能关闭全库依赖删除门槛。

## 2026-10-21 客户端编辑输入计数更新

- `EditDialog.vue` 的名称、备注、标签 3 个 `el-input` 已替换为 `LxInput`。
- 拒绝理由 textarea 和真实客户端 API 仍按原契约保留；全库删除门槛未满足。

## 2026-10-21 协同与 H5 输入计数更新

- 协同岗级别、协同搜索、全局配置、H5 归档共 5 个 `el-input` 已替换为 `LxInput`。
- 组织选择、时间筛选、归档操作和真实权限接口仍按页面契约保留；依赖删除门槛未满足。

## 2026-10-21 H5 轮播输入计数更新

- `CarouselForm.vue` 的标题、跳转链接 2 个 `el-input` 已替换为 `LxInput`，保留条件和表单契约。
- 上传、选择器、排序数字和真实接口仍待处理；全库删除门槛未满足。

## 2026-10-21 H5 群组标签输入计数更新

- `GroupTagsForm.vue` 的名称、图标搜索/只读值、颜色 4 个 `el-input` 已替换为 `LxInput`，保留前缀和选择器契约。
- 图标资产、颜色主题和真实接口仍按页面契约保留；依赖删除门槛未满足。

## 2026-10-21 预警编辑输入计数更新

- 两个预警编辑表单的 4 个只读 `el-input` 已替换为 `LxInput`，保留禁用和表单契约。
- 通知对象选择和真实权限接口仍待处理；全库依赖删除门槛未满足。

## 2026-10-11 Wave 11 P2 影响更新

- `LxTransferPanel` 与 `LxVirtualTree` 已完成当前版组件级严格 UI/交互审查：单测合计 67/67、文档 E2E 合计 48/48，类型、203 modules 构建、文档构建和 Vue3 生产构建通过；代码复审无 P0-P3。Assessment A 36/40；Assessment B 5 个 detector 均为有效 `[]`/空 stderr/0，9 个浏览器视图证据完整。
- 这只表示库组件契约和演示证据完成，不表示 Vue3 `DataPermissionTree` 已替换。宿主仍需逐项核对数据字段、父子级联、树外已选键、exposes、批量上限、加载/空/错、取消和真实权限 API，并在 UI-04 补 Mock/E2E。
- `el-tree` 的 15 处使用不能机械替换；`LxVirtualTree` 适用于虚拟树契约，`LxTransferPanel` 适用于双栏授权场景，其他页面继续保留 Element Plus 或使用 lx-ui 导出的桥接控件，直到适配矩阵有明确证据。
- `LxMetricCard` + `LxSectionTitle`、`LxTextarea` 已完成组件级复核；基础控件下一项按顺序进入 `LxSelect`。之后仍需处理 UI-10 其他未关闭项，再进入 Vue3 Element Plus 分批替换。宿主依赖删除门槛、权限中心/文本权限/页面操作引导延期规则和 `.then().catch().finally()` API 请求规范保持不变。

## 2026-10-20 LxMetricCard 组件层复验

- 组件库当前版已修复标题运行时缺陷并收口只读语义；文档 E2E **3/3**、单测 **17/17**。Vue3 详情宿主仍保留 Element Plus/旧适配器，需等 UI-10/UI-11 门禁后逐页替换和组合回归。
