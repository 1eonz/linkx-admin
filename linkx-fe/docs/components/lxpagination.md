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

Demo 可切换默认/自定义布局、背景样式、切换条数回第一页和滚动回顶；浅/深色主题通过文档站主题开关验证，移动端分页项放在可聚焦的局部横向滚动区内。业务页的列表请求由宿主监听 `change` 后发起。

## API

### Props

| 名称                                 | 说明                                                                   | 类型                          | 默认值                |
| ------------------------------------ | ---------------------------------------------------------------------- | ----------------------------- | --------------------- |
| v-model:page                         | 当前页（1 起）                                                         | `number`                      | `1`                   |
| v-model:page-size                    | 每页条数                                                               | `number`                      | `10`                  |
| total                                | 总条数                                                                 | `number`                      | `0`                   |
| page-sizes                           | 条数可选项                                                             | `number[]`                    | `[10,20,50,100]`      |
| show-size / show-total / show-jumper | 条数选择器 / 总数 / 跳页                                               | `boolean`                     | `true`/`true`/`false` |
| auto-reset                           | 切换条数自动回第 1 页                                                  | `boolean`                     | `true`                |
| auto-scroll                          | 切页后最近可滚动祖先平滑回顶；无祖先时回滚窗口                         | `boolean`                     | `true`                |
| size                                 | 尺寸                                                                   | `'small'\|'default'\|'large'` | `default`             |
| layout                               | 覆盖分页项排列；未传时由 `show-total`、`show-size`、`show-jumper` 组合 | `string`                      | 按显示开关计算        |
| background                           | 是否显示页码按钮背景                                                   | `boolean`                     | `false`               |
| aria-label                           | 分页导航的可访问名称；同页多个分页器应分别设置                         | `string`                      | `分页导航`            |

### Events

| 事件               | 参数                               | 触发时机                                                  |
| ------------------ | ---------------------------------- | --------------------------------------------------------- |
| `update:page`      | `page: number`                     | 当前页变化；`auto-reset` 开启时切换每页条数也会更新为 `1` |
| `update:page-size` | `size: number`                     | 每页条数变化                                              |
| `change`           | `(page: number, pageSize: number)` | 翻页或切换每页条数后触发，供宿主统一发起查询              |

切换每页条数时，组件先发出 `update:page-size`，随后按 `auto-reset` 发出 `update:page`，最后发出 `change`。组件本身不请求数据；`auto-scroll` 优先滚动最近的可滚动祖先，找不到时才滚动窗口。宿主如果需要自行定位，可关闭该开关。窄屏下分页按钮和条数触发器的实际触控命中区至少为 44px；桌面仍保持紧凑尺寸。加载、失败和重试状态由宿主通过 `role=status`/错误区域组合提供。
