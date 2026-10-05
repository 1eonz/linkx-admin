# LxCheckbox / LxCheckboxGroup 复选组

基于 Element Plus `el-checkbox` / `el-checkbox-group` 内核封装，支持独立布尔值、多选组、半选状态和横纵排布。

视觉规范源：`design/表单控件八件套/code.html` 04。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxCheckbox/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxCheckbox/demo/basic.vue
:::

## LxCheckbox Props

| 名称            | 类型                          | 默认值           | 说明                                                                                                                                                                                              |
| --------------- | ----------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `string \| number \| boolean` | —                | v-model（独立使用时 boolean，组内由 Group 接管）。                                                                                                                                                |
| `value`         | `string \| number`            | —                | 组内该项的选中值（配合 `LxCheckboxGroup`；组选项值不支持 boolean）。                                                                                                                              |
| `label`         | `string`                      | `''`             | 无插槽时的文字回退；未传 `value` 时兼作选中值（EP 旧契约兼容）。                                                                                                                                  |
| `disabled`      | `boolean`                     | —（`undefined`） | 禁用态：浅色主题文字使用 `--lx-color-info`（`#909399`），HUD 下跟随 HUD 次级文字色；灰底状态对照标本 04“需支队审批”行。默认未设置：不阻断 `LxCheckboxGroup` / `ElForm` 禁用继承；显式传值才覆盖。 |
| `indeterminate` | `boolean`                     | `false`          | 半选态：主色填充 + 白色横杠；不修改值，并向辅助技术暴露混合态。                                                                                                                                   |
| `name`          | `string`                      | —                | 原生 name；组内缺省由 Group 注入。                                                                                                                                                                |

## LxCheckboxGroup Props

| 名称         | 类型                   | 默认值           | 说明                                                                            |
| ------------ | ---------------------- | ---------------- | ------------------------------------------------------------------------------- |
| `modelValue` | `(string \| number)[]` | `[]`             | 当前选中值集合（v-model）；组选项值只支持字符串或数字。                         |
| `disabled`   | `boolean`              | —（`undefined`） | 整组禁用；缺省时继承 `ElForm` 禁用状态，显式传入 `true` 或 `false` 时覆盖继承。 |
| `vertical`   | `boolean`              | `false`          | 垂直排布（标本 04 权限列表）。                                                  |
| `name`       | `string`               | —                | 原生 name，注入组内全部 `LxCheckbox`。                                          |

## Events

| 组件              | 事件                | 参数                   | 说明               |
| ----------------- | ------------------- | ---------------------- | ------------------ |
| `LxCheckbox`      | `update:modelValue` | `(value)`              | 独立使用勾选变化。 |
| `LxCheckbox`      | `change`            | `(value)`              | 勾选变化。         |
| `LxCheckboxGroup` | `update:modelValue` | `(string \| number)[]` | 选中集合变化。     |
| `LxCheckboxGroup` | `change`            | `(string \| number)[]` | 选中集合变化。     |

## Slots

| 组件              | 名称      | 说明                              |
| ----------------- | --------- | --------------------------------- |
| `LxCheckbox`      | `default` | 选项文字；缺省回退 `label` prop。 |
| `LxCheckboxGroup` | `default` | 组内选项，放 `LxCheckbox`。       |

## 全选/半选联动

父级全选项由子集推导勾选态，`indeterminate` 表达部分选中（标本 04"警单流转"行）：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

const all = ['video', 'dispatch', 'broadcast']
const checked = ref(['video'])
const allToggled = computed(() => checked.value.length === all.length)
const someChecked = computed(
  () => checked.value.length > 0 && checked.value.length < all.length,
)
function toggleAll(next: boolean) {
  checked.value = next ? [...all] : []
}
</script>

<template>
  <LxCheckbox
    :model-value="allToggled"
    :indeterminate="someChecked"
    @update:model-value="toggleAll"
  >
    全部授权
  </LxCheckbox>
</template>
```

## 与标本的对齐说明

| 契约项    | 标本 04              | 实现                                    |
| --------- | -------------------- | --------------------------------------- |
| 选中/半选 | 主色填充白勾/横杠    | EP 原生契约，组件级固化防漂移           |
| hover     | 描边与文字同步转主色 | 组件级固化                              |
| 水平间距  | 16px                 | `--lx-space-lg`，覆盖 EP 默认 32px 右距 |
| 垂直行距  | space-y-3（12px）    | `--lx-space-md`                         |
| HUD 深色  | —                    | 填充跟随 HUD 战术蓝（el-* 变量）        |

## 可访问性

原生 `input[type=checkbox]` 语义；半选态同步设置原生 `indeterminate` 属性和 `aria-checked="mixed"`，不修改 v-model 值。触屏设备整个 label 的最小高度为 44px。HUD 深色主题下禁用项使用深色中性底和可辨认的浅色文字；已选或半选的禁用项不会套用可操作状态的主色填充。

## Vue3 宿主适配

业务层使用 `LxCheckboxGroup` + `LxCheckbox` 组合，独立勾选场景单用 `LxCheckbox`。`element-theme.css` 对裸 `el-checkbox` 的全局同款覆写保留过渡期。
