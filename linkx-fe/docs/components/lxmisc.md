# 杂项组件

LxTag / LxActionButtons / LxEmpty / LxGauge / LxNodeBadge 基础展示组件。

## LxTag 浅底标签（P1 例外场景：需携带文字信息时）

<script setup lang="ts">
import { LxTag, LxActionButtons, LxEmpty, LxGauge, LxNodeBadge, type LxActionItem } from '../../src';
const actions: LxActionItem[] = [
  { label: '编辑' }, { label: '授权' }, { label: '诊断' }, { label: '停用', type: 'danger' }, { label: '删除', type: 'danger' },
];
</script>

<div class="demo-box" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
  <LxTag type="success">在线</LxTag><LxTag type="warning">降级</LxTag><LxTag type="error">高危</LxTag><LxTag type="info" closable>检索条件</LxTag>
</div>

```vue
<LxTag type="success">在线</LxTag>
```

Props：`type`（success/warning/error/info）/ `closable` / `size` / `disabled`；Event：`close`

## LxActionButtons 行内操作（P2：纯文字，禁止图标按钮）

<div class="demo-box"><LxActionButtons :actions="actions" :max="3" /></div>

```vue
<LxActionButtons :actions="actions" :max="3" @click="onAction" />
```

Props：`actions`（LxActionItem[]：label/type/hidden/meta）/ `max`（直接显示数，超出折叠"更多"，默认 3）；Event：`click(action)`

## LxEmpty 空态

<div class="demo-box" style="max-width:360px"><LxEmpty description="暂无警情数据" /></div>

## LxGauge 圆环仪表 / LxNodeBadge 节点徽章（侧边栏底部拆件）

<div class="demo-box" style="display:flex;gap:24px;align-items:center">
  <LxGauge :value="99.9" label="SLA" />
  <LxGauge :value="72.4" label="P99" color="var(--lx-color-warning)" />
  <LxNodeBadge node="NODE-01" status="online" label="专网" />
  <LxNodeBadge node="NODE-02" status="busy" />
</div>

```vue
<LxGauge :value="99.9" label="SLA" />
<LxNodeBadge node="NODE-01" status="online" label="专网" />
```

LxGauge Props：`value`（0-100）/ `size`（默认 40）/ `stroke`（默认 3）/ `label` / `color`
LxNodeBadge Props：`node` / `status` / `label`
