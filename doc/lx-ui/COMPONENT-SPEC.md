# LxUI 组件接口规范

> 版本：v1.0 | 日期：2026-09-22
> 设计源：侧边栏族 = `doc/stitch_侧边栏/stitch_/`（唯一源）；其余 = `doc/stitch_/stitch_/component_library_showcase`
> 约定：所有组件名 `Lx` 前缀；类名 `lx-` BEM；样式只引用 `var(--lx-*)` CSS 变量；组件内禁止 axios/router/store/业务 API。

---

## 类型总表（lx-tokens 导出，全组件共用）

```ts
/** 语义状态（贯穿 StatusDot / Tag / Switch / MetricCard） */
type LxStatus = 'online' | 'processing' | 'busy' | 'error' | 'offline' | 'success' | 'warning';

/** 侧边栏形态 */
type LxSidebarMode = 'rail' | 'expanded';

/** 通用尺寸 */
type LxSize = 'small' | 'default' | 'large';

/** 菜单数据节点（业务方从权限菜单接口映射后传入） */
interface LxMenuItem {
  key: string;                    // 唯一标识（路由 name）
  title: string;                  // 显示标题
  icon?: string;                  // svg 图标名（lx-ui 内置 svg-sprite）
  path?: string;                  // 路由地址（直达项）
  children?: LxMenuItem[];        // 二级菜单
  badge?: number | string;        // 角标（如预警数量）
  badgeType?: LxStatus;           // 角标颜色
  disabled?: boolean;
  meta?: Record<string, unknown>; // 业务透传（如权限标识）
}
```

---

# 一、侧边栏族（7 个，源自 stitch_侧边栏）

## 1. LxSidebar — 侧边栏容器

双形态容器。rail（64px，源自 `_1`）与 expanded（252px，源自 `_2`）。

```ts
// Props
interface Props {
  /** 当前形态：expanded=252px（_2）/ rail=64px（_1） */
  mode?: LxSidebarMode;                    // default: 'expanded'
  /** 菜单数据（业务方从权限菜单接口映射） */
  items?: LxMenuItem[];                    // default: []
  /** 激活项 key（受控，通常绑 route.name） */
  activeKey?: string;
  /** 默认展开的二级菜单 keys */
  expandedKeys?: string[];
  /** 品牌标题（expanded 显示，rail 隐藏） */
  title?: string;                          // default: '警务业务协同平台'
  /** 移动端抽屉模式 */
  mobile?: boolean;                        // default: false
  /** 是否显示底部状态区 */
  showFooter?: boolean;                    // default: true
  /** 深度（expanded 时右侧投影 _2 风格） */
  shadow?: boolean;                        // default: true
}

// Events
interface Events {
  (e: 'update:mode', mode: LxSidebarMode): void;         // 切换形态
  (e: 'select', item: LxMenuItem): void;                  // 点击直达项
  (e: 'expand-change', keys: string[]): void;            // 二级展开变化
}

// Slots
interface Slots {
  /** 品牌区替换（默认渲染 LxSidebarBrand） */
  brand?(): unknown;
  /** 菜单项后追加自定义区块 */
  append?(): unknown;
  /** 底部状态区替换（默认渲染 LxSidebarFooter） */
  footer?(): unknown;
}

// Expose
interface Expose {
  /** 编程式切换形态 */
  toggleMode(): void;
  /** 展开/折叠指定二级组 */
  toggleGroup(key: string): void;
}
```

## 2. LxSidebarBrand — 品牌区

`_1`：警徽 Logo + 同心环呼吸光晕（hudPulse 3.5s）；`_2`：Logo + 标题。

```ts
interface Props {
  /** rail 模式下自动只渲染 Logo */
  mode?: LxSidebarMode;            // default: 'expanded'
  title?: string;                  // default: '警务业务协同平台'
  /** Logo 图标名（内置 svg-sprite） */
  logo?: string;                   // default: 'lx-logo-police'
  /** 点击跳转地址 */
  to?: string;                     // default: '/'
}
interface Events {
  (e: 'click', evt: MouseEvent): void;
}
```

## 3. LxSidebarItem — 一级菜单项

```ts
interface Props {
  item: LxMenuItem;
  mode?: LxSidebarMode;
  active?: boolean;                // default: false
}
interface Events {
  (e: 'select', item: LxMenuItem): void;
}
```

视觉规格：
- expanded：`h-9` 图标 + 标题，激活 = 渐变背景 `sky-500/20→transparent` + 1px 竖条 `--lx-sidebar-active-glow` 发光
- rail：`h-12` 居中图标，hover 弹出右侧 tooltip（`bg #162032`，`_1` 规格）

## 4. LxSidebarGroup — 二级菜单组

```ts
interface Props {
  item: LxMenuItem;                // 含 children
  mode?: LxSidebarMode;
  activeKey?: string;
  expanded?: boolean;              // default: true
}
interface Events {
  (e: 'select', item: LxMenuItem): void;
  (e: 'toggle', expanded: boolean): void;
}
```

视觉规格：
- expanded：内嵌子菜单，左侧 1px 引导线（`#22354f`），激活子项 = `sky-950/60` 背景 + 1.5px 圆点
- rail：hover 弹出 192px popper，标题栏 + 子项列表（`_1` 规格，选中项带 ✓ 图标）

## 5. LxSidebarFooter — 底部状态区

`_1`：SLA 圆环 + NODE 徽章 + 展开按钮；`_2`：专网状态条 + 控制台 + 收起按钮。

```ts
interface Props {
  mode?: LxSidebarMode;
  /** 链路健康度（0-100，rail 圆环仪表） */
  sla?: number;                    // default: 100
  /** 节点标识 */
  node?: string;                   // default: 'NODE-01'
  /** 节点在线状态 */
  nodeStatus?: LxStatus;           // default: 'online'
  /** 延迟展示文案（expanded 专网条） */
  latencyLabel?: string;           // e.g. 'AP-SEC-01 · 12ms'
}
interface Events {
  (e: 'toggle-mode'): void;        // 点击展开/收起按钮
  (e: 'settings'): void;           // 点击控制台设置
}
```

## 6. LxGauge — 圆环仪表（通用）

源自 `_1` 底部 SLA 仪表（SVG stroke-dasharray 实现），可独立复用。

```ts
interface Props {
  /** 数值 0-100 */
  value?: number;                  // default: 0
  /** 直径 px */
  size?: number;                   // default: 40
  /** 数值色（低于阈值自动变 warning/error） */
  status?: LxStatus;               // default: 'online'
  /** 数值文案（如 '99.9'） */
  label?: string;
  /** 副文案（如 '%'） */
  subLabel?: string;
}
```

## 7. LxNodeBadge — 节点徽章

源自 `_1` NODE-01 徽章 / `_2` 专网状态条。

```ts
interface Props {
  label?: string;                  // e.g. 'NODE-01' / 'AP-SEC-01'
  status?: LxStatus;               // default: 'online'
  /** 附加文案（expanded 模式，如 '专网'） */
  tag?: string;
  pulse?: boolean;                 // default: true（呼吸点）
}
```

---

# 二、壳层族（4 个）

## 8. LxNavbar — 顶栏

源自两方案共享顶栏：白色 `#ffffff`、`h-14`、面包屑 + 搜索 + 状态徽章 + 通知 + 全屏 + 用户。

```ts
interface Props {
  /** 搜索框占位文案；传空串则隐藏搜索 */
  searchPlaceholder?: string;      // default: '搜索…'
  /** 通知数量；不传则隐藏 */
  notificationCount?: number;
  /** 右侧网络状态徽章文案；不传则隐藏 */
  networkLabel?: string;           // e.g. '协同专网在线 · License 正常'
  networkStatus?: LxStatus;       // default: 'online'
  /** 用户显示信息 */
  user?: { name: string; role?: string; avatar?: string };
}
interface Events {
  (e: 'search', keyword: string): void;
  (e: 'notification-click'): void;
  (e: 'fullscreen-toggle', full: boolean): void;
  (e: 'user-command', cmd: 'profile' | 'password' | 'logout'): void;
}
interface Slots {
  leading?(): unknown;             // 左侧面包屑前（放模式切换按钮）
  breadcrumb?(): unknown;         // 覆盖默认面包屑
  trailing?(): unknown;            // 右侧操作区追加
}
```

## 9. LxTabsBar — 页签栏

浏览器风格页签（`h-9`，激活 = 白底 + 主色文字 + 顶部圆角）。

```ts
interface LxTabItem { key: string; title: string; closable?: boolean; }

interface Props {
  tabs?: LxTabItem[];              // default: []
  modelValue?: string;             // 激活 key（受控）
}
interface Events {
  (e: 'update:modelValue', key: string): void;
  (e: 'close', key: string): void;
  (e: 'context-menu', evt: { key: string; x: number; y: number }): void;  // 右键菜单
}
```

## 10. LxBreadcrumb — 面包屑

```ts
interface LxBreadcrumbItem { title: string; to?: string; }

interface Props {
  items?: LxBreadcrumbItem[];      // default: []
  separator?: string;              // default: '/'
}
interface Events {
  (e: 'select', item: LxBreadcrumbItem): void;
}
```

## 11. LxSplitLayout — 树 + 表分栏容器

6 个业务模块通用骨架（协同岗/组织/角色/自定义组织/权限矩阵/节点管理）。

```ts
interface Props {
  /** 左侧面板宽度 */
  asideWidth?: number | string;    // default: 280
  /** 是否可拖拽调整 */
  resizable?: boolean;             // default: false
  /** 折叠左侧 */
  collapsed?: boolean;             // default: false
}
interface Slots {
  aside?(): unknown;               // 左侧（通常 LxSelectTree）
  default?(): unknown;             // 右侧主内容
}
interface Events {
  (e: 'update:collapsed', v: boolean): void;
  (e: 'resize', width: number): void;
}
```

---

# 三、内容展示族（9 个）

## 12. LxPageCard — 页面卡片容器

```ts
interface Props {
  title?: string;
  subtitle?: string;
  /** 是否通栏白卡（false 时无 padding，用于嵌表格） */
  bodyPadding?: boolean;           // default: true
  /** 底部 footer（如统计行） */
  bordered?: boolean;              // default: true
  loading?: boolean;               // default: false
}
interface Slots {
  headerExtra?(): unknown;         // 标题右侧操作区
  default?(): unknown;
  footer?(): unknown;
}
```

视觉：`bg #fff`、`border 1px var(--lx-border)`、`radius 4px`、`shadow var(--lx-shadow-card)`、header `h-12`。

## 13. LxSectionTitle — 区块标题

收敛为单一 variant（border 左竖条风格，stitch 主风格）。

```ts
interface Props {
  title: string;
  subtitle?: string;
}
interface Slots {
  extra?(): unknown;              // 右侧操作区（如刷新按钮）
}
```

视觉：左侧 `3px` 主色竖条 + 14px SemiBold 标题。

## 14. LxMetricCard — 指标卡

stitch Dashboard 四栏统计卡规格。

```ts
interface Props {
  label?: string;                  // e.g. '今日协同在岗警力'
  value?: number | string;         // e.g. 1428
  unit?: string;                   // e.g. '人'
  /** 徽章文案（如 '在岗率 94.6%'） */
  badge?: string;
  badgeStatus?: LxStatus;          // default: 'online'
  /** 趋势文案（如 '+8.4% 环比昨日'） */
  trend?: string;
  trendStatus?: LxStatus;          // 'online'↑ / 'error'↓
  /** 底部进度条百分比 0-100；不传则隐藏 */
  progress?: number;
  /** 底部说明 */
  footerLabel?: string;
  footerValue?: string;
}
interface Slots {
  /** 值区域右侧（如 sparkline 迷你图） */
  extra?(): unknown;
}
```

视觉：数值 `text-3xl font-mono tabular-nums`，进度条 `h-1.5 rounded-full bg #ebeef5`。

## 15. LxStatusDot — 状态点

铁律：状态一律用圆点，不用色块。

```ts
interface Props {
  status?: LxStatus;               // default: 'offline'
  size?: number;                   // default: 8（rail 徽章用 6）
  pulse?: boolean;                 // default: true（online 呼吸）
  statusDesc?: string;             // 状态文案（showText 时显示）
  showText?: boolean;             // default: false
}
```

## 16. LxStatusSwitch — 状态开关

```ts
interface Props {
  modelValue?: boolean | number;   // 支持 0/1
  loading?: boolean;               // default: false
  disabled?: boolean;              // default: false
  /** 切换前确认（危险操作） */
  confirm?: string | false;        // default: false
}
interface Events {
  (e: 'update:modelValue', v: boolean): void;
  (e: 'change', v: boolean): void;
}
```

## 17. LxTag — 语义标签

浅底深字风格（`_ecf5ff/#409eff` 系）。

```ts
interface Props {
  status?: LxStatus;               // default: 'online'
  /** 自定义文字色/底色（覆盖 status） */
  color?: string;
  bgColor?: string;
  size?: LxSize;                   // default: 'small' → h-6 text-xs
  dot?: boolean;                   // default: true（前置圆点）
  closable?: boolean;              // default: false
}
interface Slots { default?(): unknown; }
interface Events { (e: 'close'): void; }
```

## 18. LxCodeSlot — 等宽代码槽

警号/车牌/案件号/设备编号专用（`_1` Plate & ID Tag 规格）。

```ts
interface Props {
  /** 是否可复制（点击复制 + toast） */
  copyable?: boolean;              // default: true
  /** 显示宽度截断 */
  ellipsis?: boolean;              // default: false
}
interface Slots { default?(): unknown; }
```

视觉：`font-mono` + `bg #f4f4f5` + `border #e9e9eb` + `radius 2px` + `px-1.5`。

## 19. LxDutyCalendar — 排班日历网格

`_21/_24` 日历网格规格。

```ts
interface LxDutyShift {
  date: string;                    // 'YYYY-MM-DD'
  label: string;                   // 班次名（早班/中班/夜班）
  status?: LxStatus;
  count?: number;                  // 在岗人数
}

interface Props {
  month?: string;                 // 'YYYY-MM'（受控）
  shifts?: LxDutyShift[];          // default: []
  /** 周起始日 */
  weekStart?: 0 | 1;               // default: 1
}
interface Events {
  (e: 'update:month', m: string): void;
  (e: 'cell-click', date: string): void;
  (e: 'shift-click', shift: LxDutyShift): void;
}
interface Slots {
  cell?({ date, shifts }): unknown;  // 自定义单元格渲染
}
```

## 20. LxEmpty — 空状态

```ts
interface Props {
  description?: string;            // default: '暂无数据'
  /** 图标尺寸 */
  size?: LxSize;                   // default: 'default'
}
interface Slots {
  default?(): unknown;             // 图标区替换
  footer?(): unknown;              // 操作区（如"新建"按钮）
}
```

---

# 四、数据交互族（10 个）

## 21. LxSearchBar — 检索面板

纯 UI 表单面板，**不含请求逻辑**（请求由业务 composable 发起）。

```ts
interface LxSearchField {
  key: string;
  label: string;
  type: 'input' | 'select' | 'date' | 'daterange' | 'number' | 'tree-select' | 'cascader';
  options?: { label: string; value: string | number }[];
  placeholder?: string;
  defaultValue?: unknown;
  span?: number;                   // 栅格占位（24 制），default: 6
}

interface Props {
  fields?: LxSearchField[];        // default: []
  modelValue?: Record<string, unknown>;   // 受控值
  loading?: boolean;               // default: false
  /** 收起/展开（字段多时） */
  collapsible?: boolean;           // default: true
  collapsed?: boolean;             // default: true
  /** 查询按钮文案 */
  searchText?: string;             // default: '查询'
}
interface Events {
  (e: 'update:modelValue', v: Record<string, unknown>): void;
  (e: 'search'): void;
  (e: 'reset'): void;
}
```

## 22. LxProTable — 数据表格

**剥离 API 耦合的纯受控表格**（现有 ProTable 的请求逻辑移入业务 `useTable` composable）。

```ts
interface LxTableColumn {
  key: string;
  label: string;
  width?: number | string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  /** 格式化（纯函数，禁止请求） */
  formatter?: (row: any, column: LxTableColumn, cellValue: unknown) => string;
  /** 单元格类型快捷方式 */
  type?: 'index' | 'selection' | 'expand';
  /** 可排序（后端排序：sort-key） */
  sortable?: boolean | 'custom';
  showOverflowTooltip?: boolean;   // default: true
}

interface Props {
  columns?: LxTableColumn[];       // default: []
  data?: any[];                    // default: []（受控，业务方传）
  loading?: boolean;               // default: false
  /** 紧凑密度（行高 36px） */
  compact?: boolean;               // default: false（常规 44px）
  /** 斑马纹 */
  stripe?: boolean;                // default: false
  rowKey?: string;                 // default: 'id'
  selectedKeys?: (string | number)[];  // 受控选择
  /** 空数据由 LxEmpty 渲染 */
  emptyText?: string;
}

interface Events {
  (e: 'selection-change', rows: any[]): void;
  (e: 'sort-change', payload: { key: string; order: 'asc' | 'desc' }): void;
  (e: 'row-click', row: any): void;
  (e: 'expand-change', row: any, expanded: boolean): void;
}

interface Slots {
  /** 列自定义单元格（#cell-[key]） */
  [cell: `cell-${string}`]: (scope: { row: any; index: number }) => unknown;
  /** 列表头自定义（#header-[key]） */
  [header: `header-${string}`]: (scope: { column: LxTableColumn }) => unknown;
  toolbar?(): unknown;            // 表格右上工具区
  empty?(): unknown;              // 空状态替换
  append?(): unknown;             // 表尾追加
}
```

## 23. LxPagination — 分页

```ts
interface Props {
  total?: number;                  // default: 0
  page?: number;                   // default: 1
  pageSize?: number;               // default: 20
  pageSizes?: number[];            // default: [10, 20, 50, 100]
  layout?: string;                 // default: 'total, sizes, prev, pager, next, jumper'
}
interface Events {
  (e: 'update:page', v: number): void;
  (e: 'update:pageSize', v: number): void;
  (e: 'change', page: number, pageSize: number): void;
}
```

## 24. LxSelectTree — 树选择器

支持懒加载（组织机构场景），封装 el-tree-select。

```ts
interface LxTreeNode {
  id: string | number;
  label: string;
  children?: LxTreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
}

interface Props {
  modelValue?: string | number | (string | number)[];
  data?: LxTreeNode[];             // default: []（静态数据）
  /** 懒加载（业务传入请求函数——注意：函数由业务实现，组件仅调用） */
  load?: (node: LxTreeNode, resolve: (children: LxTreeNode[]) => void) => void;
  multiple?: boolean;              // default: false
  checkStrictly?: boolean;         // default: false
  filterable?: boolean;            // default: true（树内搜索）
  placeholder?: string;            // default: '请选择'
}
interface Events {
  (e: 'update:modelValue', v: unknown): void;
  (e: 'node-click', node: LxTreeNode): void;
}
```

## 25. LxUpload — 上传拖拽区

```ts
interface Props {
  modelValue?: any[];               // 文件列表（受控）
  action?: string;                 // 上传地址（由业务提供）
  accept?: string;                 // e.g. '.xlsx,.csv'
  limit?: number;
  maxSize?: number;                // MB
  draggable?: boolean;             // default: true
  autoUpload?: boolean;            // default: true
}
interface Events {
  (e: 'update:modelValue', files: any[]): void;
  (e: 'success', file: any): void;
  (e: 'error', file: any, err: Error): void;
  (e: 'exceed', files: any[]): void;
}
```

## 26. LxFormModal — 表单弹窗

```ts
interface Props {
  modelValue?: boolean;            // 显隐（受控）
  title?: string;
  width?: number | string;         // default: 520
  loading?: boolean;               // 提交中（footer 按钮转圈）
  /** 关闭前确认（有脏数据时） */
  confirmOnClose?: boolean;        // default: false
}
interface Events {
  (e: 'update:modelValue', v: boolean): void;
  (e: 'confirm'): void;           // 点确定（表单校验由业务 el-form 执行）
  (e: 'cancel'): void;
}
interface Slots {
  default?(): unknown;            // 表单体
  footer?(): unknown;             // 替换默认按钮组
}
```

## 27. LxConfirmDialog — 确认对话框

```ts
interface Props {
  modelValue?: boolean;
  title?: string;                  // default: '操作确认'
  message?: string;
  /** 危险操作（红色确定按钮） */
  danger?: boolean;                // default: false
  confirmText?: string;            // default: '确定'
  loading?: boolean;
}
interface Events {
  (e: 'update:modelValue', v: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}
```

## 28. LxDetailDrawer — 详情抽屉

`_1` Dispatch Action Drawer 规格（右滑 480/640px）。

```ts
interface Props {
  modelValue?: boolean;
  title?: string;
  size?: number | string;          // default: 480
  /** 头部状态 pill */
  status?: LxStatus;
  statusText?: string;
}
interface Events {
  (e: 'update:modelValue', v: boolean): void;
  (e: 'close'): void;
}
interface Slots {
  default?(): unknown;
  /** 底部锚定操作栏 */
  footer?(): unknown;
}
```

## 29. LxToast — 轻提示（函数式）

```ts
interface LxToastOptions {
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;               // default: 3000
  /** 战术闪烁（紧急告警，tacticalBlink 1.4s） */
  tactical?: boolean;              // default: false
}

// 函数式 API（lx-ui 统一导出）
declare function LxToast(options: LxToastOptions | string): void;
declare namespace LxToast {
  function success(msg: string, opts?: Partial<LxToastOptions>): void;
  function error(msg: string, opts?: Partial<LxToastOptions>): void;
  function warning(msg: string, opts?: Partial<LxToastOptions>): void;
  function info(msg: string, opts?: Partial<LxToastOptions>): void;
}
```

## 30. LxActionButtons — 行内操作按钮组

铁律：纯文字链接按钮，不用图标。

```ts
interface LxActionItem {
  key: string;
  label: string;                   // e.g. '编辑' / '删除'
  /** 危险操作（红色） */
  danger?: boolean;                // default: false
  /** 权限标识（业务方消费，组件不判断） */
  auth?: string;
  /** 二次确认文案 */
  confirm?: string | false;        // default: false
  disabled?: boolean;
  divided?: boolean;               // 默认前置分隔线
}

interface Props {
  actions?: LxActionItem[];       // default: []
  /** 超出 n 个折叠为"更多"下拉 */
  max?: number;                   // default: 3
  /** 事件统一出口：业务方按 key 分发 */
  row?: any;                       // 透传给回调
}
interface Events {
  (e: 'action', action: { item: LxActionItem; row: any }): void;
}
```

---

## 统一导出（lx-ui/src/index.ts）

```ts
export * from './components';
export type {
  LxStatus, LxSidebarMode, LxSize, LxMenuItem,
  LxTabItem, LxBreadcrumbItem, LxSearchField, LxTableColumn,
  LxDutyShift, LxTreeNode, LxActionItem, LxToastOptions,
} from 'lx-tokens';
```

## 使用示例（admin-vue3 业务侧）

```vue
<script setup lang="ts">
// 业务只关心：菜单数据映射 + 路由联动 + 权限过滤
import { LxSidebar, LxNavbar, LxPageCard, LxProTable, LxPagination } from 'lx-ui';
import { useUserStore } from '@/store/modules/useUserStore';

const userStore = useUserStore();
const route = useRoute();
const menuItems = computed(() => userStore.menus.map(toLxMenu));  // 业务映射
const activeKey = computed(() => route.name as string);
</script>

<template>
  <LxSidebar
    v-model:mode="appStore.sidebarMode"
    :items="menuItems"
    :active-key="activeKey"
  />
  <LxNavbar :user="userStore.profile" />
  <LxPageCard title="警务资源名册">
    <LxProTable :columns="columns" :data="rows" :loading="loading">
      <template #toolbar>
        <el-button type="primary">新增</el-button>
      </template>
      <template #cell-status="{ row }">
        <LxStatusDot :status="row.status" show-text :status-desc="row.statusDesc" />
      </template>
    </LxProTable>
    <LxPagination v-model:page="page" :total="total" />
  </LxPageCard>
</template>
```
