# LxVirtualTree 虚拟树

固定行高窗口化组织树，适合节点数量较大的组织、部门和权限数据。筛选会保留匹配节点及其祖先；选中值通过 `v-model` 由宿主管理。组件不发起请求，加载和错误反馈由宿主提供。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxVirtualTree/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxVirtualTree/demo/basic.vue
:::

示例包含 240 个节点、受控勾选、禁用节点、父子级联切换、筛选、节点插槽、公开方法，以及宿主处理的加载/错误/空结果状态；可单独切换 HUD 深色令牌预览。树区域支持方向键浏览；右方向键展开或进入子级，左方向键收起或回到父级，空格/回车切换勾选。

## Props

| 名称                  | 类型                   | 默认值  | 说明                                                          |
| --------------------- | ---------------------- | ------- | ------------------------------------------------------------- |
| `data`                | `LxVirtualTreeNode[]`  | `[]`    | 树数据；节点使用 `id` 作为默认键，也可配置 `nodeKey`。        |
| `modelValue`          | `(string \| number)[]` | `[]`    | 受控选中键；配合 `v-model` 使用。                             |
| `height`              | `number`               | `360`   | 可视区域高度，单位 px。                                       |
| `itemSize`            | `number`               | `32`    | 固定行高，单位 px；所有节点行使用相同行高以计算虚拟窗口。     |
| `indent`              | `number`               | `16`    | 每层缩进，单位 px。                                           |
| `nodeKey`             | `string`               | `'id'`  | 节点唯一键字段。                                              |
| `showCheckbox`        | `boolean`              | `false` | 是否显示复选框。                                              |
| `checkStrictly`       | `boolean`              | `false` | 为 `true` 时父子独立勾选；默认级联选择可用后代。              |
| `filterable`          | `boolean`              | `true`  | 是否显示内置过滤框。                                          |
| `defaultExpandedKeys` | `(string \| number)[]` | `[]`    | 初始展开节点键；后续展开状态通过组件交互和 `expandAll` 管理。 |
| `scrollbarWidth`      | `number`               | `4`     | 滚动条宽度，单位 px。                                         |

节点类型：

```ts
interface LxVirtualTreeNode {
  id: string | number
  label: string
  children?: LxVirtualTreeNode[]
  disabled?: boolean
  isLeaf?: boolean
  [key: string]: unknown
}
```

`disabled` 节点本身不可点击或勾选；级联勾选会跳过禁用后代。`isLeaf: false` 可显示展开控制，但静态树组件不会为其加载子数据。

## Events

| 事件                | 参数            | 说明                                             |
| ------------------- | --------------- | ------------------------------------------------ |
| `update:modelValue` | `keys`          | 选中键变化，用于 `v-model`。                     |
| `check-change`      | `(keys, nodes)` | 勾选变化；`nodes` 为当前树数据中对应的已选节点。 |
| `node-click`        | `node`          | 点击可用节点时触发。                             |
| `expand-change`     | `keys`          | 展开节点键集合变化。                             |

## 插槽

| 名称   | 参数                       | 说明                                                         |
| ------ | -------------------------- | ------------------------------------------------------------ |
| `node` | `{ node, level, checked }` | 在节点标签后追加状态或业务展示；保持内容单行以符合固定行高。 |

## 实例方法

可通过模板引用调用：

```ts
interface LxVirtualTreeExpose {
  getCheckedKeys(): (string | number)[]
  setCheckedKeys(keys: (string | number)[]): void
  expandAll(expand?: boolean): void
  filter(value: string): void
  scrollToKey(key: string | number): void
}
```

| 方法                       | 说明                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `getCheckedKeys()`         | 读取当前 `modelValue` 的副本。                                                                   |
| `setCheckedKeys(keys)`     | 仅保留当前树中存在且未禁用的键；发出 `update:modelValue` 和 `check-change`，不直接修改父级数据。 |
| `expandAll(expand = true)` | 展开或收起全部分支，并发出 `expand-change`。                                                     |
| `filter(value)`            | 设置过滤关键字；空字符串清除过滤。                                                               |
| `scrollToKey(key)`         | 将当前可见节点滚动到视口起点；过滤或折叠后不可见的节点不会滚动。                                 |

## 状态与边界

- 空数组显示“暂无数据”；有过滤词但无匹配项显示“未找到匹配节点”。
- 加载中和请求错误不属于组件状态。宿主应在加载或错误时显示自己的提示与重试操作，成功后再传入 `data`。
- 键盘树项采用 roving tabindex；筛选框、清除按钮、展开按钮和复选框可通过 Tab 访问。
- 行高固定，节点插槽不应换行撑高行；长标签使用省略显示，完整内容保留在 `title` 属性中。
- 虚拟树按 `nodeKey` 建立索引，同一棵树中该值必须唯一。
