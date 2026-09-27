# LxMetricCard 指标卡

用于概览指标和详情抽屉中的只读统计。组件只负责展示，不加载数据；数据请求、loading、空态和失败恢复由宿主页面处理。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxMetricCard/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxMetricCard/demo/basic.vue
:::

示例对照 `design/指标卡 MetricCard/`，覆盖主色、成功、警告、危险语义色、角标、说明、进度标签、格式化进度值，以及 Vue3 宿主旧版属性和 `extra` 插槽。数据为静态演示内容。

## Props

| 名称            | 类型                                              | 默认值              | 说明                                                                                             |
| --------------- | ------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `title`         | `string`                                          | `''`                | 指标标题；同时传入 `label` 时优先使用。                                                          |
| `label`         | `string`                                          | `''`                | 原 lx-ui 标题属性，继续兼容。                                                                    |
| `value`         | `number \| string`                                | `''`                | 指标值；字符串可传入已格式化的大数值。                                                           |
| `unit`          | `string`                                          | `''`                | 数值单位，如“人”“件”或“%”。                                                                      |
| `status`        | `'normal' \| 'success' \| 'warning' \| 'danger'`  | 按 `valueType` 推断 | 数值和进度条的语义色；显式设置后优先级高于 `valueType`。                                         |
| `valueType`     | `'default' \| 'success' \| 'warning' \| 'danger'` | `default`           | 兼容 Vue3 宿主旧组件；映射为主色、成功、警告、危险语义色。                                       |
| `badgeText`     | `string`                                          | `''`                | 设计稿角标文案；同时传入 `badge` 时优先使用。                                                    |
| `badge`         | `string`                                          | `''`                | 原 lx-ui 角标属性，继续兼容。                                                                    |
| `badgeStatus`   | `LxStatus`                                        | `online`            | 角标状态点和浅底颜色。                                                                           |
| `trend`         | `string`                                          | `''`                | 指标下方的状态/趋势说明；文本本身说明状态，不只依赖颜色。                                        |
| `trendStatus`   | `LxStatus`                                        | `online`            | 控制趋势说明的状态色和 LxIcon 方向图标；浅色状态色加深以满足小字对比度，`error` 向下，其余向上。 |
| `progress`      | `number`                                          | 未设置              | 进度百分比；未设置时不显示进度区，数值会限制在 `0–100`，非有限值按 `0` 处理。                    |
| `progressLabel` | `string`                                          | `''`                | 进度条左侧说明，同时作为读屏进度名称。                                                           |
| `progressValue` | `string`                                          | `''`                | 进度条右侧格式化说明，同时作为读屏文本值；未设置时使用实际百分比。                               |
| `footer`        | `string`                                          | `''`                | 兼容 Vue3 宿主旧组件的底部说明属性；优先于 `footerLabel` / `footerValue` 默认渲染。              |
| `footerLabel`   | `string`                                          | `''`                | 原 lx-ui 底部说明左侧文案。                                                                      |
| `footerValue`   | `string`                                          | `''`                | 原 lx-ui 底部说明右侧文案。                                                                      |

`status` 未传入时，`valueType="success" | "warning" | "danger"` 会映射到相同语义色；`valueType="default"` 映射为 `normal`。`status` 显式值优先。

## Slots

| 名称     | 说明                                                                              |
| -------- | --------------------------------------------------------------------------------- |
| `title`  | 覆盖标题；优先级高于 `label` 插槽。                                               |
| `label`  | 原 lx-ui 标题插槽，继续兼容。                                                     |
| `value`  | 覆盖数值区域；单位仍由 `unit` 属性控制。                                          |
| `extra`  | 数值右侧的补充展示内容。                                                          |
| `footer` | 覆盖底部说明；优先级高于 `footer` 属性及 `footerLabel` / `footerValue` 默认渲染。 |

组件没有事件或实例方法。标题属性的 `title` 优先于 `label`；标题插槽的 `title` 优先于 `label`。`footer` 插槽优先于所有底部文案属性。

## 设计与边界

- 标题为 13px、说明和单位为 12px，文字使用高对比正文令牌；指标值使用 24px 等宽字体和 `tabular-nums`。卡片圆角、阴影、边框、间距和颜色均使用 lx-ui 令牌。
- 数值和进度条共享 `status` 颜色：normal 使用主色，success 使用成功色，warning 使用警告色，danger 使用错误色。角标另由 `badgeStatus` 控制。
- 浅色主题下 warning 数值会加深至至少 3:1 的大号文字对比度；HUD 主题沿用警告强调令牌。趋势说明保留 `trendStatus` 语义色，并在浅色主题下加深到至少 4.5:1；方向使用 LxIcon `arrow-up` / `arrow-down` 并由文案说明。
- 进度条高度为 6px。进度值超出范围时视觉宽度和 `aria-valuenow` 都限制到 `0–100`；`progressLabel` 和 `progressValue` 分别映射到 `aria-label` 与 `aria-valuetext`。
- 进度填充使用 `transform` 缩放固定轨道，不改变周边布局；`dir="rtl"` 时从右侧展开。
- 卡片是纯展示组件，不提供 loading、empty、error 或 disabled 属性；宿主根据数据流程组合相应状态和重试操作。
- 详情抽屉中的统计仍可沿用 Vue3 旧组件的 `title`、`valueType`、`footer` 属性及 `title` / `value` / `footer` / `extra` 插槽。宿主切换到 lx-ui 前仍需进行实际页面组合回归。
- 组件无交互焦点；进度条是唯一使用 ARIA 状态角色的元素。进度填充过渡沿用全局减少动效令牌。
