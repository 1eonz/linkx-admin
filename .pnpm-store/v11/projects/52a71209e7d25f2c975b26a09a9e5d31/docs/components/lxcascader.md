# LxCascader 级联选择

级联选择器的 lx-ui 封装，供检索面板和表单组合使用。组件保留 Element Plus 的节点值、级联路径、过滤、清空、键盘和实例方法契约，宿主只依赖 `LxCascader`。数据请求由宿主负责，组件通过公开的 loading、error 和 retry 契约反馈异步状态。

<script setup lang="ts">
import Basic from '../../src/components/LxCascader/demo/basic.vue'
</script>

<Basic />

示例可切换单选/多选、加载中、失败重试、加载与失败并发及禁用状态。并发演示中加载文案优先显示；失败态的“重试”只发出 `retry`，不会在组件内部请求数据；宿主应在监听后重新加载 `options` 并清除 `error`。

## 基础用法

```vue
<LxCascader
  v-model="path"
  :options="options"
  placeholder="请选择组织路径"
  clearable
/>
```

## 设计对照

- 标准触发器高度沿用 lx-ui 28/32/40px 尺寸档，默认 32px。
- 4px 圆角、1px 控件描边和主色焦点边线使用 lx-ui 令牌；不叠加偏移外圈，焦点时控件尺寸保持稳定。
- 弹层使用组件库 popper 阴影和圆角，窄屏触控目标放大到至少 44px。
- 375px 视口下弹层限制在视口内，级联列可在弹层内部横向滚动；节点和过滤结果行保持至少 44px 触控高度。
- `prefers-reduced-motion: reduce` 时关闭过渡与动画。

## Props 与事件

| Prop                                   | 类型                    | 默认值                           | 说明                                                                           |
| -------------------------------------- | ----------------------- | -------------------------------- | ------------------------------------------------------------------------------ |
| `modelValue`                           | `LxCascaderModelValue`  | `undefined`                      | 受控选择值；支持单值、路径数组和多选路径数组。                                 |
| `options`                              | `LxCascaderOption[]`    | `[]`                             | 选项数据；可使用 Element Plus 默认字段或自定义字段映射。                       |
| `props`                                | `CascaderProps`         | Element Plus 默认映射            | 配置选项字段、选择模式、禁用和懒加载；快捷选择属性仅在显式传入时覆盖对应配置。 |
| `id` / `name` / `autocomplete`         | `string`                | `undefined`                      | 设置实际输入框的表单标识、提交字段名和自动填充行为。                           |
| `aria-label` / `aria-labelledby`       | `string`                | `undefined`                      | 为实际输入框提供可访问名称；优先使用页面中的可见字段标签。                     |
| `placeholder`                          | `string`                | `''`                             | 未选择时的占位文案。                                                           |
| `disabled`                             | `boolean`               | `undefined`                      | 禁用状态；未设置时保留 Element Plus 表单上下文行为。                           |
| `clearable` / `filterable`             | `boolean`               | `false`                          | 是否允许清空、筛选。                                                           |
| `multiple`                             | `boolean`               | `props.multiple` 或 `false`      | 是否多选；省略时继承 `props.multiple`。                                        |
| `collapseTags` / `collapseTagsTooltip` | `boolean`               | `false`                          | 多选标签收敛及收敛提示。                                                       |
| `checkStrictly`                        | `boolean`               | `props.checkStrictly` 或 `false` | 是否允许选择非叶子节点；省略时继承 `props.checkStrictly`。                     |
| `showAllLevels`                        | `boolean`               | `true`                           | 输入框是否显示完整路径。                                                       |
| `emitPath`                             | `boolean`               | `props.emitPath` 或 `true`       | 单选时回传路径数组；省略时继承配置，关闭后回传节点值。                         |
| `size`                                 | `'sm' \| 'md' \| 'lg'`  | `'md'`                           | 28/32/40px 工程尺寸档。                                                        |
| `loading` / `error`                    | `boolean`               | `false`                          | 加载/失败时暂停选择、清空和移除标签；保留错误重试入口。                        |
| `locale`                               | Element Plus `Language` | 继承宿主配置；无配置时 `zh-cn`   | 只作用于本组件子树，也决定未覆写的状态文案语言。                               |
| `emptyText` / `loadingText`            | `string`                | locale 对应文案                  | 空态、加载文案；显式传值优先。                                                 |
| `errorText` / `retryText`              | `string`                | locale 对应文案                  | 错误及重试文案；显式传值优先。                                                 |

未声明的 Element Plus Cascader 属性继续通过 `$attrs` 透传。组件发出 `update:modelValue`、`change`、`expandChange`、`visibleChange`、`focus`、`blur` 和 `retry`；模板中 `visibleChange` 使用 `@visible-change` 监听。公开 `focus`、`blur`、`togglePopperVisible` 和 `getCheckedNodes`。按 Escape 会关闭当前弹层并回到触发输入框。

## 键盘操作

- 聚焦输入框后按 `ArrowDown` 展开弹层并聚焦当前或首个节点；`ArrowUp` / `ArrowDown` 在当前列移动。
- `ArrowRight` 进入下一级，`ArrowLeft` 返回上一级；在目标节点聚焦时按 `Enter` 激活该节点，单选叶节点会提交路径。
- `filterable` 开启时可直接输入文字筛选路径；按 `Escape` 关闭弹层并将焦点还给输入框。

## 自定义字段映射

`options` 接受 Element Plus 的 `CascaderOption` 扩展结构。默认 `label`、`value`、`children` 字段可以省略，改由 `props` 指定业务字段名；节点值的字符串、数字和记录对象兼容仍由 `LxCascaderOption` 保留。

```vue
<script setup lang="ts">
import type { LxCascaderOption, LxCascaderProps } from 'lx-ui'

const options: LxCascaderOption[] = [
  {
    name: '市局',
    nodeCode: 'city',
    childrenList: [{ name: '指挥中心', nodeCode: 'command' }],
  },
]

const cascaderProps: LxCascaderProps['props'] = {
  label: 'name',
  value: 'nodeCode',
  children: 'childrenList',
}
</script>

<template>
  <LxCascader v-model="path" :options="options" :props="cascaderProps" />
</template>
```

错误、加载和空态自有文案会跟随 `locale` 选择中英文；若宿主提供其他语言包，建议显式传入四个文案属性，以便覆盖通用中英文兜底。

若 `loading` 与 `error` 同时为 `true`，组件优先显示加载状态并隐藏错误/重试反馈；请求结束后宿主将 `loading` 设为 `false`，仍为 `true` 的 `error` 才展示失败状态和重试入口。

错误状态为实际输入框设置 `aria-invalid`，通过 `aria-describedby` 关联当前可见的错误文案，并保留宿主传入的描述 ID；错误提示使用 assertive alert 播报，持久化的隐藏弹层不会重复占用错误 ID。位于 `ElFormItem` 时，表单校验文案也会关联到实际输入框，即使宿主没有为该文案设置 ID。清除 `error` 后移除组件错误关联。加载失败时仍允许打开弹层查看反馈并重试，错误焦点保留控件内侧 1px 边线。

`modelValue` 支持单个节点值、路径数组，以及多选时的路径数组集合；节点值可为字符串、数字或记录对象。级联没有业务请求能力，远程节点加载等低频能力通过 `$attrs` 传给内核，数据和错误处理由宿主负责。
