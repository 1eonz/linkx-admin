# LxRadio / LxRadioGroup 单选组

用于在多个候选项中选择一项，例如权限范围或勤务响应等级；支持独立单选、组内单选和横纵排布。

## 交互示例

<script setup lang="ts">
import { useResponsiveDocTable } from '../.vitepress/theme/useResponsiveDocTable';
import Basic from '../../src/components/LxRadio/demo/basic.vue';

useResponsiveDocTable(24);
</script>

<Basic />

## 表单校验与错误恢复

Demo 包含必填响应通道组。未选择时提交会显示字段错误；选择一个通道后再次提交即可通过，也可重置表单。独立控件示例通过共享 `v-model` 与原生 `name` 同步选项。示例只使用 `LxForm`、`LxFormItem` 和组件库控件，不会发送业务请求。

::: details 查看示例代码
<<< ../../src/components/LxRadio/demo/basic.vue
:::

## 实现与辅助示例

组件封装 Element Plus `el-radio` / `el-radio-group`，保留组内键盘操作和旧版 `label` 值兼容。Demo 首屏展示独立 `LxRadio` 的父级共享模型与勤务响应等级组；只读历史值、旧版 `label` 用法、整组禁用及 `LxForm` 禁用继承位于默认折叠的辅助示例中。

## LxRadio Props

<p id="lx-radio-props-hint" class="lx-doc-table-scroll-hint lx-selection-control-doc-table-hint">表格可横向滚动；聚焦表格后可用方向键浏览。</p>

| 名称         | 类型                          | 默认值           | 说明                                                             |
| ------------ | ----------------------------- | ---------------- | ---------------------------------------------------------------- |
| `modelValue` | `string \| number \| boolean` | —                | 独立使用时的当前值（v-model）；组内值由 `LxRadioGroup` 管理。    |
| `value`      | `string \| number \| boolean` | —                | 该项的选中值（配合 `LxRadioGroup` v-model）。                    |
| `label`      | `string`                      | `''`             | 无插槽时的文字回退；未传 `value` 时兼作选中值（EP 旧契约兼容）。 |
| `disabled`   | `boolean`                     | —（`undefined`） | 禁用态主题与继承规则见下方说明。                                 |
| `name`       | `string`                      | —                | 原生 name；组内缺省由 Group 注入。                               |

<details class="lx-selection-control-doc-details">
<summary>禁用态主题与继承规则</summary>

浅色主题禁用项为灰底描边与灰字（标本 03 禁用行），HUD 深色主题使用中性灰阶。`disabled` 默认未设置时不阻断 `LxRadioGroup` / `ElForm` 的禁用继承；显式传入 `true` 或 `false` 才覆盖继承。

</details>

## LxRadioGroup Props

<p id="lx-radio-group-props-hint" class="lx-doc-table-scroll-hint lx-selection-control-doc-table-hint">表格可横向滚动；聚焦表格后可用方向键浏览。</p>

| 名称         | 类型                          | 默认值           | 说明                                                |
| ------------ | ----------------------------- | ---------------- | --------------------------------------------------- |
| `modelValue` | `string \| number \| boolean` | —                | 当前选中项的值（v-model）；未选中时为 `undefined`。 |
| `disabled`   | `boolean`                     | —（`undefined`） | 禁用整组；继承规则见下方说明。                      |
| `vertical`   | `boolean`                     | `false`          | 垂直排布（标本 03 处置通道优先级行）。              |
| `name`       | `string`                      | —                | 原生 name，注入组内全部 `LxRadio`。                 |

<details class="lx-selection-control-doc-details">
<summary>分组禁用继承规则</summary>

未显式设置 `disabled` 时，`LxRadioGroup` 继承 `ElForm` 的禁用状态；显式设置 `true` 或 `false` 时覆盖继承。

</details>

## Events

<p id="lx-radio-events-hint" class="lx-doc-table-scroll-hint lx-selection-control-doc-table-hint">表格可横向滚动；聚焦表格后可用方向键浏览。</p>

| 组件           | 事件                | 参数                                 | 说明                                     |
| -------------- | ------------------- | ------------------------------------ | ---------------------------------------- |
| `LxRadio`      | `update:modelValue` | `(value: LxRadioValue \| undefined)` | 独立使用时同步 v-model。                 |
| `LxRadioGroup` | `update:modelValue` | `(value: LxRadioValue \| undefined)` | 同步 v-model；未选中时值为 `undefined`。 |
| `LxRadioGroup` | `change`            | `(value: LxRadioValue \| undefined)` | 选中项变化。                             |
| `LxRadio`      | `change`            | `(value: LxRadioValue \| undefined)` | 单项选中（EP 契约）。                    |

## Slots

<p id="lx-radio-slots-hint" data-min-overflow-px="1" class="lx-doc-table-scroll-hint lx-selection-control-doc-table-hint">表格可横向滚动；聚焦表格后可用方向键浏览。</p>

| 组件           | 名称      | 说明                              |
| -------------- | --------- | --------------------------------- |
| `LxRadio`      | `default` | 选项文字；缺省回退 `label` prop。 |
| `LxRadioGroup` | `default` | 组内选项，放 `LxRadio`。          |

## 旧用法兼容

存量 Vue2 迁移代码惯用 `label` 承载选中值。EP 2.14 内核原生支持该回退（`value` 缺省时 `label` 兼作值），`LxRadio` 透传该契约，迁移零改动：

```vue
<LxRadioGroup v-model="channel">
  <!-- 与 <LxRadio value="encrypted"> 等价 -->
  <LxRadio label="encrypted">高密加密专线</LxRadio>
</LxRadioGroup>
```

## 与标本的对齐说明

视觉对照来源：`design/表单控件八件套/code.html` 03。

<p id="lx-radio-design-hint" class="lx-doc-table-scroll-hint lx-selection-control-doc-table-hint">表格可横向滚动；聚焦表格后可用方向键浏览。</p>

| 契约项     | 标本 03                                   | 实现                                      |
| ---------- | ----------------------------------------- | ----------------------------------------- |
| 选中态     | 白底 + 蓝描边 + 6px 靶心                  | 组件级固化（替代 EP 默认蓝底白心）        |
| hover      | 仅圆环描边转主色，文字不变                | 组件级固化；禁用项不响应                  |
| 选中 label | 水平组主色 + 500；纵向组正文色 + 常规字重 | 按标本上行与纵向权限列表分别实现          |
| 未选文字   | 正文色 `#303133`                          | `--lx-color-text-main`                    |
| 禁用文字   | 中性灰 `#909399`                          | `--lx-color-info`                         |
| 水平间距   | gap-4（16px）                             | `--lx-space-lg`，覆盖 EP 默认 32px 右距   |
| 垂直行距   | space-y-2（8px）                          | `--lx-space-sm`                           |
| HUD 深色   | —                                         | 靶环底色/靶心跟随 HUD 战术蓝（el-* 变量） |

## 可访问性

原生 `input[type=radio]` 语义 + `name` 组关联；键盘方向键组内切换（EP 原生）；Tab 进入组时显示主色外环，鼠标或程序化聚焦不显示（`focus-visible`）；触屏设备整个 label 的最小高度为 44px。HUD 深色主题下未选圆环使用深色表面，禁用项使用中性灰阶。系统启用“减少动效”时，靶心过渡缩短到 0.01ms，视觉上关闭缩放动效。

## Vue3 宿主适配

业务层使用 `LxRadioGroup` + `LxRadio` 组合（或全局组件名）。`element-theme.css` 对裸 `el-radio` 的全局同款覆写保留过渡期，存量直用页面迁移完成后摘除。
