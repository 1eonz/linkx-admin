# LxUI 组件样式与交互说明书（设计确认底稿）

> 版本：v1.0 | 日期：2026-09-22
> 用途：**逐组件列出「当前样式规格 + 交互逻辑 + 待确认点」**，供设计样式与交互确认评审逐条勾选。
> 姊妹文档：`DESIGN-SPEC.md`（令牌与原则）、`COMPONENT-SPEC.md`（接口签名）、`COMPONENT-AUDIT.md`（覆盖度调研）。
> 视觉源头：`doc/stitch_侧边栏/stitch_/`（侧边栏族唯一源）、`doc/stitch_/stitch_/component_library_showcase`（组件标本）。

---

## 0. 阅读说明与全局横切规范

### 0.1 组件状态图例

| 标记 | 含义 | 数量 |
|---|---|---|
| ✅ 已实现 | lx-ui 已有，本文描述**当前实际样式** | 15 + 2 API |
| 🆕 缺口新增 | 审计确认缺口，本文描述**建议方案**（尚未开发） | 12 |
| 📐 已规划 | COMPONENT-SPEC 有签名，尚未开发 | 8 |
| 🔧 桥接层 | EP 原生组件不封装，只统一样式（部分待实现） | 6 组 |

### 0.2 全局密度基线 ⚠️ 待拍板

| 项 | 设计稿（lx-ui） | V3 现状 | 说明 |
|---|---|---|---|
| 标准控件高 | **32px**（`--lx-control-height`） | 40px（全局 `size='large'`） | 迁移时控件整体变紧凑，属预期升级 |
| 表格行高 | 44px（compact 36px） | 48px+ | 表头 40px 灰底 |
| 字号主体 | 表格 13px / 正文 14px | 14px | 紧凑密度配套 |

**评审需确认：全局是否接受 32px 紧凑密度**（影响全部录入/操作组件）。

### 0.3 全局状态规则（所有组件共用）

| 状态 | 视觉 | 交互 |
|---|---|---|
| hover | `0.2s cubic-bezier(.645,.045,.355,1)` 过渡（全库唯一过渡） | 允许点击 |
| focus-visible | 2px 主色外圈 + 2px offset（自绘交互件必须） | 键盘可达 |
| disabled | 40% 透明 + `cursor:not-allowed` | 屏蔽点击，tooltip 可解释原因 |
| loading | 按钮内转圈；容器表格 v-loading 遮罩；全屏 ElLoading.service | 防重复提交 |
| 空态 | 列表语义组件内置 LxEmpty 兜底 | 可带「新建」footer |

### 0.4 颜色纪律（评审否决项）

- 主色唯一 `#0060a9`；状态五色唯一（online 绿 / processing 蓝 / busy 橙 / error 红 / offline 灰），**深浅成对使用，禁止交叉混搭**。
- 状态指示一律圆点（P1），携带文字才用 LxTag；表格行内操作一律纯文字（P2）。
- 阴影三档（card/pop/modal）、圆角三档（2/4/8px）、间距五档（4/8/12/16/24）之外一律否决。
- 全库动画仅 3 种：color-fade 0.2s / hudPulse 3.5s（在线呼吸）/ tacticalBlink 1.4s（高危告警专属，稀缺资源）。

---

## 一、布局壳层族

### 1.1 LxSidebar 侧边栏 ✅｜布局级｜双形态

**定位**：全局导航。深色 HUD 风格（两代工程均无，属视觉升级），rail 64px / expanded 252px。

**样式规格**（当前实现，token 实测）：

| 区块 | 规格 |
|---|---|
| 容器 | expanded 底 `#0c1424` / rail 底 `#131b27`；右侧分隔线 `#1e2f47`（刻意偏蓝） |
| 品牌区 | 高 64px，底 `#090f1b`（更深"帽檐"）；警徽 Logo + 同心环呼吸光晕（hudPulse 3.5s）；rail 态只显示 Logo |
| 一级项 | 高 **40px**（含激活 border 实高；注意 COMPONENT-SPEC 旧文写 36px，以 token 实现为准）；图标 18px + 14px 文字 `#cbd5e1` |
| hover | 白 5% 透明底（`rgba(255,255,255,.05)`） |
| 激活 | 左侧 3px 竖条 `#38bdf8` + `0 0 8px` 光晕（**全库唯一发光**）；文字 `#7dd3fc`（sky-300，深底"通电感"） |
| 二级组 | 容器底 `#0e1728`；分组头高 36px；引导线 `#22354f`；二级项高 28px、12px 文字 `#94a3b8`，激活 = 浅底 + 1.5px 圆点 |
| rail 态项 | 高 48px 居中图标；hover 弹右侧 popper（底 `#162032`，192px 宽，选中项带 ✓） |
| 底部状态区 | SLA 圆环（LxGauge）+ NODE 徽章（LxNodeBadge）+ 展开/收起按钮 |

**交互逻辑**：
1. `mode` 受控（`v-model:mode`）：点击底部 toggle 切换；业务侧持久化（localStorage）。
2. `activeKey` 受控绑定 `route.name`；点击直达项 → `select` 事件 → 业务路由跳转。
3. 二级组点击头部展开/收起（手风琴可选），`expand-change` 抛出 keys。
4. badge 角标（预警数量，busy/error 色）。
5. 窗口 < 768px 业务层切 mobile 抽屉形态（overlay + 遮罩）；1366 以下建议 rail。
6. 键盘：↑↓ 导航、Enter 展开、Esc 收起；`role="navigation"` + `aria-current="page"`。

**确认点**：❓ 一级项高 40px 与旧规范文 36px 冲突 → 建议统一 40px 并回改 SPEC 文档。

### 1.2 LxNavbar 顶栏 📐 P1｜布局级

**定位**：面包屑 + 全局搜索 + 状态徽章 + 通知 + 全屏 + 用户菜单。V3 现状 = el-navbar 自拼（el-dropdown + 头像）。

**样式规格（建议）**：白底 56px + 底部 1px `--lx-border`；左侧面包屑 13px regular；搜索框 200px 圆角 4px（放大镜 = 唯一允许的输入装饰图标 P3）；网络徽章 = LxNodeBadge 复用（"协同专网在线 · License 正常"）；通知铃铛 + 数字角标（error 红，>99 显示 99+）；用户区头像 28px + 姓名 13px + 下拉箭头。

**交互逻辑**：搜索回车触发 `search`；通知点击进通知中心；全屏切换；用户 dropdown → 个人中心/修改密码/退出登录（退出需 lxConfirm 危险确认）。

**确认点**：❓ 是否保留全屏按钮（V2 有 V3 无）。

### 1.3 LxTabsBar 页签栏 📐 P1｜布局级

**样式（建议）**：高 36px，底 `--lx-bg-tabsbar #f4f6fa`；浏览器风格页签：激活 = 白底 + 主色文字 + 顶部 2px 圆角，非激活 = 灰字 hover 浅底；关闭 X hover 显现；超出横向滚动（两侧渐隐提示）。

**交互**：点击切换（`v-model`）；中键/X 关闭 → `close`；右键 `context-menu`（关闭其他/关闭右侧/全部关闭，业务侧接 dropdown）。

### 1.4 LxBreadcrumb 面包屑 📐 P3｜仅 2 处

路由自动生成（V2 现状）；分隔符 `/`；最后一级 `--lx-text-primary`，其余可点击 `--lx-text-regular` hover 主色。

### 1.5 LxSplitLayout 左树右表分栏 📐 P1｜6 个业务模块通用骨架

**样式（建议）**：左栏默认 280px（可拖拽调宽，`resizable`）；左右 16px gutter；左栏可整体折叠（`collapsed`，按钮收成 0 宽 + 展开把手）。

**交互**：拖拽分隔条实时调宽（最小 200 / 最大 480）；`resize` 抛出宽度供持久化；折叠态右侧内容自动撑满。

### 1.6 LxPageCard 页面卡片容器 📐 P1｜V3 el-card 63 处的替代

**样式（建议）**：白底 + 1px `--lx-border` + 圆角 4px + `--lx-shadow-card`；header 高 48px：标题 16px/600 + 右侧 `headerExtra` 插槽；body padding 20px（`bodyPadding=false` 时为 0，嵌表格用）；footer 插槽（统计行）。

**交互**：`loading` 显加载遮罩；`bordered=false` 无边框通栏模式。

**确认点**：❓ V3 现状 `shadow="always"` 较重 → 建议 shadow-card 轻阴影，靠 border 区分层次。

---

## 二、数据展示族

### 2.1 LxProTable 数据表格 ✅｜V3 49 处 · 绝对核心

**样式规格（当前实现）**：

| 区块 | 规格 |
|---|---|
| 容器 | 外框 1px `#e4e7ed`，圆角 4px，白底 |
| 表头 | 高 40px，底 `#f5f7fa`，13px/500 `--lx-text-primary` |
| 行 | 高 44px（`compact` 36px），13px `--lx-text-regular`，行分隔 1px `#ebeef5`（外实内虚） |
| hover | 底 `#f2f4f8` |
| 多选列 | 44px 固定左侧，checkbox |
| 操作列 | 固定右侧（fixed: 'right'），默认放 LxActionButtons |
| 空态 | LxEmpty 渲染（`emptyText` 可覆写） |
| loading | v-loading 遮罩 |
| 斑马纹 | `stripe` 可开（默认关，项目现状关） |

**交互逻辑**：
1. **纯受控**（P7）：`data`/`columns`/`loading`/`selectedKeys` 全由业务传入；请求逻辑在业务 `useTable`。
2. 配置式列：`LxTableColumn`（key/label/width/minWidth/align/fixed/formatter 纯函数/type: index·selection·expand/sortable/showOverflowTooltip 默认 true）。
3. 插槽：`#cell-[key]`（单元格自定义，如状态列放 StatusDot）、`#header-[key]`、`toolbar`（右上工具区）、`empty`、`append`。
4. 事件：`selection-change`（**reserve-selection 跨页保留选中**，批量删除场景）、`sort-change`（custom 后端排序）、`row-click`、`expand-change`。
5. 配套 `useTable`（🆕）：`init()` 回第 1 页 / `refresh()` 保持页码 / `mutate()` 乐观更新 + AbortController 竞态取消（搜得快时丢弃旧响应）。

**确认点**：❓ 行 hover 用灰底 `#f2f4f8` 还是主色浅底 `#ecf5ff`（建议灰底，主色浅底留给选中行）。

### 2.2 LxPagination 分页 ✅｜V2 26 处封装

**样式**：右对齐（列表页底部，距表格 12px）；布局 `total, sizes, prev, pager, next, jumper`；按钮 28px 圆角 4px；激活页主色；`pageSizes [10,20,50,100]` 默认 20。

**交互**：
1. 双 v-model（`page` / `pageSize`）+ 语义事件 `change(page, pageSize)`。
2. **切 pageSize 自动回第 1 页**（拍板 #5：受控 + 内置 `autoReset` 默认 true）。
3. **切页窗口平滑回顶**（`autoScroll` 默认 true，列表容器内滚动场景业务可关闭自行处理）。

已实现 ✅（`autoReset` / `autoScroll` props）。

### 2.3 LxStatusDot 状态点 ✅｜8+ 处 · P1 铁律组件

**样式**：6-8px 实心圆（表格行内 6px）；五色：online `#67c23a` / processing `#409eff` / busy `#e6a23c` / error `#f56c6c` / offline `#909399`；online 带 hudPulse 呼吸（外扩淡出 ping 动画）；error 可叠加 tacticalBlink 闪烁（高危未处理专属）；`showText` 时右侧 12px 文字。

**交互**：纯展示；hover 出 title 全称（建议补充）；`code` 0-7 数字兼容层（4→online，1/2/7→processing，0/5→busy，3/6→error，对齐后端连接状态枚举，迁移期保留）。

**确认点**：❓ 同屏呼吸点 >20 个时是否自动关闭 pulse（防噪声，建议组件内 IntersectionObserver 节流）。

### 2.4 LxTag 浅底标签 ✅｜89 处 el-tag 的收敛

**样式**：浅底深字（success `#f0f9eb/#67c23a` 系）；高 24px（small），圆角 2px，12px/500；可关闭 X（hover 显现红）。

**交互**：`close` 事件（已选人员标签、检索条件删除）；纯展示。

**选型铁律（已拍板 #7：迁移可行）**：项目 89 处 el-tag 中大量是**状态标记**（在线/停用）——迁移规则：状态 → StatusDot（+showText），仅关键词/条件/已选项保留 Tag。

### 2.5 LxActionButtons 行内操作 ✅｜V3 29 处

**样式**：默认纯文字链接风；`icon` **可选**（拍板 #2）：传入时显示在文字左侧 16px + 2px 间距（对齐 V3 ActionButtons `ButtonConfig.icon` 惯用法），不传纯文字；default 主色、danger `#f56c6c`；按钮间 12px 间距；超出 `max`（默认 3）折叠进「更多」dropdown（popper 白卡 shadow-pop，菜单项同规则支持图标）。

**交互**：
1. `actions: LxActionItem[]`（label/**icon 可选**/type/hidden/meta）+ `max`；`click(action)` 统一出口。
2. 权限过滤在业务侧（hidden 或不传）。
3. 危险操作（删除/停用）标 danger，**点击必须接 lxConfirm**。

**形态选择指引**：密度高的行内场景建议纯文字（视觉降噪）；需要强识别度的常用操作（查看/编辑/删除）可传 icon（零学习成本场景反而提速）。

### 2.6 LxEmpty 空态 ✅｜35 处

64px 线稿图标 + 13px `--lx-text-secondary` 描述；`compact` 紧凑档（弹窗/抽屉内）；`footer` 插槽放「新建」主按钮；`default` 插槽完全自定义。

### 2.7 LxSectionTitle 区块标题 🆕 P1｜20 处

**样式（建议）**：左侧 3px 主色竖条 + 14px/600 标题 + 可选 subtitle 12px secondary；右侧 `extra` 插槽（刷新等操作）。
**交互**：纯展示。
**确认点**：❓ V3 现状三 variant（dashed 虚线 / border 竖条 / plain）→ 建议**收敛为 border 竖条单 variant**（视觉一致性），旧 variant 样式迁移期 CSS 兼容。

### 2.8 LxMetricCard 指标卡 🆕 P1｜8 处（详情抽屉 6 连用）

**样式（建议，stitch Dashboard 标本）**：
- label 13px secondary；数值 **24px/600 等宽字体 tabular-nums**（P4 数值不抖动）+ 单位 13px；数值色随 `valueType` 语义（online 绿 / error 红 / 默认 primary）。
- badge 右上浅底标签（如"在岗率 94.6%"）；trend 趋势文案（↑online / ↓error，12px）。
- 底部进度条：高 6px 圆角 full，槽 `#ebeef5` 填充主色；footerLabel/footerValue 两端对齐 12px。

**交互**：纯展示 + `extra` 插槽（sparkline 迷你图位）；HUD 主题下数值色 token 自动反转。

### 2.9 LxGauge 圆环仪表 ✅｜侧边栏拆件

40px 直径 SVG 圆环，stroke 3px，中心 11px label；色随阈值（<95 warning / <80 error）；`color` 可传 `var(--lx-*)` 保证 HUD 联动。

### 2.10 LxNodeBadge 节点徽章 ✅｜侧边栏拆件

`NODE-01` 11px 等宽 + 状态点（online 绿/busy 黄/offline 灰）+ 可选 label「专网」12px secondary。

### 2.11 LxCodeSlot 等宽代码槽 📐 P1｜警号/车牌/案件号

等宽字体 + 底 `#f4f4f5` + 边 `#e9e9eb` + 圆角 2px + padding 2px 6px；`copyable` 点击复制 + lxMessage 成功反馈；`ellipsis` 截断 + title。

### 2.12 LxDescriptions 标签-值描述行 🆕 P1｜36 处 el-descriptions 替代

**样式（建议，stitch 抽屉标本）**：行式两端对齐——label 13px `--lx-text-secondary` 左，value 13px `--lx-text-primary` 右（或双列 grid）；行高 32px，行间 1px `#ebeef5` 分隔；value 插槽可嵌 StatusDot / LxCodeSlot。
**交互**：纯展示；`columns` 1-3 列自适应（抽屉内 1-2 列）。

### 2.13 LxDutyCalendar 排班日历网格 📐 P2｜_21/_24 标本

7 列月网格，周一起；单元格高 ~88px：日期号 12px + 班次胶囊（早/中/夜班，各浅底色 + 计数）；今日主色描边；非本月 40% 透明。交互：月份切换（`update:month`）、`cell-click` 弹排班编辑、`shift-click` 直达班次详情。

---

## 三、数据录入族

### 3.1 LxSearchBar 检索面板 🆕 **P0**｜33 处 · 最大缺口

**定位**：列表页第一骨架件。V2 = props 全配置 + ResizeObserver 自动换行；V3 = `#filters` 插槽 + 220px 关键字框。**统一为：字段配置驱动 + 插槽兜底**。

**样式规格（建议，stitch GRID 4-COL 检索面板标本）**：

| 区块 | 规格 |
|---|---|
| 面板 | 白底裸区（嵌 LxPageCard 内，无独立边框），字段区 + 按钮区 |
| 字段栅格 | 4 列（span=6/24），间距 16px 水平 / 8px 垂直；label 13px + 控件 32px |
| 按钮区 | 右下对齐：「查询」主按钮 + 「重置」次按钮；loading 时查询转圈 |
| 折叠 | 字段 > 8 个时收起，显示「展开 ▾」；收起时保留首行 4 个字段 + 按钮 |
| 关键字框 | 220px，内置放大镜（唯一允许装饰 P3），clearable |

**交互逻辑**：
1. `fields: LxSearchField[]` 配置（key/label/type: input·select·date·daterange·number·tree-select/placeholder/defaultValue/span）+ `modelValue` 受控。
2. **回车 = 查询**；查询 → `search` 事件 → 业务 `init()` 回第 1 页。
3. 重置 → 清空回 `defaultValue` + 立即触发查询；置灰规则：值全空时重置禁用。
4. `#filters` 插槽插入自定义字段；`actions` 右侧配置按钮组（V3 模式）。
5. 字段联动（选了部门才出现岗位）由业务在 fields computed 里做。

**确认点**：❓ 按钮区位置（右下独立行 vs 跟随最后一个字段行尾）——建议右下独立行（对齐清晰、字段换行不挤）。

### 3.2 LxForm 表单 ✅｜447 处 el-form 的接管

**样式规格（当前实现）**：

| 项 | 规格 |
|---|---|
| 布局 | `columns=2` 双列网格（stitch `_26` 弹窗 grid-cols-2），间距 16/12px；`span="full"` 通栏 |
| label | `top` 上置（弹窗默认）12px secondary / `left` 左置（老项目兼容）13px + labelWidth 100-200px |
| 控件 | 32px 高，圆角 4px |
| 必填 | `*` 前缀（hide-required-asterisk 可关） |
| **错误态** | 错误文字 **11px `#c45656`**（对比度补偿）+ 前置圆圈感叹号小图标；错误输入框 **1px 红边 + 浅红底**，聚焦保持红环 |
| 错误接管范围 | input / select / textarea / date-picker / cascader 全系容器 |

**交互逻辑**：
1. `$attrs` 全量透传 el-form（status-icon / scroll-to-error / label-width / @validate 原样可用）。
2. expose 五方法：`validate / validateField / resetFields / clearValidate / scrollToField`。
3. 项目惯用法内置支持：回显后 `nextTick(clearValidate)` 清残留错误；提交 `validate().then().catch()`。
4. rules 惯例：输入类 `blur` 触发、选择类 `change` 触发、pattern 手机号/编码。
5. LxForm 内直接写原生 el-form-item **同样享受错误态样式**（存量迁移零成本）。

### 3.3 EP 表单控件八件套桥接 🔧 P0（样式统一主战场）

不封装，`element-theme.css` 统一视觉。**目标规格**：

| 控件 | 规格要点 |
|---|---|
| el-input | 32px、圆角 4px；边 `#dcdfe6` → hover 主色 → focus 主色边 + 2px `#ecf5ff` 外环；placeholder `#c9cdd4`；clearable |
| el-select | 触发器同 input；下拉 popper 圆角 4px + `--lx-shadow-pop`；选中项文字主色；分组头 12px secondary |
| el-radio / el-checkbox | 选中主色；label 13px/14px；组纵向间距 8px |
| el-input-number | 32px + 右侧上下控制器；边界禁用箭头 |
| el-date-picker | 范围型双输入 ~320px；popper 日历圆角 4px；快捷项（今天/本周）可选 |
| el-upload | 见 3.7 LxUpload |
| textarea | rows 2-4，仅垂直 resize |
| el-switch | 见 3.6 LxStatusSwitch |

**确认点**：❓ focus 环规格（EP 默认 box-shadow 2px 主色浅底 vs 设计稿要求 border 1px + 外环）——建议保留 EP 默认行为只改色，降低认知成本。

### 3.4 LxSelectTree 组织树选择器 ✅｜36 处（SelectTree 系合并）

**样式（当前实现）**：触发器 = 32px input + 展开箭头（多选时已选项显示为 tag，可逐个删）；下拉面板 240-320px、max-high 280px 内滚动（细滚动条 4px）；树节点高 32px、缩进 16px/级、hover `#f2f4f8`、选中主色浅底 `#ecf5ff` + 主色文字；关键字过滤框置顶。

**交互**：
1. 双数据模式：静态 `data` / **懒加载 `load` 注入**（组织机构按需拉取，P7：请求函数业务传）。
2. `filterable` 树内实时过滤（默认开）；过滤命中自动展开路径。
3. 单选：点节点回填 label + 关闭；多选：勾选累积 tag，footer 确认。
4. `checked-keys` 受控回显；clearable 一键清空。
5. V2 特性迁移：非 admin 自动定位本部门（业务侧 config 处理，组件不感知）。

### 3.5 LxSelectPagination 远程分页下拉 🆕 P1｜6 处

**定位**：候选万级、必须远程搜索分页的选择器（选人/选设备）。**项目独有难点：targetMap 回显**（已选项不在当前页仍能正确显示 label）。

**样式（建议）**：触发器同 select；popper 内 = 顶部搜索框 + 列表（行 32px：label + 12px secondary 描述）+ 底部「加载更多」/「没有更多了」。

**交互**：remote 输入防抖 300ms → `api` 注入查询（P7）；滚动到底自动加载下一页（v-loadmore）；选中存 targetMap，翻页/换关键词后 label 不丢；多选上限提示。

**确认点**：❓ 翻页形态——滚动自动加载（省一次点击）vs 显式「加载更多」按钮（可控）→ 建议滚动自动 + 停止条件提示。

### 3.6 LxStatusSwitch 状态开关 🆕 **P0**｜14 处

**定位**：行内启用/禁用切换。**项目坑点：0/1 反向映射**（0=启用 / 1=禁用）。

**样式（建议，stitch 胶囊滑块标本）**：滑块内嵌文字「开启/关闭」（inline-prompt）；开启 `#67c23a` / 关闭 `#909399`；h 20px；行内密度小号。

**交互**：
1. `modelValue` 支持 boolean / 0·1；`change` → 业务发请求 → **loading 防抖期禁点** → 失败自动回滚（回滚时 lxMessage.error）。
2. `disabled`（权限不足）**降级显示 LxTag「禁用」**而非灰开关（V2 现状，语义更清晰）。
3. 危险关闭可配 `confirm` 文案走 lxConfirm。

**确认点**：❓ 关闭"运行中"资源是否用红色开关（强调危险）vs 统一灰（克制）→ 建议统一灰 + confirm 兜底，红只留给 error 状态展示。

### 3.7 LxUpload 上传拖拽区 🆕 P1｜20 处

**样式（建议，stitch UploadDropZone 标本）**：虚线拖拽区（2px dashed `#dcdfe6`，圆角 8px，高 120px）；hover/拖入 = 虚线主色 + 浅主色底；中心 40px 图标 + 主文案 14px（"点击或拖拽文件到此处"）+ 副文案 12px secondary（"支持 .xlsx/.csv，单文件 ≤ 10MB"）；文件列表行：状态点（上传中 processing / 成功 online / 失败 error）+ 名称 + 大小 + 删除 X。

**交互**：
1. `accept` 过滤 + `maxSize` MB 校验（超限 lxMessage.error，不发请求）+ `limit` 超出 exceed。
2. `autoUpload`：Excel 导入 true（即刻传）；头像/图标 false（随表单提交，`uploadApi` 注入 FormData，P7）。
3. 成功 `success` 事件 → 业务 message + 清列表；失败行内 error 状态 + 重试。
4. V2 弹窗形态（拖拽上传弹窗）由业务用 LxDialog 包裹本组件实现。

### 3.8 LxPasswordInput 密码框 🆕 P2｜9 处

el-input password 全量透传 + 显示/隐藏眼睛切换；**禁 copy/paste/cut**（preventDefault，剪贴板防护）。样式同 el-input 桥接。

### 3.9 LxVirtualTree 虚拟滚动树 🆕 P2｜7 处

**万级节点**可视区渲染（视口外不渲染）；行高固定 32px（虚拟滚动前提）；复选框勾选、展开箭头、关键字 filter；全量树方法透传（`getCheckedKeys` / `expandAll` / `filter`）。滚动条细 4px。

### 3.10 LxTransferPanel 双栏穿梭 🆕 P2｜3 处（DataPermissionTree）

**样式（建议，stitch 花名册标本）**：左栏 = LxVirtualTree + 顶部「全选/取消」；右栏 = 已选列表（卡片式行：名称 + 删除 X）+ 底部计数「已选 N 项」；两栏等高（max 400px 内滚动）。

**交互**：左勾选右实时同步；右删单项左同步去勾；全选/取消批量操作；确认回传 keys + 全量节点。

---

## 四、反馈与浮层族

### 4.1 lxMessage 全局提示 ✅｜950 处 · 反馈之首

**样式（当前实现）**：**深色胶囊**（区别于 EP 默认白卡）：底 `#2d3136` / 文字 `#f0f2f5`（HUD 下自动 `#1e293b` 抬亮）、圆角 **12px**、padding 10px 16px、`--lx-shadow-modal` + 8px 毛玻璃；前置 8px 状态点（绿/红/橙/灰）；顶部居中入场上移淡出。

**交互**：函数式 `lxMessage.success/error/warning/info`；**时长分级（拍板 #3）：error 3s（需阅读原因）/ 其余 1.6s**；`duration` 可逐条覆盖；多条堆叠不阻塞操作。

已实现 ✅。

### 4.2 lxConfirm 确认框 ✅｜117 处

**样式（当前实现）**：512px 居中；**标准形态** = 橙色 warning 图标 + 标题 14px/600 + 正文 13px + 取消（次）/确认（主）右对齐；**危险形态**（danger）= 红图标 + 深红标题 `#c45656` + **红底白字确认按钮**。

**交互**：
1. `Promise<boolean>`：确认 true / 取消·ESC·X false，**不 reject**（消灭项目里 117 处 `.catch(() => {})`）。
2. 遮罩点击**不可关闭**（防误触）；ESC 可关。
3. 文案铁律：确认按钮写**具体动作**（「强制解除警戒」而非「确定」）；message 必须写明**后果与影响范围**（"将同步通知 18 名执勤警力…不可逆"）。

### 4.3 LxDialog 表单弹窗 ✅｜128 处

**样式（当前实现）**：

| 区块 | 规格 |
|---|---|
| 容器 | 默认 **672px**（stitch max-w-2xl 双列表单规格，可 width 覆盖 500-800）；圆角 8px；`--lx-shadow-modal`；遮罩 50% 黑 |
| header | 图标（可选，18px）+ 标题 14px/600 + 右侧 X（hover 红预览） |
| body | padding 24px，表单区（配 LxForm columns=2） |
| footer | **右对齐**：取消（次按钮）左、确认（主按钮）右；确认 loading 转圈防重 |

**危险模式**（danger）：图标/标题/确认按钮全红，用于删除/解绑弹窗。

**交互**：
1. `v-model` 显隐；`confirm` → 业务 validate + 提交（loading 防抖），**成功才关**；`cancel` 关闭。
2. **默认屏幕居中显示**（`align-center`，拍板 #9）。
3. **头部可拖拽移动弹窗位置**（`draggable` 默认 true，header 即拖拽把手 move 光标，拍板 #9）。
4. 遮罩点击不关（`close-on-click-modal=false`，项目标准配置）；**ESC 关闭可控**（`closeOnPressEsc` 默认 true，脏数据敏感场景可关）。
5. `hideFooter` + `footer` 插槽完全自定义。
6. 生命周期惯用法：open 后 `init(type, row)` 回显 → `nextTick(clearValidate)`；关闭回调清空表单。

已实现 ✅（`closeOnPressEsc` / `draggable` props）。

### 4.4 LxDrawer 详情抽屉 ✅｜36+ 处

**样式（当前实现）**：默认 **480px** 右侧滑出（stitch 明确规格，可 size 覆盖）；header = 左侧**圆形图标块**（32px，主色浅底 + 主色图标）+ 标题 12px/600 + X；body 滚动（细滚动条）；footer 插槽 = 左侧提示文字 12px secondary + 右侧按钮组。

**交互**：`v-model`；ESC/遮罩默认不关（防误触）；铁律**详情一律抽屉不走弹窗**（客户端详情、审计详情、节点详情），内容配 LxSectionTitle 分组 + LxDescriptions 键值行。

### 4.5 LxFormErrorBanner 校验横幅 ✅｜表单阻断

**样式（当前实现）**：浅红底 `#fef0f0` + 圆角 4px + padding 12px + `--lx-shadow-card`；**report 图标 18px 深红与文字顶部对齐**；标题 12px/600 `#c45656` + 描述 11px；`role="alert"`。

**交互**：v-if 业务控制——提交被业务规则阻断（封控期禁新增、配额用尽）时出现在表单顶部，修复即移除；与 LxForm 行内错误互补（Banner 管整体阻断，行内管单字段）。

### 4.6 浮层三件套桥接 🔧 P2｜92 处

| 组件 | 目标规格 |
|---|---|
| el-tooltip | 深底 `#303133` 白字、圆角 4px、出现延迟 200ms；长文本截断的场景统一走它 |
| el-popover | 白卡 + 圆角 4px + `--lx-shadow-pop`、padding 12px；OrgTreeSelect 基座即此 |
| el-dropdown | 菜单白卡同上；item 高 32px hover `#f5f7fa`；danger 红；divided 分隔线；z-index 统一 2000（modal 3000 / message 4000） |

---

## 五、EP 桥接层（非封装、统一样式）

### 5.1 el-button 🔧 **P0**｜687 处 · 第一大组件

**目标规格**（尚未实现，本次设计确认的核心）：

| 形态 | 规格 |
|---|---|
| 主按钮（primary） | 底 `#0060a9` 白字、32px、圆角 4px、padding 0 16px、13px/500；hover `#00508f`；active 再深一档；disabled 灰底灰字 40% |
| 次按钮（default） | 白底 + 1px `#dcdfe6` + 文字 `--lx-text-regular`；hover 边框主色 + 文字主色 + 浅主色底 `#ecf5ff` |
| 文字/link | 主色文字透明底；hover 浅主色底圆角 4px；danger 型红色 |
| 图标按钮 | **仅限工具栏/卡片角落等非行内场景**（P2 例外），24px 方形圆角 4px |
| 尺寸档 | **三档全设计（拍板 #11）：small 28 / default 32 / large 40**；大档用于孤立主操作（登录/空态引导），常规一律 32 |

**设计纪律**：一屏一个主按钮（主操作唯一）；批量删除等危险主按钮可红底；「查询」主 +「重置」次为固定搭配。

**确认点**：❓ 主按钮 hover 用加深（EP 惯例）还是提亮（部分设计稿）→ 建议加深 `#00508f`（与 EP 心智一致）。

### 5.2 el-tabs 🔧 P1｜30 处（9 处 border-card）

激活 = 主色文字 + 底部 2px 主色条；非激活 `--lx-text-regular` hover 主色；border-card 型白底 + 外框 `#e4e7ed` + 圆角 4px；tab 文字 13px/500；左右 padding 16px。

### 5.3 el-card 🔧 P1｜63 处

由 LxPageCard 承接主场景；原生 el-card 桥接：`--lx-shadow-card` 轻阴影 + 1px `#e4e7ed` + 圆角 4px + body padding 20px（V3 `shadow="always"` 重阴影废弃）。

### 5.4 el-tree 🔧 P1｜38 处

节点高 32px、hover `#f2f4f8`、选中主色文字；复选框主色；展开箭头 90° 旋转过渡 0.2s；连接线可选（组织树开、权限树关）。

### 5.5 低频兜底 🔧 P2

divider（1px `#ebeef5`）/ progress（同 LxMetricCard 进度条规格）/ collapse / scrollbar（4px 细条）/ breadcrumb / color-picker / image（加载占位灰底）——只做 token 对齐，无专属设计。

---

## 六、辅助设施

### 6.1 LxIcon 图标 ✅

26 枚内置（侧边栏 12 / 交互 10 / 反馈 4）；24×24 画布、stroke 1.5、round cap、`currentColor`（**继承文字色，无需传色**）；尺寸三档 16/18/20（默认 18）；`LxIconName` 类型自动推导（传错名 TS 报错）。文档站总览页支持搜索过滤 + 点击复制完整标签。

### 6.2 LxAuthImg 鉴权图片 🆕 P2｜12 处

XHR 携 token 拉 blob（头像/图标需鉴权场景）；请求函数业务注入（P7）；失败占位灰底默认图。

### 6.3 useTable composable 🆕 P1（表格数据模式配套）

`init()` 回第 1 页 / `refresh()` 保持页码 / `mutate()` 乐观更新 / `loading` / 多选管理；**AbortController 竞态取消**（快速翻页/搜索丢弃旧响应）；响应结构归一（兼容 4 种后端包装）。纯前端逻辑，不违反 P7。API 与 LxProTable expose 对齐。

### 6.4 人员选择弹窗壳 🆕 P3｜3 处

「LxSearchBar + LxProTable 多选 + 底部已选区」的壳组件；标题实时「已选 N 人」；跨页保留选中；确认回传数组；fetchApi 注入。

---

## 七、页面级交互范式（组件如何咬合）

### 7.1 列表页骨架（最高频页面形态）

```
┌ LxPageCard ──────────────────────────────────┐
│ LxSearchBar（回车/查询→init / 重置→清空+查询）│
├──────────────────────────────────────────────┤
│ toolbar: [新增(主)] [批量删除(danger→lxConfirm)]│
│ LxProTable（多选跨页保留 · 排序 · 行内操作）  │
│                                     LxPagination│
└──────────────────────────────────────────────┘
```

行内操作流：编辑 → LxDialog（init 回显 → 改 → validate → 提交 loading → lxMessage + refresh）；删除 → lxConfirm(danger) → lxMessage + refresh。

### 7.2 弹窗生命周期（128 处统一）

```
open → init(type, row) 回显 → nextTick(clearValidate)
  → 用户编辑 → validate ─ fail → 行内错误 / LxFormErrorBanner（业务阻断）
                      └ ok → 提交（按钮 loading 防重）
                             ├ 成功 → lxMessage.success + close + refresh
                             └ 失败 → lxMessage.error（弹窗不关，保留输入）
```

### 7.3 详情抽屉流（36 处）

行点击 → LxDrawer 480px → LxSectionTitle 分组 + LxDescriptions 键值行 + LxMetricCard 指标 → footer「处理/关闭」。

### 7.4 全局轮询加载（节点管理等）

ElLoading.service 全屏遮罩「数据同步中…」+ 5s 轮询；局部长耗时用 v-loading。

---

## 八、待拍板清单汇总（已拍板 2026-09-22，逐条落实）

| # | 决策点 | 选项 A | 选项 B | 拍板结果 | 落实情况 |
|---|---|---|---|---|---|
| 1 | **全局控件密度** | 32px 紧凑（设计稿） | 40px large（V3 现状） | **A：32px 紧凑** | token 既有 ✅ |
| 2 | **ActionButtons 形态** | 纯文字（P2 铁律） | 图标 + 预设语义（V3） | **两种都支持：默认纯文字，`icon` 可选左置 16px（对齐 V3 `ButtonConfig.icon` 风格）** | ✅ 已实现 `LxActionItem.icon` |
| 3 | Message 时长 | 分级 | 统一 | **分级：error 3s / 其余 1.6s（duration 可覆盖）** | ✅ 已实现 |
| 4 | 侧边栏一级项高 | 40px（token 实现） | 36px（SPEC 旧文） | **40px** | ✅ SPEC/本文档已回改 |
| 5 | Pagination 行为 | 内置 | 纯受控 | **受控 + 内置**：autoReset（切条数回第 1 页）/ autoScroll（切页回顶）默认 true | ✅ 已实现 |
| 6 | SectionTitle variant | 收敛 border 单种 | 保留三 variant | **保留 3 种**（dashed / border / plain） | 组件开发时落实 🆕 |
| 7 | el-tag 状态用法迁移 | 状态→StatusDot+文字 | 保持 Tag | **可行，迁移**（P1 铁律） | 迁移指南已载 lxtag 文档 |
| 8 | SelectPagination 翻页 | 滚动自动加载 | 「加载更多」按钮 | **滚动自动加载**（+「没有更多了」终止提示） | 组件开发时落实 🆕 |
| 9 | 表单弹窗 ESC/位置 | 可关 | 拦截 | **ESC 可控（closeOnPressEsc 默认 true）；默认屏幕居中（align-center）；头部可拖拽移动（draggable 默认 true）** | ✅ 已实现 |
| 10 | StatusSwitch 关闭色 | 统一灰 + confirm | 危险关闭红 | **统一灰 + confirm 兜底，红只留给 error 状态展示** | 组件开发时落实 🆕 |
| 11 | el-button 尺寸档 | 不提供 large | 提供 | **提供大中小三档：small 28 / default 32 / large 40，均需设计三态** | 桥接层开发时落实 🔧 |
| 12 | 表格行 hover | 灰底 `#f2f4f8` | 主色浅底 | **灰底（主色留给选中）** | token 既有 ✅ |

---

*本文与 `COMPONENT-AUDIT.md` 同为设计工作底稿；确认结果将回写 `DESIGN-SPEC.md` / `COMPONENT-SPEC.md` 后进入开发（P0：LxSearchBar / LxStatusSwitch / el-button 与表单八件套桥接）。*
