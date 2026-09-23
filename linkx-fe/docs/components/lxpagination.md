# LxPagination 分页

基于 `el-pagination` 二次封装，纯受控（页码计算与请求由业务负责），样式由 token 桥接层接管。

## 基础用法

<script setup>
import Basic from '../../src/components/LxPagination/demo/basic.vue';
</script>
<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxPagination/demo/basic.vue
:::

## API

### Props

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| v-model:page | 当前页（1 起） | `number` | `1` |
| v-model:page-size | 每页条数 | `number` | `10` |
| total | 总条数 | `number` | `0` |
| page-sizes | 条数可选项 | `number[]` | `[10,20,50,100]` |
| show-size / show-total / show-jumper | 条数选择器 / 总数 / 跳页 | `boolean` | `true`/`true`/`false` |
| auto-reset | 切换条数自动回第 1 页 | `boolean` | `true` |
| auto-scroll | 切页后窗口平滑回顶（列表容器内滚动场景可关） | `boolean` | `true` |
| size | 尺寸 | `'small'\|'default'\|'large'` | `default` |

### Events

`change(page, size)`（翻页与切条数统一出口；`autoReset` 开启时切条数回第一页）
