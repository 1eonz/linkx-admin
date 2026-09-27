# LxSplitLayout 分栏布局

用于组织树与主工作区并列的页面骨架。侧栏宽度由宿主维护；组件通过 `resize` 回传像素宽度，并通过 `update:collapsed` 请求折叠状态变化。

## 基础用法

<script setup lang="ts">
import Basic from '../../src/components/LxSplitLayout/demo/basic.vue';
</script>

<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxSplitLayout/demo/basic.vue
:::

## API

### Props

| 名称         | 类型               | 默认值  | 说明                                                                                                           |
| ------------ | ------------------ | ------- | -------------------------------------------------------------------------------------------------------------- |
| `asideWidth` | `number \| string` | `280`   | 侧栏宽度；数字按像素处理，字符串可使用 CSS 宽度。可调整时至少 200px，最大为 480px 或容器宽度减去主区保留宽度。 |
| `resizable`  | `boolean`          | `false` | 是否显示可拖动分隔栏；支持拖动、左右方向键、`Home` 和 `End`。                                                  |
| `collapsed`  | `boolean`          | `false` | 受控折叠状态。                                                                                                 |

### Events

| 名称               | 参数                 | 说明                                             |
| ------------------ | -------------------- | ------------------------------------------------ |
| `resize`           | `width: number`      | 拖动、键盘调整或容器变窄限宽时回传侧栏像素宽度。 |
| `update:collapsed` | `collapsed: boolean` | 点击侧栏控制按钮时请求新的折叠状态。             |

### Slots

| 名称      | 说明                       |
| --------- | -------------------------- |
| `aside`   | 左侧组织、筛选或导航内容。 |
| `default` | 主工作区内容。             |

分隔栏使用 `role="separator"` 并暴露当前值、最小值和最大值；拖动之外提供方向键、`Home` 和 `End` 操作。宽度限制随容器尺寸更新。窄屏时改为上下排列并隐藏拖动分隔栏，侧栏控制按钮保持 44px 点按区域；宽表格应在自身容器滚动。库级令牌在系统启用减少动效时统一关闭过渡。

示例只使用本地样例数据，不发起业务请求。
