# LxUI 组件库设计文档

> 版本：v1.0
> 日期：2026-09-22
> 设计源：
> - 侧边栏：`doc/stitch_侧边栏/stitch_/`（`_1` rail 模式 + `_2` 展开模式，唯一设计源）
> - 顶部/内容区组件：`doc/stitch_/stitch_/component_library_showcase/code.html`（36 类组件标本）
> - 设计令牌规范：`doc/stitch_侧边栏/stitch_/police_command_operations_system/DESIGN.md`
> 消费方：`other-admin/admin-vue3`（业务工程）

---

## 1. 背景与动机

### 1.1 现状问题

admin-vue3 已于 2026-07-27 完成 6 个阶段的视觉重构（见 `style_plan.md`），仍存在以下结构性问题：

| 问题 | 根因 |
|------|------|
| 视觉迭代成本高（单组件替换侵入 26+ 业务文件） | 组件与业务耦合在 `src/components`，无独立版本边界 |
| 样式三层层叠打架（EP 原生 + 覆盖层 + 页面 scoped） | 无单一设计令牌源（Source of Truth） |
| 主色 `#264ed1` 蓝紫系观感不满意 | 与 stitch 警务蓝 `#0060a9` 体系不一致 |
| 组件无法跨端复用（未来 H5 管理、大屏 HUD、dock 变体） | 组件库内嵌业务工程 |

### 1.2 目标

1. **视觉单一源**：所有组件视觉只由 `lx-tokens` + 组件内部样式决定，业务工程零样式覆盖。
2. **职责分离**：组件库只关心组件（props/events/slots），业务工程只关心业务（数据/权限/路由）。
3. **双形态侧边栏**：rail（64px 战术轨道）与 expanded（252px 完整导航）一键切换。
4. **渐进迁移**：新组件库与现有组件可共存，按页面逐步替换，无 big-bang 重写。

---

## 2. 总体架构

### 2.1 Monorepo 结构（pnpm workspace）

```text
linkx-fe/
├─ apps/
│  └─ admin-vue3/                 # 业务工程（other-admin 搬入）
│     ├─ src/
│     │  ├─ views/                # 业务页面
│     │  ├─ router/               # 路由与守卫
│     │  ├─ store/                # Pinia
│     │  ├─ api/                  # 接口层
│     │  ├─ composables/          # 业务 hooks（useTable 中的请求逻辑）
│     │  └─ layouts/              # 布局组装（用 lx-ui 组件拼装）
│     └─ package.json             # deps: lx-ui, lx-tokens, element-plus
├─ packages/
│  ├─ lx-tokens/                  # 设计令牌包
│  │  ├─ src/
│  │  │  ├─ variables.css         # CSS 自定义属性（亮色默认）
│  │  │  ├─ theme-dark.css        # 深色/HUD 主题预设
│  │  │  └─ index.ts              # TS 类型导出（供 JS 消费）
│  │  └─ package.json
│  └─ lx-ui/                      # UI 组件库
│     ├─ src/
│     │  ├─ components/           # 30 个组件（见 COMPONENT-SPEC.md）
│     │  ├─ styles/               # Element Plus 主题定制（消费 tokens）
│     │  └─ index.ts              # 统一导出
│     └─ package.json             # peerDeps: vue, element-plus
├─ pnpm-workspace.yaml
└─ package.json
```

### 2.2 依赖规则（单向，严禁反向）

```text
admin-vue3 ──→ lx-ui ──→ lx-tokens
    │                          ↑
    └──────────────────────────┘
admin-vue3 ──→ element-plus（原子组件直接使用）
lx-ui ──→ element-plus（允许封装，禁止重造原子组件）
```

**lx-ui 内禁止出现**：`axios`、`vue-router`、`pinia`、任何业务 API、任何业务文案硬编码。
组件需要数据的，一律通过 `props` 传入或 `slots` 由业务方渲染。

### 2.3 分层定位

| 层 | 职责 | 示例 |
|----|------|------|
| **element-plus** | 原子组件（不修改） | el-button、el-input、el-dialog |
| **lx-tokens** | 设计令牌（CSS 变量） | `--lx-color-primary`、`--lx-sidebar-width` |
| **lx-ui** | 业务级组件（Pro 层） | LxSidebar、LxProTable、LxMetricCard |
| **admin-vue3** | 业务逻辑 | views、权限、路由、API |

---

## 3. 设计令牌体系（lx-tokens）

### 3.1 技术选型：CSS Custom Properties

**为什么不用 Less / Tailwind**：
- Less 绑定预处理器，消费方必须配置 less-loader；
- Tailwind 强迫消费方安装并配置整个 Tailwind 体系；
- CSS 变量零编译依赖、**支持运行时换肤**（常规亮色 ↔ 大屏 HUD 深色一键切换）。

### 3.2 核心 Token 清单（源自 stitch_侧边栏 DESIGN.md + 双方案代码）

#### 色彩

```css
:root {
  /* 品牌主色（警务蓝） */
  --lx-color-primary: #0060a9;
  --lx-color-primary-container: #409eff;
  --lx-color-primary-light: #ecf5ff;
  --lx-color-on-primary: #ffffff;

  /* 功能语义色 */
  --lx-color-success: #67c23a;  --lx-color-success-light: #f0f9eb;
  --lx-color-warning: #e6a23c;  --lx-color-warning-light: #fdf6ec;
  --lx-color-error:   #f56c6c;  --lx-color-error-light:   #fef0f0;
  --lx-color-info:    #909399;  --lx-color-info-light:    #f4f4f5;

  /* 表面层级 */
  --lx-bg-page: #f0f2f5;
  --lx-bg-card: #ffffff;
  --lx-bg-card-hover: #f2f4f8;
  --lx-border: #e4e7ed;
  --lx-border-light: #ebeef5;

  /* 文字 */
  --lx-text-primary: #1d2129;
  --lx-text-regular: #4e5969;
  --lx-text-secondary: #86909c;

  /* 侧边栏（stitch_侧边栏 _2 展开态为基准） */
  --lx-sidebar-bg: #0c1424;
  --lx-sidebar-bg-header: #090f1b;
  --lx-sidebar-border: #1e2f47;
  --lx-sidebar-submenu-bg: #0e1728;
  --lx-sidebar-text: #cbd5e1;          /* slate-300 */
  --lx-sidebar-text-muted: #94a3b8;    /* slate-400 */
  --lx-sidebar-active-text: #7dd3fc;   /* sky-300 */
  --lx-sidebar-active-glow: #38bdf8;   /* sky-400，激活竖条 + 光晕 */
  --lx-sidebar-hover-bg: rgba(255, 255, 255, 0.05);
}
```

#### 尺寸与间距

```css
:root {
  /* 侧边栏双形态 */
  --lx-sidebar-width: 252px;           /* expanded（_2） */
  --lx-sidebar-rail-width: 64px;       /* rail（_1） */
  --lx-sidebar-item-height: 36px;      /* h-9 一级 */
  --lx-sidebar-subitem-height: 28px;   /* h-7 二级 */

  /* 壳层 */
  --lx-navbar-height: 56px;            /* h-14 */
  --lx-tabsbar-height: 36px;           /* h-9 */

  /* 间距梯度（4/8/12/16/24） */
  --lx-space-xs: 4px;
  --lx-space-sm: 8px;
  --lx-space-md: 12px;
  --lx-space-lg: 16px;
  --lx-space-xl: 24px;
}
```

#### 圆角、阴影、动效

```css
:root {
  --lx-radius-sm: 2px;    /* 微标签 */
  --lx-radius-md: 4px;   /* 按钮/输入/卡片（Element Plus 惯例） */
  --lx-radius-lg: 8px;   /* 弹窗/抽屉 */

  --lx-shadow-card: 0 1px 4px rgba(0, 21, 41, 0.08);
  --lx-shadow-pop: 0 2px 12px rgba(0, 0, 0, 0.1);
  --lx-shadow-modal: 0 4px 16px rgba(0, 0, 0, 0.15);

  /* 战术 HUD 动效（stitch_侧边栏） */
  --lx-glow-active: 0 0 8px #38bdf8;   /* 激活竖条光晕 */
}
```

### 3.3 主题预设

| 主题类 | 用途 | 挂载方式 |
|--------|------|---------|
| `:root`（默认） | 常规亮色后台 | 全局引入 `variables.css` |
| `.lx-theme-hud` | 大屏指挥中心深色 | `<html class="lx-theme-hud">` |
| `.lx-theme-rail` | rail 模式辅助类 | `<aside class="lx-sidebar--rail">` |

---

## 4. 视觉规范摘要（源自 stitch_侧边栏）

### 4.1 侧边栏双形态

| 维度 | rail 模式（`_1`） | expanded 模式（`_2`） |
|------|------------------|----------------------|
| 宽度 | 64px | 252px |
| 背景 | `#131b27` | `#0c1424`（更深，带右侧投影） |
| 品牌区 | 仅警徽 Logo + 同心环呼吸光晕 | Logo + "警务业务协同平台" 标题 |
| 一级菜单 | 图标，hover 弹出 tooltip | 图标 + 标题 + 展开箭头 |
| 激活态 | 左侧 0.5px 冰蓝竖条 + 图标发光 + 小圆点 | 渐变背景 + 1px 竖条 + 内发光 |
| 二级菜单 | hover 弹出右侧 192px popper | 内嵌缩进 + 左侧 1px 引导线 |
| 底部区 | SLA 圆环仪表(99.9%) + NODE-01 徽章 + 展开按钮 | 专网节点状态条 + 控制台设置 + 收起按钮 |

### 4.2 全局铁律（贯穿所有组件）

1. **状态收敛为 6-8px 实心圆点**，不用色块标签表达状态（StatusDot）。
2. **表格行内操作用纯文字按钮**，不用图标按钮（ActionButtons）。
3. **输入框不加装饰图标**（左侧搜索图标除外）。
4. **数字/编号/警号一律等宽字体**（`tabular-nums` + mono）。
5. **卡片阴影只允许 3 档**：`--lx-shadow-card/pop/modal`。
6. **圆角只允许 3 档**：2px / 4px / 8px。
7. **动效只允许 3 种**：`transition-colors`(0.2s)、`hudPulse`(3.5s 呼吸)、`tacticalBlink`(1.4s 告警闪烁)。

---

## 5. 组件库范围

30 个组件，4 大族（完整接口见 `COMPONENT-SPEC.md`）：

| 族 | 组件 |
|----|------|
| **侧边栏族（7）** | LxSidebar、LxSidebarBrand、LxSidebarItem、LxSidebarGroup、LxSidebarFooter、LxGauge、LxNodeBadge |
| **壳层族（4）** | LxNavbar、LxTabsBar、LxBreadcrumb、LxSplitLayout |
| **内容展示族（9）** | LxPageCard、LxSectionTitle、LxMetricCard、LxStatusDot、LxStatusSwitch、LxTag、LxCodeSlot、LxDutyCalendar、LxEmpty |
| **数据交互族（10）** | LxSearchBar、LxProTable、LxPagination、LxSelectTree、LxUpload、LxFormModal、LxConfirmDialog、LxDetailDrawer、LxToast、LxActionButtons |

### 现有组件迁移映射

| admin-vue3 现有 | → lx-ui 目标 | 动作 |
|----------------|-------------|------|
| `StatusDot` | `LxStatusDot` | 平移 + 增加状态色 token 化 |
| `StatusSwitch` | `LxStatusSwitch` | 平移 |
| `MetricCard` | `LxMetricCard` | 平移 + 支持趋势/进度条 slot |
| `SectionTitle` | `LxSectionTitle` | 收敛为 1 种 variant（border） |
| `ModernCard` | `LxPageCard` | 重命名 + token 化 |
| `SearchBar` + `useTable` | `LxSearchBar` + `LxProTable` | 拆分：UI 入库，请求逻辑留业务 composables |
| `ProTable` | `LxProTable` | **重写**：剥离 API 耦合，纯受控组件 |
| `Pagination` | `LxPagination` | 平移 |
| `PoliceId` | `LxCodeSlot` | 通用化（警号/车牌/案件号） |
| `layout/Sidebar/*` | `LxSidebar` 族 | **重写**：按 stitch_侧边栏 双形态 |
| `layout/Navbar.vue` | `LxNavbar` | 重写 |
| `Breadcrumb` | `LxBreadcrumb` | 平移 |
| `—` | 其余 16 个 | 新建 |

---

## 6. lx-ui 组件设计约定

### 6.1 命名

- 组件名：`Lx` 前缀 + PascalCase（`LxSidebar`）
- 类名：`lx-` 前缀 + BEM（`lx-sidebar__item--active`）
- props/events：camelCase，TS 类型从 `lx-tokens` 引入

### 6.2 API 设计三原则

1. **受控优先**：`modelValue` 双向绑定，组件不持有业务状态。
2. **数据无关**：组件不请求数据。ProTable 通过 `props.data` + `props.loading` 接收，分页事件 `emit` 给业务方。
3. **slot 优先于 prop**：可用 slot 定制的一律开 slot（`#header-extra`、`#toolbar`、`#empty`）。

### 6.3 样式约定

- 组件内 `<style scoped>`，颜色/间距**只允许引用 CSS 变量**（`var(--lx-*)`），禁止硬编码色值。
- 需要深度覆盖 Element Plus 的用 `:deep()`，集中在 `lx-ui/src/styles/element-theme.css`。
- 每个组件目录一个 `index.vue` + 同名 `types.ts`。

### 6.4 无障碍与响应式

- 图标按钮必须 `title` / `aria-label`（侧边栏 rail 模式依赖 title 兜底）。
- 断点沿用 admin-vue3 现有策略：768 / 1366，行为由业务层控制，组件只提供 `mode` 切换。

---

## 7. 迁移策略（admin-vue3 接入）

### 阶段 A：搭骨架（不动业务）

1. 建 monorepo，`admin-vue3` 搬入 `apps/`
2. 建 `lx-tokens`：CSS 变量落地 + 深色主题预设
3. `main.ts` 引入 `lx-tokens/variables.css`，全局变量替换 `variables.less`（Less 文件保留过渡期）

### 阶段 B：侧边栏族先行（视觉冲击最大）

1. `lx-ui` 实现 LxSidebar 族（双形态）
2. `layouts/` 用新组件拼装，替换 `layout/Sidebar/*`
3. 验证：折叠/展开/移动端抽屉/权限过滤菜单

### 阶段 C：内容族 + 交互族

1. LxPageCard / LxSectionTitle / LxStatusDot / LxMetricCard 替换现有 7 个组件
2. LxSearchBar + LxProTable 试点 2 个页面（location + nodeManage），再推广

### 阶段 D：清理

1. 删除 `src/components` 中已替换组件
2. 删除 `element-plus.less` 覆盖层中已被组件库吸收的部分
3. `variables.less` 收敛为仅业务私有样式

### 回滚保障

- 每阶段独立 PR，`workspace:*` 锁定版本
- 新旧组件共存期，按页面灰度替换，任意页面可单独回退

---

## 8. 风险与开放决策

| # | 风险/决策 | 状态 |
|---|-----------|------|
| 1 | 主色从 `#264ed1` → `#0060a9`，登录页/品牌视觉需同步调整 | ⚠️ 需确认 |
| 2 | `HarmonyOS Sans SC` 字体 vs stitch 的 `Inter` + PingFang 栈 | 建议保留现有中文字体，数字场景叠加 mono |
| 3 | Element Plus `size="large"` 全局大尺寸 vs stitch 的紧凑密度（32px 控件） | 建议改为默认尺寸 + 紧凑表格（stitch 表格行高 44-52px） |
| 4 | H5 管理端未来是否消费同一组件库 | 架构已预留（tokens 支持移动端变量覆盖），暂不实施 |
