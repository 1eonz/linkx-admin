# LxSectionTitle 区块标题

用于标明内容分组、补充短说明，并承载与该分组相关的轻量操作。组件不请求数据；编辑、刷新和权限判断由宿主处理。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxSectionTitle/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxSectionTitle/demo/basic.vue
:::

示例可切换三档字号和 HUD 深色主题，展示三种变体、标签颜色、超长标题和可聚焦的右侧操作；数据仅存在于页面内存。

## Props

| 名称        | 类型                                            | 默认值      | 说明                                                   |
| ----------- | ----------------------------------------------- | ----------- | ------------------------------------------------------ |
| `title`     | `string`                                        | `''`        | 标题文本；默认插槽有内容时优先使用插槽。               |
| `variant`   | `'border' \| 'dashed' \| 'plain'`               | `'border'`  | 左竖条、底部分隔线或纯标题布局。                       |
| `size`      | `'small' \| 'default' \| 'large'`               | `'default'` | 标题字号、图标/竖条高度和最小行高。                    |
| `subtitle`  | `string`                                        | `''`        | 短说明；显示在主标题下方。                             |
| `icon`      | `LxIconName`                                    | `undefined` | 标题前的 LxIcon 名称；`leading` 插槽可自定义前置内容。 |
| `iconColor` | `string`                                        | `''`        | 前置图标颜色；未设置时使用主题主色。                   |
| `tag`       | `string \| number`                              | `undefined` | 标题旁的计数或状态文字；不传时不显示标签。             |
| `tagType`   | `'primary' \| 'success' \| 'warning' \| 'info'` | `'info'`    | 标签主题语义色。                                       |

## Slots

| 名称      | 说明                                             |
| --------- | ------------------------------------------------ |
| `default` | 自定义主标题内容。                               |
| `leading` | 覆盖 `icon` 的前置区域。                         |
| `extra`   | 标题右侧操作区；交互控件须由宿主提供可访问名称。 |

组件不发出事件，也不暴露实例方法。它是静态分组标识，不添加入场动画；插槽中的交互控件使用原生键盘焦点行为。超长标题会截断显示，完整标题仍保留在 DOM 文本中；窄屏时布局不应造成页面横向滚动。

## Vue3 宿主适配

Vue3 的 `SectionTitle` 适配器保留原有 `title`、`icon`、`iconColor`、`variant`、默认/前置/extra 插槽及 `dashed` 默认变体，并透传 `size`、`tag`、`tagType`。Vue2 运行时不直接加载本 Vue3 组件。
