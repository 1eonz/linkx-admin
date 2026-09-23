# 菜单路由配置驱动改造设计（MENU-CONFIG-DESIGN）

> 版本：v1.1 | 日期：2026-09-22 | 状态：**设计已确认，待后端改造后实施**
> v1.1 变更：追加 §14 引导系统智能适配（Vue3 配置驱动版），吸收 `doc/Add System Configuration Guide.md` 需求
> 范围：V3 新工程（other-admin/admin-vue3）先行落地，V2 老工程对齐同机制（JS 版）
> 关联：`ARCHITECTURE-vue3.md`（工程迁移）、`COMPONENT-AUDIT.md`（现状机制调研）

---

## 1. 背景与目标

### 1.1 现状机制（两代工程一致）

```
登录 → 后端下发全量菜单树 + 权限ID列表
  → 前端 10 个硬编码路由模块（router/modules/*.ts）
  → 责任链过滤（License → GlobalConfig → UserAuth → MenuPermission）
  → MenuPermissionFilter 用「后端 url ↔ 前端 path 字面匹配」过滤
  → addRoute 动态注册 + permissionsMenu 存 store
  → 侧边栏渲染过滤后的路由树
```

**痛点**：菜单结构（层级/形态）由前端写死，后端只能开关显隐；页面形态（菜单组/页面/tab）无法配置化调整；前端路由模块与后端菜单 url 强耦合字面匹配。

### 1.2 目标

1. **页面与路由显示完全由数据控制**：前端零代码变更，通过修改配置即可调整菜单层级、页面形态（组/页面/tab 互转）
2. **同构变形**：同一份配置数据，节点挪位置即自动变形——tab 挪到菜单层级下自动变成路由页面
3. **权限内置**：按钮权限、数据脱敏权限在配置树中预留，前端组件原生消费

---

## 2. 核心决策记录（已拍板）

| # | 决策点 | 结论 |
|---|---|---|
| 1 | 渲染形态判定 | **层级自动推导**，无类型字段；最深 3 层 |
| 2 | tab 路由语义 | **页内切换不生成路由**：tab 是页面内 el-tabs 切组件，URL 停在父页面不变；挪到菜单层级下则自动变成路由页面 |
| 3 | 组件映射主键 | **按 id 映射**：前端 `PageRegistry: Record<number, Component>`；未命中渲染占位页 |
| 4 | 配置来源 | **后端按角色下发**：接口直接返回该用户可见的配置树（后端已过滤），前端拿来即用，零二次过滤 |
| 5 | 按钮权限 | 页面节点挂 `permissions: string[]`（标准码 add/edit/delete/view + 业务自定义码），配置化消费 |
| 6 | 数据权限 | 页面节点挂 `dataScope`（范围 + 字段级 maskedFields），**骨架预留**，后端契约未定不接线 |
| 7 | 权限消费方式 | **配置下沉**（表格列 mask / 行内按钮 auth / 详情行 mask）+ `v-auth` 指令兜底零散场景 + `hasPermission()` 函数兜底 script；**不引入包裹组件** |
| 8 | 改造顺序 | V3 先落地；后端未就绪前用**本地 mock 配置文件**先行验证全链路，接口就绪后只换数据源 |

---

## 3. 数据模型（后端接口契约建议）

### 3.1 节点结构

```ts
/** 菜单配置节点（后端按角色下发，已过滤） */
export interface LxMenuNode {
  /** 唯一主键（数字）。全局唯一；同时是组件映射 key 与缓存 key */
  id: number;
  /** 显示名（菜单项/页面标题/tab 名） */
  title: string;
  /**
   * 路由段：
   * - 菜单组（L1 有 children）= 路径前缀，如 'b' → /b
   * - 页面节点 = path 段，最终 URL = /{父router}/{router}，如 'b1' → /b/b1
   * - tab 节点 = 预留无路由语义（不进路由表）
   */
  router: string;
  /** 图标名（LxIconName），仅 L1 菜单项需要 */
  icon?: string;
  /** 同层排序，升序 */
  sort?: number;
  children?: LxMenuNode[];

  /** —— 按钮权限（后端已按角色过滤，前端只消费不判断） —— */
  permissions?: string[];
  // 标准码：'add' | 'edit' | 'delete' | 'view' | 'export' | ...
  // 开放式，业务可自定义（'sync'、'import' 等）
  // 挂在页面节点（L2）上；tab 节点需独立按钮权限同样挂自己的

  /** —— 数据权限（骨架预留，后端契约未定，先定义不接线） —— */
  dataScope?: {
    scope?: 'all' | 'dept' | 'self' | 'custom';
    orgIds?: number[];        // scope=custom 时可见组织
    maskedFields?: string[];  // 需脱敏的字段码（如 'phone'、'idCard'）
  };
}
```

### 3.2 接口契约建议

```
POST /api/menu/config
请求：{ applicationId: string }
响应：{
  code: 0,
  data: {
    menu: LxMenuNode[]          // 该角色可见的配置树（后端已过滤）
  }
}
```

后端职责：权限过滤、树结构拼装、排序；前端职责：校验、推导、渲染。

### 3.3 示例配置（对应需求原始样例）

```json
[
  { "id": 1001, "title": "首页", "router": "a" },
  { "id": 1002, "title": "菜单1", "router": "b", "icon": "team", "children": [
    { "id": 1011, "title": "子路由1", "router": "b1" },
    { "id": 1012, "title": "子路由2", "router": "b2" },
    { "id": 1013, "title": "子路由3", "router": "b3" }
  ]},
  { "id": 1003, "title": "菜单2", "router": "c", "icon": "shield", "children": [
    { "id": 1021, "title": "子路由4", "router": "c1", "children": [
      { "id": 1031, "title": "tab1", "router": "c11" },
      { "id": 1032, "title": "tab2", "router": "c12" },
      { "id": 1033, "title": "tab3", "router": "c13" }
    ]},
    { "id": 1022, "title": "子路由5", "router": "c2" },
    { "id": 1023, "title": "子路由6", "router": "c3" }
  ]},
  { "id": 1004, "title": "菜单3", "router": "d", "icon": "setting" }
]
```

> 注：需求原始样例中 tab1/2/3 的 router 均为 `c11`、子路由2/3 均为 `b2`，经确认按笔误处理——同层 router 必须唯一（见 §9 校验）。

---

## 4. 形态推导规则（核心算法）

### 4.1 推导表

| 层级 | children | 形态 | 路由生成 | 侧边栏渲染 |
|---|---|---|---|---|
| L1 | 无 | **菜单直达页面**（首页/菜单3） | `/{router}` | 一级菜单项（点击直达） |
| L1 | 有 | **菜单组**（不落页面） | 前缀 `/{router}` + redirect 到首个可见子页 | 一级菜单组（展开二级） |
| L2 | 无 | **二级页面**（子路由1/2/3、5/6） | `/{父router}/{router}` | 二级菜单项 |
| L2 | 有 | **页面 + TabHost**（children 渲染为页内 tab） | 同上，URL 不随 tab 切换变化 | 二级菜单项 |
| L3 | —（不允许再有 children） | **tab 页面**（组件按 id 从 PageRegistry 取） | **不进路由表** | 不渲染在侧边栏 |

### 4.2 同构变形（本设计的核心价值）

把 tab1/2/3 从「子路由4」的 children 挪到「菜单3」的 children 下：

```
改造前：菜单3 = { id: 1004, router: 'd' }                    → 直达页面
改造后：菜单3 = { id: 1004, router: 'd', children: [
          { id: 1031, title: 'tab1', router: 'c11' },        → 变成二级路由页面 /d/c11
          { id: 1032, title: 'tab2', router: 'c12' },        → 变成二级路由页面 /d/c12
          { id: 1033, title: 'tab3', router: 'c13' } ]}      → 变成二级路由页面 /d/c13
同时：子路由4 = { id: 1021, router: 'c1', children: [] }     → 从 TabHost 还原为普通页面
```

**前端零代码变更**——路由表、菜单树、tab 结构全部由这棵配置树重新推导。

### 4.3 深度限制

- 最深 3 层，L3 节点若仍有 children：**忽略深层并输出开发警告**（`console.warn`）
- 不做递归无限嵌套（tab 内子 tab）：复杂度收益不成比，明确排除

---

## 5. 前端代码结构（menu-config 模块）

```
src/menu-config/
├── types.ts              # LxMenuNode / PermissionSource / 校验错误类型
├── config.ts             # MENU_MODE 开关（'legacy' | 'config'）+ 本地 mock 数据（后端就绪前）
├── validate.ts           # §9 校验：id 唯一 / 同层 router 唯一 / 深度检查
├── buildRoutes.ts        # 配置树 → vue-router RouteRecordRaw[]（形态推导核心）
├── flattenPermission.ts  # 配置树 → 平铺权限源（codes + maskedFields，按 pageId）
├── PageRegistry.ts       # §6 组件注册表
├── components/
│   ├── TabHost.vue       # §7 页内 tab 容器
│   └── PlaceholderPage.vue  # id 未注册占位页
└── directives/
    └── auth.ts           # §8 v-auth 指令
```

### 5.1 buildRoutes 核心逻辑（伪代码）

```ts
export function buildRoutes(menuTree: LxMenuNode[], registry: PageRegistry): AppRouteRecord[] {
  const routes: AppRouteRecord[] = [];

  for (const node of sortAsc(menuTree)) {
    const children = node.children ?? [];

    if (children.length === 0) {
      // L1 直达页面：/a → Layout 子路由
      routes.push(layoutChildRoute(`/${node.router}`, node, registry));
    } else {
      // L1 菜单组：/b 前缀 + redirect 首个可见子页
      const groupRoute: AppRouteRecord = {
        path: `/${node.router}`,
        component: Layout,
        redirect: firstVisibleChild(children),
        children: children.map(child => buildChildRoute(node.router, child, registry)),
      };
      routes.push(groupRoute);
    }
  }
  return routes;
}

function buildChildRoute(parentRouter: string, node: LxMenuNode, registry): AppRouteRecord {
  const tabs = node.children ?? [];

  return {
    path: node.router,                          // 相对段：/b/b1、/c/c1
    component: tabs.length > 0 ? TabHost : resolveComponent(node.id, registry),
    meta: {
      title: node.title,
      pageId: node.id,                          // LxAuth/mask 消费定位键
      permissions: node.permissions,            // 透传给权限源
      maskedFields: node.dataScope?.maskedFields,
      menuPath: [parentRouter, node.router],    // 面包屑反查
    },
    // TabHost 时 tab 列表注入
    ...(tabs.length > 0 ? { props: { tabs } } : {}),
  };
}

function resolveComponent(id: number, registry: PageRegistry) {
  return registry[id] ?? PlaceholderPage;      // 未注册 → 占位页（显示 id 便于排查）
}
```

### 5.2 运行时链路

```
登录 → (config 模式) 拉取 /api/menu/config（或读本地 mock）
  → validate() 校验（失败降级 legacy + 控制台错误）
  → buildRoutes() → router.addRoute() 逐个注册
  → flattenPermission() → permissionSource 存 store
  → setupLxPermission 接线（lx-ui 指令/组件消费）
  → 侧边栏直接吃配置树（LxSidebar items = menuTree）
  → 面包屑 = route.meta.menuPath 反查节点链
```

守卫改造（routerGuard.ts）：config 模式下跳过责任链与 permissions.menus 过滤，直接消费配置树；legacy 模式原样保留。

---

## 6. PageRegistry 组件注册表

前端唯一需要维护的映射表——**新增页面只改这一处**：

```ts
// src/menu-config/PageRegistry.ts
import type { Component } from 'vue';
import { markRaw } from 'vue';

export const PageRegistry: Record<number, Component> = {
  // ── id → 页面组件（id 与后端配置约定后固定，永不复用） ──
  1001: markRaw(() => import('@/views/dashboard/index.vue')),
  1011: markRaw(() => import('@/views/authority/role/index.vue')),
  1012: markRaw(() => import('@/views/authority/user/index.vue')),
  // 1031: TabHost 内 tab 组件同样在此注册
  1031: markRaw(() => import('@/views/xxx/Tab1Content.vue')),
  // ...
};
```

- **未命中 id** → `PlaceholderPage`（渲染「页面未注册：id=1024，请检查 PageRegistry」+ 开发环境红色警示），页面不白屏、问题可直视
- key 与路由解耦：router 改名/挪位置不影响组件关联，**id 即稳定契约**
- id 从 1 开始自增由后端分配，**前端只注册、不生成**

---

## 7. TabHost 页内 tab 容器

通用 tab 页面组件——L2 有 children 的页面统一渲染为它：

```vue
<!-- TabHost.vue 核心结构 -->
<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import type { LxMenuNode } from '../types';
import { PageRegistry } from '../PageRegistry';

const props = defineProps<{ tabs: LxMenuNode[] }>();

const active = ref(props.tabs[0]?.id);          // 默认第一个 tab
const panes = computed(() =>
  props.tabs.map(t => ({
    id: t.id,
    title: t.title,
    component: PageRegistry[t.id],              // 未注册 → 占位
  })),
);
</script>

<template>
  <div class="lx-tab-host">
    <el-tabs v-model="active">
      <el-tab-pane v-for="p in panes" :key="p.id" :name="p.id">
        <template #label>{{ p.title }}</template>
        <keep-alive>
          <component :is="p.component ?? PlaceholderPage" :page-id="p.id" />
        </keep-alive>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
```

**行为约定**：
- URL 停留在父页面（`/c/c1`），**刷新后回到默认第一个 tab**（不记忆）——tab 不进路由表的自然结果
- keep-alive 在 TabHost 内部按 tab 组件缓存，切 tab 不丢状态
- children 数量/顺序增减由配置直接反映，TabHost 零改动
- tab 节点的 `permissions`（按钮权限）随 props 传入各 tab 组件，消费方式与页面级一致

---

## 8. 权限体系设计（配置下沉 + 指令兜底）

### 8.1 权限源注入（lx-ui 保持 P7 零请求）

```ts
// 宿主 main.ts（一行接入）
import { setupLxPermission } from 'lx-ui';
import { flattenPermission } from '@/menu-config/flattenPermission';

const menuTree = await getMenuConfig();
setupLxPermission(() => userStore.permissionSource);
// permissionSource = flattenPermission(menuTree) 的产物：
// {
//   codes:        { [pageId]: Set<'add' | 'edit' | ...> },
//   maskedFields: { [pageId]: Set<'phone' | 'idCard' | ...> },
//   current: () => route.meta.pageId    // 当前页面定位
// }
```

lx-ui 只消费注入的响应式数据源，不拉取、不缓存、不感知后端。

### 8.2 四层消费（按场景选型，模板零噪音优先）

**第 1 层：表格列配置 `mask`**（最高频脱敏场景，模板零改动）

```ts
columns: [
  { key: 'phone',  label: '联系电话', mask: true },   // 无权限 → ***
  { key: 'idCard', label: '身份证号', mask: '-' },    // 自定义占位
]
// LxProTable 渲染 cell 时内部查 route.meta.maskedFields
```

**第 2 层：详情行配置 `mask`**（LxDescriptions 同规格）

```ts
items: [
  { label: '联系电话', value: row.phone, mask: true },
]
```

**第 3 层：行内按钮 `auth`**（LxActionButtons 字段增强）

```ts
actions: [
  { label: '编辑', auth: 'edit' },
  { label: '删除', type: 'danger', auth: 'delete' },   // 组件内部自动判权过滤
]
// 不传 auth = 兼容现状（业务用 hidden 自控）
```

**第 4 层：`v-auth` 指令**（零散按钮/文本兜底）

```vue
<el-button v-auth="'add'">新增</el-button>            <!-- 无权 → DOM 移除（默认） -->
<el-button v-auth.hide="'export'">导出</el-button>    <!-- 无权 → visibility 占位隐藏 -->
<el-button v-auth.disable="'sync'">同步</el-button>    <!-- 无权 → 置灰禁点 -->
<span v-auth.mask:phone>{{ row.phone }}</span>         <!-- 无权 → ***（arg=字段码） -->
```

**函数兜底**（仅 script 逻辑，如动态显隐整块区域）：

```ts
import { hasPermission, hasField } from 'lx-ui';
const showImport = computed(() => hasPermission('import'));
```

### 8.3 v-auth 指令实现规格

```ts
type AuthBinding = string | string[];

export const vAuth: Directive<HTMLElement, AuthBinding> = {
  mounted(el, binding) { apply(el, binding); },
  updated(el, binding) { apply(el, binding); },   // 权限数据变化重判
};

function apply(el, binding) {
  const pass = checkPermission(binding.value, binding.modifiers.all ? 'all' : 'any');
  if (pass) return;
  if (binding.modifiers.hide) {
    el.style.visibility = 'hidden';
  } else if (binding.modifiers.disable) {
    el.classList.add('is-disabled');
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.5';
  } else {
    el.parentNode?.removeChild(el);
  }
}
```

**指令三件套对应**：`v-auth.disable="'sync'"` → value=`'sync'` / modifiers=`{disable:true}`；`v-auth.mask:phone` → arg=`'phone'`（查 maskedFields 后替换 textContent）。

**⚠️ 组件上使用的边界**：指令作用于**组件根 DOM 节点**，不穿透子组件——EP 单根组件（button/input/tag）可靠；**多根 fragment 组件静默忽略**（Vue 3 行为），此类场景改用 v-if + hasPermission()。这正是表格脱敏走列配置而非指令的原因。

### 8.4 dataScope 骨架预留（不接线）

- `scope/orgIds`：**纯模型预留**——数据行过滤属后端职责（列表接口按角色返回），前端不消费不判断；未来如需前端过滤再接 `hasDataScope()` 函数
- `maskedFields`：**已接线**（§8.2 第 1/2/4 层消费）

---

## 9. 校验规则（validate.ts）

登录拉到配置树后立即执行，**任何一条失败 → 降级 legacy 模式 + console.error 明示**：

| # | 规则 | 级别 | 处理 |
|---|---|---|---|
| 1 | `id` 全局唯一 | **错误** | 降级（重复 id 导致权限/缓存错乱） |
| 2 | 同层 `router` 唯一 | **错误** | 降级（路由冲突） |
| 3 | `router` 命名合法（`^[a-zA-Z][\w-]*$`，不以 `/` 开头——L1 除外拼装规则） | 错误 | 降级 |
| 4 | 深度 > 3 层 | **警告** | 忽略深层节点继续渲染，`console.warn` 输出被忽略的节点 |
| 5 | L2 节点 `children` 中的 L3 节点仍带 `children` | 警告 | 同上，忽略 L4+ |
| 6 | id 未在 PageRegistry 注册 | 警告 | 渲染占位页（不降级，问题可直视） |
| 7 | 菜单组无可见子页 | 正常 | 整组隐藏（组无页面可落，redirect 无目标） |

> 建议 #1/#2 后端接口同时校验报错（422 + 明细），前端校验为兜底。

---

## 10. 缓存策略

| 层面 | 策略 |
|---|---|
| 页面级 keep-alive | route `name` = `\`page-${id}\``，AppMain `<keep-alive :include>` 按需缓存（接线现有 useKeepAliveStore 基建） |
| tab 级 | TabHost 内部 keep-alive（§7），tab 切换不丢状态；**刷新回默认第一个 tab** |
| 配置树 | Pinia store 持有；登出清空；**刷新页面不重复拉取**（store 序列化或守卫内存判断） |
| 权限源 | flattenPermission 产物 computed 化，配置树不变则不重算 |

---

## 11. 迁移策略

### 11.1 Feature Flag

```ts
// src/menu-config/config.ts
export const MENU_MODE: 'legacy' | 'config' = 'legacy';   // 切换开关，默认 legacy
```

- **legacy**：现有责任链机制原样运行（生产保底）
- **config**：新机制接管；mock 阶段（后端未就绪）从本地文件读取配置树

### 11.2 三阶段落地

| 阶段 | 前置 | 内容 | 验收 |
|---|---|---|---|
| **S1 mock 验证** | 无（后端未动工） | menu-config 模块全量实现 + 本地 mock 配置（含 tab 组/变形样例）+ feature flag | 切 config 模式：菜单渲染/路由跳转/tab 切换/变形对照/占位页/权限指令 全链路可演示 |
| **S2 接口对接** | 后端 /api/menu/config 就绪 | mock → 接口切换（`fetchMenuConfig()` 单点替换）；后端按角色过滤 | 同一账号 legacy/config 两模式菜单一致 |
| **S3 全量切换** | S2 灰度无回归 | `MENU_MODE='config'` 设为默认；V2 老工程 JS 版对齐（同算法移植 menu-config 模块）；清理责任链死代码（保留一版灰度） | V2/V3 双工程同机制 |

### 11.3 需同步的后端改造项（本文档即契约）

1. 新增 `/api/menu/config` 接口：按角色下发过滤后的配置树（§3.2）
2. 菜单管理后台支持三层结构编辑 + `permissions`/`dataScope` 字段维护
3. id 分配策略：数字自增全局唯一，**永不复用**
4. 接口侧校验：id 唯一 / 同层 router 唯一 / 深度 ≤3
5. 现有 `/api/menu/list` + 权限接口 legacy 期间保留不动

---

## 12. 边界场景汇总

| 场景 | 行为 |
|---|---|
| id 未注册 PageRegistry | 占位页渲染（显示 id + 排查指引），不白屏 |
| 配置校验失败 | 降级 legacy 模式 + console.error |
| 菜单组空子集 | 整组隐藏 |
| L4+ 深层节点 | 忽略 + console.warn |
| tab 刷新 | 回默认第一个 tab（URL 不记忆） |
| 未注入权限源 | LxAuth 系全部放行（开发期友好）+ 一次性警告 |
| legacy/config 并存 | flag 切换；legacy 的 permissions.actions 按钮权限机制在 config 模式下废弃（由节点 permissions 取代） |

---

## 13. 开放问题（后续与后端对齐时确认）

| # | 问题 | 当前处理 |
|---|---|---|
| 1 | `dataScope.scope/orgIds` 前端是否需要消费（行级过滤 vs 后端过滤） | 纯模型预留，不接线 |
| 2 | 按钮权限码全集（add/edit/delete/view 之外的业务码） | 开放式 string[]，业务自定义 |
| 3 | 首页是否固定（不进配置树） | 进配置树（样例含首页节点）；登录 redirect 规则 = 配置树首个 L1 可达页面 |
| 4 | 菜单是否需要运行时刷新（管理端改配置，用户端何时生效） | 下次登录生效（拉取时机=登录后首次导航）；在线刷新留待后续 |
| 5 | V2 老工程是否值得移植 config 模式（还是仅 V3） | 设计按双工程对齐；若 V2 停止迭代可放弃 |

---

## 14. 引导系统智能适配（Vue3 配置驱动版）

> 吸收 `doc/Add System Configuration Guide.md`（Vue2 引导需求：17 页 / 约 85 步、driver.js 1.6、首次弹窗询问、Navbar 重播、登出保留缓存、仅中文）。
> Vue3 落地时引导**不能照搬 Vue2 方案**——配置驱动后路由与页面形态均为动态，需要智能匹配。

### 14.1 配置驱动带来的三个新难题

| # | 难题 | Vue2 假设（已失效） | Vue3 现实 |
|---|---|---|---|
| 1 | **注册键不稳定** | 引导按 `route.path` 注册（如 `/baseData/globals`） | path 由配置树 `router` 字段动态生成，改名即全部失效 |
| 2 | **tab 结构动态** | 页面内 el-tabs 写死（如通信服务管理 3 个 tab） | tab = L2 节点的 children，**可被配置增删/挪走**（同构变形） |
| 3 | **内容渲染位置漂移** | 功能模块 ↔ 页面一一对应，锚点位置固定 | 同一功能模块今天是 TabHost 里的一个 tab（懒渲染，`display:none` 或未挂载），明天被配置成独立路由页面——**同一内容组件的 DOM 位置随配置漂移**，driver.js 锚点定位必须先保证「内容可见且已渲染」 |

### 14.2 核心解法：注册键 route.path → **pageId**

```ts
// 引导注册表（前端维护，与 PageRegistry 同目录约定）
// src/guide/registry.ts
export const GuideRegistry: Record<number, GuideConfig> = {
  //          └── 键 = 配置节点 id（永不复用的稳定契约，§6 同源）
  1001: { version: 'v1', steps: [...] },   // 首页
  1021: { version: 'v1', steps: [...] },   // 子路由4（TabHost 页）
  1031: { version: 'v1', steps: [...] },   // tab1 —— tab 节点也独立注册！
};
```

- `buildRoutes` 已把 `pageId` 写入 `route.meta`（§5.1）→ 守卫 afterEach 直接查表，**path 改名零影响**
- **tab 节点独立注册**：tab 内容有自己的功能引导时，用 tab 自己的 id 注册；配置把它挪成独立页面后，引导随 id 走，无需改配置——这是「引导跟着配置走」的关键
- 缓存 key 同步换键：`guide:done:{userId}:{pageId} → version`（版本号 bump 可对老用户重触发，沿用 Vue2 已确认机制）

### 14.3 智能匹配与播放协议（含形态漂移自适应）

```
afterEach → route.meta.pageId → GuideRegistry 命中？
  → 未引导过 → 弹窗询问「是否查看功能引导」（Vue2 已确认交互）
  → 播放，逐步骤：
      步骤元素定位（智能等待三连）：
      ① 当前页面是 TabHost（meta 有 tabs 注入）？
         └ 步骤声明 tabId？→ TabHost.activateTab(tabId) → 等 tab 渲染完成
      ② nextTick + requestAnimationFrame + 超时兜底（~600ms）
      ③ 元素仍不存在 → 静默跳过该步（权限隐藏/形态漂移）+ dev 警告
```

**形态漂移的三种自适应场景**：

| 场景 | 配置变化 | 引导行为 |
|---|---|---|
| tab 挪走变页面 | 子路由4 的 children 里 tab1 被挪到菜单3 下 | 原 1021 配置中 tabId=1031 的步骤**自动跳过**（该 tab 不在本页 children 里，校验配置树）；新页面 1031 的 GuideConfig（若注册）在新页面触发 |
| tab 顺序/数量变化 | children 增删 | tabId 匹配为准，顺序无关；新 tab 无步骤则不引导 |
| 节点改 router | router: 'c1' → 'c9' | pageId 不变 → 引导/缓存全部不受影响 |

### 14.4 TabHost 引导协议（组件 expose 契约）

TabHost 需为引导暴露标准接口（§7 组件增强）：

```ts
// TabHost expose
interface TabHostExposed {
  /** 激活指定 tab 并等待其内容渲染完成（首次挂载含异步组件加载） */
  activateTab(tabId: number): Promise<void>;
  /** 当前页面全部 tab 节点（供 runner 校验步骤 tabId 是否存在于本页） */
  getTabs(): LxMenuNode[];
}
```

- **runner ↔ TabHost 握手**：引导 runner 从 `route.meta` 判断当前页为 TabHost → 通过 AppMain 挂载的组件实例 ref 调 `activateTab`（AppMain 统一 `ref="pageInstance"` 透传，或 provide/inject 注册表）
- **el-tabs 惰性渲染处理**：tab-pane 内容未激活时不在可见区（或未挂载）→ **必须先 activateTab 再定位锚点**，禁止 driver.js 高亮 `display:none` 元素
- **tab 切换完成事件**：activateTab 内部 `v-model` 更新 + `nextTick` + `requestAnimationFrame` 双帧确认后 resolve（覆盖懒加载首挂）

### 14.5 引导步骤结构（GuideStep，Vue3 版）

```ts
interface GuideStep {
  /** 锚点 CSS 选择器（锚点 class 约定沿用 Vue2：guide-xxx 专用类，不得随意删改） */
  target: string;
  title: string;
  content: string;
  /** 智能tab：该步内容所在的 tab 节点 id。
   *  - 页面级步骤（搜索区/工具栏）不传
   *  - 仅当当前页是 TabHost 且 tabId 在其 children 中才有效，否则静默跳过 */
  tabId?: number;
  /** 该步开始前自动执行的准备动作（如等待异步表格首屏数据，可选） */
  waitFor?: () => Promise<void>;
}
```

### 14.6 基础设施落位（V3 工程）

```
src/guide/
├── index.ts        # runner：driver() 初始化、智能等待三连、播放、销毁（路由切换）
├── storage.ts      # guide:done:{userId}:{pageId} → version
├── registry.ts     # GuideRegistry 汇总各模块 steps 配置
└── configs/        # 按业务模块拆分（复用 doc/GUIDE-CONTENT-PLAN.md 文案清单）
```

- **driver.js 1.6 集成**：依赖直接装 V3 工程（Vite，无 Vue2 webpack4 transpile 问题）；popover 主题色走 `--lx-color-primary` 令牌
- **文案复用**：`doc/GUIDE-CONTENT-PLAN.md`（17 页 85 步）直接沿用——步骤按功能模块编写与注册键无关，迁移只是把「path → 配置」换成「pageId → 配置」
- **Navbar 重播按钮**：仅当前页 pageId 在 GuideRegistry 时显示
- **Vue2/Vue3 双轨期**：V2 按 route.path 版实现（原文档方案），V3 按 pageId 版；菜单配置改造 S3 全量落地后（V2 也吃配置树），V2 引导注册键切换为 pageId（迁移成本一次性）

### 14.7 引导配置的后端预留（可选，暂不实现）

`LxMenuNode` 预留可选 `guide` 字段（后端契约暂不实现，仅占位防将来要「引导步骤也配置化」时改数据模型）：

```ts
interface LxMenuNode {
  // ...既有字段
  /** 预留：引导内容版本（后端下发时用；现阶段前端 GuideRegistry 自带 version，字段忽略） */
  guideVersion?: string;
}
```

> 现阶段引导步骤纯前端维护（registry.ts）；若未来产品要求引导文案后端可配，再启用此字段做下发通道，前端结构不变。

---

*本文档为前后端改造契约基线。实施时前端以 S1 mock 阶段先行，与后端改造并行推进；引导系统（§14）在 S1 完成后接入（依赖 pageId meta 注入与 TabHost 协议）。*
