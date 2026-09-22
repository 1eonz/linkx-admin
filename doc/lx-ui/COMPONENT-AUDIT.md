# LinkX 项目组件审计报告 — lx-ui 覆盖度与设计决策底稿

> 用途：组件库样式与交互设计的依据文档。
> 调研范围：Vue2 老工程（`src/`，Vue 2.6 + Element UI 2.15）、Vue3 新工程（`other-admin/admin-vue3/`，Vue 3 + Element Plus 全量，全局 `size='large'`）、lx-ui（`linkx-fe/`，15 组件 + 2 函数式 API）。
> 统计口径：Grep count 实测按文件统计后汇总；数字为两工程合并值（标注分代的除外）。
> 结论速览：核心 15 类场景已覆盖 13 类；三大缺口 = SearchBar / StatusSwitch / EP 桥接样式层补齐。

---

## 一、项目全景

| 工程 | 技术栈 | 组件形态 | 业务模块 |
|---|---|---|---|
| **Vue2 老工程** `src/` | Vue 2.6 + Element UI 2.15（全局注册） | el-xxx + 自研组件全局注册（components/index.js install） | 权限中心、通知、基础数据、协同岗、位置、排班、三方对接、警信扩展、多节点管理（10 大块） |
| **Vue3 新工程** `other-admin/admin-vue3/` | Vue 3 + EP 全量注册（`size='large'`） | el-xxx 按需 + 22 个自研组件按需 import | 同上 10 大块迁移；ProTable 三模式成熟化 |
| **lx-ui** `linkx-fe/` | Vue3 + EP 二次封装 + 设计令牌 | 15 组件 + lxMessage/lxConfirm + `--lx-*` 令牌 + HUD 深色主题 | 目标：统一两代工程视觉与交互 |

**两代工程交互范式高度一致**（迁移友好）：

```
列表页 = SearchBar + ProTable + 分页 + N 个弹窗子组件
弹窗   = init(type, row) 回显 → validate 校验 → 提交 → message + refresh
危险操作 = MessageBox.confirm 二次确认
加载态 = v-loading（表格） + 按钮 loading（提交防抖） + ElLoading.service（全屏轮询）
```

---

## 二、EP 组件使用全景（按频率分层）

### T0 高频核心（样式设计最高优先级）

| 组件 | 次数 | 项目中的作用与交互 |
|---|---|---|
| el-button | **~687**（V2 458 / V3 229） | 所有操作触发：搜索/重置/新增/批量删除/行内编辑/弹窗确定取消；V3 大量 `link` 型行内按钮 |
| el-table / el-table-column | ~58 / ~418 列 | 列表数据展示；绝大多数经自研 ProTable 封装；行 hover、固定操作列、多选列（reserve-selection 跨页保留） |
| el-form / el-form-item | ~447 / ~620 | 弹窗表单（label-width 100~200px，90% label-position=left）+ 行内搜索表单（68px）；rules 校验（输入 blur / 选择 change） |
| el-input | **~436** | 文本/密码/textarea；clearable、回车搜索、前缀图标（唯一允许的装饰=搜索放大镜） |
| el-select / el-option | ~130 / ~159 | 下拉枚举选择，大量 v-for 动态 options |
| el-dialog | **~128** | 编辑/详情/选择弹窗；标准配置 `close-on-click-modal=false` + `append-to-body` + `align-center`，宽 500~800px |
| $message / ElMessage | **~950** | 操作结果反馈之首；成功绿/失败红；http 拦截器统一 4 处提示 |
| $confirm / ElMessageBox.confirm | **~117** | 删除/解绑/退出登录危险操作二次确认，warning 图标，取消走 `.catch(() => {})` 静默 |
| v-loading | ~100 | 表格/树/抽屉加载遮罩 + ElLoading.service 全屏轮询（"数据同步中…"，5s 轮询） |

### T1 中频

| 组件 | 次数 | 作用 |
|---|---|---|
| el-pagination | ~14 直用 + 全部经封装 | 列表分页；pageSizes [10,20,50,100]，切条数回第 1 页 |
| el-tag | ~89 | 状态标记、已选人员标签、关键词标签 |
| el-card | ~63（集中 V3） | V3 列表页标准容器（`.app-container > el-card shadow="always"`） |
| el-tabs / el-tab-pane | ~30 / ~72 | 模块内多 Tab；**9 处 `type="border-card"`** |
| el-tree | ~38 | 权限树/部门树/菜单树勾选与展示（区别于选择器形态） |
| el-tooltip | ~41 | 长文本提示、详情抽屉指标说明（9 处集中） |
| el-descriptions(+item) | ~36 / ~57 | 详情键值对展示（客户端详情、授权详情、抽屉内） |
| el-empty | ~35 | 树/列表/穿梭无数据占位 |
| el-upload | ~20 | 头像/图标手动上传（`action="#" + auto-upload=false`）、Excel 导入、地图底图上传 |
| el-popover | ~23 | 组织树下拉容器（OrgTreeSelect 基座）、选中项详情弹出 |
| el-date-picker | ~21 | 日期范围筛选、授权到期日 |
| el-switch | ~22 | 启用/禁用行内切换（loading 防抖，inline-prompt 内嵌文字） |
| el-radio(+group) | ~75 | 表单单选、推送方式选择 |
| el-checkbox(+group) | ~33 | 多选、记住密码、树节点勾选 |
| el-input-number | ~15 | 端口/排序号/有效期 |
| el-dropdown(+menu/item) | ~23 | Navbar 用户菜单、"更多操作"折叠 |
| el-row / el-col | ~92 | 表单栅格双列布局 |
| el-scrollbar | ~19 | 侧边栏/弹窗滚动（仅 V2） |
| el-icon | ~46 | EP 图标承载（仅 V3） |

### T2 低频

el-divider(12)、el-color-picker(6)、el-menu(3)、el-alert(3)、el-collapse(2)、el-breadcrumb(2)、el-progress(2)、el-drawer(2)、el-image(2)

### 完全未使用（0 次 → 明确排除出组件库范围）

`el-cascader、el-tree-select、el-steps、el-timeline、el-carousel、el-transfer、el-slider、el-rate、el-skeleton、el-result、el-badge、el-avatar、el-notification、el-popconfirm、el-statistic、el-select-v2、el-table-v2、el-autocomplete、el-time-picker、el-calendar、el-watermark、el-tour、el-anchor、el-float-button` 等。
**结论：项目重度依赖 表格 / 表单 / 弹窗 / 消息 四类，组件库以此为核心；上表零使用组件不设计、不封装。**

---

## 三、自研组件全景（两工程合并去重，30+）

### 3.1 表格与搜索（列表页骨架）

| 组件 | 频次 | 作用 / 关键交互逻辑 |
|---|---|---|
| **ProTable** | V2 8 / **V3 49（绝对核心）** | 配置式 columns + 内置分页。**三种数据模式**：纯 data / fetchApi 自治 / fetchApi 受控 + @response 回调（项目主流）；AbortController 竞态取消；reserve-selection 跨页保留选中；defaultTableFormatter 兼容 4 种后端结构；expose `init()`（回第 1 页）`refresh()`（保持页码）`mutate()`（乐观更新） |
| **SearchBar** | V2 8 / **V3 25** | V2：props 全配置（searchKey/showOrg/showDateRange/actions）+ ResizeObserver 自动换行。V3：`#filters` 插槽 + 关键字框（220px 回车搜索）+ 搜索/重置 + 右侧 actions 配置按钮（label/type/icon/onClick） |
| **Pagination** | V2 26 | v-model page/limit；**切 pageSize 自动回第 1 页**；autoScroll 回顶；`@pagination {page, limit}` |
| **ActionButtons** | V3 29 | 行内操作：`buttons` 配置或 `actions` **预设语义**（view/edit/disable/enable/delete → 自动图标+配色）；el-button link 型 |

### 3.2 选择器类

| 组件 | 频次 | 作用 / 关键交互逻辑 |
|---|---|---|
| **SelectTree / SelectTreeLazy / OrgTreeSelect** | 合计 ~36 | 组织树选择：popover + input + tree 组合；懒加载/同步双模式（读全局配置 DEPARTMENT_SYNC_SIGN）；非 admin 自动定位本部门；搜索过滤；选中回填关闭 |
| **SelectPagination** | V3 6 | **远程分页下拉**：remote 搜索 + 滚动加载更多（v-loadmore）；内部 targetMap 解决回显（已选项不在当前页仍显示）；api 必传注入 |
| **SelectPopper** | 1 | 多选下拉容器基座（搜索 + 已选 tag 区 + footer） |
| **VirtualTree** | 7 | 万级树虚拟滚动（可视区渲染）；getCheckedKeys/expandAll/filter 全量树方法 |
| **VirtualCheckboxList** | 1 | 花名册虚拟勾选列表（卡片式 checkbox + 计数） |
| **DataPermissionTree** | 3 | **左树右已选双栏穿梭**：VirtualTree + VirtualCheckboxList + 全选/取消 |
| **RelatedUserSelect** | 1 | 协同人员选择：**树模式/搜索模式自动切换**，双数组 v-model（value + labels） |

### 3.3 弹窗类

| 组件 | 频次 | 作用 |
|---|---|---|
| UserSelectDialog / PoliceSelectDialog / UserBindDialog | 各 1 | 搜索 + ProTable 跨页选人弹窗；标题实时"已选 N 人"；确认回传数组 |
| createDialog（V2 工厂函数） | 多处 | Promise 弹窗：`await dialogFn()` 拿提交数据；ok/cancel/close 三态 resolve/reject；全局登记 closeAllDialogs |
| Upload（V2） | 2 | 拖拽/点击上传弹窗：格式大小校验 → uploadApi(FormData) 注入式 → 成功关闭 |

### 3.4 展示与状态类

| 组件 | 频次 | 作用 |
|---|---|---|
| **StatusSwitch** | 14 | **业务值反向映射 0=启用/1=禁用**；disabled 降级显示 el-tag；loading 防抖；开关内嵌文字 |
| **StatusDot / ConnectionStatusDot** | 8+ | 五态呼吸灯；**code 0-7 数字兼容层**（4→online，1/2/7→processing，0/5→busy，3/6→error，对齐后端连接状态枚举） |
| **SectionTitle** | 20 | 区块标题三 variant（dashed 虚线 / border 主色竖条 / plain）；icon + #extra |
| **MetricCard** | 8 | 指标卡：title / 等宽字体大数值 / valueType 语义配色 / footer —— 客户端详情抽屉 6 连用 |
| ModernCard / PersonnelCard / PoliceId | 储备 | 白底卡片容器 / 人员卡（头像+警号+状态点）/ 警号高亮标签 |
| AuthImg | 12 | XHR 带 token 拉 blob 图片（鉴权头像/图标） |
| PasswordInput | 9 | 密码框禁 copy/paste/cut；透传 el-input 全量 |
| Breadcrumb / Hamburger / SvgIcon | 布局级 | 面包屑自动生成 / 侧边栏折叠 / svg sprite |

### 3.5 Composables

`useTable`（分页/搜索/刷新/多选/乐观更新 + 竞态取消，API 与 ProTable expose 对齐）、`useFetch`、`v-loadmore` 指令。

---

## 四、lx-ui 现有组件清单

| 分类 | 组件 |
|---|---|
| 布局导航 | LxSidebar（+Brand/Item/Group/Footer）、LxGauge、LxNodeBadge、LxSelectTree |
| 数据展示 | LxProTable、LxPagination、LxStatusDot、LxTag、LxEmpty、LxActionButtons |
| 数据录入 | LxForm / LxFormItem（$attrs 透传 + 错误态接管 + columns 网格） |
| 反馈与浮层 | LxDialog、LxDrawer、LxFormErrorBanner、lxMessage、lxConfirm |
| 基础设施 | LxIcon（内置 24px stroke1.5 图标集）、`--lx-*` 全量令牌、HUD 深色主题、EP 变量桥接层 |

---

## 五、对比矩阵：lx-ui 覆盖度评估

### A. 已覆盖且满足 ✅

| 项目需求 | lx-ui 对应 | 符合度说明 |
|---|---|---|
| el-table + ProTable | LxProTable | 纯受控（columns/data/分页/多选/插槽）；数据模式差异见 B-1 |
| el-form 全家 | LxForm / LxFormItem | $attrs 透传 + 五方法 + 错误态接管；label 上置/left 双形态兼容老项目 |
| el-dialog 弹窗 | LxDialog | close-on-click-modal=false 防误触、672px 双列、loading |
| el-drawer 详情抽屉 | LxDrawer | 480px 右滑、图标标题、footer 插槽 |
| $message / ElMessage | lxMessage | 时长差异见 B-2 |
| $confirm / ElMessageBox.confirm | lxConfirm | Promise\<boolean\> 优于项目 then/catch 写法 |
| SelectTree 系组织树选择 | LxSelectTree | 懒加载注入式、搜索过滤、checked-keys 受控 |
| StatusDot / ConnectionStatusDot | LxStatusDot | 五态 + code 0-7 兼容层已有 + pulse 节流建议 |
| el-tag | LxTag | 四语义 + closable |
| el-menu + Hamburger + 侧边栏 | LxSidebar | rail/expanded 双态、HUD 风格，超出项目现状 |
| SvgIcon / el-icon | LxIcon | 内置图标集 |
| el-empty | LxEmpty | — |
| el-alert（表单阻断场景） | LxFormErrorBanner | report 图标 + 深红标题规格 |

### B. 已覆盖但存在交互差异 ⚠️（需设计决策）

| # | 差异点 | 项目现状 | lx-ui 现状 | 建议 |
|---|---|---|---|---|
| 1 | **表格数据模式** | fetchApi 三模式 + 竞态取消 + mutate 乐观更新 + formatter 兼容 4 种后端 | 纯受控 data/total（P7 零请求铁律） | 保持 P7；竞态取消/乐观更新下沉到 **useTable composable**（纯前端逻辑不违反 P7） |
| 2 | **Message 时长** | 3s | 设计稿 1.6s | 设计稿为准；duration 参数已有可覆盖 |
| 3 | **ActionButtons 图标** | V3 带图标 + 预设语义（view/edit/delete 自动配色） | 纯文字（设计稿 P2 铁律"禁止图标按钮"） | **冲突点待拍板**：遵循设计稿纯文字 vs 保留预设语义映射 |
| 4 | **控件密度** | V3 `size='large'`（40px） | `--lx-control-height: 32px`（设计稿紧凑密度） | 设计稿为准；迁移时控件变紧凑属预期视觉升级 |
| 5 | **分页回第 1 页** | 封装内置"切 pageSize 回第 1 页" + autoScroll | 纯受控，业务自行处理 | 可加可选 `autoReset`，或文档推荐惯用法 |
| 6 | **弹窗宽度** | 500~800px 不等 | 默认 672 | width 可覆盖，兼容 ✅ |

### C. 未覆盖 — EP 原生组件（不封装，但**桥接样式层需补齐**）⚠️

`element-theme.css` 目前只桥接颜色/圆角/字体基础变量，以下高频组件的**视觉规格尚未按设计稿定制**：

| 优先级 | 组件 | 理由 |
|---|---|---|
| P0 | **el-button**（687 次） | 第一大组件；主/次/link 三态需对齐设计规范（32px 高、4px 圆角、主色三态） |
| P0 | **表单八件套**：input/select/radio/checkbox/switch/input-number/date-picker/upload | LxForm 只接管错误态；控件本身的边框/焦点环/尺寸需桥接覆盖 |
| P1 | **el-tabs**（30 次，9 处 border-card） | 设计稿已有 `--lx-bg-tabsbar` 专用 token，桥接待接 |
| P1 | **el-card**（63 次） | V3 列表页容器；卡片阴影需对齐 `--lx-shadow-card` |
| P1 | **el-tree**（38 次） | 树勾选/展示形态（LxSelectTree 只覆盖选择器形态） |
| P1 | **el-descriptions**（36 次） | LxDrawer 详情内容主力，标签-值对齐规格 |
| P2 | tooltip / popover / dropdown 浮层三件套（92 次） | 阴影/圆角对齐 `--lx-shadow-pop` |
| P2 | collapse / divider / progress / scrollbar / breadcrumb / color-picker / image | 低频，桥接兜底即可 |

### D. 未覆盖 — 业务封装层缺口（lx-ui 高价值新增）

| 优先级 | 组件 | 频次 | 设计稿标本 | 封装要点（P7 兼容设计） |
|---|---|---|---|---|
| **P0** | **LxSearchBar** | 33 | 有（GRID 4-COL 检索面板 + ACTION 行） | COMPONENT-SPEC 已有签名规划：字段驱动 `LxSearchField[]` + `#filters` 插槽 + actions 配置 + search/reset 事件 |
| **P0** | **LxStatusSwitch** | 14 | 有（胶囊滑块内嵌"开启/关闭"） | 0/1 反向映射 + disabled 降级 Tag + loading 防抖，纯前端可封装 |
| P1 | **LxUpload** | 20 | 有（UploadDropZone 虚线拖拽区标本） | V2 已是 uploadApi 注入式 → 不违反 P7；拖拽区 + 格式/大小校验 + tips |
| P1 | **LxSelectPagination** | 6 | 无专门标本 | 远程分页下拉；api 注入 + **targetMap 回显**是项目独有难点 |
| P1 | **LxDescriptions** | 36 | 有（抽屉标签-值两端对齐行） | 配 LxDrawer 的详情行组件 |
| P1 | **LxSectionTitle / LxMetricCard** | 28 | 有 | 区块标题三 variant / 指标卡等宽数值；V3 已有成熟原型可直接吸收 |
| P2 | **LxVirtualTree / LxCheckboxList** | 8 | 有（花名册勾选标本：卡片式 checkbox + 计数） | 万级虚拟滚动，纯前端可封装 |
| P2 | **LxTransferPanel**（DataPermissionTree） | 3 | 有 | 左树右已选双栏 + 全选/取消 |
| P2 | **LxPasswordInput** | 9 | 无 | 剪贴板防护，直接封装 |
| P2 | **LxAuthImg** | 12 | 无 | 请求函数由业务传入（P7） |
| P3 | 人员选择弹窗壳 | 3 | 无 | "SearchBar + ProTable + 多选"壳组件，fetchApi 注入 |
| P3 | LxBreadcrumb | 2 | 无 | 路由自动生成 |
| P3 | **useTable composable** | — | — | 竞态取消/乐观更新/搜索刷新语义，纯前端逻辑（B-1 配套） |

### E. 明确不做 ❌

cascader / steps / timeline / carousel / transfer(EP 原生) / slider / rate / skeleton / result / badge / avatar / notification / popconfirm —— 项目 0 使用 + 设计稿无标本。

---

## 六、结论与建议

**覆盖度**：项目实际使用的 **15 类核心场景中 lx-ui 已覆盖 13 类**（表格/表单/弹窗/抽屉/消息/确认/树选择/标签/状态点/操作按钮/空态/侧边栏/错误横幅），核心骨架完整。

**三大缺口**（按投入产出排序）：

1. **P0**：LxSearchBar（33 次最大缺口、有设计稿标本、有规范签名）+ LxStatusSwitch（14 次）+ **EP 桥接样式补齐**（el-button 687 次与表单八件套是视觉统一主战场）
2. **P1**：LxUpload（有标本）、LxSelectPagination、LxDescriptions、el-tabs/el-card/el-tree/el-descriptions 桥接、LxSectionTitle/LxMetricCard
3. **P2**：虚拟滚动双件、双栏穿梭、PasswordInput、AuthImg、Breadcrumb、useTable

**待拍板的两个交互冲突**：

| 冲突 | 选项 A | 选项 B |
|---|---|---|
| ActionButtons 形态 | 设计稿 P2 铁律：纯文字 | 项目现状：图标 + 预设语义（view/edit/delete 自动配色） |
| 控件密度 | 设计稿：32px 紧凑 | V3 现状：size='large' 40px |

---

*调研方法：Grep count 实测 + 关键文件精读（appForm.vue / editPerson.vue / ServerFormDialog.vue / thirdPartyEdit.vue / ProTable / SearchBar / OrgTreeSelect / SelectPagination 等 30+ 文件）。本文件为设计工作底稿，后续按 P0 → P1 → P2 顺序补齐。*
