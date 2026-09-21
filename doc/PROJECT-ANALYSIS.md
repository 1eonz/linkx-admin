# linkx-admin 项目现状分析

> 分析日期：2026-09-21  
> 项目定位：警务协同后台管理系统  
> 当前技术栈：Vue 2.6、Vue Router 3、Vuex 3、Element UI、Axios、Vue CLI 3、Webpack 4

## 1. 结论摘要

linkx-admin 是一个以后台管理壳层为核心、按业务域组织页面和 API 的管理端应用。系统当前的核心链路为：

```text
浏览器启动
  -> main.js 初始化 Vue / Element UI / i18n / Vuex / 路由 / 全局组件
  -> permission.js 注册路由守卫
  -> 读取 localStorage token
  -> 首次访问业务页时获取 globals、角色权限、菜单
  -> 根据菜单、按钮权限、License、全局开关和管理员特例过滤路由
  -> 动态 addRoutes
  -> Layout 渲染 Sidebar/Navbar/AppMain
  -> 业务页面调用 src/api 下的接口完成 CRUD、树选择、上传、导出和授权
```

当前系统不是单一的 RBAC，而是多层权限叠加：

1. 登录令牌权限：`localStorage` 中的 access token。
2. 菜单权限：后端菜单树与 `permissions.menus` 共同决定动态路由。
3. 按钮权限：`permissions.actions` 形成按钮权限集合，通过 `hasPerm()` 判断。
4. 管理员权限：`is_admin`、特定用户 ID、生产环境隐藏规则。
5. License 权限：群组协同、任务协同、业务协同、AI 协同、北向数据接口。
6. 全局开关：车辆、边缘网关、自定义图层、排班等功能开关。
7. 业务数据权限：组织、人员、警员、摄像机、部门和协同范围等数据权限。

## 2. 代码规模和模块盘点

| 区域 | 当前规模/内容 |
| --- | --- |
| 页面与页面级组件 | `src/views` 共约 154 个 `.vue` 文件 |
| 全局组件 | `src/components` 共 18 个 Vue 组件 |
| API 模块 | `src/api` 共 57 个 JavaScript 文件 |
| 路由模块 | 9 个模块文件，其中 `nodeManage` 当前未接入主路由 |
| 状态管理 | Vuex `app`、`settings`、`user` 三个模块 |
| 国际化 | 中文、英文两套资源，`vue-i18n` |
| UI 框架 | Element UI 2.x，另有 `v-easy-components` |
| 本地 Mock | `mock` 目录，开发环境通过 Mock.js 注入 |
| 恢复资源 | `src/assets` 33 个文件，`src/icons` 48 个文件，无残留 `.part` 分片 |
| 测试 | 仓库存在 Vitest 配置，但当前未发现 `tests/unit` 测试文件 |

### 2.1 业务域

| 业务域 | 主要能力 | 现状 |
| --- | --- | --- |
| 登录与系统壳层 | 登录、密码修改、登出、心跳、超时退出、版本信息、国际化 | 已实现 |
| Dashboard | 欢迎页、版本信息、全局配置刷新 | 已实现，业务信息较少 |
| 基础数据 | 全局配置、地图配置、布局配置、APP/H5 配置、轮播等 | 已实现，部分入口已迁移 |
| 权限中心 | 角色、人员、后台用户、前台权限、前台角色、前台用户、后台权限、后台角色、后台用户、自定义组织 | 已实现但存在多套旧/新接口并存 |
| 协同岗管理 | 协同岗、层级、功能、上下岗、关联人员、标签和绑定关系 | 已实现，页面复杂度最高之一 |
| 位置管理 | 位置列表、组织关联、增删改 | 已实现 |
| 排班管理 | 排班类型、排班信息、详情 | 已实现，受全局开关控制 |
| 警信扩展 | 虚拟用户、归档群组 | 已实现，归档群组是迁移后的入口 |
| 预警管理 | 预警关系、群组和用户选择 | 已实现 |
| 三方对接 | 应用管理、南向对接、警单平台、通信服务、AI 智能体对接 | 已实现，接口前缀多、集成复杂 |
| 多节点管理 | 节点、服务端、客户端、入站/出站数据授权 | 代码存在，主路由当前屏蔽 |

### 2.2 通用组件

重点组件及其作用：

| 组件 | 作用 | Vue 3 迁移关注点 |
| --- | --- | --- |
| `ProTable` | 动态列、分页、跨页选择、选择池、自动高度、插槽 | 强耦合 Element UI 事件和 Vue 2 `$listeners`、`$set`、`$delete` |
| `SearchBar` | 查询条件布局和重置/查询 | 需要统一表单模型和字段配置协议 |
| `Pagination` | 分页包装 | `.sync` 需要迁移到 `v-model:page` / `v-model:limit` |
| `SelectTree` / `SelectTreeLazy` | 组织树、懒加载树选择 | 需要明确数据权限和树节点状态协议 |
| `VirtualTree` / `VirtualCheckboxList` | 大数据树和多选列表 | 需要保留虚拟滚动及选择回显能力 |
| `UserSelectDialog` / `PoliceSelectDialog` | 人员/警员选择 | 需要拆分查询、选择、回填和权限逻辑 |
| `UserBindDialog` | 后台账号与警员绑定 | 依赖全局用户状态和顶层 Navbar |
| `Upload` | 文件上传 | 需要统一上传响应、进度和错误处理 |
| `StatusSwitch` | 状态开关 | 需要统一按钮权限和确认策略 |
| `SvgIcon` | SVG sprite 图标 | Vue 3 可继续使用，但建议切换为显式 icon registry |

## 3. 启动和运行时流程

### 3.1 启动初始化

`src/main.js` 当前做了较多全局初始化：

- 引入 normalize.css、Element UI、中文 locale、i18n 和全局 SCSS。
- 注册 Vuex、路由、Element UI、`v-easy-components`、JSON viewer、自定义指令和全局组件。
- 开发环境直接加载 Mock.js，重写 XMLHttpRequest。
- 将 `hasBtnPermission` 挂到 `Vue.prototype.hasPerm`。
- 将一个 Vue 实例挂到 `Vue.prototype.eventBus`。
- 重写全局 `$on('click')`，增加 500ms 防抖。
- 使用 `new Vue()` 挂载应用。

这些能力在 Vue 3 中应拆分为明确的插件：

```text
createApp
  -> installElementPlus
  -> installI18n
  -> installPinia
  -> installRouter
  -> installPermission
  -> installDirectives
  -> installGlobalComponents
```

不建议继续覆盖框架原型方法或使用隐式全局事件总线。

### 3.2 登录流程

当前登录入口为 `src/views/login/index.vue`，流程如下：

1. 读取系统名称和简单密码策略。
2. 用户输入用户名和密码。
3. 构造 OAuth 风格参数：`clientId`、`clientSecret`、`grantType`、`scope`、`deviceId` 等。
4. 调用 `/auth/v1/oauth/v2/login`。
5. 成功码为 `0` 或 `121` 时保存：
   - access token
   - 用户名
   - 用户 ID
   - 身份证号（加密后）
   - 是否管理员
6. 若返回密码过期/首次登录/重置后状态码 `114`、`115`、`137`，进入修改密码弹窗。
7. 读取 License，必要时弹出 License 状态提示。
8. 拉取全局配置并更新系统名称。
9. 启动 5 秒一次的 keepalive 定时器。
10. 跳转到原始 redirect 或首页，并刷新页面。

### 3.3 请求链路

`src/utils/request.js` 统一创建 Axios 实例：

- `baseURL` 来自 `VUE_APP_BASE_API`。
- 请求头自动注入 `applicationId`、`X-CloudCmd-AppKey`、语言、Authorization、浏览器、操作系统、屏幕和客户端类型。
- Authorization 格式为 `token <accessToken>`。
- 响应统一返回 `response.data`，并把 headers 挂到结果对象。
- HTTP 401 时清理 token、关闭弹窗并跳转登录。
- HTTP 403 或业务失败时直接使用 Element UI Message 提示。

当前 API 返回格式并不完全统一，代码中同时出现 `msg`、`message`、`data`、`headers` 等访问方式；迁移时必须增加统一响应适配层，避免页面直接依赖后端字段差异。

### 3.4 路由和菜单流程

初始路由包含：

- `/login`
- `/404`
- `/` + `/dashboard`
- 通配回首页路由

首次进入非白名单页面时：

1. 若 Vuex 中菜单为空，调用 `user/getMenu`。
2. `getMenu` 顺序调用 `getGlobals`、`getPermissions`、`getMenuList`。
3. 根据菜单 ID 匹配 `permissions.menus`，收集后端 URL。
4. 执行 License、全局开关、管理员和生产环境过滤。
5. 通过 `filterMenus` 过滤静态路由树。
6. `router.addRoutes(list)` 动态注入。
7. Sidebar 使用 `permissionsMenu` 渲染。

同时，开发环境还会并行加载 OAuth 菜单，并通过 `menuRouteMapper.js` 尝试将 OAuth URL 映射为页面路由，未映射的菜单进入占位页。

这说明当前系统存在两套菜单来源：

```text
旧/主权限菜单：
  /api/menu/list + /auth/v1/oauth/v2/permissions

OAuth 菜单试运行链路：
  /oauth menu list -> menuRouteMapper -> 动态路由/占位页
```

Vue 3 重构必须先决定唯一权威菜单源，再保留适配层兼容旧接口。

## 4. 权限模型分析

### 4.1 权限判定层级

建议将当前隐含的判定顺序明确化：

```text
用户是否已登录
  AND 菜单是否被授权
  AND 业务模块是否被 License 开启
  AND 系统全局开关是否开启
  AND 用户是否满足管理员/用户特例
  AND 页面动作是否拥有按钮权限
  AND 当前数据是否在组织/数据权限范围内
```

### 4.2 当前实现的关键问题

1. `hasBtnPermission` 同时读取 Vuex 和 localStorage，权限数据存在双份来源。
2. 菜单权限和按钮权限的标识格式不统一，既有菜单 URL，也有 `/admin/...` action。
3. License、全局配置、管理员特例散落在路由过滤、页面 `v-if`、API 调用和 localStorage 中。
4. `filterRoutesByLicense`、`filterRoutesByGlobalConfig`、`filterRoutesByPermissions` 会直接修改导入的路由模块对象，重复登录/切换用户时可能产生状态污染。
5. `permissions.type === 0` 代表超级权限的规则未封装成可测试策略。
6. 页面层存在直接访问 `this.$store.state.user.licenseAuth`、`localStorage` 和 `sessionStorage` 的情况。
7. 后端菜单 URL 和前端路由 path 存在前缀、斜杠、父子路径混用，导致 `filterPaths` 和 `menuListHasUrl` 中出现大量特殊处理。

### 4.3 Vue 3 目标权限服务

重构后建议提供单一入口：

```ts
permission.canRoute(route)
permission.canAction('person:create')
permission.canLicense('groupCollaboration')
permission.canFeature('dutySchedule')
permission.canData('organization', organizationId)
```

页面只消费权限服务或 `v-permission` 指令，不再直接读取 storage 和 Vuex 内部字段。

## 5. 页面和交互模式

系统页面以管理后台 CRUD 为主，主要交互模式包括：

- 查询表单 + 表格 + 分页。
- 树形组织/部门选择。
- 新增/编辑弹窗。
- 详情抽屉/弹窗。
- 批量删除、批量授权和跨页选择。
- 文件上传、下载、模板导入导出。
- Tab 切换的配置页。
- 部门、人员、警员、摄像机等级联选择。
- License 和全局配置驱动的功能显隐。

主要风险：

- `ProTable` 约 1000 行，是重构时影响面最大的共享组件。
- 协同岗和快速管理页面包含大量嵌套表单、树选择和跨组件 ref 调用。
- `this.$refs`、`this.$set`、`this.$delete`、`this.$forceUpdate`、`$listeners` 和 `.sync` 使用广泛。
- 部分页面的接口调用、数据转换、校验和视图状态全部集中在单文件中，页面文件较大，迁移时需要按“查询、表单、授权、选择器、视图”拆层。

## 6. 工程和质量现状

### 6.1 构建现状

- 使用 Vue CLI 3 + Webpack 4。
- Node 引擎要求 `>=16`，当前环境为 Node 26.8.1。
- `node_modules` 当前不存在，因此本轮未执行实际构建和单元测试。
- `vitest.config.ts` 已配置，但其 alias 指向 `tests/unit`，仓库当前未发现对应测试目录。
- 生产环境使用 `/linkx/admin/` publicPath，开发环境使用 `/`。
- 开发代理目标为内网 HTTPS 地址，环境配置和 `vue.config.js` 中存在多组历史目标地址。

### 6.2 代码质量风险

- 老旧依赖较多：Vue 2.6、Vue CLI 3、Element UI、Axios 0.18。
- API URL 存在缺少前导 `/`、尾部多余空格和多个服务前缀并存的情况。
- 部分 API 仍使用 mock 或写死数据，如 `src/api/resource/roleAdmin.js`、`src/api/resource/user.js`。
- 路由中存在已移除模块的注释残留，容易让功能边界不清晰。
- 生产和开发的菜单、权限、License 逻辑存在分支行为差异。
- 错误提示由请求层直接弹出，页面无法统一控制重试、空态、错误态和可观测性。

## 7. 重构建议总览

重构不建议直接把所有 `.vue` 文件机械改成 Composition API。推荐采用“先稳定契约，再分域迁移”的方式：

1. 固化后端 API、响应、错误码、菜单和权限协议。
2. 建立 Vue 3 基础壳层和兼容适配层。
3. 先迁移公共组件和认证权限基础设施。
4. 选择低耦合业务域验证迁移模板。
5. 再迁移高复杂度协同岗、权限中心和三方对接。
6. 最后清理 Vue 2 兼容代码、旧接口和 mock 分支。

推荐目标栈：

- Vue 3 + TypeScript
- Vite
- Vue Router 4
- Pinia
- Element Plus
- Axios 或基于 Axios 的请求封装
- VueUse
- Vitest + Vue Test Utils
- Playwright
- ESLint Flat Config + Prettier

