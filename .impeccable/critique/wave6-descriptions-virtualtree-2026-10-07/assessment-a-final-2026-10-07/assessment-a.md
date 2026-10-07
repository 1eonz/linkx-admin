Method: isolated Assessment A only (`/root/wave6_final_assessment_a`); Assessment B findings were not consulted.

# Wave 6 Assessment A

## 范围与证据边界

评审目标为 `linkx-fe` 的 LxCascader、LxDescriptions、LxVirtualTree 文档示例与组件契约，以及 VitePress 组件侧栏分组。稳定源码目标取 [LxDescriptions 文档](F:/work/linkx-admin/linkx-fe/docs/components/lxdescriptions.md)；旁看 [LxCascader 文档](F:/work/linkx-admin/linkx-fe/docs/components/lxcascader.md)、[LxVirtualTree 文档](F:/work/linkx-admin/linkx-fe/docs/components/lxvirtualtree.md) 与 [VitePress 配置](F:/work/linkx-admin/linkx-fe/docs/.vitepress/config.ts)。Impeccable `context.mjs` 未找到 PRODUCT.md、DESIGN.md 或 surface brief；当前组件、令牌和文档作为既有视觉事实来源。

目标 URL 为：

- `http://127.0.0.1:4174/components/lxcascader`
- `http://127.0.0.1:4174/components/lxdescriptions`
- `http://127.0.0.1:4174/components/lxvirtualtree`

本轮初始探测记录了 `127.0.0.1:4174` 主动拒绝连接；随后主 Agent 授权使用独立验收实例 `http://127.0.0.1:4175`，4174 未触碰。使用 Chrome 154 + Playwright 在 4175 为三个路由各开新页，采集桌面 1440px、窄屏 375px、HUD、减少动效、键盘、加载/错误/空/禁用和侧栏视图，共 50 张本轮截图、27 组页面指标和 9 项交互记录。三个页面均无整页横向溢出。未运行 detector 或 overlay；控制台唯一错误是文档外壳缺失 `/favicon.ico` 的 404，已作为外壳资源误报记录，不计产品问题。

## 设计特异性

高。中文字段、组织层级、警号与执勤单元等示例直接对应 LinkX 行政/组织管理场景；级联选择、详情只读、虚拟组织树的用途和宿主请求边界都写明。VitePress 外壳本身较通用，但组件内容不是换一组标题就能无差别套到无关产品的模板。

## Nielsen 健康分

| # | 启发式 | 分数 | 关键依据 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3 | 示例状态使用可读文案及 status/alert；Descriptions 状态切换提供 `aria-pressed`。运行时能看到加载、错误、空结果和重试文案。 |
| 2 | 系统与现实世界匹配 | 3 | 中文业务词汇和真实组织路径具体，API 名称仍要求开发者熟悉组件术语。 |
| 3 | 用户控制与自由 | 3 | 筛选可清除，示例错误可重试，级联和树操作可逆；未发现高风险提交流程。 |
| 4 | 一致性与标准 | 2 | 组件复用 lx-ui 令牌，但 Cascader 的 HUD 触发表面为深色而弹层计算为白底，和文档宣称的主题传递不一致。 |
| 5 | 错误预防 | 3 | 禁用节点、加载期间暂停选择、错误态和空态分别说明，降低误操作。 |
| 6 | 识别而非回忆 | 3 | 控件有可见标签，树示例有当前选择摘要，文档给出键盘和 API 说明。 |
| 7 | 灵活与高效 | 2 | 公开方法和方向键有助熟练用户；实测树项内按钮/复选框仍进入默认 Tab 顺序，与单一停靠点说明冲突。 |
| 8 | 简洁与审美 | 3 | 级联与树的高级演示项默认收起；运行时展开树操作区可见 7 个按钮，但主组件仍保持清晰。 |
| 9 | 错误识别与恢复 | 3 | 错误有明确文案和重试入口，加载、错误并发规则在级联文档中说明。 |
| 10 | 帮助与文档 | 4 | 三个页面均有示例、契约、边界说明；级联覆盖键盘与异步状态，虚拟树覆盖方法与键盘；VitePress 配置本地搜索。 |
| **总分** |  | **29/40** | **Good（72.5%）；已完成 4175 运行时取证，仍未覆盖真实屏幕阅读器播报。** |

## 认知负荷

确认 2 项失败，属中等负荷；桌面/移动运行时和减少动效已覆盖，真实屏幕阅读器播报仍未覆盖。

| 检查项 | 结论 | 依据 |
|---|---|---|
| 单一焦点 | 通过 | Cascader 主字段先显示；虚拟树大量方法控制藏在 `details` 后。 |
| 分块 | 失败 | 展开虚拟树演示后，“树操作”组里有 7 个并列按钮。 |
| 分组 | 通过 | 树状态、树操作和两个模式切换分别有分组或标签。 |
| 视觉层级 | 通过 | 页面标题、交互示例和组件主体层级清晰；移动侧栏打开后遮罩和导航仍可识别。 |
| 一次一事 | 通过 | 组件选择操作与进阶演示操作分开。 |
| 最少选项 | 失败 | 虚拟树“树操作”一次呈现 7 个选择，超过单个决策点的 4 项参考线。 |
| 工作记忆 | 通过 | 当前值/选择摘要和状态文案由页面可见；无需跨屏记住结果。 |
| 渐进披露 | 通过 | Cascader 设置和虚拟树状态/更多操作默认收起。 |

## 优势

1. 三个演示都把组件职责和宿主职责讲清楚，没有把本地状态切换误称为真实后端请求。
2. 虚拟树提供 240 节点、禁用节点、过滤、受控选择和公开方法演示；级联示例预填路径并包括加载、失败、并发和禁用状态。
3. 详情示例覆盖长值、复制、状态、窄屏换行和权限脱敏说明；文档侧栏分层且有本地搜索配置。

## 优先问题

1. **P1：Cascader HUD 弹层未继承 HUD 表面。** 4175 实测桌面打开 HUD 后，弹层 class 含 `dark lx-theme-hud`，但计算样式仍是白色背景、深灰文字和浅色边框；截图显示深色触发表面下方出现白色弹层。级联文档明确说主题开关同时作用于示例表面与传送到页面根节点的级联弹层，因此这是可见且可复核的实现/契约不一致。建议让传送弹层的主题类命中 Element Plus 深色变量，或把 HUD 令牌作用域显式包在弹层 DOM；用桌面和 375px 两个截图复验。证据：[桌面 HUD 弹层](F:/work/linkx-admin/.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/assessment-a-final-2026-10-07/screenshots/cascader-desktop-hud-open-component.png)、[移动 HUD 弹层](F:/work/linkx-admin/.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/assessment-a-final-2026-10-07/screenshots/cascader-mobile-375-hud-open-reduced-motion-viewport.png)、[契约说明](F:/work/linkx-admin/linkx-fe/docs/components/lxcascader.md:11)。
2. **P1：VirtualTree 的单一 Tab 停靠契约与运行时焦点序列不一致。** 文档称树项采用单一 Tab 停靠焦点，但 4175 在 21 行可见树中测得 23 个顺序 Tab 目标，序列包含 `treeitem`、展开按钮和多个原生复选框；首个焦点路径为树项 → 展开按钮 → 复选框 → 复选框。建议明确并统一模型：若采用 roving treeitem，只保留树项为树内 Tab 停靠点并用键盘操作子功能；若保留展开/复选框独立 Tab，则更新文档和焦点回收规则，避免把两种模型同时称为单一停靠点。依据：[Tab 证据](F:/work/linkx-admin/.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/assessment-a-final-2026-10-07/browser-evidence.json)、[键盘契约](F:/work/linkx-admin/linkx-fe/docs/components/lxvirtualtree.md:92)、[运行时截图](F:/work/linkx-admin/.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/assessment-a-final-2026-10-07/screenshots/virtualtree-desktop-keyboard-focus-component.png)。
3. **P2：虚拟树 Demo 的窄屏操作触点偏小。** 4175 在 375px 视口实测“筛选第二个辖区”等按钮为 34px 高，父子/HUD 标签为 30px 高；它们是验证筛选、选择、展开和定位方法的实际入口，低于 44px 触控建议。建议触控/窄屏下提升按钮和标签到至少 44px，或减少默认出现的控件并分组。依据：[移动截图](F:/work/linkx-admin/.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/assessment-a-final-2026-10-07/screenshots/virtualtree-mobile-375-controls-open-reduced-motion-component.png)、[树操作组](F:/work/linkx-admin/linkx-fe/src/components/LxVirtualTree/demo/basic.vue:128)、[按钮高度](F:/work/linkx-admin/linkx-fe/src/components/LxVirtualTree/demo/basic.vue:232)。
4. **P2：Descriptions 的 HUD 开关影响整个文档根节点，控制范围没有在标签中说明。** Demo 将 `dark` 与 `lx-theme-hud` 切换应用到 `document.documentElement`，4175 实测 VitePress 根节点同时变为 dark/HUD；按钮只写“HUD 深色主题”。系统令牌确实规定可用 `<html class="lx-theme-hud">` 激活主题，这是设计依据，不应按主题实现错误计；问题在于这个演示开关的全局副作用未被说明，且和 Cascader 文档所述“作用于示例表面与弹层”的局部范围不一致。建议让标签明确“整页主题”，或将 Descriptions 演示改为局部主题类。依据：[桌面 HUD 截图](F:/work/linkx-admin/.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/screenshots/descriptions-desktop-hud-viewport.png)、[开关实现](F:/work/linkx-admin/linkx-fe/src/components/LxDescriptions/demo/basic.vue:55)、[根节点主题约定](F:/work/linkx-admin/linkx-fe/src/tokens/theme-hud.css:4)。
5. **P3：侧栏中 Descriptions 的父分组名称不利于首次查找。** `LxDescriptions 详情描述` 被放在“数据展示 > 表格与分页”，名称强调了表格/分页，却没有提示详情字段面板用途。建议改成更覆盖该页面职责的分组名，或将详情描述与详情抽屉/只读信息类文档并置；本轮截图确认条目确实出现在该分组，有本地搜索，所以影响是绕路而非阻塞。依据：[侧栏截图](F:/work/linkx-admin/.impeccable/critique/wave6-descriptions-virtualtree-2026-10-07/assessment-a-final-2026-10-07/screenshots/descriptions-desktop-light-docs-sidebar.png)、[侧栏配置](F:/work/linkx-admin/linkx-fe/docs/.vitepress/config.ts:123)。

## 人物视角红旗

- **Sam（键盘/辅助技术用户）：** 4175 实测虚拟树 21 行有 23 个顺序 Tab 目标，路径为 treeitem → 展开按钮 → 复选框 → 复选框，和文档承诺的单一停靠点不符，是最具体的可访问性风险。
- **Jordan（初次使用者）：** 找“详情描述”时先看到的上级名称是“表格与分页”；该项的详情用途不明显。级联 HUD 弹层的白底也削弱了主题状态的可预测性。术语本身有例子和说明，不构成主要阻碍。
- **Alex（熟练用户）：** `filter`、`expandAll`、`scrollToKey` 等公开方法有利于快速集成；手动键盘路径会被行内控件 Tab 顺序拖慢。

## 次要观察与判定区分

- **设计依据，不计缺陷：** HUD 主题令牌文档明确规定可挂在 `<html>` 上；Descriptions 全局主题行为符合令牌约定。需要确认的是示例开关是否应提示“整页”范围。
- **文档外壳误报：** 4175 控制台唯一错误为 `/favicon.ico` 404；它没有对应组件请求，已记录在浏览器证据中，不计为组件缺陷。本轮没有运行 detector/overlay，也没有读取它们的命中。
- **静态边界：** 虚拟树文档写明 `nodeKey` 必须唯一；源码索引使用 `Map`，违反唯一约束时没有用户可见提示。当前标为低优先级集成边界，不计入前述优先问题。
- **视觉观察：** 4175 截图确认桌面 sidebar、移动抽屉、HUD、错误/空/加载态和减少动效视图均可呈现；三个页面在 375px 与 1440px 均无整页横向溢出。未覆盖真实屏幕阅读器播报、真实触摸设备和后端错误恢复；Cascader HUD 弹层的白底与触发表面不一致，已列为 P1。

## 情绪路径

示例用已选路径、状态摘要和业务值降低进入成本；错误态有明确文案与重试，树操作能回报结果，没有看到需要用户担心保存或删除的高风险节点。4175 已确认 HUD、窄屏和加载/错误/空/禁用路径可呈现，需优先处理级联弹层的主题表面和树内 Tab 模型。

## 待综合的问题

1. LxVirtualTree 应固定采用单一树项停靠点，还是保留每个原生 checkbox/tab stop？文档与实现需要选定同一模型。
2. LxDescriptions 的主题控件目标是示例局部还是整个 VitePress 页面？标签与另两个 Demo 应用同一约定。
3. 展开虚拟树高级操作后，七个方法入口能否按“筛选/选择/视图”分组，并只把最常用的两三个放在同一决策面？

Questions for parent synthesis: none; this is Assessment A only.
