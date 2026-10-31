# LxInputNumber 数字输入器

基于 Element Plus `el-input-number` 内核二次封装的数字输入器。默认宽 160px、值文字等宽 600 字重左对齐、步进钮右侧垂直拆分；默认 Lx 步进按钮使用库内令牌呈现 hover 状态。未声明的 EP props（`valueOnClear`/`autocomplete` 等）经 attrs 透传，兼容旧用法。

视觉规范源：`design/表单控件八件套/code.html` 05。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxInputNumber/demo/basic.vue';
import FormState from '../../src/components/LxInputNumber/demo/form-state.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxInputNumber/demo/basic.vue
:::

## 表单校验与实例方法

<FormState />

空值触发必填校验；控件允许录入 0 至 20，本地业务规则要求 1 至 10，以便展示规则失败与纠正恢复。错误文案由 `LxFormItem` 关联至实际输入，原有帮助说明仍保留。校验失败聚焦首个错误字段；重置恢复空值并清理错误。

聚焦和失焦按钮分别调用实例的 `focus()`、`blur()`，下方反馈记录实际字段事件。失焦按钮阻止指针按下时的默认焦点转移，以便验证焦点确实由 `blur()` 移除；键盘仍可正常聚焦并激活按钮。示例仅在本地执行校验，不访问业务 API。

::: details 查看表单示例代码
<<< ../../src/components/LxInputNumber/demo/form-state.vue
:::

## Props

字段通过 `id` 与外部 `<label for>` 关联，`id` 经 attrs 传入内核的原生数字输入。步进按钮使用独立的中文可访问名称，不替代数值字段标签。

| 名称               | 类型                            | 默认值           | 说明                                                                                      |
| ------------------ | ------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `modelValue`       | `number \| undefined`           | —                | 数值（v-model；清空后为 `undefined`）。                                                   |
| `min`              | `number`                        | `-Infinity`      | 最小值（达到后减少钮禁用）。                                                              |
| `max`              | `number`                        | `Infinity`       | 最大值（达到后增加钮禁用）。                                                              |
| `step`             | `number`                        | `1`              | 步长。                                                                                    |
| `stepStrictly`     | `boolean`                       | `false`          | 只允许输入步进的倍数。                                                                    |
| `precision`        | `number`                        | —                | 数值精度（小数位数）。                                                                    |
| `disabled`         | `boolean`                       | —（`undefined`） | 禁用态。默认未设置：`ElForm` 禁用态可正常传导；显式传 `true`/`false` 才覆盖继承。         |
| `readonly`         | `boolean`                       | `false`          | 限制输入框直接键入；独立步进钮仍可调整，达到 `min`/`max` 时禁用对应方向。                 |
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

无专属插槽。前缀/后缀装饰等场景请使用 `LxInput` + 数字校验；默认右侧步进按钮由组件内部管理。

## Exposes

| 方法    | 参数 | 说明         |
| ------- | ---- | ------------ |
| `focus` | —    | 聚焦输入框。 |
| `blur`  | —    | 移除焦点。   |

## 对齐说明

- 默认宽 160px（标本 05 `w-40`；EP 原生 150px），`sm`/`lg` 档宽度随 EP 原生。
- 尺寸外框高度严格映射 `sm=28px`、`md=32px`、`lg=40px`；触屏或窄屏下带步进钮的控件扩大为 44px 高。
- `readonly` 只禁止输入框直接录入，不影响独立步进操作；`disabled` 才会同时禁止输入与步进。
- 值文字等宽字体 + 600 字重由组件样式锚定；左对齐经 EP 原生 `align` prop 实现（根类 `is-left`）。
- 默认右侧步进按钮由 Lx 原生按钮实现，hover 文字色与底色使用组件令牌；显式设置 `controlsPosition=""` 时保留 Element Plus 两侧控件。
- 键盘操作：输入框聚焦时，↑/↓ 按 `step` 调整；步进按钮可通过 Tab 聚焦，以 Enter 或空格键触发。当前不支持 Shift 倍增步长；输入数值后失焦确认。
- `valueOnClear`/`autocomplete`/`validateEvent` 等低频 props 经 attrs 透传，行为与 EP 内核一致。

## 可访问性

桌面端右侧步进按钮按触发器实际高度上下连续贴合，中间只保留 1px 分隔线；sm、md、lg 不会出现按钮之间的空白。触屏或窄屏下，默认右侧步进按钮改为并排布局，每个触控区域为 44×44px，控件宽度按可用空间收缩。包装组件会把 `id`、`name` 和自动填充属性同步到实际数字输入框，Demo 的可见标签可直接关联到输入。

- 默认步进钮使用原生 `button`，提供中文可访问名称、键盘焦点、原生禁用语义及 `aria-disabled` 状态；`controlsPosition=""` 时沿用 Element Plus 内核控件。
- 值文字 `tabular-nums` 等宽数字呈现，避免步进时宽度抖动。
- 输入框与步进钮均提供可见键盘焦点；禁用或达到边界的步进钮不进入 Tab 顺序。
- 长按在释放、指针取消、窗口失焦、控件隐藏或切换形态、禁用及组件卸载时结束；恢复显示或解除禁用不会自动恢复上一次长按。
