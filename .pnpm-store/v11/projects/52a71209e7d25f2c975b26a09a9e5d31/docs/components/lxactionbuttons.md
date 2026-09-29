# LxActionButtons 行内操作

表格行内操作按钮组：外显按钮走 `LxButton` 文字形态内核（拍板 #11：表格行内一律 text 形态），语义色四档 + 自定义色；超出 `max` 数量折叠进可键盘操作的「更多」列表，随权限过滤/条件显隐动态增减。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxActionButtons/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxActionButtons/demo/basic.vue
:::

示例覆盖基础组合、全语义色档、图标与禁用、onClick 回调、溢出折叠；演示数据仅存在于页面内存，不请求后端。

## Props

| 名称        | 说明                                                        | 类型             | 默认值 |
| ----------- | ----------------------------------------------------------- | ---------------- | ------ |
| `actions`   | 操作列表                                                    | `LxActionItem[]` | `[]`   |
| `max`       | 直接显示的数量，超出折叠进「更多」；随 actions 动态自动增减 | `number`         | `3`    |
| `more-text` | 折叠菜单触发文字                                            | `string`         | `更多` |

### LxActionItem

| 字段        | 说明                                                               | 类型                                                           |
| ----------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `label`     | 显示文字                                                           | `string`                                                       |
| `type`      | 语义色档（见下方映射表）                                           | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'default'` |
| `textColor` | 自定义文字色（语义色之外的场景）；hover 浅底按该色自动派生         | `string`                                                       |
| `icon`      | 可选图标（文字左侧，尺寸跟 LxButton 文字形态图标档）               | `LxIconName`                                                   |
| `hidden`    | 条件隐藏（业务侧权限过滤后传入）                                   | `boolean`                                                      |
| `disabled`  | 禁用该项并阻止点击事件                                             | `boolean`                                                      |
| `onClick`   | 点击回调（可选）：先派发统一 `click` 事件后调用，免父级按 key 分发 | `(action: LxActionItem) => void`                               |
| `key`       | 列表稳定键；省略时由名称和顺序生成                                 | `string`                                                       |
| `auth`      | 权限码；未配置权限源时沿用可见行为                                 | `string \| string[]`                                           |
| `meta`      | 业务透传                                                           | `Record<string, unknown>`                                      |

### 语义色档映射（2026-09-29 两项目 192 例全量调研拍板）

| 语义               | `type` 值 | 颜色 |
| ------------------ | --------- | ---- |
| 编辑/详情/常规操作 | `primary` | 蓝   |
| 删除/禁用/解绑     | `danger`  | 红   |
| 启用/恢复/拒绝     | `warning` | 橙   |
| 激活/正向授权      | `success` | 绿   |

`default` 兼容旧值，渲染与 `primary` 同为蓝色文字形态。

### Events

| 名称    | 说明                           | 回调                     |
| ------- | ------------------------------ | ------------------------ |
| `click` | 任一操作被点击（含折叠菜单内） | `(action: LxActionItem)` |

## 使用铁律

- 行内操作一律文字形态（组件内置），禁止实底按钮（拍板 #11）。
- 语义色按映射表取档：编辑=primary、删除/禁用=danger、启用/恢复=warning、激活/授权=success；折叠进「更多」后颜色保持一致。
- 危险操作（删除/停用）标 `type: 'danger'`，点击后必须接 lxConfirm 二次确认。
- 权限过滤在业务侧完成（`hidden: true` 或直接不传入）；权限/显隐变化后「更多」入口自动增减，无需手动管理。
- 「更多」支持点击、Tab/Enter/Space 与 Escape，焦点移出或点击外部时收起；收起后焦点回到触发按钮。
- 窄屏下操作按钮和菜单项至少 44px 高；超长操作名称允许换行，不撑宽页面。
