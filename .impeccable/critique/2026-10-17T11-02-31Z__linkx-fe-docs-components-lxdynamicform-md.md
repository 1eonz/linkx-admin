---
target: LxDynamicForm 文档
total_score: 28
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 0
target_identity: "file:F:\\work\\linkx-admin\\linkx-fe\\docs\\components\\lxdynamicform.md"
target_fingerprint: "sha256:27e0d4ab78189b51b77870a456ceef83b8ccebed2ff953caac6802186d29df06"
target_path: "F:\\work\\linkx-admin\\linkx-fe\\docs\\components\\lxdynamicform.md"
timestamp: 2026-10-17T11-02-31Z
slug: linkx-fe-docs-components-lxdynamicform-md
---
Method: dual-agent (A: gpt-6.1-sol · B: gpt-6.1-sol)

# LxDynamicForm / LxForm 综合设计审查

## 设计健康评分

| # | 启发式 | 分数 | 关键观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3 | 上传、远程候选、校验和禁用状态可见；LxForm 的提交反馈仍可更靠近操作区。 |
| 2 | 系统与现实世界匹配 | 3 | 中文任务字段和 LinkX 业务语义明确，API 术语对首次使用者偏技术化。 |
| 3 | 用户控制与自由 | 3 | 重置、取消、清除和重试齐全；长文档中操作上下文容易丢失。 |
| 4 | 一致性与标准 | 3 | 上置标签、32px 控件、错误令牌和主题切换基本一致。 |
| 5 | 错误预防 | 3 | required、日期范围、上传限制和首错聚焦有效。 |
| 6 | 识别而非回忆 | 3 | 字段标签和分组清楚，schema 类型仍需理解后才能使用。 |
| 7 | 灵活高效使用 | 2 | 受控值、跨列和 Enter 路径可用，但缺少表单级快捷操作提示。 |
| 8 | 审美与极简 | 2 | 组件克制，文档 Demo、代码和 API 连续堆叠，核心任务被稀释。 |
| 9 | 错误诊断与恢复 | 3 | 两页均能聚焦首错并建立 `aria-describedby`，字段错误可见。 |
| 10 | 帮助与文档 | 3 | 中文 API 和边界说明完整，缺少按任务组织的短路径示例。 |
| **总计** |  | **28/40（Good）** | 组件交互可靠，文档信息密度仍是主要成本。 |

## 设计特异性与证据

该表单系统有 LinkX 管理后台的任务字段、主色、错误令牌、上置标签和控件尺寸，不是可直接替换的 Element Plus 示例。Assessment A 使用独立浏览器截图和源码/设计稿评审；Assessment B 独立核对 detector JSON、stderr、退出码和 Light/HUD 浏览器证据，未读取 A 的结论。

- DynamicForm、LxForm 文档 detector 均为合法 JSON `[]`，stderr 为空，退出码 `0`。这只代表静态规则零命中。
- DynamicForm Light/HUD、LxForm Light/dark 浏览器证据成功；details 默认收起，Enter/Space 可展开且焦点保留在 summary。
- 375px 清洁页面两页 `document/body.scrollWidth` 均为 375；代码块内部滚动属于预期阅读行为。LxForm overlay 的 6 条命中均归因于 VitePress 壳层、代码复制按钮、隐藏 popper 或过渡壳层。
- 证据目录：`.impeccable/critique/dynamicform-form-assessment-a-2026-10-17/`、`.impeccable/critique/dynamicform-form-assessment-b-2026-10-17/`。

## 做得好的地方

1. DynamicForm 和 LxForm 的错误恢复路径可观察：首错聚焦、中文错误、`aria-invalid` 和稳定 `aria-describedby` 均有浏览器证据。
2. 字段 renderer、受控值、上传/远程候选、自适应列和主题状态形成清晰的组件边界。
3. 原生 `details`、44px summary 和减少动效规则改善了 API 渐进披露与键盘可达性。

## 优先问题

### [P2] 文档首屏仍把任务路径埋在技术说明中

完整 API、迁移说明和 Demo 连续出现时，用户需要在多个区块间滚动和记忆；建议保留当前折叠结构，再增加“填写 → 提交 → 修正/重置”的短任务路径。

### [P2] HUD 文档层级仍偏密

深色代码块、表格、侧栏和正文在窄屏连续出现。建议为 HUD 文档摘要和表格使用更明确的层级令牌，并继续保留长代码的局部滚动。

### [P3] 键盘效率提示不足

控件支持 Tab/Enter，但 Demo 没有明确提示提交、重置和跳到首个错误的效率路径。可增加不依赖 hover 的中文提示，并在减少动效下保持焦点可见。

## Persona 红旗

- **Alex（高频后台用户）**：能够键盘完成表单，但需要逐项 Tab；没有可见的提交/重置快捷路径提示。
- **Jordan（首次使用者）**：字段标签和首错焦点友好，但 schema、受控值等 API 术语在首个任务路径中解释不足。
- **Sam（键盘/读屏用户）**：错误关联可靠；后续应继续保持 details summary 的焦点和字段错误节点的可访问树存在。

## 次要观察与后续

- 375px 页面级横溢出和字段级错误可见性已由最新 B 重跑关闭，不再作为开放缺陷。
- 不增加 UI-10 关闭数；正式整库 UI-11 仍需在所有组件门禁完成后执行。
- 下一次文档优化优先处理 P2 信息密度，再补 P3 键盘提示；真实后端上传联调、宿主迁移和权限需求保持原计划顺序。

Questions skipped: 本次为已有 A/B 结果的归档更新，未新增需要用户选择的设计方向。
