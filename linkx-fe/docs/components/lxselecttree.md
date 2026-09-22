# LxSelectTree 组织树选择

基于 `el-tree` 二次封装：搜索过滤（命中节点及祖先自动保留展开）/ 父子级联复选（`checkStrictly` 可关）/ 懒加载（**请求由业务注入**，P7）/ 节点状态圆点。左树右表骨架（SplitLayout）的标准左栏。

## 基础用法

<script setup>
import Basic from '../../src/components/LxSelectTree/demo/basic.vue';
</script>
<div class="demo-box" style="max-width:360px"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxSelectTree/demo/basic.vue
:::

## API

### Props

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| data | 树数据（key/title/children/hasChildren/status/meta） | `LxTreeNode[]` | `[]` |
| v-model:checked-keys | 选中 keys（父子级联） | `(string\|number)[]` | `[]` |
| check-strictly | 关闭级联（父子独立） | `boolean` | `false` |
| filterable / placeholder | 搜索框 / 占位符 | `boolean` / `string` | `true` |
| lazy | 懒加载函数（业务注入请求） | `(node) => Promise<LxTreeNode[]>` | — |
| expanded-keys | 默认展开 keys | `(string\|number)[]` | `[]` |
| height | 最大高度（超出滚动） | `number` | `320` |

### Events

`check-change(keys, nodes)` · `node-click(node)`

## FAQ

**懒加载子级为何不在 check-change 的 nodes 里？** 懒加载节点存于树内部，建议业务侧用 key 自查；静态数据不受影响。
