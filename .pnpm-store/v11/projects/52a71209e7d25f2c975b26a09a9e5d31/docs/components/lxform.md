# 数据录入表单

**LxForm + LxFormItem**：Element Plus `el-form` / `el-form-item` 二次封装。核心价值：**错误提示样式由组件库接管**（stitch `_26` 节点管理弹窗错误态规格：11px 深红文字 + 圆圈感叹号图标 + 输入框红边浅红底），业务禁止自写校验红字。`$attrs` 全透传，存量 `el-form` 用法零成本迁移。

## 何时使用

- 弹窗表单（配 LxDialog + `columns=2`）、页面表单（`columns=1`）、行内搜索表单（`inline`）
- 需要统一错误提示视觉的任何 `el-form` 场景

## 基础校验表单（label 上置 · blur/change 触发）

<script setup lang="ts">
import Basic from '../../src/components/LxForm/demo/basic.vue';
import DialogDemo from '../../src/components/LxForm/demo/dialog.vue';
</script>

<div class="demo-box"><Basic /></div>

::: details 查看代码
<<< ../../src/components/LxForm/demo/basic.vue
:::

要点：`label-position` 默认 `top`（设计稿表单 label 上置 12px/500）；rules 惯例 —— 输入类 `trigger: 'blur'`、选择类 `trigger: 'change'`；LxForm 内直接写原生 `el-form-item` 同样获得组件库错误样式（存量代码迁移零成本）。

## 弹窗双列表单（LxDialog + columns=2 组合）

<div class="demo-box"><DialogDemo /></div>

::: details 查看代码
<<< ../../src/components/LxForm/demo/dialog.vue
:::

要点：`columns="2"` 双列网格（stitch `_26` 表单弹窗 `max-w-2xl grid-cols-2` 规格），通栏字段 `span="full"`；打开弹窗回显数据后 `nextTick(() => formRef.value?.clearValidate())` 清残留校验 —— 这是全项目弹窗表单的惯用法。

## 行内搜索表单（inline）

```vue
<LxForm :model="query" inline>
  <LxFormItem>
    <ElInput v-model="query.keyword" placeholder="组织名称" clearable @keyup.enter="onSearch" />
  </LxFormItem>
  <LxFormItem>
    <ElSelect v-model="query.status" placeholder="状态" clearable>
      <ElOption label="在线" value="1" />
    </ElSelect>
  </LxFormItem>
  <LxFormItem>
    <button class="demo-btn" @click="onSearch">搜索</button>
  </LxFormItem>
</LxForm>
```

## API — LxForm

| Prop | 说明 | 类型 | 默认值 |
|---|---|---|---|
| model | 表单数据对象（必传） | `Record<string, any>` | — |
| rules | 校验规则（支持 computed 动态规则） | `FormRules` | — |
| label-position | label 位置 | `'top' \| 'left' \| 'right'` | `top` |
| label-width | label 宽度（left/right 生效） | `string \| number` | — |
| inline | 行内表单（与 columns 互斥） | `boolean` | `false` |
| disabled | 整表禁用 | `boolean` | `false` |
| columns | 网格列数（2/3 双列三列） | `number` | `1` |
| row-gap | 网格行间距 | `number` | `16` |

**透传**：`status-icon` / `scroll-to-error` / `hide-required-asterisk` / `label-suffix` / `validate-on-rule-change` / `size` / `@validate` 等 el-form 全量 props 与事件原样透传。

**Ref 方法**（`ref<LxFormInstance>()`）：

| 方法 | 说明 |
|---|---|
| validate | 全表校验，`Promise`；`.catch()` 分支提示用户 |
| validateField | 校验指定字段（跨字段联动校验用） |
| resetFields | 重置为初始值并清校验 |
| clearValidate | 清校验标记（弹窗回显后必调） |
| scrollToField | 滚动到指定字段 |

## API — LxFormItem

| Prop | 说明 | 类型 | 默认值 |
|---|---|---|---|
| label | 字段标签 | `string` | — |
| prop | model 字段路径（校验绑定） | `string` | — |
| rules | 仅本项校验规则 | `FormItemRule[]` | — |
| required | 必填星号（视觉标记） | `boolean` | — |
| span | 网格跨列：`1` / `2…` / `'full'` 通栏 | `number \| 'full'` | `1` |

插槽全量转发（含 `#error` 自定义错误渲染、`#label`）。

## 设计说明

- **错误态规格**（stitch `_26`）：输入框 `1px` 红边 + `--lx-color-error-light` 浅红底；错误提示 11px `--lx-color-error-strong`（小字号对比度补偿）+ 12px 圆圈感叹号图标。
- **兼容范围**：el-input / el-select / el-textarea / el-date-picker / el-cascader 等全系输入容器的错误态均已覆盖。
- **label 上置**是设计稿表单主形态；老项目 `label-position="left"` + `label-width="120px"` 用法完全兼容。

## 迁移指南（el-form → LxForm）

1. 标签 `el-form` → `LxForm`、`el-form-item` → `LxFormItem`（或不改，原生 el-form-item 在 LxForm 内同样生效）
2. props 原样保留（model / rules / label-width / disabled / @validate…）
3. `const formRef = ref<FormInstance>()` → `ref<LxFormInstance>()`，方法名不变
4. 删除业务里自写的校验红字样式，交由组件库接管
