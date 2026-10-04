# LxDynamicForm 动态表单

通过字段 schema 组合 `Lx*` 基础控件，使用 `v-model` 或 `value` + `change(nextValue)` 受控值契约向宿主报告字段变化；两种写法都可在 Vue 模板或 TSX 中使用，Vue 项目仍推荐优先使用 `v-model`。每种字段类型由独立子组件管理；远程候选项和上传适配器由宿主提供，组件不访问业务接口。

## 最小配置

先准备受控表单值和字段列表，再把两者交给组件：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LxDynamicForm, type LxDynamicFormField } from 'lx-ui'

const form = ref({ name: '' })
const fields: LxDynamicFormField[] = [
  {
    key: 'name',
    label: '任务名称',
    type: 'input',
    required: true,
    props: { placeholder: '请输入任务名称' },
  },
]
</script>

<template>
  <LxDynamicForm v-model="form" :fields="fields" />
</template>
```

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxDynamicForm/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxDynamicForm/demo/basic.vue
:::

示例默认先展示一张可填写的任务表单；低频的布局、禁用、主题和 Mock 状态控制收在“演示设置”中。示例显示任务类型联动字段、受控禁用、单张/多张图片的 `LxUpload` 列表、表单校验、重置及 HUD 深色令牌。候选人员的加载、空结果、失败和重试反馈会贴在“负责人”字段下；“加载中”按钮可固定展示 loading 状态，直到选择其他模拟结果。图片上传由宿主注入的内存 Mock 驱动；不会发起真实网络请求。

## Props

| 名称            | 类型                         | 默认值  | 说明                                                            |
| --------------- | ---------------------------- | ------- | --------------------------------------------------------------- |
| `modelValue`    | `Record<string, unknown>`    | —       | 受控表单数据，配合 `v-model`；保留旧契约。                      |
| `value`         | `Record<string, unknown>`    | —       | 受控表单数据；与 `change(nextModel)` 搭配，同时存在时优先使用。 |
| `fields`        | `LxDynamicFormField[]`       | 必填    | 字段 schema，按数组顺序渲染。                                   |
| `columns`       | `1 \| 2 \| 3 \| 4`           | `1`     | `adaptive=false` 时的固定列数。                                 |
| `adaptive`      | `boolean`                    | `true`  | 按容器宽度自适应为 3/2/1 列；窄容器不依赖视口宽度。             |
| `labelWidth`    | `string \| number`           | `''`    | 表单标签宽度，传给表单容器。                                    |
| `labelPosition` | `'top' \| 'left' \| 'right'` | `'top'` | 标签位置。                                                      |
| `disabled`      | `boolean`                    | `false` | 禁用内置字段，且传给自定义插槽的 `disabled` 参数。              |
| `rowGap`        | `number`                     | `12`    | 行间距，单位 px。                                               |

## 字段 schema

| 字段                   | 类型                                         | 说明                                                                                                                  |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `key`、`label`、`type` | `string`、`string`、`LxDynamicFormFieldType` | 字段键、可见标签和控件类型。                                                                                          |
| `required`             | `boolean`                                    | 生成默认必填校验；复选/多选字段要求非空数组，必填开关需匹配 `activeValue`（默认 `true`）；自定义规则由 `rules` 追加。 |
| `span`                 | `1 \| 2 \| 3 \| 4 \| 6 \| 8 \| 12 \| 24`     | 24 栅格单位。实际占用列数按当前 `columns` 向上取整，`24` 通栏。                                                       |
| `visible`              | `boolean \| (model) => boolean`              | 依据当前表单 model 控制显示。                                                                                         |
| `disabled`             | `boolean \| (model) => boolean`              | 依据当前表单 model 控制字段禁用。                                                                                     |
| `defaultValue`         | `unknown`                                    | `modelValue[key] === undefined` 时作为初始显示值和校验值；不会在挂载时主动修改父级对象。                              |
| `props`                | `Record<string, unknown>`                    | 传给对应 `Lx*` 控件的属性；上传可配置 `accept`、`multiple`、`limit` 与宿主适配器。                                    |
| `options`              | `LxDynamicFormOption[]`                      | 选择、单选和复选项，包含 `label`、`value`、可选 `disabled`。                                                          |
| `feedback`             | `LxDynamicFormFieldFeedback`                 | 可选的字段级状态文案；可提供 `status`、`message` 与 `retry`，让远程失败和恢复动作紧贴字段显示。                       |
| `rules`                | `FormItemRule[]`                             | 字段校验规则。                                                                                                        |
| `slot`                 | `string`                                     | `slot`、`upload` 等自定义字段的具名插槽；默认使用 `key`。                                                             |

内置 `type`：`input`、`password`、`textarea`、`number`、`select`、`remote-select`、`tree-select`、`date`、`daterange`、`switch`、`radio`、`checkbox`、`upload`、`slot`。`remote-select` 由宿主将候选项和 `remoteMethod` 经 `options`、`props` 传入；`upload` 默认使用 `LxUpload`，根据 `props.multiple` 管理单文件或多文件列表，支持进度、失败重试、取消和移除；同名具名插槽存在时继续使用旧的自定义上传契约。

## Events

| 事件                | 参数                  | 说明                                                  |
| ------------------- | --------------------- | ----------------------------------------------------- |
| `update:modelValue` | `model`               | 字段改变或调用 `resetFields()` 后，返回新的表单对象。 |
| `change`            | `nextModel`           | 与 `value` 搭配的受控事件，返回更新后的完整表单对象。 |
| `field-change`      | `(key, value, field)` | 单个字段更新后发出；禁用字段不更新。                  |
| `validate`          | `valid`               | 调用实例 `validate()` 后报告全表结果。                |
| `submit`            | `model`               | `validate()` 全表成功时发出，包含 schema 默认值。     |
| `reset`             | 无                    | 调用实例 `resetFields()` 后发出。                     |

## 插槽与实例

具名字段插槽接收 `{ field, value, disabled, ariaDescribedBy, update }`。宿主自定义控件应遵守 `disabled`，并通过 `update(value)` 通知组件；组件会发出 `update:modelValue` 和 `field-change`。字段配置了 `feedback` 时，应把 `ariaDescribedBy` 绑定到自定义控件的 `aria-describedby`，使辅助技术在控件聚焦时读出说明。全表禁用时 `update` 会忽略写入。

```vue
<LxDynamicForm ref="formRef" v-model="form" :fields="fields">
  <template #attachment="{ value, disabled, ariaDescribedBy, update }">
    <MyUpload :model-value="value" :disabled="disabled" :aria-describedby="ariaDescribedBy" @update:model-value="update" />
  </template>
</LxDynamicForm>
```

受控值调用：

```vue
<LxDynamicForm :value="form" :fields="fields" @change="form = $event" />
```

字段级反馈与重试：

```ts
const fields = [
  {
    key: 'officer',
    label: '负责人',
    type: 'remote-select',
    feedback: {
      status: 'error',
      message: '候选人员读取失败',
      retry: loadCandidates,
      retryLabel: '重试',
    },
  },
]
```

`feedback` 只负责呈现宿主传入的状态。`retry` 只触发宿主的恢复流程，网络请求仍由宿主按 `.then().catch().finally()` 编排；状态为 `loading` 时重试按钮会禁用，避免重复发起请求。错误、加载和空结果不需要再在表单底部重复一份文案。

实例公开 `validate()`、`validateField()`、`resetFields()`、`clearValidate()` 和 `scrollToField()`。`validate()` 返回 `Promise<boolean>`，仅全表成功时发出 `submit`；`validateField()` 保留 Element Plus 的校验返回值。`resetFields()` 恢复初始值、清除校验并通过 `update:modelValue` 和 `reset` 通知宿主，不直接修改父级对象。

## 使用边界

- 表单数据由宿主持有；默认值只用于缺失字段，显式 `null`、`false`、`0` 和空字符串不会被覆盖。
- 字段按 schema 数组顺序连续渲染。较长表单由宿主按业务语义添加分区标题或拆成步骤；组件自身不负责分步导航和分区状态。
- `span` 按 24 栅格折算；默认自适应以三列为基准，容器小于 760px 折为两列，小于 520px 折为单列，所有字段占满一行。
- 远程候选请求的取消、状态和恢复由宿主适配层处理；需要贴近字段显示时，给字段传入 `feedback`，由 `retry` 触发宿主重试。Demo 的内存 Mock 仅验证组件交互，不代表真实后端联调。
- 上传控件由 `LxUpload` 管理文件列表和状态，上传请求、鉴权和业务提交仍由宿主通过 `httpRequest`/adapter 注入；单图字段在 `change` 中返回首个文件，多图字段返回文件数组。
