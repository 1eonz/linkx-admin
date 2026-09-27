# LxTabsBar 页签栏

展示宿主当前打开的页面，并提供切换、关闭和右键上下文入口。页签数据与活动页状态由宿主持有。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxTabsBar/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxTabsBar/demo/basic.vue
:::

示例通过 `v-model` 更新活动键；关闭当前页后由宿主选择相邻页作为新活动项。

## Props

| 名称         | 类型          | 默认值 | 说明                   |
| ------------ | ------------- | ------ | ---------------------- |
| `tabs`       | `LxTabItem[]` | `[]`   | 当前打开的页签列表。   |
| `modelValue` | `string`      | `''`   | 当前活动页签的 `key`。 |

`LxTabItem` 包含 `key: string`、`title: string` 和可选 `closable: boolean`。

## Events 与插槽

| 事件                | 参数            | 说明                                                  |
| ------------------- | --------------- | ----------------------------------------------------- |
| `update:modelValue` | `key: string`   | 点击页签时请求宿主切换活动项。                        |
| `close`             | `key: string`   | 点击可关闭页签的关闭按钮时发出，不会直接修改 `tabs`。 |
| `context-menu`      | `{ key, x, y }` | 右键时发出页签键和视口坐标；宿主负责显示上下文菜单。  |
| `extra` 插槽        | 无              | 页签滚动区右侧的宿主操作。                            |

## 使用边界

- 宿主收到 `close` 后更新数组；若关闭的是活动项，还需选择下一个活动页并更新 `modelValue`。
- `context-menu` 坐标使用浏览器视口 CSS 像素，不会自动创建菜单。
- 页签过多时只在页签区域横向滚动，不扩展页面宽度；名称在固定宽度内截断。
