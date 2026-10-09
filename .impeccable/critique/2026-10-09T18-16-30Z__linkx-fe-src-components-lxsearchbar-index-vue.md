---
target: linkx-fe/src/components/LxSearchBar/index.vue
total_score: 25
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 0
target_identity: "file:F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxSearchBar\\index.vue"
target_fingerprint: "sha256:7953d0365e95f2b9033b41c1a77c693d72896610cae19d1a302efefd0269a071"
target_path: "F:\\work\\linkx-admin\\linkx-fe\\src\\components\\LxSearchBar\\index.vue"
timestamp: 2026-10-09T18-16-30Z
slug: linkx-fe-src-components-lxsearchbar-index-vue
---
Method: dual-agent (A: /root/g2_search_assessment_a · B: /root/g2_search_assessment_b)

# G2 LxSearchBar + LxStatusSwitch 综合 Impeccable 报告

## 评审范围

本波覆盖 `LxSearchBar` 和 `LxStatusSwitch` 的组件实现、类型、中文 Demo/API 文档、Vue3 宿主单测与文档 Playwright。Assessment A 独立复核 SearchBar 的设计与交互；Assessment B 独立执行 SearchBar 的 detector、浏览器注入和 overlay；StatusSwitch 的行为证据由独立单测、文档 E2E 和代码复审补充。detector 的 `[]` 均同时核对 JSON、stderr 和退出码，没有把单独的空数组当作视觉通过。

## Design Health Score（LxSearchBar）

| # | 启发式 | 分数 | 关键问题 |
|---|---|---:|---|
| 1 | 系统状态可见性 | 3/4 | loading 锁定动作并暴露 `aria-busy`，折叠按钮显示隐藏数量；字段错误和查询结果语义仍由宿主注入。 |
| 2 | 系统与现实世界匹配 | 3/4 | 中文字段、中台检索语义和 Enter/Escape 路径清楚；设计 HTML 仍有旧 API 文字。 |
| 3 | 用户控制与自由 | 2/4 | 折叠更可预测，但 Escape 仍会无确认重置并立即查询，没有 Undo。 |
| 4 | 一致性与标准 | 2/4 | 运行时与正式文档已统一 8 项阈值和无 payload 的 search，设计 HTML 仍写旧阈值和签名。 |
| 5 | 错误预防 | 2/4 | disabled/loading/canReset 可防部分误操作；缺少字段级校验契约和未知类型诊断。 |
| 6 | 识别而非回忆 | 3/4 | “展开（隐藏 N 项）”提供数量线索；未显示隐藏条件的已应用数量或摘要。 |
| 7 | 灵活与效率 | 3/4 | schema、插槽、Enter、受控折叠支持熟练用户；没有常用条件和批量恢复路径。 |
| 8 | 审美与极简 | 3/4 | 24 列栅格和移动 44px 目标稳定；展开十项字段时信息密度仍高。 |
| 9 | 错误识别与恢复 | 2/4 | 宿主可注入失败状态；没有字段定位、修复动作或内建失败重试。 |
| 10 | 帮助与文档 | 2/4 | 中文 API 和行为记录完整；设计资产契约及字段错误边界仍需同步。 |
| **总计** |  | **25/40** | **可接受：本波修复提升 2 分，剩余问题为 P2。** |

`LxStatusSwitch` 未单独计算启发式总分；本波以行为、可访问性和浏览器证据验收其确认竞态、权限边界、旧值映射及失败恢复，未将 SearchBar 的 25/40 延伸为整个 G2 的视觉评分。

## 设计特异性

SearchBar 具有 LinkX 中台的紧凑检索定位：24 列 schema、首四项渐进披露、中文字段标签和宿主注入状态构成稳定的业务密度模式。它仍保留通用 Element Plus 控件外观，视觉身份属于中等特异性，适合作为跨页面检索容器复用。StatusSwitch 的 0/1 旧值兼容、关闭确认、只读 Tag 和保存失败恢复符合业务状态列语义，组件边界清晰。

## Assessment B 证据

- `LxSearchBar/index.vue`、Demo 和中文文档三个 detector 均输出可解析 JSON `[]`，stderr 为空，退出码为 `0`。
- 浅色/HUD、1440/375px、减少动效和交互视图已完成 mutable 注入、截图与指标记录；根节点 `role="search"`、loading `aria-busy`、375px 折叠按钮 44px、减少动效下 chevron transition 为 `none` 均已核实。
- 375px 文档整页 `scrollWidth=615` 来自 VitePress API 表格和代码区域；SearchBar 卡片自身没有横向溢出。该项作为文档壳层 P2 观察记录，不归因于组件。
- HUD overlay 命中主要是预期主题令牌、VitePress 代码高亮和文档外壳；没有发现 SearchBar 字段、按钮、折叠控件、状态或焦点的特定缺陷命中。

证据索引：`.impeccable/critique/wave8-searchbar-2026-10-10/assessment-b/final-recheck/`。

## StatusSwitch 行为验收

- 单测 12/12：覆盖 boolean 与 0/1 映射、确认/取消、只读、loading、权限撤销竞态、保存失败后重试和 `aria-busy`/`aria-disabled`。
- 文档 Playwright 3/3，G2 合并 E2E 6/6：覆盖 Space 键盘切换、确认层、取消不改值、失败恢复、375px 44px 点按目标、主题和减少动效。
- 确认层等待期间若 loading、disabled 或权限撤销，旧确认结果被丢弃，避免异步结果覆盖最新状态。

## 代码复审

独立代码复审报告见 `.impeccable/critique/wave8-searchbar-2026-10-10/code-review-g2.md`。初审发现的 StatusSwitch `modelValue` 外部更新竞态已通过模型版本和原始值快照守卫修复，并补充回归测试；修后复审确认无可复现 P0/P1/P2，SearchBar ARIA/隐藏数量单测增强保留为不阻塞的 P3。复审范围包含 SearchBar 折叠阈值/ARIA/移动触控、StatusSwitch 确认竞态/权限边界、中文注释文档、类型和 Promise 链式约定。G2 的业务 API 未改为 `async/await`；现有网络调用继续使用 `.then().catch().finally()`。

## 保留的 P2 建议

1. **字段级错误契约**：设计 HTML 展示错误边框和行间文案，但 schema 没有 `error/invalid/help/aria-describedby`；下一轮明确由 schema 或宿主 slot 承担，并补可访问关联。
2. **Escape 语义**：当前 Escape 会清空全部条件并触发查询；后续评估仅关闭控件、确认重置或提供一次撤销，避免误操作造成返工。
3. **隐藏条件摘要**：当前只播报隐藏数量，后续可增加已应用数量或摘要，并在展开后保持焦点定位。
4. **设计资产同步**：`design/检索面板 SearchBar/code.html` 仍写超过 4 项折叠和带 query payload 的旧签名，需要和正式文档及类型同步。
5. **文档壳层窄屏**：VitePress API 表格和代码长行在 375px 产生页面级横向滚动，另列文档体验修复，不阻断组件交付。

## 验证结果

- lx-ui `pnpm exec vite build`：通过，203 个模块转换，JS/CSS 与声明文件生成成功。
- lx-ui `vue-tsc --noEmit`：通过。
- Vue3 定向单测：22/22（SearchBar 8/8、StatusSwitch 14/14；包含外部模型值和原地权限源竞态）。
- 文档 Playwright：6/6（SearchBar 3/3、StatusSwitch 3/3）。
- Vue3 目标测试 ESLint：通过；目标文件 Prettier 检查通过。
- `git diff --check`：通过。

## 边界与下一波

G2 关闭组件库门禁，但不代表 UI-10 全部 52 项、Vue3 `DataPermissionTree` 宿主替换、权限中心/字段权限/引导页或真实后端联调完成。继续保留 Vue3 宿主 `element-plus`，先进入下一波组件库候选；全库 UI-10 和 UI-11 完成后才启动 Vue3 Element Plus 批量替换。权限中心、文本/字段权限和引导页继续按既定计划延后。

Questions skipped: 用户已明确要求完成一波自动进入下一波，不追加设计决策问题。
