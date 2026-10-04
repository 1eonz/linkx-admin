# LxTreeSelect 树形下拉

`LxTreeSelect` 是 DynamicForm 树字段的公开 Lx 封装。它保留 Element Plus 的树数据、级联、懒加载、筛选和多选值契约，由 lx-ui 统一提供 32px 控件基线、焦点边界、弹层选项行高和减少动效规则。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxTreeSelect/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxTreeSelect/demo/basic.vue
:::

示例覆盖带可见字段标签的单选/多选确认、禁用节点、空目录、加载态、加载失败与重试、HUD 深色、英文语言环境、键盘焦点和受控值回显；数据与加载状态都在浏览器内存中。英文开关会切换整个 TreeSelect 子树的内核及组件文案。

多选遵循组织树的确认边界：勾选只更新弹层内的待提交值，底部 **确认** 才触发 `update:modelValue` / `change`；**取消**、按 `Escape` 或点击弹层外部会丢弃本次草稿。单选默认只选择叶节点并立即回填关闭；点击非叶节点只展开或收起，透传 `checkStrictly` 后才允许选择非叶节点。

```vue
<LxTreeSelect
  v-model="department"
  :data="departments"
  filterable
  placeholder="选择部门"
  node-key="id"
  value-key="id"
  :props="{ label: 'name', children: 'children' }"
  clearable
/>
```

请求、懒加载和权限过滤由宿主注入 `load`、`remoteMethod` 或已经整理好的 `data`；组件不访问业务 API。

## Props 与事件

基础值通过 `modelValue` / `update:modelValue` 受控；`change` 返回 Element Plus 原始值，不把数字、布尔值或记录对象强制转换成字符串。其他 TreeSelect 属性通过 `$attrs` 透传。

| 属性                                                             | 类型                        | 默认值                         | 说明                                                                     |
| ---------------------------------------------------------------- | --------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| `modelValue`                                                     | `LxTreeSelectValue`         | `undefined`                    | 受控值；多选在 footer 确认后提交。                                       |
| `data`                                                           | `Record<string, unknown>[]` | `[]`                           | 树节点数据。                                                             |
| `placeholder`                                                    | `string`                    | `''`                           | 未选择时的占位文案。                                                     |
| `disabled`                                                       | `boolean`                   | `undefined`                    | 禁用状态；未设置时保留表单上下文行为。                                   |
| `clearable` / `filterable`                                       | `boolean`                   | `false`                        | 是否允许清空、筛选。                                                     |
| `multiple`                                                       | `boolean`                   | `false`                        | 多选时通过 footer 确认后提交。                                           |
| `collapseTags` / `collapseTagsTooltip`                           | `boolean`                   | `false`                        | 多选标签收敛及收敛提示。                                                 |
| `size`                                                           | `'sm' \| 'md' \| 'lg'`      | `'md'`                         | 28/32/40px 工程尺寸档。                                                  |
| `loading`                                                        | `boolean`                   | `false`                        | 下拉加载态；外层 `aria-busy="true"`，确认按钮禁用。                      |
| `error`                                                          | `boolean \| string`         | `false`                        | 加载失败状态；传字符串时作为错误文案。                                   |
| `errorText`                                                      | `string`                    | 跟随 locale                    | `error` 为 `true` 时的错误文案；中文为“组织目录加载失败”。               |
| `retryable`                                                      | `boolean`                   | `false`                        | 是否显示重试按钮；点击只触发事件，由宿主重新加载。                       |
| `retryText`                                                      | `string`                    | 跟随 locale                    | 重试按钮文案；中文为“重试”，英文为“Retry”。                              |
| `locale`                                                         | Element Plus `Language`     | 继承宿主配置；无配置时 `zh-cn` | 只覆盖当前组件子树，影响内核、错误、重试及多选 footer 的默认文案。       |
| `emptyText`                                                      | `string`                    | 跟随 locale                    | 空目录文案，同时作为 `noDataText` 兜底。                                 |
| `noDataText` / `noMatchText` / `loadingText`                     | `string`                    | 跟随 locale                    | 覆盖无数据、无匹配和加载中的内核文案。                                   |
| `selectedText` / `unselectedText` / `cancelText` / `confirmText` | `string`                    | 跟随 locale                    | 覆盖多选 footer 文案；`selectedText` 中的 `{count}` 会替换为待提交数量。 |

未声明的 Element Plus TreeSelect 属性继续通过 `$attrs` 透传。事件：`update:modelValue`、`change`、`confirm(value)`、`cancel()`、`retry()` 和 `visible-change(visible)`；确认/取消用于监听多选 footer，重试只通知宿主。

可用插槽：`header`、`loading`、`empty`；`footer` 接收 `{ value, confirm, cancel }`，可在保留待提交语义的前提下替换默认底部操作栏。

组件实例公开 `focus()`、`blur()`、`confirm()` 和 `cancel()`，以便表单校验失败后由宿主定位字段，或由外部操作触发多选提交/取消。

键盘操作：输入筛选文字后使用 `↑` / `↓` 移动树节点，`Enter` 勾选或选择，`Escape` 收起并取消未确认的多选草稿。错误状态带 `role="alert"`，重试按钮可通过 Tab 聚焦。

多选 footer 默认文案跟随 `locale`（中文/英文）；传入对应文本属性可局部覆盖。

错误文案通过 assertive alert 与 `aria-describedby` 关联实际输入框，并保留宿主传入的描述 ID；清除 `error` 后只移除组件错误关联。位于 `ElFormItem` 时，表单校验文案也会关联到实际输入框，即使宿主没有为该文案设置 ID。加载中或控件禁用时，确认和重试操作不可执行。内置错误和重试文案跟随 `locale` 的中英文兜底，其他语言可使用 `errorText` / `retryText` 显式覆盖。
