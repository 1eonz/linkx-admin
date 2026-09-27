# 动态表单规范

动态表单负责根据 schema 生成展示控件和校验容器；业务 API、权限、提交和上传适配由宿主页面提供。

```ts
interface DynamicFormField {
  key: string;
  label: string;
  type: 'input' | 'password' | 'textarea' | 'number' | 'select' | 'remote-select'
    | 'tree-select' | 'date' | 'daterange' | 'switch' | 'radio' | 'checkbox'
    | 'upload' | 'slot';
  required?: boolean;
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 12 | 24;
  visible?: boolean | ((model: Record<string, unknown>) => boolean);
  disabled?: boolean | ((model: Record<string, unknown>) => boolean);
  defaultValue?: unknown;
  props?: Record<string, unknown>;
  options?: Array<{ label: string; value: unknown; disabled?: boolean }>;
  rules?: FormItemRule[];
  slot?: string;
}
```

## 布局和校验

- 使用 24 栅格：`span: 24` 为一行一个字段，`span: 12` 为一行两个字段，`span: 8` 为一行三个字段。
- 未填写 `span` 时由表单默认值决定，页面必须明确默认密度；不使用 CSS 猜测字段宽度。
- `required` 只生成默认必填规则；长度、格式、跨字段和异步校验通过 `rules` 明确声明。
- `visible` 和 `disabled` 可以是纯函数，但不能在 schema 内修改业务状态；字段隐藏时是否清理值由宿主通过策略决定。

## 事件和异步边界

推荐 `LxDynamicForm` 暴露：`update:modelValue`、`field-change`、`validate`、`submit`、`reset`，以及 `validate()`、`resetFields()` 方法。

`remote-select` 必须由宿主注入查询函数，提供 loading、空结果、失败重试、取消和旧请求丢弃；组件库不得直接引入 Axios。上传同理使用 adapter，展示进度、失败重试和移除，不持有业务凭据。

`slot` 仅负责把字段上下文交给宿主插槽。自定义组件必须通过 `modelValue` 和 `update:modelValue` 或显式适配器接入，不能直接修改 schema 或父级 model。

## 实施顺序

1. 先补字段类型、默认值、规则合并和 24 栅格容器。
2. 再实现 input/select/date/number/tree-select 等无请求控件。
3. 再接入 remote-select、upload、slot 和联动字段。
4. 为每种状态补 Demo 与可观察行为测试，最后由业务页面通过 adapter 接入。
