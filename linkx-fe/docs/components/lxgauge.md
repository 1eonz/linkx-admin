# LxGauge 圆环仪表

圆环进度仪表（SVG），侧边栏底部状态区拆件，也可独立用于指标展示。

<script setup lang="ts">
import { LxGauge } from '../../src';
</script>

## 基础用法

<div class="demo-box" style="display:flex;gap:24px;align-items:center">
  <LxGauge :value="99.9" label="SLA" />
  <LxGauge :value="72.4" label="P99" color="var(--lx-color-warning)" />
</div>

```vue
<LxGauge :value="99.9" label="SLA" />
<LxGauge :value="72.4" label="P99" color="var(--lx-color-warning)" />
```

## API

### Props

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value | 数值（0-100） | `number` | `0` |
| size | 尺寸（px） | `number` | `40` |
| stroke | 描边宽度 | `number` | `3` |
| label | 中心标签 | `string` | — |
| color | 进度色（任意 CSS 颜色，可传 var(--lx-*)） | `string` | 主色 |

## 使用说明

- 侧边栏底部状态区直接经 LxSidebar 的 `show-footer` 使用，独立使用本组件用于指标卡场景。
- 色值建议传设计令牌（如 `var(--lx-color-warning)`），保证 HUD 主题切换联动。
