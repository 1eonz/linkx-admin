# LxDynamicForm 动态表单

通过字段 schema 组合 Element Plus 表单控件，使用 `v-model` 向宿主报告字段变化。远程候选项和文件上传由宿主提供；组件不访问业务接口。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxDynamicForm/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxDynamicForm/demo/basic.vue
:::

示例可切换单列、双列和三列，显示任务类型联动字段、受控禁用、自定义上传插槽、表单校验、重置及 HUD 深色令牌。候选人员使用宿主侧内存 Mock，涵盖成功、空结果、加载、失败和重试；没有真实文件上传请求。

## Props

| 名称            | 类型                         | 默认值  | 说明                                               |
| --------------- | ---------------------------- | ------- | -------------------------------------------------- |
| `modelValue`    | `Record<string, unknown>`    | 必填    | 受控表单数据，配合 `v-model`。                     |
| `fields`        | `LxDynamicFormField[]`       | 必填    | 字段 schema，按数组顺序渲染。                      |
| `columns`       | `1 \| 2 \| 3 \| 4`           | `1`     | 桌面网格列数；640px 以下强制单列。                 |
| `labelWidth`    | `string \| number`           | `''`    | 传给 Element Plus 表单。                           |
| `labelPosition` | `'top' \| 'left' \| 'right'` | `'top'` | 标签位置。                                         |
| `disabled`      | `boolean`                    | `false` | 禁用内置字段，且传给自定义插槽的 `disabled` 参数。 |
| `rowGap`        | `number`                     | `16`    | 行间距，单位 px。                                  |

## 字段 schema

| 字段                   | 类型                                         | 说明                                                                                     |
| ---------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `key`、`label`、`type` | `string`、`string`、`LxDynamicFormFieldType` | 字段键、可见标签和控件类型。                                                             |
| `required`             | `boolean`                                    | 生成默认必填校验规则；自定义规则可通过 `rules` 追加。                                    |
| `span`                 | `1 \| 2 \| 3 \| 4 \| 6 \| 8 \| 12 \| 24`     | 24 栅格单位。实际占用列数按当前 `columns` 向上取整，`24` 通栏。                          |
| `visible`              | `boolean \| (model) => boolean`              | 依据当前表单 model 控制显示。                                                            |
| `disabled`             | `boolean \| (model) => boolean`              | 依据当前表单 model 控制字段禁用。                                                        |
| `defaultValue`         | `unknown`                                    | `modelValue[key] === undefined` 时作为初始显示值和校验值；不会在挂载时主动修改父级对象。 |
| `props`                | `Record<string, unknown>`                    | 传给内置 Element Plus 控件的属性。                                                       |
| `options`              | `LxDynamicFormOption[]`                      | 选择、单选和复选项，包含 `label`、`value`、可选 `disabled`。                             |
| `rules`                | `FormItemRule[]`                             | 字段校验规则。                                                                           |
| `slot`                 | `string`                                     | `slot`、`upload` 等自定义字段的具名插槽；默认使用 `key`。                                |

内置 `type`：`input`、`password`、`textarea`、`number`、`select`、`remote-select`、`tree-select`、`date`、`daterange`、`switch`、`radio`、`checkbox`、`upload`、`slot`。`remote-select` 由宿主将候选项和 `remoteMethod` 经 `options`、`props` 传入；`upload` 只提供插槽，不包含上传实现。

## Events

| 事件                | 参数                  | 说明                                                  |
| ------------------- | --------------------- | ----------------------------------------------------- |
| `update:modelValue` | `model`               | 字段改变或调用 `resetFields()` 后，返回新的表单对象。 |
| `field-change`      | `(key, value, field)` | 单个字段更新后发出；禁用字段不更新。                  |
| `validate`          | `valid`               | 调用实例 `validate()` 后报告全表结果。                |
| `submit`            | `model`               | `validate()` 全表成功时发出，包含 schema 默认值。     |
| `reset`             | 无                    | 调用实例 `resetFields()` 后发出。                     |

## 插槽与实例

具名字段插槽接收 `{ field, value, disabled, update }`。宿主自定义控件应遵守 `disabled`，并通过 `update(value)` 通知组件；组件会发出 `update:modelValue` 和 `field-change`。全表禁用时 `update` 会忽略写入。

```vue
<LxDynamicForm ref="formRef" v-model="form" :fields="fields">
  <template #attachment="{ value, disabled, update }">
    <MyUpload :model-value="value" :disabled="disabled" @update:model-value="update" />
  </template>
</LxDynamicForm>
```

实例公开 `validate()`、`validateField()`、`resetFields()`、`clearValidate()` 和 `scrollToField()`。`validate()` 返回 `Promise<boolean>`，仅全表成功时发出 `submit`；`validateField()` 保留 Element Plus 的校验返回值。`resetFields()` 恢复初始值、清除校验并通过 `update:modelValue` 和 `reset` 通知宿主，不直接修改父级对象。

## 使用边界

- 表单数据由宿主持有；默认值只用于缺失字段，显式 `null`、`false`、`0` 和空字符串不会被覆盖。
- `span` 按列数折算，不会创建超过当前网格宽度的列；窄屏时所有字段占满一行。
- 远程候选请求的取消、失败反馈和重试由宿主适配层处理。Demo 的内存 Mock 仅验证组件交互，不代表真实后端联调。
- 上传控件、文件校验和提交由宿主插槽负责；业务页面可接入 `LxUpload`。
