# LxUI 设计规范（含完整备注）

> 版本：v1.0 | 日期：2026-09-22
> 本文是 LxUI 的**唯一视觉与交互规范源**。所有组件实现、demo 编写、业务接入均以本文为准。
> 姊妹文档：`DESIGN.md`（架构与迁移）、`COMPONENT-SPEC.md`（组件接口签名）、`DOCS-SITE.md`（文档站与 demo 规范）。
> 视觉源头：`doc/stitch_侧边栏/stitch_/`（侧边栏唯一设计源，`_1` rail + `_2` expanded）。

---

## 目录

1. [设计原则（含 Why / 何时不用）](#1-设计原则)
2. [状态语义系统（跨组件一致性核心）](#2-状态语义系统)
3. [设计令牌完整备注表](#3-设计令牌完整备注)
4. [布局系统与壳层尺寸推导](#4-布局系统)
5. [动效规范](#5-动效规范)
6. [字体与排版](#6-字体与排版)
7. [主题系统（亮色 / HUD 深色）](#7-主题系统)
8. [组件通用行为约定](#8-组件通用行为约定)
9. [可访问性规范](#9-可访问性规范)
10. [命名规约](#10-命名规约)
11. [反模式清单（禁止事项）](#11-反模式清单)

---

## 1. 设计原则

每条原则均包含：**定义、设计依据（Why）、适用边界（何时不适用）**。评审组件 PR 时逐条对照。

### P1. 状态收敛为圆点

- **定义**：业务状态（在线/离线/告警/处理中）一律用 6-8px 实心圆点表达（`LxStatusDot`），不使用彩色色块、彩色标签。
- **Why**：管理端单屏状态元素可达数百个（表格每行 1-3 个状态），色块标签会形成大面积噪声；圆点面积小、颜色语义唯一，扫视效率最高。stitch 设计源中所有表格行、侧边栏徽章、时间线节点均遵循此规则。
- **何时不适用**：状态需要携带**文字信息**且该文字不能从行内其他列推断时（如"临时离岗(巡查)"），改用 `LxTag`（浅底深字），但仍建议前置 `LxStatusDot`。

### P2. 表格行内操作用纯文字

- **定义**：表格行内操作按钮一律纯文字链接（`LxActionButtons`），禁止图标按钮。
- **Why**：行内操作数量多（编辑/删除/授权/重置密码...），图标需记忆、易歧义；文字按钮零学习成本。溢出折叠进"更多"下拉。
- **何时不适用**：卡片角落、工具栏（toolbar）等**非行内**场景可以用图标按钮（面积大、密度低）。

### P3. 输入框纯净

- **定义**：输入框不加装饰性图标。唯一例外：搜索框左侧放大镜（功能性图标）。
- **Why**：装饰图标与左 padding 叠加会挤压输入区宽度；中文占位符较长，空间宝贵。
- **何时不适用**：带后缀单位（如"ms"）、清空按钮（el-input 原生 clearable）属于功能件，允许。

### P4. 数值等宽

- **定义**：所有数字、编号、警号、车牌、案件号、坐标使用 `font-variant-numeric: tabular-nums`；编号类额外用等宽字体（`LxCodeSlot`）。
- **Why**：实时刷新的指标（延迟 18ms→22ms）若数字宽度抖动，会造成布局横跳；等宽编号便于肉眼 pattern match（stitch 设计源明文要求）。
- **何时不适用**：正文叙述中的普通数字（如"3 个工作日内"）不需要。

### P5. 阴影三档制

- **定义**：全库只允许 3 档阴影：`--lx-shadow-card`（卡片静态）、`--lx-shadow-pop`（浮层/下拉）、`--lx-shadow-modal`（模态/抽屉）。
- **Why**：阴影档位越多，层次语义越乱。卡片层次靠 `border` + 背景色区分（admin-vue3 现有 DESIGN.md "色块优先，阴影次之"原则保留）。
- **何时不适用**：无例外。发光效果（`--lx-glow-active`）不属于阴影体系，仅限侧边栏激活态与 HUD 仪表。

### P6. 圆角三档制

- **定义**：2px（微标签/代码槽）/ 4px（按钮、输入、卡片、表格容器）/ 8px（弹窗、抽屉）。50% 圆仅限头像与状态圆点。
- **Why**：对齐 Element Plus 惯例，降低用户认知切换成本。

### P7. 组件数据无关

- **定义**：组件不发起请求、不持有业务状态。所有数据经 props 传入、所有意图经 events 抛出、所有定制经 slots 透出。
- **Why**：这是组件库可复用的底线。一旦 ProTable 内置 axios，则 mock 场景、测试、H5 端、未来 GraphQL 全部被锁死。
- **何时不适用**：纯 UI 行为（如 LxToast 的复制后提示）不算业务数据。

### P8. Token 强制

- **定义**：组件样式**只允许**引用 `var(--lx-*)`，禁止硬编码色值/尺寸。验收用 stylelint 规则机械检查。
- **Why**：运行时换肤（亮色 ↔ HUD 深色）依赖 CSS 变量穿透；硬编码一处则主题残缺一处。

---

## 2. 状态语义系统

**这是全库一致性最重要的表。** 所有组件的状态语义共用同一枚举 `LxStatus`，映射关系如下。业务方把后端枚举翻译成本表状态，组件库不再二次映射（除 `StatusDot.code` 兼容层）。

### 2.1 状态总表

| LxStatus | 色彩 token | 圆点色值 | 浅背景 token | 语义（唯一） | 典型业务场景 |
|---|---|---|---|---|---|
| `online` | `--lx-color-success` | `#67c23a` | `--lx-color-success-light` (#f0f9eb) | 正常/在线/在岗/已连接 | 设备在线、人员在岗、网关连通、License 正常 |
| `processing` | `--lx-color-primary-container` | `#409eff` | `--lx-color-primary-light` (#ecf5ff) | 进行中/流转中/换班中 | 任务流转、数据同步中、审批中 |
| `busy` | `--lx-color-warning` | `#e6a23c` | `--lx-color-warning-light` (#fdf6ec) | 忙碌/临时离岗/降级/待处理 | 临时离岗(巡查)、队列积压、License 即将到期 |
| `error` | `--lx-color-error` | `#f56c6c` | `--lx-color-error-light` (#fef0f0) | 错误/断开/紧急/高危 | 设备离线故障、布控告警、紧急警情、鉴权失败 |
| `offline` | `--lx-color-info` | `#909399` | `--lx-color-info-light` (#f4f4f5) | 离线/停用/归档/只读 | 停用账号、归档群组、历史数据 |
| `success` | 同 `online` | — | — | （别名）动作成功反馈场景 | 保存成功 toast、任务办结 |
| `warning` | 同 `busy` | — | — | （别名）警示反馈场景 | 确认框警示文案 |

> **备注**：`success/warning` 是给**动作反馈**（Toast/Tag）用的别名，状态指示（Dot/Switch/Metric）一律用 `online/busy`。这样"状态点绿=设备在岗"、"toast 绿=操作成功"两个心智模型互不干扰。

### 2.2 后端枚举 → LxStatus 映射约定

映射逻辑**只存在于业务层**（建议各业务域封装一个 `statusMap.ts`）。示例（节点管理）：

```ts
// apps/admin-vue3/src/views/nodeManage/statusMap.ts —— 业务侧职责
export const NODE_STATUS: Record<number, LxStatus> = {
  0: 'offline', 1: 'processing', 2: 'processing', 3: 'error',
  4: 'online',  5: 'busy',       6: 'error',      7: 'processing',
};
```

现有 `StatusDot.code`(0-7) 兼容逻辑已覆盖上述映射，迁移期保留，稳定后业务侧收敛到显式映射。

### 2.3 状态 × 组件适用矩阵

| 组件 | online | processing | busy | error | offline |
|---|:-:|:-:|:-:|:-:|:-:|
| LxStatusDot | ✅+呼吸动画 | ✅ | ✅ | ✅（可叠加 tacticalBlink） | ✅ |
| LxTag | ✅ | ✅ | ✅ | ✅ | ✅ |
| LxMetricCard.badge | ✅ | ✅ | ✅ | ✅ | ✅ |
| LxNavbar.networkStatus | ✅ | — | ✅ | ✅ | — |
| LxSidebarItem.badgeType | ✅ | ✅ | ✅ | ✅ | — |
| LxToast | —（用 success） | — | warning | error | info* |
| LxConfirmDialog | — | — | — | danger 属性 | — |

*LxToast 沿用 el-message 四型：success/warning/error/info，不接入 LxStatus 枚举（反馈≠状态）。

---

## 3. 设计令牌完整备注

### 3.1 品牌色

| Token | 值 | 备注（用途 / 边界 / 替代） |
|---|---|---|
| `--lx-color-primary` | `#0060a9` | **唯一主色**。主按钮、激活 Tab、链接、选中态、图标强调。**禁用**于大面积背景（会压过内容）；大面积请用 `--lx-color-primary-light`。hover 态用 `#00508f`（计算值，token 化为 `--lx-color-primary-hover`） |
| `--lx-color-primary-container` | `#409eff` | 亮一档的容器蓝。用于：深色侧边栏上的激活文字/图标（对比 `#0060a9` 在深底上不够亮）、`processing` 状态色、进度条填充（stitch Card2 用法）。**注意**：不是按钮色，按钮一律 `primary` |
| `--lx-color-primary-light` | `#ecf5ff` | 主色 95% 浅底。用于：Tag 浅底、hover 行背景替代灰、选中项底色。当需要"主色暗示但零攻击性"时用它 |
| `--lx-color-on-primary` | `#ffffff` | 主色底上的文字。**禁止**直接写 `#fff` |

### 3.2 功能语义色

均遵循 `深(文字/圆点) + 浅(背景)` 成对使用，**禁止交叉混搭**（如 warning 深色配 error 浅底）。

| Token 对 | 深值 | 浅值 | 备注 |
|---|---|---|---|
| success | `#67c23a` | `#f0f9eb` | 唯一"正常"色。**不得**用于普通操作按钮（绿色按钮仅限"启用"类开关型动作） |
| warning | `#e6a23c` | `#fdf6ec` | 唯一"注意"色。文字在浅底上对比度 3.1:1，**仅用于 ≥12px 粗体**文字；细小文字场景加深为 `#cf8a1e` |
| error | `#f56c6c` | `#fef0f0` | 唯一"危险"色。危险按钮实底 `#f56c6c` 白字；删除链接直接用深值。**不得**用于装饰 |
| info | `#909399` | `#f4f4f5` | 唯一"中性"色。次要文字、禁用态、归档态、LxCodeSlot 底色 |

### 3.3 表面与边框

| Token | 值 | 备注 |
|---|---|---|
| `--lx-bg-page` | `#f0f2f5` | 页面画布。与卡片 `#fff` 形成 5% 明度差，足够区分且不刺眼（stitch 工作区标准） |
| `--lx-bg-card` | `#ffffff` | 所有卡片/表格/弹窗容器 |
| `--lx-bg-card-hover` | `#f2f4f8` | 卡片 hover（诊断微卡场景，stitch 底部微卡用法） |
| `--lx-border` | `#e4e7ed` | 卡片、表格容器外框 |
| `--lx-border-light` | `#ebeef5` | 表格行分隔线、卡片 header 下分隔线（比外框浅，体现"外实内虚"） |

### 3.4 文字

| Token | 值 | 用途 | 禁用场景 |
|---|---|---|---|
| `--lx-text-primary` | `#1d2129` | 标题、表头、指标数值 | 正文（过重） |
| `--lx-text-regular` | `#4e5969` | 正文、表格行 | — |
| `--lx-text-secondary` | `#86909c` | 辅助说明、时间戳、占位 | 长正文（对比度不足） |
| `--lx-text-on-dark` | `#ffffff` | 深底反白 | — |

### 3.5 侧边栏专项（设计源：stitch_侧边栏 `_2` 展开态）

| Token | 值 | 备注 |
|---|---|---|
| `--lx-sidebar-bg` | `#0c1424` | 展开态背景（`_2`）。比 rail 态 `#131b27` 更深——因为展开态有标题文字，需要更深底衬托；rail 态只有图标，背景可略浅 |
| `--lx-sidebar-bg-rail` | `#131b27` | rail 态背景（`_1`） |
| `--lx-sidebar-bg-header` | `#090f1b` | 品牌区底色，比主体更深一档形成"帽檐" |
| `--lx-sidebar-border` | `#1e2f47` | 右侧分隔线。**刻意偏蓝**（非纯灰），呼应 HUD 战术风格 |
| `--lx-sidebar-submenu-bg` | `#0e1728` | 二级菜单组容器底（`_2` 的 `bg-[#0e1728]/70`） |
| `--lx-sidebar-text` | `#cbd5e1` | 一级文字（slate-300） |
| `--lx-sidebar-text-muted` | `#94a3b8` | 图标、二级文字（slate-400） |
| `--lx-sidebar-active-text` | `#7dd3fc` | 激活态文字（sky-300）。**注意**：激活文字是青蓝不是 primary 蓝——深底上 `#409eff` 亮度和饱和度不够"通电感"，stitch 设计源明确用 sky 系 |
| `--lx-sidebar-active-glow` | `#38bdf8` | 激活竖条颜色 + `box-shadow: 0 0 8px` 光晕源色（sky-400） |
| `--lx-sidebar-hover-bg` | `rgba(255,255,255,0.05)` | hover 底。白 5% 透明，比实色更柔 |

### 3.6 尺寸

| Token | 值 | 备注 |
|---|---|---|
| `--lx-sidebar-width` | `252px` | 展开态宽度（`_2` 实测值）。8 的倍数，容纳 7 字标题 + 图标 + 箭头 + padding 富余 |
| `--lx-sidebar-rail-width` | `64px` | rail 态宽度（`_1`）。容纳 40px 图标区 + 两侧 12px padding |
| `--lx-sidebar-item-height` | `36px` | 一级项高（`_2` h-9） |
| `--lx-sidebar-subitem-height` | `28px` | 二级项高（`_2` h-7） |
| `--lx-navbar-height` | `56px` | 顶栏（h-14，双方案一致） |
| `--lx-tabsbar-height` | `36px` | 页签栏（h-9） |

### 3.7 间距 / 圆角 / 阴影 / 动效令牌

见 `DESIGN.md` §3.2。备注补充：

- 间距梯度只保留 **4/8/12/16/24** 五档（4 的倍数收敛），禁止出现 10/18/20 等杂值。表格单元格上下 padding 用 12（compact 8）。
- `--lx-glow-active: 0 0 8px #38bdf8`：**唯一允许的发光效果**，仅用于侧边栏激活竖条。仪表发光、按钮发光一律禁止。

---

## 4. 布局系统

### 4.1 壳层结构推导

```
┌─────────┬──────────────────────────────────────┐
│         │ LxNavbar (56px, bg #fff, border-b)    │
│ Sidebar │ LxTabsBar (36px, bg #f4f6fa)          │
│ (252 /  ├──────────────────────────────────────┤
│  64px)  │                                      │
│         │   --lx-bg-page (#f0f2f5)             │
│         │   LxPageCard → 内容                   │
│         │   外边距 20px（stitch margin 规范）   │
└─────────┴──────────────────────────────────────┘
```

内容区顶部偏移 = `56 + 36 = 92px`（stitch `pt-[92px]` 推导一致）。

### 4.2 双形态切换规则

| 触发 | 行为 |
|---|---|
| 用户点击底部 toggle | `mode` 受控切换，业务侧持久化（cookie/localStorage，参考 admin-vue3 现有 appStore.sidebar.opened 机制） |
| 窗口 < 768px | 业务层切 `mobile` 抽屉模式（overlay + 遮罩），组件提供 `mobile` prop |
| 768 ≤ 窗口 < 1366 | 业务层建议切 rail（1366 笔记本折叠腾空间，沿用现有策略） |
| 进入 HUD 大屏模式 | 业务层切 `mode="rail"` + `lx-theme-hud` 主题类 |

### 4.3 栅格

- 页面内容 `max-width: 1680px` 居中（stitch 布局），超宽屏两侧留白。
- 指标卡：`grid-cols-1 → sm:2 → xl:4`；7:5 分栏用 `lg:grid-cols-12`（7+5）。
- gutter 一律 16px（`--lx-space-lg`）。

---

## 5. 动效规范

全库**只有 3 种动画**，参数固定，禁止自造。

| 名称 | 定义 | 时长/曲线 | 用途 | 禁用场景 |
|---|---|---|---|---|
| **color-fade** | `transition: color/background-color/border-color` | `0.2s cubic-bezier(.645,.045,.355,1)` | 一切 hover/激活态 | — |
| **hudPulse** | opacity 0.35→0.85 + scale 1→1.05 循环 | `3.5s ease-in-out infinite` | 侧边栏品牌区同心环、在线状态呼吸点 | 同屏超过 20 个呼吸点（噪声） |
| **tacticalBlink** | opacity 1→0.25 循环 | `1.4s ease-in-out infinite` | 高危未处理告警（error 级且需行动） | 一般 warning（闪烁是稀缺资源） |

**prefers-reduced-motion**：三种动画在用户系统开启减少动效时全部禁用（组件库全局处理，业务无需关心）。

---

## 6. 字体与排版

| 层级 | 字号/字重/行高 | 用途 |
|---|---|---|
| display-lg | 28px / 600 / 36 | 大屏核心指标 |
| headline-lg | 20px / 600 / 28 | 页面主标题（LxPageCard.title 用 16px 版本，页面 banner 用 20px） |
| headline-md | 16px / 600 / 24 | 卡片标题 |
| label-lg | 14px / 500 / 20 | 一级菜单文字、按钮 |
| body-lg | 14px / 400 / 22 | 表单、正文 |
| body-md | 13px / 400 / 20 | 表格行（admin 紧凑惯例） |
| label-md | 12px / 500 / 16 | 二级菜单、Tag、徽章 |
| body-sm | 12px / 400 / 18 | 时间戳、辅助说明 |
| label-sm | 11px / 500 / 14 | 微徽章（NODE-01、SLA 数值） |

**字体栈**：`'HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', Inter, sans-serif`（保留现有中文字体优先决策）；等宽：`'JetBrains Mono', Consolas, monospace`（数值/编号）。

**表格密度**：常规行高 44px（padding 12 上下），`compact` 36px。表头 40px 灰底 `#f5f7fa`。

---

## 7. 主题系统

### 7.1 机制

CSS 变量 + 根元素 class 切换，**运行时生效，无需重编译**：

```ts
// lx-tokens 导出的切换工具（业务侧也可直接操作 class）
import { setTheme } from 'lx-tokens';
setTheme('hud');    // <html class="lx-theme-hud">
setTheme('light');   // 移除
```

### 7.2 HUD 深色主题覆盖范围（`.lx-theme-hud`）

```css
.lx-theme-hud {
  --lx-bg-page: #0b1220;         /* 深空画布 */
  --lx-bg-card: #101a2c;         /* 深色卡片 */
  --lx-text-primary: #e2e8f0;
  --lx-text-regular: #94a3b8;
  --lx-border: #1e2f47;
  --lx-color-primary-light: rgba(56, 189, 248, 0.12); /* sky 侵入 */
  /* 侧边栏 token 不变（本来就是深色） */
  /* 功能色深浅对调：浅底变深底亮字 */
  --lx-color-success-light: rgba(103, 194, 58, 0.15);
  --lx-color-warning-light: rgba(230, 162, 60, 0.15);
  --lx-color-error-light: rgba(245, 108, 108, 0.15);
  --lx-color-info-light: rgba(144, 147, 153, 0.15);
}
```

**验收标准**：任何组件在两个主题下切换零残缺（P8 token 强制保证）。文档站提供主题切换器全局预览。

---

## 8. 组件通用行为约定

| 约定 | 内容 | 备注（Why） |
|---|---|---|
| **受控优先** | 显隐/值/激活态一律 `modelValue` 或显式 prop + `update:xxx` | 父组件随时可接管状态；测试容易；参考 EP el-input 模式 |
| **事件命名** | `update:modelValue`、`update:page` 等 kebab 事件 + `change/select/close` 语义事件 | 双事件：update 给 v-model，语义事件给监听 |
| **slot 命名** | `header-extra`（标题右侧）、`toolbar`（工具区）、`footer`（底部）、`leading/trailing`（前/后缀）、`cell-${key}`（表格列） | 命名统一后业务方跨组件零查文档 |
| **透传属性** | 未声明 props 自动 `$attrs` 落到根元素（inheritAttrs 按需关闭手动绑定） | class/style 透传是隐式需求 |
| **加载态** | 有异步可能的组件必须实现 `loading` prop（转圈/骨架） | 数据无关 ≠ 不管加载视觉 |
| **空态** | 有列表语义的组件内置 `LxEmpty` 兜底 | — |
| **禁用态** | 交互组件必须支持 `disabled`（视觉：40% 透明 + cursor not-allowed） | — |
| **尺寸** | 三档 `small/default/large`，默认 `default` | **不沿用** admin-vue3 的全局 large（见 DESIGN.md §8 决策 3） |

---

## 9. 可访问性规范

| 项 | 要求 |
|---|---|
| 对比度 | 正文 ≥ 4.5:1；大标题/图标 ≥ 3:1。已知风险：warning 深色 #e6a23c 在白底 3.1:1——仅限 ≥12px 粗体（§3.2 已注明） |
| 焦点 | 自绘交互件必须 `:focus-visible` 样式（2px primary 外圈，offset 2px） |
| aria | 图标按钮 `aria-label`（rail 模式依赖 title，同时补 aria）；弹窗 `role="dialog"`；侧边栏 `role="navigation"` + `aria-current="page"` |
| 键盘 | 侧边栏 ↑↓ 导航、Enter 展开、Esc 收起；弹窗 focus trap；抽屉 Esc 关闭 |
| 动效 | `prefers-reduced-motion` 全局禁用动画（§5） |

---

## 10. 命名规约

| 对象 | 规约 | 正例 / 反例 |
|---|---|---|
| 组件 | `Lx` + PascalCase | `LxSidebar` ✅ / `LxSideBar` ❌ |
| 组件目录 | PascalCase，内 `index.vue` + `types.ts` + `demo/` | `LxSidebar/` |
| CSS 类 | `lx-` + BEM | `lx-sidebar__item--active` |
| props/events | camelCase，布尔不加 is 前缀（跟随 Vue 风格） | `activeKey` / `showText` |
| emit 值事件 | `update:modelValue` / `update:mode` | — |
| CSS 变量 | `--lx-` + 分类前缀（color/bg/text/sidebar/shadow/radius） | `--lx-sidebar-active-glow` |
| TS 类型 | `Lx` 前缀导出 | `LxMenuItem` |

---

## 11. 反模式清单（PR 评审必查）

1. ❌ 组件内出现 `axios` / `import.meta.env` / 业务 API 路径
2. ❌ 样式硬编码色值（stylelint `declaration-property-value-disallowed-list` 强制）
3. ❌ 第 4 种动画 / 第 4 档阴影 / 非法圆角
4. ❌ 状态用色块而非圆点（P1）
5. ❌ 表格行内图标按钮（P2）
6. ❌ 组件内 `console.log` / 递增 zIndex 魔法数（浮层 z-index 统一：popover 2000 / modal 3000 / message 4000）
7. ❌ 文档 demo 引入 mock 数据以外的业务依赖
8. ❌ 修改 Element Plus 全局变量绕过 `lx-tokens`
9. ❌ 组件文案硬编码中文（文案 prop 化或 slot 化，i18n 由业务层）
10. ❌ 新组件无文档页、无 demo、无 types.ts 就合入
