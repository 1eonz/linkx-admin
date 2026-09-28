# LxSelectTree 组织树选择

基于 `el-tree` 二次封装：搜索过滤（命中节点及祖先自动展开，清除搜索后恢复原展开状态）/ 父子级联复选（`checkStrictly` 可关）/ 懒加载（**请求由业务注入**）/ 禁用节点 / 节点状态圆点。左树右表骨架（SplitLayout）的标准左栏。

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
| data | 树数据（key/title/children/hasChildren/isLeaf/disabled/status/meta） | `LxTreeNode[]` | `[]` |
| v-model:checked-keys | 选中 keys（父子级联） | `(string\|number)[]` | `[]` |
| check-strictly | 关闭级联（父子独立） | `boolean` | `false` |
| filterable / placeholder / search-label | 搜索框、占位符和可访问名称 | `boolean` / `string` / `string` | `true` / `搜索部门名称` / `搜索部门名称` |
| lazy | 懒加载函数（业务注入请求） | `(node) => Promise<LxTreeNode[]>` | — |
| expanded-keys | 默认展开 keys | `(string\|number)[]` | `[]` |
| height | 最大高度（超出滚动） | `number` | `320` |

### Events

`update:checked-keys(keys)` · `check-change(keys, nodes)` · `node-click(node)` · `load-error(node, error)`

`LxTreeNode.disabled` 阻止勾选，`isLeaf` 可显式声明叶节点；省略时按 `children` 和 `hasChildren` 推断。搜索保留匹配项和祖先，临时自动展开只在搜索期间生效。懒加载失败会显示该节点的错误状态和重试按钮，宿主提供的 Promise 可再次调用；组件不发请求。数据为空与搜索无匹配分别显示空目录和未找到提示。

Demo 覆盖受控勾选、禁用节点、状态圆点、懒加载首次失败后重试、空目录、HUD 深色及搜索祖先展开；懒加载只使用本地延时 Mock，不访问后端。

## FAQ

**懒加载子级为何不在 check-change 的 nodes 里？** 懒加载节点存于树内部，建议业务侧用 key 自查；静态数据不受影响。
