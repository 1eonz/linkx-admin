# LxInput 文本输入框

基于 Element Plus `el-input` 内核二次封装的文本输入框。32px 基准高、4px 圆角、主色焦点光环；错误态红边浅红底深红值由全局令牌桥承接 `LxForm` 校验上下文自动生效；`mono` 开启等宽值呈现。未声明的 EP props（`formatter`/`parser` 等）经 attrs 透传，兼容旧用法。

视觉规范源：`design/表单控件八件套/code.html` 01。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxInput/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxInput/demo/basic.vue
:::

## Props

| 名称            | 类型                   | 默认值           | 说明                                                                                                                 |
| --------------- | ---------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `string \| number`     | `''`             | 输入值（v-model）。                                                                                                  |
| `type`          | `string`               | `'text'`         | 原生 input type（`text`/`password` 等）；文本域请使用 `LxTextarea`。                                                 |
| `placeholder`   | `string`               | `''`             | 占位文案。                                                                                                           |
| `disabled`      | `boolean`              | —（`undefined`） | 禁用态：灰底 + 禁用手势（标本 01 禁用行）。默认未设置：`ElForm` 禁用态可正常传导；显式传 `true`/`false` 才覆盖继承。 |
| `readonly`      | `boolean`              | `false`          | 只读态：可聚焦不可改值。                                                                                             |
| `clearable`     | `boolean`              | `false`          | 可清空：值非空时右侧清除按钮。                                                                                       |
| `showPassword`  | `boolean`              | `false`          | 密码明暗切换（仅 `type="password"` 生效）。                                                                          |
| `maxlength`     | `number`               | —                | 最大长度；与 `showWordLimit` 联动出现计数器（硬截断）。                                                              |
| `minlength`     | `number`               | —                | 最小长度（表单校验契约，不产生视觉反馈）。                                                                           |
| `showWordLimit` | `boolean`              | `false`          | 显示字数统计（等宽 11px 右下角）。                                                                                   |
| `mono`          | `boolean`              | `false`          | 值用等宽字体：警号、证件号、编码等机器读数字段开启（标本 01 font-mono）。                                            |
| `size`          | `'sm' \| 'md' \| 'lg'` | `'md'`           | 工程尺寸：28 / 32 / 40px；档名区别于 EP 的 `small/default/large`。                                                   |
| `name`          | `string`               | —                | 原生 name 属性。                                                                                                     |
| `autocomplete`  | `string`               | `'off'`          | 自动完成提示；默认关闭浏览器记忆，涉密场景保持默认。                                                                 |

## Events

| 名称                | 参数                  | 说明                      |
| ------------------- | --------------------- | ------------------------- |
| `update:modelValue` | `(value: string)`     | 输入值变化。              |
| `input`             | `(value: string)`     | 输入事件（EP 内核原生）。 |
| `change`            | `(value: string)`     | 失焦且值变化时派发。      |
| `focus`             | `(event: FocusEvent)` | 聚焦。                    |
| `blur`              | `(event: FocusEvent)` | 失焦。                    |
| `clear`             | —                     | 点击清除按钮。            |

## Slots

| 名称      | 说明                     |
| --------- | ------------------------ |
| `prefix`  | 输入框内前置内容（图标） |
| `suffix`  | 输入框内后置内容         |
| `prepend` | 输入框外前置复合块       |
| `append`  | 输入框外后置复合块       |

## Exposes

| 名称     | 说明           |
| -------- | -------------- |
| `focus`  | 聚焦输入框。   |
| `blur`   | 移除焦点。     |
| `select` | 选中全部文本。 |

## 错误态

错误态不通过组件 props 声明：置于 `LxForm`/`LxFormItem` 校验上下文内，校验失败自动获得红边 `#ba1a1a` + 浅红底 `#fff5f5` + 深红值文字（全局令牌桥供给，承接波 1）。

## 与标本的有意识偏差

| 偏差项     | 标本      | 实现                      | 依据                                                                  |
| ---------- | --------- | ------------------------- | --------------------------------------------------------------------- |
| 计数器字号 | 10px      | 11px + `--lx-text-label`  | 10px 过小影响可读性；label 档约 6.1:1 达 AA（secondary 3.2:1 不达标） |
| 禁用锁图标 | lock 图标 | 裁剪                      | DESIGN-SYNC-AUDIT 终裁裁剪项                                          |
| 触控目标   | 32px      | 触屏（`hover: none`）44px | 与 Radio/Checkbox/Switch 同族触控契约（critique 2026-09-29 P2 修正）  |

## 可访问性

键盘焦点主色边框 + 光环（组件级固化，脱离全局桥不漂移）；`name`/`id` 供读屏关联；`autocomplete="off"` 默认防涉密字段浏览器记忆（高频可自动填充字段可按需覆写）；开启"减少动效"系统偏好时过渡动画全局关闭。

## Vue3 宿主适配

业务层直接使用 `LxInput`（或全局组件名 `<LxInput />`）。密码场景已有 `LxPasswordInput`（含防复制粘贴），通用文本输入用本组件；宿主存量 `el-input` 直用页面按 UI-04 波次另行替换。
