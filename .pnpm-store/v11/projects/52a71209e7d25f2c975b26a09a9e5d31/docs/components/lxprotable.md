# LxProTable 数据表格

基于 `el-table` 封装固定列、排序、跨页选择和省略提示等能力；视觉由 lx-ui 令牌控制。组件只消费宿主传入的数据，不直接发起请求。宽表格在组件内横向滚动，焦点落在滚动区域时可用左右方向键移动。

## 基础用法

<script setup>
import Basic from '../../src/components/LxProTable/demo/basic.vue';
</script>
<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxProTable/demo/basic.vue
:::

示例中的成功、加载、空结果和请求失败均为本地内存状态，不会访问后端。请求失败由宿主页展示并通过重试恢复；`LxProTable` 本身通过 `loading` 控制加载态，通过 `empty` 插槽展示空态。示例提供独立的 HUD 深色主题开关，离开页面时会恢复进入前的主题。

## API

### Props

| 名称                               | 说明                                                                  | 类型                             | 默认值           |
| ---------------------------------- | --------------------------------------------------------------------- | -------------------------------- | ---------------- |
| columns                            | 列配置（见下表）                                                      | `LxTableColumn[]`                | `[]`             |
| data                               | 行数据                                                                | `Record<string, any>[]`          | `[]`             |
| row-key                            | 行 key 字段（跨页选择必需）                                           | `string`                         | `id`             |
| loading                            | 加载遮罩                                                              | `boolean`                        | `false`          |
| compact                            | 紧凑密度（行高 36px）                                                 | `boolean`                        | `false`          |
| stripe / bordered                  | 斑马纹 / 外边框                                                       | `boolean`                        | `false` / `true` |
| selectable / v-model:selected-keys | 复选列（跨页保留）                                                    | `boolean` / `(string\|number)[]` | `false` / `[]`   |
| empty-text                         | 空态文案                                                              | `string`                         | `暂无数据`       |
| table-attrs                        | 透传给 `ElTable` 的属性和原生事件监听器；本组件显式管理的同名属性优先 | `Record<string, unknown>`        | `{}`             |

### LxTableColumn

`prop`（必填）/ `label` / `width` / `minWidth` / `fixed`（`'left'|'right'`）/ `align` / `ellipsis`（默认 true）/ `mono`（等宽字体列，编号/警号/车牌）/ `sortable` / `mask`（接入宿主权限源后脱敏；字符串可指定占位符）

### Events

`update:selected-keys(keys)` · `select-change(keys, rows)` · `row-click(row, index)` · `sort-change({ prop, order })`（order：`'asc'|'desc'|null`；清除排序时为 `null`）

### Slots

- 默认插槽：传入 `ElTableColumn` 时覆盖 `columns` 自动生成的列。
- `#cell-${prop}`="{ row, index, value }"：单元格（状态列放 LxStatusDot、操作列放 LxActionButtons）
- `#header-${prop}`="{ column }"：表头
- `#empty`：自定义空态内容。

### Exposes

| 方法                                 | 说明                             |
| ------------------------------------ | -------------------------------- |
| `getTableRef()`                      | 获取底层 Element Plus 表格实例   |
| `clearSelection()`                   | 清除所有已选行，包含其他页保留项 |
| `toggleRowSelection(row, selected?)` | 设置指定行的选择状态             |
| `getSelectionRows()`                 | 获取跨页保留的已选行             |

### 交互边界

- 受控 `selectedKeys` 是选择状态来源；换页后当前页复选框与已选行计数保持一致。清空由父级更新 `selectedKeys` 或调用 `clearSelection()`。
- `loading` 会在表格区域设置 `aria-busy`，并提供可读的加载状态；系统减少动效时停止旋转动画，保留状态文字。
- 复选控件提供 44×44px 点按范围。表格存在横向溢出时，滚动区域可用 Tab 聚焦，再用左右方向键滚动；页面本身不会因列宽而横向溢出。
- 错误态属于宿主的数据请求状态，不是组件 prop。宿主可通过 `#empty` 提供错误信息和重试操作。
