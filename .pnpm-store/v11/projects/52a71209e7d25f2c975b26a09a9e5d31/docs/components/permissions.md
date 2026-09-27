# 权限消费

`lx-ui` 只消费宿主注入的权限源，不请求接口，也不保存登录状态。宿主在登录和账号切换后提供当前权限：

```ts
import { setupLxPermission } from 'lx-ui'

setupLxPermission(() => ({
  codes: { 'page-role': ['add', 'edit'] },
  maskedFields: { 'page-role': ['phone'] },
  current: () => 'page-role',
}))
```

`hasPermission(code)` 和 `hasPermission(['edit', 'delete'])` 可用于脚本逻辑；后者命中任意一个码即返回 `true`。`isFieldMasked(field)` 用于检查字段是否需要脱敏。`setupLxPermission` 返回清理函数，测试或账号切换时可恢复上一份来源。

## 行内操作

`LxActionButtons` 的操作项支持 `auth`。未传 `auth` 保持原有显示行为；传入后组件会在渲染前过滤无权限操作。

```vue
<LxActionButtons
  :actions="[
    { label: '编辑', auth: 'edit' },
    { label: '删除', type: 'danger', auth: 'delete' },
  ]"
  @click="handleAction"
/>
```

## 表格和详情字段

`LxProTable` 列和 `LxDescriptions` 条目支持 `mask: true`，无权时显示 `***`；传字符串可以指定占位符。具名 cell/item 插槽仍由宿主完全接管，适合复杂格式化字段。

```ts
const columns = [
  { prop: 'phone', label: '联系电话', mask: true },
  { prop: 'idCard', label: '身份证号', mask: '-' },
]
```

字段码和权限码必须来自后端配置树的 `dataScope.maskedFields` 与 `permissions`，组件库不会自行生成或推断敏感字段规则。
