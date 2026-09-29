# LxTextarea 文本域

基于 Element Plus `el-input type="textarea"` 内核二次封装的多行文本域。3 行基准高度、8/12px 内边距、底部右对齐等宽字数计数（11px）、默认 `resize: vertical`。溢出红字计数为有意识裁剪：EP `maxlength` 硬截断下超限态不可达（DESIGN-SYNC-AUDIT 终裁）。

视觉规范源：`design/表单控件八件套/code.html` 08。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxTextarea/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxTextarea/demo/basic.vue
:::

## Props

| 名称            | 类型                                                | 默认值           | 说明                                                                                                                                                                       |
| --------------- | --------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `string`                                            | `''`             | 输入值（v-model）。                                                                                                                                                        |
| `placeholder`   | `string`                                            | `''`             | 占位文案。                                                                                                                                                                 |
| `disabled`      | `boolean`                                           | —（`undefined`） | 禁用态：灰底 + 禁用手势。默认未设置：`ElForm` 禁用态可正常传导；显式传 `true`/`false` 才覆盖继承。                                                                         |
| `readonly`      | `boolean`                                           | `false`          | 只读态。                                                                                                                                                                   |
| `rows`          | `number`                                            | `3`              | 行数（标本 08 三行基准约 74px）。                                                                                                                                          |
| `autosize`      | `boolean \| { minRows?: number; maxRows?: number }` | `false`          | 自适应高度：`true` 随内容撑开，或指定行数区间。                                                                                                                            |
| `maxlength`     | `number`                                            | —                | 最大长度；与 `showWordLimit` 联动出现计数器（硬截断）。                                                                                                                    |
| `showWordLimit` | `boolean`                                           | `false`          | 显示字数统计。EP 2.14.6 契约：须配合 `maxlength` 才渲染计数器（无 `maxlength` 不显示，旧版域外计数行为已移除；位置可经 attrs 透传 `word-limit-position="outside"` 切换）。 |
| `resize`        | `'none' \| 'both' \| 'horizontal' \| 'vertical'`    | `'vertical'`     | 原生 resize 行为（标本 08 resize-y 契约）。                                                                                                                                |
| `name`          | `string`                                            | —                | 原生 name 属性。                                                                                                                                                           |

## Events

| 名称                | 参数                  | 说明                 |
| ------------------- | --------------------- | -------------------- |
| `update:modelValue` | `(value: string)`     | 输入值变化。         |
| `input`             | `(value: string)`     | 输入事件。           |
| `change`            | `(value: string)`     | 失焦且值变化时派发。 |
| `focus`             | `(event: FocusEvent)` | 聚焦。               |
| `blur`              | `(event: FocusEvent)` | 失焦。               |

## Exposes

| 名称    | 说明         |
| ------- | ------------ |
| `focus` | 聚焦文本域。 |
| `blur`  | 移除焦点。   |

## 与标本的有意识偏差

| 偏差项       | 标本                         | 实现                                     | 依据                                                                   |
| ------------ | ---------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| 溢出红字计数 | 超限 218/200 红字 + 错误提示 | 裁剪                                     | EP maxlength 硬截断，超限态不可达                                      |
| 计数器字号   | 10px                         | 11px + 等宽 + label 色（约 6.1:1 达 AA） | 10px 过小影响可读性；secondary 3.2:1 不达 AA（critique 2026-09-29 P2） |
| 字体         | 标本 textarea 为 font-sans   | 继承宿主字体栈                           | 文案说明类内容非机器读数，不开 mono                                    |

## 可访问性

`name`/`id` 供读屏关联；键盘焦点主色边框 + 光环（组件级固化，脱离全局桥不漂移）；错误态置于 `LxForm` 校验上下文自动生效；"减少动效"偏好时过渡动画全局关闭。多行基线天然 ≥44px，无需触屏提升。

## Vue3 宿主适配

业务层直接使用 `LxTextarea`（或全局组件名 `<LxTextarea />`）；与 `LxInput` 分立两个组件，表单 schema 可按字段类型精确选择。
