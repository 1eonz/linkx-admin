# LxVirtualTree 虚拟树

固定行高窗口化组织树，适合节点数量较大的组织、部门和权限数据。筛选会保留匹配节点及其祖先；选中值通过 `v-model` 由宿主管理。组件不发起请求，加载和错误反馈由宿主提供。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxVirtualTree/demo/basic.vue';
import { useResponsiveDocTable } from '../.vitepress/theme/useResponsiveDocTable';

useResponsiveDocTable();
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxVirtualTree/demo/basic.vue
:::

示例包含 252 个节点（12 个分组和每组 20 个子节点）、受控勾选、禁用节点、父子级联切换、筛选、节点插槽、公开方法，以及宿主处理的加载/错误/空结果状态；高级演示操作默认收起，展开后按筛选、选中、展开与定位、行为选项分组，避免遮挡树区域。默认级联模式会在树前说明勾选范围，并反馈本次变更数量和当前已选数。筛选会展开匹配路径，结果分组可手动收起；清除筛选后恢复筛选前的展开状态。触屏或视口宽度不超过 640px 时，行高至少为 44px，虚拟滚动偏移与触控目标同步调整，筛选清除按钮也使用至少 44×44px 的点按区域；HUD 深色主题仅作用于树组件预览。树区域支持方向键浏览；方向键也可从行内展开按钮或复选框继续移动焦点，右方向键展开或进入子级，左方向键收起或回到父级，空格/回车切换勾选。

## Props

<p id="lx-doc-table-scroll-hint" class="lx-doc-table-scroll-hint">可左右滑动查看完整属性；聚焦表格后可用方向键横向浏览。</p>

| 名称                  | 类型                         | 默认值       | 说明                                                                                                                                             |
| --------------------- | ---------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data`                | `LxVirtualTreeNode[]`        | `[]`         | 树数据；节点使用 `id` 作为默认键，也可配置 `nodeKey`。                                                                                           |
| `ariaLabel`           | `string`                     | `'树形结构'` | 树控件的可访问名称；建议按业务用途覆盖，例如“组织结构”。                                                                                         |
| `ariaDescribedby`     | `string`                     | —            | 补充说明元素的 ID，可关联键盘操作提示或选择范围说明，并设置到树的 `aria-describedby`。                                                           |
| `modelValue`          | `(string \| number)[]`       | `[]`         | 受控选中键；配合 `v-model` 使用。                                                                                                                |
| `height`              | `number`                     | `360`        | 可视区域高度，单位 px。                                                                                                                          |
| `itemSize`            | `number`                     | `32`         | 桌面固定行高，单位 px；必须为有限正数，否则回退为 `32px`。触屏或视口宽度不超过 640px 时至少为 `44px`，虚拟窗口、占位和滚动位置同步使用此行高。   |
| `indent`              | `number`                     | `16`         | 每层缩进，单位 px。                                                                                                                              |
| `nodeKey`             | `string`                     | `'id'`       | 节点唯一键字段。                                                                                                                                 |
| `showCheckbox`        | `boolean`                    | `false`      | 是否显示复选框。                                                                                                                                 |
| `checkStrictly`       | `boolean`                    | `false`      | 为 `true` 时父子独立勾选；默认级联选择当前节点及全部未禁用后代，包括筛选隐藏的节点。                                                             |
| `filterable`          | `boolean`                    | `true`       | 是否显示内置过滤框。                                                                                                                             |
| `filterMethod`        | `(node, keyword) => boolean` | `undefined`  | 自定义节点匹配规则；`keyword` 已去除首尾空白并转为小写，节点字段需按相同规则规范化；命中节点的祖先会一并保留。未传时按节点名称不区分大小写匹配。 |
| `defaultExpandedKeys` | `(string \| number)[]`       | `[]`         | 初始展开节点键；后续展开状态通过组件交互和 `expandAll` 管理。                                                                                    |
| `scrollbarWidth`      | `number`                     | `4`          | 滚动条宽度，单位 px。                                                                                                                            |

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

自定义过滤回调接收规范化后的关键字，匹配节点字段时也应转为小写。例如：

```ts
function filterNode(node: LxVirtualTreeNode, keyword: string) {
  return [node.label, node.code].some(
    (value) =>
      typeof value === 'string' && value.toLocaleLowerCase().includes(keyword),
  )
}
```

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

- 空数组始终显示“暂无数据”，即使仍保留筛选词；数据非空但筛选后没有匹配项时显示“未找到匹配节点”。
- 加载中和请求错误不属于组件状态。宿主应在加载或错误时显示自己的提示与重试操作，成功后再传入 `data`。
- 树容器以 `role="tree"` 暴露，并提供默认可访问名称“树形结构”；可通过 `aria-label`/`ariaLabel` 按实际内容覆盖名称，并通过 `ariaDescribedby` 关联键盘操作或范围说明。
- 每个已渲染树项的 `aria-posinset` 和 `aria-setsize` 按筛选后的同级节点集合计算，不随虚拟窗口当前渲染的行数变化；筛选会保留命中节点及其祖先，并自动展开含匹配后代的分支。
- 输入筛选词后，可见状态区播报实际匹配节点数量；为维持树路径而显示的祖先节点不会计入数量，包括自定义 `filterMethod` 的筛选结果。
- 显示复选框且启用级联时，树项会通过可访问描述说明选择影响范围；可见状态区播报本次新增/取消数量及当前选中数。级联包含当前筛选隐藏的节点，但会跳过禁用节点。
- 树项是树内唯一的 Tab 停靠点；筛选框使用文本输入和搜索键盘提示，自定义清除按钮与筛选框位于树前的页面 Tab 顺序，避免浏览器原生搜索清除控件重复；行内展开按钮与复选框不参与 Tab 序列。树项获得焦点后，方向键、回车和空格完成展开、收起及勾选；鼠标和程序化聚焦仍可直接操作行内控件。过滤、折叠或更新数据移除当前焦点项时，焦点移至首个有效树项；用户滚动或调用 `scrollToKey()` 使停靠项离开虚拟窗口时，Tab 停靠点同步到视口内树项，并在原树项仍持有焦点时将焦点一并恢复；重排保留当前焦点键并调整滚动位置。
- 节点插槽不应换行撑高行；长标签使用省略显示，完整内容保留在 `title` 属性中。默认桌面行高为 32px，触屏或窄屏至少为 44px；复选框视觉尺寸为 14×14px，展开按钮和复选框外层点按区域在触屏或窄屏下至少为 44×44px，避免放大可操作范围时也放大视觉控件。
- 虚拟树按 `nodeKey` 建立索引，同一棵树中该值必须唯一。
