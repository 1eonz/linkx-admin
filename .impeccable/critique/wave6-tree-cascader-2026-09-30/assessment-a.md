# Assessment A：LxTreeSelect 与 LxCascader 设计评审

评审范围：`linkx-fe/src/components/LxTreeSelect/`、`linkx-fe/src/components/LxCascader/`，对应 Demo 与 VitePress 文档，以及 `design/表单控件八件套/screen.png`、`doc/lx-ui/DESIGN-SPEC.md` 和 `doc/lx-ui/COMPONENT-STYLE-INTERACTION.md`。

方法：单独完成的 Assessment A。评审只使用源码、设计资料、公开测试和本次浏览器观察；没有读取或使用其他评审、detector 或综合结论。

浏览器观察在 1280×720 的 VitePress 页面完成。TreeSelect 实测浅色、文档深色、HUD 深色 Demo、树展开、键盘输入筛选、空目录、加载中、禁用节点和多选切换；Cascader 实测浅色、回显路径、展开三级级联和 Escape 收起。当前浏览器工具没有可用的视口/media 模拟入口，因此 375px、真实 `prefers-reduced-motion` 和 Cascader 的 HUD class 未作浏览器实测；相关结论来自源码与设计对照，不能标记为通过。

## Design Health Score

| # | Nielsen 启发式 | 分数 | 关键问题 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3/4 | TreeSelect 的空态、加载中和受控值可见；Cascader 没有 loading/error 交互示例。 |
| 2 | 系统与现实世界匹配 | 4/4 | 组织树、部门路径和中文状态文案符合后台管理语境。 |
| 3 | 用户控制与自由 | 3/4 | 可清空、Escape 收起、可切换单/多选；多选立即提交，缺少确认/取消控制。 |
| 4 | 一致性与标准 | 3/4 | 32px 基线、令牌、焦点光环大体统一；TreeSelect 错误焦点和 Cascader 触控行高仍有缺口。 |
| 5 | 错误预防 | 2/4 | 没有完整错误/重试示例；多选选择即时生效，组织权限场景有误操作风险。 |
| 6 | 识别而非回忆 | 4/4 | 树层级、路径标签、已选项和搜索结果直接呈现。 |
| 7 | 灵活高效 | 3/4 | 支持筛选、多选、清空、懒加载属性透传和 focus/blur；公开 API 对加载/空态/本地化不够完整。 |
| 8 | 审美与极简 | 3/4 | 表面、边框、弹层和状态色克制；文档页面的浮层会压住正文，主题外壳还有视觉断层。 |
| 9 | 错误恢复 | 2/4 | TreeSelect 有空目录和加载反馈；两个组件都没有明确错误文案、重试或失败恢复契约。 |
| 10 | 帮助与文档 | 3/4 | 文档有 API、设计对照和 Demo；Cascader 状态覆盖不足，TreeSelect 文档把键盘覆盖写得比可见示例更完整。 |
| **总计** |  | **30/40** | **基础可用，完成 UI-10 前仍需补齐状态和多选语义。** |

## Design Specificity Verdict

这两个组件已经有 LinkX 的产品特征：组织机构中文数据、DynamicForm 入口、HUD 深色预设、统一的 32px 控件基线和表单八件套令牌。TreeSelect 的三层组织树和 Cascader 的“市局 / 分局 / 情指中心”路径让它们比普通 Element Plus 包装更贴近 LinkX 管理台。

但交互骨架仍高度依赖 Element Plus 默认模式。尤其是多选没有设计稿/说明书要求的 footer 确认，以及 Cascader 的弹层触控规则没有完整落到选项行。它们目前是“有产品语汇的桥接组件”，还不是完整表达 LinkX 操作风险和移动端约束的专属控件。

## Overall Impression

桌面端的第一印象清楚、紧凑，组织路径和树层级容易理解。TreeSelect 的搜索会自动收敛到命中的分支，Cascader 的三级列式面板能准确表达路径。最大机会是把高风险的多选提交语义、失败恢复和窄屏弹层规则补齐；否则组件在普通查看场景很稳，在权限筛选、移动触控和网络异常场景仍会让用户猜测下一步。

## What's Working

1. **产品语境明确。** `杭州市公安局 / 滨江分局 / 长河派出所` 这类数据让树选择与级联路径一眼可读；选中的文字和层级比纯 ID 更容易校验。
2. **视觉基线基本统一。** TreeSelect 使用 32px 控件、主色焦点、浅色选中背景、细滚动条和 4px 级别圆角；Cascader 使用控件边线、主色光环、弹层阴影和表单错误令牌，符合设计稿中输入/选择控件的密度方向。
3. **边界责任写得清楚。** 文档明确请求、懒加载和权限过滤由宿主注入，组件不直接访问业务 API；受控值和 `focus()`/`blur()` 也有明确说明，便于表单编排。

## Priority Issues

### [P1] TreeSelect 多选选择立即提交，缺少确认边界

**Why it matters：**设计说明书对组织树多选规定了“勾选累积 tag，footer 确认”。当前 Demo 点击“多选模式”后选择立即回填，面板没有确认/取消 footer，用户无法在提交前检查一组部门。权限、批量分配或筛选场景中，误点一个节点就会改变父层状态。

**Evidence：**`linkx-fe/src/components/LxTreeSelect/demo/basic.vue:45-48` 只在模式切换时直接替换受控值；浏览器实测多选后立即出现“长河派出所”标签并关闭面板。设计依据为 `COMPONENT-STYLE-INTERACTION.md` 的 LxSelectTree 多选交互约定。

**Fix：**在多选模式增加待提交值与已提交值两层状态，弹层底部提供“取消 / 确认”；如果产品决定保留即时提交，则应改写组件定位和文档，避免与组织树设计契约冲突。

### [P1] Cascader 的窄屏触控规则只覆盖触发器，没有覆盖选项行

**Why it matters：**文档声称窄屏触控目标至少 44px，但 `LxCascader/style.css` 的 `@media (hover: none)` 只把 `.el-input__wrapper` 提高到 44px，没有给 `.el-cascader-node` 或菜单项设置最小高度。移动用户在最常用的展开菜单里仍可能得到小于 44px 的点击目标。

**Evidence：**`linkx-fe/src/components/LxCascader/style.css:46-50` 只有触发器规则；对应 TreeSelect 已在 `style.css:97-104` 同时处理触发器和树节点。375px 真实浏览器视口在本次工具中无法设置，因此这是源码与规格的明确差异，尚缺实机截图。

**Fix：**在触控媒体查询内为 `.lx-cascader__popper .el-cascader-node` 设置至少 44px 的行高/最小高度，并检查多列面板在 320/375px 下是否出现横向溢出。

### [P2] 两个组件的错误恢复路径没有形成可见契约

**Why it matters：**TreeSelect 有空目录和加载中，Cascader Demo 只有成功回显、选择和清空；没有失败、重试、权限不足或异步节点加载错误的可见路径。用户看到空结果时无法判断“确实没有数据”还是“请求失败”。

**Evidence：**TreeSelect 文档 `lxtreeselect.md:20-32` 只列交互示例和内存数据；Cascader 文档 `lxcascader.md:22-42` 只列设计对照和 API。Cascader 组件类型没有 `loading`/`error`/`retry` 公共状态，低频远程加载仅通过 `$attrs` 透传。

**Fix：**至少在 Demo/API 中展示空、加载、失败和重试的独立状态；对 Cascader 明确 `loading`、`emptyText`、`error` 或宿主插槽契约，避免每个页面自行拼接失败反馈。

### [P2] TreeSelect 的表单错误焦点状态不完整，减少动效实现也没有完全关闭动画

**Why it matters：**设计稿要求错误控件聚焦时保留错误边线和焦点环。TreeSelect 只在 `.el-form-item.is-error` 下设置红色边框，没有错误态的 `.is-focused` 焦点环；键盘用户在错误字段上可能看不出当前焦点。两个组件的 reduced-motion 规则使用 `animation-duration: 0.01ms` 和 `transition-duration: 0.01ms`，文档却写成“关闭”，与规范中全部禁用动画的表述不完全一致。

**Evidence：**`linkx-fe/src/components/LxTreeSelect/style.css:32-35` 只有错误边框；`style.css:107-112` 和 `linkx-fe/src/components/LxCascader/style.css:52-57` 将时长压到 0.01ms 而非 `none`。

**Fix：**增加错误聚焦选择器，保持错误色边线并叠加 2px halo；将 reduced-motion 的关键动画设为 `none`，过渡设为 `none` 或统一采用库级降级策略，并在浏览器中验证。

### [P2] 本地化和公开状态覆盖存在隐含契约

**Why it matters：**TreeSelect 在组件 setup 内 `provideGlobalConfig({ locale: zhCn })`，会让宿主的 locale 选择受到组件局部覆盖；同时空态文案只检查 camelCase `attrs.emptyText` 等值，使用模板常见的 kebab-case 透传时不容易被公开 API 感知。Cascader 没有同等的中文默认/可覆写说明。跨语言或统一错误文案的应用会遇到不一致。

**Evidence：**`linkx-fe/src/components/LxTreeSelect/index.vue:23-42` 在组件内部注入 locale 并计算空/加载文案；这些字段没有出现在 `LxTreeSelectProps` 的公开类型中。

**Fix：**把 locale 和空/加载/无匹配文案作为明确 props 或宿主注入的国际化契约，优先尊重上层 `ElConfigProvider`；同时补充中英文 Demo 或至少补 API 表格和 kebab-case 透传测试。

## Cognitive Load Assessment

- **TreeSelect：**三层组织树的层级表达优秀，搜索“高新”后自动收敛到命中分支，减少滚动和记忆。Demo 工具栏同时放置多选、空目录、加载和 HUD 四个控制，尚未超过不可管理的范围，但它把演示控制和用户任务混在同一视觉区域；真实业务应把模式和状态说明放到字段附近。
- **Cascader：**三级列面板把路径拆成可扫描的步骤，认知负荷低。Demo 同时显示“当前值”的内部 ID 路径和中文“已回显”路径，开发者可验证契约，但最终用户会看到不必要的重复信息；建议在生产示例中只保留人类可读反馈。
- **Decision points：**TreeSelect 多选、清空、禁用节点和懒加载会叠加决策成本；缺少确认/失败恢复时，用户必须依靠记忆判断操作是否已提交。

## Emotional Journey

1. **进入：**预填的组织路径和浅色控件让用户迅速确认当前对象，信任感较好。
2. **探索：**TreeSelect 搜索和 Cascader 分列展开提供即时方向反馈；HUD 深色 Demo 的颜色映射稳定，视觉上有“指挥台”感觉。
3. **提交：**单选和清空反馈明确；多选在没有确认步骤的情况下直接生效，形成不必要的紧张点。
4. **出错：**空态和加载中文字能解释等待，但失败、权限和重试没有情绪出口，用户容易把异常当成“没有数据”。

## Persona Red Flags

**Alex（高频操作员）：**键盘搜索体验较好，TreeSelect 输入“高新”后结果自动收敛；但多选没有确认/取消，连续勾选组织节点时不能批量检查后再提交。错误焦点环不完整，也会降低快速定位字段的效率。

**Jordan（首次使用者）：**中文组织层级和路径标签容易理解；Cascader Demo 把原始 ID 和中文路径同时展示，可能误以为 ID 是需要处理的业务值。遇到远程加载失败时没有“重试”入口或错误解释。

**Mei（窄屏值班人员）：**TreeSelect 源码同时放大触发器和树行，方向正确；Cascader 只声明触发器 44px，级联选项行没有同等保障。375px 下多列弹层宽度、滚动和点击间距仍需实测。

## Minor Observations

- Cascader 文档先渲染交互 Demo，再出现“基础用法”标题；页面层级与右侧 On this page 顺序不完全一致。
- TreeSelect 文档写明“覆盖键盘焦点”，但没有可见的键盘操作说明或按键提示；建议在 Demo 下补一行“输入筛选、↑↓ 选择、Enter 确认、Esc 收起”。
- TreeSelect `focus()`/`blur()` 的公开方法有价值，但文档没有说明失败校验后的调用时机或与 `LxForm` 的组合示例。
- Cascader Demo 的 `updatePath` 只保留字符串和数字，和文档所列的记录对象值契约不一致；对象值场景需要单独示例或明确限制。
- 两个页面的浮层在视口底部时会覆盖邻近文档正文，这是正常 popper 叠层的可视结果；Demo 页面可通过增加下方空间或在展开前滚动控件改善评审可读性。

## Verification Scope and Recheck Plan

已观察：桌面 1280×720、TreeSelect 浅色/文档深色/HUD 深色、TreeSelect 空/加载/禁用/键盘筛选/多选、Cascader 浅色/回显/展开/Escape 收起。

未验证：375px 真实视口、Cascader HUD class、真实 `prefers-reduced-motion`、Cascader 触控选项行、表单错误焦点和远程失败/重试。浏览器工具在本次 Assessment A 中没有暴露视口与 media 模拟能力，不能把这些项目记为通过。

复验顺序：

1. 先明确 TreeSelect 多选是即时提交还是 footer 确认，并让设计说明书、Demo、事件契约一致。
2. 在 320/375px 测试 Cascader 多列弹层的节点行高、横向滚动和回填文本截断。
3. 加入两个组件的表单错误、加载失败和重试状态，验证焦点、ARIA、文案对比度和恢复动作。
4. 在浅色、普通深色和 HUD 下分别开启 reduced-motion，确认弹层与焦点过渡确实关闭。

## Questions to Consider

- 组织树多选是否需要“确认后提交”来保护权限与批量操作？如果不需要，是否应同步删除说明书中的 footer 确认约定？
- Cascader 的远程节点加载失败时，用户应看到字段内错误、弹层内错误，还是统一的宿主级错误横幅？
- 375px 下多列级联是允许横向滑动，还是应改为单列逐级推进？

