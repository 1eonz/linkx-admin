# LxUI 文档站与 Demo 编写规范

> 版本：v1.0 | 日期：2026-09-22
> 目标：对标 Element Plus / Ant Design 官方文档站的组件文档体系。
> 定位：文档站是组件库的**交付物之一**——没有文档页的组件视为未完成。

---

## 1. 技术选型

| 方案 | 结论 | 理由 |
|---|---|---|
| **VitePress** ✅ | 采用 | EP 官方同款；md + 内嵌 vue 代码块天然支持；demo 代码块与预览一体化；构建快；主题可定制深浅色 |
| Storybook | 弃 | 重、React 味重、mdx 心智负担 |
| 自建 Vue 站点 | 弃 | 重复造轮子，失去 md 生态 |

**关键机制**：demo 直接 import 组件库源码（workspace 协议），**改组件 → 文档站热更新**，文档永远与代码同版本，不存在文档滞后。

---

## 2. 站点结构（monorepo 内）

```text
linkx-fe/
├─ packages/
│  ├─ lx-tokens/
│  └─ lx-ui/
│     └─ src/components/LxSidebar/
│        ├─ index.vue
│        ├─ types.ts
│        └─ demo/                        # ← demo 与组件同目录（就近维护）
│           ├─ basic.vue                 # 每个 demo 一个文件
│           ├─ rail-mode.vue
│           └─ controlled.vue
├─ apps/
│  └─ docs/                              # VitePress 文档站
│     ├─ .vitepress/
│     │  ├─ config.ts                    # 导航 + 主题（含亮/HUD 切换器）
│     │  └─ theme/
│     │     ├─ index.ts                  # 注册 lx-ui（全量）+ lx-tokens
│     │     └─ DemoContainer.vue         # EP 风格 demo 容器（预览+源码折叠）
│     ├─ guide/                          # 指南区（人写的文档）
│     │  ├─ quick-start.md               # 快速开始（安装/引入/按需）
│     │  ├─ design-principles.md         # ← DESIGN-SPEC.md §1 的可读版
│     │  ├─ tokens.md                    # 令牌总表 + 主题切换指南
│     │  ├─ theming.md                   # HUD 深色主题接入
│     │  ├─ migration-from-element.md   # 从纯 EP 项目迁移指引
│     │  └─ faq.md
│     ├─ components/                     # 组件文档区（每组件一页）
│     │  ├─ sidebar.md
│     │  ├─ status-dot.md
│     │  └─ ...（30 个）
│     └─ index.md                        # 首页（组件总览墙）
```

### 导航规划

```text
┌ 指南 ──────────────┬ 组件 ──────────────────────────┐
快速开始             │ 侧边栏（7）：Sidebar Brand Item Group Footer Gauge NodeBadge
设计原则             │ 壳层（4）：Navbar TabsBar Breadcrumb SplitLayout
设计令牌             │ 展示（9）：PageCard SectionTitle MetricCard StatusDot StatusSwitch
主题（HUD/亮色）      │         Tag CodeSlot DutyCalendar Empty
迁移指南             │ 交互（10）：SearchBar ProTable Pagination SelectTree Upload
FAQ                 │          FormModal ConfirmDialog DetailDrawer Toast ActionButtons
└────────────────────┴────────────────────────────────┘
右上角固定：GitHub 链接 · 主题切换（light / hud）
```

---

## 3. 组件文档页固定模板（六段式）

**每个组件文档页必须按以下结构编写**（模板见 `demo/LXSIDEBAR.md` / `demo/LXSTATUSDOT.md` 两个完整实例）：

```text
# LxXxx 中文名

一句话定位 + 最小代码引入示例。

## 何时使用 / 何时不用        ← 多用途决策依据（EP/antd 均有，必须有）
## 代码演示                   ← 每个 demo 一节（标题 + 说明 + 容器）
## API                        ← Props / Events / Slots / Expose 四张表
## 类型定义                   ← types.ts 全文引用
## 设计说明                    ← 引用 DESIGN-SPEC 条款（P1-P8 哪些相关）
## FAQ                        ← 常见问题与踩坑
```

---

## 4. Demo 编写规范

### 4.1 Demo 容器（EP 风格）

统一用注册在 VitePress 主题里的 `DemoContainer`：

```html
<DemoContainer
  title="基础用法"
  description="最简用法：静态菜单 + 受控激活项。"
  src="basic.vue"
/>
```

容器行为（对齐 EP 官网）：
- 上半部：**实时预览**（demo 文件渲染结果）
- 下半部：源码折叠区（默认收起，展开高亮显示）
- 右上角：复制源码按钮 / 在线调试跳转（可选）

### 4.2 Demo 分类学（每组件按需覆盖，最少 1 个，复杂组件 5-6 个）

| 类别 | 目的 | 覆盖要求 |
|---|---|---|
| **基础用法 basic** | 最小可运行，30 秒理解 | 所有组件**必须** |
| **场景变体** | 该组件的典型形态切换 | 有形态/尺寸 prop 的组件必须 |
| **组合使用** | 与其他组件协作的真实片段 | 壳层/容器类组件必须 |
| **受控模式** | v-model + 外部状态驱动 | 有状态组件必须 |
| **边界情况** | 空数据 / 超长文本 / 大数据量 | 列表/表格类必须 |
| **反模式警示** | 常见误用对比 ❌/✅ | 有坑的组件建议 |

### 4.3 Demo 代码硬性规则

1. **可直接运行**：复制到任何 vite+vue3 项目（装了 lx-ui）就能跑，零隐藏依赖。
2. **mock 数据就地内联**：demo 数据写在 demo 文件内（或 demo 目录 `mock.ts`），**禁止** import 业务 API。
3. **聚焦单一场景**：一个 demo 只讲一件事；讲组合的交给"组合使用" demo。
4. **有交互必写注释**：事件回调至少 `console.log` 或界面回显，让用户看到事件真的触发了。
5. **禁用业务上下文**：不出现 admin-vue3 的 store/router/权限逻辑；演示这些的写"接入指南"章节（guide/migration）。
6. **每个 demo 顶部 2-3 行注释**说明演示意图。

---

## 5. API 表格规范

统一列结构（对齐 EP）：

```text
Props 表：| 名称 | 类型 | 默认值 | 说明（含取值枚举、受控说明、版本） |
Events 表：| 事件名 | 回调参数 | 说明（触发时机） |
Slots 表：| 插槽名 | 作用域参数 | 说明 |
Expose 表：| 方法名 | 签名 | 说明 |
```

规则：
- 可选 prop 用 `?` 后缀标注（对齐 types.ts）。
- 废弃/兼容项标注 `@deprecated` + 迁移建议（如 StatusDot 的 `code`）。
- 类型为组件库导出类型时，名称带链接跳转到类型定义区。

---

## 6. 通用逻辑与方法（组件库级导出）

除组件外，`lx-ui` 导出以下通用能力（文档站"指南"区单独成文）：

### 6.1 组合函数（composables，源码在 lx-ui，请求由业务注入）

| 导出 | 签名 | 用途 | 备注 |
|---|---|---|---|
| `useTable(fetcher)` | `(opts) => { data, loading, page, pageSize, total, search, reset }` | 表格状态机：分页/搜索/重置/缓存 | **fetcher 由业务传入**（`(params) => Promise<{list,total}>`），库内零请求依赖。这是"数据无关"与"开箱即用"的平衡点 |
| `useSelection(rowKey)` | `(rows) => { selectedKeys, toggle, clear, isSelected }` | 表格多选状态 | 配合 LxProTable 受控选择 |
| `useDialog()` | `() => { visible, open, close, mode, editingRow }` | 弹窗开关 + 新增/编辑模式区分 | 配合 LxFormModal |

### 6.2 工具函数

| 导出 | 用途 | 备注 |
|---|---|---|
| `copyText(text)` | 剪贴板 + 自动 LxToast 反馈 | LxCodeSlot 内部也用它 |
| `setTheme(theme)` | 亮/HUD 主题切换 | lx-tokens 导出，此处 re-export |

### 6.3 状态映射辅助

```ts
// lx-ui 导出（纯常量，业务侧可参考结构自建域内映射）
export const LxStatusColor: Record<LxStatus, string>; // → var(--lx-color-*) 引用
```

---

## 7. 文档站开发工作流

```text
新增组件 checklist：
1. packages/lx-ui/src/components/LxXxx/{index.vue, types.ts}
2. demo/basic.vue（必须）+ 场景 demo（按 §4.2 要求）
3. apps/docs/components/lx-xxx.md（六段式模板）
4. .vitepress/config.ts 侧边栏登记
5. guide/ 索引页组件总览墙补卡片（截图 + 一句话）
6. PR 模板勾选"文档已完成"
```

**验收即视检查**：新开一个 vite 空项目，只看文档站，5 分钟内跑起该组件的基本用法——做不到就是文档不合格。

---

## 8. 与 EP / antd 官网的对标清单

| 能力 | EP | antd | LxUI 方案 |
|---|---|---|---|
| 组件页六段结构 | ✅ | ✅ | §3 模板 |
| demo 容器（预览+源码） | ✅ | ✅ | DemoContainer |
| demo 源码可复制 | ✅ | ✅ | 复制按钮 |
| 全局主题切换预览 | ✅ dark | ✅ dark | light / hud（§7 DESIGN-SPEC） |
| API 表四件套 | ✅ | ✅ | §5 规范 |
| "何时使用"决策引导 | ✅ | ✅ | §3 必填段 |
| 在线 playground 跳转 | stackblitz | codeSandbox | 二期可选 |
| 更新日志页 | ✅ | ✅ | changes/ 目录（CHANGELOG 生成） |
| i18n 文档 | ✅ | ✅ | 一期中文，预留 locales |
