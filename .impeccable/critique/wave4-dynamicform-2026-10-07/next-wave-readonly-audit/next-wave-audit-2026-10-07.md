# 下一波只读审计：TreeSelect、Cascader 与 SelectPagination

日期：2026-10-07  
范围：当前工作树中的 `LxTreeSelect`、`LxCascader`、`LxSelectPagination`，以及对应设计源、文档、Demo、测试与已有审查证据。  
性质：只读盘点；本次未改源码，未运行测试、构建、detector 或浏览器验收，未提交。

## 结论

`doc/PROJECT-FOLLOWUP-BREAKDOWN.md` 把当前工作波次收口后的入口指向 TreeSelect/Cascader 当前版本复核，以及 `LxSelectPagination` 行为闭环（第 18、20-26、158-161 行）。TreeSelect/Cascader 已有实现、中文 API/Demo、单测和文档 E2E；当前严格 UI-10 仍未关闭。官方矩阵仍记 0/52，且两个组件的当前版正式 Critique 待 overlay/复验（`doc/lx-ui/COMPONENT-AUDIT.md` 第 93、117-124、132、177 行）。

组件可观察的分页逻辑中，`LxSelectPagination` 有一个源码可确认的禁用继承缺陷：它默认 `disabled: false` 并把该值显式传给 `LxSelect`；`LxSelect` 则将默认值保留为 `undefined`，让 Element Plus 接管 Form disabled 继承。分页组件的请求守卫和禁用监听又只读 `props.disabled`，所以仅由外层 `ElForm disabled` 提供的禁用态不会进入控件和请求状态机。请求代次隔离、显式禁用时废弃在途请求、追加页失败回退页码后重试同页的逻辑已存在；尚无组件级测试直接锁定这些行为。

## 严格 UI 与浏览器证据

设计源为 `design/表单控件八件套/screen.png` 与 `code.html`。该画板提供通用 Select 外形和 32px 控件基线，没有 TreeSelect/Cascader 专属状态画板。官方映射要求 TreeSelect 对照表单控件设计源及其 API/Demo；Cascader 没有专属稿，按 Select 外形及设计令牌核对（`doc/lx-ui/COMPONENT-AUDIT.md` 第 93 行及第 132 行）。不能把独立的 `LxSelectTree` 组织树组件与 `LxTreeSelect` 树形下拉混为一项。

当前源码已使用 LxUI 令牌，并实现移动触控尺寸、错误焦点和减少动效等规则：TreeSelect 触发器窄屏最小高度为 44px，Cascader 触发器、节点行与重试按钮具备 44px 规则（`linkx-fe/src/components/LxTreeSelect/style.css` 第 7-23、190-205 行；`linkx-fe/src/components/LxCascader/style.css` 第 33-48、105-110、134-155 行）。这证明规则存在，不等于当前画面已完成严格对照。

已有材料的边界：2026-10-03 的 Assessment B 记录 TreeSelect/Cascader 文档 E2E 8/8、detector JSON `[]` 且 stderr 为空、退出码为 0；该次浏览器拒绝 overlay 注入预检，截图只能以内联观察记录，未导出成当前版本可复核的截图。官方收口记录也明确旧 overlay 不能作为正式 Critique 证据。工作树目前还有未提交的 `LxTreeSelect/style.css` 改动，新增触屏触发器 44px 样式；因此 10-03 证据也不能证明这条新增规则在当前工作树已渲染正确。detector `[]` 只代表静态扫描零命中。

下一波严格对照应先记录通用 Select 设计源到两个组件的逐项映射和差异，再基于当前源码复验桌面/窄屏、浅色/HUD、默认/焦点/禁用/错误/空/加载及弹层打开等适用视图。浏览器 overlay 命中要逐项归因到组件、令牌或 VitePress 壳层；不能用构建、单测、旧截图或 detector `[]` 替代正式 A/B 和当前视图快照。

## 组件状态与缺口

| 范围 | 当前证据 | 尚缺的可观察验收 |
| --- | --- | --- |
| TreeSelect | 中文文档声明方向键、Enter、Escape 语义；Demo 有单/多选、空/加载/失败、HUD、English locale。当前单测文件有 14 个 `it` 用例；文档 E2E 覆盖点击选择、表单错误、locale、减少动效及窄屏弹层行高（`linkx-fe/docs/components/lxtreeselect.md` 第 17-19、45-70 行；`other-admin/admin-vue3/tests/unit/lx-tree-select.test.ts`；`other-admin/admin-vue3/tests/e2e/lx-tree-select-docs.spec.ts` 第 16-132 行）。 | E2E 未走 `ArrowUp`/`ArrowDown` 后 `Enter` 的选择并检查值回显。375px E2E 量的是树节点行高，不是触发器 `.el-select__wrapper`；当前新加的触发器 44px CSS 尚无直接断言。当前目录内已有未提交 CSS 改动，本报告未触碰。 |
| Cascader | 中文文档说明 `locale`、键盘、错误/重试及 loading 优先规则；单测文件有 18 个 `it` 用例，包含 locale 与 Form disabled 行为；E2E 有方向键/Enter/Escape、错误恢复、减少动效、375px 节点行和重试热区（`linkx-fe/docs/components/lxcascader.md` 第 11、42、51、55-61、91-97 行；`other-admin/admin-vue3/tests/unit/lx-cascader.test.ts`；`other-admin/admin-vue3/tests/e2e/lx-cascader-docs.spec.ts` 第 12-138 行）。 | Demo 没有切换英文 `locale` 的控制，E2E 因此没有检查英文失败与重试文案。E2E 验证失败状态和禁用输入，但没有在错误态聚焦触发器并断言错误焦点 token；375px 只量节点行和重试按钮，没有量触发器高度。源码未见这些已声明规则的缺失，本次将其归为 Demo/E2E 覆盖缺口。 |
| SelectPagination | Demo 使用本地异步 Mock，有失败、空、禁用和取消计数；文档 E2E 3 项覆盖跨页回显、首请求失败重试/空结果、375px 搜索及 Escape（`linkx-fe/src/components/LxSelectPagination/demo/basic.vue` 第 56-92、166-182 行；`other-admin/admin-vue3/tests/e2e/lx-select-pagination-docs.spec.ts` 第 7-84 行）。源码已有请求代次、AbortController、迟到响应守卫和续页失败页码回退（`index.vue` 第 234-293、328-344、433-449 行）。 | 没有 `tests/unit/lx-select-pagination.test.ts`。现有 E2E 未用忽略 `AbortSignal` 的 Promise 验证迟到完成不会回写；未令第 2 页失败并验证重试仍请求第 2 页；未断言 disabled 时请求数不增加或 Form disabled 被继承。 |

`PROJECT-FOLLOWUP-BREAKDOWN.md` 当前记录 TreeSelect 14 个、Cascader 18 个单测定义（第 25 行）；`doc/PROJECT-MAP.md` 第 87 行仍保留历史 17/17。下一波交付时应只更新由实测支持的数字，并区分静态用例数量与本次实际通过结果。本报告未运行单测或 E2E。

## SelectPagination 代码判断

- **Form disabled 继承：源码缺陷。** `LxSelectPagination` 在 `linkx-fe/src/components/LxSelectPagination/index.vue` 第 26-42 行给 `disabled` 设置 `false` 默认值；第 463 行把此值传给 `LxSelect`，第 479 行传给搜索输入，第 510、517 行传给 footer 操作。`LxSelect` 第 45-50、113 行保留 `undefined` 并传给 Element Plus。对照 `LxTreeSelect/index.vue` 第 45、80 行和 `LxCascader/index.vue` 第 42、70 行，两者都以 `useFormDisabled` 计算表单继承态。分页组件还在第 235、329-337、407、414-418 行按 `props.disabled` 设守卫；只在父 Form 禁用时，这些判断仍为启用值。
- **迟到响应隔离：显式 disabled 路径有实现，测试缺失。** `load()` 的结果和 finally 都检查请求 ID（第 272-293 行）；禁用 watcher 会清定时器、递增 ID、abort 并释放 loading（第 328-337 行）。这能屏蔽忽略取消信号的旧 Promise；但 Form disabled 因上面的继承缺陷不会触发该路径。
- **续页失败后同页重试：逻辑已存在，测试缺失。** `loadMore()` 先递增页码（第 340-344 行）；追加失败时回退一页（第 283-287 行）；已有选项时 `retry()` 再调 `loadMore()`（第 433-436 行），因此应重试失败页。用实际请求页序列 `1, 2, 2` 固化该契约。
- **禁用不发请求：显式 prop 有入口守卫，Form 继承路径失败，测试缺失。** `load()` 在第 235 行检查 `props.disabled`；打开和参数变化时也检查该值（第 323、407、416 行）。当前 E2E 没有断言请求计数，Demo 的取消 Mock 会服从 `AbortSignal`，不足以验证不合作 API 的迟到响应。

建议修复保持 `disabled` 未提供时的 `undefined`，并复用 TreeSelect/Cascader 的 `useFormDisabled` 模式得到有效禁用态。有效禁用态需要同时控制请求入口、请求参数/数据源变化监听、搜索防抖、滚动续页、重试和 UI 操作；传给 `LxSelect` 时仍须保留 Element Plus 的 Form 禁用继承语义。

## 下一波拆分与验收标准

1. **TreeSelect/Cascader 当前版复验。** 先按设计源记录各自外形、状态、差异与缺失图稿，补指定 E2E/Demo 缺口，再跑当前单测和文档 E2E。TreeSelect 需验证真实方向键/Enter 选择回显，并在 375px 直接断言触发器高度至少 44px；Cascader Demo 增加英文 locale 状态，E2E 在失败态验证英文错误/Retry、聚焦时错误焦点令牌，以及 375px 触发器高度至少 44px。然后为当前源码执行独立 Assessment A/B、完整 detector 结果核验和适用主题/状态 overlay，保存截图、sidecar、综合报告与 snapshot。
2. **SelectPagination disabled 与状态机闭环。** 新增组件级 Vitest：外层 `ElForm disabled` 初始禁用和运行时切换均同步到触发器/搜索/分页控件，且不发请求；使用忽略 AbortSignal 的 deferred Promise，禁用后 resolve 不得回写选项、发 `load` 或改变错误态；页 1 成功、页 2 失败后重试的请求序列必须为 `1, 2, 2`，原有页 1 选项保留。再补浏览器可观察的 Form disabled 场景及请求计数。Demo 当前只有直接 disabled 按钮，可增加 Form disabled 示例以覆盖真实继承入口。
3. **联合验证与记录。** 当前三个目标的类型检查、定向 lint/格式、库构建、文档构建和目标 E2E 通过后，再完成当前版 A/B/overlay。所有远程请求使用 Demo/浏览器 Mock，不触达真实后端。只有独立视觉证据和 snapshot 齐全后才可更新严格矩阵状态；实测数和历史记录分开书写。

## 相关路径

- 计划与组件严格矩阵：`doc/PROJECT-FOLLOWUP-BREAKDOWN.md`、`doc/PROJECT-MAP.md`、`doc/lx-ui/COMPONENT-AUDIT.md`
- 视觉源：`design/表单控件八件套/screen.png`、`design/表单控件八件套/code.html`
- TreeSelect：`linkx-fe/src/components/LxTreeSelect/`、`linkx-fe/docs/components/lxtreeselect.md`、`other-admin/admin-vue3/tests/unit/lx-tree-select.test.ts`、`other-admin/admin-vue3/tests/e2e/lx-tree-select-docs.spec.ts`
- Cascader：`linkx-fe/src/components/LxCascader/`、`linkx-fe/docs/components/lxcascader.md`、`other-admin/admin-vue3/tests/unit/lx-cascader.test.ts`、`other-admin/admin-vue3/tests/e2e/lx-cascader-docs.spec.ts`
- SelectPagination：`linkx-fe/src/components/LxSelectPagination/`、`linkx-fe/docs/components/lxselectpagination.md`、`other-admin/admin-vue3/tests/e2e/lx-select-pagination-docs.spec.ts`、缺失的 `other-admin/admin-vue3/tests/unit/lx-select-pagination.test.ts`
- 最近一次 TreeSelect/Cascader 证据及其限制：`.impeccable/critique/wave6-final-2026-10-03/assessment-b-postfix/README.md`、`.impeccable/critique/wave6-postfix-2026-10-02/report.md`

