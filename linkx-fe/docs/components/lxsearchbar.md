# LxSearchBar 检索面板

配置驱动的检索面板，负责字段展示、值变更、展开收起和按钮事件；查询、重置后的列表请求由宿主处理。

<script setup lang="ts">
import Basic from '../../src/components/LxSearchBar/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxSearchBar/demo/basic.vue
:::

## Props

| 名称                        | 类型                              | 默认值          | 说明                                                               |
| --------------------------- | --------------------------------- | --------------- | ------------------------------------------------------------------ |
| `fields`                    | `LxSearchField[]`                 | `[]`            | 支持 input、select、date、daterange、number、tree-select、cascader |
| `modelValue`                | `Record<string, unknown>`         | `{}`            | 受控查询值                                                         |
| `loading`                   | `boolean`                         | `false`         | 查询中禁用搜索/重置并展示按钮加载态                                |
| `collapsible` / `collapsed` | `boolean`                         | `true` / `true` | 字段超过 8 个时支持收起和展开                                      |
| `statusText`                | `string`                          | `等待查询`      | 未提供 `meta` 插槽时显示的默认状态；传空字符串可隐藏状态行         |
| `size`                      | `'small' \| 'default' \| 'large'` | `'default'`     | 透传按钮尺寸                                                       |

## Events 与插槽

- `update:modelValue`：字段变化后的完整查询对象。
- `search`：点击查询或回车；宿主在此启动请求。
- `reset`：恢复字段默认值后触发，并随后触发 `search`。
- `update:collapsed`：展开状态变化。
- `filters`：在字段网格中追加自定义过滤项。
- `controls`：接管查询/重置按钮，作用域提供 `search`、`reset`、`canReset` 和 `loading`。
- `actions`：在默认查询/重置按钮前追加操作。

字段超过 8 个时默认显示前 4 项；收起按钮会明确播报隐藏字段数量。字段恰好 4 个且没有 `filters` 插槽时，查询/重置会与字段在同一行呈现，窄屏自动回落为全宽操作行。组件根节点使用 `role="search"`，查询中暴露 `aria-busy="true"`，窄屏查询/重置/展开控件保持至少 44px 点按高度。字段的树和级联选项使用递归 `children`；组件不发起请求，也不保存列表数据。输入框回车触发 `search`，字段获得焦点时按 `Esc` 执行重置；`meta` 插槽可呈现结果数量、耗时和快捷键等宿主状态；未提供插槽时由 `statusText` 提供最小可见状态。Demo 的成功、空结果和失败均为宿主侧内存 Mock，业务 API 仍由宿主按 `.then().catch().finally()` 编排。

普通选择及树选择选项的值支持字符串、数字或布尔值。级联选项遵循 Element Plus Cascader 契约，支持字符串、数字和记录对象值，不接受布尔值、数组或函数作为单个节点值；记录对象（包括含 `call` 或 `Symbol.iterator` 业务字段的对象）和混合路径会按原类型传入，并从 `update:modelValue` 原样发出。

## 验收记录

- Demo 同时展示四字段标准态：桌面端字段与查询/重置操作同行，窄屏回落为单列；复杂检索态继续覆盖超过 8 个字段时的折叠与展开。
- 行为测试覆盖受控字段更新、按 schema 默认值重置并立即查询、loading 时阻止查询、四字段同行操作和超过 8 个字段时展开全部条件（单测 9/9）。
- 级联行为测试覆盖数字、混合及具名对象接口路径的回显与事件回传，并确认记录对象中的普通 `call`/`Symbol.iterator` 字段不会被误过滤；Demo 使用数字组织 ID。
- Chrome 文档 E2E **3/3** 通过，覆盖成功/空结果/失败及失败后恢复、重置、loading 锁定、Enter/Escape、展开收起、键盘焦点和 375px 无横向溢出；站内中文搜索与侧栏回归另为 3/3。

## 设计对照记录

- 容器对齐 `design/检索面板 SearchBar/code.html`：16px 内边距、4px 圆角、卡片边框与轻阴影。
- 字段栅格保持 24 列（默认字段占 6 列，即 4 列标准形态），字段超过 8 个时默认展示前 4 项并支持展开。
- Demo 同时提供四字段标准态和多字段折叠态；标准态在桌面端验证四字段与操作同行，窄屏回落为单列。
- 控件统一 32px 紧凑高度，标签使用 12px 表单标签色；查询按钮为唯一主操作，重置按钮保持纯文字次操作。
- 设计稿中的结果、耗时和快捷键信息通过 `meta` 插槽注入，避免把业务请求耦合进组件；Demo 不再重复显示同一份等待状态。
- 四字段标准态将操作组放入同一栅格行，保持设计稿的扫描顺序；复杂字段和自定义 `filters` 继续使用底部操作栏。
