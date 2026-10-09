# LxStatusSwitch 状态开关

用于表格行或设置项内切换开启/关闭状态。开关本体复用 `LxSwitch`（胶囊内两字文字模式），胶囊色彩、几何与触控规格由 `LxSwitch` 统一固化；本组件专注业务值映射（`0/1` 旧值兼容）、关闭确认与只读 Tag。组件不访问业务接口；状态保存、错误反馈和权限判断由宿主负责。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxStatusSwitch/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxStatusSwitch/demo/basic.vue
:::

示例覆盖布尔值、旧业务 `0/1` 值、加载锁、只读值、关闭确认和保存失败恢复，并可切换 HUD 深色主题。状态修改由本地内存 Mock 模拟，不会发送网络请求。

## Props

| 名称          | 类型                        | 默认值      | 说明                                                                                             |
| ------------- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `modelValue`  | `boolean \| number`         | `false`     | 当前状态；数字模式下 `0` 为开启、`1` 为关闭。                                                    |
| `loading`     | `boolean`                   | `false`     | 阻止重复切换并显示加载状态。                                                                     |
| `disabled`    | `boolean`                   | `false`     | 只读显示当前状态，不渲染开关。                                                                   |
| `permission`  | `string`                    | `undefined` | 宿主注入的按钮权限码；无权限时按 `fallbackTag` 降级。                                            |
| `fallbackTag` | `boolean`                   | `true`      | 无权限时显示浅灰 `LxTag`，避免灰色死开关造成误解。                                               |
| `confirm`     | `string \| object \| false` | `false`     | 关闭前确认说明；可传 `title`、`message`、`confirmText`、`cancelText`、`type`；开启时不弹确认框。 |
| `onText`      | `string`                    | `开启`      | 开启状态文案。                                                                                   |
| `offText`     | `string`                    | `关闭`      | 关闭状态文案。                                                                                   |

## Events

| 事件                | 参数                | 说明                                            |
| ------------------- | ------------------- | ----------------------------------------------- |
| `update:modelValue` | `boolean \| number` | 用户确认切换后的新状态，可配合 `v-model` 使用。 |
| `change`            | `boolean \| number` | 用户切换后的新状态。                            |

## 行为与边界

- 数字模式保留旧值映射：`0` 表示开启，`1` 表示关闭；布尔模式按 `true/false` 表示开启/关闭。
- `confirm` 只拦截关闭操作；用户取消时不会发出状态更新事件。
- `disabled` 是宿主提供的只读状态；`permission` 只消费宿主通过 `setupLxPermission` 注入的权限源，不请求接口。权限码未命中且 `fallbackTag` 为 `true` 时降级为浅灰 `LxTag`，不渲染可点击的灰色死开关。
- `loading` 阻止连续切换并为开关暴露 `aria-busy="true"`。宿主应在保存 Promise 的 `finally()` 中释放 loading，并在失败时保留原值。
- 确认框等待期间若宿主进入 loading、只读或权限失效状态，确认结果会被丢弃，避免旧弹窗回写最新状态。
- 只读与无权限降级标签带有 `aria-disabled="true"`；标签文案仍保留当前开启/关闭状态，便于读屏用户识别。
- 组件在窄屏提供至少 44×44px 的点按区域，同时保持 42×20px 视觉轨道；键盘焦点可见，系统启用减少动效时缩短开关过渡。

## 设计对照记录

- 开启态使用 `LxSwitch` 42×20px 绿色胶囊，关闭态统一中性灰；关闭危险性由 `confirm` 文案和确认层表达，不使用红色开关。
- 加载态沿用 `LxSwitch` 内置 Spinner 并阻止重复切换；键盘焦点与窄屏 44×44px 点按区由基础开关统一提供。
- 设计稿的 `permission`/`fallbackTag` 已作为纯 UI 契约补齐，权限来源仍由宿主注入，当前不承担权限中心业务。
