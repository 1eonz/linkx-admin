# Wave 5 Assessment A：TreeSelect、Cascader 与 SelectPagination

Assessment A（仅设计评审；独立于 detector 与其他 Assessment）

## 范围与证据

检查了 `http://127.0.0.1:4177/components/lxtreeselect`、`/components/lxcascader`、`/components/lxselectpagination`。每个页面使用新建的 Chrome 页面，覆盖 1440×960 桌面和 375×812 移动视口，以及亮色、HUD、下拉打开和主要错误/空态。TreeSelect 覆盖单选弹层、HUD 和失败重试；Cascader 覆盖路径弹层、HUD、失败和多选；SelectPagination 覆盖候选项、HUD、搜索失败和空结果。

六个页面均返回 HTTP 200；浏览器测量中，桌面与 375px 页面都没有横向溢出，打开的三个弹层均完全处于视口内。共保存 40 张 PNG 和布局/颜色测量：[browser-evidence.json](browser-evidence.json)。Cascader Demo 没有 HUD 开关，其 HUD 状态通过根节点主题类检查；SelectPagination 使用 Demo 自带的“HUD 深色主题”复选框。

冻结范围包含三个组件的实现、类型、Demo、三份文档页、文档主题配置和主题令牌；文件 SHA-256 列在 [source-sha256.txt](source-sha256.txt)。哈希在最终浏览器采集后计算；测试文件未纳入 UI 源冻结。

本评审没有读取或运行 detector，也没有读取其他 Assessment 结果。键盘行为有文档说明，但本轮没有执行屏幕阅读器或完整键盘路径测试。

## 设计特异性

整体为中等偏上：组织路径、公安单位、警号和 `targetMap` 回显问题把数据与交互锚定在 LinkX 的业务场景；SelectPagination 还有专属设计标本。控件外形与文档页结构仍主要沿用通用 Element Plus / VitePress 模式，品牌个性更多来自数据而非视觉语言。三页用词和状态控制也没有形成一致的主题预览方式。

## Design Health Score

| # | 启发式 | 分数 | 主要观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3/4 | 加载、失败、重试和当前值可见；Cascader 的失败状态下方仍显示旧的“已回显组织路径”。 |
| 2 | 系统与现实匹配 | 3/4 | 组织路径、警员、警号符合业务语境；`emitPath`、`targetMap` 等 API 术语需要开发经验。 |
| 3 | 用户控制与自由 | 4/4 | 有清空、取消、重试和 Escape 退出；TreeSelect 多选保留确认边界。 |
| 4 | 一致性与标准 | 2/4 | 三个 Demo 的 HUD 入口和实际主题效果不一致，SelectPagination 的深浅色读写不匹配。 |
| 5 | 错误预防 | 3/4 | 禁用节点、禁用控件和受控值演示能减少误选；树形确认也避免未提交草稿误写。 |
| 6 | 识别而非记忆 | 3/4 | 字段有可见标签且结果值有回显；375px Cascader 的单位名称被省略号截断。 |
| 7 | 灵活与效率 | 3/4 | 支持搜索、分页、批量选择并记录键盘操作；高效浏览组件仍依赖较长侧栏。 |
| 8 | 美学与简约 | 3/4 | 默认态克制、分组清晰；SelectPagination HUD 下文字和表面层级破坏了阅读顺序。 |
| 9 | 错误识别与恢复 | 3/4 | 错误文案靠近控件并给出重试；Cascader 的独立状态行没有同步失败状态。 |
| 10 | 帮助与文档 | 2/4 | API 与示例较充分，但没有解释三个相近选择器分别适合什么任务。 |
| **总分** |  | **29/40（72.5%，Good）** | **基础可靠，优先修复 HUD 对比度和窄屏标签可读性。** |

## 总体印象

表单演示能快速展示受控值、组织路径和远程候选项的实际状态，默认亮色也保持了明确的字段层级。最大的断点出现在主题切换：SelectPagination 把文档页切暗后，Demo 文字仍使用亮色令牌；Cascader 则没有可见的 HUD 控件。375px 下 Cascader 三列虽未越界，但长节点名被截断，降低了选择信心。

## 认知负荷

评估失败 3/8 项，属中等认知负荷：

- **分组容量**：桌面侧栏“数据展示”下有 18 个同级链接，超过每组 4 项的建议值。
- **选择数量**：浏览该类组件时仍需从 18 个同级入口中辨认目标；顶部搜索能缓解，但不会减轻侧栏默认暴露的选项量。
- **视觉层级**：SelectPagination 的 HUD 状态中，标题/辅助文字与背景接近同一明暗层次，弹层白底却使用浅色文字，无法稳定识别主次。

在具体选择器中，每列 Cascader 最多 3 个节点、SelectPagination 每页 4 个候选项；TreeSelect 的节点也按层级展开，主要决策点大致控制在 4 项以内。Demo 设置和源码都使用折叠区，默认页没有把全部控制项同时铺开。

## 情绪旅程

页面标题与一段用途说明让开发者很快进入预览；成功路径的当前值回显是正向峰值，错误态的重试入口也提供恢复感。最大情绪低谷是打开 SelectPagination 的 HUD 后，页内文本与弹层文字突然难以辨认。移动端 Cascader 名称截断会削弱“我选对了”的信心。读到 API 表格时信息完整，但缺少先行的选型说明，开发者仍需自行比较三种组件。

## 做得好的地方

- 三个 Demo 都有可见字段标签和即时值回显，数据结构与用户看到的标签可以对照。
- 错误、空结果、禁用、加载或多选都能在本地演示；TreeSelect 的取消/Escape 和 Cascader 的重试反馈使恢复路径清楚。
- 375px 下三个页面都没有横向溢出；弹层留在屏幕内，TreeSelect、Cascader 的触控行和重试入口也扩大到适合触摸的高度。

## 优先问题

1. **[P1] HUD 主题预览的令牌不一致**：SelectPagination 的复选框只给根节点加 `.dark`，没有应用 `.lx-theme-hud`。测量到页面背景是 `rgb(27, 27, 31)`，Demo 标题仍是 `rgb(29, 33, 41)`，辅助文字是 `rgb(107, 114, 128)`，Demo 背景透明；弹层则是白底配 `rgb(223, 223, 214)` 浅色文字。该状态下主标题、统计和弹层选项都难以阅读。TreeSelect 的开关会同时应用 `.dark` 与 `.lx-theme-hud`；Cascader 没有开关。**修复**：统一三个 Demo 的 HUD 主题入口和令牌作用范围，并让弹层门户继承相同的主题变量。**建议命令**：`/impeccable colorize`。

2. **[P2] 375px Cascader 节点名被列宽截断**：当前弹层宽 359px，每列约 120px，`杭州市公安局`、`西湖区分局`只显示为省略文本。真实组织树节点可能共享前缀，用户难以辨认。**修复**：移动端一次突出一个层级，或为当前列提供可读全名；保留完整路径作为上下文。**建议命令**：`/impeccable adapt`。

3. **[P2] 文档侧栏同级入口过多**：“数据展示”组有 18 个同级组件链接，用户需要在长列表里逐个扫描才能找到目标。**修复**：将组件按表格、状态、工具等子类继续分组，并保留搜索入口。**建议命令**：`/impeccable distill`。

4. **[P2] 缺少选择器选型说明**：TreeSelect、Cascader、SelectPagination 都以单句介绍和 Demo 开始，但没有说明各自适用边界；初次接入者需要从 API 表反推差异。**修复**：在各页加入简短的“适用场景 / 不适用场景”，明确树形组织选择、路径级联、远程大数据分页的区别。**建议命令**：`/impeccable clarify`。

## Persona 风险

- **Jordan（首次接触者）**：无法从页面快速判断组织树、多级路径和远程分页选择分别该在什么场景使用；看到 `targetMap`、`emitPath` 后需要额外理解 API 才能选型。
- **Casey（移动用户）**：375px Cascader 弹层不越界，但单位名被截断，容易把当前列中相似组织选错。
- **Sam（依赖辅助技术的用户）**：TreeSelect 和 Cascader 文档列有键盘路径且可见标签完整；但 SelectPagination HUD 的低对比文字对低视力用户构成直接障碍。本轮没有验证读屏播报，不将其记为通过。

## 次要观察

- Cascader 点击“失败”后，弹层显示错误与重试，但下方状态文案仍为“已回显组织路径”，形成旧成功状态与当前错误状态不一致。
- TreeSelect 和 Cascader 的当前值回显使用原始 ID/路径值，适合开发者核对契约；若目标是让首次访问者理解预览结果，可同时展示可读标签。
- 页面有完整 API 示例，但缺少 FAQ；API 表格较长，首次阅读需要在预览与规格区之间滚动。

## 可继续讨论的问题

- HUD 预览应该只影响 Demo，还是应该继续切换整页；三个 Demo 是否共用同一主题开关和主题令牌？
- 375px Cascader 的优先级是保留三列并接受省略，还是改为逐层浏览以显示完整单位名？
- 是否为这三种选择器提供一张选型对照，让开发者先选“树 / 路径 / 远程大列表”，再读各自的 API？

## 截图索引

- TreeSelect 亮色桌面弹层：[tree-select-desktop-light-open.png](tree-select-desktop-light-open.png)
- TreeSelect HUD 移动失败态：[tree-select-mobile-375-hud-error.png](tree-select-mobile-375-hud-error.png)
- Cascader 375px 亮色弹层：[cascader-mobile-375-light-open.png](cascader-mobile-375-light-open.png)
- Cascader 375px HUD 失败态：[cascader-mobile-375-hud-error-open.png](cascader-mobile-375-hud-error-open.png)
- SelectPagination 亮色桌面弹层：[select-pagination-desktop-light-open.png](select-pagination-desktop-light-open.png)
- SelectPagination HUD 桌面弹层：[select-pagination-desktop-hud-open.png](select-pagination-desktop-hud-open.png)
- SelectPagination HUD 375px 弹层：[select-pagination-mobile-375-hud-open.png](select-pagination-mobile-375-hud-open.png)

所有 40 张截图、每个视口的滚动宽度/弹层边界和 HUD 颜色测量都在本目录；自动采集脚本为 [capture-assessment-a.mjs](capture-assessment-a.mjs)。
