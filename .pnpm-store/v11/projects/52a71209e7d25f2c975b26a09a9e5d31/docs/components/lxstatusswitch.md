# LxStatusSwitch 状态开关

用于表格行或设置项内切换开启/关闭状态。组件不访问业务接口；状态保存、错误反馈和权限判断由宿主负责。

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

| 名称         | 类型                | 默认值  | 说明                                          |
| ------------ | ------------------- | ------- | --------------------------------------------- |
| `modelValue` | `boolean \| number` | `false` | 当前状态；数字模式下 `0` 为开启、`1` 为关闭。 |
| `loading`    | `boolean`           | `false` | 阻止重复切换并显示加载状态。                  |
| `disabled`   | `boolean`           | `false` | 只读显示当前状态，不渲染开关。                |
| `confirm`    | `string \| false`   | `false` | 关闭前确认说明；开启时不弹确认框。            |
| `onText`     | `string`            | `开启`  | 开启状态文案。                                |
| `offText`    | `string`            | `关闭`  | 关闭状态文案。                                |

## Events

| 事件                | 参数                | 说明                                            |
| ------------------- | ------------------- | ----------------------------------------------- |
| `update:modelValue` | `boolean \| number` | 用户确认切换后的新状态，可配合 `v-model` 使用。 |
| `change`            | `boolean \| number` | 用户切换后的新状态。                            |

## 行为与边界

- 数字模式保留旧值映射：`0` 表示开启，`1` 表示关闭；布尔模式按 `true/false` 表示开启/关闭。
- `confirm` 只拦截关闭操作；用户取消时不会发出状态更新事件。
- `disabled` 是宿主提供的只读状态，不等同于权限系统。新增的权限码判定与无权限展示按项目计划延期。
- `loading` 阻止连续切换。宿主应在保存 Promise 的 `finally()` 中释放 loading，并在失败时保留原值。
- 组件在窄屏提供至少 44×44px 的点按区域，同时保持 42×20px 视觉轨道；键盘焦点可见，系统启用减少动效时缩短开关过渡。
