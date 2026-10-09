# Assessment A：DOM 与 ARIA 观察

此记录只依据本轮指定源码与独立浏览器证据，不代表完整自动化无障碍审计或真实读屏器验收。

## LxVirtualTree

- 根容器使用 `role="tree"`、可配置 `aria-label`，有复选框时提供 `aria-multiselectable`。每个可见行提供 `role="treeitem"`、`aria-level`、`aria-posinset`、`aria-setsize`、展开/勾选/禁用状态和单 Tab 停靠点。
- 过滤框与清除按钮均有中文 accessible name。选择范围、选择结果和过滤命中数通过 `role="status"` / `aria-live="polite"` 呈现。
- 浏览器输入 `执勤单元 01` 后状态为“筛选匹配到 12 个节点；路径祖先不计入数量”，DOM 中渲染 21 个 treeitem（12 个命中及对应祖先）。这是当前过滤计数与可见树路径相符的可观察证据。
- 键盘聚焦的 treeitem 命中 `:focus-visible`，得到 2px 实线轮廓；空数据保留树并显示空文案，加载中由宿主状态包替换树，错误由 `role="alert"` 和“重试”按钮呈现。

## LxTransferPanel

- 左侧树有“待选资源树”名称；中间批量按钮有明确 accessible name，达到限制时用 `aria-describedby` 关联完整禁用原因；右侧列表名称包括当前显示数和总数。
- 已选列表可聚焦滚动。未展示的已选数量通过独立 live status 提醒并关联到列表；移除按钮按节点提供名称。
- 继承复选框始终关联说明。采集的缺失说明状态中，开关禁用、描述元素存在且显示“尚未配置经确认的具体继承范围说明，当前不可更改此选项。”
- 宿主 loading 状态设置 `aria-busy="true"` 并将组件置为 inert；状态消息为 `role="status"`。error 状态以 `role="alert"` 呈现，提示选择保留并提供重试。
- 清空确认的可见内容包含总数和未加载键数量：“已选项中包含 1 个当前树中未加载的项目，无法核对其名称。确认移除全部 4 项吗？”。取消与确认操作都有文字标签。
- 375px 的移动面板切换键带两侧数量、`aria-pressed` 和可见焦点；隐藏面板被从视觉和焦点流程移除。本轮 keyboard capture 中切换键焦点轮廓为 2px。

## 仍未验证

- NVDA、VoiceOver 等真实读屏器对树项内嵌 checkbox、live region 更新和弹窗焦点顺序的实际朗读。
- 200% 缩放、系统级高对比度和真实触控设备的交互结果。
- 组件级减少动效的完整规则覆盖；本轮只确认媒体查询命中及采样到的计算时长近似为零。
