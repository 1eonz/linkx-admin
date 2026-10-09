# Wave 7 LxTransferPanel 修后代码复审

复审范围仅包含指定的 `LxTransferPanel` 实现、类型、Demo、中文组件文档、单测、E2E，以及设计稿。未读取 Impeccable Assessment A/B 或其他旧代码审核报告。

## 结论

首轮复审发现的状态原型键 P2 和本次复审关注的未加载条目行高问题均已关闭；当前没有未关闭的 P0-P2。已选键、`selectedItems` 回显优先级、`change` 节点范围、禁用/未加载节点保留、单项危险确认、全量清空确认、上限拒绝与移除例外均与当前文档基本一致。

2026-10-07 修复复审：确认 `statusLabelOf` 只读取映射表自有键，并以新 `constructor` 用例回归；状态回退及 tone 白名单检查通过。定向单测通过 14/14。

## 已修复问题

### 首轮 P2：任意状态字符串与对象原型键冲突

首轮位置：`linkx-fe/src/components/LxTransferPanel/index.vue:70`、`linkx-fe/src/components/LxTransferPanel/index.vue:323`。现行实现先以 `Object.prototype.hasOwnProperty.call(statusLabels, status)` 判断自有映射键；`constructor`、`toString`、`__proto__` 等原型成员不再被当作中文映射，未知状态原样返回。新增单测以 `status: 'constructor'` 覆盖该回归。

tone 路径未受本次修改影响：有效显式 `statusTone` 优先；缺省时仅从 `online`、`processing`、`busy`、`error`、`offline`、`success`、`warning`、`info` 白名单推断；任意未知状态回退到 `offline`，不会把原始状态拼入 CSS class。没有发现 tone 契约回归。新增原型键用例目前断言状态文本；tone 的 `offline` 回退和显式覆盖分别未由该用例直接断言。

文档契约依据：`types.ts:11-14` 允许业务状态字符串并定义可选语义色；当前 `lxtransferpanel.md:49-50` 明确标准状态文案、未知状态原样显示与 statusTone 推断关系。

## 行高修复复审

复审位置：`linkx-fe/src/components/LxTransferPanel/index.vue:792`、`linkx-fe/src/components/LxTransferPanel/index.vue:804`、`linkx-fe/src/components/LxTransferPanel/index.vue:840`、`other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts:165`。

已选列表现在是 `min-height: 0` 且 `overflow: auto` 的纵向 flex 容器；列表项 `flex: 0 0 auto`，不会为填满固定面板高度而压缩。未加载项详情可换行，条目高度由内容撑开，超出面板的条目由列表滚动承载。长名称保持单行省略，编码、状态与键值保留最大宽度并使用省略，避免长文本把删除按钮挤出行。未发现行高、滚动或长文本造成的当前 P0-P2 问题。

E2E 新增空树状态几何断言，遍历每个未加载条目，验证详情容器上下边界位于所属条目内且条目高度不小于详情容器。任务上下文报告该断言修前失败、修后通过；本次独立复审没有重复执行浏览器测试。

## 风险边界与覆盖

- 左侧批量匹配使用 `sourceFilter.trim()`，树过滤则把原始值交给 `tree.filter(value)`（`index.vue:118`、`index.vue:295`）。带首尾空格的搜索词可能导致批量操作范围与树中可见结果不同，取决于树组件如何规范查询。受本次只读范围限制未检查树实现；当前单测只断言普通文本过滤，未验证空白字符一致性。这是未证实的边界风险，不作为已确认缺陷。
- 375px E2E 检查了按钮触控尺寸、文档横向溢出和已加载节点元数据宽度；空树行高断言在默认视口下运行，没有同时把视口切到 375px，也没有检查 selected 列表自身 `scrollHeight > clientHeight` 时的滚动交互。因此窄屏下长详情换行与超出面板后的实际滚动仍是覆盖边界，不是当前确认缺陷。
- `selectedItems` 只用于当前树缺失的已选键，当前树节点覆盖快照；`change.nodes` 只含当前树可解析节点，未加载键仍在 `keys` 中。单测检查了树内节点优先回显、未选快照不展示和未知键确认；文档明确记录了事件范围。
- `maxCount` 超限时新增整体拒绝，减少与清空仍可用；单测覆盖超限拒绝和已有超限值清空。单项未知节点取消确认不发变更、全量清空取消不发 `clear-all`，均有单测覆盖。

## 验证

- `pnpm exec vitest run tests/unit/lx-transfer-panel.test.ts`：通过，14/14；包含 `constructor` 原型键回归。
- `pnpm exec playwright test tests/e2e/lx-transfer-panel-docs.spec.ts`：未完成。测试启动的 Vite 代理请求 `172.16.23.8:30844` 上的版本和全局配置接口时超时；由于 E2E 未拦截全部后端请求，按只读验证边界停止了该进程。因此不把 375px 浏览器渲染或其他 E2E 行为记为通过。
- 本轮未重新运行 Playwright：此前执行触发了未 Mock 的内网 GET 并超时；新几何断言的修后通过结论来自任务上下文，不作为本次独立运行结果。

## 冻结哈希

以下为修复复审期间记录的 SHA-256。报告更新后，组件实现、类型、Demo、单测和 E2E 与复审前的记录一致。组件文档哈希在复审期间由 `0D5B166A8C572FDB73C046C7F16761273DE49501E36C0651F85576BCA3D3D09A` 变为表中的当前值；已检查文档差异，其中新增了“其它状态原样显示”等契约说明，与本次修复一致。该文档变化不是本复审所作。

| 文件 | SHA-256 |
| --- | --- |
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `DC7BBDEE1CC810B78FF513B83D4A0BEDE3446E984DC14067B9393D177B8CCD85` |
| `linkx-fe/src/components/LxTransferPanel/types.ts` | `934FAAE2D2CA0DF8388BFABD1556E1B67CEB8E0AE930B0E43FB0B7FCC1054AA8` |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `2CEA4A141C6A608C09BFB144CFFBE5329E7E03F49113B2934B6844A8FA037D23` |
| `linkx-fe/docs/components/lxtransferpanel.md` | `C363101C88F882A17A1F32A528CD987FB98E25A3E4CA3567BC32E231853CEB2A` |
| `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts` | `09C153628E730DE873D6ED4FFB25C997122F408D598763E2D581F4B108D52ED5` |
| `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts` | `F630D6FE6D0B351172626BDA2FA6566A74548DC00148FF9E68284E3C3EAB3EA6` |
