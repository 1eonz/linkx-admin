# LxMetricCard Impeccable 当前版复核

## 评审范围

- 组件：`linkx-fe/src/components/LxMetricCard/index.vue`
- Demo：`linkx-fe/src/components/LxMetricCard/demo/basic.vue`
- 文档：`linkx-fe/docs/components/lxmetriccard.md`
- 文档壳层：`linkx-fe/docs/.vitepress/theme/custom.css`
- 设计源：`design/指标卡 MetricCard/`
- 评审日期：2026-10-19

## Assessment A：独立设计评审

设计特异性为中高（7/10）。设备在线率、响应时长、高危警情和策略同步等公共安全运营语境，与状态点、等宽数值、进度轨道和语义色形成明确对应；组件仍保持只读指标展示职责。

| 启发式 | 得分 | 结论 |
| --- | ---: | --- |
| 系统状态可见性 | 3/4 | 状态点、角标、趋势、进度和 ARIA 清楚，loading 由宿主组合。 |
| 符合真实世界 | 4/4 | 指标、单位、阈值和趋势文案自然。 |
| 用户控制与自由 | 3/4 | 纯展示职责明确，extra 可由宿主注入。 |
| 一致性与标准 | 4/4 | token、字体、状态维度和旧属性兼容契约清晰。 |
| 错误预防 | 3/4 | 进度值会限制到 0-100，但多个状态维度仍可组合出矛盾语义。 |
| 识别而非回忆 | 3/4 | 信息可见，但使用者需理解三套状态维度和趋势方向覆盖规则。 |
| 灵活高效 | 3/4 | slots、RTL、窄容器和格式化值覆盖较好。 |
| 美观与极简 | 3/4 | 视觉克制，完整卡片同时展示全部可选信息时密度偏高。 |
| 错误识别与恢复 | 2/4 | 失败/stale 由宿主处理，Demo 有重试但没有统一旧值/骨架契约。 |
| 帮助与文档 | 3/4 | API 边界详细，缺少状态组合决策矩阵和风险型进度说明。 |
| **合计** | **31/40** | **Good** |

### A 路开放问题

- P1：`status`、`badgeStatus`、`trendStatus` 与 `trendDirection` 可以同时表达互相冲突的优先级，缺少推荐组合或冲突提示。
- P1：失败/stale 数据主要依赖宿主约定，非有限 `progress` 会按 0 处理，缺少统一的错误、旧值和骨架契约。
- P2：标题、状态点、角标、趋势、进度和 footer 全部出现时信息密度偏高。
- P2：风险型进度（积压率、告警负荷）使用正向填充，可能被误解为完成度。
- P2：Demo 尚未展示默认主色卡、抽屉双列统计和状态冲突示例。
- P3：自定义 value/title slot 的标题关联和动态刷新播报由宿主承担，文档可再明确。

本次只修改文档壳层宽度约束，未引入新的 P0/P1；修复后的窄屏证据不改变上述组件 API 问题。

## Assessment B：detector 与浏览器证据

证据目录：`linkx-fe/.impeccable/critique/lxmetriccard-assessment-b-2026-10-19/`。

- 组件、Demo、中文文档 detector 均为合法 JSON `[]`，stderr 为空，退出码 `0`；这只表示静态规则零命中，不能单独作为 Impeccable 通过结论。
- 浏览器覆盖 Light/HUD、1280/320/375px、进度 ARIA、宿主 loading/empty/error、键盘重试、减少动效、RTL 和容器查询。
- 1280px 无横溢出，3 个 progressbar 的 `aria-valuenow`/`aria-valuetext` 正确，三种宿主状态存在；重试按钮可聚焦并在 Enter 后显示反馈。
- HUD 表面与警告色切换成功；减少动效后进度过渡为约 `0.00001s`；RTL 进度从右侧展开。
- 修复后 375px 文档/body 宽度为 375、卡片宽度 327；320px 文档/body 宽度为 320、卡片宽度 272；两种视口均无页面横溢出，卡片内容 `scrollWidth <= clientWidth`。

## 综合结论与后续

375px 文档壳层回归已修复并增加 E2E 覆盖；组件行为门禁为单测 **15/15**、文档 E2E **3/3**，typecheck、构建、目标格式和 ESLint 通过。由于仍有两个 P1 API 语义风险，本轮不关闭 UI-10 严格矩阵。下一步先制定状态维度决策矩阵和失败/stale 宿主契约，再补风险型进度与信息密度示例，之后做有界复验；Vue3 页面迁移、真实权限/后端和 Element Plus 删除继续后置。
