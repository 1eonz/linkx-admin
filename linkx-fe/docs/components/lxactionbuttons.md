# LxActionButtons 行内操作

表格行内操作按钮组：纯文字链接风（P2 铁律，禁止图标按钮），超出 `max` 数量自动折叠进「更多」下拉。

<script setup lang="ts">
import { LxActionButtons, type LxActionItem } from '../../src';
const actions: LxActionItem[] = [
  { label: '编辑' }, { label: '授权' }, { label: '诊断' }, { label: '停用', type: 'danger' }, { label: '删除', type: 'danger' },
];
</script>

## 基础用法（max=3，超出折叠）

<div class="demo-box"><LxActionButtons :actions="actions" :max="3" /></div>

```vue
<LxActionButtons :actions="actions" :max="3" @click="onAction" />
```

## API

### Props

| 名称 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| actions | 操作列表 | `LxActionItem[]` | `[]` |
| max | 直接显示的数量，超出折叠进「更多」 | `number` | `3` |
| more-text | 折叠菜单触发文字 | `string` | `更多` |

### LxActionItem

| 字段 | 说明 | 类型 |
|---|---|---|
| label | 显示文字（纯文字，P2 铁律） | `string` |
| type | 语义：default 链接蓝 / danger 删除红 | `'default' \| 'danger'` |
| hidden | 条件隐藏（业务侧权限过滤后传入） | `boolean` |
| meta | 业务透传 | `Record<string, unknown>` |

### Events

| 名称 | 说明 | 回调 |
|---|---|---|
| click | 任一操作被点击（含折叠菜单内） | `(action: LxActionItem)` |

## 使用铁律

- 行内操作**一律纯文字**，禁止图标按钮（设计稿 P2）。
- 危险操作（删除/停用）标 `type: 'danger'`，点击后必须接 lxConfirm 二次确认。
- 权限过滤在业务侧完成（`hidden: true` 或直接不传入）。
