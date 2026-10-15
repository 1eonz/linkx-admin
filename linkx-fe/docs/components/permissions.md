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

未配置权限源时，`hasPermission` 返回 `false`；依赖权限码的操作按无权处理并隐藏。宿主应在渲染依赖权限码的组件前调用 `setupLxPermission`。

## 行内操作

`LxActionButtons` 的操作项支持 `auth`。省略 `auth` 表示公开操作并保持显示；显式传入空字符串、空白值、空数组或不具备的权限码时，组件按无权处理并隐藏该项。未配置权限源时，所有依赖权限码的操作也会隐藏。若宿主希望权限数据变化后自动更新外显项与「更多」列表，`setupLxPermission` 的 getter 必须读取 Vue 响应式数据（例如 `ref` 或 `computed`）；普通变量或非响应式集合变化不会触发组件重新计算。

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
