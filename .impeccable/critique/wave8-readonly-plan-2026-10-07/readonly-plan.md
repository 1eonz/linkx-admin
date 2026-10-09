# Wave 8 `lx-ui` 全库门禁只读规划

> 日期：2026-10-07  
> 范围：`linkx-fe` 公开组件库、组件文档与 `other-admin/admin-vue3` 的组件级验证  
> 类型：只读规划；本文件不代表任何组件已经关闭严格矩阵，也不启动 Vue3 宿主替换

## 1. 目标与硬边界

Wave 8 的目标是完成 `lx-ui` 全库 52 个公开组件的 UI-10/UI-11 门禁。每个组件必须同时有设计对照、类型/API、中文 Demo、行为单测、Mock、浏览器 E2E、独立代码复审、Impeccable A/B、修后复验和 snapshot/trend；只有十项证据齐全且 P1/P2 已处理或有明确阻塞记录，才可把矩阵行改为关闭。

当前严格矩阵为 **0/52**。Wave 3–7 的单测、文档 E2E、局部 detector 或阶段性审查只能作为支持证据，不能直接增加关闭数。Vue3 宿主仍保留 `element-plus`，不得在 Wave 8 中批量替换页面、删除依赖、改变 API/路由/权限键或修改后端协议。

本轮工作区已有 Wave 3–7 改动和评审产物，执行时必须保留其所有权；只读规划不覆盖、不重置、不格式化这些文件。组件库继续遵守以下边界：

- `lx-ui` 只负责展示和通用交互，鉴权、请求、Router、Pinia、Token 和权限判断由宿主注入。
- Vue3 宿主请求继续使用 `.then().catch().finally()`，取消请求不提示失败，loading/提交锁在 `.finally()` 释放；旧请求不能覆盖新状态。
- 所有新增或实质修改的中文文档、Demo 说明和注释使用中文；组件 API 必须保留现有 props/events/slots/exposes 兼容契约。
- 所有适用状态均需覆盖默认、hover、focus、disabled、loading、error、empty、浅色/HUD 深色、窄屏和 `prefers-reduced-motion`；不适用项必须写明原因。

## 2. 当前基线与前置门槛

### 2.1 执行顺序

| 门  | 顺序 | 范围                              | 进入条件                                                 | 退出条件                                                                                                                       |
| --- | ---- | --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| G0  | 0    | 源码冻结与清单                    | 记录当前分支、工作区状态、组件注册表和每个目标的源码指纹 | A/B 使用同一份源码指纹，旧证据与新证据可区分                                                                                   |
| G1  | 1    | Wave 7 `LxTransferPanel`          | 先完成双栏穿梭设计稿严格对照                             | 5:2:5/380px、节点 code/status、选择上限、空/加载/错误/权限/取消、键盘/触控/HUD/减少动效均有证据，A/B 和代码复审通过            |
| G2  | 2    | `LxSearchBar` + `LxStatusSwitch`  | G1 关闭后进入旧审计 P0 组合                              | 字段和开关的受控/旧值/确认/失败恢复/权限降级、中文 API/Demo、专门 E2E、A/B 和复验齐全                                          |
| G3  | 3    | `LxMetricCard` + `LxSectionTitle` | G2 关闭后进入 P1 展示组合                                | 语义色、趋势/进度、标题变体和溢出决策写入台账，宿主组合证据与 A/B 完整                                                         |
| G4  | 4    | `LxAuthImg`                       | G3 关闭后验证鉴权图片边界                                | 组件 Mock 与宿主鉴权适配器证据分开，真实鉴权联调单列，不以本地 Blob Mock 冒充后端通过                                          |
| G5  | 5    | `LxNavbar`                        | G4 关闭后处理壳层导航                                    | 菜单、通知、搜索、Fullscreen 拒绝、键盘、隐藏入口和 375px/320px 证据完整                                                       |
| G6  | 6    | `LxSidebar` 家族                  | G5 关闭后处理侧栏族                                      | `LxSidebar`、`Brand`、`Group`、`Item`、`Footer`、`Gauge`、`NodeBadge` 的 rail/expanded/移动抽屉、portal 焦点和清理行为全部闭环 |
| G7  | 7    | 全库 52 项门禁                    | G1–G6 和其他已有组件的遗留 P1/P2 均有关闭或阻塞记录      | 52 行逐项复核、全库 detector 证据核验、库/文档构建和交接记录完成，才允许进入 Wave 9 宿主替换                                   |

### 2.2 设计源

- `LxTransferPanel`：`design/虚拟滚动树 + 双栏穿梭/`。
- `LxSearchBar`：`design/检索面板 SearchBar/`。
- `LxStatusSwitch`：`design/状态开关 StatusSwitch/`。
- `LxMetricCard`：`design/指标卡 MetricCard/`。
- `LxSectionTitle`：`design/区块标题 SectionTitle/`。
- `LxAuthImg`：`DESIGN-SPEC.md` 与 `LxAuthImg` API/Demo；无专属画板。
- `LxNavbar`：`doc/lx-ui/COMPONENT-SPEC.md` §8 与 `doc/lx-ui/COMPONENT-STYLE-INTERACTION.md` §1.2。
- 侧栏族：`doc/stitch_侧边栏/stitch_/_1`（rail）与 `_2`（expanded）是唯一视觉源；通用契约见 `COMPONENT-SPEC.md`。

### 2.3 G1 `LxTransferPanel` 前置门槛

Wave 8 不得跳过 Wave 7 的前置门槛。先对照双栏比例、380px 目标宽度、左树右已选结构、既有树外 key、节点 `code/status`、全选/反选、禁用项、选择上限、清空和状态文案。新增或补齐以下证据：

- 单测：受控值回写、既有 key、不重复选择、禁用节点、上限阻断、全选/反选、清空、空树和状态切换；旧请求取消或卸载后不能回写。
- Mock：成功、空结果、加载、失败恢复、权限不足、取消、分页/迟到响应和重复操作；全部请求由浏览器 Mock 拦截。
- E2E：桌面双栏、375px/320px 触控、长节点、键盘焦点与 Escape、HUD 深色、减少动效、loading/empty/error/disabled。
- 交付：中文 API/Demo、独立代码复审、Impeccable A/B、修后截图和 snapshot/trend。该门关闭前不开始 G2。

## 3. 目标组件差距与新增边界

下表的“已有”表示当前可复用的支持证据，“缺口”仍必须在统一源码冻结后重新核验；旧证据不自动转为严格矩阵关闭。

### 3.1 `LxSearchBar`（G2，旧审计 P0）

**现状和差距**：已有受控值、级联对象值、重置、Escape、折叠、loading、日期范围 ID 等行为单测；文档页已有成功/空/错、失败恢复、展开、重置和 375px 全字段证据。但 `lx-search-docs.spec.ts` 主要验证文档搜索与导航，缺少以组件行为为主体的独立 E2E；设计矩阵仍待严格对照。

- P1：按 4 列检索网格和 ACTION 行核对字段密度、字段顺序、操作层级、展开/收起状态、长标签和结果上下文；确认受控值更新与重置立即查询的时序不会被远程请求覆盖。
- P2：补齐空字段、禁用字段、自定义搜索/重置文案、级联对象值、日期范围清除、9 个以上字段、长文本和 320px 排版；记录任何只影响文档壳层的误报，不把文档整体横向滚动误记为组件溢出。
- 单测：保留当前行为用例，增加自定义文案、`collapsible=false`、展开状态受控更新、无字段/全禁用、长 label、日期范围和级联清空；loading 时 search/reset 的事件顺序要可观察。
- Mock：远程成功、空、业务失败、网络失败、取消和迟到响应；同一输入连续搜索时只允许最新代回写。
- E2E：新建或扩展专门组件 spec，覆盖默认/展开/重置/空错/loading、键盘 Tab/Escape、浅色/HUD、375px 和 320px；检查容器不横向溢出、触控目标和可见焦点。

### 3.2 `LxStatusSwitch`（G2，旧审计 P0）

**现状和差距**：已有 `boolean` 与旧 `0/1` 映射、关闭确认/取消、只读、loading、失败恢复、焦点、对比度、44px 点按区和减少动效单测/E2E。严格设计对照和宿主替换仍未关闭。

- P1：核对 42×20px 轨道、开启/关闭语义色、危险关闭确认、只读 Tag、loading 锁定和失败恢复；明确业务权限判断由宿主注入，不在组件内访问权限 API。
- P2：补 `fallbackTag=false` 的无权限灰色开关、自定义 `onText/offText`、权限允许路径、`confirm=false`、自定义确认文案、重复点击和 aria 状态；确认失败后值和焦点恢复到提交前状态。
- 单测：增加上述边界、键盘 Space/Enter、`aria-checked`/禁用语义、确认 Promise 拒绝和 loading 期间的事件抑制。
- Mock：权限允许/拒绝、保存成功/失败/取消和重复提交；Mock adapter 只由宿主提供，失败必须可再次操作。
- E2E：桌面与 375px 的开关、确认弹窗、只读/无权限、错误重试、HUD、减少动效和键盘焦点；验证轨道不因文案或 loading 变形。

### 3.3 `LxMetricCard`（G3，P1）

**现状和差距**：已有 6 项单测和 2 项文档 E2E，覆盖旧宿主 props/slots、语义色优先级、趋势箭头、进度边界/读屏/对比度、RTL/长标题、LxIcon、320px、HUD 和减少动效。尚缺正式 A/B、完整视觉矩阵和真实宿主详情抽屉组合证据。

- P1：逐项对照数值/单位、状态语义色、角标、趋势方向、进度标签和读屏文案；核对 `status` 覆盖 `valueType`、`title` 覆盖 `label`、`badgeText` 覆盖 `badge` 的兼容优先级。
- P2：补 0/100 和边界进度、空值/长数值/长标题、缺少 trend 或 footer、窄卡片换行、RTL 和插槽组合；把 Vue3 详情抽屉的 6 处宿主引用列入 UI-04 组合回归，不在组件单测中伪造页面通过。
- 单测：补非法或缺省进度的显示策略、语义色冲突、长单位、空角标、插槽与旧属性同时传入、`aria-valuenow/min/max` 和装卸清理。
- Mock：卡片只使用本地状态 Mock；页面组合的加载/空/失败由宿主 Mock 提供，禁止把统计 API 写入 lx-ui。
- E2E：现有用例之外补加载/空/错误、极长标题和四种 status；检查 320px、HUD、减少动效、键盘读屏属性和卡片宽度稳定。

### 3.4 `LxSectionTitle`（G3，P1）

**现状和差距**：已有组件单测、Vue3 适配器单测和文档 E2E，覆盖 `border/dashed/plain`、size/tag/tagType、图标、键盘、HUD、长标题及 320/375px。规范更偏向 `border` 视觉，当前实现保留三种 variant，必须先记录兼容决策再对照，不能静默删除变体。

- P1：确认三种 variant 是否继续公开；若保留，分别写明设计依据和迁移兼容；若收敛，只能通过弃用计划处理。核对标题层级、左侧图标/色、标签语义和 extra 插槽。
- P2：补长标题、长副标题、extra 按钮/多控件、图标缺失或无效、标签过长、320px/375px 换行与焦点；extra 不得遮挡标题或产生页面级横向溢出。
- 单测：增加变体兼容决策、subtitle 空值、long text、tag number、extra 键盘焦点、aria heading 和尺寸稳定断言。
- Mock：无网络请求；用不同权限/页面组合的本地 slot 数据验证宿主适配，不引入业务状态。
- E2E：覆盖三变体、默认/长标题/长副标题/extra、HUD、键盘、320px/375px 和减少动效；记录 VitePress 文档壳层宽度与组件自身宽度的区分。

### 3.5 `LxAuthImg`（G4，业务封装 P2、严格矩阵仍待复核）

**现状和差距**：已有 6 项 lx-ui 单测、3 项文档 E2E，另有 Vue3 宿主 `AuthImg` 单测，覆盖公开 URL、Blob、load、对象 URL 回收、取消竞态、失败回退、空源、375px/HUD/键盘/减少动效。宿主鉴权适配器和真实后端联调尚未完成，必须与组件库 Mock 分开记录。

- P1：核对公开 URL 与注入 `request(src, signal)` 两条路径的载入、失败、回退、空源和 `alt/aria-busy`；不得在 lx-ui 读取 Token、拼网关或持有业务 API。
- P2：补 request 缺失、空 `src`、fallback 自身失败、Blob URL 替换/卸载回收、AbortError 静默和图片原生 error；宿主 `authImage.ts` 继续按 Vue2 网关/Authorization 契约实现，真实鉴权、权限不足和 Token 失效另列联调门槛。
- 单测：组件侧维持 Blob Mock、请求代次、AbortSignal、URL revoke 和 aria；宿主侧验证 `.then().catch().finally()`、请求头、取消不提示和旧响应隔离，不能合并为一套“已联调”结论。
- Mock：成功 Blob、空、网络失败、权限 401/403、取消、迟到响应、fallback 成功/失败；浏览器不得向真实后端发送请求。
- E2E：补载入中、成功、失败回退、无回退空态、更新 src、卸载、键盘/alt、375px/HUD/减少动效；保存请求拦截和外部请求为零的证据。

### 3.6 `LxNavbar`（G5，P1 壳层）

**现状和差距**：已有壳层文档 E2E，覆盖搜索、通知、用户菜单、`99+` 徽标和 375px 容器宽度；暂无专门组件级单测。Fullscreen API 拒绝、事件契约、键盘路径、隐藏入口和长用户/网络文案需要补齐。

- P1：对照 Navbar 规范核对导航密度、搜索入口、网络状态、通知徽标、用户菜单、焦点顺序和移动布局；`99+` 不得遮挡通知点击区。
- P2：补 `showFullscreen=false`、Fullscreen API 成功/拒绝/不可用、Escape/外部点击、搜索提交/清空、用户菜单键盘、长 name/role/networkLabel 和 320px 溢出。
- 单测：新增 `LxNavbar` 组件测试，覆盖 props 默认值、事件载荷、通知边界、菜单开闭/焦点、Fullscreen rejection、隐藏入口和卸载监听清理。
- Mock：Fullscreen API、通知/用户本地状态和搜索回调使用浏览器 Mock；不引入真实用户 API。
- E2E：桌面、375px、320px、HUD、减少动效、键盘/ESC、菜单焦点、Fullscreen 拒绝和长文案；限制宽度断言在组件容器。

### 3.7 `LxSidebar` 家族（G6，P1 壳层）

目标包括 `LxSidebar`、`LxSidebarBrand`、`LxSidebarGroup`、`LxSidebarItem`、`LxSidebarFooter`、`LxGauge`、`LxNodeBadge`。

**现状和差距**：已有中文 API/Demo；文档 E2E 2/2 覆盖 expanded/rail、分组键盘、单次 select、rail 浮层焦点/Escape、移动模态抽屉焦点循环/返回、HUD 和减少动效。未发现完整组件级单测；动态权限菜单仍是宿主数据，不能在组件内消费权限。

- P1：严格对照 `_1` 64px rail 与 `_2` 252px expanded 的品牌区、菜单密度、选中/hover/disabled、分组层级、footer、SLA 仪表和节点徽章；核对 activeKey、`update:mode`、`select`、`expand-change` 的事件载荷。
- P2：补禁用项不触发 select、`aria-expanded/current/disabled`、空菜单、长标题/角标、footer 隐藏、rail 浮层延迟清理、Teleport 卸载、移动抽屉关闭后的焦点返回和重复挂载；验证 `prefers-reduced-motion` 后 halo/过渡不残留。
- 单测：至少增加容器事件/受控 mode、Brand rail/expanded、Group 展开与键盘、Item disabled/active、Footer slot、Gauge 边界、NodeBadge 状态和所有监听/定时器清理。
- Mock：权限菜单仅由宿主映射为 `LxMenuItem[]`，覆盖成功、空、权限不足、禁用子项和菜单更新；组件测试不得请求后端。
- E2E：expanded/rail、二级浮层、长菜单、空/禁用/角标、footer、移动抽屉、焦点循环/Escape、HUD、浅色、减少动效、375px/320px；保存每个视图的 overlay 截图和外部请求证据。

## 4. 统一 Mock、单测和浏览器证据矩阵

### 4.1 Mock 状态

每个有异步边界的组件或宿主适配器至少登记：成功、空结果、业务失败、网络失败、权限不足、取消、分页/远程迟到响应和重复提交。所有 Playwright 请求必须由本地 handler 拦截；写操作不得打真实后端。组件库 Demo 用宿主注入的 adapter，不能在 `linkx-fe` 内拼接业务 URL。

### 4.2 浏览器状态

每个目标至少有桌面默认、键盘焦点、HUD 深色、窄屏 375px、窄屏 320px、loading、empty、error、disabled/readonly 和减少动效中适用的视图。视图必须检查：元素不重叠、容器不横向溢出、中文长文本可读、触控目标至少 44px、焦点可见、状态不只依赖颜色、`aria` 状态与视觉同步。

### 4.3 推荐文件和命令

- 单测：`other-admin/admin-vue3/tests/unit/lx-*.test.ts`，宿主鉴权另测 `auth-img.test.ts`；只运行本批目标，不放宽断言。
- 文档 E2E：`other-admin/admin-vue3/tests/e2e/lx-*-docs.spec.ts`，使用 `test:e2e:lxui` 配置；SearchBar 必须有独立行为 spec，不能只依赖文档搜索 spec。
- lx-ui：`pnpm --dir linkx-fe typecheck`、`pnpm --dir linkx-fe build`、`pnpm --dir linkx-fe build:docs`。
- Vue3 定向：`pnpm --dir other-admin/admin-vue3 exec vitest run <目标单测>`、`pnpm --dir other-admin/admin-vue3 exec playwright test --config=playwright.lxui.config.ts <目标 E2E>`、`pnpm --dir other-admin/admin-vue3 lint:ts`。
- 格式和静态检查：只对本批修改文件执行 `pnpm exec prettier --write` 后再 `--check`，并执行无自动修复的 ESLint；不把遗留 lint/构建警告写成新问题。

## 5. Impeccable 正式 A/B 规程

每个子批次都按 `C:\Users\Administrator\.codex\skills\impeccable\reference\critique.md` 执行，不能把一次 inline 评审或 detector `[]` 当正式通过。

1. **同一源码冻结**：在 A/B 前记录目标路径、Git 工作区状态和内容指纹；A、B、综合报告、修后复验引用同一冻结版本。修复后必须重新冻结，旧截图和旧 detector 不能混用。
2. **Assessment A 隔离**：由独立评估上下文先做设计评审，读取设计源和目标实现，给出设计特异性、Nielsen 十项评分、认知负荷、关键问题和 P1/P2/P3。A 完成前不得把 B 的 detector 发现带入判断。
3. **Assessment B 隔离**：另一个独立评估上下文运行 `node <skill>/scripts/detect.mjs --json <markup-target>`，保存 stdout JSON、stderr 和退出码；再开新浏览器标签/上下文完成 overlay。检测器必须记录目标可访问性和脚本注入结果。
4. **Browser overlay**：本地页面用后台 `live-server.mjs --background`，记录启动和停止命令；注入前用可变 DOM 预检标题和 script，注入失败就明确记录降级，不声称有用户可见 overlay。每种主题/状态视图保存截图、控制台发现和外部请求计数，结束前停止 server。
5. **结果解释**：逐条把命中归为真实组件问题、文档外壳误报或有设计依据的令牌命中；detector 输出 `[]` 必须同时满足 JSON 可解析、stderr 为空/有解释、退出码为 0、目标可访问、浏览器步骤成功。`[]` 只能说明静态规则零命中，不能代替视觉或交互审查。
6. **综合与复验**：合并 A/B 后只修复可复现的 P1/P2；修后重新跑受影响单测/E2E、detector 三件套和浏览器 overlay。将 snapshot 写入 `.impeccable/critique/`，用 `critique-storage.mjs trend <resolved-target> 5` 记录趋势；不同 `max_score` 的评分不能直接横向比较。

## 6. 全库 G7 关闭方法

### 6.1 52 项统一矩阵字段

`doc/lx-ui/COMPONENT-AUDIT.md` 的每一行补齐以下字段或可定位链接：

1. 唯一设计源和关键尺寸/状态；
2. 类型/API、事件、插槽、exposes 与兼容决策；
3. 中文 API 文档和 Demo，覆盖主要 props/events/slots/exposes；
4. 单测结果及边界；
5. Mock adapter 状态与外部请求为零的证据；
6. 文档浏览器 E2E、视口/主题/减少动效清单；
7. 独立代码复审结论和未覆盖项；
8. Impeccable A/B 报告、detector JSON/stderr/exit code、overlay 截图；
9. 修后复验结果与剩余 P3；
10. snapshot/trend 路径、当前源码指纹和关闭日期。

全库复核时仍需逐行检查已经有阶段性证据的 `LxTreeSelect`、`LxCascader`、`LxSelectPagination`、`LxIcon`、`LxPasswordInput`、`LxDynamicForm`、`LxUpload`、`LxDescriptions`、`LxSidebar` 等；P2/P3 未清除或缺少正式 snapshot 的行保持打开。不能因为某个组件 A/B 通过而推断 52 项 UI-10 或 UI-11 已完成。

### 6.2 全库 detector 核验

对 52 个公开组件的 markup 目标和代表性文档目标逐项运行 detector。每项都保留 `stdout.json`、`stderr`、`exit-code`、命令文件、目标指纹以及浏览器 overlay/截图索引。非零退出码、Puppeteer 缺失、目标不可访问或注入失败均标为扫描失败；即使 stdout 为 `[]` 也不能标为通过。

### 6.3 最终技术门槛

关闭 G7 前必须实际运行并记录：

- `linkx-fe` typecheck、库 build、VitePress docs build；
- 受影响的 Vitest 单测和 lx-ui Playwright E2E；
- 全库 detector 的 JSON/stderr/退出码核验和代表性浏览器 overlay；
- 目标文件 Prettier check、Vue3 ESLint/TypeScript 检查、`git diff --check`；
- 环境警告（大 chunk、循环依赖、Less 导出等）与代码失败分开记录。

构建成功、单测通过或静态 `[]` 均不能单独替代 A/B、浏览器、代码复审和真实后端联调边界。

## 7. 提交与交接清单

每个子批次完成后更新以下台账，四份主台账的状态、计数和路径必须一致：

- `doc/PROJECT-FOLLOWUP-BREAKDOWN.md`：Wave 进度、严格顺序、P1/P2/P3 和下一入口；
- `doc/PROJECT-MAP.md`：组件入口、设计源、测试和宿主边界；
- `doc/lx-ui/COMPONENT-AUDIT.md`：52 行严格矩阵及差距；
- `linkx-fe/docs/ROADMAP.md`：当前波次、实际命令、证据路径和遗留项。

同步维护：

- `linkx-fe/docs/components/lxsearchbar.md`、`lxstatusswitch.md`、`lxmetriccard.md`、`lxsectiontitle.md`、`lxauthimg.md`、`lxnavbar.md`、`lxsidebar.md`、`lxtransferpanel.md` 的中文 API/Demo 与行为边界；
- `doc/PROJECT-DELIVERY-PLAN.md` 与 `doc/PROJECT-HANDOFF.md` 的范围、源码指纹、测试命令、A/B、snapshot/trend、阻塞和下一步；
- `other-admin/admin-vue3/docs/MIGRATION-BACKLOG.md`、`ELEMENT-PLUS-LX-UI-MATRIX.md` 的宿主采用状态；
- `other-admin/admin-vue3/docs/CODE-REVIEW-VALIDATION.md` 的独立代码复审记录。

交接记录必须明确区分：源码对照、单测通过、Mock 验收、浏览器 E2E、正式 Impeccable A/B、真实后端/权限联调和未执行项。所有未完成项写出原因和重新进入条件，不用“已验证”覆盖未跑的命令。

## 8. Wave 9 放行条件

只有在 G7 的 52 项逐行矩阵闭合、所有 P1/P2 视觉和可访问性问题已修复或经负责人明确批准保留、全库 typecheck/build/docs build 和相关单测/E2E 通过、detector 三件套与浏览器证据可追溯、代码复审和交接记录齐全后，才允许开始 Vue3 宿主的 Element Plus 批量替换。真实后端鉴权、文件上传、权限菜单和账号会话仍须作为独立联调门槛，不由组件 Demo 或本地 Mock 代替。
