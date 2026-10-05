# LxRadio / LxRadioGroup 单选组

基于 Element Plus `el-radio` / `el-radio-group` 内核封装，支持独立单选、组内单选和横纵排布。Demo 另展示只读历史值；禁用值位于组外，不影响组内键盘停靠。

视觉规范源：`design/表单控件八件套/code.html` 03。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxRadio/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxRadio/demo/basic.vue
:::

## LxRadio Props

| 名称         | 类型                          | 默认值           | 说明                                                                                                               |
| ------------ | ----------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `modelValue` | `string \| number \| boolean` | —                | 独立使用时的当前值（v-model）；组内值由 `LxRadioGroup` 管理。                                                      |
| `value`      | `string \| number \| boolean` | —                | 该项的选中值（配合 `LxRadioGroup` v-model）。                                                                      |
| `label`      | `string`                      | `''`             | 无插槽时的文字回退；未传 `value` 时兼作选中值（EP 旧契约兼容）。                                                   |
| `disabled`   | `boolean`                     | —（`undefined`） | 禁用态：灰底描边 + 灰字（标本 03 禁用行）。默认未设置：不阻断 `LxRadioGroup` / `ElForm` 禁用继承；显式传值才覆盖。 |
| `name`       | `string`                      | —                | 原生 name；组内缺省由 Group 注入。                                                                                 |

## LxRadioGroup Props

| 名称         | 类型                          | 默认值           | 说明                                                                            |
| ------------ | ----------------------------- | ---------------- | ------------------------------------------------------------------------------- |
| `modelValue` | `string \| number \| boolean` | —                | 当前选中项的值（v-model）；未选中时为 `undefined`。                             |
| `disabled`   | `boolean`                     | —（`undefined`） | 整组禁用；缺省时继承 `ElForm` 禁用状态，显式传入 `true` 或 `false` 时覆盖继承。 |
| `vertical`   | `boolean`                     | `false`          | 垂直排布（标本 03 处置通道优先级行）。                                          |
| `name`       | `string`                      | —                | 原生 name，注入组内全部 `LxRadio`。                                             |

## Events

| 组件           | 事件                | 参数                                 | 说明                                     |
| -------------- | ------------------- | ------------------------------------ | ---------------------------------------- |
| `LxRadio`      | `update:modelValue` | `(value: LxRadioValue \| undefined)` | 独立使用时同步 v-model。                 |
| `LxRadioGroup` | `update:modelValue` | `(value: LxRadioValue \| undefined)` | 同步 v-model；未选中时值为 `undefined`。 |
| `LxRadioGroup` | `change`            | `(value: LxRadioValue \| undefined)` | 选中项变化。                             |
| `LxRadio`      | `change`            | `(value: LxRadioValue \| undefined)` | 单项选中（EP 契约）。                    |

## Slots

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

| 契约项     | 标本 03                  | 实现                                      |
| ---------- | ------------------------ | ----------------------------------------- |
| 选中态     | 白底 + 蓝描边 + 6px 靶心 | 组件级固化（替代 EP 默认蓝底白心）        |
| hover      | 描边与文字同步转主色     | 组件级固化                                |
| 选中 label | 主色 + 500 字重          | 组件级固化                                |
| 水平间距   | gap-4（16px）            | `--lx-space-lg`，覆盖 EP 默认 32px 右距   |
| 垂直行距   | space-y-2（8px）         | `--lx-space-sm`                           |
| HUD 深色   | —                        | 靶环底色/靶心跟随 HUD 战术蓝（el-* 变量） |

## 可访问性

原生 `input[type=radio]` 语义 + `name` 组关联；键盘方向键组内切换（EP 原生）；Tab 进入组时显示主色外环，鼠标或程序化聚焦不显示（`focus-visible`）；触屏设备整个 label 的最小高度为 44px。HUD 深色主题下未选圆环使用深色表面，禁用项使用中性灰阶。系统启用“减少动效”时，靶心过渡缩短到 0.01ms，视觉上关闭缩放动效。

## Vue3 宿主适配

业务层使用 `LxRadioGroup` + `LxRadio` 组合（或全局组件名）。`element-theme.css` 对裸 `el-radio` 的全局同款覆写保留过渡期，存量直用页面迁移完成后摘除。
