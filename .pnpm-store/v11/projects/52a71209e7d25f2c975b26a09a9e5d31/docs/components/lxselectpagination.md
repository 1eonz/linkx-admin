# LxSelectPagination 远程分页选择

适用于大数据候选项的远程搜索下拉框，使用宿主注入的分页请求，不在组件库中访问业务接口。组件按 300ms 防抖搜索、滚动追加分页，并独立缓存已选项元数据，使已选标签在换页或搜索后仍能显示完整内容。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxSelectPagination/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxSelectPagination/demo/basic.vue
:::

示例以本地内存数据模拟 12 名人员，覆盖跨页选择、远程搜索、防抖、取消旧请求、空结果、失败重试、禁用、多选标签折叠及 HUD 深色主题；不会访问后端。

### 组件选型

当候选项数量较大、需要按关键字远程搜索并滚动分页加载时使用 `LxSelectPagination`。候选项是可展开组织树时使用 `LxTreeSelect`；候选项属于固定层级路径时使用 `LxCascader`。小规模静态选项直接使用 `LxSelect`，避免为本地数据引入远程请求状态。

## Props

| 名称                | 类型                                              | 默认值                          | 说明                                                                                                                                      |
| ------------------- | ------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`        | `string \| number \| (string \| number)[]`        | `undefined`                     | 受控选中值，配合 `v-model`。                                                                                                              |
| `remoteMethod`      | `(keyword, page, options) => Promise<PageResult>` | -                               | 设计稿的标准请求入口；`options` 提供 `pageSize`、额外 `params` 和 `AbortSignal`。                                                         |
| `api`               | `(params) => Promise<PageResult>`                 | -                               | 兼容对象参数写法；`params` 包含额外参数、`page`、`pageSize`、`keyword` 和 `signal`。与 `remoteMethod` 同时传入时优先使用 `remoteMethod`。 |
| `params`            | `Record<string, unknown>`                         | `{}`                            | 合并到请求参数中的宿主筛选条件。                                                                                                          |
| `multiple`          | `boolean`                                         | `false`                         | 是否多选。多选默认折叠标签，并启用完整标签提示。                                                                                          |
| `maxCollapseTags`   | `number`                                          | `2`                             | 多选触发器中平铺显示的标签数。                                                                                                            |
| `max`               | `number`                                          | -                               | 最多可选数量；与 `maxCollapseTags` 的显示折叠数量不同。                                                                                   |
| `pageSize`          | `number`                                          | `20`                            | 单次加载的记录数；远程方法可读取此值。                                                                                                    |
| `debounce`          | `number`                                          | `300`                           | 搜索防抖毫秒数，实际使用范围限制在 250 至 400ms。                                                                                         |
| `valueKey`          | `string`                                          | `'id'`                          | 候选项唯一值字段。                                                                                                                        |
| `labelKey`          | `string \| (item) => string`                      | `'name'`                        | 候选项标签字段或格式化函数。                                                                                                              |
| `descriptionKey`    | `string`                                          | `''`                            | 可选的次要说明字段。未配置时读取候选项的 `description`。                                                                                  |
| `targetMap`         | `Record<string, Item>`                            | `{}`                            | 初始化历史选中项元数据；键为 `valueKey` 对应的值。                                                                                        |
| `valueMap`          | `Record<string, { label, description?, item? }>`  | `{}`                            | 已有对象标签映射写法，保留兼容；新用法优先提供原始候选项 `targetMap`。                                                                    |
| `placeholder`       | `string`                                          | `'请选择'`                      | 触发器占位文本。                                                                                                                          |
| `searchPlaceholder` | `string`                                          | `'输入姓名、警号或名称检索...'` | 搜索框占位文本和可访问名称。                                                                                                              |
| `disabled`          | `boolean`                                         | 未设置                          | 禁用选择。未显式设置时继承 `ElForm` / `LxForm` 的禁用状态；显式传入 `true` 或 `false` 时覆盖表单状态。                                    |
| `clearable`         | `boolean`                                         | `true`                          | 是否显示清除操作。                                                                                                                        |

### 请求结果

响应支持根对象或 `data` 包裹；列表字段支持 `records` 或 `list`。`total` 和 `hasMore` 可提供分页信息；没有 `hasMore` 时组件依据已加载数量和 `total` 判断是否继续加载。

```ts
interface PageResult {
  list?: LxSelectPaginationItem[]
  records?: LxSelectPaginationItem[]
  total?: number
  hasMore?: boolean
  data?: {
    list?: LxSelectPaginationItem[]
    records?: LxSelectPaginationItem[]
    total?: number
    hasMore?: boolean
  }
}
```

```ts
import { ref } from 'vue'
import type { LxSelectPaginationRemoteMethod } from 'lx-ui'

const requestPending = ref(false)
let activeRequests = 0
const remoteMethod: LxSelectPaginationRemoteMethod = (
  keyword,
  page,
  options,
) => {
  const { pageSize, params, signal } = options
  activeRequests += 1
  requestPending.value = true
  return requestUsers({ ...params, keyword, pageNum: page, pageSize, signal })
    .then((result) => ({ list: result.records, total: result.total }))
    .catch((error) => {
      throw error
    })
    .finally(() => {
      activeRequests -= 1
      requestPending.value = activeRequests > 0
    })
}
```

请求失败由组件展示重试入口并向全局提示反馈；取消中的旧请求会被忽略，不显示失败提示。宿主 API 回调应继续拒绝 Promise，让组件识别失败并提供恢复操作。

## Events

| 事件                | 参数             | 说明                                                                 |
| ------------------- | ---------------- | -------------------------------------------------------------------- |
| `update:modelValue` | `value`          | 选中值变化。                                                         |
| `change`            | `(value, items)` | 值变化及相应候选项；没有历史元数据时保留至少包含 `valueKey` 的对象。 |
| `load`              | `(items, total)` | 一页加载成功后发出。                                                 |

## Exposes

| 方法         | 说明                                         |
| ------------ | -------------------------------------------- |
| `reload()`   | 从第一页重新加载当前关键词。                 |
| `loadMore()` | 加载下一页；无更多数据或请求进行中时不执行。 |
| `focus()`    | 聚焦选择器触发器。                           |

## 交互边界

- 搜索、分页和切换数据源会使之前的请求失效，并通过 `AbortSignal` 尝试取消传输；不支持取消的 API 也不会把旧响应写入当前结果。
- 表单禁用时触发器、搜索框、续页和重试均不可操作；禁用发生时在途请求会失效，续页中断后恢复到最后成功页。续页失败后重试会再次请求失败的页码，并保留已有结果。
- 初始选中值若不在当前结果页，应通过 `targetMap` 或兼容的 `valueMap` 提供显示元数据。用户选中候选项后，组件只保留仍处于选中状态的元数据；移除标签后会清理对应缓存。
- `change` 事件中的对象顺序与受控值顺序一致。清除单选时值为 `undefined`，清除多选时值为空数组。
- 搜索框支持键盘 Tab；Escape 交回选择器关闭下拉框。继续加载和失败重试按钮保持至少 44px 的触屏高度，并显示焦点环。
- 请求数据和响应由宿主负责。Demo 的成功、空结果、错误及取消状态仅为内存 Mock，不代表真实后端联调。
