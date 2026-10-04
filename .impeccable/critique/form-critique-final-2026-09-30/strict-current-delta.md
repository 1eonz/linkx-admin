# Form strict-current delta — 2026-09-30

本补充记录对 final A/B 综合结果的时间新鲜度修正。它不替代综合报告，只标明当前工作树在 strict current A/B 中确认的剩余差异。

## 证据来源

- A（源码严格对照，07:53）：`.impeccable/critique/form-assessment-a-strict-current-2026-09-30.md`
- B（Playwright 严格复验，07:52）：`.impeccable/critique/form-assessment-b-strict-2026-09-30.md`
- B 原始静态、逐视图和截图：`.impeccable/critique/form-assessment-b-strict-2026-09-30-fresh-0738/`
- 早先 final A（05:24）和 final B 的对应路径仍保留在综合报告 Evidence Index；它们不能覆盖 strict current 对当前工作树的结果。

## final A 与 strict current 的差异

| 早先 final A 观察 | strict current 状态 | 结论 |
|---|---|---|
| LxForm/LxDynamicForm 缺少 aria-invalid、aria-describedby、aria-required | Strict current B 在两套表单中复现 aria-invalid、aria-describedby 关系；strict A 也能在源码中定位关联逻辑 | 旧观察已被当前证据修正；保留 ARIA 回归 |
| DynamicForm 提交后没有定位首错 | Strict current B 确认 DynamicForm 焦点落到“任务名称” | 已处理 |
| Demo 演示设置默认展开 | Strict current A 源码和 strict current B 页面均按折叠路径复验 | 已处理，防回归 |
| 长表提交后没有任何首错焦点 | Strict current B 只在 LxForm 复现焦点停留在“提交校验”按钮 | LxForm 仍是待修复差异；DynamicForm 已处理 |

## 当前剩余差异与建议

1. **LxForm 首错焦点统一**：让 LxForm 复用 DynamicForm 的滚动/聚焦策略，或提供可键盘操作的错误摘要。建议命令 `/impeccable harden`。证据：B strict 报告“LxForm focus remains submit button”。
2. **对比度问题**：
   - 亮色 LxDynamicForm 设置提示 3.2:1；HUD 设置提示 3.7:1。
   - Strict current B 新增确认：亮色 LxUpload 辅助文字和两条成功状态文字 3.2:1；HUD 上传字段标签 2.8:1，辅助文字 3.7:1；HUD 空态标题还有 gray-on-color 命中。
   - 这些命中位于可见产品文字，不能归入 187 个 `ai-color-palette` 误报。建议命令 `/impeccable colorize`，修复后在亮色、HUD、reduced-motion、桌面/移动五视图复验。
3. **上传约束文案**：`image/*`、10MB、单张 1 个/多张 5 个的约束没有完整面向使用者呈现。建议命令 `/impeccable clarify`，让 accept、maxSize、limit 生成一致提示。
4. **移动 toast 遮挡**：final A 记录 375/390px toast 覆盖文档固定导航；strict current B 没有将其作为新命中，保留为待复核项，不把它写成已解决。建议命令 `/impeccable adapt`。

## 误报边界

- 187 个 HUD `ai-color-palette` 命中主要是设计令牌、SVG 子路径、按钮和隐藏悬停标题，不按缺陷计数。
- `text-occlusion` 的“✦ ai color palette”是 detector 自己的 overlay 标记；代码块、VitePress 复制按钮、VPNavBarHamburger 的 clipped overflow 属于文档外壳/注入层。
- `em-dash-overuse`、`layout-transition`、`bounce-easing`、隐藏 Select popper 的边框/阴影命中不归入表单产品阻断项。

## 状态

正式 Critique 仍未关闭：ARIA 关联、DynamicForm 首错聚焦和 Demo 折叠已处理；LxForm 首错焦点、设置/上传文字对比度、上传约束文案仍待修复或设计复核。

