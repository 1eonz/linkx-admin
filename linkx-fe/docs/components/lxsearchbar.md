# LxSearchBar 检索面板

配置驱动的检索面板，负责字段展示、值变更、展开收起和按钮事件；查询、重置后的列表请求由宿主处理。

<script setup lang="ts">
import Basic from '../../src/components/LxSearchBar/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxSearchBar/demo/basic.vue
:::

## Props

| 名称                        | 类型                              | 默认值          | 说明                                                               |
| --------------------------- | --------------------------------- | --------------- | ------------------------------------------------------------------ |
| `fields`                    | `LxSearchField[]`                 | `[]`            | 支持 input、select、date、daterange、number、tree-select、cascader |
| `modelValue`                | `Record<string, unknown>`         | `{}`            | 受控查询值                                                         |
| `loading`                   | `boolean`                         | `false`         | 查询中禁用搜索/重置并展示按钮加载态                                |
| `collapsible` / `collapsed` | `boolean`                         | `true` / `true` | 字段超过 8 个时支持收起和展开                                      |
| `size`                      | `'small' \| 'default' \| 'large'` | `'default'`     | 透传按钮尺寸                                                       |

## Events 与插槽

- `update:modelValue`：字段变化后的完整查询对象。
- `search`：点击查询或回车；宿主在此启动请求。
- `reset`：恢复字段默认值后触发，并随后触发 `search`。
- `update:collapsed`：展开状态变化。
- `filters`：在字段网格中追加自定义过滤项。
- `controls`：接管查询/重置按钮，作用域提供 `search`、`reset`、`canReset` 和 `loading`。
- `actions`：在默认查询/重置按钮前追加操作。

字段的树和级联选项使用递归 `children`；组件不发起请求，也不保存列表数据。Demo 的成功、空结果和失败均为宿主侧内存 Mock，业务 API 仍由宿主按 `.then().catch().finally()` 编排。

普通选择及树选择选项的值支持字符串、数字或布尔值。级联选项遵循 Element Plus Cascader 契约，支持字符串、数字和记录对象值，不接受布尔值、数组或函数作为单个节点值；记录对象（包括含 `call` 或 `Symbol.iterator` 业务字段的对象）和混合路径会按原类型传入，并从 `update:modelValue` 原样发出。

## 验收记录

- 行为测试覆盖受控字段更新、按 schema 默认值重置并立即查询、loading 时阻止查询，以及超过 8 个字段时展开全部条件。
- 级联行为测试覆盖数字、混合及具名对象接口路径的回显与事件回传，并确认记录对象中的普通 `call`/`Symbol.iterator` 字段不会被误过滤；Demo 使用数字组织 ID。
- Chrome 桌面检查通过成功/空结果/失败及失败后恢复、展开收起、重置、loading 锁定；375px 下展开全部 10 项条件后文档页保持 375px，无页面横向溢出。
