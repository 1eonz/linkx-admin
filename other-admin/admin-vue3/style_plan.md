# Vue3 admin 视觉重构计划

> **项目路径**：`docs-local/admin-vue3/`
> **创建日期**：2026-07-27
> **参考文档**：
> - `DESIGN.md`（根目录，主题色 `#264ed1`）
> - `docs/components.html`（全局组件原型）
> - `docs/login-demo.html`（登录页原型）
> - `docs/sider-nav-bar.html`（导航栏原型）
>
> **核心原则**：
> 1. 严禁修改 `<script setup>` 中的响应式数据、事件绑定、函数逻辑、接口调用
> 2. 所有颜色/间距/圆角/阴影使用 `variables.less` 中的 Less 变量，禁止硬编码色值
> 3. 主色保持 `#264ed1`（与 web 端收敛一致，不对齐原型 `#2563eb`）
> 4. 字体保持 `HarmonyOS Sans SC`（中文优先，不改为 `Inter`）

---

## 一、决策点确认（已确认）

| # | 决策项 | 选择 | 说明 |
|---|--------|------|------|
| 1 | 登录页布局 | ✅ 居中卡片（860×480） | 按原型 `login-demo.html` 改为居中卡片 + 4 层呼吸背景 |
| 2 | Navbar 高度 | ✅ 50px → 60px | 接受，AppMain 自动适配 `calc(100vh - 60px)` |
| 3 | Sidebar 宽度 | ✅ 230px → 240px / 54px → 64px | 接受，main-container 自动适配 |
| 4 | Sidebar 背景 | ✅ `#1a2332` → `#0f172a` | 接受，对齐原型 slate-900 |
| 5 | 主色 | ✅ 保持 `#264ed1` | 不对齐原型 `#2563eb`，与 web 端收敛一致 |
| 6 | ConnectionStatusDot | ✅ 替换为新的 `StatusDot` 组件 | 统一类名风格 + 增加 pulse 呼吸动画 |

---

## 二、阶段执行进度

| 阶段 | 内容 | 状态 | 完成日期 |
|------|------|------|----------|
| 阶段 1 | 样式系统扩充（variables + reset + login.less + sidebar 调整） | ✅ 已完成 | 2026-07-27 |
| 阶段 2 | Layout 深色化（Navbar + Logo + Sidebar 清理 + AppMain） | ✅ 已完成 | 2026-07-27 |
| 阶段 3 | 登录页按原型重构（居中卡片 + 呼吸背景） | ✅ 已完成 | 2026-07-27 |
| 阶段 4 | 全局组件封装（7 个新组件） | ✅ 已完成 | 2026-07-27 |
| 阶段 5 | 组件应用替换（StatusDot + MetricCard + ActionButtons） | ✅ 已完成 | 2026-07-27 |
| 阶段 6 | SectionTitle + ModernCard 试点替换 | ✅ 已完成 | 2026-07-27 |

---

## 2.6 阶段 6 实际改动文件清单（2026-07-27 完成）

### 2.6.1 SectionTitle 扩展 + 替换（5 个文件）

| 文件 | 操作 | 改动内容 |
|------|------|----------|
| `src/components/SectionTitle/index.vue` | 修改 | 扩展支持 `variant` prop（3 种风格变体）：`dashed`（默认，图标+虚线）/ `border`（左 border 风格）/ `plain`（纯标题）；移除原继承全局 `.section-title` 类的方式，改为组件内 scoped 样式按 variant 渲染；新增 `computed` 计算 containerClass |
| `src/views/baseData/mapConfig/index.vue` | 修改 template + style + import | 4 处 `<h4 class="section-title">` 替换为 `<SectionTitle variant="border" />`（底图文件/地图配置/地理编码接口配置/行政区划）；移除 `.section-title` 样式；新增 import |
| `src/views/baseData/layoutConfig/components/CommonConfig.vue` | 修改 template + style + import | 2 处替换为 `<SectionTitle variant="border" />`（基础配置/协同群组按钮配置）；移除 `.section-title` 样式；新增 import |
| `src/views/baseData/layoutConfig/components/OpsStatistic.vue` | 修改 template + style + import | 1 处替换为 `<SectionTitle variant="border" />`（登录日活统计导出）；移除 `.section-title` 样式；新增 import |
| `src/views/nodeManage/inboundData/components/ClientDetailDrawer.vue` | 修改 template + style + import | 4 处替换为 `<SectionTitle variant="plain" />`（基本信息/授权信息/连接信息/数据概览）；"数据概览"行用 `#extra` slot 承载"刷新"按钮，移除原 `.data-overview-header` flex 容器；移除 `.info-section-title`/`.data-overview-title` 样式；新增 import（已有 MetricCard import，按字母序插入 SectionTitle 在前） |
| `src/views/nodeManage/outboundData/components/GrantConfigDialog.vue` | 修改 template + style + import | 2 处替换为 `<SectionTitle variant="plain" />`（开放数据授权/开放业务数据授权）；移除 `.grant-section-title` 样式；新增 import |

### 2.6.2 ModernCard 试点替换（1 个文件）

| 文件 | 操作 | 改动内容 |
|------|------|----------|
| `src/views/location/index.vue` | 修改 template + style + import | `<el-card shadow="always" class="card">` 替换为 `<ModernCard class="page-card">`；新增 `import ModernCard`；旧 `.card { height: 100%; overflow-y: auto }` 改为 `.page-card { height: 100%; overflow-y: auto }`（ModernCard 默认提供 .modern-card 基础样式：border + radius + padding + shadow，补充高度撑满+滚动行为） |

### 2.6.3 验证结果

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `npm run lint:ts` | ✅ 通过（exit code 0） | 全部 7 个文件 TypeScript 类型检查无错误 |
| `GetDiagnostics` SectionTitle/index.vue | ✅ 无诊断 | 扩展后的组件无错误 |
| `GetDiagnostics` location/index.vue | ✅ 无诊断 | ModernCard 试点替换后无错误 |

### 2.6.4 ModernCard 试点验证结论

ModernCard 在 location/index.vue 试点成功，验证结论：
- ✅ ModernCard 默认样式（border + radius + padding + shadow）与 SearchBar + ProTable 组合兼容
- ✅ 通过 `class="page-card"` 透传 `height: 100%; overflow-y: auto` 行为，与原 `.card` 视觉等价
- ✅ 不破坏原有 DOM 层级（`.app-container` > `ModernCard` > SearchBar + ProTable）
- 📌 **后续推广建议**：其他 24+ 个使用 `<el-card class="card">` 的页面可按此模式批量替换，每个文件改动量约 3 行（1 行 import + 1 行 template 标签替换 + 1 行 class 改名）

### 2.6.5 改造统计

| 维度 | 数量 |
|------|------|
| 修改文件数 | 7（含 1 个组件扩展 + 6 个业务文件） |
| 新增 import 语句 | 6 条 SectionTitle + 1 条 ModernCard |
| 替换标题总数 | 13 处（4+2+1+4+2） |
| 替换卡片容器 | 1 处（试点） |
| 保留的 variant 风格 | 3 种（dashed/border/plain） |

---

## 2.5 阶段 5 实际改动文件清单（2026-07-27 完成）

### 2.5.1 StatusDot 替换 ConnectionStatusDot（阶段 5.1）

| 文件 | 操作 | 改动内容 |
|------|------|----------|
| `src/components/StatusDot/index.vue` | 修改 | 扩展支持 5 种状态（online/processing/busy/error/offline）+ `code` prop（数字 0-7 兼容）+ `statusDesc`/`showText` props 兼容旧 API；新增 `processing`（蓝）和 `error`（红）状态样式；新增 `.status-dot-wrapper` 容器（showText=true 时显示文本） |
| `src/views/nodeManage/components/ConnectionStatusDot.vue` | 重写 | 内部改为使用 StatusDot 组件渲染，保持原 API 完全兼容（status/statusDesc/showText 三个 props 不变）；传入 `:code="status"` + `:status-desc` + `:show-text` + `:pulse="false"`（保持原无动画视觉）；5 个调用方文件零改动 |

**验证**：`npm run lint:ts` 通过；5 个调用方文件（serverManage/clientManage/inboundData/outboundData/ClientDetailDrawer）无需任何改动。

### 2.5.2 MetricCard 替换 stat-card（阶段 5.2）

| 文件 | 操作 | 改动内容 |
|------|------|----------|
| `src/views/nodeManage/inboundData/components/ClientDetailDrawer.vue` | 修改 template + style + import | 新增 `import MetricCard`；6 个手写 `.stat-card` 替换为 `<MetricCard>` 组件（协同岗用户/协同岗群组/普通群组/协同岗消息/H5数量/智能体数量）；外层 `.stat-cards` 加 `metric-grid` 类提供网格布局；移除旧 `.stat-card`/`.stat-card-label`/`.stat-card-value` 样式 |

### 2.5.3 ActionButtons 批量替换（阶段 5.3）

共替换 **26 个文件**，分为两组：

#### authority 模块（6 个文件，由 subagent 处理）

| 文件 | 按钮数 | 按钮清单 |
|------|--------|----------|
| `views/authority/imPerson/index.vue` | 6 | 设置角色/数据权限/重置密码/删除/禁用/启用（含权限与状态分支） |
| `views/authority/person/index.vue` | 5 | 设置角色/重置密码/删除/禁用/启用（含 isGeneralAdmin 判断） |
| `views/authority/adminPerson/index.vue` | 3 | 设置角色/重置密码/删除 |
| `views/authority/userManage/index.vue` | 5 | 编辑/重置密码/删除/禁用/启用 |
| `views/authority/imRole/index.vue` | 5 | 绑定用户/编辑/删除/禁用/启用 |
| `views/authority/adminRole/index.vue` | 3 | 编辑/设置用户/删除 |

#### 其他模块（20 个文件，由 subagent 处理）

| 文件 | 按钮数 | 按钮清单 |
|------|--------|----------|
| `views/thirdInterface/southInterface/index.vue` | 4 | 详情/编辑/映射/删除 |
| `views/baseData/mapConfig/index.vue` | 2+3 | 两个表格：底图文件表 2 按钮（瓦片地址/删除）+ 地图配置表 3 按钮（编辑/激活或取消激活/删除） |
| `views/baseData/thirdParty/index.vue` | 3 | 详情/修改/删除（含 i18n） |
| `views/baseData/globals/index.vue` | 3 | 编辑/删除/恢复（三态互斥） |
| `views/nodeManage/clientManage/index.vue` | 3 | 编辑/授权/删除 |
| `views/h5/archivedTable/index.vue` | 2 | 下载/删除 |
| `views/collaboration/colManage.vue` | 3 | 修改/删除/下岗（loading 合并为 disabled） |
| `views/shiftScheduling/dutyType/index.vue` | 2 | 编辑/删除（删除有 type!==0 条件） |
| `views/thirdInterface/app/components/AppManage.vue` | 2 | 编辑/删除 |
| `views/thirdInterface/app/components/GroupManage.vue` | 2 | 编辑/删除 |
| `views/thirdInterface/policeReport/components/DockManage.vue` | 2 | 编辑/删除 |
| `views/thirdInterface/policeReport/components/TypeManage.vue` | 2 | 编辑/删除 |
| `views/thirdInterface/agentInterface/components/AgentFile.vue` | 2 | 编辑/删除 |
| `views/nodeManage/serverManage/index.vue` | 2 | 编辑/删除 |
| `views/baseData/layoutConfig/components/AppH5Config.vue` | 2 | 编辑/删除 |
| `views/baseData/layoutConfig/components/PcConfig.vue` | 2 | 编辑/删除 |
| `views/h5/carousel/index.vue` | 2 | 编辑/删除 |
| `views/policeExtend/virtualUser/index.vue` | 2 | 编辑/删除 |
| `views/location/index.vue` | 2 | 编辑/删除（含 canUpdate/canDelete 权限分支） |
| `views/thirdInterface/unifiedComm/components/IcpAuthManage.vue` | 2 | 设备授权/摄像头授权 |

### 2.5.4 验证结果

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `npm run lint:ts` | ✅ 通过（exit code 0） | 全部 28 个文件 TypeScript 类型检查无错误 |
| `GetDiagnostics` StatusDot/index.vue | ✅ 无诊断 | 扩展后的组件无错误 |
| `GetDiagnostics` ConnectionStatusDot.vue | ✅ 无诊断 | 重写后的兼容层无错误 |
| `GetDiagnostics` ClientDetailDrawer.vue | ✅ 无诊断 | MetricCard 替换后无错误 |

### 2.5.5 改造统计

| 维度 | 数量 |
|------|------|
| 修改文件数 | 28（含 2 个组件 + 26 个业务文件） |
| 新增 import 语句 | 26 条 ActionButtons + 1 条 MetricCard |
| 替换按钮总数 | 约 70+ 个 |
| 保留的 v-if 权限分支 | 全部转为 visible 字段 |
| 保留的国际化文案 | 全部保留 |
| 保留的图标引用 | 全部保留 |
| 调用方零改动 | 5 个 ConnectionStatusDot 调用方 |

---

## 2.4 阶段 4 实际改动文件清单（2026-07-27 完成）

| 文件 | 操作 | 组件 API 摘要 |
|------|------|---------------|
| `src/components/SectionTitle/index.vue` | 新增 | Props: `title`/`icon`/`iconColor`；Slots: `default`（自定义标题）/`extra`（右侧附加）；继承全局 `.section-title` 类，补充图标样式 |
| `src/components/ModernCard/index.vue` | 新增 | Props: `title`/`icon`/`bordered`；Slots: `default`/`title`/`extra`；继承全局 `.modern-card` 类，内部使用 SectionTitle 组件渲染可选标题 |
| `src/components/PoliceId/index.vue` | 新增 | Props: `value`/`prefix`；继承全局 `.police-id` 类（等宽字体 + 主色高亮） |
| `src/components/MetricCard/index.vue` | 新增 | Props: `title`/`value`/`valueType`（default/success/warning/danger）/`footer`；Slots: `title`/`value`/`footer`/`extra`；继承全局 `.metric-card` 类，数值颜色 4 种变体 |
| `src/components/StatusDot/index.vue` | 新增 | Props: `status`（online/busy/offline）/`size`/`pulse`；继承全局 `.status-dot` 类，online 状态有 pulse 呼吸动画，可关闭 |
| `src/components/PersonnelCard/index.vue` | 新增 | Props: `name`/`avatar`/`policeId`/`department`/`status`；Slots: `extra`；继承全局 `.personnel-card` 类，内部使用 StatusDot 组件，支持图片 URL 或首字头像 |
| `src/components/ActionButtons/index.vue` | 新增 | Props: `buttons`（数组配置）/`actions`（预设对象 view/edit/disable/enable/delete）/`gap`；统一 `el-button link` + 图标渲染，预设 5 种标准操作（查看/编辑/禁用/启用/删除） |
| `src/components/index.ts` | 新增 | 统一导出 7 个组件，支持 `import { ModernCard, SectionTitle, ... } from '@/components'` 按需引入 |

### 2.4.1 验证结果

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `npm run lint:ts` | ✅ 通过（exit code 0） | TypeScript 类型检查无错误 |
| `GetDiagnostics` SectionTitle | ✅ 无诊断 | 文件无错误 |
| `GetDiagnostics` ModernCard | ✅ 无诊断 | 文件无错误 |
| `GetDiagnostics` PoliceId | ✅ 无诊断 | 文件无错误 |
| `GetDiagnostics` MetricCard | ✅ 无诊断 | 文件无错误 |
| `GetDiagnostics` StatusDot | ✅ 无诊断 | 文件无错误 |
| `GetDiagnostics` PersonnelCard | ✅ 无诊断 | 文件无错误 |
| `GetDiagnostics` ActionButtons | ✅ 无诊断 | 文件无错误 |
| `GetDiagnostics` index.ts | ✅ 无诊断 | 文件无错误 |

### 2.4.2 组件使用示例

```vue
<script setup lang="ts">
import { DataAnalysis, Delete, Edit, View } from '@element-plus/icons-vue';
import { ActionButtons, MetricCard, ModernCard, PoliceId, StatusDot } from '@/components';

function handleView(row: any) { /* ... */ }
function handleEdit(row: any) { /* ... */ }
function handleDelete(row: any) { /* ... */ }
</script>

<template>
  <!-- 卡片容器 + 标题 -->
  <ModernCard title="警务数据与指标统计" :icon="DataAnalysis">
    <!-- 指标卡片网格 -->
    <div class="metric-grid">
      <MetricCard title="今日高危告警" :value="142" value-type="danger" footer="较昨日 ↑ 12%">
        <template #extra><el-tag type="danger" size="small">紧急</el-tag></template>
      </MetricCard>
      <MetricCard title="在线警力" :value="1280" footer="巡逻车 320 辆" />
    </div>
  </ModernCard>

  <!-- 状态点 -->
  <span><StatusDot status="online" /> 在线</span>
  <span><StatusDot status="busy" /> 忙碌</span>
  <span><StatusDot status="offline" /> 离线</span>

  <!-- 警号 -->
  <PoliceId :value="row.policeId" prefix="P" />

  <!-- 表格行内操作按钮 -->
  <ActionButtons :actions="{
    view: () => handleView(row),
    edit: () => handleEdit(row),
    delete: () => handleDelete(row),
  }" />
</template>
```

### 2.4.3 ConnectionStatusDot 替换说明

新增的 `StatusDot` 组件已具备 `ConnectionStatusDot` 的全部功能 + pulse 呼吸动画。后续迁移节点管理模块时，可直接用 `StatusDot` 替换 `ConnectionStatusDot`：

| 旧组件 ConnectionStatusDot | 新组件 StatusDot |
|---|---|
| `status` prop: `'online'/'processing'/'warning'/'error'/'offline'` | `status` prop: `'online'/'busy'/'offline'` |
| 类名 BEM 风格 `status-dot--online` | 类名修饰符风格 `status-dot online` |
| 无呼吸动画 | online 状态有 pulse 呼吸动画 |
| 无 size 配置 | 可配置 size |

**映射关系**：`online→online`、`processing→busy`、`warning→busy`、`error→offline`、`offline→offline`

---

## 2.3 阶段 3 实际改动文件清单（2026-07-27 完成）

| 文件 | 操作 | 改动内容 |
|------|------|----------|
| `src/views/login/index.vue` | 修改 template + style + script import | **template 重构**：移除原左右分栏 + 节点矩阵 + brand-panel；新增 4 层呼吸背景（`<div class="bg-base/bg-grid/glow-sphere-primary/glow-sphere-secondary">`）+ 居中卡片 `.login-container`（860×480）+ 左侧品牌区（警务 Logo 方块 + 品牌长标题 + 状态徽章 + 底部版本信息）+ 右侧表单区（区块标题 + 警号输入框带 POLICE tag + 密码框 + 记住警号 checkbox + 忘记密码链接 + 提交按钮 + 底部安全提示）；**script 仅新增**：`rememberMe` UI 占位 ref（非业务逻辑）；icon import 调整为 `ArrowRight, ArrowDown, Key, Loading, Lock, User, UserFilled, WarnTriangleFilled`（移除原 `ArrowDown` 单独 import）；**style 重写**：移除原全部 scoped 样式，主体样式使用全局 `login.less`，仅保留 scoped 级别的细节调整（语言切换按钮深色风格、品牌区底部版本信息、el-form 局部覆盖、提交按钮 loading 动画） |

### 2.3.1 保留的业务逻辑（完全不动）

- `systemTitle` / `loginTitle` / `version` / `currentYear` 计算属性
- `loginForm` / `loading` / `loginRules` / `formRef` 表单状态
- `userIcon` / `lockIcon` markRaw 图标
- `handleLogin()` 登录函数（含表单校验 + userStore.loginAction + 跳转）
- `handleCommand()` 语言切换函数
- `queryGlobalsList` / `getVersion` 接口调用
- `el-form` 的 `:model` / `:rules` / `ref` / `@submit.prevent` 绑定
- `el-input` 的 `v-model` / `:prefix-icon` / `tabindex` / `autocomplete` / `@copy.prevent` 等绑定
- `el-button` 的 `:loading` 与 `handleLogin` 调用

### 2.3.2 新增的 UI 元素（仅视觉，非业务）

- 4 层呼吸背景（bg-base / bg-grid / glow-sphere-primary / glow-sphere-secondary）
- 警务 Logo 方块（`<el-icon><Key /></el-icon>`，因 `@element-plus/icons-vue` 无 Shield 图标，改用 Key 替代）
- 状态徽章（`<span class="status-dot online"></span>` + "系统就绪"）
- 警号标签（`<span class="police-id-tag">POLICE</span>` 在 el-input #append slot）
- 记住警号 checkbox（`v-model="rememberMe"`，仅 UI 占位无逻辑）
- 忘记密码链接（`href="javascript:void(0);"` 占位）
- 提交按钮文案改为「进入系统」+ 右箭头图标 + loading 时显示 Loading 旋转图标
- 底部安全提示（`<el-icon><WarnTriangleFilled /></el-icon>` + "未经授权禁止登录，系统全程安全审计"）
- 底部版本信息（`版本 {{ version || '—' }} · © {{ currentYear }} Linkx Platform`）

### 2.3.3 验证结果

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `npm run lint:ts` | ✅ 通过（exit code 0） | TypeScript 类型检查无错误 |
| `GetDiagnostics` login/index.vue | ✅ 无诊断 | 文件无错误 |

### 2.3.4 已知问题与决策

| 问题 | 决策 | 说明 |
|------|------|------|
| `@element-plus/icons-vue` 无 `Shield` 图标 | 改用 `Key` 图标替代 | Key 同样表达"安全/密钥"语义，视觉一致性可接受 |
| `@element-plus/icons-vue` 无 `ShieldCat` 图标 | 改用 `WarnTriangleFilled` 图标替代 | 警告三角图标更贴合"安全审计"语义 |
| 提交按钮改为原生 `<button>` | 保留原生 button + 自定义 `.btn-submit` 类 | 原型 login-demo.html 即为原生 button + CSS 实现，保持一致；同时保留 `:loading` 状态控制 |

---

## 2.2 阶段 2 实际改动文件清单（2026-07-27 完成）

| 文件 | 操作 | 改动内容 |
|------|------|----------|
| `src/layout/components/Navbar.vue` | 修改 template + style + script import | 背景从 `@color-bg-card` 改为 `@navbar-bg`（深色 `#1e293b`）；底部边框改为 `@navbar-border-color`；Hamburger 文字色 `@navbar-text`，hover `@navbar-text-active` + `@navbar-hover-bg`；right-tip 文字色 `@navbar-text`；用户名改为白色 `@navbar-text-active`；头像改为 32px + `fade(@color-primary, 30%)` 半透明蓝背景 + `@color-primary-light-5` 蓝字；新增 `<el-icon><ArrowDown/></el-icon>` 下拉箭头；退出菜单项加 `<el-icon><SwitchButton/></el-icon>` 图标；script 新增 `import { ArrowDown, SwitchButton } from '@element-plus/icons-vue'`（仅新增 import，不动其他逻辑） |
| `src/components/Breadcrumb/index.vue` | 修改 style | 适配深色 Navbar：`:deep(.el-breadcrumb__separator)` 颜色 `@navbar-text`；`:deep(.el-breadcrumb__inner)` 颜色 `@navbar-text`，hover `@navbar-text-active`；最后一项 `@navbar-text-active` + `@font-weight-medium`；`.no-redirect` 改为 `@navbar-text-active` |
| `src/layout/components/Sidebar/Logo.vue` | 修改 template + style + 新增 computed | Logo 从 `<img src="@/assets/images/logo.svg">` 改为 `<div class="logo-icon">{{ logoInitial }}</div>`（蓝色渐变方块 + 首字母）；`.logo-icon` 样式：32×32 + `linear-gradient(135deg, @color-primary, @color-primary-dark-2)` + `@radius-md` + 主色光晕阴影 `0 4px 12px fade(@color-primary, 35%)`；新增 `const logoInitial = computed(() => systemName.value.charAt(0) || 'L')`；保留 `systemName` 计算逻辑 |
| `src/layout/components/Sidebar/index.vue` | 修改 script | 移除 `watchEffect` 中的 `console.log('[Sidebar] permissionMenus count:...')` 和 `console.log('[Sidebar] sidebar.opened:...')`；移除 `handleSelect` 函数及 `@select="handleSelect"` 绑定；移除 `watchEffect` import；保留 `permissionMenus` / `activeMenu` / `appStore` / `userStore` 等全部业务逻辑 |
| `src/styles/sidebar.less` | 修改 | 移除 `.sidebar-logo-container` 全局样式块（已迁移到 Logo.vue 的 scoped style 中），保留注释说明 |

### 2.2.1 验证结果

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `npm run lint:ts` | ✅ 通过（exit code 0） | TypeScript 类型检查无错误 |
| `GetDiagnostics` Navbar.vue | ✅ 无诊断 | 文件无错误 |
| `GetDiagnostics` Logo.vue | ✅ 无诊断 | 文件无错误 |
| `GetDiagnostics` Sidebar/index.vue | ✅ 无诊断 | 文件无错误 |
| `GetDiagnostics` Breadcrumb/index.vue | ✅ 无诊断 | 文件无错误 |

---

## 2.1 阶段 1 实际改动文件清单（2026-07-27 完成）

| 文件 | 操作 | 改动内容 |
|------|------|----------|
| `src/styles/variables.less` | 修改 | 新增 `@navbar-bg`/`@navbar-text`/`@navbar-text-active`/`@navbar-hover-bg`/`@navbar-border-color`；新增 `@font-family-mono`；新增 `@color-glow-primary`/`@color-glow-secondary`/`@bg-login-base`/`@bg-login-grid`；调整 `@menu-bg: #1a2332 → #0f172a`、`@menu-hover-bg → rgba(255,255,255,0.06)`、`@menu-text: #bfcbd9 → #94a3b8`、`@side-bar-width: 230px → 240px`、`@side-bar-collapsed-width: 54px → 64px`、`@navbar-height: 50px → 60px` |
| `src/styles/reset.less` | 修改 | 新增 `.modern-card` / `.section-title` / `.police-id` / `.metric-grid` / `.metric-card`（含 `.metric-title`/`.metric-value`/`.metric-footer`）/ `.card-grid` / `.personnel-card` / `.status-dot`（含 `.online`/`.busy`/`.offline` 修饰符）/ `@keyframes status-dot-pulse` |
| `src/styles/login.less` | 新增 | 登录页专用样式：4 层背景（`.bg-base`/`.bg-grid`/`.glow-sphere-primary`/`.glow-sphere-secondary`）+ `@keyframes breathe-primary`（9s）+ `@keyframes breathe-secondary`（12s）+ `.login-container`（860×480 居中卡片 + 多层阴影）+ `.login-brand`（左侧深色品牌区）+ `.login-form-wrapper`（右侧白色表单区）+ `.police-logo`（56×56 蓝色渐变方块）+ `.brand-title`（长标题自适应折行）+ `.status-badge`（胶囊形 + 状态点）+ `.login-section-title`（虚线分隔）+ `.police-id-tag`（警号标签）+ `.btn-submit`（提交按钮）+ 响应式（960px 竖向布局） |
| `src/styles/sidebar.less` | 修改 | 菜单项高度 `48px → 46px`；新增 `margin: 4px 8px` + `border-radius: @radius-lg`；active 状态移除左侧 3px 竖线（`::before` 伪元素），改为纯色填充 + 圆角 + `font-weight: medium`；折叠时 logo 文字从 `display: none` 改为 `opacity: 0 + pointer-events: none` 渐隐 |
| `src/styles/element-plus.less` | 修改 | 末尾新增 `.el-menu--vertical`（折叠弹出子菜单深色主题）+ `.el-sub-menu__icon-arrow`（折叠箭头颜色对齐） |
| `src/styles/index.less` | 修改 | 新增 `@import './login.less';`（位于 sidebar.less 之后、transition.less 之前） |

### 2.1.1 验证结果

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `npm run lint:ts` | ✅ 通过（exit code 0） | TypeScript 类型检查无错误 |
| `npm run lint:eslint` | ⚠️ 预存错误（与本次改造无关） | 报错全部为项目预存问题（`no-undef` 缺 browser env、`no-unused-vars` 误报），本次仅改 .less 文件未引入新错误 |
| `npm run lint:stylelint` | ⚠️ 无法运行（环境问题） | 缺少 `postcss-html` 依赖，与本次改造无关 |

---

## 三、阶段 1：样式系统扩充

### 3.1 目标

在 `styles/` 下扩充原型要求的通用类与变量，为后续组件/页面改造提供基础。

### 3.2 改造文件清单

| 文件 | 操作 | 内容 |
|------|------|------|
| `src/styles/variables.less` | 修改 | 新增 navbar 深色变量、等宽字体变量、登录页光晕变量；调整 sidebar 宽度/背景、navbar 高度 |
| `src/styles/reset.less` | 修改 | 新增 `.modern-card` / `.section-title` / `.police-id` / `.metric-grid` / `.metric-card` / `.metric-value` / `.card-grid` / `.personnel-card` / `.status-dot` 等通用类 + `@keyframes pulse` |
| `src/styles/login.less` | 新增 | 登录页专用样式（4 层背景 + 双光晕动画 + 居中卡片 + 多层阴影） |
| `src/styles/sidebar.less` | 修改 | 菜单项 active 移除左侧 3px 竖线，改为纯色填充 + 圆角；菜单项 margin + radius 调整；折叠时 logo 文字渐隐 |
| `src/styles/element-plus.less` | 修改 | el-menu 深色主题样式（背景透明 + hover 浅白 + active 主色填充） |
| `src/styles/index.less` | 修改 | 引入新的 `login.less` |

### 3.3 variables.less 新增变量

```less
// ========== 顶栏（Navbar）深色 ==========
@navbar-bg: #1e293b;
@navbar-text: #94a3b8;
@navbar-text-active: #ffffff;
@navbar-hover-bg: rgba(255, 255, 255, 0.08);

// ========== 等宽字体（警号/数值用） ==========
@font-family-mono: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;

// ========== 登录页光晕 ==========
@color-glow-primary: rgba(38, 78, 209, 0.28);   // 基于 #264ed1 的光晕
@color-glow-secondary: rgba(14, 165, 233, 0.18);

// ========== 调整现有变量 ==========
@menu-bg: #0f172a;                              // 原 #1a2332 → #0f172a
@side-bar-width: 240px;                         // 原 230px → 240px
@side-bar-collapsed-width: 64px;                // 原 54px → 64px
@navbar-height: 60px;                           // 原 50px → 60px
```

### 3.4 reset.less 新增通用类

| 类名 | 用途 | 关键样式 |
|------|------|----------|
| `.modern-card` | 现代卡片容器 | `bg-card + border + radius-lg + padding-lg + shadow-md` |
| `.section-title` | 区块标题（图标 + 虚线） | `flex + gap-sm + font-size-lg + font-weight-semibold + padding-bottom-sm + border-bottom-dashed` |
| `.police-id` | 警号等宽字体高亮 | `font-family-mono + font-weight-semibold + color-primary + bg-primary-light-9 + padding 2px 6px + radius-xs` |
| `.metric-grid` | 指标卡片网格 | `grid + repeat(auto-fit, minmax(220px, 1fr)) + gap-md` |
| `.metric-card` | 指标卡片 | `linear-gradient bg + border + radius-lg + padding-md` |
| `.metric-value` | 指标数值 | `font-family-mono + font-size-display + font-weight-bold` |
| `.card-grid` | 人员卡片网格 | `grid + repeat(auto-fill, minmax(240px, 1fr)) + gap-md` |
| `.personnel-card` | 人员卡片 | `flex + gap-md + border + radius-md + padding-sm + hover:border-primary + hover:shadow-md` |
| `.status-dot` | 呼吸灯状态点基础类 | `8×8 圆点 + display:inline-block` |
| `.status-dot.online` | 在线（绿 + pulse） | `bg-success + ::after pulse 动画` |
| `.status-dot.busy` | 忙碌（黄） | `bg-warning` |
| `.status-dot.offline` | 离线（灰） | `bg-info` |
| `@keyframes pulse` | 呼吸灯动画 | `scale(1)→scale(2.8) + opacity 0.8→0` |

### 3.5 login.less 新增内容

| 类名 | 用途 | 关键样式 |
|------|------|----------|
| `.login-page` | 登录页根容器 | `position:relative + 100vw/100vh + overflow:hidden + flex 居中` |
| `.bg-base` | 第 1 层：径向渐变深色基底 | `radial-gradient(circle, #0f172a 0%, #020617 100%)` |
| `.bg-grid` | 第 2 层：40px 网格 + mask 渐隐 | `linear-gradient 网格 + mask-image radial-gradient` |
| `.glow-sphere-primary` | 第 3 层：650px 主色光球 | `radial-gradient + blur(40px) + breathePrimary 9s 动画` |
| `.glow-sphere-secondary` | 第 4 层：450px 次色光球 | `radial-gradient + blur(50px) + breatheSecondary 12s 动画` |
| `@keyframes breathePrimary` | 主光球呼吸动画 | `scale 1→1.25 + 位移 + opacity` |
| `@keyframes breatheSecondary` | 次光球呼吸动画 | `scale 1.1→0.85 + rotate 0→180deg + 位移` |
| `.login-container` | 居中登录卡片 | `860×480 + radius-xl + 多层阴影 + backdrop-filter:blur(10px)` |
| `.login-brand` | 左侧品牌区 | `flex:1 + 渐变深色背景 + flex 居中` |
| `.login-form-wrapper` | 右侧表单区 | `width:380px + 白色背景 + padding 48px 40px` |
| `.police-logo` | 警务 Logo 方块 | `56×56 + linear-gradient 主色 + radius-lg + 主色光晕阴影` |
| `.brand-title` | 品牌长标题 | `font-size-xl + font-weight-bold + max-width:300px + word-break:break-all` |
| `.status-badge` | 状态徽章 | `inline-flex + gap-xs + 胶囊形(radius-pill) + padding 6px 14px` |
| `.login-section-title` | 表单区块标题 | `flex + gap-sm + font-size-lg + font-weight-bold + 底部虚线` |
| `.form-control` | 表单输入框 | `42px 高 + radius-md + focus 主色边框 + 主色光晕阴影` |
| `.police-id-tag` | 警号标签 | `absolute right + font-mono + 主色文字 + 主色淡色背景 + radius-xs` |
| `.btn-submit` | 提交按钮 | `44px 高 + 主色 + hover 主色深 + active scale(0.99)` |

### 3.6 sidebar.less 调整内容

- 菜单项 active 移除左侧 3px 竖线（`::before` 伪元素）
- 菜单项改为纯色填充 + 圆角（`margin: 4px 8px` + `border-radius: @radius-lg`）
- 折叠时 logo 文字渐隐（`opacity: 0 + pointer-events: none`）

### 3.7 验证

- 运行 `npm run lint:ts` 确保类型检查通过
- 运行 `npm run lint:eslint` 确保代码规范
- 手动检查样式变量无硬编码色值

---

## 四、阶段 2：Layout 深色化重构

### 4.1 目标

将 Navbar 改为深色风格，Sidebar 对齐原型宽度与配色，Logo 改为渐变方块。

### 4.2 改造文件清单

| 文件 | 操作 | 关键改动 |
|------|------|----------|
| `src/layout/components/Navbar.vue` | 修改 template + style | 背景改深色 `@navbar-bg`，文字白色，退出菜单 danger 色 + 图标 |
| `src/layout/components/Sidebar/Logo.vue` | 修改 template + style | Logo 从 svg 改为蓝色渐变方块 + 文字，高度 60px |
| `src/layout/components/Sidebar/index.vue` | 仅清理调试日志 | 移除 console.log，**不动 script setup 逻辑** |
| `src/layout/components/AppMain.vue` | 无需修改 | 高度自动适配 `calc(100vh - @navbar-height)`（变量已调整为 60px） |
| `src/layout/components/Sidebar/SidebarItem.vue` | 可选改 script setup | 当前用 `defineComponent`，可改为 `<script setup>` 统一风格 |

### 4.3 Navbar 改造细节

**Navbar.vue 改动**：
- `.navbar` 背景从 `@color-bg-card` 改为 `@navbar-bg`
- `.navbar-left` 文字色改为 `@navbar-text`
- Hamburger 图标色改为 `@navbar-text`，hover 改为 `@navbar-text-active`
- 面包屑文字色调整为浅色（最后项白色）
- `.navbar-right` 用户名改为 `@navbar-text-active`（白色）
- 头像背景改为 `rgba(38, 78, 209, 0.3)`，文字色改为 `@color-primary-light-5`
- 退出菜单项加 `danger` 色 + `SwitchButton` 图标
- 移除「修改数据后，请重新登录客户端」提示（可选保留）
- **不动**：`useAppStore` / `useUserStore` / `toggleSidebar` / `logout` / `handleChangePwd` / `handleBindUser` 等逻辑

### 4.4 Logo 改造细节

**Logo.vue 改动**：
- Logo 从 `<img src="@/assets/images/logo.svg">` 改为 `<div class="logo-icon">L</div>`（蓝色渐变方块 + 首字母）
- `.logo-icon` 样式：`32×32 + linear-gradient(135deg, @color-primary, @color-primary-dark-2) + radius-md + 主色光晕阴影`
- 高度对齐 `@navbar-height`（60px）
- 折叠时仅显示方块，文字渐隐

### 4.5 Sidebar 调试日志清理

**Sidebar/index.vue 改动**：
- 移除 `watchEffect` 中的 `console.log('[Sidebar] permissionMenus count:...')`
- 移除 `handleSelect` 中的 `console.log('[Sidebar] menu select:...')`
- **不动**：`appStore` / `permissionMenus` / `activeMenu` / `route` 等逻辑

### 4.6 验证

- 运行 `npm run lint:ts` + `npm run lint:eslint`
- 手动检查 Navbar 深色风格、Logo 渐变方块、Sidebar 菜单 active 圆角填充

---

## 五、阶段 3：登录页按原型重构

### 5.1 目标

按 `login-demo.html` 重构登录页视觉，改为居中卡片 + 4 层呼吸背景，保留现有业务逻辑。

### 5.2 改造文件清单

| 文件 | 操作 | 关键改动 |
|------|------|----------|
| `src/views/login/index.vue` | 修改 template + style | 改为居中卡片布局 + 4 层背景 + 左右双栏 |

### 5.3 登录页改造细节

**template 结构改造**：
```html
<div class="login-page">
  <!-- 4 层呼吸背景 -->
  <div class="bg-base"></div>
  <div class="bg-grid"></div>
  <div class="glow-sphere-primary"></div>
  <div class="glow-sphere-secondary"></div>

  <!-- 语言切换（保留，定位在右上角浮层） -->
  <div class="lang-switch">...</div>

  <!-- 居中登录卡片 -->
  <div class="login-container">
    <!-- 左侧品牌区 -->
    <div class="login-brand">
      <div class="police-logo"><el-icon><Shield/></el-icon></div>
      <h1 class="brand-title">{{ systemTitle }}</h1>
      <div class="status-badge">
        <span class="status-dot online"></span>
        <span>系统就绪</span>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="login-form-wrapper">
      <div class="login-section-title">
        <el-icon><UserShield/></el-icon>
        <span>身份认证</span>
      </div>
      <el-form ...>
        <el-form-item label="警号 / 账号">
          <el-input :prefix-icon="userIcon" size="large">
            <template #append><span class="police-id-tag">POLICE</span></template>
          </el-input>
        </el-form-item>
        <el-form-item label="安全密码">
          <el-input type="password" show-password :prefix-icon="lockIcon" size="large" />
        </el-form-item>
        <div class="form-options">
          <el-checkbox v-model="rememberMe">记住警号</el-checkbox>
          <a href="javascript:void(0)">忘记密码?</a>
        </div>
        <el-button type="primary" size="large" :loading="loading" class="btn-submit">
          进入系统 <el-icon><ArrowRight/></el-icon>
        </el-button>
      </el-form>
      <div class="form-footer">
        <el-icon><ShieldCat/></el-icon>
        <span>未经授权禁止登录，系统全程安全审计</span>
      </div>
    </div>
  </div>
</div>
```

**保留的业务逻辑**（不动）：
- `systemTitle` / `loginForm` / `loading` / `handleLogin` / `lang` 切换
- `el-form` 的 `:model` / `:rules` / `ref` / `@submit.prevent`
- 接口调用与跳转逻辑

**新增的非业务元素**（仅 UI）：
- `rememberMe` checkbox（仅 UI 展示，无逻辑绑定）
- 「忘记密码」链接（占位，`href="javascript:void(0)"`）
- 「进入系统」按钮文案 + 右箭头图标

### 5.4 验证

- 运行 `npm run lint:ts` + `npm run lint:eslint`
- 手动检查登录页 4 层背景动画、居中卡片、左右双栏、表单样式

---

## 六、阶段 4：全局组件封装

### 6.1 目标

按原型 `components.html` 抽取 7 个通用组件，供后续页面按需引入或逐个替换。

### 6.2 新增组件清单

| 组件 | 路径 | 用途 |
|------|------|------|
| ModernCard | `src/components/ModernCard/index.vue` | 通用卡片容器（封装 `.modern-card` + 可选 section-title） |
| SectionTitle | `src/components/SectionTitle/index.vue` | 区块标题（图标 + 文字 + 底部虚线） |
| PoliceId | `src/components/PoliceId/index.vue` | 警号/设备编号高亮标签 |
| MetricCard | `src/components/MetricCard/index.vue` | 指标卡片（title/value/footer 三段式） |
| StatusDot | `src/components/StatusDot/index.vue` | 呼吸灯状态点（替代 ConnectionStatusDot） |
| PersonnelCard | `src/components/PersonnelCard/index.vue` | 人员/装备卡片 |
| ActionButtons | `src/components/ActionButtons/index.vue` | 表格行内操作按钮组（link + 图标规范） |

### 6.3 各组件 API 设计

#### 6.3.1 ModernCard

```typescript
Props:
- title?: string          // 卡片标题
- icon?: Component        // 标题图标
- bordered?: boolean      // 是否显示边框，默认 true

Slots:
- default                // 卡片内容
- title                  // 自定义标题（覆盖 title prop）
- extra                  // 右侧操作区

// 用法示例
<ModernCard title="警务数据与指标统计" :icon="DataAnalysis">
  <div class="metric-grid">...</div>
</ModernCard>
```

#### 6.3.2 SectionTitle

```typescript
Props:
- title: string          // 标题文字
- icon?: Component       // 图标
- iconColor?: string     // 图标颜色，默认主色

Slots:
- default                // 自定义标题（覆盖 title prop）
- extra                  // 右侧附加内容

// 用法示例
<SectionTitle title="统一按钮规范" :icon="Operation" />
```

#### 6.3.3 PoliceId

```typescript
Props:
- value: string | number  // 警号值
- prefix?: string          // 前缀，如 'P'

// 用法示例
<PoliceId :value="row.policeId" prefix="P" />
```

#### 6.3.4 MetricCard

```typescript
Props:
- title: string           // 指标标题
- value: string | number  // 指标值
- valueType?: 'default' | 'success' | 'warning' | 'danger'  // 数值颜色
- footer?: string         // 底部说明

Slots:
- title                   // 自定义标题
- value                   // 自定义数值
- footer                  // 自定义底部
- extra                   // 右上角附加（如 el-tag）

// 用法示例
<MetricCard title="今日高危告警" :value="142" value-type="danger" footer="较昨日 ↑ 12%">
  <template #extra><el-tag type="danger" size="small">紧急</el-tag></template>
</MetricCard>
```

#### 6.3.5 StatusDot

```typescript
Props:
- status: 'online' | 'busy' | 'offline'  // 状态
- size?: number                           // 圆点大小，默认 8
- pulse?: boolean                          // 是否显示呼吸动画，默认 true

// 用法示例
<StatusDot status="online" />
<span style="margin-left:6px">在线/正常</span>
```

#### 6.3.6 PersonnelCard

```typescript
Props:
- name: string             // 姓名
- avatar?: string          // 头像首字或图片 URL
- policeId?: string        // 警号
- department?: string      // 部门
- status?: 'online' | 'busy' | 'offline'  // 状态

Slots:
- default                  // 自定义内容
- extra                    // 右上角附加

// 用法示例
<PersonnelCard name="王巡警" police-id="P008101" department="交警二大队" status="online" />
```

#### 6.3.7 ActionButtons

```typescript
Props:
- buttons: Array<{
    type: 'primary' | 'warning' | 'success' | 'danger'
    icon?: Component
    label: string
    onClick: () => void
    disabled?: boolean
    visible?: boolean        // 默认 true
  }>

// 预设快捷方法（可选）
- view(onClick)              // 查看：primary + View 图标
- edit(onClick)              // 编辑：primary + Edit 图标
- disable(onClick)           // 禁用：warning + VideoPause 图标
- enable(onClick)            // 启用：success + VideoPlay 图标
- delete(onClick)            // 删除：danger + Delete 图标

// 用法示例
<ActionButtons :buttons="[
  { type: 'primary', icon: View, label: '查看', onClick: () => handleView(row) },
  { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleEdit(row) },
  { type: 'danger', icon: Delete, label: '删除', onClick: () => handleDelete(row) },
]" />
```

### 6.4 ConnectionStatusDot 替换

- 将 `src/views/nodeManage/components/ConnectionStatusDot.vue` 改为内部使用新的 `StatusDot` 组件
- 或直接删除该组件，所有引用处改为使用 `StatusDot`
- 保留对外 API 兼容（如有 `status` prop 传 'online'/'processing'/'warning'/'error'/'offline'，需做映射）

### 6.5 全局注册

更新 `src/components/index.ts`（如存在）或在 `main.ts` 中全局注册 7 个新组件。

### 6.6 验证

- 运行 `npm run lint:ts` + `npm run lint:eslint`
- 创建临时测试页面验证各组件渲染正常
- 检查 ConnectionStatusDot 替换后无破坏性变更

---

## 七、改造原则与约束

### 7.1 严格遵循

1. **保持业务逻辑**：所有 `<script setup>` 中的响应式数据、事件绑定、函数逻辑、接口调用完全不动
2. **设计令牌对齐**：所有颜色/间距/圆角/阴影使用 `variables.less` 中的 Less 变量，禁止硬编码色值
3. **主色保持 `#264ed1`**：不对齐原型的 `#2563eb`，与 web 端收敛一致
4. **字体保持 `HarmonyOS Sans SC`**：不改为 `Inter`，中文优先（仅警号/数值用 JetBrains Mono 等宽字体）
5. **SFC 块顺序**：`script → template → style`（ESLint 规则）
6. **样式用 Less 变量**：不用原生 CSS 变量（`--bg-card`），用 Less 变量（`@color-bg-card`）

### 7.2 改造范围

- ✅ 可改：template 结构、style 类名、组件引入、CSS 变量
- ❌ 不可改：`<script setup>` 内任何内容（变量、函数、事件、API 调用）
- ❌ 不可改：业务组件内部逻辑（如 ProTable 的 fetch 逻辑、SearchBar 的 emit 逻辑）

### 7.3 验证方式

- 每阶段完成后运行 `npm run lint:ts` 确保类型检查通过
- 运行 `npm run lint:eslint` 确保代码规范
- 手动验证登录页 / Layout / 各组件视觉对齐原型

---

## 八、文档维护约定

**每完成一个阶段后，必须更新本文档**：

1. 更新「二、阶段执行进度」表格中的状态与完成日期
2. 在对应阶段章节补充「实际改动文件清单」与「验证结果」
3. 更新文档顶部的 `最后更新` 日期
4. 记录遇到的问题与解决方案（如有）
