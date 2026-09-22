# LxConfirm 确认框

危险操作二次确认：512px 居中，**危险 / 标准**双形态。返回 `Promise<boolean>`，无需 try/catch。

<script setup lang="ts">
import Basic from '../../src/components/LxConfirm/demo/basic.vue';
</script>

## 基础用法

<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxConfirm/demo/basic.vue
:::

```ts
import { lxConfirm } from 'lx-ui';

// 危险确认：红色 warning 图标 + 深红标题 + 红底主按钮
const ok = await lxConfirm({
  title: '确认解除 3 号网格警戒线？',
  message: '将同步通知 18 名执勤警力撤出封控区，该操作不可逆。',
  confirmText: '强制解除警戒',
  danger: true,
});
if (ok) { /* 已确认 */ }
```

## API

### lxConfirm(options) → Promise\<boolean\>

确认 resolve `true`；取消 / 关闭 / ESC resolve `false`（不 reject，无需 try/catch）。

### LxConfirmOptions

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 标题 | `string` | 危险态「确认执行该操作？」/ 标准「确认」 |
| message | 正文（**必须写明不可逆后果**） | `string` | `''` |
| confirmText | 确认按钮文案 | `string` | `确认` |
| cancelText | 取消按钮文案 | `string` | `取消` |
| danger | 危险模式（红标题 + 红底主按钮） | `boolean` | `false` |

## 使用铁律

- **删除 / 解绑 / 停用**等不可逆操作一律 `danger: true`，且确认按钮写**具体动作**（「强制解除警戒」），禁止「确定/OK」模糊文案。
- `message` 必须写明后果与影响范围（影响几人 / 是否可逆）。
- 确认框不可点遮罩关闭（内置），防止误触。
