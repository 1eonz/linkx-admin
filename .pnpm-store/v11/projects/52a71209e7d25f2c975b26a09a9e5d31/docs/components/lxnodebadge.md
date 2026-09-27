# LxNodeBadge 节点徽章

节点标识徽章（节点号 + 状态点 + 可选备注），侧边栏底部状态区拆件，用于多节点管理场景标识当前接入节点。

<script setup lang="ts">
import { LxNodeBadge } from '../../src';
</script>

## 基础用法

<div class="demo-box" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
  <LxNodeBadge node="NODE-01" status="online" label="专网" />
  <LxNodeBadge node="NODE-02" status="busy" />
  <LxNodeBadge node="NODE-03" status="offline" />
</div>

```vue
<LxNodeBadge node="NODE-01" status="online" label="专网" />
```

## API

### Props

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| node | 节点编号 | `string` | — |
| status | 节点状态 | `'online' \| 'busy' \| 'offline'` | `online` |
| label | 备注文案（如「专网」） | `string` | — |

## 使用说明

- 状态点语义与 LxStatusDot 一致：online 绿、busy 黄、offline 灰。
- 侧边栏底部经 LxSidebar 的 `node-label` / `node-status` props 使用；独立使用于节点切换、多节点监控场景。
