# Admin Vue3 重构进度跟踪文档

> **项目路径**: `docs-local/admin-vue3/`
> **原项目**: `cloudcmd-admin-web/`（Vue2 + Options API + Element UI + Vuex + Webpack）
> **最后更新**: 2026-07-27
> **配套架构文档**: `REFACTOR_PLAN.md`

---

## 〇、Vue2 admin 完整功能清单 vs Vue3 实现状态

### 0.1 路由模块总览（10 个模块）

| #   | 模块         | 路由             | Vue2 子路由数 | Vue3 路由文件      | Vue3 实现状态                                   |
| --- | ------------ | ---------------- | ------------- | ------------------ | ----------------------------------------------- |
| 1   | 权限中心     | `/authority`     | 10            | `authority.ts`     | ⚠️ 部分完成（仅 auth + person；8 个待迁移）     |
| 2   | 基础数据     | `/baseData`      | 4             | `baseData.ts`      | ✅ 完成（4 个子路由全部迁移）                     |
| 3   | 协同岗管理   | `/collaboration` | 2             | `collaboration.ts` | ✅ 完成（含 5 个 tab）                          |
| 4   | H5 管理      | `/h5`            | 2             | `h5.ts`            | ✅ 完成                                        |
| 5   | 位置管理     | `/location`      | 1             | `location.ts`      | ✅ 完成                                         |
| 6   | 多节点管理   | `/nodeManage`    | 2             | `nodeManage.ts`    | ✅ 完成                                         |
| 7   | 警信扩展信息 | `/policeExtend`  | 1             | `policeExtend.ts`  | ✅ 完成                                         |
| 8   | 排班管理     | `/scheduling`    | 2             | `scheduling.ts`    | ✅ 完成                                         |
| 9   | 预警管理     | `/notification`  | 1             | `notification.ts`  | ✅ 完成                                         |
| 10  | 三方对接     | `/thirdParty`    | 5             | `thirdParty.ts`    | ✅ 完成                                        |

### 0.2 权限中心 `/authority` 子路由（10 项）

| 子路由             | Vue2 meta.title | Vue3 实现状态 | Vue3 文件                                                                                                  |
| ------------------ | --------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| `role`             | 角色管理        | ✅ 完成       | `views/authority/auth/index.vue` + `EditRole.vue`                                                          |
| `person`           | 权限管理        | ✅ 完成       | `views/authority/person/index.vue` + `setRole.vue` + `setBatchRole.vue`                                    |
| `userManage`       | 用户管理        | ✅ 完成       | `views/authority/userManage/index.vue`（仅 admin+userId=1 可见）                                           |
| `IMpermission`     | 前台权限管理    | ✅ 完成       | `views/authority/imPermission/index.vue`（生产隐藏）                                                       |
| `IMrole`           | 前台角色管理    | ✅ 完成       | `views/authority/imRole/index.vue`（生产隐藏）                                                             |
| `IMperson`         | 前台用户管理    | ✅ 完成       | `views/authority/imPerson/index.vue`（生产隐藏）                                                           |
| `adminPermission`  | 后台权限管理    | ✅ 完成       | `views/authority/adminPermission/index.vue`（生产隐藏）                                                    |
| `adminRole`        | 后台角色管理    | ✅ 完成       | `views/authority/adminRole/index.vue`（生产隐藏）                                                          |
| `adminPerson`      | 后台用户管理    | ✅ 完成       | `views/authority/adminPerson/index.vue`（生产隐藏）                                                        |
| `customDepartment` | 自定义组织管理  | ✅ 完成       | `views/authority/customDepartment/index.vue`（多级树+警员绑定+ProTable+PoliceSelectDialog+UserBindDialog） |

### 0.3 基础数据 `/baseData` 子路由（4 项）

| 子路由         | Vue2 meta.title | Vue3 实现状态 | Vue3 文件                                                                             |
| -------------- | --------------- | ------------- | ------------------------------------------------------------------------------------- |
| `thirdParty`   | 三方应用        | ✅ 完成       | `views/baseData/thirdParty/index.vue` + `thirdPartyEdit.vue` + `thirdPartyDetail.vue` |
| `globals`      | 全局配置        | ✅ 完成       | `views/baseData/globals/index.vue` + `globalsConfig.vue`                              |
| `mapConfig`    | 地图配置        | ✅ 完成       | `views/baseData/mapConfig/index.vue`（地图 CRUD + 底图上传 + 行政区划）               |
| `layoutConfig` | 布局配置        | ✅ 完成       | `views/baseData/layoutConfig/index.vue`（仅 admin，PC/App H5 双端布局）               |

### 0.4 协同岗管理 `/collaboration` 子路由（2 项）

| 子路由  | Vue2 meta.title     | Vue3 实现状态 | Vue3 文件                                             |
| ------- | ------------------- | ------------- | ----------------------------------------------------- |
| `index` | 协同岗管理（5 tab） | ✅ 完成       | `views/collaboration/index.vue` + 5 个页面 + 9 个组件 |
| `quick` | 标签管理            | ✅ 完成       | `views/quick/index.vue`                               |

### 0.5 H5 管理 `/h5` 子路由（2 项）

| 子路由          | Vue2 meta.title | Vue3 实现状态 | Vue3 文件                                                                                              |
| --------------- | --------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `carousel`      | 轮播图管理      | ✅ 完成       | `views/h5/carousel/index.vue` + `components/CarouselForm.vue`（图片上传 + 公众号/文章联动 + CRUD）    |
| `ArchivedTable` | 已归档群组管理  | ✅ 完成       | `views/h5/archivedTable/index.vue`（批量下载进度条弹窗 + AbortController 取消 + 批量删除 + 同步群组） |

### 0.6 位置管理 `/location` 子路由（1 项）

| 子路由     | Vue2 meta.title | Vue3 实现状态 | Vue3 文件                                                                               |
| ---------- | --------------- | ------------- | --------------------------------------------------------------------------------------- |
| `location` | 位置信息        | ✅ 完成       | `views/location/index.vue` + `components/EditLocation.vue` + `api/resource/location.ts` |

### 0.7 多节点管理 `/nodeManage` 子路由（2 项）

| 子路由           | Vue2 meta.title | Vue3 实现状态 | Vue3 文件                                                          |
| ---------------- | --------------- | ------------- | ------------------------------------------------------------------ |
| `nodeManagement` | 节点管理        | ❌ 占位       | `views/nodeManage/nodeManagement/index.vue`（服务器+客户端双 tab） |
| `dataManage`     | 数据管理        | ❌ 占位       | `views/nodeManage/dataManage/index.vue`（出局+入局双 tab）         |

Vue2 详细组件清单（待迁移）：

- `serverManage/` — 服务器管理（ProTable + ConnectionStatusDot + ServerFormDialog）
- `clientManage/` — 客户端管理（ProTable + EditDialog + AuthorizeDialog）
- `outboundData/` — 出局数据授权（ProTable + GrantConfigDialog）
- `inboundData/` — 入局数据授权（ClientDetailDrawer + 数据项授权开关 + 统计）
- `components/ConnectionStatusDot.vue` — 连接状态圆点

### 0.8 警信扩展信息 `/policeExtend` 子路由（1 项）

| 子路由        | Vue2 meta.title | Vue3 实现状态 | Vue3 文件                                                   |
| ------------- | --------------- | ------------- | ----------------------------------------------------------- |
| `virtualUser` | 虚拟用户管理    | ❌ 占位       | `views/policeExtend/virtualUser/index.vue`（虚拟用户 CRUD） |

### 0.9 排班管理 `/scheduling` 子路由（2 项）

| 子路由            | Vue2 meta.title | Vue3 实现状态 | Vue3 文件                                                                    |
| ----------------- | --------------- | ------------- | ---------------------------------------------------------------------------- |
| `dutyType`        | 排班类型管理    | ❌ 占位       | `views/shiftScheduling/dutyType/index.vue`（CRUD）                           |
| `dutyInformation` | 排班信息        | ✅ 完成       | `views/shiftScheduling/dutyInformation/index.vue`（日历+列表+导入+模板导出） |

### 0.10 预警管理 `/notification` 子路由（1 项）

| 子路由      | Vue2 meta.title | Vue3 实现状态 | Vue3 文件                                                           |
| ----------- | --------------- | ------------- | ------------------------------------------------------------------- |
| `alertPush` | 预警推送        | ❌ 占位       | `views/notification/alertPush/index.vue`（任务逾期+无人值守双 tab） |

Vue2 详细组件清单（待迁移）：

- `SelectPagination.vue` — 分页选择弹窗
- `TaskDueAddForm.vue` / `TaskDueEditForm.vue` — 任务逾期新增/编辑
- `UnattendedAddForm.vue` / `UnattendedEditForm.vue` — 无人值守新增/编辑
- API：`getWarningRelationList`、`createWarningRelation`、`updateWarningRelation`、`deleteWarningRelation`、`queryGroupInfo`、`queryUserInfo`

### 0.11 三方对接 `/thirdParty` 子路由（5 项）

| 子路由           | Vue2 meta.title | Vue3 实现状态 | Vue3 文件                                                                            |
| ---------------- | --------------- | ------------- | ------------------------------------------------------------------------------------ |
| `app`            | 应用管理        | ❌ 占位       | `views/thirdInterface/app/index.vue`（应用分组 CRUD）                                |
| `southInterface` | 南向对接        | ❌ 占位       | `views/thirdInterface/southInterface/index.vue`（可调用南向应用 + 映射关系）         |
| `policeReport`   | 警单平台        | ❌ 占位       | `views/thirdInterface/policeReport/`（dock + manage + typeManage 三子模块）          |
| `unifiedComm`    | 通信服务管理    | ❌ 占位       | `views/thirdInterface/unifiedComm/index.vue`（ICP 服务器配置 + 批量部门/摄像头权限） |
| `agentInterface` | AI 智能体对接   | ❌ 占位       | `views/thirdInterface/agentInterface/index.vue`（24+ 方法，最复杂模块）              |

Vue2 agentInterface 详细组件清单（待迁移）：

- `AgentManage.vue` — 智能体管理
- `AgentManageEditModal.vue` — 编辑弹窗
- `AgentConfig.vue` — 智能体配置
- `AgentFile.vue` — 文件配置
- `AgentHistory.vue` — 执行记录
- `AgentTypeEditModal.vue` — 分类编辑
- `AgentBindVirtualUser.vue` — 绑定虚拟用户
- API 含部署配置、智能体 CRUD、执行记录、分类、导入/导出、绑定关系、文件配置

### 0.12 Vue2 全局组件清单（17 个）

| 组件                | Vue2 用途            | Vue3 实现状态                      | Vue3 文件                            |
| ------------------- | -------------------- | ---------------------------------- | ------------------------------------ |
| Pagination          | el-pagination 封装   | ✅ 完成                            | `components/Pagination/index.vue`    |
| AuthImg             | Token 鉴权图片       | ✅ 完成                            | `components/AuthImg/index.vue`       |
| Breadcrumb          | 面包屑               | ✅ 完成                            | `components/Breadcrumb/index.vue`    |
| Hamburger           | 侧边栏开关           | ✅ 完成                            | `components/Hamburger/index.vue`     |
| ProTable            | 配置式表格           | ✅ 完成（+ indexLabel/indexWidth） | `components/ProTable/index.vue`      |
| SearchBar           | 搜索栏               | ✅ 完成（#filters + actions）      | `components/SearchBar/index.vue`     |
| SelectTree          | 组织选择器（同步）   | ✅ 合并到 OrgTreeSelect            | `components/OrgTreeSelect/index.vue` |
| SelectTreeLazy      | 组织选择器（懒加载） | ✅ 合并到 OrgTreeSelect            | `components/OrgTreeSelect/index.vue` |
| StatusSwitch        | 状态切换             | ❌ 未迁移                          | —                                    |
| SvgIcon             | SVG 图标             | ✅ 完成                            | `components/SvgIcon/index.vue`       |
| Upload              | 文件上传弹窗         | ❌ 未迁移                          | —                                    |
| UserBindDialog      | 用户单选弹窗         | ❌ 未迁移                          | —                                    |
| UserSelectDialog    | 用户多选弹窗         | ❌ 未迁移                          | —                                    |
| PoliceSelectDialog  | 警员多选弹窗         | ❌ 未迁移                          | —                                    |
| VirtualCheckboxList | 虚拟滚动复选框       | ❌ 未迁移                          | —                                    |
| VirtualTree         | 虚拟滚动树           | ❌ 未迁移                          | —                                    |
| PasswordInput       | 密码输入框           | ✅ 完成                            | `components/PasswordInput/index.vue` |

### 0.13 Vue2 全局指令/原型方法

| 指令/原型                | Vue2 用途            | Vue3 实现状态                      | Vue3 文件                      |
| ------------------------ | -------------------- | ---------------------------------- | ------------------------------ |
| `v-waves`                | 点击波纹             | ✅ 完成                            | `directives/waves.ts`          |
| `v-loadmore`             | el-select 下拉懒加载 | ✅ 完成                            | `directives/loadmore.ts`       |
| `Vue.prototype.hasPerm`  | 按钮权限判断         | ✅ 改为 composable                 | `composables/usePermission.ts` |
| `Vue.prototype.eventBus` | 事件总线             | ❌ 未迁移（Vue3 用 mitt 替代）     | —                              |
| `Vue.prototype.$on` 重写 | click 500ms 防抖     | ❌ 未迁移（按需在业务层 debounce） | —                              |
| strict 会话超时          | 60 分钟无操作登出    | ✅ 完成                            | `composables/useStrict.ts`     |

### 0.14 Vue2 Store 模块（Vuex）

| Vuex 模块  | 主要职责                                                      | Vue3 实现状态 | Vue3 文件                            |
| ---------- | ------------------------------------------------------------- | ------------- | ------------------------------------ |
| `app`      | sidebar + device                                              | ✅ 完成       | `store/modules/useAppStore.ts`       |
| `settings` | 系统设置 + systemName                                         | ✅ 完成       | `store/modules/useSettingsStore.ts`  |
| `user`     | token/userInfo/menu/permissions/globals/licenseAuth/oauthMenu | ✅ 完成       | `store/modules/useUserStore.ts`      |
| —          | keep-alive 缓存                                               | ✅ Vue3 新增  | `store/modules/useKeepAliveStore.ts` |

### 0.15 Vue2 工具函数清单（16 个文件）

| Vue2 文件              | 主要函数                                                       | Vue3 实现状态             | Vue3 文件                      |
| ---------------------- | -------------------------------------------------------------- | ------------------------- | ------------------------------ |
| `request.js`           | axios 封装                                                     | ✅ 完成（HttpService 类） | `utils/http.ts`                |
| `auth.js`              | Token/UserInfo/isAdmin/idCardNum/licenseAuth                   | ✅ 完成                   | `utils/auth.ts`                |
| `permission.js`        | hasBtnPermission                                               | ✅ 改为 composable        | `composables/usePermission.ts` |
| `licenseUtils.js`      | getLicenseInfoUtil                                             | ✅ 改为 composable        | `composables/useLicense.ts`    |
| `menuRouteMapper.js`   | OAuth 菜单映射                                                 | ✅ 完成                   | `utils/menuRouteMapper.ts`     |
| `astrict.js`           | 会话超时                                                       | ✅ 改为 composable        | `composables/useStrict.ts`     |
| `clientEnv.js`         | CLIENT_TYPE + 浏览器/OS/屏幕信息                               | ✅ 完成                   | `utils/clientEnv.ts`           |
| `createDialog.js`      | 命令式弹窗                                                     | ✅ 完成                   | `utils/createDialog.ts`        |
| `crypto.js`            | AES 加解密                                                     | ✅ 完成                   | `utils/crypto.ts`              |
| `secure.js`            | 身份证加解密                                                   | ✅ 完成                   | `utils/secure.ts`              |
| `get-page-title.js`    | 页面标题                                                       | ✅ 完成                   | `utils/get-page-title.ts`      |
| `index.js`             | parseTime/formatTime/treeDataTranslate/deepCopy/getServiceFile | ✅ 完成                   | `utils/index.ts`               |
| `pageLoading.js`       | 同步进度轮询                                                   | ✅ 完成                   | `utils/pageLoading.ts`         |
| `passwordValidator.js` | 密码校验                                                       | ✅ 完成                   | `utils/passwordValidator.ts`   |
| `scrollTo.js`          | 平滑滚动                                                       | ✅ 完成                   | `utils/scrollTo.ts`            |
| `validate.js`          | isExternal/validUsername                                       | ✅ 完成                   | `utils/validate.ts`            |

### 0.16 Vue2 API 模块清单（22 个分类，56 个文件）

| API 分类                          | Vue2 文件数 | Vue3 实现状态         | Vue3 文件                                                                        |
| --------------------------------- | ----------- | --------------------- | -------------------------------------------------------------------------------- |
| `api/user.js`                     | 1           | ✅ 完成               | `api/user.ts`                                                                    |
| `api/license/index.js`            | 1           | ✅ 完成               | `api/license.ts`                                                                 |
| `api/oauth/menu.js`               | 1（Mock）   | ✅ 完成               | `api/oauth/menu.ts`                                                              |
| `api/permission/*`                | 6           | ✅ 完成               | `api/permission/menu.ts` + `role.ts` + `user.ts`                                 |
| `api/authority/*`                 | 2           | ❌ 未迁移             | —                                                                                |
| `api/dictionary/*`                | 2           | ✅ 部分完成           | `api/dictionary/globals.ts`                                                      |
| `api/equipment/*`                 | 2           | ❌ 未迁移             | —                                                                                |
| `api/facility/*`                  | 2           | ❌ 未迁移             | —                                                                                |
| `api/h5/*`                        | 9           | ✅ 部分完成           | `api/h5/collaboration.ts` + `coopLevel.ts` + `colFunctionManage.ts` + `quick.ts` |
| `api/mission/index.js`            | 1           | ❌ 未迁移             | —                                                                                |
| `api/nodeManage/*`                | 3           | ❌ 未迁移             | —                                                                                |
| `api/notification/alertPush.js`   | 1           | ❌ 未迁移             | —                                                                                |
| `api/policeExtend/virtualUser.js` | 1           | ❌ 未迁移             | —                                                                                |
| `api/policeReport/dock.js`        | 1           | ✅ 完成               | `api/policeReport/dock.ts`                                                       |
| `api/region/region.js`            | 1           | ❌ 未迁移             | —                                                                                |
| `api/resource/*`                  | 12          | ✅ 部分完成           | `api/resource/person.ts` + `role.ts` + `thirdApp.ts`                             |
| `api/shiftScheduling/*`           | 2           | ✅ 部分完成           | `api/shiftScheduling/dutyType.ts` + `index.ts`                                   |
| `api/statistic/index.js`          | 1           | ❌ 未迁移             | —                                                                                |
| `api/thirdInterface/*`            | 4           | ❌ 未迁移             | —                                                                                |
| `api/dataImport/dataImport.js`    | 1           | ❌ 未迁移             | —                                                                                |
| `api/mapConfig.js`                | 1           | ❌ 未迁移             | —                                                                                |
| `api/table.js`                    | 1           | ❌ 未迁移（模板示例） | —                                                                                |

### 0.17 Vue2 关键交互能力

| 能力           | Vue2 实现               | Vue3 实现状态    | 说明                                               |
| -------------- | ----------------------- | ---------------- | -------------------------------------------------- |
| 跨页选中池     | ProTable 内部 Map       | ✅ ProTable 支持 | Vue3 ProTable 通过 `reserve-selection` + `row-key` |
| 虚拟滚动复选框 | VirtualCheckboxList     | ❌ 未迁移        | 待 userManage 等模块需要时迁移                     |
| 虚拟滚动树     | VirtualTree（万级数据） | ❌ 未迁移        | 待 customDepartment 等模块需要时迁移               |
| 懒加载树       | SelectTreeLazy          | ✅ 完成          | 合并到 OrgTreeSelect                               |
| 文件上传弹窗   | Upload 组件             | ❌ 未迁移        | 待 mapConfig 等模块需要时迁移                      |
| 日历视图       | dutyInformation         | ✅ 完成          | DutyCalendar 组件                                  |
| 拖拽排序       | vuedraggable            | ❌ 未迁移        | 待 layoutConfig 等模块需要时迁移                   |
| Excel 导入导出 | xlsx 库                 | ✅ 完成          | 值班信息导入 + 协同岗记录导出（Blob 方式）         |
| 进度条         | nprogress               | ✅ 完成          | routerGuard 中使用                                 |
| 波纹效果       | v-waves                 | ✅ 完成          | directives/waves.ts                                |
| 下拉懒加载     | v-loadmore              | ✅ 完成          | directives/loadmore.ts                             |
| JSON 查看      | vue-json-viewer         | ❌ 未迁移        | 按需引入                                           |
| 拖拽分割线     | colLevelManage 手写     | ✅ 完成          | SplitDivider.vue 组件抽取                          |

### 0.18 总体迁移进度统计

| 维度       | Vue2 总数 | Vue3 已完成     | 完成率 |
| ---------- | --------- | --------------- | ------ |
| 路由模块   | 10        | 10               | 100%   |
| 子路由     | 31        | 27               | 87%    |
| 全局组件   | 17        | 10              | 59%    |
| Store 模块 | 3         | 4（+keepAlive） | 100%   |
| 工具函数   | 16        | 16              | 100%   |
| API 文件   | 56        | 23               | 41%    |
| 视图页面   | 31        | 25（含完整实现） | 81%    |

---

## 一、技术栈与项目架构（速览）

### 1.1 技术栈

| 维度     | Vue2 admin     | Vue3 admin                                                         |
| -------- | -------------- | ------------------------------------------------------------------ |
| 框架     | Vue 2.7        | Vue 3.4                                                            |
| API 风格 | Options API    | Composition API + `<script setup>`                                 |
| 类型     | 无             | TypeScript 严格模式                                                |
| UI 库    | Element UI 2.x | Element Plus 2.9                                                   |
| 状态管理 | Vuex 3         | Pinia（Setup Store）                                               |
| 路由     | Vue Router 3   | Vue Router 4                                                       |
| HTTP     | axios 封装     | `HttpService` 类封装 + AbortController                             |
| 构建     | Webpack 5      | Vite 5                                                             |
| i18n     | vue-i18n 8     | vue-i18n 10（`legacy: false` + `useI18n({ useScope: 'global' })`） |
| 样式     | SCSS           | Less                                                               |
| 代码规范 | .eslintrc      | flat config（eslint.config.mjs）                                   |

### 1.2 关键架构设计

#### 路由守卫流程（`router/routerGuard.ts`）

```
beforeEach → NProgress.start()
  → userStore.menu 为空时串行: getMenu → getPermissions → addRouterByPermissions
  → 并行加载 OAuth 菜单（开发环境）
  → 设置页面标题
  → Token 校验（白名单放行 / 重定向 login）
  → NProgress.done()
```

#### 权限过滤责任链（`router/filterChain.ts`）

```
FilterChain.use(LicenseFilter)      // 按 licenseAuth 过滤整路由
           .use(GlobalConfigFilter) // 按 globals（如 SHOW_331_FEATURE）过滤
           .use(UserAuthFilter)     // 按用户菜单权限过滤
           .use(MenuPermissionFilter)
```

#### HTTP 封装关键点（`utils/http.ts`）

- `HttpService` 类，`http.get/post/put/delete` 返回 `HttpResult<T>`（含 `abortFetch()`）
- 请求头注入：`applicationId: '1289822833455460000'`、`X-CloudCmd-AppKey: 'CDC-2000'`、`Authorization: 'token xxx'`
- 响应拦截：401 → 关闭弹窗 + resetToken + 跳 login；403 → 提示；其他错误 → `Promise.resolve(response.data)`（与 Vue2 一致：**不抛错**，业务层通过 code 判断）
- `HttpResult<T> = Promise<ApiResponse<T>> & { abortFetch: () => void }`

#### Store 设计（Pinia Setup Store）

- `useUserStore` — token/userInfo/buttons/menu/permissions/globals/licenseAuth/oauthMenu
- `useAppStore` — sidebar 开合 + device（mobile/desktop）
- `useSettingsStore` — 系统设置
- `useKeepAliveStore` — keep-alive 缓存视图

### 1.3 全局组件

| 组件                             | 路径                                 | 说明                                                                                             |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **ProTable**                     | `components/ProTable/index.vue`      | 配置式 columns + slot 自定义列 + 内置分页/多选/序号。支持 `indexLabel`/`indexWidth` 自定义序号列 |
| **SearchBar**                    | `components/SearchBar/index.vue`     | 搜索栏，支持 `#filters` 具名插槽 + `actions` 数组（新增/批量删除/导出）                          |
| **Pagination**                   | `components/Pagination/index.vue`    | el-pagination 封装                                                                               |
| **OrgTreeSelect**                | `components/OrgTreeSelect/index.vue` | 组织树选择器，自动按 `localStorage.globalConfig.DEPARTMENT_SYNC_SIGN` 切换同步/懒加载            |
| **AuthImg**                      | `components/AuthImg/index.vue`       | XHR + blob 鉴权图片（token 注入 Authorization header）                                           |
| **PasswordInput**                | `components/PasswordInput/index.vue` | 密码输入框（禁复制粘贴）                                                                         |
| **SvgIcon/Breadcrumb/Hamburger** | —                                    | 基础组件                                                                                         |

### 1.4 自定义指令

- `v-loadmore` — el-select 下拉触底加载更多（`directives/loadmore.ts`）
- `v-waves` — 点击波纹（`directives/waves.ts`）

### 1.5 工具函数

- `pageLoadingUtils`（`utils/pageLoading.ts`）— 同步进度轮询：`openPageLoading(callback)` 调 `getProcess` 接口轮询，完成时 callback + 关闭全屏 loading
- `crypto.ts` / `secure.ts` — AES 加解密 / 身份证加解密
- `auth.ts` — getToken/setToken/isAdmin/userId/idCardNum
- `menuRouteMapper.ts` — OAuth 菜单到路由的映射

### 1.6 样式系统

- `styles/variables.less` — 设计令牌（主色 #264ed1、侧边栏 #1a2332、间距/字号/圆角）
- `styles/element-plus.less` — Element Plus 主题变量覆盖
- `styles/reset.less` — `.app-container { padding: 16px }`、`.card { 双层阴影 }`
- `styles/sidebar.less` — `.app-wrapper` / `.main-container` 布局

### 1.7 关键差异：响应结构

后端接口有两种返回结构，**必须在 API 包装层显式声明**：

| 接口类型               | 响应结构                                                                    | 取值方式                                                                                    |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 标准包装               | `{ code, msg, data }`                                                       | `res.data`                                                                                  |
| 分页包装               | `{ code, msg, data: { records, total } }`                                   | `res.data.records`                                                                          |
| **特殊：直接业务字段** | `{ records, total }`（无 code/data 包装）                                   | `res.records`（如 `getCollaborationPage`、`getCollaborationEditPage`、`getAttendancePage`） |
| 层级/职能 children     | `{ code, data: [...] }`                                                     | `res.data`                                                                                  |
| 层级/职能 members      | `{ code, data: { records, total } }` 或 `{ code, data: [...] }`（兼容两种） | `res.data?.records ?? res.data ?? []`                                                       |

---

## 二、模块迁移进度总览

### 2.1 已完成模块

| 模块                  | 路由                                           | 完成日期   | 状态    | 说明                                                            |
| --------------------- | ---------------------------------------------- | ---------- | ------- | --------------------------------------------------------------- |
| **基础设施**          | —                                              | 2026-07    | ✅ 完成 | http/auth/crypto/store/router/i18n/styles 全部就位              |
| **Layout**            | —                                              | 2026-07    | ✅ 完成 | Sidebar + Navbar + AppMain                                      |
| **登录**              | `/login`                                       | 2026-07    | ✅ 完成 | 账号密码 + 记住密码 + License 提示                              |
| **Dashboard**         | `/dashboard`                                   | 2026-07    | ✅ 完成 | 欢迎页                                                          |
| **权限中心**          | `/authority/auth`、`/authority/person`         | 2026-07    | ✅ 完成 | 角色 + 人员管理                                                 |
| **值班信息**          | `/scheduling/dutyInformation`                  | 2026-07    | ✅ 完成 | 双视图（日历+列表）+ 文件导入 + 模板导出 + 排班类型下拉滚动加载 |
| **基础数据-全局配置** | `/baseData/globals`                            | 2026-07    | ✅ 完成 | globalsConfig 弹窗表单宽度自适应                                |
| **基础数据-三方应用** | `/baseData/thirdParty`                         | 2026-07    | ✅ 完成 | 列表 + 详情 + 编辑                                              |
| **H5 协同岗阶段 1**   | `/collaboration/index`、`/collaboration/quick` | 2026-07-23 | ✅ 完成 | colManage + colEditRecord + colOnOffRecord + quick 标签管理     |
| **H5 协同岗阶段 2**   | `/collaboration/index`（tab 2/5）              | 2026-07-23 | ✅ 完成 | colLevelManage + colFunctionManage（双 tab）+ 通用组件抽取      |
| **H5 管理**           | `/h5/carousel`、`/h5/ArchivedTable`           | 2026-07-24 | ✅ 完成 | 轮播图管理（图片上传+公众号/文章联动）+ 已归档群组（下载进度条+同步） |
| **权限中心（完整）**  | `/authority/*`（10 个子路由）                  | 2026-07-24 | ✅ 完成 | auth+person 已有 + 新增 8 个：adminPermission/imPermission/imRole/imPerson/adminRole/adminPerson/userManage/customDepartment |

### 2.2 待迁移模块

| 优先级 | 模块         | 路由                                                                 | 复杂度 | 说明                    |
| ------ | ------------ | -------------------------------------------------------------------- | ------ | ----------------------- |
| P3     | 节点管理     | `/nodeManage/*`                                                      | 中     | 客户端/服务端/数据管理  |
| P3     | 三方对接     | `/thirdParty/*`                                                      | 中     | AI Agent/南向/警单/通信 |
| P3     | 预警推送     | `/notification/alertPush`                                            | 中     | 定时任务                |
| P4     | 权限中心剩余 | `/authority/im*`、`/authority/admin*`、`/authority/customDepartment` | 低     | 生产隐藏路由            |
| P4     | 地图配置     | `/baseData/mapConfig`                                                | 中     | 地图编辑+上传           |
| P4     | 位置管理     | `/location/location`                                                 | 低     | 简单 CRUD               |
| P4     | 布局配置     | `/baseData/layoutConfig`                                             | 中     | 仅 admin 可见           |
| P4     | 警信扩展     | `/policeExtend/virtualUser`                                          | 低     | 虚拟用户 CRUD           |

---

## 三、协同岗模块（核心，已完成）

### 3.1 模块全景

**入口**：`views/collaboration/index.vue` — 5 个 tab 容器

**tab 顺序（与 Vue2 admin 一致）**：

1. 协同岗管理（name=`1`）→ `ColManage`
2. 协同岗层级管理（name=`2`，受 `SHOW_331_FEATURE` 全局开关控制）→ `ColLevelManage`
3. 职能部门管理（name=`5`）→ `ColFunctionManage`（双 tab：职能管理 + 默认协同岗）
4. 协同岗编辑记录（name=`3`）→ `ColEditRecord`
5. 协同岗上下岗记录（name=`4`）→ `ColOnOffRecord`

**tab 加载策略**：`v-if="activeName === 'x'"` 按需加载，切换时销毁

**index.vue 关键逻辑**：

- `onMounted`：fetchGlobalsList（SHOW_331_FEATURE）→ readDepartmentSyncSign → getUserOrgNameByIdCardNum（非 admin）→ computeOrgIds
- `onBeforeUnmount`：`pageLoadingUtils.closePageLoading()` 防泄漏
- 容器样式 `.collaboration-wrap`：flex 撑满 app-main，链式 `flex: 1 + min-height: 0 + overflow: hidden` 让 `el-card__body` / `el-tabs__content` / `el-tab-pane` 都撑满

### 3.2 API 层

| 文件                          | 路径 | 接口数 | 关键说明                                                              |
| ----------------------------- | ---- | ------ | --------------------------------------------------------------------- |
| `api/h5/collaboration.ts`     | —    | 22     | `getCollaborationPage` 返回 `{records, total}` 直接结构；其他标准包装 |
| `api/h5/coopLevel.ts`         | —    | 8      | 协同岗层级 CRUD + 成员挂靠/解绑                                       |
| `api/h5/colFunctionManage.ts` | —    | 11     | 职能分类 CRUD + 默认协同岗 + 默认勾选开关                             |
| `api/h5/quick.ts`             | —    | 7      | 标签 CRUD + 绑定用户                                                  |
| `api/policeReport/dock.ts`    | —    | 1      | `getPolicetickettypes` 警单类型列表                                   |

### 3.3 组件清单

#### 协同岗管理（tab 1）

| 组件                           | 路径                 | 职责                                                                                                                                                                                                     |
| ------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colManage.vue`                | views/collaboration/ | 主页面，ProTable 13 列 + 操作（修改/删除/下岗）                                                                                                                                                          |
| `components/ColSearch.vue`     | —                    | 搜索栏，**基于 SearchBar 封装**，`#filters` 插槽渲染 4 字段，`actions` 数组按 isMain 切换新增/批量删除/导出                                                                                              |
| `components/ColForm.vue`       | —                    | 新增/修改弹窗，图标上传（uploadColTmp FormData）+ OrgTreeSelect + 关联人员（queryUserByPage + v-loadmore）+ 警单类型（getPolicetickettypes）+ license 控制（AICollaborationAuth 控制人员核查协同岗选项） |
| `components/OffDutyDialog.vue` | —                    | 下岗弹窗，getOnDutyUsersByPostId + getLastNum（最后一人二次确认）+ offDutyUser（switchType=3 管理员）                                                                                                    |

#### 协同岗层级管理（tab 2）

| 组件                            | 路径                 | 职责                                                                                                            |
| ------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `colLevelManage.vue`            | views/collaboration/ | 薄包装：左树+分割线+右表格                                                                                      |
| `components/CoopLevelTree.vue`  | —                    | 左侧树面板（**两模块共用**，通过 `businessName: 'level' \| 'function'` 切换文案 + props 注入 API 实现依赖反转） |
| `components/SplitDivider.vue`   | —                    | 拖拽分割线（手写 mousedown/mousemove/mouseup + v-model）                                                        |
| `components/CoopNodeDialog.vue` | —                    | 层级/职能新增编辑弹窗（两模块共用，通过 `title`/`nameLabel`/`onSubmit` props 注入业务逻辑）                     |
| `components/CoopBindDialog.vue` | —                    | 挂靠协同岗弹窗（支持 bind/default 双模式，通过 `fetchList`/`submit`/`beforeOpenDefault` props 注入）            |

**CoopLevelTree 依赖反转设计**：

```typescript
props: {
  businessName: 'level' | 'function'; // 切换文案
  (fetchChildren, createNode, updateNode, deleteNode, onSubmit); // 注入 API
}
emits: {
  ('node-click', 'node-deleted');
}
```

**层级深度限制**：maxDepth=5（父节点 level >= 5 时禁止创建子节点）

#### 职能部门管理（tab 3）

| 组件                               | 路径                 | 职责                                                                                                                                                         |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `colFunctionManage.vue`            | views/collaboration/ | 双 tab 容器（el-tabs），tab2 懒加载                                                                                                                          |
| `components/ColFunctionTab.vue`    | —                    | tab1 职能管理（**可独立成菜单**）：复用 CoopLevelTree + SplitDivider + CoopBindDialog + ProTable（多一列"默认勾选"开关，调 `checkedFunctionaldeptsMembers`） |
| `components/ColDefaultCoopTab.vue` | —                    | tab2 默认协同岗（**可独立成菜单**）：ProTable + 设置默认协同岗弹窗（递归拉取全量已存在项 `getAllFetchDefaultMembers` 标记 disabled）                         |

**职能与层级的差异**：

| 维度           | 层级（coopLevel）                                         | 职能（functionaldepts）                                                                                 |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| API 前缀       | `/collaboration/cooplevels`                               | `/collaboration/v1/functionaldepts`                                                                     |
| create 入参    | `{ name, parentId }`                                      | `{ name, parentId, creator }`（多了 creator）                                                           |
| 挂靠接口       | `updateCoopLevelMembers(levelId, postIds)` uid 字符串数组 | `updateFunctionaldeptsMembers(levelId, selecteds)` 对象数组 `{userId, checked, sort, creator, updater}` |
| 删除接口       | `deleteCoopLevelMembers([uid])` 字符串数组                | `deleteFunctionaldeptsMembers([{id, postName, departmentName}])` 对象数组                               |
| 默认勾选       | 无                                                        | 有（el-switch + `checkedFunctionaldeptsMembers`）                                                       |
| 默认协同岗 tab | 无                                                        | 有（独立的 `default/coop` 表，与职能无关联）                                                            |

#### 编辑记录（tab 4）+ 上下岗记录（tab 5）

| 组件                 | 路径                 | 职责                                                                                                                   |
| -------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `colEditRecord.vue`  | views/collaboration/ | ProTable 7 列 + `getOperationTypeName`（0=新增/1=修改/2=删除）+ Blob 导出                                              |
| `colOnOffRecord.vue` | views/collaboration/ | ProTable 8 列 + `getSwitchTypeName`（0=手工/1=IM/2=值班/3=管理员）+ `relatedUserNames→personName` 字段映射 + Blob 导出 |

两者都复用 `ColSearch`（`isMain=false`）→ 显示导出按钮

#### 标签管理（quick）

| 组件                    | 路径 | 职责                                                                                            |
| ----------------------- | ---- | ----------------------------------------------------------------------------------------------- |
| `views/quick/index.vue` | —    | 2 个 tab（标签查看 el-table + 标签编辑 el-tree），labelSave 复用新增/修改，license 控制 typeArr |

### 3.4 ProTable 序号列约定

Vue2 admin 中所有表格的序号列为 `label="序号" width="100"`。Vue3 中 ProTable 默认 `label="#" width="60"`，业务方可通过 props 覆盖：

```vue
<ProTable show-index index-label="序号" :index-width="100" />
```

**当前使用 show-index 的页面**（都已对齐 Vue2）：

- `colLevelManage.vue`
- `ColFunctionTab.vue`
- `ColDefaultCoopTab.vue`

### 3.5 colManage 同步状态查询（补齐）

- `getImSyncStatusFunc` — mounted 时调用 `getImSyncStatus`，控制 `hiddenSync` 状态
- `syncPostFromImFunc` — 调 `syncPostFromIm` + `pageLoadingUtils.openPageLoading(callback)` 轮询
- `ColSearch` 透传 `:hidden-sync` `:sync-loading`，绑定 `@sync`
- Vue2 中同步按钮 `v-show="isMain && !hiddenSync && false"` 永久隐藏，Vue3 保持一致

---

## 四、值班信息模块（已完成）

### 4.1 模块结构

**入口**：`views/shiftScheduling/dutyInformation/index.vue` — 双视图容器

**子组件**：

| 组件                     | 职责                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| `DutySearchBar.vue`      | 搜索栏（含排班类型下拉滚动加载 `v-loadmore`）+ el-upload 文件导入 |
| `DutyCalendar.vue`       | 日历视图（只负责网格渲染，月份导航在主页面）                      |
| `ImportResultDialog.vue` | 导入结果弹窗（`formatErrorHtml` + `dangerouslyUseHTMLString`）    |

### 4.2 关键 bug 修复记录

1. **列表数据不显示** → `getSchedulePage` 返回 `{records, total}` 直接结构，改为 `res.records` 而非 `res.data.records`
2. **日历视图不能切换** → 月份导航 + 视图切换按钮从 DutyCalendar 提到 index.vue 的 `.view-toolbar`
3. **日历只有星期标题** → DutyCalendar 内部添加 `onMounted(() => getMonthDayDate())`（v-if 延迟挂载导致初始化时机错误）
4. **ProTable 暂无数据图标没对齐** → `.pro-table__empty` 改为 `flex 列布局居中`

---

## 五、关键约束与注意事项

### 5.1 与 Vue2 admin 的一致性原则

1. **交互、页面逻辑、页面 URL 完全跟 Vue2 admin 一致**（用户多次强调的核心要求）
2. **表格统一用 ProTable**（用户明确要求）
3. **每个模块先研究完整逻辑再编码**，考虑组件复用/拆分（避免单文件巨石）
4. **tab 顺序与 Vue2 完全一致**（如协同岗 1→2→5→3→4）
5. **响应结构差异必须显式处理**（直接 `{records, total}` vs 包装 `{code, data}`）
6. **license 控制点对齐 Vue2**（如 AICollaborationAuth 控制 ColForm 人员核查协同岗选项）

### 5.2 组件复用清单（已抽取的通用组件）

| 组件             | 复用场景                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| ProTable         | 所有列表页（colManage/colEditRecord/colOnOffRecord/colLevelManage/ColFunctionTab/ColDefaultCoopTab） |
| SearchBar        | ColSearch 内部使用（4 字段 + actions）                                                               |
| ColSearch        | colManage/colEditRecord/colOnOffRecord 三个列表页共用                                                |
| CoopLevelTree    | colLevelManage + ColFunctionTab（通过 businessName 切换）                                            |
| SplitDivider     | colLevelManage + ColFunctionTab                                                                      |
| CoopNodeDialog   | CoopLevelTree 内部使用                                                                               |
| CoopBindDialog   | colLevelManage + ColFunctionTab + ColDefaultCoopTab（bind/default 双模式）                           |
| OrgTreeSelect    | ColSearch + ColForm                                                                                  |
| AuthImg          | colManage 图标列                                                                                     |
| pageLoadingUtils | colManage 同步 + 值班信息导入                                                                        |

### 5.3 ProTable slot scope 的 TS 类型问题

ProTable 的 slot props 类型推断不完善，业务代码需用 helper 函数安全获取 row：

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRow(scope: any): BusinessType {
  return (scope?.row as BusinessType) ?? ({} as BusinessType);
}
```

模板中：`<template #action="scope"><el-button @click="handle(getRow(scope))" /></template>`

### 5.4 AppMain 高度撑满

`layout/components/AppMain.vue` 的 `.app-main` 使用 `height: calc(100vh - 50px)`（不是 `min-height`），让子组件的 `height: 100%` 链路生效。padding 由各页面的 `.app-container` 自行管理（默认 16px）。

### 5.5 ESLint 已知误报

项目 ESLint 规则对 TypeScript 类型声明（`defineProps`/`defineEmits`/`interface` 字段）有 `no-unused-vars` 误报，colManage.vue 阶段 1 同样存在（如 `pageLoadingUtils`、`syncLoading` 报未使用）。这些是配置问题，非业务 bug。新文件中类型声明较多的可用 `/* eslint-disable @typescript-eslint/no-unused-vars */` 临时豁免。

### 5.6 浏览器全局变量未定义

ESLint 配置缺少 `browser` env，导致 `localStorage`/`document`/`window`/`Blob`/`MouseEvent` 等报 `no-undef`。临时方案：文件顶部加 `/* global localStorage, document */` 注释。阶段 1 文件（colEditRecord.vue 等）也有同样问题。

### 5.7 i18n 使用约定

- `useI18n({ useScope: 'global' })` 取 `t`
- 协同岗模块文案：阶段 1 抽到 `index.collaboration.*` 命名空间（19 个 key）
- 阶段 2（colLevelManage/colFunctionManage）：Vue2 中全是硬编码中文，Vue3 保持一致（未抽 i18n）
- 通用文案：`index.determine`/`index.cancel`/`index.delete`/`index.operations.*`

---

## 六、对话历史与决策记录

### 6.1 关键决策

| 日期       | 决策                                                         | 理由                                       |
| ---------- | ------------------------------------------------------------ | ------------------------------------------ |
| 2026-07    | 技术栈选 Vue3 + Element Plus + Pinia + Vite + TS             | 与 web/agent/web 对齐                      |
| 2026-07    | 责任链模式拆分权限过滤                                       | 替代 Vue2 的 addRouterByPermissions        |
| 2026-07    | `HttpService` 类封装 + `abortFetch`                          | 支持 401 取消请求                          |
| 2026-07-22 | 协同岗分两阶段迁移                                           | 阶段 1 核心 + 阶段 2 层级/职能             |
| 2026-07-23 | CoopLevelTree 用依赖反转（props 注入 API）                   | 让层级/职能两模块共用一个树组件            |
| 2026-07-23 | ColFunctionManage 拆分为 ColFunctionTab + ColDefaultCoopTab  | 满足"每个 tab 可独立成菜单"要求            |
| 2026-07-23 | ProTable 扩展 `indexLabel`/`indexWidth`                      | 与 Vue2 的 `label="序号" width="100"` 对齐 |
| 2026-07-23 | ColSearch 重构为基于 SearchBar 封装                          | 统一搜索栏组件                             |
| 2026-07-23 | AppMain 改用 `height` 而非 `min-height`                      | 让子组件 `height: 100%` 生效               |
| 2026-07-24 | 新增 useFetch / useTable composables                         | 通用请求管理 + 表格逻辑封装                |
| 2026-07-24 | ProTable 新增远程模式（fetchApi + searchParams + @response） | 替代父组件的 list/loading/getList 样板代码 |
| 2026-07-24 | ProTable 新增 `defaultTableFormatter` 默认格式化器           | 兼容 4 种后端响应结构                      |
| 2026-07-24 | DESIGN.md 颜色规范落地 + 全局 size="large"                   | 视觉重设计（color-block first + 主色光晕） |
| 2026-07-24 | colManage.vue 改造为 ProTable 远程模式受控 demo              | 验证方案可行性，后续推广到所有表格         |

### 6.2 已解决的复杂 bug

1. **值班信息列表数据不显示** — 后端直接返回 `{records, total}` 不在 data 字段下
2. **日历视图不切换** — DutyCalendar 用 v-if 包裹导致按钮不存在
3. **日历只有星期标题** — v-if 延迟挂载导致 `onMounted` 时机错误
4. **ProTable 空状态图标不对齐** — flex 布局修复
5. **全局配置弹窗表单固定宽度** — 改为 100% + box-sizing
6. **TS emit 返回值问题** — Vue3 emit 不能返回 Promise，改用 props 回调（`onSubmit`）替代 emit
7. **el-tree Node 类型不兼容** — Element Plus 内部 Node 类型与自定义 TreeNodeInstance 不匹配，用 `as unknown as` 中转
8. **ProTable slot scope.row 类型推断失败** — 用 `getRow(scope)` helper 函数
9. **less 变量未注入到 scoped style** — vite.config.mts 添加 `additionalData: @import "@/styles/variables.less"`
10. **less :export 缺 default 导出** — 改为 `import * as variables from '*.less'`，同步修改 global.d.ts 类型声明
11. **菜单显示不完整（位置/预警/警信扩展/多节点管理不显示）** — `filterChain.ts` 的 `moduleRoutes` 数组只注册了 6 个路由模块，遗漏了 location/alert/policeExtend/nodeManage 4 个。新建对应路由模块文件并加入 moduleRoutes 后修复
12. **LicenseFilter 'Location' 误判** — 旧实现把 'Location' 当父级名排除，但 locationRouter 父级 name 是小写 'location'，导致 groupCollaborationAuth license 下 Location 子路由未被正确过滤。改为把 'Location' 加入 `excludeChildNames` 子级过滤，与旧 Vue2 admin 行为对齐

---

## 九、Composables Hooks 清单（2026-07-24 新增）

### 9.1 useFetch（通用请求 hooks）

**路径**：`src/composables/useFetch.ts`

**职责**：封装异步请求的 loading/data/error 三态管理，内置 AbortController 竞态取消、防抖/节流、轮询、重试、乐观更新。

**API**：

| 选项               | 类型                               | 默认    | 说明                 |
| ------------------ | ---------------------------------- | ------- | -------------------- |
| `fetchFn`          | `(...args) => Promise<TData>`      | 必填    | 请求函数             |
| `immediate`        | `boolean`                          | `false` | 是否立即执行         |
| `defaultParams`    | `TParams`                          | -       | 默认参数             |
| `abortPrevious`    | `boolean`                          | `true`  | 自动取消上一次请求   |
| `watch`            | `WatchSource`                      | -       | 监听响应式源自动触发 |
| `pollingInterval`  | `number`                           | `0`     | 轮询间隔（ms）       |
| `debounceInterval` | `number`                           | `0`     | 防抖间隔（ms）       |
| `retryCount`       | `number`                           | `0`     | 重试次数             |
| `onSuccess`        | `(data, params) => void`           | -       | 成功回调             |
| `onError`          | `(error, params) => boolean\|void` | -       | 错误回调             |

**返回**：`{ data, loading, error, params, fetch, refresh, reset, cancel, mutate }`

**使用示例**：

```typescript
const { data, loading, fetch } = useFetch({
  fetchFn: (params) => getUserList(params),
  immediate: true,
  defaultParams: [{ pageNum: 1, pageSize: 10 }],
});
```

### 9.2 useTable（表格专用 hooks）

**路径**：`src/composables/useTable.ts`

**职责**：基于 useFetch 封装表格分页 / 搜索 / 刷新 / 选择通用逻辑。适用于不用 ProTable 的场景（如自定义 el-table）。

**API**：

| 选项                | 类型                       | 默认         | 说明                     |
| ------------------- | -------------------------- | ------------ | ------------------------ |
| `fetchApi`          | `(params) => Promise<any>` | 必填         | 列表请求 API             |
| `query`             | `TQuery`                   | 必填         | 查询参数对象（reactive） |
| `defaultPage`       | `number`                   | `1`          | 初始页码                 |
| `defaultPageSize`   | `number`                   | `10`         | 初始每页条数             |
| `pageNumField`      | `string`                   | `'pageNum'`  | 分页字段名               |
| `pageSizeField`     | `string`                   | `'pageSize'` | 分页字段名               |
| `transformItem`     | `(item) => TItem`          | -            | 单条数据转换             |
| `resetPageOnSearch` | `boolean`                  | `true`       | 搜索时重置页码           |
| `immediate`         | `boolean`                  | `true`       | 是否立即加载             |

**返回**：`{ data, loading, total, page, limit, pageSizes, search, refresh, reset, changePage, setQuery, selectedRows, selectedIds, onSelectionChange, clearSelection, cancel, mutate, readonlyQuery, lastParams }`

**使用示例**：

```typescript
const { data, loading, total, page, limit, pageSizes, search, refresh, onSelectionChange } = useTable({
  fetchApi: getCollaborationPage,
  query: reactive({ postName: '', orgId: '' }),
});
```

### 9.3 ProTable 远程模式（推荐用法）

**路径**：`src/components/ProTable/index.vue`

**三种模式**：

| 模式       | 触发条件                   | 数据来源                                                  | 适用场景      |
| ---------- | -------------------------- | --------------------------------------------------------- | ------------- |
| 展示模式   | 仅传 `data`                | 父组件                                                    | 简单静态数据  |
| 纯远程模式 | 仅传 `fetchApi`            | ProTable 内部（默认格式化器）                             | 标准 CRUD     |
| 受控模式   | 同时传 `data` + `fetchApi` | 父组件（data 优先），fetchApi 触发后通过 `@response` 回调 | 字段映射/过滤 |

**新增 Props**：

| Prop                    | 类型                       | 默认         | 说明                   |
| ----------------------- | -------------------------- | ------------ | ---------------------- |
| `fetchApi`              | `(params) => Promise<any>` | -            | 远程数据 API           |
| `searchParams`          | `Record<string, any>`      | -            | 搜索参数（响应式对象） |
| `immediate`             | `boolean`                  | `true`       | 是否首次自动加载       |
| `autoFetchOnPagination` | `boolean`                  | `true`       | 分页变化是否自动请求   |
| `pageNumField`          | `string`                   | `'pageNum'`  | 分页字段名             |
| `pageSizeField`         | `string`                   | `'pageSize'` | 分页字段名             |

**新增 Emits**：

| 事件             | 参数                 | 说明                                      |
| ---------------- | -------------------- | ----------------------------------------- |
| `response`       | `(response, params)` | fetchApi 完整响应（受控模式下父组件处理） |
| `response-error` | `(error, params)`    | fetchApi 失败                             |
| `loading-change` | `(loading)`          | loading 状态变化                          |

**Expose 方法**：

| 方法                     | 说明                                     |
| ------------------------ | ---------------------------------------- |
| `init()`                 | 重置到第 1 页 + 用最新 searchParams 请求 |
| `refresh()`              | 保持当前页 + 参数重新请求                |
| `fetchPage(page, limit)` | 手动触发指定页码请求                     |
| `cancelFetch()`          | 取消当前未完成请求                       |
| `mutate(newData)`        | 乐观更新内部数据                         |
| `getSelection()`         | 获取当前选中行                           |
| `clearSelection()`       | 清空选中                                 |

**默认格式化器**：`src/components/ProTable/formatter.ts`

兼容 4 种后端响应结构：

1. `{ code, data: { records, total } }` — 标准分页
2. `{ records, total }` — 直接分页
3. `{ code, data: [...] }` — 标准数组
4. `[...]` — 直接数组

### 9.4 改造前后对比（colManage.vue）

**改造前**（~80 行样板）：

```typescript
const list = ref([]);
const loading = ref(true);
const total = ref(0);
const queryParams = reactive({ pageNum: 1, pageSize: 10 });
const filterQuery = ref({});

async function getList(query?) {
  if (query) filterQuery.value = { ...query };
  const params = { ...filterQuery.value, ...queryParams };
  loading.value = true;
  try {
    const res = await getCollaborationPage(params);
    // 字段映射
    list.value = res.records;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function handleQuery(params) {
  queryParams.pageNum = 1;
  getList(params);
}
function handleReset() {
  queryParams.pageNum = 1;
  filterQuery.value = {};
  getList();
}
function handlePagination({ page, limit }) {
  queryParams.pageNum = page;
  queryParams.pageSize = limit;
  getList();
}

getList();
```

**改造后**（~30 行）：

```typescript
const list = ref([]);
const total = ref(0);
const searchParams = reactive({});
const tableRef = ref();

function handleResponse(res) {
  const records = defaultTableFormatter.getRecords(res);
  records.forEach((item) => {
    /* 字段映射 */
  });
  list.value = records;
  total.value = defaultTableFormatter.getTotal(res);
}

function handleQuery(params) {
  Object.assign(searchParams, params);
  tableRef.value?.init();
}

function handleReset() {
  Object.keys(searchParams).forEach((key) => delete searchParams[key]);
  tableRef.value?.init();
}
```

**节省**：~50 行样板代码，分页/竞态/loading/请求取消全部由 ProTable 内部管理。

### 9.4 已改造为 ProTable 远程模式的页面清单

| 页面                                                   | 模式       | 特性要点                                                                                              |
| ------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `views/collaboration/colManage.vue`                    | 受控模式   | 首批 demo，字段映射（operationType→operationTypeName 等）                                             |
| `views/authority/auth/index.vue`                       | 受控模式   | 单字段搜索（name），searchParams 拆分                                                                 |
| `views/authority/person/index.vue`                     | 受控模式   | 多字段搜索（name/idCard/org）+ 组织树联动 + 多选 + immediate=false（非 admin 预加载部门）             |
| `views/collaboration/colLevelManage.vue`               | 受控模式   | 双 API 切换（fetchMembersApi 根据搜索条件动态选择 getCoopLevelMembers / getCoopLevelMembersBySearch） |
| `views/collaboration/components/ColFunctionTab.vue`    | 纯远程模式 | fetchApi 包装提取 levelId，immediate=false                                                            |
| `views/collaboration/components/ColDefaultCoopTab.vue` | 受控模式   | fetchApi 直接传 pageDefaultCoop，defineExpose 改 refresh/init                                         |
| `views/collaboration/colEditRecord.vue`                | 受控模式   | 响应字段映射 operationType→operationTypeName                                                          |
| `views/collaboration/colOnOffRecord.vue`               | 受控模式   | 入参字段映射 relatedUserNames→personName                                                              |
| `views/baseData/thirdParty/index.vue`                  | 受控模式   | 序号列 slot 保留                                                                                      |
| `views/shiftScheduling/dutyInformation/index.vue`      | 受控模式   | 日历/列表双视图，list 走 ProTable，calendar 保留独立 fetchCalendarData                                |

**未改造（保持展示模式）**：

| 页面                               | 原因                                              |
| ---------------------------------- | ------------------------------------------------- |
| `views/baseData/globals/index.vue` | 无分页场景，BLACK_LIST 过滤逻辑保留在父组件更直观 |

---

## 七、下次对话快速接入指南

### 7.1 查看当前进度

1. 先读本文件「二、模块迁移进度总览」
2. 查看「三、协同岗模块」和「四、值班信息模块」的详细逻辑
3. 运行 `cd docs-local/admin-vue3 && npm run lint:ts && npm run lint:prettier` 验证当前代码状态

### 7.2 开始新模块迁移的流程

1. **研究 Vue2 源码**：用 Task subagent_type=search 完整研究模块所有逻辑细节
2. **梳理交互逻辑**：组件复用分析 + 组件拆分建议
3. **制定 todo**：用 TodoWrite 拆分任务
4. **实施**：API 层 → 通用组件 → 页面 → 路由接入 → i18n
5. **验证**：`npm run lint:ts` + `npm run lint:prettier` + `npm run lint:eslint`
6. **更新本文档**：在「二、模块迁移进度总览」标记完成 + 补充模块细节到对应章节

### 7.3 待办事项（短期）

- [ ] 协同岗阶段 2 的 ColFunctionTab / ColDefaultCoopTab 未来若要拆为独立菜单，只需在 `router/modules/collaboration.ts` 增加路由，组件零改动
- [ ] 评估是否需要修复 ESLint 配置（添加 `env: { browser: true }` 或在 flat config 中声明 globals）以消除 `no-undef` 误报
- [ ] 评估是否需要修复 ESLint 对 TS 类型声明 `no-unused-vars` 的误报（配置 `@typescript-eslint/no-unused-vars` 替代 `no-unused-vars`）

### 7.4 关键文件快速索引

| 文件                                                    | 用途                                     |
| ------------------------------------------------------- | ---------------------------------------- |
| `src/views/collaboration/index.vue`                     | 协同岗 5 tab 容器                        |
| `src/views/collaboration/colManage.vue`                 | 协同岗管理主页面                         |
| `src/views/collaboration/components/ColSearch.vue`      | 基于 SearchBar 的搜索栏                  |
| `src/views/collaboration/components/CoopLevelTree.vue`  | 依赖反转的树组件                         |
| `src/views/collaboration/components/CoopBindDialog.vue` | bind/default 双模式弹窗                  |
| `src/components/ProTable/index.vue`                     | 配置式表格（支持 indexLabel/indexWidth） |
| `src/components/SearchBar/index.vue`                    | 搜索栏（#filters 插槽 + actions）        |
| `src/utils/http.ts`                                     | HTTP 封装                                |
| `src/utils/pageLoading.ts`                              | 同步进度轮询                             |
| `src/router/filterChain.ts`                             | 权限过滤责任链                           |
| `src/layout/components/AppMain.vue`                     | height: calc(100vh - 50px) 撑满          |

---

## 八、文档维护约定

**每次对话完成代码修改后，必须更新本文档**：

1. **「二、模块迁移进度总览」**：标记完成日期 + 状态
2. **对应模块章节**（三/四/...）：补充组件清单、API 清单、关键逻辑、bug 修复记录
3. **「六、对话历史与决策记录」**：记录本次对话的关键决策
4. **「七.3 待办事项」**：更新未完成事项
5. 更新文档顶部的 `最后更新` 日期
