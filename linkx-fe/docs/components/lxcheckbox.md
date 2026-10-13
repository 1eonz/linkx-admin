# LxCheckbox / LxCheckboxGroup 复选组

基于 Element Plus `el-checkbox` / `el-checkbox-group` 内核封装，支持独立布尔值、多选组、半选状态和横纵排布。

## 交互示例

<script setup lang="ts">
import { useResponsiveDocTable } from '../.vitepress/theme/useResponsiveDocTable';
import Basic from '../../src/components/LxCheckbox/demo/basic.vue';

useResponsiveDocTable(24);
</script>

<Basic />

## 表单校验与错误恢复

Demo 首屏展示授权组的选中值与 `change` 反馈、独立确认及必填校验。旧版 `label` 组选中值兼容、禁用状态回显、整组禁用和 `LxForm` 禁用继承收在“旧值兼容与禁用继承示例”折叠区中。必填权限组未选择时提交会显示字段错误；选择至少一项后再次提交即可通过，也可重置表单。示例只使用 `LxForm`、`LxFormItem` 和组件库控件，不会发送业务请求。

::: details 查看示例代码
<<< ../../src/components/LxCheckbox/demo/basic.vue
:::

## LxCheckbox Props

<p id="lx-checkbox-props-hint" class="lx-doc-table-scroll-hint lx-selection-control-doc-table-hint">表格可横向滚动；聚焦表格后可用方向键浏览。</p>

| 名称            | 类型                          | 默认值           | 说明                                                                                                  |
| --------------- | ----------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `modelValue`    | `string \| number \| boolean` | —                | v-model（独立使用时 boolean，组内由 Group 接管）。                                                    |
| `value`         | `string \| number`            | —                | 组内该项的选中值（配合 `LxCheckboxGroup`；组选项值不支持 boolean）。                                  |
| `label`         | `string`                      | `''`             | 无插槽时的文字回退；未传 `value` 时兼作选中值，组件会将它映射到内核的 `value`。                       |
| `disabled`      | `boolean`                     | —（`undefined`） | 禁用态主题与继承规则见下方说明。                                                                      |
| `indeterminate` | `boolean`                     | `false`          | 半选态：可操作时主色填充 + 白色横杠；禁用时保留灰底并使用中性横杠；不修改值，并向辅助技术暴露混合态。 |
| `name`          | `string`                      | —                | 原生 name；组内缺省由 Group 注入。                                                                    |

<details class="lx-selection-control-doc-details">
<summary>禁用态主题与继承规则</summary>

浅色主题文字使用 `--lx-color-info`（`#909399`），灰底状态见标本 04“需支队审批”行；HUD 深色主题跟随 HUD 次级文字色。`disabled` 默认未设置时不阻断 `LxCheckboxGroup` / `ElForm` 的禁用继承；显式传入 `true` 或 `false` 才覆盖继承。

</details>

## LxCheckboxGroup Props

<p id="lx-checkbox-group-props-hint" class="lx-doc-table-scroll-hint lx-selection-control-doc-table-hint">表格可横向滚动；聚焦表格后可用方向键浏览。</p>

| 名称         | 类型                   | 默认值           | 说明                                                    |
| ------------ | ---------------------- | ---------------- | ------------------------------------------------------- |
| `modelValue` | `(string \| number)[]` | `[]`             | 当前选中值集合（v-model）；组选项值只支持字符串或数字。 |
| `disabled`   | `boolean`              | —（`undefined`） | 禁用整组；继承规则见下方说明。                          |
| `vertical`   | `boolean`              | `false`          | 垂直排布（标本 04 权限列表）。                          |
| `name`       | `string`               | —                | 原生 name，注入组内全部 `LxCheckbox`。                  |

<details class="lx-selection-control-doc-details">
<summary>分组禁用继承规则</summary>

未显式设置 `disabled` 时，`LxCheckboxGroup` 继承 `ElForm` 的禁用状态；显式设置 `true` 或 `false` 时覆盖继承。

</details>

## Events

<p id="lx-checkbox-events-hint" class="lx-doc-table-scroll-hint lx-selection-control-doc-table-hint">表格可横向滚动；聚焦表格后可用方向键浏览。</p>

| 组件              | 事件                | 参数                   | 说明               |
| ----------------- | ------------------- | ---------------------- | ------------------ |
| `LxCheckbox`      | `update:modelValue` | `(value)`              | 独立使用勾选变化。 |
| `LxCheckbox`      | `change`            | `(value)`              | 勾选变化。         |
| `LxCheckboxGroup` | `update:modelValue` | `(string \| number)[]` | 选中集合变化。     |
| `LxCheckboxGroup` | `change`            | `(string \| number)[]` | 选中集合变化。     |

## Slots

<p id="lx-checkbox-slots-hint" class="lx-doc-table-scroll-hint lx-selection-control-doc-table-hint">表格可横向滚动；聚焦表格后可用方向键浏览。</p>

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

视觉对照来源：`design/表单控件八件套/code.html` 04。

<p id="lx-checkbox-design-hint" class="lx-doc-table-scroll-hint lx-selection-control-doc-table-hint">表格可横向滚动；聚焦表格后可用方向键浏览。</p>

| 契约项    | 标本 04              | 实现                                    |
| --------- | -------------------- | --------------------------------------- |
| 选中/半选 | 主色填充白勾/横杠    | EP 原生契约，组件级固化防漂移           |
| hover     | 描边与文字同步转主色 | 组件级固化                              |
| 图标间距  | 10px                 | `.el-checkbox__label` 左内距为 10px     |
| 水平间距  | 16px                 | `--lx-space-lg`，覆盖 EP 默认 32px 右距 |
| 垂直行距  | space-y-3（12px）    | `--lx-space-md`                         |
| HUD 深色  | —                    | 填充跟随 HUD 战术蓝（el-\* 变量）       |

## 可访问性

原生 `input[type=checkbox]` 语义；使用 Tab 聚焦后按 Space 切换勾选状态。半选态同步设置原生 `indeterminate` 属性和 `aria-checked="mixed"`，不修改 v-model 值。触屏设备整个 label 的最小高度为 44px。HUD 深色主题下禁用项使用深色中性底和可辨认的浅色文字；已选或半选的禁用项保留灰底，勾和横杠使用 `--lx-text-regular` 正文中性色。

## Vue3 宿主适配

业务层使用 `LxCheckboxGroup` + `LxCheckbox` 组合，独立勾选场景单用 `LxCheckbox`。`element-theme.css` 对裸 `el-checkbox` 的全局同款覆写保留过渡期。
