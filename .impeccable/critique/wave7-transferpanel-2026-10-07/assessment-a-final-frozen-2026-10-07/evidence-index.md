# Assessment A 证据索引

目标：`http://127.0.0.1:4174/components/lxtransferpanel`，HTTP 200，标题 `LxTransferPanel 双栏穿梭 | LxUI`。使用新 Playwright context/page 和系统 Chrome；预览服务在复核结束后仍运行于 `127.0.0.1:4174`。操作仅作用于本地文档 Demo 状态，没有真实后端写操作。

## 浏览器证据

详细尺寸、键盘路径、页面状态和控制台信号见 [browser-evidence.json](browser-evidence.json)。采集脚本为 [capture-frozen-assessment-a.mjs](capture-frozen-assessment-a.mjs)。

| 状态 | 截图 | 证据 |
|---|---|---|
| 桌面初始态 | [desktop-ready-page.png](desktop-ready-page.png)、[desktop-ready-surface.png](desktop-ready-surface.png) | 1440×1100；文档示例区约 688px，左右面板约 276px。 |
| HUD 深色 | [desktop-hud-surface.png](desktop-hud-surface.png)、[mobile-375-hud-surface.png](mobile-375-hud-surface.png) | 桌面与 375px 下检查状态色和文字层级。 |
| 左树筛选 | [desktop-source-filter.png](desktop-source-filter.png) | “交警直属特勤”筛选出 2 个树行（含可见祖先）；筛选全选禁用，反选可用。 |
| 已选编码筛选 | [desktop-selected-code-filter.png](desktop-selected-code-filter.png) | `DEPT-03` 结果只有 1 条。 |
| 键盘过滤与清除 | [desktop-keyboard-tab-selected-clear.png](desktop-keyboard-tab-selected-clear.png)、[desktop-keyboard-tab-source-clear.png](desktop-keyboard-tab-source-clear.png) | Tab 到清除按钮可见 2px 焦点框；Enter 清除后焦点回到输入框。 |
| 键盘树操作 | [desktop-keyboard-tree-focus.png](desktop-keyboard-tree-focus.png) | 从筛选框 Tab 到树行，Space 将已选数从 5 切到 4，再切回 5，焦点保留。 |
| 加载与失败 | [desktop-loading.png](desktop-loading.png)、[desktop-error.png](desktop-error.png)、[desktop-retry-restored.png](desktop-retry-restored.png) | 加载时 `aria-busy=true`；失败文案和重试可见；两个状态均保留 5 项。 |
| 空树 | [desktop-empty-tree-900ms.png](desktop-empty-tree-900ms.png)、[mobile-375-empty-tree-hud.png](mobile-375-empty-tree-hud.png) | 900ms 后桌面空态行 76px、视口 265px；375px 下值相同。 |
| 清空、空选择与撤销 | [desktop-clear-confirmation.png](desktop-clear-confirmation.png)、[desktop-empty-selection.png](desktop-empty-selection.png)、[desktop-clear-with-undo.png](desktop-clear-with-undo.png)、[desktop-after-undo.png](desktop-after-undo.png) | 未加载键出现确认；清空后空态提示和撤销入口可见；撤销恢复 5 项。 |
| 窄屏布局 | [mobile-375-ready-page.png](mobile-375-ready-page.png)、[mobile-375-ready-surface.png](mobile-375-ready-surface.png) | 375px 视口下纵向排列；`documentElement.scrollWidth=375`，无页面水平溢出。 |
| 减少动效 | [mobile-375-reduced-motion.png](mobile-375-reduced-motion.png) | `prefers-reduced-motion: reduce` 匹配，抽样组件节点 transition/animation 均为 `0.00001s`。 |

控制台出现一条未归因的 `404 (Not Found)` 资源消息；Playwright 未记录失败请求，也未捕获到 4xx/5xx response URL。该信号留作环境观察，不据此归因组件问题。未运行 detector、Assessment B、单测、构建或读屏器。

## 冻结 SHA-256

以下起始值来自用户提供的冻结清单；八个文件在采集结束后的 SHA-256 仍全部匹配。`linkx-fe/src/index.ts` 是本波新增公开类型导出，按父任务补充纳入第 8 个冻结目标。

| 冻结文件 | Start SHA-256 | End SHA-256 | 结果 |
|---|---|---|---|
| `linkx-fe/src/components/LxTransferPanel/index.vue` | `DC7BBDEE1CC810B78FF513B83D4A0BEDE3446E984DC14067B9393D177B8CCD85` | `DC7BBDEE1CC810B78FF513B83D4A0BEDE3446E984DC14067B9393D177B8CCD85` | MATCH |
| `linkx-fe/src/components/LxTransferPanel/types.ts` | `934FAAE2D2CA0DF8388BFABD1556E1B67CEB8E0AE930B0E43FB0B7FCC1054AA8` | `934FAAE2D2CA0DF8388BFABD1556E1B67CEB8E0AE930B0E43FB0B7FCC1054AA8` | MATCH |
| `linkx-fe/src/components/LxTransferPanel/demo/basic.vue` | `2CEA4A141C6A608C09BFB144CFFBE5329E7E03F49113B2934B6844A8FA037D23` | `2CEA4A141C6A608C09BFB144CFFBE5329E7E03F49113B2934B6844A8FA037D23` | MATCH |
| `linkx-fe/docs/components/lxtransferpanel.md` | `690687345AEF23036238EED5DAA1FEE448EB5F21BC34576F4F2BB99E95470ED5` | `690687345AEF23036238EED5DAA1FEE448EB5F21BC34576F4F2BB99E95470ED5` | MATCH |
| `other-admin/admin-vue3/tests/unit/lx-transfer-panel.test.ts` | `09C153628E730DE873D6ED4FFB25C997122F408D598763E2D581F4B108D52ED5` | `09C153628E730DE873D6ED4FFB25C997122F408D598763E2D581F4B108D52ED5` | MATCH |
| `other-admin/admin-vue3/tests/e2e/lx-transfer-panel-docs.spec.ts` | `F630D6FE6D0B351172626BDA2FA6566A74548DC00148FF9E68284E3C3EAB3EA6` | `F630D6FE6D0B351172626BDA2FA6566A74548DC00148FF9E68284E3C3EAB3EA6` | MATCH |
| `design/虚拟滚动树 + 双栏穿梭/code.html` | `D523F7C5167DDAF3A3DA6BFDA68B9F29773CB4F89AE54A8DF7A413AABD853CEA` | `D523F7C5167DDAF3A3DA6BFDA68B9F29773CB4F89AE54A8DF7A413AABD853CEA` | MATCH |
| `linkx-fe/src/index.ts` | `57E7A5854369B38C9AC68045FF8F1C78038218561517516BE0A7EB39BBC3229B` | `57E7A5854369B38C9AC68045FF8F1C78038218561517516BE0A7EB39BBC3229B` | MATCH |
