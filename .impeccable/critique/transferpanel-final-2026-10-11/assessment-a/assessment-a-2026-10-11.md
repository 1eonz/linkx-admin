Method: Assessment A 独立视觉复评（系统 Edge，新建隔离 context；未读取 Assessment B 或 detector 结果）

# LxTransferPanel 视觉复评

评审日期：2026-10-11。目标为 `http://127.0.0.1:43620/components/lxtransferpanel`，模式为 Operate。检查 1280×900 与 320×900，亮色/HUD、正常/错误/空结果、组件树与已选列表滚动，以及 Props 表自身的横向滚动。使用系统 Edge 的新 context 截图，完成后已关闭；没有停止 43620 或 4174，也未修改产品代码。

## 总评

组件的双栏授权流程清楚、克制，视觉语言贴合组织权限场景。桌面层级完整，窄屏切成待选/已选两页且维持单屏宽度；状态、批量上限、滚动提示和错误重试均可见。当前最值得盯住的是宿主如何表示“已选但未保存”，以及极长部门编码在触屏设备上的全文查看方式。

设计特异性：高。组织树、部门编码/状态、批量权限动作和下级继承说明组成明确的公安组织授权场景，不是可原样套给任意双栏选择器的皮肤。

## Nielsen 评分

| # | 启发式 | 分数 | 依据 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3/4 | 已选数、树总量、剩余名额和错误状态可见；是否已持久化由宿主另行提供。 |
| 2 | 贴近真实世界 | 4/4 | 组织树、部门编码、状态与权限继承顺序贴合任务。 |
| 3 | 用户控制与自由 | 4/4 | 搜索可清除、单项可移除，清空需确认；移动端可切换面板。 |
| 4 | 一致性与标准 | 4/4 | 亮色/HUD、按钮、标签与文档站控件保持统一，交互使用常见筛选、复选和折叠模式。 |
| 5 | 错误预防 | 4/4 | 超限批量动作被阻止并解释原因，危险清空需确认，禁用节点明确弱化。 |
| 6 | 识别而非回忆 | 3/4 | 名称、编码和状态同行；较少用到的反选操作收在“更多反选选项”中。 |
| 7 | 灵活与效率 | 3/4 | 支持过滤、批量选择和树键盘导航；没有独立的批量快捷键。 |
| 8 | 美观与简约 | 3/4 | 数据密集但层级明确；树元数据字号较小，长文档示例控制在演示区内。 |
| 9 | 错误识别与恢复 | 3/4 | 加载失败保留现有选择并提供重试；实际保存失败后的恢复由宿主负责。 |
| 10 | 帮助与文档 | 4/4 | 组件文档说明 props、事件、限制和宿主持久化边界，树下方有键盘提示。 |
| **总分** |  | **35/40** | **Good：基础扎实，处理弱项后可交付。** |

## 优点

- 桌面保留树、双向动作和已选列表的同屏对照；`DEPT-03` 在当前桌面首屏完整显示，DOM `clientWidth=scrollWidth=53px`。
- 320px 使用待选/已选切换，树和已选项各自在组件内滚动。复核时根节点与 body 均为 `scrollWidth=clientWidth=320px`；Props 表为 `977px` 内容在自身 `272px` 视口中横向滚动，没有撑宽页面。
- 错误态用文字说明失败并给出“重试”，保留现有权限选择；空结果显示“暂无数据”，已选项仍可见，没有把“树为空”误作“无选择”。

## 优先问题

1. **[P2] 已选与已保存的状态需要在宿主操作区并列呈现。** Demo 显示当前选择，但选择本身只保存在内存；这个边界目前主要写在组件下方说明中。权限维护者可能把“已选”理解为“已保存”。宿主应在面板旁提供“有未保存更改/已保存/保存失败”状态，并在保存失败时提供恢复草稿的路径。组件文档已经明确要求宿主承担此职责。建议命令：`/impeccable harden`。
2. **[P3] 树编码和状态的 11px 字号偏小。** 1280px 下 `DEPT-03` 可完整核对；320px 下短编码仍完整，但频繁扫读时小字号与紧凑行距增加负担。保持布局不变时，可优先把元数据提升到 12px，并检查状态色在亮色/HUD 的对比。建议命令：`/impeccable typeset`。
3. **[P3] 长编码的触屏全文查看仍依赖非显式入口。** 当前长码行确实省略，并保留完整文本与 `title`；桌面测得 `clientWidth=96px`、`scrollWidth=188px`。触屏没有 hover，用户需要通过搜索或其他方式确认全文。若长编码是授权核对依据，可补充可聚焦/可点击的全文查看或复制入口；若筛选已满足业务需求，则在接入说明中明确。建议命令：`/impeccable adapt`。

## 认知负荷

低，检查清单 0/8 项失败。主焦点明确；树、过滤器、双向动作、计数分组稳定；错误与上限提示就近出现；移动端一次只展示一个面板。演示设置中的四种宿主状态构成一组，主题、最大项数和继承说明是独立开关；没有单个决策点迫使用户同时权衡超过四个动作。隐藏反选操作采用渐进披露。

## Persona

- **Alex（熟练操作员）**：过滤、批量加入/移除、反选和键盘树操作覆盖高频路径；缺少批量快捷键是轻微效率缺口，不阻断流程。
- **Sam（键盘/辅助技术用户）**：筛选框、按钮与继承项有名称，树下提供方向键及 Space/Enter 提示。长编码全文由 DOM 文本与 `title` 保留；本轮未验证屏幕阅读器实际播报，也未做完整键盘遍历。
- **Casey（移动用户）**：320px 页面没有根横向滚动，待选/已选分屏切换和 44px 树操作目标适合触控。长编码超出显示宽度时没有专门的触屏展开入口，见 P3。

## 证据与版本边界

长编码 Demo 更新后重新检查了当前源码：归档节点 `ARCHIVE-UNIT-2026-REGION-070` 当前显示省略，`textContent`、`title` 和 `data-lx-transfer-code` 均保留完整值，`textOverflow=ellipsis`、`whiteSpace=nowrap`，根节点仍为 1280/1280。桌面 E2E 源码已增加全文、title、宽度和省略样式断言；本 Assessment A 没有运行测试。

最新源码截图与数据：

- [当前桌面首屏，含 DEPT-03](/F:/work/linkx-admin/.impeccable/critique/transferpanel-final-2026-10-11/assessment-a/desktop-light-normal-current.png)
- [当前桌面长编码行](/F:/work/linkx-admin/.impeccable/critique/transferpanel-final-2026-10-11/assessment-a/desktop-long-code-current.png)
- [当前 DEPT-03 尺寸记录](/F:/work/linkx-admin/.impeccable/critique/transferpanel-final-2026-10-11/assessment-a/desktop-current-measurements.json)
- [当前长编码 DOM 记录](/F:/work/linkx-admin/.impeccable/critique/transferpanel-final-2026-10-11/assessment-a/long-code-current-measurements.json)

其余亮色/HUD、错误/空结果、320px 首屏、组件滚动和 Props 表截图是在长编码 fixture 更新前采集；它们证明对应 UI 状态和容器滚动，不作为长编码节点的当前源码证据。可查看 [桌面错误态](/F:/work/linkx-admin/.impeccable/critique/transferpanel-final-2026-10-11/assessment-a/desktop-hud-error.png)、[移动端空结果](/F:/work/linkx-admin/.impeccable/critique/transferpanel-final-2026-10-11/assessment-a/mobile-light-empty.png)、[移动端树滚动](/F:/work/linkx-admin/.impeccable/critique/transferpanel-final-2026-10-11/assessment-a/mobile-component-tree-scrolled.png)、[移动端 Props 表滚动](/F:/work/linkx-admin/.impeccable/critique/transferpanel-final-2026-10-11/assessment-a/mobile-props-table-scrolled.png)。该 fixture 只替换禁用归档节点的编码，树规模仍为 1,420，未改变 DEPT-03 与布局；之后已另行对当前源码重拍 DEPT-03 与长编码截图。

## 限制

这是隔离的 Assessment A，不包含 detector、Assessment B 或综合趋势结论。检查限于 Demo 和组件文档，不涉及真实后端权限保存、真实用户研究、屏幕阅读器播报或数值化色彩对比测量。浏览器检查和截图已经完成，所有本轮 Edge context 均已关闭。

待综合阶段关注：宿主保存状态如何在权限维护流程中体现；长编码是否需要触屏展开/复制；屏幕阅读器和色彩对比证据是否由 B 或后续专项审查补足。
