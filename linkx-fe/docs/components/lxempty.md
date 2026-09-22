# LxEmpty 空态

表格 / 树 / 穿梭列表的无数据兜底展示。

<script setup lang="ts">
import { LxEmpty } from '../../src';
</script>

## 基础用法

<div class="demo-box" style="max-width:360px"><LxEmpty description="暂无警情数据" /></div>

```vue
<LxEmpty description="暂无警情数据" />
```

## 紧凑尺寸（弹窗 / 抽屉内）

<div class="demo-box" style="max-width:360px"><LxEmpty description="暂无记录" size="compact" /></div>

```vue
<LxEmpty description="暂无记录" size="compact" />
```

## API

### Props

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| description | 描述文案 | `string` | `暂无数据` |
| size | 尺寸 | `'default' \| 'compact'` | `default` |

### Slots

`default` — 完全自定义空态内容。
