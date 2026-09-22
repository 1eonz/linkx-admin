# LxStatusDot 状态点

业务状态表达第一公民（设计原则 P1：状态收敛为 6-8px 实心圆点，而非色块/标签）。语义映射为全库契约（DESIGN-SPEC §2.1），禁止使用方自行换色。

## 基础用法

<script setup>
import Basic from '../../src/components/LxStatusDot/demo/basic.vue';
import WithText from '../../src/components/LxStatusDot/demo/with-text.vue';
</script>
<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxStatusDot/demo/basic.vue
:::

## 表格状态列（show-text）

<div class="demo-box"><WithText /></div>

::: details 查看代码
<<< ../../src/components/LxStatusDot/demo/with-text.vue
:::

## 语义

| 状态 | 颜色 | 适用 |
|---|---|---|
| online | 绿 `#67c23a` | 在线/正常/在岗/已连接 |
| processing | 亮蓝 `#409eff` | 进行中/流转中 |
| busy | 黄 `#e6a23c` | 忙碌/临时离岗/降级/待处理 |
| error | 红 `#f56c6c` | 错误/断开/紧急/高危 |
| offline | 灰 `#909399` | 离线/停用/归档/只读 |

## API

`status`（LxStatus，默认 offline）/ `size`（px，默认 8；侧边栏徽章 6）/ `pulse`（online 呼吸动画，同屏 >20 个建议关闭，默认 true）/ `status-desc` + `show-text`（状态文本）/ `code`（@deprecated 0-7 数字兼容层，迁移期移除）
