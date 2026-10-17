# LxInput 文本输入框

基于 Element Plus `el-input` 内核二次封装的文本输入框。32px 基准高、4px 圆角、主色焦点光环；错误态红边浅红底深红值由全局令牌桥承接 `LxForm` 校验上下文自动生效；`mono` 开启等宽值呈现。未声明的 EP props（`formatter`/`parser` 等）经 attrs 透传，兼容旧用法。

视觉规范源：`design/表单控件八件套/code.html` 01。

## 最小示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LxInput } from 'lx-ui'

const officerName = ref('')
</script>

<template>
  <label for="officer-name">警员姓名 / 警号</label>
  <LxInput
    id="officer-name"
    v-model="officerName"
    placeholder="请输入警员姓名/警号"
    clearable
  />
</template>
```

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxInput/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxInput/demo/basic.vue
:::

## Props

| 名称                  | 类型                   | 默认值           | 说明                                                                                                                 |
| --------------------- | ---------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `modelValue`          | `string \| number`     | `''`             | 输入值（v-model）。                                                                                                  |
| `type`                | `string`               | `'text'`         | 原生 input type（`text`/`password` 等）；文本域请使用 `LxTextarea`。                                                 |
| `placeholder`         | `string`               | `''`             | 占位文案。                                                                                                           |
| `disabled`            | `boolean`              | —（`undefined`） | 禁用态：灰底 + 禁用手势（标本 01 禁用行）。默认未设置：`ElForm` 禁用态可正常传导；显式传 `true`/`false` 才覆盖继承。 |
| `readonly`            | `boolean`              | `false`          | 只读态：可聚焦不可改值。                                                                                             |
| `required`            | `boolean`              | `false`          | 原生必填语义；业务表单规则仍由 `LxForm` 管理。                                                                       |
| `clearable`           | `boolean`              | `false`          | 可清空：有值时桌面聚焦/悬停可见；触屏或窄屏也仅在有值时显示；禁用或只读时不可清空。                                  |
| `clearButtonTabbable` | `boolean`              | `true`           | 控制可见清空按钮是否进入 Tab 顺序；带有同级显隐操作的复合输入可关闭。                                                |
| `showPassword`        | `boolean`              | `false`          | 密码明暗切换（仅 `type="password"` 生效）。                                                                          |
| `maxlength`           | `number`               | —                | 最大长度；与 `showWordLimit` 联动出现计数器（硬截断）。                                                              |
| `minlength`           | `number`               | —                | 最小长度（表单校验契约，不产生视觉反馈）。                                                                           |
| `showWordLimit`       | `boolean`              | `false`          | 显示字数统计（等宽 11px 右下角）。                                                                                   |
| `mono`                | `boolean`              | `false`          | 值用等宽字体：警号、证件号、编码等机器读数字段开启（标本 01 font-mono）。                                            |
| `size`                | `'sm' \| 'md' \| 'lg'` | `'md'`           | 工程尺寸：28 / 32 / 40px；档名区别于 EP 的 `small/default/large`。                                                   |
| `name`                | `string`               | —                | 原生 name 属性，用于表单提交和序列化；不会提供控件可访问名称。                                                       |
| `autocomplete`        | `string`               | `'off'`          | 原生自动完成提示；浏览器或密码管理器可能忽略该值，不能作为敏感信息保护措施。                                         |

## Events

| 名称                | 参数                  | 说明                                       |
| ------------------- | --------------------- | ------------------------------------------ |
| `update:modelValue` | `(value: string)`     | 输入值变化。                               |
| `input`             | `(value: string)`     | 输入事件（EP 内核原生）。                  |
| `change`            | `(value: string)`     | 输入后失焦且值变化时派发；清空时立即派发。 |
| `focus`             | `(event: FocusEvent)` | 聚焦。                                     |
| `blur`              | `(event: FocusEvent)` | 失焦。                                     |
| `clear`             | —                     | 点击清除按钮。                             |

## Slots

| 名称      | 说明                     |
| --------- | ------------------------ |
| `prefix`  | 输入框内前置内容（图标） |
| `suffix`  | 输入框内后置内容         |
| `prepend` | 输入框外前置复合块       |
| `append`  | 输入框外后置复合块       |

## Exposes

| 名称     | 说明           |
| -------- | -------------- |
| `focus`  | 聚焦输入框。   |
| `blur`   | 移除焦点。     |
| `select` | 选中全部文本。 |

## 错误态

错误态不通过组件 props 声明：置于 `LxForm`/`LxFormItem` 校验上下文内，校验失败自动使用表单专属令牌 `--lx-color-form-error`（浅色 `#ba1a1a`，HUD `#f78989`）和 `--lx-color-form-error-bg`（浅色 `#fff5f5`，HUD 半透明红底）。输入值、边线及字段错误文案遵循同一表单校验色；危险按钮和删除链接继续使用独立的语义危险色。

## 与标本的有意识偏差

| 偏差项     | 标本           | 实现                                                    | 依据                                                                                    |
| ---------- | -------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 计数器字号 | 10px           | 11px + `--lx-color-on-input`                            | 10px 过小影响可读性；文字在实际输入表面保持至少 4.5:1，对比度由亮色/HUD 浏览器 E2E 校验 |
| 禁用锁图标 | lock 图标      | 裁剪                                                    | DESIGN-SYNC-AUDIT 终裁裁剪项                                                            |
| 触控目标   | 32px           | 无悬停设备或视口宽度不超过 640px 时为 44px              | 与 Radio/Checkbox/Switch 同族触控契约（critique 2026-09-29 P2 修正）                    |
| 清空入口   | 默认态图标常驻 | 有值时桌面 hover/focus 显示；触屏或窄屏也仅在有值时显示 | 保留常见输入框交互，减少桌面常驻图标；触屏无需 hover 即可发现并操作。                   |

## 可访问性

- 使用可见 `<label for="...">` 与唯一 `id` 关联，或使用宿主表单的标签能力，为输入框提供可访问名称。
- `name` 仅用于表单提交和序列化，不会为控件命名；`required` 传递原生必填语义。
- `clearable` 使用带“清空输入框”名称的按钮，可通过 Tab、Enter 和空格键操作；桌面有值时聚焦或悬停显示，触屏或窄屏在有值时直接显示入口。
- `disabled` 或 `readonly` 时清空按钮禁用并退出键盘顺序；按钮通过键盘获焦后会保持显示。
- `autocomplete="off"` 仅为浏览器提示，部分浏览器或密码管理器仍可能自动填充，不能保护涉密信息；开启“减少动效”偏好时过渡动画会关闭。

## Vue3 宿主适配

业务层直接使用 `LxInput`（或全局组件名 `<LxInput />`）。密码场景已有 `LxPasswordInput`（含防复制粘贴），通用文本输入用本组件；宿主存量 `el-input` 直用页面按 UI-04 波次另行替换。
