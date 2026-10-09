# Wave 7 LxTransferPanel 只读对照计划

## 范围与证据

本次只读核对将设计源 [design/虚拟滚动树 + 双栏穿梭/code.html](../../../design/虚拟滚动树%20%2B%20双栏穿梭/code.html)、[screen.png](../../../design/虚拟滚动树%20%2B%20双栏穿梭/screen.png) 与当前 `linkx-fe/src/components/LxTransferPanel` 实现对照。运行页面为 `http://127.0.0.1:4175/components/lxtransferpanel`，使用独立 Chromium 采集桌面 `1440x900` 与窄屏 `375x812`，并检查正常、加载中、失败、空树、HUD、键盘焦点和 `prefers-reduced-motion: reduce`。

可复核产物：

- [capture.mjs](./capture.mjs)：只读浏览器采集脚本。
- [runtime.json](./runtime.json)：当前运行尺寸、状态和主题结果。
- `desktop-ready.png`、`desktop-hud.png`、`mobile-ready.png`、`state-loading.png`、`state-error.png`、`state-empty.png`：浏览器截图。

本轮未运行 detector、未读取 Assessment B 或旧评审，也没有修改产品源码。4175 服务为本轮采集启动的现有 VitePress 文档服务，当前保持运行。

## 设计基线

| 设计要求 | 设计源证据 |
|---|---|
| 桌面穿梭区使用 12 栅格 `5:2:5`；左右面板均为 `380px` | `code.html:403-406`、`code.html:501-512` |
| 左侧表头 36px、快速过滤 28px、底部状态 32px；树行保持 32px 紧凑密度 | `code.html:407-430`、`code.html:495-499`、`code.html:530-531` |
| 节点显示层级、选中/禁用状态和 code/status 徽标，如 `ORG-0100`、`CMD-OPER-01`、`24 人`、`RESTRICTED` | `code.html:253-330` |
| 右侧条目显示名称和 code 徽标 `ORG-01`、`DEPT-03`、`TRF-101`、`CMD-P01`、`SUB-22` | `code.html:532-585` |
| 右侧无结果文案为“暂无分配权限，请在左侧勾选” | `code.html:587-590` |
| 窄屏变为单列，批量按钮变为水平排列；设计稿仍为每个面板 `380px` 高 | `code.html:404`、`code.html:406`、`code.html:502`、`code.html:511` 中的 `grid-cols-1`、`md:col-span-*`、`md:flex-col`、`h-[380px]` |

## 当前实测

桌面 `1440x900` 的 `.lx-transfer-panel` 实际为 `688x382px`，网格列为 `314px 36px 314px`、间隔 `12px`；左右面板均为 `382px`。左树 viewport 是 `264px`，右侧已选列表实际可见区域只有 `138px`（虽然 `max-height` 为 `272px`）。当前左树默认只展开根节点，运行 DOM 只有“市公安局指挥中心”一行；当前已选列表只有“情指行一体化研判调度专班”和树外键 `legacy-unit-08`，没有 code/status 文本。

窄屏 `375x812` 页面宽度仍为 `375px`，没有横向溢出；布局列变为单列 `327px`。但左面板为 `391px` 高，右面板为 `263px` 高，左右面板不再保持设计基线的同高 `380px`。批量操作按钮、删除按钮和过滤输入框按当前移动规则升到 `44px`，这一点有利于触摸操作。

运行状态和交互核验结果：

- 加载中为 `role=status`，文案“组织权限数据加载中……”，面板暂时隐藏；失败为 `role=alert`，带“重试”；空树显示“暂无数据”，但右侧仍保留受控的 `unit-01`/`legacy-unit-08`。
- `HUD 深色主题` 会把面板背景切换为 `rgb(16, 26, 44)`，批量加入按钮为 `rgb(56, 189, 248)`；主题作用域限制在 Demo 容器内。
- `反选` 获得焦点时有 `2px solid` 可见轮廓；树继续使用 `LxVirtualTree` 的 roving tabindex 和方向键路径，批量、清空、删除按钮都有可访问名称。
- 减少动效下当前按钮和已选项的过渡约为 `1e-05s`，动画时长为 `0`，符合降级要求。

## 具体差距与实现建议

### P1：把 5:2:5 与 380px 变成真实布局契约

当前 [LxTransferPanel/index.vue](../../../linkx-fe/src/components/LxTransferPanel/index.vue) 只使用 `grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr)`（`index.vue:282-286`），中间列固定为 36px；设计稿要求中间操作槽占两份栅格，至少应保留能承载两个批量按钮及间距的稳定轨道。组件也没有给 `.lx-transfer-panel__panel` 设置 `height`，`panelHeight` 只被拆成左树 `panelHeight - 116`（`index.vue:185-188`）和右列表 `maxHeight: panelHeight - 108`（`index.vue:242-245`），所以当前实际高度由内容和 border 反推为 382px，移动端更出现 391px/263px 不齐。

建议：

1. 将桌面布局写成明确的 12 栅格或等价 `minmax(0, 5fr) minmax(72px, 2fr) minmax(0, 5fr)`，保留 `gap` 和最小宽度，避免操作槽在窄桌面退化为不可辨认的细缝。
2. 对每个面板设置 `height: clamp(120px, var(--lx-transfer-panel-height), 400px)`，并用 `grid-template-rows: auto minmax(0, 1fr) auto` 让树/列表填满中间轨道；`panelHeight` 继续作为唯一尺寸来源并明确 border-box 语义。
3. 设计若要求移动端仍保持 380px，则在单列模式也保留该高度；若产品希望移动端缩短，应单独登记 responsive 变体，并让左右面板使用同一个计算高度，不能由内容自然撑开成两个不同高度。

### P1：补齐节点 code/status 元数据的可观察呈现

当前 [types.ts](../../../linkx-fe/src/components/LxTransferPanel/types.ts) 只有 `LxVirtualTreeNode` 的通用节点类型；[LxVirtualTree/types.ts](../../../linkx-fe/src/components/LxVirtualTree/types.ts) 虽有索引签名，但没有明确的 `code`、`status` 或状态色契约。左侧模板只转发 `LxVirtualTree` 默认节点内容，右侧模板只渲染 `node.label`（`index.vue:246-253`），运行 DOM 也没有任何 code/status 文本。设计稿则把编码、人数/状态和禁用原因放在每一行右侧，右栏也显示每个授权节点的编码。

建议：

1. 为节点元数据增加明确类型（例如 `code?: string`、`status?: string`、`statusTone?: ...`），并保留未知业务字段不参与渲染；不要用隐式 `String(node.foo)` 代替契约。
2. 为 `LxTransferPanel` 增加具名 `node`/`selected-item` 插槽，或以类型化 slot props 将同一节点元数据分别交给左树和右清单；内容限制为单行、ellipsis，避免 32px 固定行高被长状态徽章撑破。
3. Demo 使用设计稿中的组织编码、人数、`RESTRICTED` 和权限编码数据，至少覆盖选中、禁用和普通节点，形成可视回归基准。左树默认展开根节点只应作为 Demo 选择，不能改变通用组件的默认展开语义。

### P2：对齐过滤和空态文案，区分两种“空”

设计稿左侧过滤提示为“快速过滤待分配单位...”，右侧为“在已选名单中检索...”（`code.html:421-528`）；当前左侧继承 `LxVirtualTree` 的“过滤节点”占位符，右侧是“在已选项中检索”（`index.vue:233-240`）。当前右侧空态是“暂无已选项”（`index.vue:262-267`），与设计稿的“暂无分配权限，请在左侧勾选”不一致。树数据为空时当前“暂无数据”是正确的宿主空树反馈，应与右侧清空后的授权空态分开。

建议：

- 提供左树过滤占位符/文案 prop，Demo 对齐设计稿并支持 code 搜索的文案预期；右侧保留独立筛选字段。
- 将右侧 empty copy 作为可配置文案，默认或 Demo 采用“暂无分配权限，请在左侧勾选”；清空操作后保留 `aria-live`/可读状态，避免只用视觉空白反馈。
- 左侧底部摘要补充“动态勾选自动穿梭”一类行为提示，或在 API 文档明确当前组件是受控批量穿梭而非勾选即自动移动，减少设计稿与实际行为的语义落差。

### P2：窄屏保持两个面板的节奏一致

当前 375px 没有页面横向溢出，44px 触控目标和水平批量按钮是合理的响应式处理；但第一面板比第二面板高 128px，用户在单列流程中需要跨越两个不同高度的工作区。设计代码通过 `grid-cols-1` 和 `h-[380px]` 表达的是单列但同高的两个面板。

建议先统一面板高度和内部滚动区域，再保留现有 44px 触控尺寸；如果产品决定移动端使用内容自适应高度，应同步更新设计稿/文档，并给列表设定相同的最小可滚动高度，避免右侧只有 263px 的短面板。

### P3：保留当前可访问性和主题降级，同时补面板语义

当前中间按钮、清空和删除按钮已有 `aria-label`/可见文字，树节点由 `LxVirtualTree` 提供方向键和 roving tabindex，焦点轮廓和减少动效均已实测通过；HUD 局部主题也已生效。设计稿本身主要是静态视觉样本，未提供这些语义契约，因此不应为追求外观删除现有可访问名称或 44px 点按区。

建议给左右面板加具名 `section`/`aria-labelledby`，让读屏用户能区分“组织与数据权限树（待选）”和“已选数据权限清单”；给右侧已选列表声明合适的 list/status 语义，并保持 HUD 下焦点与禁用文本对比度。主题切换仍建议只作用于 Demo 容器，避免示例误改文档站全局主题。

## 实现顺序

1. 先固定桌面/移动面板高度和 5:2:5 轨道，补运行断言验证两个面板同高、内部滚动不溢出。
2. 再建立 code/status 的类型化节点展示和插槽契约，补选中、禁用、长文案和树外键的回归案例。
3. 最后对齐过滤、右侧空态和底部摘要文案，复验 HUD、键盘、375px 和减少动效；所有自动化截图需区分设计稿静态对照、Mock 状态和真实后端联调。
