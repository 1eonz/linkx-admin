# Element Plus 基础控件桥接

`lx-ui/style.css` 为 Element Plus 提供 LinkX 设计令牌与状态样式。基础控件沿用 Element Plus 的数据、事件和校验契约；此页使用库入口导出的原生控件，检查 `design/按钮体系/` 与 `design/表单控件八件套/` 的实际渲染。

<script setup lang="ts">
import ControlBridge from '../../src/components/LxForm/demo/control-bridge.vue';
</script>

<ControlBridge />

::: details 查看示例代码
<<< ../../src/components/LxForm/demo/control-bridge.vue
:::

上方覆盖 28/32/40px 按钮、默认/危险/禁用态，以及文本输入、普通选择、单选、复选、数字、日期范围、开关和文本域。点击“校验表单”可检查必填错误与恢复；键盘 Tab 可检查控件焦点，HUD 开关用于检查深色令牌。示例只使用本地表单数据，不访问接口。

## 接入

```ts
import { ElButton, ElInput, ElSelect } from 'lx-ui'
import 'lx-ui/style.css'
```

没有专用 Lx 封装的基础控件可直接从 `lx-ui` 使用其导出的 Element Plus 控件。`LxDynamicForm` 在本桥接之上组合 schema 字段；是否采用 schema 表单取决于页面的实际复用和联动需求。Vue3 宿主移除 `element-plus` 直依赖前仍需完成导入、自动导入、类型、样式与构建配置迁移。

## 状态与边界

- 样式桥接覆盖按钮尺寸与语义色、输入/选择悬停和焦点、表单错误态、单选/复选键盘焦点，以及 tabs、card、tree、descriptions 等共享令牌。
- 表单校验、选择和日期值仍由 Element Plus 处理；本桥接不改业务提交时机或旧页面的字段契约。
- 加载、空结果和网络错误属于宿主数据状态，此基础控件示例没有请求。远程选择、上传等组件应在各自 Demo 中使用宿主注入的 Mock adapter 验收。
- 动效服从库的 `prefers-reduced-motion` 规则；本页只是基础控件桥接验收入口，不代表其他 lx-ui 组件或 Vue3 页面已完成替换。
