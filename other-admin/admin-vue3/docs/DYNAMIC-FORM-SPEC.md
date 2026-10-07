# 动态表单规范

`LxDynamicForm` 按字段 schema 组合 lx-ui 表单和字段控件。表单只负责展示、校验和通用交互；业务 API、权限、提交逻辑及上传网络适配由宿主维护。

## 字段 Schema

```ts
import type { LxDynamicFormField as LxField } from 'lx-ui';

interface LxDynamicFormField<Model extends Record<string, unknown>> {
  key: string;
  label: string;
  type:
    | 'input'
    | 'password'
    | 'textarea'
    | 'number'
    | 'select'
    | 'remote-select'
    | 'tree-select'
    | 'date'
    | 'daterange'
    | 'switch'
    | 'radio'
    | 'checkbox'
    | 'upload'
    | 'slot';
  sectionTitleBefore?: string;
  required?: boolean;
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 12 | 24;
  visible?: boolean | ((model: Model) => boolean);
  disabled?: boolean | ((model: Model) => boolean);
  defaultValue?: unknown;
  props?: Record<string, unknown>;
  options?: Array<{ label: string; value: unknown; disabled?: boolean }>;
  feedback?: {
    status?: 'info' | 'success' | 'warning' | 'error' | 'loading';
    message: string;
    retry?: () => void;
    retryLabel?: string;
  };
  rules?: LxField<Model>['rules'];
  slot?: string;
}
```

字段 `type` 由独立 renderer 文件实现。renderer 组合公开的 `Lx*` 控件；Element Plus 可作为 lx-ui 内部行为内核，不在业务组合层直接使用 `El*` 字段控件。

`sectionTitleBefore` 在字段前显示通栏分组标题，不参与表单值、校验和提交。`feedback` 将状态贴近对应字段显示；`retry` 只调用宿主提供的恢复流程，loading 时不能重复触发。错误说明会关联到实际输入控件；自定义 `slot` 收到 `field`、`value`、`disabled`、可选的 `ariaDescribedBy` 和 `update(value)`。

## 布局和校验

- 默认 `adaptive=true`，按表单容器可用宽度在三列、两列和单列之间切换：容器宽度不大于 760px 时为两列，不大于 520px 时为单列。`span` 采用 24 栅格语义；未设置时默认为 `8`，`span: 24` 跨越整行。
- `adaptive=false` 时才使用 `columns` 固定列数；该属性接受 1、2、3 或 4，默认值为 1。
- `labelWidth`、`labelPosition`、全局 `disabled` 和 `rowGap` 由表单传给对应的 lx-ui 表单容器；默认标签在上方，行间距 12px，列间距由 `LxForm` 统一控制为 16px。
- `required` 生成默认必填规则；格式、长度、跨字段和异步校验使用 `rules` 明确声明。校验与重置通过公开的表单实例方法操作。
- `visible` 和 `disabled` 可以按当前 model 计算。隐藏字段不渲染；隐藏后是否清除业务值由宿主提交策略决定。

## 受控值和事件

- Vue 模板可使用 `modelValue` / `v-model`；React/TSX 风格的调用可传入 `value` 并监听 `change(nextValue)`。同时传入时 `value` 优先。
- 字段编辑时 `change` 和 `update:modelValue` 接收更新后的完整表单对象；`field-change` 接收字段 key、新字段值和字段定义。
- 表单校验发出 `validate(valid, fields?)`；成功提交发出 `submit(value)`；恢复初始值后发出 `reset()`。
- 默认值只在对应字段值为 `undefined` 时填入。表单不直接修改传入的 model；宿主应将事件值写回受控状态。

## 日期区间

`daterange` 接受两个同类型端点组成的数组：`[string, string]`、`[number, number]` 或 `[Date, Date]`。两个端点必须是实际有效的日期，开始时间不得晚于结束时间；无 `valueFormat` 的 ISO 日期字符串会校验真实日历日期，不能接受 `2026-02-31` 这类会被解析器自动归一化的值；传入 `props.valueFormat` 时按指定格式严格解析。无效值不会被回显为有效区间；使用默认日期清空行为时，字段值更新为 `null`，而不是 `undefined`。

## 上传字段

上传字段使用 `LxUpload`。`props.multiple === true` 时，字段值为 `LxUploadFile[]`；单文件模式为一个 `LxUploadFile` 或 `null`。已有 URL 字符串可用于显示成功文件，文件对象的 `uid`、`url`、`response`、`error` 等公开数据在受控回灌时保留。

文件选择、校验、进度、失败、重试、取消、移除和清空由组件展示并发出受控值更新。网络请求由宿主通过 `httpRequest` 或既有上传适配提供；Promise 适配器收到 `signal`，宿主应将它接入可取消请求。组件取消会忽略迟到的完成回调并将当前文件恢复到待上传状态，但不能保证未响应 `AbortSignal` 的远端服务停止处理。

## 远程字段和异步边界

`remote-select` 的查询、loading、空态、错误和重试由宿主注入并更新字段状态；请求使用 Promise 链 `.then().catch().finally()`。取消或对象切换后旧结果不得覆盖新状态。lx-ui 不直接依赖 Axios、Router、Pinia 或登录凭据。

自定义字段只能通过插槽上下文的 `update(value)` 通知父级，不得直接修改 schema 或父级 model。

## 字段类型演示

组件库文档中的类型预览覆盖全部 14 种内置 `type`，但按四类逐级展示：文本类字段、单值选择、日期与数值、多值/状态/扩展。类别选择后，类型选择器只展示当前类别且可按名称搜索；单次类型选择最多出现四个候选项。调整类型分组时要同步更新中文 Demo、文档说明及覆盖类别切换、筛选和全部类型渲染的浏览器测试。

## 验收要求

每次 schema、字段事件、公开实例方法或值形状变更时，必须同步类型、中文 API、Demo、可观察行为测试和迁移台账。覆盖成功、空、失败、取消、重复提交、键盘焦点、窄屏、明暗主题和减少动效；文档 Mock 通过不代表真实后端或上传协议联调完成。
