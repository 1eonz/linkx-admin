---
score: 39
max_score: 40
p0: 0
p1: 0
p2: 0
p3: 0
assessment: G2 修后综合复验：独立 A/B 与浏览器证据完成
target_identity: "file:F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxSearchBar\\index.vue"
target_fingerprint: "sha256:1c688d3f69ff70455d3250ba098e1baf75ad930f415d0f4fad6430bc0ce770fe"
target_path: "F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxSearchBar\\index.vue"
timestamp: 2026-10-09T19-51-41Z
slug: linkx-fe-src-components-lxsearchbar-index-vue
---
Method: dual-agent baseline (A: /root/g2_assessment_a · B: /root/g2_assessment_b) plus bounded post-fix browser recheck in the parent context

# G2 修后综合复验

## 设计健康分

| # | 启发式原则 | 分数 | 关键观察 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 4 | SearchBar 标准态和复杂态均有可见状态；StatusSwitch 具备 loading、只读、权限和确认反馈。 |
| 2 | 系统与现实世界匹配 | 4 | 影响范围、目标实体和审计提示符合高风险管理台语境。 |
| 3 | 用户控制与自由 | 4 | 重置、展开/收起、确认取消、Esc 和失败重试路径完整。 |
| 4 | 一致性与标准 | 4 | 组件继续复用 lx-ui 令牌、LxSwitch、LxTag 和链式请求约定。 |
| 5 | 错误预防 | 4 | loading 防重复、关闭确认、权限降级和旧确认竞态保护均有证据。 |
| 6 | 识别而非回忆 | 4 | 四字段标准态直接可见，所有状态行的业务名称通过 ARIA 关联。 |
| 7 | 灵活高效 | 4 | schema、折叠、多字段、四字段同行、Enter/Esc 和宿主插槽同时保留。 |
| 8 | 美观与极简 | 3 | 组件层级清晰；VitePress 文档壳仍有长段落和复制按钮 detector 提示。 |
| 9 | 错误识别、诊断与恢复 | 4 | 失败状态、保存失败、取消确认和旧结果丢弃均能恢复。 |
| 10 | 帮助与文档 | 4 | 中文 Props、边界、设计对照、四字段标准态和验收证据已同步。 |
| **总计** |  | **39/40** | **Good：组件问题已修复，剩余命中属于文档壳层质量观察。** |

## 设计特异性结论

SearchBar 的四字段标准态、24 列栅格、32px 控件和多字段折叠明确锚定 LinkX 管理台。StatusSwitch 的 0/1 兼容、权限降级以及“目标实体—影响范围—审计记录”确认正文来自实际业务风险，而非通用开关模板。当前没有把 VitePress 文档壳的复制按钮、长行文本和过渡效果误归因于组件源码。

## 评估证据

- Assessment A 原始设计评审见 `../recheck-assessment-a/report.md`；其 P1/P2 已处理：确认上下文、状态行 ARIA、四字段 Demo 和重复状态。
- Assessment B 原始报告见 `../recheck-assessment-b/report.md`；六个 detector 目标均核验为合法 JSON `[]`、空 stderr、退出码 0。该结果只代表静态零命中。
- 修后浏览器证据见 `browser-evidence.json`：1440px SearchBar 四字段标准态实测 `rows=1`；1440/375px 两页 `scrollWidth` 均等于视口；StatusSwitch 读取到 loading/只读/无权限行的 `aria-labelledby` 与 `aria-describedby`；确认层实际 Teleport 到 `body [role=dialog]`，包含目标实体、影响范围和审计提示；减少动效匹配成功。
- 浏览器 overlay 已注入并执行。命中主要是文档壳层的隐藏复制按钮、长段落行长和页面结构提示，不回写为组件缺陷。

## 已处理问题

1. **P1 确认上下文**：`LxStatusSwitchConfirmOptions` 新增 `impact` 与 `audit`，在确认层正文中按中文标签追加；Demo 展示目标实体、影响范围和不可篡改审计日志。
2. **P1 状态行可访问名称**：loading、disabled、permission Demo 行补充唯一标签/描述 ID；组件将关联属性传给真实 `LxSwitch` 或只读 `LxTag`。
3. **P2 四字段标准态**：SearchBar Demo 增加四字段标准态，桌面同行、移动单列均由浏览器证据确认。
4. **P2 重复状态**：移除工具栏重复等待状态，结果、耗时和快捷键集中在 `meta` 或标准态状态行。

## 遗留观察

- VitePress 375px 文档壳的长 API/代码区域仍可能产生密度 detector 提示；组件自身没有页面级横向溢出。
- 一次性 404 仅出现在旧评估的 VitePress 壳层日志，本轮 favicon 已存在且修后浏览器无资源错误；真实后端、权限中心和宿主 Element Plus 替换仍按计划后置。

## 验证

- 定向单测：`LxSearchBar 9/9`、`LxStatusSwitch 17/17`，合计 `26/26`。
- `linkx-fe` `vue-tsc --noEmit`、生产构建（203 modules）、VitePress 文档构建、目标 Prettier、目标 ESLint、`git diff --check`：通过。
- StatusSwitch 文档 E2E 修后 `4/4`；既有 SearchBar 文档 E2E `3/3`。

Questions skipped: 4 priority issues were resolved within the authorized automatic execution scope; no product decision is needed before the next planned component wave.
