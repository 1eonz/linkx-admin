# Wave 7 最终修复差异代码审查

审查范围为 `LxTransferPanel`、`LxVirtualTree` 的组件、类型、Demo、中文文档，两份宿主 unit/E2E，以及 `NewComponentsDemo.vue`。未读取 Impeccable Assessment A/B 报告。

## Findings

### [P2] 新必填属性构成已公开组件的兼容性变更

`linkx-fe/src/components/LxTransferPanel/types.ts:43` 将 `inheritChildDescription` 加为必填；`LxTransferPanel` 和 `LxTransferPanelProps` 已在 `linkx-fe/src/index.ts:112`、`linkx-fe/src/index.ts:203` 公开，而旧版 props 类型没有该字段。未传此属性的既有 TypeScript 调用方会遇到类型错误；不经过类型检查的调用方会得到禁用的继承开关（`linkx-fe/src/components/LxTransferPanel/index.vue:999`）。仓库内组件 Demo、`NewComponentsDemo.vue` 和宿主测试已提供说明，但这些更新不能覆盖下游消费者。该必填契约符合本次说明语义要求，应在发布时作为破坏性 API 变化处理并提供迁移说明；若要求兼容旧调用方，则需保留兼容入口及明确的运行时行为。

## 重点核查

- 继承说明以非空裁剪结果作为启用条件；缺失或纯空白时显示提示并禁用开关。组件给说明生成稳定 ID，并同步关联到内部原生复选框；unit 和 E2E 均检查了属性更新、空白回退及 `aria-describedby`。
- 窄屏树行使用 64px/80px 固定行高，标签限制两行，元数据限制一行并裁切；320px E2E 检查了标签与元数据的边界，视口断点用例检查行高、焦点和滚动锚点。源码未发现行内容撑破固定高度的问题。
- 筛选树按匹配节点和祖先构建可见层级；过滤展开状态同时用于行和展开按钮的 `aria-expanded`，左右方向键读取同一展开状态并维持树项焦点。`aria-posinset`/`aria-setsize` 由筛选后的同级集合计算，不受虚拟窗口行数影响。
- 级联播报按实际变更键计算新增/取消数量；受控值与播报快照不一致时回退为当前选中数。unit 覆盖受控值回写及后续外部变化。
- 新增或增强的测试断言针对旧实现没有的筛选展开语义、过滤后位置属性、级联数量播报、继承说明关联及响应式行高，因此按源码对照具备区分旧实现的能力；本次未实际检出旧实现并重跑。

## 验证与残余风险

本次为源码和差异审查，没有运行 unit、E2E 或浏览器。浏览器渲染、真实读屏行为及断点布局仍未由本次复验确认；尤其 360–420px 下的树行内容边界没有独立的浏览器实测证据。下游消费者是否已迁移到必填说明属性也无法从仓库内调用点确认。
