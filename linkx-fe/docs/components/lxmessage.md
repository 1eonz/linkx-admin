# LxMessage 全局提示

深色胶囊全局轻提示：12px 圆角反色底 + 毛玻璃。时长分级：`error` 3s（需阅读原因）/ 其余 1.6s，`duration` 可覆盖。操作结果反馈首选。

<script setup lang="ts">
import Basic from '../../src/components/LxMessage/demo/basic.vue';
</script>

## 基础用法

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

## API

| 方法 | 说明 |
|---|---|
| `lxMessage.success(message \| options)` | 成功（绿点） |
| `lxMessage.error(message \| options)` | 失败（红点） |
| `lxMessage.warning(message \| options)` | 警告（橙点） |
| `lxMessage.info(message \| options)` | 中性（灰点） |

**LxMessageOptions**：`message: string` / `duration?: number`。

**默认时长分级**：`error` **3000ms**（失败需阅读原因）/ 其余 **1600ms**；`duration` 可逐条覆盖。

## 使用铁律

- 轻反馈用 lxMessage；需要用户确认的用 lxConfirm；表单校验阻断用 LxFormErrorBanner。
- 文案写**结果**而非过程（「下发成功」而非「正在下发」），失败提示带原因。
- HUD 深色主题下胶囊自动抬亮（`--lx-bg-inverse` token 联动），无需额外处理。
