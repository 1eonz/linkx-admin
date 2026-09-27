# LxBreadcrumb 面包屑

展示当前页面在信息架构中的位置。组件渲染原生链接，但不依赖 Vue Router；SPA 路由由宿主通过 `select` 事件接管。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxBreadcrumb/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxBreadcrumb/demo/basic.vue
:::

示例用 `preventDefault()` 阻止链接默认跳转，再由宿主更新路由状态；最后一项表示当前页。

## Props

| 名称        | 类型                 | 默认值 | 说明                         |
| ----------- | -------------------- | ------ | ---------------------------- |
| `items`     | `LxBreadcrumbItem[]` | `[]`   | 从根级到当前页的条目。       |
| `separator` | `string`             | `'/'`  | 相邻条目之间显示的分隔文本。 |

`LxBreadcrumbItem` 包含必填 `title: string` 和可选 `to: string`。只有非末尾且带 `to` 的条目渲染为链接；末尾条目始终以 `aria-current="page"` 表示当前页面。

## Events 与插槽

| 事件     | 参数                        | 说明                                             |
| -------- | --------------------------- | ------------------------------------------------ |
| `select` | `(item, event: MouseEvent)` | 点击可导航条目时发出；宿主可阻止默认跳转并导航。 |

默认插槽追加到导航内容末尾，可放置当前范围或环境标记。组件提供 `aria-label="面包屑导航"`；链接可用 Tab 聚焦并按 Enter 激活。

## 使用边界

- 组件不调用 Router，也不自动阻止链接导航；需要 SPA 行为时，宿主必须在事件处理器中调用 `event.preventDefault()`。
- 当前页标题应来自可信路由元数据；超长标题会截断，完整名称仍应由页面标题提供。
