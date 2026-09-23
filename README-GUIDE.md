# 文档阅读指引（README-GUIDE）

> 日期：2026-09-22
> 本文档说明 `doc/` 目录下各文档的用途，帮助不同角色快速找到需要的内容。

---

## 一、给设计师看的文档

### 必读（设计工作底稿）

| 文档 | 说明 | 设计师要做什么 |
|---|---|---|
| `doc/lx-ui/COMPONENT-STYLE-INTERACTION.md` | **组件样式与交互说明书**（约 40 个组件逐个过）：当前样式规格、交互逻辑、状态行为 | 逐组件核对样式/交互是否符合预期，重点看 §8 已拍板的 12 条决策 |
| `doc/lx-ui/ICON-DESIGN.md` | **图标集设计需求**（基于 Vue2 工程 358 处图标实测调研）：P0 13 枚高频核心 + P1 27 枚中频修正 + P2 28 枚常用联想，全集目标 94 枚；含 11 处语义混乱修正规范（新增两套并存、重置三种、导出撞车等收敛规则）与 H5 图标选择器 80 枚收敛方案 | **优先出 P0 13 枚**（delete/edit/plus/refresh/undo/download/upload/eye/loading/more/folder 等，解锁组件库 P0 开发），风格对齐现有 26 枚；§5 语义修正规范务必遵守 |
| `doc/lx-ui/DESIGN-SPEC.md` | 设计规范：设计令牌（颜色/字号/间距/圆角/阴影/动效）、全局原则（P0-P8 铁律） | 了解全局约束，新组件设计必须遵守 |
| `doc/lx-ui/COMPONENT-SPEC.md` | 组件接口规格：每个组件的 Props/Events/Slots 签名 | 了解组件能力边界，设计稿不超出接口范围 |

### 参考（设计稿原始素材）

| 文档 | 说明 |
|---|---|
| `doc/stitch_*/`（各目录） | 设计稿原始 HTML 文件（侧边栏、Dashboard、GIS、弹窗组件标本等），是所有视觉规格的源头 |
| `doc/lx-ui/DESIGN.md` | 视觉设计哲学与项目背景 |

**设计师核心任务**：在 `COMPONENT-STYLE-INTERACTION.md` 中确认/修正第 1-7 章组件条目的样式与交互描述，为未开发的组件（🆕 标记）出设计稿：

- 🆕 **图标全集设计**（`ICON-DESIGN.md`：P0 13 枚优先 → 全集 94 枚）
- 🆕 LxSearchBar 检索面板（P0，文档 §3.1）
- 🆕 LxStatusSwitch 状态开关（P0，文档 §3.6）
- 🆕 LxUpload 上传拖拽区（P1，文档 §3.7）
- 🆕 LxSelectPagination 远程分页下拉（P1，文档 §3.5）
- 🆕 LxDescriptions 标签-值描述行（P1，文档 §2.12）
- 🆕 LxSectionTitle 区块标题（P1，文档 §2.7，保留三 variant）
- 🆕 LxMetricCard 指标卡（P1，文档 §2.8）
- 🆕 LxVirtualTree / LxTransferPanel / LxPasswordInput / LxAuthImg（P2）
- 🔧 el-button 三档按钮设计（**P0**，文档 §5.1：small 28 / default 32 / large 40 三档三态）
- 🔧 EP 表单八件套桥接样式（P0，文档 §3.3：input/select/radio/checkbox/switch/input-number/date-picker/upload）
- 📐 LxNavbar / LxTabsBar / LxPageCard / LxSplitLayout / LxBreadcrumb / LxCodeSlot / LxDutyCalendar（布局与低频，文档 §1、§2.11、§2.13）

---

## 二、给下一次开发看的文档

### 2.1 组件库开发（lx-ui）

| 顺序 | 文档 | 说明 |
|---|---|---|
| 1 | `doc/lx-ui/DESIGN-SPEC.md` | **先读**：令牌体系 + P0-P8 铁律（令牌强制、阴影三档、动效三动画制等） |
| 2 | `doc/lx-ui/COMPONENT-STYLE-INTERACTION.md` | 组件样式交互规格：每个组件的目标样式与交互（含已拍板 12 条决策结果） |
| 3 | `doc/lx-ui/COMPONENT-SPEC.md` | 组件接口签名（Props/Events/Slots），写代码时对照 |
| 4 | `doc/lx-ui/COMPONENT-AUDIT.md` | 项目组件使用现状调研：哪些已覆盖、缺口按 P0-P3 排序、明确不做的清单 |

**开发优先级**（来自 AUDIT 结论）：

1. **P0**：LxSearchBar + LxStatusSwitch + el-button/表单八件套 EP 桥接样式
2. **P1**：LxUpload / LxSelectPagination / LxDescriptions / LxSectionTitle / LxMetricCard / useTable / el-tabs/el-card/el-tree 桥接
3. **P2**：LxVirtualTree / LxTransferPanel / LxPasswordInput / LxAuthImg / 浮层三件套桥接

**lx-ui 工程位置**：`linkx-fe/`（`pnpm dev` 起文档站 http://localhost:5173 查看组件 demo；`pnpm build` 出依赖包，宿主引入后自动携带 Element Plus 并可 `export * from 'element-plus'` 使用）

### 2.2 菜单配置驱动改造（前后端协作）

| 顺序 | 文档 | 说明 |
|---|---|---|
| 1 | `doc/lx-ui/MENU-CONFIG-DESIGN.md` | **核心契约**：数据模型、形态推导规则、PageRegistry、TabHost、权限体系（v-auth 指令/配置下沉）、校验规则、迁移三阶段（S1 mock 先行）；**§14 引导系统智能适配**（吸收 Vue2 引导需求：注册键 route.path→pageId、tab 智能切换协议、形态漂移自适应——tab 挪走变页面时引导步骤自动跳过/跟随） |
| 2 | `doc/ARCHITECTURE-vue3.md` | V3 目标架构（工程迁移整体蓝图） |
| 3 | `doc/GUIDE-CONTENT-PLAN.md` | 引导步骤与文案清单（17 页约 85 步，Vue2 调研产出；Vue3 复用文案，注册键换 pageId） |

**开发起点**：S1 阶段——在 V3 工程（other-admin/admin-vue3）实现 menu-config 模块（types/validate/buildRoutes/TabHost/PageRegistry/v-auth），用本地 mock 配置全链路验证；**不依赖后端**，接口就绪后单点切换数据源。引导系统（MENU-CONFIG-DESIGN §14）在 S1 完成后接入。

**给后端**：`MENU-CONFIG-DESIGN.md` §3（数据模型 + 接口契约）+ §11.3（后端改造 5 项清单）可直接作为改造依据。

### 2.3 背景补充（按需）

| 文档 | 说明 |
|---|---|
| `doc/lx-ui/DESIGN.md` | 视觉设计哲学（GB 公共安全视觉背景） |
| `doc/stitch_*/` | 设计稿 HTML 原稿（需要查视觉细节时翻） |

---

## 三、文档间关系图

```
设计师 ──→ COMPONENT-STYLE-INTERACTION.md（确认样式交互 + 出新组件设计稿）
      └──→ ICON-DESIGN.md（图标全集 94 枚：P0 13 枚优先出稿）
              │  遵守
              ▼
          DESIGN-SPEC.md（令牌与铁律）
              │  约束
              ▼
开发者 ──→ COMPONENT-SPEC.md（接口签名）──→ 组件实现（linkx-fe/src）
              │
              └──→ COMPONENT-AUDIT.md（优先级清单）

后端/前端 ──→ MENU-CONFIG-DESIGN.md（菜单配置驱动改造契约）
                ├── S1：前端 mock 先行（不依赖后端）
                ├── S2：接口对接（/api/menu/config）
                └── S3：全量切换 + V2 对齐
```
