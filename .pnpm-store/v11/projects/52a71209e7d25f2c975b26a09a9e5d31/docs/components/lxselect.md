# LxSelect 下拉选择器

基于 Element Plus `el-select` 内核二次封装的下拉选择器。32px 触发器 + 真实 1px 边框（非 EP 默认 box-shadow 伪边框）；hover 与展开态描边转主色、已选文字主色 500 字重、箭头旋转 180°（EP 原生）；面板选项 32px 行高、选中项 `#f5f7fa` 底 + 主色文字 + 右侧 Check。选项经默认插槽传 `ElOption`（EP 全导出可直接使用）；`remote-method`/`remote` 等低频 props 经 attrs 透传。

视觉规范源：`design/表单控件八件套/code.html` 02。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxSelect/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxSelect/demo/basic.vue
:::

## Props

配置式 `options` 保留值类型：数字 `1` 与字符串 `'1'`、布尔值 `true` 与字符串 `'true'` 是不同选项，动态重排后仍分别返回原始类型。字段通过 `id` 与外部 `<label for>` 关联；`id` 经 attrs 传入内核输入。

| 名称                  | 类型                                             | 默认值           | 说明                                                                                                 |
| --------------------- | ------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `modelValue`          | `string \| number \| boolean \| object \| array` | —                | 选中值（v-model；多选为数组）。                                                                      |
| `placeholder`         | `string`                                         | `''`             | 占位文案。                                                                                           |
| `disabled`            | `boolean`                                        | —（`undefined`） | 禁用态：半透明 + 禁用手势。默认未设置：`ElForm` 禁用态可正常传导；显式传 `true`/`false` 才覆盖继承。 |
| `clearable`           | `boolean`                                        | `false`          | 可清空：单选值非空时右侧清除按钮。                                                                   |
| `filterable`          | `boolean`                                        | `false`          | 本地过滤：输入关键字检索选项。                                                                       |
| `multiple`            | `boolean`                                        | `false`          | 多选：选中项渲染为标签，配合 `collapseTags` 折叠。                                                   |
| `collapseTags`        | `boolean`                                        | `false`          | 多选超出折叠为 +N。                                                                                  |
| `collapseTagsTooltip` | `boolean`                                        | `false`          | 折叠标签悬停提示完整列表。                                                                           |
| `loading`             | `boolean`                                        | `false`          | 远程检索加载态（面板显示加载文案）。                                                                 |
| `size`                | `'sm' \| 'md' \| 'lg'`                           | `'md'`           | 工程尺寸：28 / 32 / 40px；档名区别于 EP 的 `small/default/large`。                                   |
| `name`                | `string`                                         | —                | 原生 name 属性。                                                                                     |

## Events

| 名称                | 参数                  | 说明                        |
| ------------------- | --------------------- | --------------------------- |
| `update:modelValue` | `(value)`             | 选中值变化。                |
| `change`            | `(value)`             | 选中值变化（EP 内核原生）。 |
| `clear`             | —                     | 点击清除按钮。              |
| `visible-change`    | `(visible: boolean)`  | 下拉面板展开/收起。         |
| `remove-tag`        | `(tag)`               | 多选移除标签。              |
| `focus`             | `(event: FocusEvent)` | 聚焦。                      |
| `blur`              | `(event: FocusEvent)` | 失焦。                      |

## Slots

| 名称     | 说明                                     |
| -------- | ---------------------------------------- |
| 默认插槽 | 选项内容：传 `ElOption` 列表。           |
| `prefix` | 触发器内前置内容（图标）。               |
| `empty`  | 无选项时的空态内容（默认"无数据"占位）。 |

## Exposes

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

| 契约项     | 标本 02                     | 实现                                                       |
| ---------- | --------------------------- | ---------------------------------------------------------- |
| 触发器边框 | 1px `#dcdfe6` 真实边框      | 真实 border 承载状态色（EP 默认 box-shadow 伪边框，覆写）  |
| hover      | 描边转主色                  | 综合演练卡 `border-primary` 契约（主卡片灰加深方案已弃用） |
| 展开态     | 主色边框 + 已选文字主色     | 500 字重 + `:not(.is-transparent)` 排除占位误染            |
| 选项行高   | 32px                        | popper 终态组件级固化                                      |
| 选中项     | `#f5f7fa` 底 + 主色 + Check | 主色文字 + 500 字重 + Check 由 EP 原生提供                 |
| 面板阴影   | `0 4px 16px` pop 档         | `--lx-shadow-pop` 令牌                                     |
| 触控目标   | 32px                        | 触屏（`hover: none`）44px（与输入类族同族契约）            |

## 可访问性

combobox 语义输入框（EP 内核 `role="combobox"` + `aria-expanded`/`aria-activedescendant`）承载键盘可达性；键盘焦点主色边框；错误态红底红边在 `LxForm` 校验上下文自动生效（组件级固化，脱离全局桥不漂移）；开启"减少动效"时边框过渡关闭。

## Vue3 宿主适配

业务层直接使用 `LxSelect`（或全局组件名 `<LxSelect />`）。`ElOption` 从 `lx-ui`（EP 全导出）或 `element-plus` 导入均可；宿主存量 `el-select` 直用页面按 UI-04 波次另行替换。
