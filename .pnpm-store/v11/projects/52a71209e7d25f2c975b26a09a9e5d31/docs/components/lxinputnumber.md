# LxInputNumber 数字输入器

基于 Element Plus `el-input-number` 内核二次封装的数字输入器。默认宽 160px、值文字等宽 600 字重左对齐、步进钮右侧垂直拆分；步进钮 hover 图标转主色由 EP 内核原生提供。未声明的 EP props（`valueOnClear`/`autocomplete` 等）经 attrs 透传，兼容旧用法。

视觉规范源：`design/表单控件八件套/code.html` 05。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxInputNumber/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxInputNumber/demo/basic.vue
:::

## Props

| 名称               | 类型                            | 默认值           | 说明                                                                                      |
| ------------------ | ------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `modelValue`       | `number \| undefined`           | —                | 数值（v-model；清空后为 `undefined`）。                                                   |
| `min`              | `number`                        | `-Infinity`      | 最小值（达到后增加钮禁用）。                                                              |
| `max`              | `number`                        | `Infinity`       | 最大值（达到后减少钮禁用）。                                                              |
| `step`             | `number`                        | `1`              | 步长。                                                                                    |
| `stepStrictly`     | `boolean`                       | `false`          | 只允许输入步进的倍数。                                                                    |
| `precision`        | `number`                        | —                | 数值精度（小数位数）。                                                                    |
| `disabled`         | `boolean`                       | —（`undefined`） | 禁用态。默认未设置：`ElForm` 禁用态可正常传导；显式传 `true`/`false` 才覆盖继承。         |
| `controls`         | `boolean`                       | `true`           | 是否显示步进钮（`false` 时纯数字输入）。                                                  |
| `controlsPosition` | `'right' \| ''`                 | `'right'`        | 步进钮位置：Lx 默认 `right`（右侧垂直拆分，标本 05 唯一形态）；传 `''` 恢复 EP 两侧形态。 |
| `placeholder`      | `string`                        | `''`             | 占位文案。                                                                                |
| `align`            | `'left' \| 'right' \| 'center'` | `'left'`         | 值文字对齐：Lx 默认左对齐（标本 05 契约；EP 原生默认 `center`）。                         |
| `size`             | `'sm' \| 'md' \| 'lg'`          | `'md'`           | 工程尺寸：28 / 32 / 40px；档名区别于 EP 的 `small/default/large`。                        |
| `name`             | `string`                        | —                | 原生 name 属性（表单序列化 / 读屏关联）。                                                 |

## Events

| 名称                | 参数                                            | 说明                           |
| ------------------- | ----------------------------------------------- | ------------------------------ |
| `update:modelValue` | `(value: number \| undefined)`                  | 数值变化。                     |
| `change`            | `(currentValue, oldValue: number \| undefined)` | 值变化确认（失焦或步进）派发。 |
| `focus`             | `(event: FocusEvent)`                           | 聚焦。                         |
| `blur`              | `(event: FocusEvent)`                           | 失焦。                         |

## Slots

无专属插槽。EP 内核未提供具名插槽；前缀图标等场景请使用 `LxInput` + 数字校验。

## Exposes

| 方法    | 参数 | 说明         |
| ------- | ---- | ------------ |
| `focus` | —    | 聚焦输入框。 |
| `blur`  | —    | 移除焦点。   |

## 对齐说明

- 默认宽 160px（标本 05 `w-40`；EP 原生 150px），`sm`/`lg` 档宽度随 EP 原生。
- 值文字等宽字体 + 600 字重由组件样式锚定；左对齐经 EP 原生 `align` prop 实现（根类 `is-left`）。
- 步进钮 hover 图标转主色为 EP 内核原生行为，组件样式仅补触屏档步进钮高度与 hover 背景态。
- 键盘操作：↑/↓ 步进、Shift+↑/↓ 大步进（×10）、输入任意数值失焦确认；禁用态阻断全部交互。
- `valueOnClear`/`autocomplete`/`validateEvent` 等低频 props 经 attrs 透传，行为与 EP 内核一致。

## 可访问性

- 步进钮为 EP 原生 button，带 `aria-label`（增加/减少）与禁用态语义。
- 值文字 `tabular-nums` 等宽数字呈现，避免步进时宽度抖动。
- 键盘焦点环由 EP 原生 focus 样式承接；触屏档（`hover: none`）步进钮高度放大至最小触控目标。
