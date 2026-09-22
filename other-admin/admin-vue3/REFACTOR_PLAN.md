# Admin Vue3 重构规划文档

> 项目路径: `docs-local/admin-vue3/`（暂放 docs-local，后续可迁移至独立仓库）
> 原项目: `cloudcmd-admin-web/`（Vue2 + Options API + Element UI + Vuex + Webpack）
> 最后更新: 2026-07-27

---

## 一、重构决策记录

| 决策项   | 结论                                            | 理由                                                 |
| -------- | ----------------------------------------------- | ---------------------------------------------------- |
| 项目位置 | `docs-local/admin-vue3/`                        | 不修改 .gitignore，暂放 docs-local，后续迁出         |
| 技术栈   | Vue3 + Element Plus + Pinia + Vite + TypeScript | 与 web/agent/web 完全对齐，组件/规则可复用           |
| 重构范围 | 先搭骨架 + 登录 + 权限模块验证                  | 验证全链路后再批量迁移其余模块                       |
| 验证模块 | authority/auth + person                         | 权限系统核心，充分验证路由/权限/HTTP/表格表单/品牌色 |
| 菜单策略 | 保留双轨（旧 getMenuList + OAuth 并行）         | OAuth 接口仍在开发，重构时预留但暂不切流             |
| 组件迁移 | 全部重写                                        | Vue3 原生实现，应用模板方法/责任链等模式             |
| HTTP 层  | 参考 web/agent/web 的 http.ts 重写              | 复用成熟封装，全量 TS 类型定义                       |
| 样式系统 | 重建设计令牌 + #264ed1 主色                     | 按 PRODUCT.md 要求品牌收敛                           |
| 登录页   | 保持现有交互逻辑不变                            | 避免运维不适，仅升级 Vue3 + 新品牌色                 |
| 虚拟滚动 | 简化实现，后续补齐                              | 权限模块用不到，避免过度设计                         |

---

## 二、项目目录结构

```
admin-vue3/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                    # API 请求（.ts，按模块拆分）
│   │   ├── user.ts             # 登录/登出/Token/权限
│   │   ├── license.ts          # License
│   │   ├── permission/         # 菜单/角色/权限/用户
│   │   ├── dictionary/         # 字典/全局参数
│   │   └── ...                 # 后续模块迁移时逐步新增
│   ├── assets/                 # 静态资源
│   │   ├── images/
│   │   └── svg/
│   ├── components/             # 公共组件（全部重写）
│   │   ├── ProTable/           # 高级表格（配置式 columns）
│   │   ├── SearchBar/          # 搜索栏（搜索/组织/时间/操作按钮）
│   │   ├── Pagination/         # 分页
│   │   ├── SelectTree/         # 组织选择器（同步加载）
│   │   ├── SelectTreeLazy/     # 组织选择器（懒加载）
│   │   ├── StatusSwitch/       # 状态切换
│   │   ├── SvgIcon/            # SVG 图标
│   │   ├── Upload/             # 文件上传
│   │   ├── PasswordInput/      # 密码输入框
│   │   ├── Breadcrumb/         # 面包屑
│   │   ├── AuthImg/            # Token 鉴权图片
│   │   └── index.ts            # 全局注册入口
│   ├── composables/            # 组合式函数
│   │   ├── usePermission.ts    # 按钮权限判断
│   │   ├── useLicense.ts       # License 权限
│   │   └── useStrict.ts        # 会话超时检测
│   ├── config/                 # 常量/环境配置
│   │   └── index.ts
│   ├── directives/             # 自定义指令
│   │   ├── loadmore.ts         # el-select 下拉懒加载
│   │   └── waves.ts            # 点击波纹效果
│   ├── hooks/                  # 通用 hooks（useXxx.ts）
│   │   └── index.ts
│   ├── layout/                 # 布局
│   │   ├── components/
│   │   │   ├── Navbar.vue
│   │   │   ├── Sidebar/
│   │   │   │   ├── index.vue
│   │   │   │   └── SidebarItem.vue
│   │   │   └── AppMain.vue
│   │   └── index.vue
│   ├── locales/                # 国际化
│   │   ├── index.ts
│   │   └── lang/
│   │       ├── cn/
│   │       └── en/
│   ├── router/                 # 路由
│   │   ├── index.ts
│   │   ├── routerGuard.ts      # 路由守卫
│   │   ├── modules/            # 按模块拆分路由
│   │   │   ├── authority.ts
│   │   │   └── ...             # 后续模块
│   │   └── types.ts
│   ├── store/                  # Pinia
│   │   ├── index.ts
│   │   └── modules/
│   │       ├── useAppStore.ts     # 侧边栏状态
│   │       ├── useSettingsStore.ts # 系统设置
│   │       └── useUserStore.ts     # 用户/权限/菜单（核心）
│   ├── styles/                 # 全局样式
│   │   ├── variables.less      # 设计令牌（主色/间距/字号/圆角）
│   │   ├── reset.less          # 重置样式
│   │   ├── element-plus.less   # Element Plus 主题覆盖
│   │   ├── sidebar.less        # 侧边栏布局
│   │   ├── transition.less     # 过渡动画
│   │   ├── mixin.less          # Less mixin
│   │   └── index.less          # 全局入口
│   ├── types/                  # TypeScript 类型定义
│   │   ├── global.d.ts
│   │   ├── axios.d.ts
│   │   ├── api.d.ts            # API 通用类型
│   │   ├── user.d.ts
│   │   ├── permission.d.ts
│   │   └── menu.d.ts
│   ├── utils/                  # 工具函数
│   │   ├── http.ts             # HTTP 请求封装（参考 web 项目）
│   │   ├── auth.ts             # Token/用户信息存取
│   │   ├── crypto.ts           # AES 加解密
│   │   ├── secure.ts           # 身份证加解密
│   │   ├── clientEnv.ts        # 客户端环境信息
│   │   ├── createDialog.ts     # 命令式弹窗
│   │   ├── menuRouteMapper.ts  # OAuth 菜单路由映射
│   │   ├── pageLoading.ts      # 数据同步 loading
│   │   ├── passwordValidator.ts # 密码校验
│   │   └── index.ts            # 通用工具（parseTime/format/treeDataTranslate 等）
│   ├── views/                  # 页面组件
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── authority/
│   │   │   ├── auth/           # 角色管理
│   │   │   │   ├── index.vue
│   │   │   │   └── components/
│   │   │   │       └── EditRole.vue
│   │   │   ├── person/         # 权限管理
│   │   │   │   ├── index.vue
│   │   │   │   └── components/
│   │   │   │       ├── EditPerson.vue
│   │   │   │       ├── SetRole.vue
│   │   │   │       └── SetBatchRole.vue
│   │   │   └── components/     # 权限模块公共组件
│   │   │       ├── DepartmentTree.vue
│   │   │       └── DataPermissionTree.vue
│   │   └── 404.vue
│   ├── App.vue
│   └── main.ts
├── types/                      # 全局类型声明（tsconfig #/* 别名）
│   ├── index.d.ts
│   └── modules.d.ts
├── .env
├── .env.development
├── .env.production
├── .prettierrc.mjs
├── .prettierignore
├── .stylelintignore
├── eslint.config.mjs
├── stylelint.config.mjs
├── commitlint.config.mjs
├── index.html
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.js
├── tsconfig.json
└── vite.config.mts
```

> 说明:
>
> - 样式使用 `lang="less"`，与 web/agent/web 一致（不沿用 admin Vue2 的 SCSS）
> - 页面目录用 `views/`，与 admin Vue2 保持命名一致
> - HTTP 入口 `utils/http.ts` 默认导出，与 web/agent/web 一致
> - Store 用 `store/`（单数），与 web/agent/web 一致

---

## 三、核心架构设计

### 3.1 路由守卫（routerGuard.ts）

```
beforeEach 流程:
1. NProgress.start()
2. 检查 userStore.menu 是否为空:
   - 为空（首次进入）:
     a. await userStore.getMenu()   // 串行: getGlobals → getPermissions → getMenuList
     b. await addRouterByPermissions(menu, permissions.menus)
     c. next(to.redirectedFrom)
     d. 并行加载 OAuth 菜单（开发环境并行，生产环境跳过）
3. 设置页面标题
4. Token 校验:
   - 有 Token: 白名单路径重定向到 /，否则放行
   - 无 Token: /login 放行，否则重定向到 /login?redirect=xxx
5. NProgress.done()
```

**关键改造点（vs Vue2）**:

- `router.addRoutes()` → `router.addRoute()` 逐个添加
- `Vuex store` → `Pinia useUserStore()`
- `router.matcher` reset → 使用 `router.getRoutes()` + 批量 `removeRoute()`

### 3.2 权限过滤（责任链模式）

```typescript
// router/filterChain.ts

interface RouteFilter {
  name: string
  filter(routes: RouteRecordRaw[], ctx: FilterContext): Promise<RouteRecordRaw[]>
}

class FilterChain {
  private filters: RouteFilter[] = []

  use(filter: RouteFilter): FilterChain {
    this.filters.push(filter)
    return this
  }

  async run(routes: RouteRecordRaw[], ctx: FilterContext): Promise<RouteRecordRaw[]> {
    let result = routes
    for (const filter of this.filters) {
      result = await filter.filter(result, ctx)
    }
    return result
  }
}

// 具体过滤器
class LicenseFilter implements RouteFilter { ... }
class GlobalConfigFilter implements RouteFilter { ... }
class UserAuthFilter implements RouteFilter { ... }
class MenuPermissionFilter implements RouteFilter { ... }

// 组装
const chain = new FilterChain()
  .use(new LicenseFilter())
  .use(new GlobalConfigFilter())
  .use(new UserAuthFilter())
  .use(new MenuPermissionFilter())
```

### 3.3 HTTP 封装（参考 web 项目 http.ts）

**与 Vue2 admin 的关键差异**:

| 维度          | Vue2 admin                                  | Vue3 admin                                                      |
| ------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 实例          | `axios.create()` 直接导出                   | `HttpService` 类封装，`httpService` 默认导出                    |
| 请求取消      | 无                                          | `AbortController` + `httpController` Map                        |
| Token         | `getToken()` 拼接 `Authorization`           | 同，但 `TD-CloudCmd-Token` header 不需要（admin 用 `CDC-2000`） |
| AppKey        | `X-CloudCmd-AppKey: CDC-2000`               | 保持 `CDC-2000`（区别于 web 的 `CDC-1000`）                     |
| applicationId | `1289822833455460000`                       | 保持 `1289822833455460000`（区别于 web 的 `...0001`）           |
| X-Client-Type | `CLIENT_TYPE.ADMIN`（'4'）                  | 保持                                                            |
| 401 处理      | `closeAllDialogs` + `resetToken` + 跳 login | 同逻辑，用 `createDialog.closeAll()`                            |
| 类型          | 无                                          | 全量 TS 泛型 `HttpResult<T>`                                    |

### 3.4 Store（Vuex → Pinia）

**Vuex user 模块（15+ mutations/actions） → Pinia useUserStore（Setup Store）**

```typescript
// store/modules/useUserStore.ts
export const useUserStore = defineStore('user', () => {
  // state
  const token = ref<string>(getToken() || '')
  const userInfo = ref<UserInfo | null>(null)
  const buttons = ref<string[]>([])
  const menu = ref<MenuItem[]>([])
  const permissions = ref<Permissions>({ menus: [], actions: [] })
  const permissionsMenu = ref<RouteRecordRaw[]>([])
  const globals = ref<GlobalItem[]>([])
  const licenseAuth = ref<LicenseAuth>(getLicenseAuth() || defaultLicenseAuth)
  const oauthMenu = ref<OAuthMenuItem[]>([])
  const oauthMenuLoaded = ref(false)

  // getters
  const isLoggedIn = computed(() => !!token.value)
  const isSuperAdmin = computed(() => getIsAdmin() === 'true')

  // actions
  async function loginAction(loginForm: LoginForm): Promise<LoginResult> { ... }
  async function logoutAction(): Promise<void> { ... }
  async function resetTokenAction(): Promise<void> { ... }
  async function getMenuAction(): Promise<boolean> { ... }
  async function getPermissionsAction(): Promise<void> { ... }
  async function getGlobalsAction(): Promise<void> { ... }
  async function getOauthMenuAction(): Promise<OAuthMenuItem[]> { ... }

  return { /* ... */ }
})
```

**App/Settings Store 拆分与 Vue2 一致**，仅语法升级为 Setup Store。

---

## 四、组件库重写策略

### 4.1 第一阶段必须组件（authority 模块需要）

| 组件               | 复杂度 | 说明                                                 |
| ------------------ | ------ | ---------------------------------------------------- |
| **ProTable**       | 高     | 配置式 columns + 内置分页/loading/多选/序号/跨页选中 |
| **SearchBar**      | 中     | 搜索/组织/时间段/操作按钮组                          |
| **Pagination**     | 低     | el-pagination 封装，全局注册                         |
| **SelectTree**     | 中     | 组织选择器（同步加载）                               |
| **SelectTreeLazy** | 中     | 组织选择器（懒加载）                                 |
| **SvgIcon**        | 低     | SVG 图标                                             |
| **Breadcrumb**     | 低     | 面包屑                                               |
| **PasswordInput**  | 低     | 密码输入框（禁止复制粘贴）                           |

### 4.2 第二阶段组件（后续业务模块需要）

| 组件                    | 复杂度 | 说明                                            |
| ----------------------- | ------ | ----------------------------------------------- |
| **VirtualTree**         | 高     | 虚拟滚动树（简化版，支持展开/选中/搜索/懒加载） |
| **VirtualCheckboxList** | 中     | 虚拟滚动复选框列表                              |
| **AuthImg**             | 低     | Token 鉴权图片                                  |
| **Upload**              | 中     | 文件上传弹窗                                    |
| **StatusSwitch**        | 低     | 状态切换                                        |
| **PoliceSelectDialog**  | 中     | 警员多选弹窗                                    |
| **UserSelectDialog**    | 中     | 用户多选弹窗                                    |
| **UserBindDialog**      | 低     | 用户单选绑定弹窗                                |

### 4.3 ProTable 设计要点（Vue3 重写）

```typescript
// 组件接口设计
interface ProTableProps {
  columns: ColumnConfig[]; // 配置式列定义
  data?: any[]; // 静态数据（可选，与 fetchApi 二选一）
  fetchApi?: (...args) => Promise<any>; // 远程数据接口
  loading?: boolean;
  total?: number;
  page?: number;
  limit?: number;
  rowKey?: string;
  showSelection?: boolean;
  showIndex?: boolean;
  selectable?: (row: any) => boolean;
  showSelectionBar?: boolean; // 跨页选中栏
  autoHeight?: boolean; // 自动撑满剩余高度
}

interface ColumnConfig {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  formatter?: (row: any, column: any, cellValue: any) => string;
  slotName?: string; // 具名插槽名（自定义列内容）
  headerSlotName?: string; // 表头插槽名
  hide?: boolean; // 是否隐藏
  children?: ColumnConfig[]; // 多级表头
}
```

---

## 五、样式系统与设计令牌

### 5.1 主色收敛

```less
// styles/variables.less

// ========== 品牌主色（与 web 端收敛） ==========
@color-primary: #264ed1; // Diligence Blue（与 web 一致）
@color-primary-light-3: #5575db;
@color-primary-light-5: #7d9be6;
@color-primary-light-7: #a5c0f0;
@color-primary-light-9: #cde2fa;
@color-primary-dark-2: #1e3ea7;

// ========== 侧边栏 ==========
@menu-bg: #1a2332; // 深色侧边栏（比 Vue2 的 #304156 更深，更专业）
@menu-hover-bg: #243347;
@menu-active-bg: @color-primary;
@menu-text: #bfcbd9;
@menu-active-text: #ffffff;
@side-bar-width: 230px;
@side-bar-collapsed-width: 54px;

// ========== 功能色 ==========
@color-success: #67c23a;
@color-warning: #e6a23c;
@color-danger: #f56c6c;
@color-info: #909399;

// ========== 文字色 ==========
@color-text-primary: #303133;
@color-text-regular: #606266;
@color-text-secondary: #909399;
@color-text-placeholder: #c0c4cc;

// ========== 背景/边框 ==========
@color-bg-page: #f5f7fa;
@color-bg-card: #ffffff;
@color-border: #dcdfe6;
@color-border-light: #e4e7ed;

// ========== 间距 ==========
@spacing-xs: 4px;
@spacing-sm: 8px;
@spacing-md: 16px;
@spacing-lg: 24px;
@spacing-xl: 32px;

// ========== 字号 ==========
@font-size-xs: 12px;
@font-size-sm: 13px;
@font-size-md: 14px;
@font-size-lg: 16px;
@font-size-xl: 18px;

// ========== 圆角 ==========
@radius-sm: 2px;
@radius-md: 4px;
@radius-lg: 8px;

// ========== Element Plus 主题覆盖变量 ==========
// 通过 postcss-pxtorem / CSS 变量等方式注入
```

### 5.2 Element Plus 主题覆盖

```less
// styles/element-plus.less
// 覆盖 Element Plus CSS 变量
:root {
  --el-color-primary: #264ed1;
  --el-color-primary-light-3: #5575db;
  --el-color-primary-light-5: #7d9be6;
  --el-color-primary-light-7: #a5c0f0;
  --el-color-primary-light-9: #cde2fa;
  --el-color-primary-dark-2: #1e3ea7;
}
```

---

## 六、编码规范与架构约定

> **本章是 AI 和人类开发者都必须遵守的强制约定**，源自用户在历次对话中反复强调的要求和踩过的坑。

### 6.1 与 Vue2 admin 的一致性原则（最高优先级）

1. **交互、页面逻辑、页面 URL 完全跟 Vue2 admin 一致**（用户多次强调的核心要求）
2. **表格统一用 ProTable**（用户明确要求，禁止直接用 el-table）
3. **tab 顺序与 Vue2 完全一致**（如协同岗 1→2→5→3→4，不能按 name 数字顺序排）
4. **响应结构差异必须显式处理**（直接 `{records, total}` vs 包装 `{code, data}`）
5. **license 控制点对齐 Vue2**（如 AICollaborationAuth 控制 ColForm 人员核查协同岗选项）
6. **i18n 文案与 Vue2 一致**：Vue2 中硬编码中文的模块，Vue3 也保持硬编码；Vue2 中已抽 i18n 的模块，Vue3 同步抽取

### 6.2 模块迁移工作流（强制流程）

**每个模块迁移必须按以下顺序执行，禁止跳步**：

1. **研究 Vue2 源码**：用 Task subagent_type=search 完整研究模块所有逻辑细节（API、组件、交互、license、i18n）
2. **梳理交互逻辑**：输出组件复用分析 + 组件拆分建议（不能直接开始编码）
3. **考虑组件复用**：是否有现成组件可复用？是否可以拆分通用组件？避免单文件巨石
4. **制定 todo**：用 TodoWrite 拆分任务
5. **实施**：API 层 → 通用组件 → 页面 → 路由接入 → i18n
6. **验证**：`npm run lint:ts` + `npm run lint:prettier` 必须通过
7. **更新文档**：同步刷新 PROGRESS.md 和 REFACTOR_PLAN.md

### 6.3 组件化与复用原则

#### 6.3.1 组件拆分原则

- **避免单文件巨石**：一个 .vue 文件不应包含多个模块的逻辑代码
- **每个 tab 可独立成菜单**：tab 容器中的每个 tab 内容应抽成独立组件，未来拆为独立路由时零改动
- **通用逻辑抽取**：两个以上模块共用的逻辑必须抽取为通用组件或 composable

#### 6.3.2 依赖反转模式（核心设计模式）

当通用组件需要调用不同业务 API 时，**不要在组件内部硬编码 API**，而是通过 props 注入：

```typescript
const props = defineProps<{
  businessName: 'level' | 'function';
  fetchChildren: (parentId) => Promise<{ data?: TreeNode[] }>;
  createNode: (data) => Promise<{ code: number }>;
  updateNode: (id, data) => Promise<{ code: number }>;
  deleteNode: (id) => Promise<{ code: number }>;
  onSubmit: (type, name, parentData, editData) => Promise<boolean>;
}>();
```

#### 6.3.3 props 回调替代 emit 返回值

Vue3 的 emit() 返回 void，需要返回值的场景改用 props 回调函数：

```typescript
const props = defineProps<{
  onSubmit: (data) => Promise<boolean>;
}>();
const ok = await props.onSubmit(data);
```

#### 6.3.4 组件复用清单维护

每次新增通用组件后，必须更新 PROGRESS.md「五.2 组件复用清单」表格。

### 6.4 Promise 链式调用约定

**与 Vue2 一致：使用 .then().catch().finally() 链式调用，而非 try/await/catch**。

```typescript
// 推荐：Promise 链式调用
ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  .then(async () => {
    const res = await deleteCollaboration(id);
    if (res.code === 0) {
      ElMessage.success('删除成功');
      searchRef.value?.handleQuery();
    }
  })
  .catch(() => {});
```

原因：Vue2 admin 全部使用 Promise 链式调用，保持一致性便于代码审查和对照。

### 6.5 ProTable 使用约定

#### 6.5.1 slot scope 的 TS 类型问题

ProTable 的 slot props 类型推断不完善，业务代码必须用 helper 函数安全获取 row：

```typescript
function getRow(scope: any): BusinessType {
  return (scope?.row as BusinessType) ?? ({} as BusinessType);
}
```

#### 6.5.2 序号列约定

Vue2 admin 中所有表格的序号列为 label="序号" width="100"。Vue3 中 ProTable 默认 label="#" width="60"，业务方必须传入 props 覆盖：

```vue
<ProTable show-index index-label="序号" :index-width="100" />
```

### 6.6 Element Plus 类型兼容问题

- el-tree Node 类型不兼容：用 as unknown as 中转
- el-tree load 回调签名：用 any 兼容

### 6.7 响应结构处理约定

后端接口有多种返回结构，必须在 API 包装层显式声明返回类型：

| 接口类型           | 响应结构                                                    | 业务层取值                          |
| ------------------ | ----------------------------------------------------------- | ----------------------------------- |
| 标准包装           | { code, msg, data }                                         | res.data                            |
| 分页包装           | { code, msg, data: { records, total } }                     | res.data.records                    |
| 特殊：直接业务字段 | { records, total }                                          | res.records                         |
| 层级/职能 members  | { code, data: { records, total } } 或 { code, data: [...] } | res.data?.records ?? res.data ?? [] |

### 6.8 AppMain 高度撑满约定

.app-main 使用 height: calc(100vh - 50px)（不是 min-height），让子组件的 height: 100% 链路生效。padding 由各页面的 .app-container 自行管理。

### 6.9 ESLint 已知误报处理

- TypeScript 类型声明 no-unused-vars 误报：用 eslint-disable 注释
- 浏览器全局变量 no-undef 误报：文件顶部加 /* global */ 注释

### 6.10 i18n 使用约定

- useI18n({ useScope: 'global' }) 取 t
- Vue2 中硬编码中文的模块保持硬编码，Vue2 中已抽 i18n 的模块同步抽取

### 6.11 文档维护约定（强制）

每次对话完成代码修改后，必须同步刷新 PROGRESS.md 和 REFACTOR_PLAN.md。刷新后运行 npx prettier --write PROGRESS.md REFACTOR_PLAN.md 格式化。

### 6.12 代码质量验证约定

每次代码修改完成后，必须运行 npm run lint:ts 和 npm run lint:prettier 验证。

### 6.13 代码注释与文档约定（强制）

> 本约定是用户明确要求新增的，之前生成的代码缺少详细注释，后续必须补齐。

#### 6.13.1 代码注释要求

所有新建/修改的代码文件必须有详细的中文注释：

1. 组件文件（.vue）：script setup 顶部有组件用途说明；defineProps 每个字段有 JSDoc 注释；复杂函数有做什么+参数+返回值注释；关键逻辑有行内注释说明为什么
2. API 文件（.ts）：每个 API 函数有 JSDoc 注释（用途、HTTP 方法、URL、参数、返回值）；interface 每个字段有注释
3. 工具函数（.ts）：每个导出函数有 JSDoc 注释（用途、参数、返回值、使用示例）
4. Store 模块（.ts）：state 字段有注释；action 函数有触发条件和副作用注释

#### 6.13.2 封装组件的文档要求

所有封装的通用组件必须有完整的参数说明和使用方法文档：

1. 组件文件内：defineProps 每个字段有 JSDoc 注释（类型、默认值、是否必填、说明）；defineEmits 每个事件有注释（触发时机、参数说明）；defineExpose 暴露的方法有注释；复杂 slot 有注释说明 props 结构
2. REFACTOR_PLAN.md 组件章节：每个通用组件有设计要点小节（Props 清单、Events 清单、Slots 清单、使用示例代码、注意事项）
3. PROGRESS.md 组件复用清单：标注组件被哪些页面复用

#### 6.13.3 后续对话补齐注释

下次对话开始时，如果发现之前生成的代码缺少注释，必须先补齐注释再开始新功能开发。

优先级：

1. 先补齐已有通用组件（ProTable、SearchBar、OrgTreeSelect、AuthImg、CoopLevelTree、CoopBindDialog 等）的注释
2. 再补齐 API 文件的 JSDoc
3. 最后补齐页面文件的关键逻辑注释

#### 6.13.4 注释风格约定

API 函数注释：用 JSDoc 格式（/** ... _/），说明用途、HTTP 方法、URL、参数、返回值
组件 props 注释：每个字段用 /_* 说明 */ 格式
函数注释：用 JSDoc 格式，说明用途、参数、返回值

---

## 七、与 Vue2 admin 的对照映射

### 7.1 核心文件映射

| Vue2 admin                                     | Vue3 admin                                     | 说明                          |
| ---------------------------------------------- | ---------------------------------------------- | ----------------------------- |
| `src/store/modules/user.js`                    | `src/store/modules/useUserStore.ts`            | Vuex → Pinia Setup Store      |
| `src/store/modules/app.js`                     | `src/store/modules/useAppStore.ts`             | 同上                          |
| `src/store/modules/settings.js`                | `src/store/modules/useSettingsStore.ts`        | 同上                          |
| `src/permission.js`                            | `src/router/routerGuard.ts`                    | 逻辑一致，语法升级            |
| `src/router/index.js` (addRouterByPermissions) | `src/router/filterChain.ts` + `routerGuard.ts` | 责任链模式拆分                |
| `src/utils/request.js`                         | `src/utils/http.ts`                            | axios 封装 + TS 类型          |
| `src/utils/auth.js`                            | `src/utils/auth.ts`                            | 逻辑一致，加类型              |
| `src/utils/permission.js`                      | `src/composables/usePermission.ts`             | 函数 → composable             |
| `src/utils/licenseUtils.js`                    | `src/composables/useLicense.ts`                | 同上                          |
| `src/utils/astrict.js`                         | `src/composables/useStrict.ts`                 | 同上                          |
| `src/utils/menuRouteMapper.js`                 | `src/utils/menuRouteMapper.ts`                 | 逻辑一致，加类型              |
| `src/components/ProTable/`                     | `src/components/ProTable/`                     | 全部重写，接口兼容            |
| `src/layout/`                                  | `src/layout/`                                  | Options API → Composition API |
| `src/views/login/`                             | `src/views/login/`                             | 交互保持，Vue3 语法           |
| `src/views/authority/`                         | `src/views/authority/`                         | 交互保持，Vue3 语法           |

### 7.2 API 模块迁移对照（第一阶段仅迁移 authority 需要的）

| Vue2 admin API                                                                 | Vue3 admin API              | 说明         |
| ------------------------------------------------------------------------------ | --------------------------- | ------------ |
| `api/user.js` (login/logout/keepalive/changePwd/getRolePermissions/getVersion) | `api/user.ts`               | 全量 TS 类型 |
| `api/dictionary/globals.js` (getGlobalsList)                                   | `api/dictionary/globals.ts` | 全量 TS 类型 |
| `api/license/index.js` (getLicenseInfo)                                        | `api/license.ts`            | 全量 TS 类型 |
| `api/permission/menu.js` (getMenuList)                                         | `api/permission/menu.ts`    | 全量 TS 类型 |
| `api/permission/role.js` (getRoleListByPage/createRole/updateRole/deleteRole)  | `api/permission/role.ts`    | 全量 TS 类型 |
| `api/permission/user.js` (getUserListByPage/setRole/setBatchRole)              | `api/permission/user.ts`    | 全量 TS 类型 |
| `api/resource/person.js` (getPersonList)                                       | `api/resource/person.ts`    | 全量 TS 类型 |
| `api/oauth/menu.js` (getOauthMenuList)                                         | `api/oauth/menu.ts`         | 全量 TS 类型 |

### 7.3 国际化迁移

Vue2 admin 的 `src/locales/lang/cn/` 和 `en/` 下 1000+ 行主文案 + 模块文件，直接复制内容到 Vue3 项目对应目录，仅做以下调整：

- JS 对象 → TS 导出
- `this.$t()` → `useI18n()` 的 `t()`
- Element UI locale → Element Plus locale

---

## 八、与 Vue2 admin 并行运行策略

1. **同部署不同路由**: Vue2 admin 跑 `/linkx/admin/`，Vue3 admin 跑 `/linkx/admin-v3/`（或独立域名）
2. **共享后端 API**: 两套前端连同一套后端，接口完全兼容
3. **灰度切换**: Nginx 按用户/角色分流到不同前端版本
4. **新需求双写**: 新业务需求在 Vue2 admin 交付后，同步在 Vue3 admin 实现
5. **逐步迁移**: 每迁移一个路由模块，在 Vue3 版本验证通过后，可灰度切流

---

## 九、后续模块迁移优先级（Phase 2+）

> 最后更新: 2026-07-24

| 批次 | 模块             | 路由                                                                 | 复杂度 | 说明                    | 状态       |
| ---- | ---------------- | -------------------------------------------------------------------- | ------ | ----------------------- | ---------- |
| P2   | 值班信息         | `/scheduling/dutyInformation`                                        | 中     | 日历+列表+导入+组织筛选 | ✅ 完成    |
| P2   | 排班类型         | `/scheduling/dutyType`                                               | 低     | 简单 CRUD               | ✅ 完成    |
| P2   | 基础数据         | `/baseData/globals`, `/baseData/thirdParty`                          | 低     | 全局配置+三方应用       | ✅ 完成    |
| P2   | H5 协同岗        | `/collaboration/index`, `/collaboration/quick`                       | 高     | 30+ 接口，最复杂        | ✅ 完成    |
| P3   | 节点管理         | `/nodeManage/*`                                                      | 中     | 客户端/服务端/数据管理  | ✅ 完成    |
| P3   | 预警推送         | `/notification/alertPush`                                            | 中     | 定时任务/无人值守       | ✅ 完成    |
| P3   | H5 管理          | `/h5/carousel`, `/h5/ArchivedTable`                                  | 中     | 轮播图+归档群组         | ✅ 完成    |
| P4   | 权限中心（剩余） | `/authority/im*`, `/authority/admin*`, `/authority/customDepartment` | 低     | 8 个子路由全部迁移      | ✅ 完成    |
| P4   | 位置管理         | `/location/location`                                                 | 低     | 简单 CRUD               | ✅ 完成    |
| P4   | 警信扩展         | `/policeExtend/virtualUser`                                          | 低     | 虚拟用户 CRUD           | ✅ 完成    |
| P4   | 地图配置         | `/baseData/mapConfig`                                                | 中     | 地图编辑+上传           | ✅ 完成    |
| P4   | 布局配置         | `/baseData/layoutConfig`                                             | 中     | 仅 admin 可见           | ✅ 完成    |
| P3   | 三方对接         | `/thirdParty/*`                                                      | 中     | AI Agent/南向/警单/通信 | ✅ 完成    |

---

## 十、Composables Hooks 架构（2026-07-24 新增）

### 10.1 设计目标

封装通用请求与表格逻辑，减少业务页面样板代码：

| Hooks      | 路径                          | 职责                                              | 使用场景                       |
| ---------- | ----------------------------- | ------------------------------------------------- | ------------------------------ |
| `useFetch` | `src/composables/useFetch.ts` | 通用请求三态管理 + 竞态取消 + 防抖/节流/轮询/重试 | 任意异步请求场景               |
| `useTable` | `src/composables/useTable.ts` | 表格分页/搜索/刷新/选择通用逻辑                   | 不用 ProTable 的自定义表格场景 |

### 10.2 ProTable 远程模式

ProTable 集成 fetchApi 自治模式，提供三种数据模式：

| 模式       | 触发条件                   | 数据来源                                                |
| ---------- | -------------------------- | ------------------------------------------------------- |
| 展示模式   | 仅传 `data`                | 父组件                                                  |
| 纯远程模式 | 仅传 `fetchApi`            | ProTable 内部（defaultTableFormatter）                  |
| 受控模式   | `data` + `fetchApi` 同时传 | `data` 优先展示，`fetchApi` 触发后通过 `@response` 回调 |

### 10.3 defaultTableFormatter 默认格式化器

`src/components/ProTable/formatter.ts` 导出默认格式化器，兼容项目后端 4 种响应结构：

```typescript
import { defaultTableFormatter } from '@/components/ProTable/formatter';

// 在 on-response 回调中使用
function handleResponse(res: unknown) {
  const records = defaultTableFormatter.getRecords(res);
  const total = defaultTableFormatter.getTotal(res);
}
```

### 10.4 业务改造指南

**推荐顺序**：先改造 colManage.vue 验证可行性，再推广到所有使用 ProTable 的页面。

**改造步骤**：

1. 删除 `list/loading/total/queryParams/filterQuery` 状态
2. 删除 `getList/handlePagination` 方法
3. 新增 `tableRef` 和 `searchParams` reactive
4. 新增 `handleResponse(res)` 回调处理字段映射
5. `handleQuery/handleReset` 改为更新 `searchParams` + `tableRef.init()`
6. 删除/编辑后刷新改为 `tableRef.refresh()`
7. 模板中 ProTable 添加 `:fetch-api` / `:search-params` / `@response`

**预期收益**：每个表格页面减少 50+ 行样板代码。
