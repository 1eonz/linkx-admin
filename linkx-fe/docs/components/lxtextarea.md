# LxTextarea 文本域

基于 Element Plus `el-input type="textarea"` 内核二次封装的多行文本域，默认三行基准高度、8/12px 内边距与 `resize: vertical`。

设置非负 `maxlength` 后，字段处于可编辑状态时默认显示右对齐等宽的内容长度计数；禁用或只读时隐藏计数，也可通过 `:show-word-limit="false"` 关闭。`maxlength="0"` 会显示 `0 / 0` 和“已达上限”。计数遵循浏览器原生 `textarea maxlength` 规则，即按 UTF-16 代码单元计算；部分 emoji 会占用多个单位。`maxlengthMode="truncate"` 保留原生硬截断；长度从未到限变为到限时，计数旁显示“已达上限”并向辅助技术播报一次。`maxlengthMode="validate"` 允许内容暂时超过阈值，可见错误提示修正方式，计数持续显示当前长度，长度首次进入超限状态时，辅助技术收到一次简短提醒。初始值已到限或超限时不主动播报，用户聚焦字段后可从计数器的可访问名称或关联的错误说明读取当前长度和状态。

视觉规范源：`design/表单控件八件套/code.html` 08。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxTextarea/demo/basic.vue';
import { useResponsiveDocTable } from '../.vitepress/theme/useResponsiveDocTable';

useResponsiveDocTable();
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxTextarea/demo/basic.vue
:::

## Props

### 输入值

<p id="lx-textarea-input-table-hint" class="lx-doc-table-scroll-hint lx-textarea-doc-table-hint">可左右滑动查看完整属性；聚焦表格后可用方向键横向浏览。</p>

| 名称          | 类型     | 默认值 | 说明                |
| ------------- | -------- | ------ | ------------------- |
| `modelValue`  | `string` | `''`   | 输入值（v-model）。 |
| `placeholder` | `string` | `''`   | 占位文案。          |

### 长度与计数

<p id="lx-textarea-length-table-hint" class="lx-doc-table-scroll-hint lx-textarea-doc-table-hint">可左右滑动查看完整属性；聚焦表格后可用方向键横向浏览。</p>

| 名称                | 类型                       | 默认值       | 说明                                                                                                                     |
| ------------------- | -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `maxlength`         | `number`                   | —            | 最大长度；遵循浏览器原生文本域规则，按 UTF-16 代码单元计数。`truncate` 为输入上限，`validate` 为校验阈值；非负值含 `0`。 |
| `maxlengthMode`     | `'truncate' \| 'validate'` | `'truncate'` | 超限处理方式。`truncate` 硬截断；`validate` 保留超出部分、设置 `aria-invalid` 并关联错误说明。                           |
| `showWordLimit`     | `boolean`                  | `true`       | 显示内容长度计数，需设置非负 `maxlength`；仅在可编辑、非只读且未禁用时显示，显式传 `false` 可关闭。                      |
| `wordLimitPosition` | `'inside' \| 'outside'`    | `'outside'`  | `truncate` 模式的计数器位置；`inside` 会预留底部内边距。`validate` 为容纳错误说明，计数固定显示在下方。                  |

### 尺寸与编辑状态

<p id="lx-textarea-state-table-hint" class="lx-doc-table-scroll-hint lx-textarea-doc-table-hint">可左右滑动查看完整属性；聚焦表格后可用方向键横向浏览。</p>

| 名称       | 类型                                                | 默认值           | 说明                                                                                          |
| ---------- | --------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `disabled` | `boolean`                                           | —（`undefined`） | 禁用态：灰底 + 禁用手势。默认未设置时继承 `ElForm` 禁用态；显式传 `true`/`false` 才覆盖继承。 |
| `readonly` | `boolean`                                           | `false`          | 只读态：可聚焦、选择和复制，但不可编辑；浅主色底与中性灰底禁用态区分。                        |
| `rows`     | `number`                                            | `3`              | 行数（标本 08 三行基准约 74px）。                                                             |
| `autosize` | `boolean \| { minRows?: number; maxRows?: number }` | `false`          | 自适应高度：`true` 随内容撑开，或指定行数区间。                                               |
| `resize`   | `'none' \| 'both' \| 'horizontal' \| 'vertical'`    | `'vertical'`     | 原生 resize 行为（标本 08 resize-y 契约）。                                                   |

### 原生属性

<p id="lx-textarea-native-table-hint" class="lx-doc-table-scroll-hint lx-textarea-doc-table-hint">可左右滑动查看完整属性；聚焦表格后可用方向键横向浏览。</p>

| 名称   | 类型     | 默认值   | 说明                                     |
| ------ | -------- | -------- | ---------------------------------------- |
| `id`   | `string` | 自动生成 | 原生 id 属性；未设置时生成实例唯一标识。 |
| `name` | `string` | —        | 原生 name 属性。                         |

## Events

<p id="lx-textarea-events-table-hint" class="lx-doc-table-scroll-hint lx-textarea-doc-table-hint">可左右滑动查看完整事件参数；聚焦表格后可用方向键横向浏览。</p>

| 名称                | 参数                  | 说明                 |
| ------------------- | --------------------- | -------------------- |
| `update:modelValue` | `(value: string)`     | 输入值变化。         |
| `input`             | `(value: string)`     | 输入过程中派发。     |
| `change`            | `(value: string)`     | 失焦且值变化时派发。 |
| `focus`             | `(event: FocusEvent)` | 聚焦。               |
| `blur`              | `(event: FocusEvent)` | 失焦。               |

## Exposes

| 名称    | 说明         |
| ------- | ------------ |
| `focus` | 聚焦文本域。 |
| `blur`  | 移除焦点。   |

Demo 首屏展示基础输入和超限校验；“其他状态与交互”默认收起，展开后按“尺寸与编辑状态”“公开聚焦控制”分组展示自适应、内嵌计数、禁用、只读、禁止拖拽和公开方法示例。窄屏主题开关与展开入口保留 44px 触控高度。“聚焦文本域”和“移除焦点”按钮分别调用上述公开方法；空值示例同时展示 `input`、`focus`、`blur` 和 `change` 事件。

## 与标本的有意识偏差

<p id="lx-textarea-deviations-table-hint" class="lx-doc-table-scroll-hint lx-textarea-doc-table-hint">可左右滑动查看完整偏差依据；聚焦表格后可用方向键横向浏览。</p>

| 偏差项     | 标本                       | 实现                                     | 依据                                                                   |
| ---------- | -------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| 计数器字号 | 10px                       | 12px + 等宽 + label 色（约 6.1:1 达 AA） | 10px 过小影响可读性；secondary 3.2:1 不达 AA（critique 2026-09-29 P2） |
| 字体       | 标本 textarea 为 font-sans | 继承宿主字体栈                           | 文案说明类内容非机器读数，不开 mono                                    |

## 可访问性

字段可访问名称应由关联的 `<label for="字段id">`、`aria-label` 或 `aria-labelledby` 提供；`name` 仅作为原生表单字段名，不会单独形成读屏名称。`aria-describedby` 可关联帮助文案，校验超限时组件会保留已有描述并追加当前错误说明；硬截断到限和校验模式进入超限时，均只在长度状态从正常变为到限或超限时播报一次简短提示，不随每次输入重复播报。初始值已到限或超限时不主动打断；计数器保留 `status` 语义并设置 `aria-live="off"`，读屏用户聚焦后可主动读取当前长度及状态，超限时也能读取关联错误说明。只读与禁用时隐藏计数器，避免展示不可操作字段的编辑计数。键盘焦点使用主色边框与光环；只读态使用浅主色底和文本光标，仍可聚焦、选择和复制；禁用态使用中性灰底、柔和边框与禁用光标。表单错误态置于 `LxForm` 校验上下文自动生效；"减少动效"偏好时过渡动画全局关闭。多行基线天然 ≥44px，无需触屏提升。

```vue
<label for="memo">交接备忘</label>
<LxTextarea
  id="memo"
  name="memo"
  :maxlength="200"
  aria-describedby="memo-limit"
  placeholder="请输入交接内容"
/>
<p id="memo-limit">长度上限为 200；达到上限后继续输入不会写入。</p>
```

## Vue3 宿主适配

业务层直接使用 `LxTextarea`（或全局组件名 `<LxTextarea />`）；与 `LxInput` 分立两个组件，表单 schema 可按字段类型精确选择。
