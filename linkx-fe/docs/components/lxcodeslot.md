# LxCodeSlot 编号代码槽

用于警号、节点编号、车牌和案件号等需要等宽显示的短标识。默认支持键盘可达的复制动作，纯展示场景可关闭复制。

<script setup lang="ts">
import Basic from '../../src/components/LxCodeSlot/demo/basic.vue'
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxCodeSlot/demo/basic.vue
:::

## Props

| 名称       | 类型      | 默认值  | 说明                                 |
| ---------- | --------- | ------- | ------------------------------------ |
| `copyable` | `boolean` | `true`  | 是否显示复制按钮并响应 Enter/Space。 |
| `ellipsis` | `boolean` | `false` | 长代码是否在单行内省略。             |

## Events

| 名称   | 参数              | 说明             |
| ------ | ----------------- | ---------------- |
| `copy` | `(value: string)` | 复制成功后触发。 |

## 透传属性与边界行为

- 未显式传入 `aria-label` 时，复制按钮会使用“复制代码：当前值”作为可访问名称；`LxDescriptions` 等宿主传入的字段名称会原样保留。
- 复制进行中按钮设置 `aria-busy="true"` 并暂时防止重复提交；复制成功后才触发 `copy` 事件。
- 内容为空时不会触发 `copy`，并提示“暂无可复制内容”；剪贴板不可用或拒绝时提示“复制失败，请手动复制”。
- 视口宽度不超过 640px 时，复制按钮最小触控高度为 44px；只读 `copyable=false` 仍保持非焦点的展示语义。

## 行为与无障碍

- copyable=true 时渲染原生按钮，可用鼠标、Enter 或空格复制；成功后发出 copy 事件并显示成功提示，剪贴板不可用时显示手动复制提示。复制按钮的可访问名称默认包含当前值，也可通过 `aria-label` 覆盖。
- ellipsis=true 时悬浮提示完整编号；复制按钮的提示同时说明点击复制。copyable=false 时只读展示，不提供焦点或复制动作。
- Demo 可切换 HUD 深色主题；组件遵守 prefers-reduced-motion，窄容器内允许编号省略。

## 设计对照

- 使用 `--lx-font-mono` 与 `tabular-nums` 保持编号稳定。
- 2px 微标签圆角、1px token 边框和主色 hover 与设计稿代码槽一致。
- 复制按钮有可见键盘焦点，`prefers-reduced-motion: reduce` 时关闭颜色过渡。
