# LxSelect 主会话现场复验记录

日期：2026-10-05；目标：`http://127.0.0.1:4174/components/lxselect.html`
结论：阶段性浏览器复验，不构成 Impeccable 正式 Critique 通过。本记录包含首次观察与改动后的主会话复验；最新的失败空态和离线禁用项另由 Assessment B 现场确认。

## 浏览器观察

- 页面可访问，桌面默认视口为 1280×720；文档根节点和 body 的 `scrollWidth` 均为 1265px。
- 在 320×800 视口下，文档根节点和 body 的 `scrollWidth` 均为 320px；六个 Select 触发器高度均为 44px。
- 改动前的现场观察确认远程失败场景显示与输入框关联的 `role="alert"`，展开选择器后 footer 可见“重试”，弹层右边界 271px、底边界 533px，均留在 320×800 视口内。改动后的当前文案“请求失败，未加载候选项”、重试恢复及离线选项 disabled 状态由 Assessment B 在同一页面复验，见 `assessment-b-final/browser-evidence.md`。
- HUD 开启时，传送到 body 的可见选项菜单使用深色表面 `rgb(22, 35, 58)`，选中项使用局部主色 `rgb(56, 189, 248)`；页面根节点保持 LinkX 默认主色 `#0060a9`，没有被 popper 主题覆盖。
- 多选示例新增“反恐怖与特巡警支队（离线）”不可选候选项。对应 E2E 检查 `aria-disabled="true"`，Assessment B 确认点击不会改变已选值。
- 文档 API 表格和代码示例在 320px 下可在各自容器中横向查看；本次测量的文档根宽度没有超出 320px。此项是文档内容滚动，不记为 Select 触发器或弹层越界。

## 证据限制

- 以上为主会话可见页面的只读 DOM 测量和人工操作；CUA 截图仅显示在当次工作会话中，没有保存为可复用的截图文件。Assessment B 的独立确认见其浏览器记录。
- 未执行页面脚本注入；因此没有用户可见 overlay、逐状态 overlay 计数或正式 Critique snapshot/trend。本记录不替代 Impeccable Assessment A/B 的严格要求。
- 仅针对组件文档 Demo 与本地数据；没有触发真实接口、权限或后端操作。
