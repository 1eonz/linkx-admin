---
target: Element Bridge 多选焦点外圈
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:F:\\work\\linkx-admin\\linkx-fe\\docs\\components\\element-bridge.md"
target_fingerprint: "sha256:940478bec48eca76bbbd9c2b3fa410ca2a38324769d7413e607ef19af64d8126"
target_path: "F:\\work\\linkx-admin\\linkx-fe\\docs\\components\\element-bridge.md"
timestamp: 2026-09-28T11-54-41Z
slug: linkx-fe-docs-components-element-bridge-md
---
Method: dual-agent (A: /root/multiselect_final_design · B: /root/multiselect_final_detector)

# Element Bridge 多选焦点外圈评审

## 设计健康评分

| # | 启发式 | 评分 | 关键观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3/4 | 焦点、展开态、已选标签与真实单选校验错误可见。 |
| 2 | 贴近真实世界 | 4/4 | “责任部门”“协同部门”“通知渠道”等字段清楚。 |
| 3 | 用户控制与自由 | 3/4 | 标签可清除、下拉可退出，并有表单重置。 |
| 4 | 一致性与标准 | 2/4 | 下拉仅切换自身 1px 边线，输入和日期控件还有外侧焦点光晕。 |
| 5 | 错误预防 | 3/4 | 必填标记、受限选项和表单校验能阻止常见漏填。 |
| 6 | 识别而非回忆 | 3/4 | 字段名和标签清晰；折叠选择以“+1”表示隐藏值。 |
| 7 | 灵活与高效 | 3/4 | 多选可键盘展开和选择；完整键盘流程未在本轮验证。 |
| 8 | 美观与简约 | 3/4 | 主表单清晰；控件展示 Demo 信息较密但符合验收用途。 |
| 9 | 错误识别与恢复 | 3/4 | 真实责任部门错误提示具体，用户可继续选择修复。 |
| 10 | 帮助与文档 | 3/4 | 有接入说明与示例；焦点状态提示位于 Demo 后方。 |
| **合计** |  | **30/40（Good）** | 当前双圈错位已解决，剩余问题集中在焦点一致性和状态覆盖。 |

## 设计特异性判断

页面具有 LinkX 的业务字段、主色和 HUD 主题，并保留 Element Plus 的选择交互；外部 VitePress 文档壳层较常见，但不妨碍开发者验收。

**本次目标判断：** 多选的焦点态现在只改变控件自身 1px 边线颜色，不绘制外扩阴影或 outline。独立检查覆盖桌面/移动与浅色/HUD，边线贴合控件边缘，焦点前后尺寸不变。单边线方案解决了用户指出的错位/双圈观感。它比同表单输入框、日期控件的焦点表现轻；若反馈针对线条太细，后续可试验边界内 2px 单边线。

## 浏览器与 detector 证据

- Assessment B 对 `linkx-fe/docs/components/element-bridge.md` 运行静态 detector：stdout `[]`，stderr 为空，退出码 `0`。这仅表示静态规则没有命中。
- 新浏览器页面成功注入 Impeccable detector overlay。五个视图的 overlay 命中数：桌面浅色正常 5、桌面 HUD 正常 173、桌面浅色错误视觉模拟 6、390px 浅色正常 5、390px HUD 错误视觉模拟 173。
- 高 HUD 计数主要是主题调色板规则；其他标记位于 VitePress 文档容器、tabs 指示条和代码复制按钮。没有 overlay 标记多选 wrapper。
- 多选的五种状态都测得 `border-box`、1px 实线、4px 圆角、`box-shadow: none`、`outline-style: none`，且焦点前后尺寸稳定。Assessment B 桌面为 `287×32px`、移动为 `316×32px`；Assessment A 的实时检查桌面为 `279.5×32px`、移动为 `301×32px`。视口布局略有差别，均无尺寸跳动。
- “协同部门”未配置业务校验规则。错误截图通过临时添加 `.is-error` 做视觉模拟，不是真实校验；其 detector 低对比度命中针对临时提示文字，不能代表真实多选错误文案。
- 证据：A 报告 `.impeccable/critique/.element-bridge-assessment-a-user-feedback-final.md` 及 `evidence-2026-09-28-assessment-a-user-feedback-final/`；B 报告 `.impeccable/critique/.element-bridge-assessment-b-user-feedback-final.md` 及 `evidence-2026-09-28/element-bridge-assessment-b-final/`。

## 整体印象

下拉控件边缘现在干净、贴合且尺寸稳定；页面保持两种主题和窄屏可读。当前修正针对的是错位/双圈，而不是增加焦点线厚度。跨控件焦点重量和多选错误态示例仍需单独决定。

## 做得好的地方

1. 浅色与 HUD 深色的多选边线都贴合组件自身，未观察到第二圈或焦点尺寸变化。
2. “指挥中心 +1”、标签清除按钮和展开菜单勾选状态保持清楚，选择行为未受样式调整影响。
3. 移动布局保持单列，控件未横向溢出；桌面/HUD 和错误视觉态均有独立截图。

## 优先问题

### [P2] 同一表单的焦点视觉重量不一致

下拉只切换自身 1px 边线，输入与日期控件还显示 2px 外侧光晕。外圈错位已解决，但字段间焦点强调仍有差别。建议后续选定统一策略；若不为下拉恢复外圈，可评估所有控件都使用边界内的单线强调。建议命令：`/impeccable polish`。

### [P2] 1px 下拉边线在相邻控件旁可能偏轻

单边线清楚且没有几何问题，但截图缩放或低清屏上可能显得细。若这正是当前反馈，应先试验边界内 2px 单一边线并回归内容起点和尺寸，避免恢复分离的外圈。建议命令：`/impeccable polish`。

### [P2] Demo 无法真实触发多选错误态

当前校验只覆盖必填任务名称与单选责任部门，协同部门没有错误态。不要只为展示而改写业务必填语义；如需要组件状态样例，可增加清楚标为展示态的独立演示或说明此状态不适用。建议命令：`/impeccable harden`。

### [P3] 焦点操作提示在 Demo 之后

焦点说明位于示例面板下方，初次访问者不一定会发现需要键盘或点击才能看到焦点状态。可将一句简短提示移到控件示例附近。建议命令：`/impeccable clarify`。

## Persona 红旗

- **Sam（键盘/辅助技术用户）**：焦点颜色可见，但下拉与输入/日期的视觉重量不同；本次未验证完整 Tab 流或读屏对“+1”的朗读。
- **Alex（熟练后台用户）**：多选已选值可见并能清除，展开菜单保留勾选；没有发现阻断选择的问题。
- **Jordan（初次使用者）**：“+1”说明还有一个值，但不直接显示名称；需要展开菜单确认完整选择。

## 次要观察与范围

- 多选错误截图为 `.is-error` 临时样式模拟，不代表宿主表单真实校验行为。
- 本次组件级复评不代表 Vue3 业务表单迁移完成，也不关闭 UI-11 整库 Impeccable 审查。
- 静态 `[]`、overlay 节点数量和浏览器截图是不同证据；overlay 命中已经逐项核对，没有将 HUD 规则计数直接当作缺陷数。
