# Vue3 Element Plus 与 lx-ui 替换清单

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

`LxEmpty` 已补齐 `description`、`image-size` 到 `imageSize` 的显示映射和根节点 `class` 透传，并通过 5 项单测和文档 Playwright 1/1。Vue3 当前 15 处 `el-empty` 尚未替换；替换时继续核对每页描述、尺寸和实际插槽，不将库级验收当作宿主完成。

| Vue3 当前标签                          |     次数 | lx-ui 候选                                                             |
| -------------------------------------- | -------: | ---------------------------------------------------------------------- |
| el-descriptions / el-descriptions-item |   9 / 33 | LxDescriptions                                                         |
| el-dialog                              |       57 | LxDialog                                                               |
| el-drawer                              |        1 | LxDrawer                                                               |
| el-empty                               |       15 | LxEmpty                                                                |
| el-form / el-form-item                 | 58 / 278 | LxForm / LxFormItem                                                    |
| el-pagination                          |        4 | LxPagination                                                           |
| el-table / el-table-column             |  10 / 73 | LxProTable；宿主 ProTable 已使用该组件，但页面中的原始表格仍需逐页迁移 |
| el-tag                                 |       38 | LxTag                                                                  |
| el-upload                              |        8 | LxUpload                                                               |
| el-switch                              |       16 | LxStatusSwitch；校验值映射和开关事件契约                               |

Vue3 共享 `src/components/Pagination` 已使用 `LxPagination`，并通过 2 项单测验证旧 `page/limit/pagination` 事件映射、`hidden`、layout/background 和宿主禁用自动滚动。源码中仍有 4 个业务页面直接使用 `el-pagination`，须按对应页面的加载、空结果和滚动容器契约逐页替换；上述库/适配器测试不表示这 4 个页面已完成迁移。

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

| 设计来源                                                                                  | lx-ui 实现/样式目标                                                                       | Vue3 宿主候选                                                   | 当前状态                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design/按钮体系/`                                                                        | `element-theme.css` 的 ElButton 桥接、`LxActionButtons`                                   | `src/components/ActionButtons` 与共享工具栏                     | `LxActionButtons` 独立 API、3 项单测和 3 项文档 Playwright 已覆盖禁用项、溢出展开、键盘/Escape、焦点恢复/移出、外部点击、375px 44×44px 触控、HUD 主题及减少动效；Vue3 29 处宿主引用仍未替换，需适配 `buttons`/预设 `actions`、`onClick`、图标映射、`gap`、权限和 disabled 语义 |
| `design/表单控件八件套/`                                                                  | Element Plus 表单主题桥接、`LxForm`、`LxDynamicForm`、`LxPasswordInput`、`LxStatusSwitch` | 登录、配置、编辑弹窗及搜索表单适配器                            | `LxPasswordInput` 已补独立中文 API/Demo 和文档 Playwright 3/3，覆盖显隐、清空、只读/禁用、exposes、剪贴板拦截及 375px HUD；其余表单控件按实际宿主契约继续补证，登录/改密真实联调待后端 |
| `design/检索面板 SearchBar/`                                                              | `LxSearchBar`                                                                             | `src/components/SearchBar`、协同及值班检索                      | 共享 SearchBar 已接入；页面专属检索待检查                                                                                                                                                  |
| `design/状态开关 StatusSwitch/`                                                           | `LxStatusSwitch`                                                                          | `src/components/StatusSwitch`、列表启停项                       | 库级中文 API/Demo、6 项单测及文档 Playwright 3/3 已完成；宿主适配器仍独立使用 ElSwitch，待 UI-04 替换波次核对数值映射和事件契约                                                            |
| `design/远程分页下拉 SelectPagination/`                                                   | `LxSelectPagination`                                                                      | 人员/部门选择弹窗                                               | 库级独立 API/Demo 和文档 Playwright 3/3 已覆盖 targetMap 跨页回显、搜索取消、失败/空态和 375px；Vue3 业务页面仍无实际采用证据，替换时核对旧值回显和取消语义                                |
| `design/详情描述行 Descriptions/`                                                         | `LxDescriptions` 与 ElDescriptions 桥接                                                   | 详情弹窗、详情抽屉                                              | 有封装/主题；宿主直接使用情况待逐页迁移                                                                                                                                                    |
| `design/虚拟滚动树 + 双栏穿梭/`                                                           | `LxVirtualTree`、`LxTransferPanel`                                                        | 权限、部门、协同组织树                                          | VirtualTree 已通过 8 项单测；TransferPanel 独立 API/Demo、4 项单测及文档 Playwright 3/3 覆盖反选、上限、树外键/禁用键保留和 375px 触控；Vue3 `DataPermissionTree` 替换及契约回归仍待 UI-04 |
| `design/上传拖拽区 Upload/`                                                               | `LxUpload` 与 ElUpload 桥接                                                               | 地图、图标、Excel 和配置上传                                    | 库级独立 API/Demo、宿主注入式 Mock、4 项单测与 Chromium Playwright 3/3 已完成；真实业务页替换和各上传协议联调待迁移波次，分片仅由宿主适配器实现                                            |
| `design/指标卡 MetricCard/`                                                               | `LxMetricCard`                                                                            | 首页与详情统计区                                                | 独立 API/Demo、6 项单测和 2 项文档 Playwright 覆盖语义色、LxIcon 趋势箭头、宿主旧 props/slots、进度边界与读屏、320px/HUD/减少动效；详情抽屉 6 处宿主引用仍待 UI-04 替换和真实组合回归 |
| Vue2/Vue3 `AuthImg` 鉴权图片契约及 `COMPONENT-STYLE-INTERACTION.md` §6.2 | `LxAuthImg` | 统一通信设备类型、应用/代理商、H5 轮播、地图配置 | 独立 API/Demo、6 项单测和 3 项文档 Playwright 覆盖注入式 Blob、取消竞态、对象 URL 清理、错误回退、空源及 375px/HUD/减少动效；Vue3 AuthImg 适配器仍待 UI-04 替换回归，真实鉴权联调未执行 |
| `design/区块标题 SectionTitle/`                                                           | `LxSectionTitle`                                                                          | `src/components/SectionTitle`、配置页分区标题                   | Vue3 适配器保留旧 props、图标回退和 dashed 默认，并透传 `size`/`tag`/`tagType`；11 项库单测、2 项适配器单测及文档 Playwright 1/1 覆盖 320/375px、字号、标签和键盘操作；配置页真实组合回归待 UI-04 |
| `doc/stitch_侧边栏/stitch_/`                                                              | `LxSidebar`                                                                               | `src/layout/components/Sidebar`                                  | 独立中文 API/Demo 和文档 Playwright 2/2 已验证键盘分组、rail 焦点、移动模态抽屉、HUD 及减少动效；Vue3 宿主仍以权限路由渲染 `el-menu`/`SidebarItem`，替换待 UI-11 后的 UI-04 波次并需保留搜索与全部菜单目录 |
| Vue3 现有日历契约（未发现专属 `design/` 日历稿）                                           | `LxDutyCalendar`                                                                          | `src/views/shiftScheduling/dutyInformation/components/DutyCalendar.vue` | 库级通用网格已验收；UI-04 需适配 `calendarList`/`loading`、班次详情 popover 和 `dutyTypeFilter` 显示规则，并保留父级月份查询事件与 `getSearchObj`/`goPrevMonth`/`goNextMonth` 实例方法，不可直接替换 |
| `design/高频核心 13 枚/`、`design/中频 27 枚/`、`design/常用联想 29 枚/` 与 `doc/LxIcon*` | `LxIcon`：94 个标准图形/96 个名称、69 个设计清单动效名称                                  | Vue3 路由侧栏、登录、操作按钮、GroupTags 旧图标值及其他页面图标 | 库和独立浏览器证据已有；侧栏、Navbar、SearchBar、GroupTags 首批采用；GroupTags 旧字符串映射单测 22 项、Mock E2E 4/4 含 375px 滚动；其他页面仍有直接图标导入，接口继续保存旧值              |

每波替换后在交接记录中列出宿主页面、契约保持情况、Mock/浏览器验证及剩余未覆盖组件。未来 Vue2 页面迁入 Vue3 时按本表直接采用 lx-ui；不在 Vue2 运行时直接加载 Vue3 组件。

## 删除宿主直依赖的验收门槛

- Vue3 源码、Vite 配置和生成的类型声明不再从 element-plus 包名解析；@element-plus/icons-vue 要另行确认无宿主直接引用或已明确经 lx-ui 兼容导出。
- locale、FormInstance、UploadFile、ElTree 实例等目前走深层路径的入口已由 lx-ui 稳定导出。
- Element Plus 在 Vue3 的 pnpm 依赖树中只由 lx-ui 提供；版本锁定一致，构建不会依赖被提升到宿主 node_modules 的偶然结果。
- UI 组件替换逐页保留业务行为，并有可定位的 Mock 或浏览器验收证据。
- package.json、pnpm-lock.yaml、PROJECT-MAP、迁移矩阵和交接记录一致；产物与运行时验证通过。

当前状态：用量和依赖入口盘点已完成；lx-ui 高频组件浏览器验收、代码替换及宿主直依赖移除尚未完成。按总交付计划，组件库和接入层先于业务页面深交互验收；直接依赖在全部迁移后移除。
