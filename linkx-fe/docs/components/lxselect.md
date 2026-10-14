# LxSelect 下拉选择器

LxSelect 用于在表单中从候选项选择一个或多个值，支持配置式选项、插槽选项、本地过滤、远程检索和禁用状态。单选可清空，多选可折叠已选标签；远程数据由宿主提供，组件不发起业务请求。

组件外观按 `design/表单控件八件套/code.html` 的下拉选择器标本实现：桌面基准高度 32px、控件自身 1px 边框、选项行高 32px；触屏下触发器和选项行均至少为 44px。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxSelect/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxSelect/demo/basic.vue
:::

## 属性

配置式 `options` 保留值类型：数字 `1` 与字符串 `'1'`、布尔值 `true` 与字符串 `'true'` 是不同选项，动态重排后仍分别返回原始类型。字段通过 `id` 与外部 `<label for>` 关联；`id` 经 attrs 传入内核输入。

| 名称                       | 类型                                             | 默认值            | 说明                                                                                                                              |
| -------------------------- | ------------------------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`               | `string \| number \| boolean \| object \| array` | —                 | 选中值（v-model；多选为数组）。                                                                                                   |
| `placeholder`              | `string`                                         | `''`              | 占位文案。                                                                                                                        |
| `disabled`                 | `boolean`                                        | —（`undefined`）  | 禁用态：使用禁用背景和手势，同时保留当前值的可读对比度。默认未设置：`ElForm` 禁用态可正常传导；显式传 `true`/`false` 才覆盖继承。 |
| `clearable`                | `boolean`                                        | `false`           | 可清空：单选值非空时右侧清除按钮。                                                                                                |
| `filterable`               | `boolean`                                        | `false`           | 本地过滤：输入关键字检索选项。                                                                                                    |
| `multiple`                 | `boolean`                                        | `false`           | 多选：选中项渲染为标签，配合 `collapseTags` 折叠。                                                                                |
| `collapseTags`             | `boolean`                                        | `false`           | 多选超出折叠为 +N。                                                                                                               |
| `collapseTagsTooltip`      | `boolean`                                        | `false`           | 折叠标签悬停提示完整列表；触屏可展开下拉查看各项选择状态。                                                                        |
| `collapseSummaryAriaLabel` | `(count?: number) => string`                     | —                 | 自定义折叠摘要的无障碍名称；参数为折叠数量。默认使用宿主 Element Plus 语言包中的下拉切换文案，并附加数量。                        |
| `loading`                  | `boolean`                                        | `false`           | 远程检索加载态（面板显示加载文案）。                                                                                              |
| `options`                  | `LxSelectOption[]`                               | —                 | 配置式选项；每项包含 `label`、`value`，可选 `disabled` 和 `description`。                                                         |
| `size`                     | `'sm' \| 'md' \| 'lg'`                           | `'md'`            | 工程尺寸：28 / 32 / 40px；档名区别于 EP 的 `small/default/large`。                                                                |
| `suffixIcon`               | `string \| Component`                            | Element Plus 默认 | 自定义后缀图标；支持图标名称或 Vue 组件，传入后保留原图标，不应用默认下拉三角样式。                                               |
| `name`                     | `string`                                         | —                 | 原生 name 属性。                                                                                                                  |

配置式选项适合 schema 或接口映射后的固定候选项；也可以通过默认插槽传入 `ElOption`。两种来源可组合使用，但同一候选项只维护一处，避免列表重复。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const level = ref('2')
const levels = [
  { label: '一级布控', value: '1', description: '重点目标' },
  { label: '二级布控', value: '2', description: '持续关注' },
]
</script>

<template>
  <LxSelect v-model="level" :options="levels">
    <template #option="{ option }">
      <span>{{ option.label }}</span>
      <small v-if="option.description">{{ option.description }}</small>
    </template>
    <template #label="{ label, value }"> {{ label }}（{{ value }}） </template>
  </LxSelect>
</template>
```

## 事件

| 名称                | 参数                  | 说明                        |
| ------------------- | --------------------- | --------------------------- |
| `update:modelValue` | `(value)`             | 选中值变化。                |
| `change`            | `(value)`             | 选中值变化（EP 内核原生）。 |
| `clear`             | —                     | 点击清除按钮。              |
| `visible-change`    | `(visible: boolean)`  | 下拉面板展开/收起。         |
| `remove-tag`        | `(tag)`               | 多选移除标签。              |
| `focus`             | `(event: FocusEvent)` | 聚焦。                      |
| `blur`              | `(event: FocusEvent)` | 失焦。                      |

## 插槽

| 名称     | 参数                                                           | 说明                                                       |
| -------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| 默认插槽 | —                                                              | 手动提供 `ElOption` 列表。                                 |
| `option` | `{ option: LxSelectOption }`                                   | 自定义配置式选项内容；不提供时显示 `option.label`。        |
| `label`  | `{ value: LxSelectOptionValue, label: string, index: number }` | 自定义已选值展示，可将必要的业务说明保留在闭合态触发器中。 |
| `prefix` | —                                                              | 触发器内的前置内容。                                       |
| `empty`  | —                                                              | 无可显示选项时的内容；默认显示 Element Plus 空态。         |
| `header` | —                                                              | 下拉面板顶部内容。                                         |
| `footer` | —                                                              | 下拉面板底部内容。                                         |

```vue
<LxSelect v-model="center" filterable>
  <template #header>按区域筛选</template>
  <ElOption label="市局指挥中心" value="city" />
  <ElOption label="城东分局指挥室" value="east" />
  <template #footer>显示 2 个指挥中心</template>
</LxSelect>
```

## 实例方法

| 名称    | 说明         |
| ------- | ------------ |
| `focus` | 聚焦触发器。 |
| `blur`  | 移除焦点。   |

## 低频 props 透传

`remote`/`remote-method`（远程检索）、`multiple-limit`、`automatic-dropdown`、`popper-class`（与组件锚定类 `lx-select__popper` 合并保留而非覆盖）等未声明 props 经 attrs 直达 EP 内核：

```vue
<LxSelect
  v-model="officer"
  filterable
  remote
  :remote-method="searchOfficer"
  :loading="loading"
>
  <ElOption v-for="item in options" :key="item" :label="item" :value="item" />
</LxSelect>
```

## 与标本的对齐说明

| 契约项     | 标本 02                                                        | 实现                                                                                 |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 触发器边框 | 1px `#dcdfe6` 真实边框                                         | 真实 border 承载状态色（EP 默认 box-shadow 伪边框，覆写）                            |
| hover      | 02 字段样本为灰色加深 `#c0c4cc`；综合演练卡为 `border-primary` | 当前统一采用综合演练卡的主色描边；02 字段样本保留为基础字段 hover 参考，两者来源不同 |
| 展开态     | 主色边框 + 已选文字主色                                        | 500 字重 + `:not(.is-transparent)` 排除占位误染                                      |
| 选项行高   | 桌面 32px                                                      | 桌面按 02 固化；触屏/窄屏提升为 44px 便于点按                                        |
| 选中项     | `#f5f7fa` 底 + 主色 + Check                                    | 主色文字 + 500 字重；单选勾选由 LxSelect 样式补齐，多选沿用 EP 内核勾选              |
| 面板阴影   | `0 4px 16px` pop 档                                            | `--lx-shadow-pop` 令牌                                                               |
| 触控目标   | 桌面 32px                                                      | 触屏或视口宽度不大于 640px 时，触发器与选项行均为 44px                               |

## 可访问性

combobox 语义输入框（EP 内核 `role="combobox"` + `aria-expanded`/`aria-activedescendant`）承载键盘可达性；键盘可见焦点除主色边框外还有 2px 焦点光环。启用的多选折叠摘要 `+N` 可通过 Tab 聚焦，并用 Enter 或空格打开选项列表；默认无障碍名称读取宿主 Element Plus 语言包中的下拉切换文案并附加折叠数量，也可通过 `collapseSummaryAriaLabel` 提供完整本地化文案。禁用状态会跟随控件及表单上下文动态更新，摘要带有禁用语义且不进入 Tab 顺序，也不会展开列表。打开后焦点移至 combobox，可继续用方向键浏览及 Enter 选择。校验失败时错误字段会获得焦点；Demo 用普通状态播报补充当前已选和还需数量，用户修改选择后清除过期反馈，避免重复呈现错误文案。错误态红底红边在 `LxForm` 校验上下文自动生效（组件级固化，脱离全局桥不漂移）。多选示例通过 `LxForm` 校验至少选择 3 个单位，展示校验失败、键盘焦点和补足选项后的恢复；禁用示例覆盖折叠摘要。远程失败由宿主处理：错误说明与输入框关联，弹层打开时在底部提供重试按钮，弹层关闭时将错误说明和重试按钮放回控件旁；重试成功后清除错误说明及其 `aria-describedby` 关系。开启"减少动效"时会关闭触发器、箭头和下拉弹层的过渡，键盘焦点光环仍保留。

键盘操作沿用 combobox 约定：方向键浏览选项，Enter 选择。可过滤输入框中仍有检索词时，第一次按 Esc 会先清空检索词并保留面板；检索词为空时再按 Esc 才收起面板，焦点保留在触发器上。

## Vue3 宿主适配

业务层直接使用 `LxSelect`（或全局组件名 `<LxSelect />`）。组件优先继承宿主 `ElConfigProvider` 或 `app.use(ElementPlus, { locale })` 配置；没有宿主语言配置时默认使用简体中文。Element Plus 会将首次建立的全局配置作为模块级回退，同一运行时中的多个 Vue 应用或多语言页面应分别显式配置语言，避免共享默认语言不符合预期。`ElOption` 从 `lx-ui`（EP 全导出）或 `element-plus` 导入均可；宿主存量 `el-select` 直用页面按 UI-04 波次另行替换。
