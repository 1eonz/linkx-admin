---
target: Element Bridge select focus edge
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:F:\\work\\linkx-admin\\linkx-fe\\docs\\components\\element-bridge.md"
target_fingerprint: "sha256:4714a7f87ee9712134bd78be4f8c6d1c85dc3e4bbac368671a54f70ca66a1c91"
target_path: "F:\\work\\linkx-admin\\linkx-fe\\docs\\components\\element-bridge.md"
timestamp: 2026-09-28T10-30-19Z
slug: linkx-fe-docs-components-element-bridge-md
---
Method: dual-agent (A: /root/select_final_assessment_a · B: /root/select_final_assessment_b)

# Element Bridge 多选控件焦点外圈 Critique

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | 普通/错误焦点和选中标签可见；异步状态不属于此 Demo。 |
| 2 | Match System / Real World | 3/4 | 中文业务字段易懂；HUD 是开发者主题名。 |
| 3 | User Control and Freedom | 3/4 | Escape 可关闭，标签可移除，表单可重置。 |
| 4 | Consistency and Standards | 3/4 | 单选/多选和浅色/HUD 使用相同单边框状态模型。 |
| 5 | Error Prevention | 3/4 | 单选必填规则有效；多选 Demo 未配置校验。 |
| 6 | Recognition Rather Than Recall | 3/4 | 375px 弹层上翻会盖住“协同部门”字段标签。 |
| 7 | Flexibility and Efficiency | 2/4 | Escape 已验证；方向键和快速筛选未覆盖。 |
| 8 | Aesthetic and Minimalist Design | 3/4 | 焦点边缘简洁稳定；弹层位置和选项密度仍可改善。 |
| 9 | Error Recovery | 3/4 | 单选错误信息具体；浅色错误文字对比度略低。 |
| 10 | Help and Documentation | 3/4 | 接入边界清楚；键盘和窄屏行为说明有限。 |
| **Total** | | **29/40** | **Good；焦点外圈通过，剩余问题见下。** |

## Design Specificity Verdict

**LLM assessment:** 中文业务字段、LinkX 主色、HUD 主题和 Element Plus 桥接语境使页面具有 LinkX 组件文档特征；作为开发者验收页，状态可比性比额外装饰更重要。单选和多选焦点只改变自身 1px 边框，解决了用户指出的双层外圈观感。

**Deterministic scan:** `detect.mjs --json linkx-fe/docs/components/element-bridge.md` 输出 `[]`，stderr 为空，退出码 0，表示目标 Markdown 的静态规则零命中。

**Visual overlays:** 注入成功，四个独立视图的 headline 计数分别为桌面浅色 7、桌面 HUD 175、375px 浅色错误 7、375px HUD 错误 173。HUD 的大量规则命中主要针对其预期 cyan/violet 调色板；其他大部分命中归属于 VitePress 导航、代码复制图标、页签过渡和中文文档段落。真实相关命中是两个浅色错误提示文字，对比度约 4.4:1。Overlay 仅保存在截图证据中，没有显示在用户的可见浏览器标签页。

## Overall Impression

单选和多选现在以一条贴合控件边缘的 1px 边框表现焦点，普通态显示主色，错误态优先显示错误色；没有额外 halo、box-shadow、outline 或尺寸变化。375px 下弹层遮住字段标签，是最明显的剩余交互问题。

## What's Working

- 单选、多选、浅色/HUD、普通/错误焦点均只有一条 1px 边框；桌面和 375px 控件高度均为 32px。
- 键盘聚焦和 Escape 关闭经过浏览器验证；焦点不改变控件尺寸或标签折叠行为。
- 评审 overlay 没有命中 select wrapper 的外圈样式；复核后的真实规则命中已按组件、文档壳层和误报区分。

## Priority Issues

### [P2] 375px 弹层盖住当前字段标签

弹层向上打开时覆盖“协同部门”标签约 51×17px，用户需要暂时记住弹层所属字段。调整窄屏定位或在弹层内保留字段名。建议 `/impeccable adapt`。

### [P2] 浅色错误提示略低于文本对比度基线

`#c45656` 在白色背景上的实测对比度约 4.4:1，略低于 4.5:1。加深错误文案色并复核 HUD；控件错误边框维持现有错误色。建议 `/impeccable colorize`。

### [P3] 下拉选项行高为 34px

三条选项均比设计参考的 32px 高 2px。收紧上下 padding/line-height 后检查 hover、选中和禁用态。建议 `/impeccable polish`。

## Persona Red Flags

- **Alex（管理员/开发者）:** Escape 关闭已验证，方向键切换和快速筛选尚未验证；单边框状态便于扫描且没有多余轮廓。
- **Sam（键盘与辅助技术用户）:** 测试的四类边框状态清楚可见；浅色错误文字约 4.4:1。未运行真实屏幕阅读器，错误播报未验证。

## Minor Observations

- “协同部门”没有业务校验规则；其错误态是在独立浏览器页临时添加 `is-error`，仅用于检查 CSS 分支。
- 移动端上翻遮挡的是当前字段名；页面没有横向溢出。
- Assessment A 截图在 `.impeccable/critique/evidence-2026-09-28/assessment-a-single-border-final/`；Assessment B 的 20 张普通/错误、单选/多选、主题和视口截图在 `.impeccable/critique/evidence-2026-09-28/assessment-b-single-border-final-verified/`。

## Questions to Consider

- 375px 弹层必须上翻时，是否应在弹层中重复字段名以保留上下文？
