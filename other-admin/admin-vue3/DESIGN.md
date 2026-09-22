# Admin Vue3 设计规范（Design System）

> **项目路径**：`docs-local/admin-vue3/`
> **原项目**：`cloudcmd-admin-web/`（Vue2 + Element UI）
> **最后更新**：2026-07-27
> **关联文档**：`PROGRESS.md`（迁移进度）、`REFACTOR_PLAN.md`（重构规划）、`docs/DESIGN.md`（产品视觉设计系统）
>
> 本文档定义 Vue3 admin 重构版的**前端工程化设计规范**：主题色梯度、设计令牌、Element Plus 主题覆盖、全局组件 API 标准、布局与样式约定。所有 Vue3 开发人员及 AI 编程工具需严格遵守本规范，保证 UI 一致性。

---

## 一、视觉主题与设计原则

### 1.1 主题基调

- **品牌主色**：`#264ed1`（与 web/agent/web 收敛统一，区别于 `docs/DESIGN.md` 中描述的 `#2563eb`，以本项目 `variables.less` 实际配置为准）
- **基调风格**：明亮色块优先（color-block first），阴影克制使用
- **强调方式**：通过主色 fade 色块、表头灰底、行 hover 主色淡化背景实现层次，而非依赖重阴影
- **组件尺寸**：全局 `size="large"`，组件尺寸统一放大，提升可读性与点击体验

### 1.2 设计原则

| 原则                 | 说明                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ |
| 色块优先，阴影次之   | 表头/卡片/选中态用色块区分层次，阴影仅用于强调 Dialog/Dropdown 等浮动元素                  |
| 层次化圆角           | `xs/sm/md/lg` 梯度：输入框 4px、卡片 8px、Dialog 12px，禁止一律 8px                       |
| 主色光晕（brand voltage） | hover/focus 通过主色 `fade()` 实现品牌电压，而非依赖 box-shadow                       |
| 表面层次             | 表头 `#f9fafc`、hover `#f7f8fa`、卡片 `#ffffff`，通过浅色块区分层级                       |
| 克制装饰             | 避免大面积渐变、毛玻璃、柔和圆角；坚持锐利、扁平、高对比度                                |
| 中文优先             | 默认字体 `HarmonyOS Sans SC` → `PingFang SC` → `Microsoft YaHei` → `Arial`                |

---

## 二、颜色规范与设计令牌

> 全部定义于 `src/styles/variables.less`，通过 `:export` 同步供 JS 使用。

### 2.1 品牌主色（Primary）

| 令牌                       | 色值     | 用途                                       |
| -------------------------- | -------- | ------------------------------------------ |
| `@color-primary`           | `#264ed1` | 主色：按钮、激活标签、选中菜单项、链接    |
| `@color-primary-light-2`    | `#3a5fd8` | 主色 hover                                  |
| `@color-primary-light-3`    | `#5575db` | 主色 active                                 |
| `@color-primary-light-5`    | `#7d9be6` | 主色 disabled                              |
| `@color-primary-light-7`    | `#a5c0f0` | 主色浅化（背景占位）                       |
| `@color-primary-light-9`    | `#cde2fa` | 主色极浅（tag 背景、表头底线 fade 基色）   |
| `@color-primary-dark-2`     | `#1e3ea7` | 主色深色（按下态）                          |

### 2.2 功能色（Semantic）

| 令牌                       | 色值     | 用途                          |
| -------------------------- | -------- | ----------------------------- |
| `@color-success`           | `#67c23a` | 成功、在线、启用              |
| `@color-success-light-9`   | `#f0f9eb` | 成功浅背景                    |
| `@color-warning`           | `#e6a23c` | 警告、处置中、忙碌            |
| `@color-warning-light-9`   | `#fdf6ec` | 警告浅背景                    |
| `@color-danger`            | `#f56c6c` | 危险、删除、禁用、错误        |
| `@color-danger-light-9`    | `#fef0f0` | 危险浅背景                    |
| `@color-info`              | `#909399` | 次要信息、离线、占位          |
| `@color-info-light-9`      | `#f4f4f5` | 次要信息浅背景                |

### 2.3 文字色

| 令牌                       | 色值     | 用途                              |
| -------------------------- | -------- | --------------------------------- |
| `@color-text-primary`      | `#1d2129` | 标题、表头、强调文本              |
| `@color-text-regular`      | `#4e5969` | 正文、表格行文本                  |
| `@color-text-secondary`    | `#86909c` | 次要说明、表单 label              |
| `@color-text-placeholder`  | `#c9cdd4` | 输入框 placeholder               |
| `@color-on-dark`           | `#ffffff` | 深色背景（侧边栏）上的反白文字    |
| `@color-on-primary`        | `#ffffff` | 主色按钮上的反白文字              |

### 2.4 背景与边框

| 令牌                       | 色值     | 用途                              |
| -------------------------- | -------- | --------------------------------- |
| `@color-bg-page`           | `#f5f6f8` | 页面底层                          |
| `@color-bg-card`           | `#ffffff` | 卡片、面板、Dialog 背景            |
| `@color-bg-hover`          | `#f7f8fa` | hover 浅背景                      |
| `@color-bg-table-header`   | `#f9fafc` | 表头灰底（color-block 区分层次）  |
| `@color-bg-table-row-hover` | `#f5f7fa` | 表格行 hover 背景                  |
| `@color-border`            | `#e5e6eb` | 默认边框                          |
| `@color-border-light`      | `#f2f3f5` | 浅边框（分隔线）                  |
| `@color-border-panel`     | `#e8ecf0` | 面板边框                          |

### 2.5 侧边栏色

| 令牌                  | 色值      | 用途                          |
| --------------------- | --------- | ----------------------------- |
| `@menu-bg`            | `#1a2332` | 侧边栏背景                    |
| `@menu-hover-bg`      | `#243347` | 菜单项 hover 背景             |
| `@menu-active-bg`     | `@color-primary` | 菜单项激活背景（主色）   |
| `@menu-text`          | `#bfcbd9` | 菜单默认文字                  |
| `@menu-active-text`   | `#ffffff` | 菜单激活文字                  |
| `@side-bar-width`     | `230px`   | 侧边栏展开宽度                |
| `@side-bar-collapsed-width` | `54px` | 侧边栏折叠宽度              |

---

## 三、排版与字号

### 3.1 字体族

```less
--el-font-family: 'HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
```

### 3.2 字号梯度

| 令牌                    | 值    | 用途                              |
| ----------------------- | ----- | --------------------------------- |
| `@font-size-2xs`        | `11px` | 极小辅助文本（罕见使用）          |
| `@font-size-xs`         | `12px` | 辅助说明、表格次要列              |
| `@font-size-sm`         | `13px` | 次要正文                          |
| `@font-size-md`         | `14px` | **默认正文**、表格行、表单        |
| `@font-size-md-plus`    | `15px` | 强调正文                          |
| `@font-size-lg`         | `16px` | 小标题、按钮文字                  |
| `@font-size-xl`         | `18px` | Dialog 标题、卡片标题             |
| `@font-size-2xl`        | `20px` | 区块标题                          |
| `@font-size-xxl`        | `22px` | 大标题                            |
| `@font-size-display`    | `28px` | Hero 标题                         |
| `@font-size-display-lg` | `40px` | 巨型展示标题                       |

### 3.3 字重与行高

| 令牌                    | 值   | 用途       |
| ----------------------- | ---- | ---------- |
| `@font-weight-normal`   | `400` | 正文       |
| `@font-weight-medium`   | `500` | 强调       |
| `@font-weight-semibold` | `600` | 标题、表头 |
| `@line-height-tight`    | `1.2` | 标题       |
| `@line-height-base`     | `1.5` | 正文       |
| `@line-height-loose`    | `1.8` | 段落       |

---

## 四、间距与圆角

### 4.1 间距梯度（4 的倍数）

| 令牌                | 值    | 用途                 |
| ------------------- | ----- | -------------------- |
| `@spacing-2xs`      | `2px` | 极小间距             |
| `@spacing-xs`       | `4px` | 紧凑间距             |
| `@spacing-xs-plus`  | `6px` | 表单项间距           |
| `@spacing-sm`       | `8px` | 表单项垂直间距       |
| `@spacing-sm-plus`  | `12px` | 表单项水平间距      |
| `@spacing-md`       | `16px` | **默认间距**、容器内边距 |
| `@spacing-md-plus` | `20px` | Dialog header 内边距 |
| `@spacing-lg`       | `24px` | 区块间距             |
| `@spacing-xl`       | `32px` | 大区块间距           |
| `@spacing-xl-plus`  | `40px` | 页面区段间距         |
| `@spacing-2xl`      | `48px` | 大页面区段间距       |
| `@spacing-section`  | `96px` | 整页区块分隔         |

### 4.2 圆角梯度（层次化）

| 令牌                | 值      | 用途                                       |
| ------------------- | ------- | ------------------------------------------ |
| `@radius-xs`        | `2px`   | 标签、tag                                  |
| `@radius-3px`       | `3px`   | 极小元素                                   |
| `@radius-sm`        | `4px`   | **输入框、按钮**（Element Plus 默认 base） |
| `@radius-md`        | `6px`   | 中等元素                                   |
| `@radius-md-plus`  | `10px`  | 中等强调                                   |
| `@radius-lg`        | `8px`   | **卡片、表格**                             |
| `@radius-xl`        | `12px`  | **Dialog**                                 |
| `@radius-2xl`       | `20px`  | 大型容器                                   |
| `@radius-pill`      | `9999px` | 胶囊形（开关、圆点）                      |

---

## 五、阴影规范

> 原则：color-block first，阴影用于强调浮动元素，不用于卡片层叠。

| 令牌                       | 值                                                     | 用途                     |
| -------------------------- | ------------------------------------------------------ | ------------------------ |
| `@shadow-xs`               | `0 1px 2px rgba(0,0,0,0.04)`                           | 极弱阴影                 |
| `@shadow-sm`               | `0 2px 4px rgba(0,0,0,0.06)`                           | 弱阴影                   |
| `@shadow-md`               | `0 4px 12px rgba(0,0,0,0.08)`                          | Element Plus 默认        |
| `@shadow-lg`               | `0 8px 24px rgba(0,0,0,0.12)`                          | 强调阴影                 |
| `@shadow-card`             | `0 1px 4px rgba(0,0,0,0.04)`                           | 卡片默认                 |
| `@shadow-card-hover`       | `0 4px 16px rgba(0,0,0,0.1)`                           | 卡片 hover               |
| `@shadow-card-double`      | 双层（轮廓 + 立体）                                    | 重要卡片                 |
| `@shadow-card-double-hover` | 双层 + 强化                                            | 重要卡片 hover           |
| `@shadow-dialog`           | `0 12px 40px rgba(0,0,0,0.12)`                         | **Dialog 必用**          |
| `@shadow-dropdown`         | `0 6px 24px rgba(0,0,0,0.1)`                           | Dropdown                 |
| `@shadow-floating`         | `0 2px 8px rgba(0,0,0,0.06)`                           | 浮动小元素               |
| `@shadow-floating-hover`   | `0 4px 12px rgba(0,0,0,0.1)`                           | 浮动小元素 hover         |

---

## 六、布局与 z-index

### 6.1 关键布局令牌

| 令牌                 | 值      | 用途                                          |
| -------------------- | ------- | --------------------------------------------- |
| `@navbar-height`     | `50px`  | 顶栏高度（`AppMain` 高度 `calc(100vh - 50px)`） |
| `@content-padding`   | `16px`  | `.app-container` 默认内边距                   |
| `@panel-header-height` | `48px` | 通用面板头高度（CoopLevelTree 等）            |
| `@avatar-size`       | `40px`  | 头像默认尺寸                                  |
| `@avatar-size-sm`    | `28px`  | 头像小尺寸                                    |
| `@input-width-lg`    | `360px` | 表单大输入框宽度                              |
| `@dialog-width-md`   | `600px` | 标准 Dialog 宽度                              |

### 6.2 z-index 层级

| 令牌               | 值     | 用途     |
| ------------------ | ------ | -------- |
| `@z-index-sidebar` | `1001` | 侧边栏   |
| `@z-index-navbar`  | `100`  | 顶栏     |
| `@z-index-dropdown` | `2000` | 下拉     |
| `@z-index-modal`   | `3000` | Dialog   |
| `@z-index-tooltip` | `4000` | Tooltip  |

### 6.3 过渡

| 令牌                    | 值                            | 用途         |
| ----------------------- | ----------------------------- | ------------ |
| `@transition-duration`   | `0.2s`                        | 默认过渡     |
| `@transition-duration-slow` | `0.3s`                     | 慢过渡       |
| `@transition-timing`    | `cubic-bezier(0.4, 0, 0.2, 1)` | 默认缓动曲线 |

---

## 七、Element Plus 主题覆盖

> 配置文件：`src/styles/element-plus.less`
>
> 通过 CSS 变量覆盖 Element Plus 默认主题，保持与设计令牌同步。

### 7.1 主色覆盖

```less
:root {
  --el-color-primary: @color-primary;
  --el-color-primary-light-3: @color-primary-light-3;
  --el-color-primary-light-5: @color-primary-light-5;
  --el-color-primary-light-7: @color-primary-light-7;
  --el-color-primary-light-9: @color-primary-light-9;
  --el-color-primary-dark-2: @color-primary-dark-2;
}
```

### 7.2 表格精致化

- 表头 `#f9fafc` 灰底 + 主色淡化底线（`2px solid fade(@color-primary, 12%)`）
- 行 hover 主色淡化背景（`fade(@color-primary, 4%)`）
- 当前选中行主色更明显（`fade(@color-primary, 8%)`）
- 表头 padding 加大（16px），行 cell padding 加大（14px）
- 圆角表格（`border-radius: 4px` + `overflow: hidden`）
- 修复：固定列 hover 背景设为不透明白色，避免透出底层滚动内容

### 7.3 Dialog 重设计

- 圆角 8px + `overflow: hidden` + `@shadow-dialog`
- Header 用 `@color-bg-table-header` 灰底（signature surface 概念）
- Header padding 20px 24px，flex 布局让标题与关闭按钮对齐
- 关闭按钮改为 32×32 圆角方块，hover 显示 `fade(@color-danger, 8%)` 红色背景
- 标题字号 18px，font-weight 600

### 7.4 全局尺寸

- 所有 Element Plus 组件默认 `size="large"`，在 `App.vue` 根节点配置 `<el-config-provider :size="'large'">`

---

## 八、全局组件 API 规范

### 8.1 ProTable（配置式高级表格）

**路径**：`src/components/ProTable/index.vue`

**三种数据模式**：

| 模式       | 触发条件                   | 数据来源                                                  | 适用场景      |
| ---------- | -------------------------- | --------------------------------------------------------- | ------------- |
| 展示模式   | 仅传 `data`                | 父组件                                                    | 简单静态数据  |
| 纯远程模式 | 仅传 `fetchApi`            | ProTable 内部（默认格式化器）                             | 标准 CRUD     |
| 受控模式   | 同时传 `data` + `fetchApi` | 父组件（data 优先），fetchApi 触发后通过 `@response` 回调 | 字段映射/过滤 |

**关键 Props**：

| Prop                    | 类型                       | 默认         | 说明                   |
| ----------------------- | -------------------------- | ------------ | ---------------------- |
| `columns`               | `ITableColumn[]`          | 必填         | 列配置                 |
| `data`                  | `any[]`                    | `[]`         | 静态数据/受控模式数据  |
| `fetchApi`              | `(params) => Promise<any>` | -            | 远程接口               |
| `searchParams`          | `Record<string, any>`     | -            | 搜索参数（响应式对象） |
| `loading`               | `boolean`                  | `false`     | 父组件控制 loading     |
| `total`                 | `number`                   | `0`          | 总数                   |
| `page` / `limit`        | `number`                   | `1` / `10`   | 分页 v-model           |
| `pageSizes`             | `number[]`                 | `[10,20,50,100]` | 可选每页条数       |
| `rowKey`                | `string`                   | `'id'`       | 行唯一标识             |
| `showSelection`         | `boolean`                  | `false`      | 多选列                 |
| `showIndex`             | `boolean`                  | `false`      | 序号列                 |
| `indexLabel`            | `string`                   | `'#'`        | 序号列标题             |
| `indexWidth`            | `number`                   | `60`         | 序号列宽度             |
| `immediate`             | `boolean`                  | `true`       | 远程模式自动请求       |
| `autoFetchOnPagination` | `boolean`                  | `true`       | 分页变化自动请求       |
| `pageNumField`          | `string`                   | `'pageNum'`  | 分页字段名             |
| `pageSizeField`         | `string`                   | `'pageSize'` | 分页字段名             |

**Column 配置**：`{ prop, label, width, minWidth, fixed, sortable, align, headerAlign, showOverflowTooltip, slotName, headerSlotName, formatter }`

**关键 Emits**：`response` / `response-error` / `pagination` / `selection-change` / `loading-change` / `update:page` / `update:limit` / `row-click`

**Expose 方法**：`init()` / `refresh()` / `fetchPage(page, limit)` / `cancelFetch()` / `mutate(newData)` / `getSelection()` / `clearSelection()` / `toggleRowSelection(row, selected)` / `getTableRef()`

**默认格式化器**：`src/components/ProTable/formatter.ts` 兼容 4 种后端响应结构：

1. `{ code, data: { records, total } }` — 标准分页
2. `{ records, total }` — 直接分页
3. `{ code, data: [...] }` — 标准数组
4. `[...]` — 直接数组

### 8.2 SearchBar（搜索栏）

**路径**：`src/components/SearchBar/index.vue`

**功能**：内置关键字输入框 + 搜索/重置按钮 + `#filters` 自定义插槽 + `actions` 配置式操作按钮

**Props**：

| Prop          | 类型           | 默认         | 说明                          |
| ------------- | -------------- | ------------ | ----------------------------- |
| `searchKey`   | `string`       | `''`         | 关键字 v-model                |
| `placeholder` | `string`       | `'请输入关键字'` | 占位符                    |
| `actions`     | `ActionItem[]` | `[]`         | 右侧操作按钮配置              |

**ActionItem**：`{ label, type, icon, onClick, disabled, visible }`

**Slots**：`#filters` — 自定义筛选字段（替换默认输入框）

**Emits**：`update:searchKey` / `search` / `reset`

### 8.3 StatusSwitch（状态切换）

**路径**：`src/components/StatusSwitch/index.vue`

**反向值映射**：`value=0=启用`，`value=1=禁用`

**Props**：`value: number` / `disabled: boolean` / `loading: boolean` / `normalText: string`（默认 '正常'）/ `forbiddenText: string`（默认 '禁用'）

**Emits**：`change: (newValue: number) => void`

### 8.4 OrgTreeSelect（组织树选择）

**路径**：`src/components/OrgTreeSelect/index.vue`

**功能**：el-popover + el-input + el-tree 组合，支持同步/懒加载双模式（由 `localStorage.globalConfig.DEPARTMENT_SYNC_SIGN` 自动切换）

**Props**：`modelValue` / `placeholder` / `isDisabled` / `departmentCode` / `isUseUserDepartMent`（非 admin 用身份证号查所属部门）/ `lazy` / `width`（默认 150px）

**Emits**：`update:modelValue` / `clear-val` / `current-change`

**Expose**：`getTreeRef()`

### 8.5 SelectPagination（远程分页下拉）

**路径**：`src/components/SelectPagination/index.vue`

**功能**：远程分页加载（`v-loadmore`）+ 远程搜索 + 字段名映射（`trans`）+ 内部 `targetMap` 解决回显

**Props**：`modelValue` / `api`（必填）/ `initParams` / `multiple` / `placeholder` / `pageSize`（默认 100）/ `itemKey` / `showField` / `bindField` / `trans: { to, from }` / `valueMap` / `disabled`

**Emits**：`update:modelValue` / `change: (ids, items)`

### 8.6 AuthImg（鉴权图片）

**路径**：`src/components/AuthImg/index.vue`

**功能**：XHR 拉取需要鉴权的图片资源（避免 URL 暴露 Token）→ Blob → ObjectURL 渲染

**Props**：`authSrc: string`（相对路径，如 `/static/xxx.png`，自动拼接 `/api` 网关前缀）

**资源管理**：`props.authSrc` 变化时自动重新加载；组件卸载时由浏览器回收 ObjectURL，旧 URL 在重载前主动释放

### 8.7 PasswordInput（密码输入框）

**路径**：`src/components/PasswordInput/index.vue`

**功能**：禁复制粘贴的密码输入框

### 8.8 Pagination（分页）

**路径**：`src/components/Pagination/index.vue`

**功能**：el-pagination 封装

### 8.9 SvgIcon / Breadcrumb / Hamburger

基础组件，路径见 `src/components/<Name>/index.vue`

---

## 九、业务通用组件规范

### 9.1 DataPermissionTree（数据权限穿梭树）

**路径**：`src/views/authority/components/DataPermissionTree.vue`

**功能**：el-tree 简化版，左侧部门树（同步/懒加载双模式）+ 右侧已选列表（含 path 路径展示）

**特性**：
- `check-strictly` 父子不联动
- `syncFromDetail` 高阶回显（兼容 `orgList` 新格式 + `orgIds` 旧格式）

### 9.2 PoliceSelectDialog（警员选择弹窗）

**路径**：`src/components/PoliceSelectDialog/index.vue`

**功能**：基于 ProTable 的跨页多选弹窗

**特性**：
- ProTable `show-selection` + `row-key` 实现跨页选中保留
- 搜索栏：姓名、身份证号、组织
- `confirm` 事件返回选中用户数组

### 9.3 SplitDivider（拖拽分割线）

**路径**：`src/views/collaboration/components/SplitDivider.vue`

**功能**：手写 `mousedown/mousemove/mouseup` 实现，约束最小/最大宽度（180~480px），hover 显示拖拽 handle，`v-model` 双向绑定宽度

---

## 十、样式系统约定

### 10.1 样式文件结构

```
src/styles/
├── variables.less       # 设计令牌（主色/间距/字号/圆角/阴影/z-index/过渡）
├── element-plus.less    # Element Plus 主题覆盖（CSS 变量 + 组件级覆盖）
├── reset.less           # 重置样式（.app-container { padding: 16px } / .card 双层阴影）
├── sidebar.less         # 侧边栏布局（.app-wrapper / .main-container）
├── mixin.less           # Less mixin
├── transition.less      # 过渡动画
└── index.less           # 全局入口
```

### 10.2 样式约定

| 约定             | 说明                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| 预处理器         | `lang="less"`（与 web/agent/web 一致，不沿用 Vue2 admin 的 SCSS）                                 |
| 作用域           | 业务组件 `<style scoped lang="less">`；全局样式在 `src/styles/index.less`                          |
| 变量注入         | `vite.config.mts` 配置 `additionalData: @import "@/styles/variables.less"`，自动注入到所有 less 文件 |
| JS 使用令牌      | `variables.less` 末尾 `:export { ... }` 暴露常用令牌，业务代码 `import * as variables from '*.less'` |
| 颜色使用         | 优先使用 less 变量（`@color-primary`），其次 CSS 变量（`var(--el-color-primary)`），禁止硬编码色值 |
| 间距使用         | 优先使用 `@spacing-*` 变量，禁止硬编码 `16px`/`24px` 等                                            |
| 圆角使用         | 优先使用 `@radius-*` 变量                                                                          |
| 阴影使用         | 优先使用 `@shadow-*` 变量，禁止随意写 `box-shadow`                                                |
| 全局尺寸         | 所有 Element Plus 组件默认 `size="large"`，禁止单独写 `size="default"` 除非有特殊需求              |

### 10.3 全局容器类

```less
// src/styles/reset.less
.app-container {
  padding: @content-padding; // 16px
}

.card {
  background: @color-bg-card;
  border-radius: @radius-lg;
  box-shadow: @shadow-card-double;
  transition: box-shadow @transition-duration ease;

  &:hover {
    box-shadow: @shadow-card-double-hover;
  }
}
```

### 10.4 AppMain 高度撑满

`layout/components/AppMain.vue` 的 `.app-main` 使用 `height: calc(100vh - 50px)`（不是 `min-height`），让子组件的 `height: 100%` 链路生效。padding 由各页面的 `.app-container` 自行管理（默认 16px）。

---

## 十一、开发实施指南（Do's and Don'ts）

### 11.1 Do's（推荐做法）

- 严格使用 less 变量管理颜色、间距、圆角、阴影
- 所有图标与文本对齐规范（`vertical-align: middle` 或 flex 对齐）
- 保持圆角克制（4px ~ 12px），按用途选择梯度
- 表格统一用 `ProTable` 组件，禁止直接写 `el-table`
- 搜索栏统一用 `SearchBar` 组件封装
- 状态切换统一用 `StatusSwitch` 组件（反向值映射）
- 组织选择统一用 `OrgTreeSelect` 组件
- 鉴权图片统一用 `AuthImg` 组件
- Dialog 使用 `createDialog` 命令式弹窗工厂（`src/utils/createDialog.ts`）
- 远程下拉用 `SelectPagination` 组件
- 表格行操作按钮统一用 `link` 模式 + 标准图标（查看/编辑/启用/禁用/删除）
- 表单提交按钮 loading 联动（请求期间显示 loading + disabled）
- 删除操作必须二次确认（`ElMessageBox.confirm`）

### 11.2 Don'ts（严禁做法）

- 不要硬编码色值（`#264ed1`、`#ffffff` 等禁止直接写，用 `@color-primary` / `@color-bg-card`）
- 不要硬编码间距（`16px`/`24px` 等禁止直接写，用 `@spacing-md` / `@spacing-lg`）
- 不要使用无图标的纯文本表格操作按钮
- 不要打破明亮色块 + 主色强调的设计基调
- 不要直接使用 `el-table`，必须用 `ProTable`
- 不要在业务页面写 `list/loading/getList` 样板代码，用 ProTable 远程模式
- 不要在 less 文件中混用 `@import` 引入变量文件（由 vite 自动注入）
- 不要在 scoped style 中使用 `:export`（只在 `variables.less` 全局导出）
- 不要随意修改 Element Plus 默认组件样式，如需覆盖统一在 `element-plus.less` 中维护
- 不要在生产环境使用 `console.log`（仅开发调试）

---

## 十二、与 docs/DESIGN.md 的关系

| 文档               | 定位                                                    | 关系                                                                |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------- |
| `docs/DESIGN.md`   | 产品视觉设计系统（暗色警务科技风、色值 `#2563eb`）       | 历史/产品规划文档，描述系统级视觉方向                                |
| 本文档（根 DESIGN.md） | Vue3 admin 工程化设计规范（明亮色块风、主色 `#264ed1`） | 实际实现规范，以 `src/styles/variables.less` 为唯一真实来源（source of truth） |

**冲突处理**：当两文档冲突时，以**本文档**（根 `DESIGN.md`）+ `src/styles/variables.less` 实际配置为准。`docs/DESIGN.md` 中的 `#2563eb` 等色值仅为产品规划参考，Vue3 实现已收敛到 `#264ed1`。

---

## 十三、维护约定

1. **设计令牌变更**：修改 `src/styles/variables.less` 后，必须同步更新本文档对应章节
2. **新增全局组件**：新增 `src/components/<Name>/index.vue` 后，必须在「八、全局组件 API 规范」中补充 API 说明
3. **Element Plus 主题覆盖变更**：修改 `src/styles/element-plus.less` 后，必须在「七、Element Plus 主题覆盖」中补充说明
4. **业务通用组件抽取**：在 `src/views/<module>/components/` 下抽取的复用组件，需在「九、业务通用组件规范」中登记
5. **更新顶部 `最后更新` 日期**
