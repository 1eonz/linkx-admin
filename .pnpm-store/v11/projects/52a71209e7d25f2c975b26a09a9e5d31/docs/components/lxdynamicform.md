# LxDynamicForm 动态表单

通过字段 schema 组合 `Lx*` 基础控件，使用 `v-model` 或 `value` + `change(nextValue)` 受控值契约向宿主报告字段变化；两种写法都可在 Vue 模板或 TSX 中使用，Vue 项目仍推荐优先使用 `v-model`。每种字段类型由独立子组件管理；远程候选项和上传适配器由宿主提供，组件不访问业务接口。

## 交互示例

<script setup lang="ts">
import Basic from '../../src/components/LxDynamicForm/demo/basic.vue';
</script>

<Basic />

::: details 查看示例代码
<<< ../../src/components/LxDynamicForm/demo/basic.vue
:::

示例默认展示一张可填写的任务表单，并按“任务信息”“任务状态”“附件”分组；低频的布局、禁用、主题和主表单 Mock 状态控制收在“演示设置”中。主题开关会同步切换当前文档页外壳与组件预览，离开演示页时恢复进入前的主题。主表单中的任务名称、访问密码和任务类型为必填，任务类型联动、受控禁用、单张/多张图片上传、表单校验与重置均可操作；多图列表仅预置一张图片，降低移动端纵向占用。

“浏览全部字段类型”链接会展开默认折叠的类型预览并定位到预览内容。预览包含全部 14 种内置 schema 类型，分为文本类字段、单值选择、日期与数值、多值/状态/扩展四类。首次展开默认显示文本输入；先选择类别，再在该类中搜索或选择字段类型，每次最多呈现四种类型，避免一次展开完整类型清单。类型选择支持键盘搜索与确认，不会把所有控件堆入同一张表单。

必填错误由真实 `LxForm/LxFormItem` 显示，并验证错误文案、首个无效控件焦点与 `aria-describedby` 关联在修正后清理。远程选择类型预览有独立的成功、空结果和失败模拟控制；主表单与预览分别维护候选项、loading、取消、失败及重试状态。主表单候选模拟使用单选组切换加载中、成功、空结果和失败；取消查询仅在加载时可用。预览重试会将预览模式恢复为成功并重新加载当前关键词，不改写主表单模式。主表单查询另覆盖取消、旧请求迟到保护和恢复。图片上传由宿主注入的内存 Mock 驱动；不会发起真实网络请求。

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

| 字段                   | 类型                                         | 说明                                                                                                                                                                                    |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`、`label`、`type` | `string`、`string`、`LxDynamicFormFieldType` | 字段键、可见标签和控件类型。                                                                                                                                                            |
| `required`             | `boolean`                                    | 生成默认必填校验；复选/多选字段要求非空数组，日期范围要求同类型、真实有效且开始不晚于结束的两个端点，必填开关需匹配 `activeValue`（默认 `true`）；自定义规则由 `rules` 追加。           |
| `span`                 | `1 \| 2 \| 3 \| 4 \| 6 \| 8 \| 12 \| 24`     | 24 栅格单位。实际占用列数按当前 `columns` 向上取整，`24` 通栏。                                                                                                                         |
| `visible`              | `boolean \| (model) => boolean`              | 依据当前表单 model 控制显示。                                                                                                                                                           |
| `sectionTitleBefore`   | `string`                                     | 在字段前输出占满网格的语义分组标题，不进入表单值或校验。                                                                                                                                |
| `disabled`             | `boolean \| (model) => boolean`              | 依据当前表单 model 控制字段禁用。                                                                                                                                                       |
| `defaultValue`         | `unknown`                                    | `modelValue[key] === undefined` 时作为初始显示值和校验值；不会在挂载时主动修改父级对象。                                                                                                |
| `props`                | `Record<string, unknown>`                    | 传给对应 `Lx*` 控件的属性；密码字段始终保持遮罩；日期范围可传 `valueFormat`；远程选择默认可检索，可用 `filterable: false` 关闭；上传可配置 `accept`、`multiple`、`limit` 与宿主适配器。 |
| `options`              | `LxDynamicFormOption[]`                      | 选择、单选和复选项，包含 `label`、`value`、可选 `disabled`。                                                                                                                            |
| `feedback`             | `LxDynamicFormFieldFeedback`                 | 可选的字段级状态文案；可提供 `status`、`message` 与 `retry`，让远程失败和恢复动作紧贴字段显示。                                                                                         |
| `rules`                | `FormItemRule[]`                             | 字段校验规则。                                                                                                                                                                          |
| `slot`                 | `string`                                     | `slot`、`upload` 等自定义字段的具名插槽；默认使用 `key`。                                                                                                                               |

内置 `type`：`input`、`password`、`textarea`、`number`、`select`、`remote-select`、`tree-select`、`date`、`daterange`、`switch`、`radio`、`checkbox`、`upload`、`slot`。`password` 使用 `LxPasswordInput`，`props.type` 不会将其改成明文输入；`remote-select` 强制远程模式，默认启用检索，由宿主将候选项和 `remoteMethod` 经 `options`、`props` 传入；`daterange` 接受同类型的两个字符串、时间戳或 `Date`，开始时间不能晚于结束时间，传入 `valueFormat` 时按该格式严格解析字符串；使用默认日期清空行为时字段值为 `null`。`upload` 默认使用 `LxUpload`，根据 `props.multiple` 管理文件值：单文件字段发出 `LxUploadFile | null`，多文件字段发出 `LxUploadFile[]`；初始 URL 字符串可用于回显，展示文件名时会排除 query 和 hash，但文件对象仍保留完整 URL；字段更新后发出文件对象。上传成功响应和失败 `Error` 均随受控文件值保留，业务字段由宿主解释。文件控件支持进度、失败重试、取消和移除；同名具名插槽存在时继续使用旧的自定义上传契约。

文档 Demo 的内存上传适配器不发起网络请求；文件名以 `重试-` 开头时首次上传会失败，重试后成功，用于演示单图和多图字段的错误恢复。该行为仅属于 Demo Mock。

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

## Events

| 事件                | 参数                  | 说明                                                                                           |
| ------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `update:modelValue` | `model`               | 字段改变或调用 `resetFields()` 后，返回新的表单对象。                                          |
| `change`            | `nextModel`           | 字段更新或调用 `resetFields()` 后发出完整表单对象；配合 `value` 时由宿主回传该值维持受控状态。 |
| `field-change`      | `(key, value, field)` | 单个字段更新后发出；禁用字段不更新。                                                           |
| `validate`          | `(valid, fields?)`    | 调用实例 `validate()` 后报告全表结果；成功时 `fields` 为值快照，失败时为校验错误字段。         |
| `submit`            | `model`               | `validate()` 全表成功时发出，包含 schema 默认值。                                              |
| `reset`             | 无                    | 调用实例 `resetFields()` 后发出。                                                              |

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

实例公开 `validate()`、`validateField()`、`resetFields()`、`clearValidate()` 和 `scrollToField()`。`validate()` 返回 `Promise<boolean>`，并发出 `validate(valid, fields?)`；仅全表成功时发出 `submit`。`validateField()` 保留 Element Plus 的校验返回值。`resetFields()` 恢复初始值、清除校验并通过 `update:modelValue`、`change` 和 `reset` 通知宿主，不直接修改父级对象。

## 使用边界

- 表单数据由宿主持有；默认值只用于缺失字段，显式 `null`、`false`、`0` 和空字符串不会被覆盖。
- 字段按 schema 数组顺序连续渲染。较长表单由宿主按业务语义添加分区标题或拆成步骤；组件自身不负责分步导航和分区状态。
- `span` 按 24 栅格折算；默认自适应以三列为基准，容器小于 760px 折为两列，小于 520px 折为单列，所有字段占满一行。
- 远程候选请求的取消、状态和恢复由宿主适配层处理；需要贴近字段显示时，给字段传入 `feedback`，由 `retry` 触发宿主重试。Demo 的内存 Mock 仅验证组件交互，不代表真实后端联调。
- 上传控件由 `LxUpload` 管理文件列表和状态，上传请求、鉴权和业务提交仍由宿主通过 `httpRequest`/adapter 注入；单文件字段在 `change` 中返回首个 `LxUploadFile` 或 `null`，多文件字段返回 `LxUploadFile[]`。已存在的 URL 字符串会映射为成功文件用于回显；上传成功响应原样保存在 `response`，组件不推断服务器字段。
