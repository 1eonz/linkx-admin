# Wave 7 LxTransferPanel 最终冻结版独立代码复审

## 范围

复审 `linkx-fe/src/index.ts`、LxTransferPanel 实现和类型、Demo、中文文档、对应 unit/E2E、`design/虚拟滚动树 + 双栏穿梭/code.html` 与 `screen.png`。未读取 Impeccable Assessment A/B 目录或其他旧审核报告；未修改任何产品文件。

## 结论

没有发现 P0、P1 或 P2 问题。状态原型键修复、未加载条目行高修复均已反映在当前冻结版；组件行为、公开类型、Demo 与文档契约一致。保留 2 项 P3 验证边界，均为测试覆盖或外部过滤语义依赖，尚非已确认缺陷。

## 发现

### P0-P2

无。

### P3：源树过滤和批量筛选使用不同的查询规范化路径

`sourceFilterMatches` 对输入执行 `trim()` 后匹配标签（`index.vue:118-125`），而 `applySourceFilter` 将原始输入交给树的 `filter()`（`index.vue:295-298`）。如果树过滤不自行去除首尾空格，搜索 `" 交警 "` 时树中的可见结果可能为空，而“全选筛选结果/反选筛选结果”仍会按去空格后的标签集合操作。这取决于本次范围外的树组件过滤语义；当前测试只覆盖无首尾空格的普通查询，因此记为未证实的 P3 风险，不是确认缺陷。

### P3：窄屏未加载详情的列表滚动没有浏览器断言

已选列表采用纵向 flex、`min-height: 0` 和 `overflow: auto`，行项使用 `flex: 0 0 auto`；未加载详情可换行并由内容撑高行（`index.vue:792-817`、`index.vue:836-844`）。这避免行项在纵向空间不足时被压扁，滚动由列表视口承载。E2E 空树用例会检查每条详情容器均落在所属行内（`lx-transfer-panel-docs.spec.ts:165-183`）；375px 用例检查触控尺寸、横向溢出及已加载项元数据，但没有在 375px 空树状态下验证多行未加载项，也没有断言 selected 列表实际发生纵向滚动（`lx-transfer-panel-docs.spec.ts:186-256`）。现有 CSS 结构未显示行高或滚动缺陷；建议把该组合留作后续浏览器覆盖。

## 契约复核

- 公开入口在 `src/index.ts:45`、`:112`、`:348` 导出/注册 `LxTransferPanel`，并在 `:199-205` 导出 `LxTransferPanelItem`、`Meta`、`Node`、`Props` 与 `StatusTone`，未见缺项。
- `selectedItems` 仅为 `modelValue` 中当前树未加载的键提供回显；当前树节点优先。`change.nodes` 只包含当前树可解析节点，树外既有键仍保留在 `keys` 中（`index.vue:145-152`、`:165-191`；文档 `lxtransferpanel.md:24-25`、`:37-40`）。单测覆盖快照回显、树节点重新加载后覆盖快照以及未加载键保留。
- 状态文案映射使用 `Object.prototype.hasOwnProperty.call`，`constructor` 原型键回归断言未知状态原文仍显示（`index.vue:323-328`；单测 `lx-transfer-panel.test.ts:254-263`）。状态 tone 通过有限白名单收窄，显式有效 `statusTone` 优先，未知状态回退为 `offline`（`index.vue:60-69`、`:308-320`），未发现任意状态字符串进入 CSS class 的问题。
- 全树加入只操作当前树的非禁用键；筛选批量操作只操作标签匹配集合；反选保留匹配范围外及树外键（`index.vue:104-128`、`:202-233`）。单测和 E2E 覆盖了筛选全选/反选及全树加入的区别。
- `maxCount` 非有限值按 0 处理；超过上限的新增整体拒绝，减少和清空仍可用（`index.vue:108-113`、`:165-177`；单测 `lx-transfer-panel.test.ts:145-157`、`:198-207`）。未加载单项删除和含未加载项的全量清空都先确认；取消不发变更，确认后按文档顺序发出更新、change、clear-all（`index.vue:235-253`、`:270-285`；单测 `lx-transfer-panel.test.ts:160-177`、`:296-339`）。
- 设计稿桌面穿梭布局为 5:2:5、两面板 380px、中央双向控件；当前实现与文档的桌面比例、面板高度和操作位置一致。窄屏将面板纵向排列并把主要触控目标提升到 44px（`index.vue:990-1032`）；E2E 覆盖了目标尺寸、焦点样式和页面横向溢出。

## 验证

- 本次独立执行：`pnpm exec vitest run tests/unit/lx-transfer-panel.test.ts`，通过，14/14。
- 任务上下文提供的验证结果（本次未重复执行）：TransferPanel docs E2E 5/5（4177 隔离）、lx-ui/Vue3 typecheck、lx-ui build、docs build、定向 ESLint、Prettier 与 diff-check 均通过。
- 本次没有独立重跑 E2E；因此将 375px 未加载多行条目的实际滚动视为剩余验证边界，不把未重复执行的浏览器行为写成本轮实测。

## 冻结哈希

以下 SHA-256 在报告创建前记录，并在报告写入后逐项复核一致。哈希覆盖本次审查的公开入口、组件文件、文档、测试及两份设计稿；本复审只新增此报告。

| 文件 | SHA-256 |
| --- | --- |
| `linkx-fe/src/index.ts` | `57E7A5854369B38C9AC68045FF8F1C78038218561517516BE0A7EB39BBC3229B` |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `DC7BBDEE1CC810B78FF513B83D4A0BEDE3446E984DC14067B9393D177B8CCD85` |
| `linkx-fe/src/components/LxTransferPanel/types.ts` | `934FAAE2D2CA0DF8388BFABD1556E1B67CEB8E0AE930B0E43FB0B7FCC1054AA8` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `2CEA4A141C6A608C09BFB144CFFBE5329E7E03F49113B2934B6844A8FA037D23` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `690687345AEF23036238EED5DAA1FEE448EB5F21BC34576F4F2BB99E95470ED5` |
| `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts` | `09C153628E730DE873D6ED4FFB25C997122F408D598763E2D581F4B108D52ED5` |
| `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts` | `F630D6FE6D0B351172626BDA2FA6566A74548DC00148FF9E68284E3C3EAB3EA6` |
| `design/虚拟滚动树 + 双栏穿梭/code.html` | `D523F7C5167DDAF3A3DA6BFDA68B9F29773CB4F89AE54A8DF7A413AABD853CEA` |
| `design/虚拟滚动树 + 双栏穿梭/screen.png` | `4BDF7DED1C8D2272F0AFBB7706A2F103B888D3DAF72BF472204C1AA7DB9DE4F5` |
