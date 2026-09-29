# LxSwitch 状态开关

基于 Element Plus `el-switch` 内核二次封装的通用状态开关。胶囊固定 **40×20**、滑块 16px；开启 `#67c23a` 成功绿、关闭 `#909399` 信息灰。有意识裁剪：不开放 size 档（标本 07 胶囊尺寸为唯一契约）；`active-value`/`inactive-value`/`before-change` 等旧 EP props 经 attrs 透传。

支持 EP 原生文字能力：`activeText`/`inactiveText` 配合 `inlinePrompt` 将两字文案显示在胶囊内（胶囊放宽至 42px），不加 `inlinePrompt` 时文字显示在胶囊两侧。

与场景化的 `LxStatusSwitch`（表格行内状态列，带状态文字胶囊）并存：通用表单开关用本组件，`LxStatusSwitch` 内部亦复用本组件作为开关本体。

视觉规范源：`design/表单控件八件套/code.html` 07。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxSwitch/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxSwitch/demo/basic.vue
:::

## Props

| 名称           | 类型                          | 默认值           | 说明                                                                                                                                                               |
| -------------- | ----------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `modelValue`   | `boolean \| string \| number` | `false`          | 开关值（v-model；自定义值经 `active-value` attrs）。                                                                                                               |
| `activeText`   | `string`                      | —                | 开启态文字；`inlinePrompt` 时显示在胶囊内，否则胶囊右侧。                                                                                                          |
| `inactiveText` | `string`                      | —                | 关闭态文字；`inlinePrompt` 时显示在胶囊内，否则胶囊左侧。                                                                                                          |
| `inlinePrompt` | `boolean`                     | `true`           | 文字显示在胶囊内；开启后胶囊放宽至 42px 容纳两字文案。Lx 默认 true（与 EP 原生默认 false 有意不同），两侧文字模式显式传 `false`。                                  |
| `disabled`     | `boolean`                     | —（`undefined`） | 禁用态：胶囊半透明 + 禁用手势（标本 07"上级锁定"行）。默认未设置：不阻断 EP 内核禁用继承链（loading 拦截 / `ElForm` 禁用传导）；显式传 `true`/`false` 才覆盖继承。 |
| `loading`      | `boolean`                     | `false`          | 加载态：滑块 spinner + 点击拦截。                                                                                                                                  |
| `name`         | `string`                      | —                | 原生 name 属性。                                                                                                                                                   |

## Events

| 名称                | 参数      | 说明         |
| ------------------- | --------- | ------------ |
| `update:modelValue` | `(value)` | 开关值变化。 |
| `change`            | `(value)` | 开关切换。   |

## 旧 EP props 透传

`active-value`/`inactive-value`（自定义开关值）、`before-change`（切换前拦截）经 attrs 透传给 EP 内核：

```vue
<LxSwitch v-model="mode" active-value="on" inactive-value="off" />
```

## 与标本的对齐说明

| 契约项     | 标本 07                | 实现                                                                    |
| ---------- | ---------------------- | ----------------------------------------------------------------------- |
| 胶囊几何   | 40×20 胶囊 + 16px 滑块 | EP 内核默认值恰好对齐，显式固化防升级漂移                               |
| 开启色     | #67c23a（成功绿）      | `--lx-color-success` 注入 EP 开关变量                                   |
| 关闭色     | #909399（信息灰）      | `--lx-color-info` 注入 EP 开关变量                                      |
| 禁用       | #67c23a/50 半透明      | 胶囊 opacity 0.5                                                        |
| 状态文字   | 外部"开启/关闭"文字    | 宿主布局表达（状态不能只靠颜色区分）                                    |
| 胶囊内文字 | —（衍生场景）          | `inlinePrompt` 默认 true：42px 胶囊 + 11px/600 深灰对比文字，主用法形态 |
| size 档    | —                      | 有意识裁剪，胶囊尺寸唯一                                                |

## 可访问性

`role="switch"` + 隐藏 input 键盘可达（空格/回车切换，EP 原生）；键盘焦点主色外环（仅键盘导航显示）；触屏设备 44px 最小触控目标（胶囊经内边距撑大命中区）。

## Vue3 宿主适配

业务层直接使用 `LxSwitch`（或全局组件名）。`element-theme.css` 对裸 `el-switch` 的全局色彩桥保留过渡期；表格行内状态列继续用 `LxStatusSwitch`。
