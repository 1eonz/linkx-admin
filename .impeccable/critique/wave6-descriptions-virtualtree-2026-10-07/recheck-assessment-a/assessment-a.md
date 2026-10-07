Method: isolated Assessment A (fresh Playwright pages; no detector, Assessment B, or prior-report inputs)

# Wave 6 修后独立设计评审

评审对象为当前 4175 文档站上的 `LxCascader`、`LxDescriptions`、`LxVirtualTree` 和 `LxSidebar`，以及各自 Demo、中文 API 文档和本轮修复后的源码。浏览器取证使用独立的新 Chromium page：桌面 `1440×900`，Cascader/Descriptions/VirtualTree 另测 `375×812`，Sidebar 另测 `375×780`。VirtualTree 键盘和混合勾选证据在本报告其他页面完成后又用当前热更新源码重新复核，记录于 `virtualtree-postfix.json`。

## 设计特异性结论

这批组件已经具有明确的 LinkX 管理后台语境。Cascader 使用公安组织路径和加载失败恢复，Descriptions 展示警号、组织、设备标识与运行状态，VirtualTree 以辖区和执勤单元承载虚拟窗口、级联勾选，Sidebar 则把警务业务导航、节点状态和 HUD 深色视觉结合起来。Sidebar 的视觉语言最有产品辨识度；三个数据组件主要依靠业务数据、状态文案和 lx-ui 令牌形成特异性，基础输入、详情行和树节点的形态仍可迁移到其他后台。

总体判断：业务特异性高，视觉特异性中高。当前修复让错误、焦点、键盘和窄屏边界更可靠，主要残余成本来自 Demo 控制面板的决策密度，以及 VirtualTree 对自定义节点插槽高度的隐式约束。

## Design Health Score

| # | 启发式 | 分数 | 关键观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 4 | Cascader 的加载/失败/禁用、Descriptions 的读取中/空/错误、VirtualTree 的宿主状态和 Sidebar 的激活/节点状态均有文字或结构反馈。 |
| 2 | 与真实世界匹配 | 4 | 组织路径、警号、设备标识、辖区节点和警务菜单让控件语义与实际任务一致。 |
| 3 | 用户控制与自由 | 4 | Cascader 可清空并用 Escape 收起，VirtualTree 支持方向键、过滤和公开方法，Sidebar 支持 rail/expanded、移动抽屉和 Escape 返回。 |
| 4 | 一致性与标准 | 3 | 四个组件共享令牌和焦点语言；Descriptions 的演示控制长期可见，另外三个 Demo 的高级控制默认折叠，演示层节奏不完全一致。 |
| 5 | 错误预防 | 3 | Cascader 在加载/失败时暂停选择，VirtualTree 跳过禁用节点，Descriptions 和 VirtualTree 的错误态保留重试；VirtualTree 自定义 slot 仍可能破坏固定行高。 |
| 6 | 识别而非记忆 | 4 | 组织字段有可见标签/路径，复制按钮带字段和值，树有“组织结构”名称，Sidebar 菜单和状态文案直接可读。 |
| 7 | 灵活性与效率 | 3 | 键盘树浏览、级联筛选、批量展开/收起和移动抽屉覆盖常见效率路径；深层组织仍需逐层浏览，未提供更高阶批量筛选。 |
| 8 | 美观与简约 | 3 | Sidebar 的 HUD 层级清晰，详情行和树窗口克制；展开 Demo 控制后按钮数量多，Descriptions 首屏控制区尤其显眼。 |
| 9 | 错误识别与恢复 | 4 | Cascader 错误文字通过 `aria-describedby` 关联实际输入框，错误焦点保持红色边线；Descriptions/VirtualTree 的 alert 均保留“重试”动作。 |
| 10 | 帮助与文档 | 3 | API、键盘、宿主职责和窄屏约束均有中文说明；复杂场景仍需要读完整状态与实例方法章节才能建立预期。 |
| **总分** |  | **35/40（Good）** | **当前基础稳固，优先压低演示控制密度并明确 VirtualTree slot 边界。** |

## Overall Impression

修后四个页面的主任务都能在首屏找到：Cascader 的组织路径、Descriptions 的详情值、VirtualTree 的组织树、Sidebar 的业务导航。桌面布局没有横向溢出，375px 复核中表单、树、详情和移动抽屉仍保持视口边界。最有说服力的修复是焦点与错误语义：Cascader 聚焦失败态现在是红色内侧边线，输入框带 `aria-invalid` 和错误 ID；VirtualTree 也完成了 roving tabindex、方向键进入子项和混合勾选语义。

页面的主要机会不是再加装饰，而是把 Demo 的实验控制与核心任务拉开层级，同时把 VirtualTree 的固定行高契约变成组件可验证的约束，避免宿主插槽内容在真实长文案下遮挡行内容。

## What’s Working

- **异步状态形成闭环。** Cascader 的加载、加载与失败并发、失败重试和禁用状态在页面上可以区分；Descriptions 的读取中、空结果和错误都保留了宿主可组合的状态结构；VirtualTree 明确把加载/错误交给宿主，避免组件假造请求。
- **键盘和焦点路径具有可观察反馈。** Cascader 错误输入框的 `aria-describedby` 指向当前错误文案，VirtualTree 的 `ArrowLeft → ArrowRight → ArrowRight` 会把焦点送到 `unit-1-1`，Sidebar rail 浮层获得焦点后按 Escape 回到分组标题，移动抽屉关闭后回到打开按钮。
- **响应式边界处理扎实。** 375px 下 Cascader 输入框和状态按钮为 44px，Descriptions 根节点宽度为 327px/301px 且页面宽度保持 375px，VirtualTree 展开按钮和复选框为 24px、树宽度为 327px，Sidebar 移动抽屉限制在页面宽度内。
- **状态含义不只靠颜色。** Descriptions 的在线状态包含文字，Sidebar 的节点状态有 `NODE-01` 与“专网”文案，VirtualTree 的选中和节点类型有“已选/单位”文字，Cascader 错误包含可读文案和重试按钮。

## Priority Issues

### [P2] 展开 Demo 后控制选项仍然过密

**影响：** Descriptions 的首屏持续显示单列/双列、边框、HUD 和四种数据状态，共 8 个可操作项；Cascader 展开后有 5 个状态按钮和 2 个开关；VirtualTree 展开后有 4 个状态按钮、7 个操作按钮和 2 个开关。它们是文档演示而不是生产界面，但用户需要在同一视觉区同时理解布局、数据状态、主题和实例方法，增加了首次阅读的判断成本。

**修复方向：** 保留最常用的一组状态作为默认可见，其余放入命名清楚的“更多状态/更多操作”折叠区；Descriptions 至少把主题和数据状态移出主布局控制行，并让当前示例的主内容在视口中先于实验按钮建立层级。

**建议命令：** `/impeccable distill`

### [P2] VirtualTree 的自定义 node 插槽仍可能突破固定行高

**影响：** 组件用固定 `itemSize` 计算窗口，Demo 文档要求插槽保持单行；但组件没有限制 slot 内容的高度或溢出。宿主插入较长状态徽章、两行标签或可换行内容时，视觉上可能覆盖相邻行，且滚动位置仍按固定行高计算，用户会看到内容和焦点位置不一致。

**修复方向：** 在组件边界提供明确的单行裁剪/溢出保护，或增加可测量的 slot 模式；同时把“插槽内容必须单行”提升为醒目的 API 约束并给出不会破坏布局的示例。保留当前 32px 虚拟窗口性能路径。

**建议命令：** `/impeccable harden`

### [P3] Cascader 加载态仍允许触发器获得焦点和打开面板

**影响：** 当前运行证据显示 `loading` 时输入框没有原生 `disabled` 属性，但面板选项会被暂停，用户仍可打开控件查看加载文案。这个行为可以支持查看状态，却容易让用户把“可聚焦/可打开”误认为“可选择”，尤其在慢连接下。

**修复方向：** 保留可打开的设计时，应在触发器附近明确“正在加载，暂不可选择”的状态并保持忙碌语义；若业务更需要阻止进入，则让 loading 触发器也采用禁用视觉。文档应明确选择这两种交互中的哪一种。

**建议命令：** `/impeccable clarify`

## Cognitive Load Assessment

主选择流程本身是低负荷的：Cascader 按路径逐层选择，VirtualTree 只让树项成为 Tab 停靠点，Descriptions 的详情值按标签/值对齐，Sidebar 把 expanded 与 rail 作为两种形态。认知负荷的失败项集中在 Demo 控制区，而非组件主路径。

| 检查项 | 结果 | 取证 |
|---|---|---|
| 单一焦点 | 通过 | 各页先显示核心控件；Cascader 和 VirtualTree 高级操作默认收起。 |
| 信息分块 | 未通过 | Descriptions 控制区将布局、主题、边框和 4 种数据状态放在同一首屏。 |
| 分组 | 通过 | 状态按钮和开关均使用有名称的 `role=group` 或相邻标签。 |
| 视觉层级 | 通过 | 详情行、树窗口、输入框和导航主体都先于实验状态呈现。 |
| 一次一项 | 通过 | Cascader 分层选择，VirtualTree 以一个树项为键盘决策单位。 |
| 最少选择 | 未通过 | 展开 Cascader/VirtualTree 的 Demo 操作区后同时出现 7 至 13 个选择或动作。 |
| 工作记忆 | 通过 | 当前路径、已选数量、当前形态和操作状态均在控件附近回显。 |
| 渐进披露 | 通过 | Cascader 与 VirtualTree 的高级面板折叠；Sidebar rail 子菜单按需浮出。 |

失败 2/8，属于中低负荷；把 Descriptions 也采用默认折叠或分组后可以进一步降到低负荷。

## Emotional Journey

进入页面时，警务组织、详情字段和业务菜单使任务可信；第一次操作会得到明确的当前值、路径或选中数量。遇到失败时，Cascader 的红色聚焦边线和 assertive alert、Descriptions/VirtualTree 的“重试”按钮把情绪从不确定拉回可恢复状态。Sidebar 的 rail 浮层和移动抽屉在关闭后归还焦点，减少了“迷路”感。结束时，当前值、最近选中项、详情状态和导航激活项都保留在上下文中，峰值体验来自确定性而非装饰。Demo 选项过多会在首次进入时制造短暂的“我要先配置什么”的低谷。

## Persona Red Flags

- **Alex（熟练后台用户）**：方向键、过滤、公开 `expandAll`/`scrollToKey`、rail 子菜单和移动抽屉快捷关闭都可用；主要成本是 VirtualTree 需要先聚焦树项再按方向键，且大量 Demo 操作需要展开控制区才能探索。生产组件本身没有阻断问题。
- **Sam（键盘/读屏用户）**：Cascader 的组织路径输入框带可见标签关联，错误 ID 会出现在 `aria-describedby`；VirtualTree 树名为“组织结构”，父节点混合状态暴露为 `aria-checked="mixed"`；Sidebar mobile dialog 进入和退出焦点可预测。残余风险是自定义 VirtualTree slot 若插入过长内容，视觉遮挡会影响低视力用户的行级扫描。
- **Casey（窄屏/中断用户）**：375px 下四个页面均无横向溢出；Cascader 控件与状态按钮 44px，Sidebar 抽屉关闭后焦点回到“打开移动端导航”，VirtualTree 24px 重复目标可点按。Descriptions 详情仍有较长文本，虽然会换行，但阅读高度明显增加，用户中断返回时需要重新扫描较长面板。

## Minor Observations

- Cascader 当前错误态实际输入框为 `aria-invalid="true"`，`aria-describedby="cascader-demo-path-error"`，聚焦边线计算为红色 `1px inset`；英文开关显示 `Failed to load organization data / Retry`。
- Descriptions 桌面首个详情面板的行高为 32/33px，复制字段带“复制警号：005882”等可访问名称；375px 下两个详情面板宽度为 327px 和 301px，未产生页面横向滚动。
- VirtualTree 当前 postfix 复核中，父节点 `region-1` 为 mixed，原生复选框 `indeterminate=true`；过滤清除按钮 24px，树窗口与页面保持 375px 宽度。
- Sidebar 在 `prefers-reduced-motion: reduce` 下品牌环动画为 `none`；rail 浮层子项和 mobile close button 都有可见焦点轮廓。
- 本次没有把 4175 服务停掉，因为它由父 Agent 负责的共享预览进程提供；没有启动新的服务或修改产品源码。

## Questions to Consider

- Descriptions 的控制区是否应像 Cascader/VirtualTree 一样默认折叠，让详情内容成为第一视觉锚点？
- VirtualTree 是否要由组件强制 slot 单行裁剪，还是提供一个可测量的 variable-height 变体？
- Cascader 的 loading 交互到底是“可打开查看但不可选择”，还是“完全禁用触发器”？文案和视觉应把这个选择说清楚。
- Sidebar 的 HUD 主题和详情数据的常规表面是否需要一个更明确的主题切换说明，以免演示用户误以为全局主题已经改变？
