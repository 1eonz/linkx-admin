# 新增组件总览

本页集中展示本轮按 `COMPONENT-SPEC.md`、`COMPONENT-STYLE-INTERACTION.md` 和 `ICON-DESIGN.md` 落地的组件。所有数据请求均由业务侧通过 prop 或事件注入，组件库不包含接口、路由或状态仓库依赖。

<script setup lang="ts">
import NewComponentsDemo from './NewComponentsDemo.vue';
</script>

<NewComponentsDemo />

## 布局与导航

| 组件            | 关键能力                                                                        | 受控事件 / 插槽                                                                                            |
| --------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `LxNavbar`      | 顶栏搜索、网络状态、通知、全屏和用户菜单；`showFullscreen=false` 可隐藏全屏入口 | `search`、`notification-click`、`fullscreen-toggle`、`user-command`；`leading` / `breadcrumb` / `trailing` |
| `LxTabsBar`     | 可关闭页签与右键菜单                                                            | `v-model`、`close`、`context-menu`、`extra`                                                                |
| `LxBreadcrumb`  | 两级以上路径与当前页语义                                                        | `select(item, MouseEvent)`，宿主可调用 `preventDefault()` 接管站内导航                                     |
| `LxSplitLayout` | 左树右表、拖动或方向键调整侧栏                                                  | `update:collapsed`、`resize`、`aside`                                                                      |
| `LxPageCard`    | 页面内容容器、标题区、加载遮罩                                                  | `header-extra` / `footer`                                                                                  |

```vue
<LxSplitLayout
  :aside-width="asideWidth"
  :collapsed="collapsed"
  resizable
  @resize="asideWidth = $event"
  @update:collapsed="collapsed = $event"
>
  <template #aside><LxVirtualTree :data="orgTree" /></template>
  <LxPageCard title="资源名册"><LxProTable :data="rows" /></LxPageCard>
</LxSplitLayout>
```

## 数据展示

| 组件             | 关键 props                                               | 说明                                                                                                                                 |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `LxSectionTitle` | `title`、`subtitle`、`variant`、`size`、`tag`、`tagType` | 三种变体和三档字号；标题旁支持语义标签，`leading` 可覆盖图标，`extra` 为操作区；[独立 API 与响应式 Demo](/components/lxsectiontitle) |
| `LxMetricCard`   | `title` / `label`、`value`、`status`、`progress`         | 数值使用等宽字体与 `tabular-nums`；支持语义色、兼容属性、角标和底部说明；[独立 API 与状态示例](/components/lxmetriccard)             |
| `LxDescriptions` | `items`、`columns`、`bordered`                           | 标签-值描述行，支持 `item-${key}` 具名插槽                                                                                           |
| `LxCodeSlot`     | `copyable`、`ellipsis`                                   | 点击复制，触发 `copy`                                                                                                                |
| `LxDutyCalendar` | `month`、`shifts`、`weekStart`                           | 固定 42 格、键盘日期导航和自定义 cell 插槽；[独立 API 与状态示例](/components/lxdutycalendar)                                      |

`LxDescriptions` 的数值 `labelWidth` 会自动转换为 CSS 尺寸；例如 `labelWidth: 88` 等价于 `88px`。

`LxDescriptions` 条目支持 `mask: true` 或自定义字符串占位符，字段权限由宿主通过 `setupLxPermission` 注入。

完整 Props、描述项字段、插槽及响应式规则见 [LxDescriptions 独立文档](./lxdescriptions.md)。

## 数据录入与选择

### 动态表单

`LxDynamicForm` 使用 24 栅格 schema 渲染 input、select、日期、树选择、开关、单选、复选和插槽字段。`span: 24` 通栏，其余跨度按当前列数折算；`required` 只生成默认必填规则，远程选择和上传由宿主通过字段属性或插槽注入。完整契约与交互示例见 [LxDynamicForm 独立文档](/components/lxdynamicform)。

```vue
<LxDynamicForm v-model="form" :fields="fields" :columns="2" @submit="save" />
```

组件提供 `validate`、`resetFields` 等实例方法，并发出 `field-change`、`validate`、`submit` 和 `reset` 事件。独立 Demo 覆盖候选人员 Mock 的加载、空态、失败重试、禁用、主题和列数切换；Vue3 业务宿主仍需独立验收。

| 组件                 | 关键 props                                                    | 事件 / 行为                                                                                                            |
| -------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `LxCascader`         | `options`、`props`、`multiple`、`loading`、`error`             | `v-model`、`change`、`retry`；支持单选/多选、失败重试和禁用状态；[独立 API 与交互 Demo](/components/lxcascader)         |
| `LxSearchBar`        | `fields`、`collapsed`、`loading`                              | `v-model`、`search`、`reset`、`update:collapsed`；`controls` 覆盖内置按钮，`actions` 仍可追加按钮；字段超过 8 个可收起 |
| `LxStatusSwitch`     | `modelValue`、`confirm`、`loading`                            | 兼容 `0 = 开启`、`1 = 关闭` 的旧业务值                                                                                 |
| `LxUpload`           | `accept`、`maxSize`、`limit`、`drag`、`listType`、`chunkSize` | `v-model`、`change`、`success`、`error`、`remove`、`exceed`；提供宿主请求适配器、进度、取消和失败重试                  |
| `LxSelectPagination` | `remoteMethod`、`targetMap`、`maxCollapseTags`                | 远程搜索防抖、滚动续载、跨页标签回显；[独立 API 与状态示例](/components/lxselectpagination)                            |
| `LxPasswordInput`    | 所有 `ElInput` 密码属性                                       | 阻止复制、剪切和粘贴                                                                                                   |
| `LxVirtualTree`      | `data`、`height`、`showCheckbox`                              | 窗口化渲染、筛选、受控选中；上下左右键导航；[独立 API 与状态示例](/components/lxvirtualtree)                           |
| `LxTransferPanel`    | `treeData`、`maxCount`                                        | `v-model` 维护权限键；左右栏实时同步；[独立 API 与状态示例](/components/lxtransferpanel)                               |

`LxProTable` 列支持 `mask: true | string`，`LxActionButtons` 操作支持 `auth` 权限码。完整的权限源接入和脱敏示例见[权限消费](/components/permissions)。

远程选择器中的请求回调必须由业务侧提供。推荐按设计稿使用 `remoteMethod`：

```ts
let activeRequests = 0
const requestPending = ref(false)
const remoteMethod: LxSelectPaginationRemoteMethod = (
  keyword,
  page,
  options,
) => {
  const { pageSize, params, signal } = options
  activeRequests += 1
  requestPending.value = true
  return requestUsers({ ...params, keyword, pageNum: page, pageSize, signal })
    .then((result) => ({ records: result.records, total: result.total }))
    .catch((error) => {
      throw error
    })
    .finally(() => {
      activeRequests -= 1
      requestPending.value = activeRequests > 0
    })
}
```

若初始选项不在首屏数据中，请通过 `targetMap` 注入原始对象：

```vue
<LxSelectPagination
  v-model="userIds"
  :remote-method="remoteMethod"
  :target-map="{ 'user-42': { id: 'user-42', name: '王警官' } }"
  value-key="id"
  label-key="name"
  multiple
/>
```

原有 `api({ page, pageSize, keyword, ...params })` 和 `valueMap` 属性仍可使用；旧接口请求保持 `.then().catch().finally()` 链式处理。

## 辅助设施

`LxAuthImg` 的 `request(src, signal)` 接收业务侧注入的图片请求函数。组件会在 `src` 变化或卸载时终止前一次请求并回收 Blob URL；未传 `request` 时按普通公开图片处理。详见 [LxAuthImg 独立 API 与状态示例](/components/lxauthimg)。

`LxProTable` 可通过默认插槽传入原生 `ElTableColumn`，`empty` 插槽覆盖空态；`tableAttrs` 透传表格属性及原生事件监听器。实例公开 `getTableRef()`、`clearSelection()`、`toggleRowSelection(row, selected?)` 和 `getSelectionRows()`。`LxPagination` 的 `layout` 可覆盖默认布局，`background` 默认关闭；在局部滚动容器内使用时传 `:auto-scroll="false"`。

```vue
<LxAuthImg
  src="/api/files/avatar/42"
  alt="王警官头像"
  :request="(src, signal) => requestBlob(src, { signal })"
  :width="72"
  :height="72"
/>
```

## 设计与可访问性

- 组件遵循紧凑密度：常规控件 32px、圆角 4px、间距采用 4/8/12/16/24px 令牌。
- `LxSectionTitle` 的三种变体、三档字号、四种标签语义和 `leading`/`extra` 插槽均在独立 Demo 中展示；默认变体为 `border`，宿主旧适配器可显式传入 `dashed` 保持原默认样式。
- 状态由文字和圆点共同表达；所有自绘按钮都有键盘和 `:focus-visible` 状态。
- 虚拟树、日历和分栏均提供键盘替代路径；全局 `prefers-reduced-motion` 会关闭非必要动效。
- 异步能力仅通过 `api`、`request` 或 Element Plus 上传配置注入，保持 P7 数据无关边界。
