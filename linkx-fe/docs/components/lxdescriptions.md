# LxDescriptions 详情描述

用于详情抽屉和只读信息面板，默认以 32px 紧凑行高显示标签与值。组件不请求数据；空、加载和错误状态由宿主按页面流程组合。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxDescriptions/demo/basic.vue';
import { useResponsiveDocTable } from '../.vitepress/theme/useResponsiveDocTable';

useResponsiveDocTable();
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxDescriptions/demo/basic.vue
:::

示例中的姓名、警号和组织信息均为静态演示数据；状态点、复制字段、角色具名插槽、单列/双列、480px 抽屉组合、边框、HUD 深色及宿主状态均可切换检查。状态选择器作用于当前预览，非详情状态下会隐藏抽屉组合示例；边框和 HUD 位于“更多预览设置”中。桌面工具栏将布局、数据状态分组显示，状态摘要和高级设置独占整行；窄屏自动改为单列，降低首屏控件竞争并保持完整操作顺序。

## Props

<p id="lx-descriptions-props-table-hint" class="lx-doc-table-scroll-hint">可左右滑动查看完整属性；聚焦表格后可用方向键横向浏览。</p>

| 名称           | 类型                                | 默认值      | 说明                                                           |
| -------------- | ----------------------------------- | ----------- | -------------------------------------------------------------- |
| `items`        | `LxDescriptionItem[]`               | `[]`        | 描述行数据，字段见下表。                                       |
| `columns`      | `1 \| 2 \| 3`                       | `1`         | 网格列数；`two-ends` 布局始终为一列。                          |
| `layout`       | `'two-ends' \| 'grid' \| 'compact'` | 自动        | 两端对齐、网格或紧凑布局；未设置时按 `columns` 推断。          |
| `rowHeight`    | `number`                            | 设计令牌    | 行最小高度，单位 px；未设置时默认 32px，紧凑布局使用 28px。    |
| `dividerColor` | `string`                            | 边框令牌    | 底部分隔线和外边框颜色；支持 CSS 颜色或变量。                  |
| `labelWidth`   | `string \| number`                  | `auto`      | 全局标签宽度；数值按 px 处理。单项的 `labelWidth` 优先级更高。 |
| `bordered`     | `boolean`                           | `false`     | 是否显示左右外边框及标签分隔线。                               |
| `size`         | `'small' \| 'default'`              | `'default'` | 紧凑尺寸；`layout="compact"` 会使用 small。                    |

### 描述项

<p id="lx-descriptions-items-table-hint" class="lx-doc-table-scroll-hint">可左右滑动查看完整字段说明；聚焦表格后可用方向键横向浏览。</p>

| 名称         | 类型                | 说明                                                                                                                          |
| ------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `key`        | `string`            | 唯一键，也用于对应的 `item-${key}` 插槽。                                                                                     |
| `label`      | `string`            | 左侧标签。                                                                                                                    |
| `value`      | `unknown`           | 右侧值；空值显示 `-`，桌面长文本单行省略并提供“展开完整内容”按钮，鼠标可查看 title，键盘和触屏可切换完整内容；窄屏自动换行，普通长值和长状态展开入口保持至少 44px 触控高度。  |
| `span`       | `number`            | 跨列数，会限制在当前布局有效列范围内。                                                                                        |
| `labelWidth` | `string \| number`  | 单项标签宽度，数值按 px 处理。                                                                                                |
| `copyable`   | `boolean`           | 默认值渲染为键盘可操作的 `LxCodeSlot`，名称包含字段和值；桌面长值省略，窄屏换行且复制目标至少 44px 高；脱敏时不显示复制按钮。 |
| `statusDot`  | `LxStatus`          | 默认值渲染为带文本的 `LxStatusDot`；使用项目状态语义。桌面长状态提供键盘/触屏展开按钮，窄屏自动换行。                         |
| `mask`       | `boolean \| string` | 按宿主注入的字段权限显示脱敏占位符；字符串可自定义占位内容。                                                                  |

## Slots

| 名称          | 参数              | 说明                                                   |
| ------------- | ----------------- | ------------------------------------------------------ |
| `item-${key}` | `{ item, value }` | 覆盖指定项的默认值展示；自定义插槽由宿主负责处理脱敏。 |

组件没有事件或实例方法。自定义插槽优先于 `copyable` 和 `statusDot` 默认渲染。

## 响应式与状态

- 桌面端按 `columns` 排列；视口小于 768px 时收为单列，并保留标签/值两端对齐。
- 标签使用 `--lx-text-secondary-strong` 与常规字重，值使用 `--lx-text-primary` 与中等字重，保持设计稿的层级差异；浅色与 HUD 深色主题均满足正文对比度要求。
- `statusDot` 和 `copyable` 内嵌展示件继承值列的字重与颜色；状态圆点仍使用状态语义色，复制按钮 hover/focus 仍使用主色反馈。长状态通过明确的按钮切换完整名称，短状态保留读屏名称但不增加无操作的键盘停靠位；文本换行不会裁切圆点的呼吸动画。
- 双列桌面模式下，长状态获得焦点时保留清晰焦点环；状态文本在受限列中也允许换行并保持完整可读。窄屏状态始终允许换行，复制按钮提供至少 44px 的触控高度。
- 桌面端长值保留省略和完整 `title`；长值节点使用按钮切换展开/收起并读出字段和值的完整内容，触屏无需依赖悬停。窄屏普通值、复制值和状态说明均可换行；复制图标固定在右侧 44px 操作区，避免长文本换行时操作位置漂移。
- API 表格需要横向滚动时会显示对应提示；溢出的表格可通过键盘聚焦，并用方向键横向浏览。
- 标签允许长词断行；窄屏值列及其内嵌展示可以增高换行，组件根节点不会撑开抽屉或页面。
- `loading`、`empty`、`error` 不属于描述行组件的状态属性，由宿主组合状态提示与重试入口；Demo 重试按错误、读取中、详情顺序切换静态演示状态，不会请求后端。loading 使用 `LxIcon loading`，并在减少动效时保留静态状态。
- `mask` 只消费 `setupLxPermission` 注入的权限数据，不读取 Router、Pinia、接口或登录凭据。自定义插槽会接管值渲染，需要由宿主确保相同的脱敏规则。
- 行悬停只改变背景色；系统启用 `prefers-reduced-motion` 时关闭该过渡。
