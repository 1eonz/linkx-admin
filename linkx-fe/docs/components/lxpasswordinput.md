# LxPasswordInput 密码输入框

用于登录和敏感配置表单中的密码输入。组件只处理输入展示和通用事件，不访问业务接口。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxPasswordInput/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxPasswordInput/demo/basic.vue
:::

示例覆盖明文切换、清空、只读、禁用和公开实例方法；密码仅保存在当前页面内存中，不会发送网络请求。

## Props

| 名称               | 类型                                                            | 默认值           | 说明                                                                     |
| ------------------ | --------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| `modelValue`       | `string`                                                        | `''`             | 受控密码值，配合 `v-model` 使用。                                        |
| `placeholder`      | `string`                                                        | `''`             | 输入提示。                                                               |
| `disabled`         | `boolean`                                                       | —（`undefined`） | 禁用输入和聚焦；未设置时继承 `LxForm/ElForm` 的禁用态。                  |
| `readonly`         | `boolean`                                                       | `false`          | 只读展示，仍可聚焦和选中。                                               |
| `clearable`        | `boolean`                                                       | `false`          | 显示清空操作。                                                           |
| `showPassword`     | `boolean`                                                       | `true`           | 显示内置的密码/明文切换操作。                                            |
| `preventClipboard` | `boolean`                                                       | `false`          | 通过前端事件显式阻止复制、剪切和粘贴；默认允许密码管理器操作。           |
| `maxlength`        | `number \| string`                                              | —                | 最大输入长度。                                                           |
| `minlength`        | `number \| string`                                              | —                | 最小输入长度提示，提交校验由宿主表单负责。                               |
| `size`             | `'sm' \| 'md' \| 'lg' \| '' \| 'small' \| 'default' \| 'large'` | `'md'`           | 使用 `sm/md/lg`；为兼容旧调用保留 `small/default/large` 与空字符串别名。 |
| `autocomplete`     | `string`                                                        | `'off'`          | 原样传给原生输入框；登录可按浏览器凭据策略传入对应值。                   |
| `name`             | `string`                                                        | `''`             | 原生表单字段名。                                                         |

组件固定以密码类型渲染；`showPassword` 控制是否提供可键盘访问的显隐按钮，不会改变受控值。显隐操作为语义按钮，可用 Enter 或 Space 切换，并通过 `aria-pressed` 暴露当前明文状态。

## Events

| 事件                | 参数                | 说明                                     |
| ------------------- | ------------------- | ---------------------------------------- |
| `update:modelValue` | `value: string`     | 输入或清空时通知宿主更新受控值。         |
| `change`            | `value: string`     | 输入框确认变更时转发 Element Plus 事件。 |
| `focus`             | `event: FocusEvent` | 输入框获得焦点。                         |
| `blur`              | `event: FocusEvent` | 输入框失去焦点。                         |
| `clear`             | 无                  | 用户触发清空操作。                       |

## 实例方法

通过 `ref` 可调用：

| 方法     | 行为                     |
| -------- | ------------------------ |
| `focus`  | 聚焦原生输入框。         |
| `blur`   | 移除原生输入框焦点。     |
| `select` | 选中当前输入框中的内容。 |

## 使用边界

- `id`、`aria-*` 等未声明属性会转发到底层输入组件；`type` 由组件显隐状态控制，不会作为透传属性转发。调用者仍应提供可访问名称和表单标签。
- 默认允许输入框上的复制、剪切和粘贴，便于使用密码管理器；宿主有明确交互策略时可设置 `preventClipboard` 阻止对应前端事件。事件拦截不是安全边界，不能替代宿主及服务端的凭据保护。自动填充由 `autocomplete` 和宿主登录流程控制。
- `minlength` 仅设置原生输入属性，不替代宿主的表单校验，也不代表后端密码策略。
- 示例中的状态是内存 Mock，不代表登录、改密或真实认证联调。
