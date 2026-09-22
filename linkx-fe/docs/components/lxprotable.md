# LxProTable 数据表格

基于 `el-table` 二次封装：**fixed 固定列 / sortable 排序 / reserve-selection 跨页选择 / show-overflow-tooltip 省略**等 EP 能力原生透传；视觉由 lx-tokens 桥接（表头 40px 灰底、行高 44px、行线 `#ebeef5`、nowrap 杜绝单字断行）。纯受控零请求依赖（P7）。

## 基础用法

<script setup>
import Basic from '../../src/components/LxProTable/demo/basic.vue';
</script>
<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxProTable/demo/basic.vue
:::

## API

### Props

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| columns | 列配置（见下表） | `LxTableColumn[]` | `[]` |
| data | 行数据 | `Record<string, any>[]` | `[]` |
| row-key | 行 key 字段（跨页选择必需） | `string` | `id` |
| loading | 加载遮罩 | `boolean` | `false` |
| compact | 紧凑密度（行高 36px） | `boolean` | `false` |
| stripe / bordered | 斑马纹 / 外边框 | `boolean` | `false` / `true` |
| selectable / v-model:selected-keys | 复选列（跨页保留） | `boolean` / `(string\|number)[]` | `false` / `[]` |
| empty-text | 空态文案 | `string` | `暂无数据` |

### LxTableColumn

`prop`（必填）/ `label` / `width` / `minWidth` / `fixed`（`'left'|'right'`）/ `align` / `ellipsis`（默认 true）/ `mono`（等宽字体列，编号/警号/车牌）/ `sortable`

### Events

`select-change(keys, rows)` · `row-click(row, index)` · `sort-change({ prop, order })`（order：`'asc'|'desc'|null`）

### Slots

- `#cell-${prop}`="{ row, index, value }"：单元格（状态列放 LxStatusDot、操作列放 LxActionButtons）
- `#header-${prop}`="{ column }"：表头
