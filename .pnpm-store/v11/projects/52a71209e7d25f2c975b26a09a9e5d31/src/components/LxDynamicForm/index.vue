<script setup lang="ts">
/**
 * LxDynamicForm：根据字段 schema 渲染常用表单控件。
 * 请求、上传和业务组件通过 props、插槽或 remote-select 的宿主适配注入，组件本身不访问网络。
 */
import { computed, ref, watch } from 'vue'
import {
  ElCheckbox,
  ElCheckboxGroup,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
  ElTreeSelect,
} from 'element-plus'
import type { FormInstance, FormItemRule } from 'element-plus'
import type {
  LxDynamicFormField,
  LxDynamicFormInstance,
  LxDynamicFormProps,
  LxDynamicFormSlotProps,
} from './types'
import './style.css'

const props = withDefaults(defineProps<LxDynamicFormProps>(), {
  labelWidth: '',
  labelPosition: 'top',
  disabled: false,
  columns: 1,
  rowGap: 16,
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  'field-change': [key: string, value: unknown, field: LxDynamicFormField]
  validate: [valid: boolean, fields?: Record<string, unknown>]
  submit: [value: Record<string, unknown>]
  reset: []
}>()
defineSlots<Record<string, (scope: LxDynamicFormSlotProps) => unknown>>()

const formRef = ref<FormInstance>()
function modelWithDefaults(
  model: Record<string, unknown>,
  fields: LxDynamicFormField[],
): Record<string, unknown> {
  const next = { ...model }
  fields.forEach((field) => {
    if (next[field.key] === undefined && field.defaultValue !== undefined) {
      next[field.key] = field.defaultValue
    }
  })
  return next
}

const formModel = ref(modelWithDefaults(props.modelValue, props.fields))
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`,
  rowGap: `${props.rowGap}px`,
}))

function fieldStyle(field: LxDynamicFormField) {
  const unitsPerColumn = 24 / props.columns
  const spanUnits = field.span ?? unitsPerColumn
  const spanColumns = Math.min(
    props.columns,
    Math.max(1, Math.ceil(spanUnits / unitsPerColumn)),
  )
  return {
    gridColumn:
      spanColumns === props.columns ? '1 / -1' : `span ${spanColumns}`,
  }
}

watch(
  () => [props.modelValue, props.fields] as const,
  ([model, fields]) => {
    formModel.value = modelWithDefaults(model, fields)
  },
  { deep: true },
)

function isVisible(field: LxDynamicFormField): boolean {
  return typeof field.visible === 'function'
    ? field.visible(formModel.value)
    : field.visible !== false
}

function isDisabled(field: LxDynamicFormField): boolean {
  return (
    props.disabled ||
    (typeof field.disabled === 'function'
      ? field.disabled(formModel.value)
      : field.disabled === true)
  )
}

function fieldRules(field: LxDynamicFormField): FormItemRule[] | undefined {
  if (!field.required) return field.rules
  const requiredRule: FormItemRule = {
    required: true,
    message: `请输入${field.label}`,
    trigger: 'blur',
  }
  return [requiredRule, ...(field.rules ?? [])]
}

function updateField(field: LxDynamicFormField, value: unknown): void {
  if (isDisabled(field)) return
  const next = { ...formModel.value, [field.key]: value }
  formModel.value = next
  emit('update:modelValue', next)
  emit('field-change', field.key, value, field)
}

function fieldValue(field: LxDynamicFormField): unknown {
  return formModel.value[field.key]
}

function textValue(field: LxDynamicFormField): string | undefined {
  const value = fieldValue(field)
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined
}

function selectValue(
  field: LxDynamicFormField,
): string | number | boolean | object | undefined {
  const value = fieldValue(field)
  return value !== null &&
    ['string', 'number', 'boolean', 'object'].includes(typeof value)
    ? (value as string | number | boolean | object)
    : undefined
}

function dateValue(
  field: LxDynamicFormField,
): string | number | Date | string[] | number[] | Date[] | undefined {
  const value = fieldValue(field)
  return typeof value === 'string' ||
    typeof value === 'number' ||
    value instanceof Date ||
    Array.isArray(value)
    ? (value as string | number | Date | string[] | number[] | Date[])
    : undefined
}

function radioValue(
  field: LxDynamicFormField,
): string | number | boolean | undefined {
  const value = fieldValue(field)
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? value
    : undefined
}

function checkboxValue(field: LxDynamicFormField): (string | number)[] {
  const value = fieldValue(field)
  return Array.isArray(value)
    ? value.filter(
        (item): item is string | number =>
          typeof item === 'string' || typeof item === 'number',
      )
    : []
}

async function validate(): Promise<boolean> {
  if (!formRef.value) return false
  const valid = await formRef.value.validate().catch(() => false)
  emit('validate', valid)
  if (valid) emit('submit', { ...formModel.value })
  return valid
}

function resetFields(): void {
  formRef.value?.resetFields()
  emit('update:modelValue', { ...formModel.value })
  emit('reset')
}

const publicMethods: LxDynamicFormInstance = {
  validate,
  validateField: (...args: Parameters<FormInstance['validateField']>) =>
    formRef.value?.validateField(...args) ?? Promise.resolve(false),
  resetFields,
  clearValidate: (...args: Parameters<FormInstance['clearValidate']>) =>
    formRef.value?.clearValidate(...args),
  scrollToField: (...args: Parameters<FormInstance['scrollToField']>) =>
    formRef.value?.scrollToField(...args),
}
defineExpose(publicMethods)
</script>

<template>
  <ElForm
    ref="formRef"
    class="lx-dynamic-form"
    :style="gridStyle"
    :model="formModel"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :disabled="disabled"
  >
    <template v-for="field in fields" :key="field.key">
      <ElFormItem
        v-if="isVisible(field)"
        class="lx-dynamic-form__item"
        :class="{ 'lx-dynamic-form__item--full': field.span === 24 }"
        :style="fieldStyle(field)"
        :label="field.label"
        :prop="field.key"
        :rules="fieldRules(field)"
        :required="field.required"
      >
        <slot
          v-if="field.type === 'slot'"
          :name="field.slot ?? field.key"
          :field="field"
          :value="fieldValue(field)"
          :disabled="isDisabled(field)"
          :update="(value: unknown) => updateField(field, value)"
        />
        <ElInput
          v-else-if="
            field.type === 'input' ||
            field.type === 'password' ||
            field.type === 'textarea'
          "
          :model-value="textValue(field)"
          v-bind="field.props"
          :type="
            field.type === 'password'
              ? 'password'
              : field.type === 'textarea'
                ? 'textarea'
                : 'text'
          "
          :disabled="isDisabled(field)"
          @update:model-value="updateField(field, $event)"
        />
        <ElInputNumber
          v-else-if="field.type === 'number'"
          :model-value="fieldValue(field) as number | undefined"
          v-bind="field.props"
          :disabled="isDisabled(field)"
          @update:model-value="updateField(field, $event)"
        />
        <ElSelect
          v-else-if="field.type === 'select' || field.type === 'remote-select'"
          :model-value="selectValue(field)"
          v-bind="field.props"
          :disabled="isDisabled(field)"
          @update:model-value="updateField(field, $event)"
          ><ElOption
            v-for="option in field.options ?? []"
            :key="String(option.value)"
            :label="option.label"
            :value="option.value as string | number | boolean | object"
            :disabled="option.disabled"
        /></ElSelect>
        <ElTreeSelect
          v-else-if="field.type === 'tree-select'"
          :model-value="selectValue(field)"
          v-bind="field.props"
          :disabled="isDisabled(field)"
          @update:model-value="updateField(field, $event)"
        />
        <ElDatePicker
          v-else-if="field.type === 'date' || field.type === 'daterange'"
          :model-value="dateValue(field)"
          v-bind="field.props"
          :type="field.type === 'daterange' ? 'daterange' : 'date'"
          :disabled="isDisabled(field)"
          @update:model-value="updateField(field, $event)"
        />
        <ElSwitch
          v-else-if="field.type === 'switch'"
          :model-value="Boolean(fieldValue(field))"
          v-bind="field.props"
          :disabled="isDisabled(field)"
          @update:model-value="updateField(field, $event)"
        />
        <ElRadioGroup
          v-else-if="field.type === 'radio'"
          :model-value="radioValue(field)"
          v-bind="field.props"
          :disabled="isDisabled(field)"
          @update:model-value="updateField(field, $event)"
          ><ElRadio
            v-for="option in field.options ?? []"
            :key="String(option.value)"
            :label="option.value as string | number"
            :disabled="option.disabled"
            >{{ option.label }}</ElRadio
          ></ElRadioGroup
        >
        <ElCheckboxGroup
          v-else-if="field.type === 'checkbox'"
          :model-value="checkboxValue(field)"
          v-bind="field.props"
          :disabled="isDisabled(field)"
          @update:model-value="updateField(field, $event)"
          ><ElCheckbox
            v-for="option in field.options ?? []"
            :key="String(option.value)"
            :label="option.value as string | number | boolean"
            :disabled="option.disabled"
            >{{ option.label }}</ElCheckbox
          ></ElCheckboxGroup
        >
        <slot
          v-else
          :name="field.slot ?? field.key"
          :field="field"
          :value="fieldValue(field)"
          :disabled="isDisabled(field)"
          :update="(value: unknown) => updateField(field, value)"
        />
      </ElFormItem>
    </template>
  </ElForm>
</template>
