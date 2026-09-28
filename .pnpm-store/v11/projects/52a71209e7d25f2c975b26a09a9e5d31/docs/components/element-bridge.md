# Element Plus 基础控件桥接

`lx-ui/style.css` 为 Element Plus 提供 LinkX 设计令牌与状态样式。基础控件沿用 Element Plus 的数据、事件和校验契约；此页使用库入口导出的原生控件，检查 `design/按钮体系/` 与 `design/表单控件八件套/` 的实际渲染。

<script setup lang="ts">
import ControlBridge from '../../src/components/LxForm/demo/control-bridge.vue';
</script>

<ControlBridge />

::: details 查看示例代码
<<< ../../src/components/LxForm/demo/control-bridge.vue
:::

上方覆盖 28/32/40px 按钮、默认/危险/禁用态，以及文本输入、普通选择、多选下拉、单选、复选、数字、日期范围、开关和文本域。通知渠道的全选项与子项分行缩进，用于辨认三态和组间距；协同部门多选用于检查标签折叠与键盘焦点。点击“校验表单”可检查必填错误与恢复，HUD 开关用于检查深色令牌。示例只使用本地表单数据，不访问接口。

## 接入

```ts
import { ElButton, ElInput, ElSelect } from 'lx-ui'
import 'lx-ui/style.css'
```

没有专用 Lx 封装的基础控件可直接从 `lx-ui` 使用其导出的 Element Plus 控件。`LxDynamicForm` 在本桥接之上组合 schema 字段；是否采用 schema 表单取决于页面的实际复用和联动需求。Vue3 宿主移除 `element-plus` 直依赖前仍需完成导入、自动导入、类型、样式与构建配置迁移。

## 状态与边界

- 样式桥接覆盖按钮尺寸与语义色、表单控件悬停和焦点、错误态、单选/复选键盘焦点，以及 tabs、card、tree、descriptions 等共享令牌。文本输入、数字输入、日期范围选择和文本域的焦点使用贴边 1px 状态边线与紧邻的 2px、15% 主题主色光晕；单选与多选下拉统一用控件自身 1px `border-box` 实体边框表达焦点，不绘制外扩第二圈。普通焦点使用主色边框，错误焦点保留错误色边框；下拉不使用 `box-shadow` 或 `outline`，`border-box` 保证焦点状态不改变控件尺寸、标签折叠或选择行为。复选框焦点保留 14px 方框的 1px 状态边线，在边界外零间隙显示 2px 焦点环，不偏移 outline、不改变方框尺寸；HUD 未选复选框使用深色填充和高对比边线，全选项与子项分行缩进。
- 表单校验、选择和日期值仍由 Element Plus 处理；本桥接不改业务提交时机或旧页面的字段契约。
- 加载、空结果和网络错误属于宿主数据状态，此基础控件示例没有请求。远程选择、上传等组件应在各自 Demo 中使用宿主注入的 Mock adapter 验收。
- 动效服从库的 `prefers-reduced-motion` 规则；本页只是基础控件桥接验收入口，不代表其他 lx-ui 组件或 Vue3 页面已完成替换。
