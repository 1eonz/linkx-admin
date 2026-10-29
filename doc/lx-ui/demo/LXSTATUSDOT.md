# LxStatusDot 状态点

业务状态指示圆点。**全库状态表达的第一公民**（设计原则 P1：状态收敛为圆点）。

```vue
<script setup lang="ts">
import { LxStatusDot } from 'lx-ui'
</script>

<template>
  <LxStatusDot status="online" />
</template>
```

## 何时使用 / 何时不用

**使用：**

- 表格行内的状态列（设备连接、人员在岗、节点健康）；
- 卡片/侧边栏/时间线上的状态标记；
- 需要零噪声、高密度展示状态的一切场景。

**不用：**

- 状态需要携带说明文字且无其他列可推断 → 用 `LxTag` 或 `LxStatusDot` + `showText`；
- 表达**操作反馈**（保存成功等瞬时消息）→ 用 `LxToast`；
- 表达**可切换的状态**（启用/停用）→ 用 `LxStatusSwitch`。

## 代码演示

### 基础用法

五种状态色。`online` 默认带呼吸动画。

可执行示例位于 `linkx-fe/src/components/LxStatusDot/demo/basic.vue`，文档站入口为 `linkx-fe/docs/components/lxstatusdot.md`；此设计源文档不执行动态导入。

```vue
<!-- lx-ui/src/components/LxStatusDot/demo/basic.vue -->
<script setup lang="ts">
// 演示：五种基础状态，online 默认呼吸动画
import { LxStatusDot, type LxStatus } from 'lx-ui'

const states: { status: LxStatus; label: string }[] = [
  { status: 'online', label: '在线/正常' },
  { status: 'processing', label: '处理中/流转中' },
  { status: 'busy', label: '忙碌/临时离岗' },
  { status: 'error', label: '错误/断开' },
  { status: 'offline', label: '离线/停用' },
]
</script>

<template>
  <div style="display: flex; gap: 24px; align-items: center">
    <span
      v-for="s in states"
      :key="s.status"
      style="display: inline-flex; align-items: center; gap: 8px"
    >
      <LxStatusDot :status="s.status" />
      <span>{{ s.label }}</span>
    </span>
  </div>
</template>
```

### 显示状态文本

`statusDesc + showText`，用于表格状态列一步到位（替代 tag）。

表格示例源码位于 `linkx-fe/src/components/LxStatusDot/demo/with-text.vue`，在上述文档站页面中执行。

```vue
<!-- lx-ui/src/components/LxStatusDot/demo/with-text.vue -->
<script setup lang="ts">
// 演示：表格状态列典型用法（showText + 等宽警号）
import { LxStatusDot, LxCodeSlot } from 'lx-ui'

const rows = [
  { name: '滨江网关-01', status: 'online', desc: '链路正常', latency: '12ms' },
  { name: '滨江网关-02', status: 'busy', desc: '队列积压', latency: '340ms' },
  { name: '城域节点-03', status: 'error', desc: '心跳丢失', latency: '—' },
]
</script>

<template>
  <table class="demo-table">
    <tr v-for="r in rows" :key="r.name">
      <td>{{ r.name }}</td>
      <td>
        <LxStatusDot :status="r.status" show-text :status-desc="r.desc" />
      </td>
      <td>
        <LxCodeSlot>{{ r.latency }}</LxCodeSlot>
      </td>
    </tr>
  </table>
</template>
```

### 尺寸与关闭动画

`size` 控制直径（默认 8，侧边栏徽章用 6）；`pulse=false` 关闭呼吸（同屏大量状态点时建议关闭，避免噪声）。

<DemoContainer title="尺寸与动画" description="size=6/8/10 对比 + 关闭呼吸。" />

```vue
<!-- 可直接复制到 lx-ui Demo 的尺寸与动画示例 -->
<script setup lang="ts">
// 演示：尺寸三档；同屏 >20 个 online 点时建议 pulse=false（动效稀缺性原则）
import { LxStatusDot } from 'lx-ui'
</script>

<template>
  <div style="display: flex; gap: 24px; align-items: center">
    <LxStatusDot status="online" :size="6" />
    <LxStatusDot status="online" :size="8" />
    <LxStatusDot status="online" :size="10" />
    <LxStatusDot status="online" :pulse="false" />
    <span style="color: var(--lx-text-secondary)">← 已关闭呼吸</span>
  </div>
</template>
```

### 兼容旧 API（code 数字映射）

迁移期兼容 admin-vue3 原 `ConnectionStatusDot` 的数字状态（0-7）。新代码**禁止**使用，请业务侧显式映射（DESIGN-SPEC §2.2）。

<DemoContainer title="code 兼容（@deprecated）" description="数字状态自动映射，仅迁移期使用。" />

```vue
<!-- 可直接复制到 lx-ui Demo 的兼容示例 -->
<script setup lang="ts">
// ⚠️ @deprecated：code 兼容层。新代码请用 status + 业务侧映射表
import { LxStatusDot } from 'lx-ui'

const codes = [0, 1, 3, 4, 5]
</script>

<template>
  <span v-for="c in codes" :key="c" style="margin-right: 16px">
    <LxStatusDot :code="c" show-text :status-desc="`code=${c}`" />
  </span>
</template>
```

### 反模式警示

<DemoContainer title="反模式" description="错误：用色块 tag 表状态；正确：用圆点。" />

```vue
<!-- 错误：大面积色块噪声（同屏 20 行时会干扰扫读） -->
<el-tag type="success">在线</el-tag>
<el-tag type="danger">断开</el-tag>

<!-- ✅ 正确：圆点 + 可选文本 -->
<LxStatusDot status="online" show-text status-desc="在线" />
```

## API

### Props

| 名称        | 类型       | 默认值      | 说明                                                                                  |
| ----------- | ---------- | ----------- | ------------------------------------------------------------------------------------- |
| status?     | `LxStatus` | `'offline'` | `'online' \| 'processing' \| 'busy' \| 'error' \| 'offline'`，语义见 DESIGN-SPEC §2.1 |
| code?       | `number`   | —           | **@deprecated** 数字状态（0-7）兼容层，传入时优先于 status。迁移期后移除              |
| size?       | `number`   | `8`         | 圆点直径（px）。侧边栏徽章 6，常规 8，强调 10                                         |
| pulse?      | `boolean`  | `true`      | online 呼吸动画（hudPulse）。同屏超过20个状态点应传 false                                   |
| statusDesc? | `string`   | `''`        | 状态文本（showText=true 时显示）                                                      |
| showText?   | `boolean`  | `false`     | 是否显示状态文本                                                                      |

### Events

无（纯展示组件）。

### Slots

无。

## 类型定义

```ts
// linkx-fe/src/tokens/types.ts（全库共享）
export type LxStatus =
  | 'online' // 正常/在线/在岗（绿 #67c23a）
  | 'processing' // 进行中/流转中（蓝 #409eff）
  | 'busy' // 忙碌/临时离岗/待处理（黄 #e6a23c）
  | 'error' // 错误/断开/紧急（红 #f56c6c）
  | 'offline' // 离线/停用/归档（灰 #909399）

// 操作反馈与业务状态分开，不传入 LxStatusDot。
export type LxFeedback = 'success' | 'warning' | 'error' | 'info'
```

## 设计说明

- 执行设计原则 **P1（状态收敛为圆点）**、**P8（token 强制）**：颜色全部来自 `--lx-color-*`，HUD 深色主题下自动适配。
- 呼吸动画 hudPulse（3.5s）定义见 DESIGN-SPEC §5；`prefers-reduced-motion` 自动禁用。
- 颜色语义映射表是全库契约，禁止组件使用方自行换色。

## FAQ

**1. error 状态要不要加 tacticalBlink 闪烁？**
v1 不加。闪烁是稀缺资源（DESIGN-SPEC §5），只用于"高危未处理且需行动"的告警流（时间线告警节点）。状态列静态红点已足够。如有此诉求提 issue 评估。

**2. 色弱用户如何区分状态？**
开启 `showText`；纯色点场景建议搭配文字列。色觉无障碍的形状编码（圆/三角/方）列为 v2 议题。

**3. 为什么没有 loading 状态？**
`processing` 蓝点即数据流转语义；组件自身加载态（骨架屏）由容器组件（LxProTable.loading）负责，职责分离。

## 2026-10-29 当前实现边界

- 中文名称与可见说明共用statusDesc优先规则；未提供时使用五态中文名称。非有限或不大于0的size回退8，其余正数保留。
- 直接库code0为offline，旧业务适配器code0为busy；未知数值仅采用离线视觉兜底，不是后端状态判断。
- 动效采用既有lx-hud-pulse（3.5s，缩放1–1.05、透明度0.35–0.85），reduce禁用；不再使用2.2倍外扩层。
- 运行Demo展示长文本、主题、密集静态列表和宿主注入Mock恢复；组件仍无事件、插槽和实例方法。当前波次验证与正式A/B尚待完成，不以旧4/4证据宣称本次通过。
