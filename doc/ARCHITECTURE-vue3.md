# linkx-admin Vue 3 目标架构

> 版本：v1.0  
> 日期：2026-09-21  
> 目标：为 linkx-admin 建立可渐进迁移、可测试、可维护的 Vue 3 前端架构。

## 1. 总体架构

```text
┌──────────────────────────────────────────────────────────────┐
│                        Vue 3 Application                     │
├──────────────────────────────────────────────────────────────┤
│ AppShell                                                     │
│ ├─ AuthLayout / LoginView                                    │
│ └─ AdminLayout                                               │
│    ├─ Sidebar                                                 │
│    ├─ Navbar                                                  │
│    ├─ Breadcrumb                                              │
│    └─ RouterView                                              │
├──────────────────────────────────────────────────────────────┤
│ Platform Services                                            │
│ ├─ auth service                                               │
│ ├─ permission service                                         │
│ ├─ menu service                                               │
│ ├─ license service                                             │
│ ├─ global-config service                                      │
│ ├─ storage service                                            │
│ ├─ notification service                                       │
│ └─ telemetry/error service                                    │
├──────────────────────────────────────────────────────────────┤
│ State                                                         │
│ ├─ authStore                                                  │
│ ├─ permissionStore                                            │
│ ├─ appStore                                                   │
│ ├─ settingsStore                                              │
│ └─ domain stores                                               │
├──────────────────────────────────────────────────────────────┤
│ Domain Modules                                                │
│ ├─ authority                                                  │
│ ├─ collaboration                                              │
│ ├─ base-data                                                  │
│ ├─ scheduling                                                 │
│ ├─ location                                                   │
│ ├─ police-extend                                              │
│ ├─ notification                                               │
│ ├─ third-interface                                            │
│ └─ node-management                                            │
├──────────────────────────────────────────────────────────────┤
│ Infrastructure                                                │
│ ├─ Axios clients                                               │
│ ├─ API adapters                                                │
│ ├─ Element Plus                                                │
│ ├─ i18n                                                        │
│ ├─ router                                                      │
│ └─ test/mocking                                                │
└──────────────────────────────────────────────────────────────┘
```

## 2. 推荐目录结构

```text
src/
├─ app/
│  ├─ main.ts
│  ├─ App.vue
│  ├─ providers/
│  └─ register.ts
├─ layouts/
│  ├─ AdminLayout.vue
│  ├─ AuthLayout.vue
│  └─ components/
├─ router/
│  ├─ index.ts
│  ├─ guards.ts
│  ├─ static-routes.ts
│  ├─ route-loader.ts
│  └─ route-registry.ts
├─ stores/
│  ├─ auth.ts
│  ├─ app.ts
│  ├─ settings.ts
│  ├─ permission.ts
│  └─ session.ts
├─ services/
│  ├─ auth/
│  ├─ permission/
│  ├─ menu/
│  ├─ license/
│  ├─ global-config/
│  ├─ storage/
│  └─ http/
├─ api/
│  ├─ clients/
│  ├─ adapters/
│  ├─ auth/
│  ├─ authority/
│  ├─ collaboration/
│  ├─ base-data/
│  ├─ scheduling/
│  ├─ location/
│  ├─ notification/
│  ├─ third-interface/
│  └─ node-management/
├─ components/
│  ├─ table/
│  ├─ form/
│  ├─ tree/
│  ├─ dialog/
│  ├─ upload/
│  ├─ selection/
│  └─ feedback/
├─ modules/
│  ├─ authority/
│  │  ├─ pages/
│  │  ├─ components/
│  │  ├─ composables/
│  │  ├─ api.ts
│  │  ├─ types.ts
│  │  └─ routes.ts
│  ├─ collaboration/
│  ├─ base-data/
│  ├─ scheduling/
│  ├─ location/
│  ├─ police-extend/
│  ├─ notification/
│  ├─ third-interface/
│  └─ node-management/
├─ directives/
├─ composables/
├─ locales/
├─ styles/
├─ assets/
├─ types/
└─ utils/
```

## 3. 分层规则

### 3.1 页面层

页面只负责：

- 组合页面布局。
- 绑定查询条件和表单状态。
- 调用 domain composable。
- 展示 loading、empty、error 和成功反馈。
- 根据 `canAction` 显示动作。

页面不应直接：

- 读取 `localStorage`、`sessionStorage`。
- 调用 Axios。
- 拼接 API URL。
- 修改权限 store 内部结构。
- 依赖其他页面的 ref。

### 3.2 Domain 层

每个业务域维护：

- `api.ts`：接口声明。
- `types.ts`：请求、响应、表格行和表单类型。
- `composables/`：列表、表单、树、授权等业务状态。
- `routes.ts`：静态路由元数据。
- `components/`：只服务于该业务域的组件。

### 3.3 API 层

API 层不弹 toast，不操作路由，不操作 store。它只负责：

1. 请求参数类型化。
2. 调用对应 HTTP client。
3. 返回标准化数据。
4. 把后端字段适配成前端领域模型。

示例：

```ts
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  pageSize: number
}

export async function getPersonPage(
  params: PersonPageQuery,
): Promise<PageResult<Person>> {
  const response = await adminApi.post<ApiResponse<LegacyPage<Person>>>(
    '/api/executor/page',
    params,
  )
  return adaptPageResult(response.data)
}
```

### 3.4 Store 层

建议只保留跨页面共享状态：

| Store | 内容 |
| --- | --- |
| `authStore` | token、当前用户、登录、登出、改密、心跳状态 |
| `permissionStore` | 菜单树、路由、action permissions、data permissions |
| `appStore` | sidebar、device、全局 loading、网络状态 |
| `settingsStore` | 系统名称、语言、主题、布局配置 |
| `sessionStore` | License、全局开关、Superset 地址、设备/客户端信息 |

列表数据、弹窗表单和临时树选择状态默认放在页面 composable 中，不进入全局 store。

## 4. HTTP 和后端兼容层

### 4.1 HTTP Client

根据现有服务前缀建立命名客户端或统一实例：

```text
adminApi       -> /api
authApi        -> /auth/v1
collaborationApi -> /collaboration/v1
thirdApi       -> /third/v1
nodeApi        -> /node/v1
icpApi         -> /proxy/icp/v1
agentApi       -> /XA-ics-agent/proxy/ai/v1
```

请求拦截器负责：

- Authorization。
- applicationId。
- AppKey。
- Accept-Language。
- 客户端环境信息。
- request ID。

响应拦截器负责：

- 标准化 HTTP 错误。
- 标准化业务错误。
- 401 会话失效事件。
- 403 权限不足事件。
- 文件流和 JSON 响应区分。

建议错误模型：

```ts
export interface AppError {
  kind: 'network' | 'auth' | 'forbidden' | 'business' | 'validation'
  code?: string | number
  message: string
  details?: unknown
  requestId?: string
}
```

错误提示由页面或全局 notification service 决定，禁止在 API 函数内部直接调用 UI。

## 5. 认证架构

```text
authStore.login()
  -> authApi.login()
  -> normalizeLoginResult()
  -> storage.session.set()
  -> permissionStore.bootstrap()
  -> routerService.installDynamicRoutes()
```

### 5.1 会话安全

第一阶段为了兼容现有后端可继续使用 localStorage，但需要：

- 统一 storage key。
- 对 storage 读写集中封装。
- 不在页面散落 token key。
- 只保存必要的用户信息。
- 身份证号等敏感信息继续通过专用加密适配器处理。
- 明确 token 过期和多标签页同步策略。

如果后端支持，长期目标是迁移为 HttpOnly Secure Cookie 或短时 access token + refresh token 方案。

### 5.2 心跳和无操作超时

建立 `useSessionLifecycle()`：

- 登录后启动 keepalive。
- 页面销毁或登出时停止。
- 401/超时只触发一次登出流程。
- 多标签页通过 `BroadcastChannel` 同步登出。
- 通过可配置的间隔和超时时间替代 `global.tokenTimer`、`global.requestTimer`。

## 6. 权限架构

### 6.1 权限上下文

```ts
export interface PermissionContext {
  user: CurrentUser | null
  menuIds: Set<string>
  actionCodes: Set<string>
  dataScopes: DataScope[]
  isAdmin: boolean
  license: LicenseCapability
  features: FeatureFlags
}
```

### 6.2 路由元数据

```ts
export interface RouteMeta {
  title: string
  icon?: string
  permission?: string
  feature?: string
  license?: keyof LicenseCapability
  hidden?: boolean
  external?: string
}
```

### 6.3 权限过滤

不要原地修改静态路由模块。使用纯函数：

```ts
const visibleRoutes = filterRoutes({
  routes: cloneRouteTree(staticRoutes),
  context: permissionContext,
})
```

过滤顺序固定为：

```text
route hidden
  -> menu permission
  -> license capability
  -> feature flag
  -> admin policy
  -> data scope
```

按钮权限统一使用：

```vue
<el-button v-if="canAction('person:create')">
  新增人员
</el-button>
```

或：

```vue
<el-button v-permission="'person:create'">
  新增人员
</el-button>
```

## 7. 菜单和动态路由

### 7.1 目标原则

只允许一个权威菜单源。建议短期以现有主权限菜单为准，OAuth 菜单先做适配，不再并行修改路由。

长期可切换为：

```text
后端菜单 DTO
  -> menu adapter
  -> RouteRecordRaw
  -> permissionStore
  -> router.addRoute()
  -> sidebar menu
```

### 7.2 动态路由生命周期

```ts
await permissionStore.loadContext()
const routes = permissionStore.buildRoutes()
for (const route of routes) {
  router.addRoute(route)
}
permissionStore.routesReady = true
```

登出时：

```ts
permissionStore.removeDynamicRoutes()
authStore.clear()
router.replace('/login')
```

Vue Router 4 使用 `addRoute` 返回的移除函数记录动态路由，不再直接替换 matcher。

## 8. 共享组件重构

### 8.1 `ProTable` 目标

保留能力：

- 动态列。
- loading、empty、error。
- 服务端分页。
- 当前页和跨页选中。
- 自定义列插槽。
- 表头配置。
- 自动高度。

改造点：

- TypeScript 泛型列定义。
- `v-model:page`、`v-model:page-size`。
- 通过 composable 管理 selection map。
- 不依赖 `$listeners`、`$set`、`$delete`。
- 用 `defineExpose` 暴露有限方法。
- 组件层不拼接业务请求。

### 8.2 树和选择组件

统一节点协议：

```ts
interface TreeOption {
  id: string | number
  label: string
  type?: 'organization' | 'user' | 'camera'
  disabled?: boolean
  hasPermission?: boolean
  isLeaf?: boolean
  children?: TreeOption[]
}
```

统一：

- 懒加载。
- 搜索。
- 多选。
- 回显。
- 权限禁用。
- 空状态和加载失败重试。

### 8.3 Dialog 和表单

推荐页面组合：

```text
Page
  -> QueryPanel
  -> DataTable
  -> Pagination
  -> EditDialog
       -> FormSection
       -> useFormSubmit()
```

弹窗状态由页面 composable 持有，子组件通过 typed props/emits 通信，减少跨层 `$refs`。

## 9. 业务域迁移顺序

| 阶段 | 模块 | 原因 |
| --- | --- | --- |
| 0 | 构建、HTTP、storage、i18n、错误、认证 | 所有业务依赖 |
| 1 | Layout、Sidebar、Navbar、Login、Dashboard | 形成可运行新壳层 |
| 2 | Pagination、SearchBar、ProTable、SelectTree、Upload | 降低后续页面迁移成本 |
| 3 | 全局配置、位置管理、地图配置 | 复杂度中等，适合验证模板 |
| 4 | 排班、警信扩展、预警 | 业务边界较清晰 |
| 5 | 权限中心 | 依赖完整权限架构，风险较高 |
| 6 | 协同岗和快速管理 | 树、组织、人员、复杂表单最多 |
| 7 | 三方对接和 AI 智能体 | API 前缀多、上传导入导出多 |
| 8 | 多节点管理和历史模块 | 根据产品是否重新开放决定 |

## 10. 迁移阶段和退出条件

### Phase 0：基线

产出：

- 页面/路由/API/权限清单。
- 关键流程截图和接口样例。
- 旧系统冒烟用例。
- 新旧系统环境和回滚方案。

退出条件：P0 流程有可重复的验收记录。

### Phase 1：基础设施

产出：

- Vite + Vue 3 项目骨架。
- TypeScript、Pinia、Router 4、Element Plus。
- HTTP、storage、auth、permission、i18n。

退出条件：可登录、可登出、可动态加载首页和一个受限页面。

### Phase 2：共享组件

产出：

- 新版表格、分页、搜索、树、选择器、上传、弹窗规范。

退出条件：至少一个低风险业务域完全使用新组件。

### Phase 3：业务迁移

产出：

- 按业务域迁移页面、API、权限和测试。

退出条件：每个业务域通过功能、权限、异常和响应式验收。

### Phase 4：切换和清理

产出：

- 生产切换。
- 监控和回滚。
- 删除旧 Vue 2 依赖和兼容层。

退出条件：连续一个发布周期无 P0/P1 回归问题。

## 11. 风险和应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| 后端菜单源不唯一 | 路由和侧边栏不一致 | 先确定权威源，OAuth 只做 adapter |
| 后端响应格式不一致 | 页面迁移反复修补 | 建立 API adapter 和统一错误模型 |
| 权限规则散落 | 越权或误隐藏 | 集中 PermissionService，并做矩阵测试 |
| 共享组件行为回退 | 大量页面同时受影响 | 先写组件契约测试，再迁移页面 |
| 大文件单页迁移困难 | 进度不可控 | 按 composable、dialog、selector、table 拆分 |
| 生产部署路径变化 | 刷新 404、资源丢失 | 提前验证 `/linkx/admin/` base 和服务器回退规则 |
| API/mock 混用 | 测试结果不可信 | 将 mock 改为 MSW 或 typed fixtures，并标注真实接口状态 |
| 敏感信息继续散落 storage | 安全和维护风险 | 所有 storage 读写收敛到 session/storage service |

## 12. 技术债清理清单

- [ ] 移除 Vue 原型 `$on` 覆写和全局 eventBus。
- [ ] 移除 `global.tokenTimer`、`global.requestTimer`。
- [ ] 移除页面直接读取 localStorage/sessionStorage。
- [ ] 移除 `this.$set`、`this.$delete`、`this.$forceUpdate`。
- [ ] 移除 `$listeners` 和 `.sync` 兼容写法。
- [ ] 统一 API URL 前导斜杠和服务前缀。
- [ ] 统一 `msg` / `message` / `code` / `data` 响应结构。
- [ ] 取消路由模块中的运行时原地过滤。
- [ ] 清理已移除模块的注释和失效入口。
- [ ] 为认证、权限、路由过滤和核心组件补齐测试。
- [ ] 评估 `src/assets/custom-theme/index.css` 是否继续保留，避免与 Element Plus 主题重复加载。

