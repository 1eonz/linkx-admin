# Wave 6 综合 Critique：LxTreeSelect 与 LxCascader

评审方式：双路独立评审（A：`/root/treecascader_postfix_a`；B：隔离的检测器与浏览器取证，B 的 Agent 身份未保存在归档中）。

## 范围与证据

本波覆盖 `LxTreeSelect`、`LxCascader` 的组件源码、Demo、中文 API 文档，以及修复后的选择、加载、错误、重试、locale、键盘和窄屏状态。

- Assessment A：目录保留两份不同阶段的评分。`assessment-a-final.md` 为修复前评审，29/40（Good）；`assessment-a.md` 明确标为 Post-fix，30/40（Good）。`assessment-a-final-followup.md` 是无新评分的末次复核，确认 TreeSelect/Cascader 的 demo 宽度、TreeSelect 根节点展开、可见标签与 English locale 文案、Cascader 44px 重试热区均已处理。修复后观察为 P3：English locale 展示仍可更完整，两个 Demo 外框风格可以进一步统一；Assessment A 的移动/减少动效视觉复验受浏览器能力限制。
- Assessment B（历史结果，已被当前证据更正）：旧记录曾称四个目标的 detector 为 `[]`，并称六个浏览器视图完成 overlay 注入。2026-10-03 当前版本复核确认浏览器策略拒绝注入预检，10 月 2 日 overlay 早于当前代码/文档，不能用于当前版本正式 Critique；detector `[]` 仅表示静态规则零命中。当前证据见 `.impeccable/critique/wave6-final-2026-10-03/assessment-b-postfix/README.md`。
- 行为验证：TreeSelect/Cascader 单测 17/17，文档 Playwright 5/5；lx-ui `typecheck`、`build`、`build:docs` 和 Vue3 `vue-tsc --noEmit` 通过，目标文件 Prettier 通过。

## 评审解释

静态 detector 的 `[]` 只表示规则没有命中，不能单独作为视觉通过。本波同时核对 JSON、stderr、退出码、目标可访问性、overlay、截图和综合报告。B 的 overlay 命中涉及 VitePress 页面、代码区、Props 表、Popper/裁切规则和文档页横向溢出；不能按命中数量直接判为组件缺陷。375px 文档页的 `documentElement.scrollWidth=615px` 包含 VitePress 外壳，当前证据不足以定位溢出来源，作为尚未归因的文档页观察保留。

## 已处理建议

- TreeSelect footer 默认文案改为跟随 locale，并支持 selected/unselected/cancel/confirm 单项覆盖。
- TreeSelect Demo 增加可见字段标签、统一宽度和间距、English locale 控件，并默认只展开根节点。
- Cascader 在 `loading && error` 时由 loading 优先；loading 结束后才显示错误和 retry，避免并发状态重复播报。
- Cascader retry 控件在移动视图保持至少 44px 点按高度。

## 结论与边界

本文件的实现和行为结果作为历史记录保留；其中“当前版本独立 A/B、overlay 和正式快照已完成”的结论已被 2026-10-03 当前证据取代。TreeSelect/Cascader 的实现和行为回归完成，但当前正式 Impeccable Critique 未闭环：浏览器拒绝注入预检，旧 overlay 不能证明当前版本。不得以本历史报告登记严格 UI-10 已关闭。基础控件顺序仍按计划继续。
