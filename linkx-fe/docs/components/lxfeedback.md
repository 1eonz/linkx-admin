# 反馈与浮层

设计稿「弹窗与交互反馈标本」全 5 标本封装：**LxMessage 全局提示 / LxConfirm 确认框 / LxDialog 表单弹窗 / LxDrawer 详情抽屉 / LxFormErrorBanner 校验横幅**。均基于 Element Plus 二次封装，纯受控零请求依赖（P7）。

<script setup lang="ts">
import Basic from '../../src/components/LxMessage/demo/basic.vue';
import Basic2 from '../../src/components/LxConfirm/demo/basic.vue';
import Basic3 from '../../src/components/LxDialog/demo/basic.vue';
import Basic4 from '../../src/components/LxDrawer/demo/basic.vue';
import Basic5 from '../../src/components/LxFormErrorBanner/demo/basic.vue';
</script>

## LxMessage 全局提示（深色胶囊 · 1.6s 自动消失）

<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxMessage/demo/basic.vue
:::

```ts
import { lxMessage } from 'lx-ui';

lxMessage.success('GIS 网格切片更新指令已广播至 14 巡逻终端');
lxMessage.error('指令广播失败：3 号网格信道占用');
lxMessage.warning({ message: '操作将记录审计日志', duration: 3000 }); // 自定义时长
```

API：`lxMessage.success / error / warning / info`，入参 `string | { message, duration? }`，默认 1600ms 自动消失（设计稿标注 1.6s）。

## LxConfirm 确认框（危险 / 标准双形态）

<div class="demo-box"><Basic2 /></div>

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

API：`lxConfirm(options) → Promise<boolean>`（确认 true / 取消或关闭 false，无需 try/catch）。Options：`title` / `message`（必须写明不可逆后果）/ `confirmText`（危险操作建议写具体动作）/ `cancelText` / `danger`。512px 居中，不可点遮罩误触。

## LxDialog 表单弹窗（三段式 · 双列网格）

<div class="demo-box"><Basic3 /></div>

::: details 查看代码
<<< ../../src/components/LxDialog/demo/basic.vue
:::

Props：

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| v-model | 显隐 | `boolean` | `false` |
| title | 标题（14px 加粗） | `string` | — |
| icon | 标题图标 | `LxIconName` | — |
| width | 宽度 | `number\|string` | `672`（设计稿 max-w-2xl） |
| danger | 危险模式（红图标/红标题/红底确认） | `boolean` | `false` |
| confirm-text / cancel-text | 按钮文案 | `string` | `确认` / `取消` |
| loading | 确认按钮加载态 | `boolean` | `false` |
| close-on-click-modal | 点遮罩关闭 | `boolean` | `false`（防误触） |
| hide-footer | 隐藏默认按钮栏 | `boolean` | `false` |

Events：`confirm`（业务在此校验/提交，成功后自行关闭）/ `cancel`。Slots：`default`（表单区，建议双列 grid）/ `footer`（hide-footer 时自定义）。

## LxDrawer 详情抽屉（480px · 右侧滑出）

<div class="demo-box"><Basic4 /></div>

::: details 查看代码
<<< ../../src/components/LxDrawer/demo/basic.vue
:::

Props：`v-model` / `title`（12px 加粗）/ `icon`（圆形图标块）/ `size`（默认 480px）/ `close-on-click-modal`（默认 false）。

Slots：`default`（标签-值两端对齐描述行由业务排布）/ `footer`（左侧提示文字 + 右侧按钮组）。

## LxFormErrorBanner 校验阻断横幅（内联，非浮层）

<div class="demo-box"><Basic5 /></div>

```vue
<LxFormErrorBanner
  title="校验阻断：当前区域处于战备封控期"
  description="封控期间禁止新增派单，请联系指挥中心调整封控范围后重试。"
/>
```

Props：`title`（12px 粗体深红）/ `description`（11px 补充说明）。Slot：`default`（扩展内容，如违规字段清单）。

## 使用铁律

- **弹窗选型**：表单用 LxDialog，详情用 LxDrawer（设计稿明确「详情不走弹窗」），纯确认用 lxConfirm，轻反馈用 lxMessage。
- **危险操作**：必须 `danger` + 写明不可逆后果 + 红底具体动作按钮（禁止「确定/OK」这类模糊文案）。
- **防误触**：弹窗/抽屉默认不可点遮罩关闭；确认框禁点遮罩。
