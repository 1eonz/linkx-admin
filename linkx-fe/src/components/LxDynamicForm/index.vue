<script setup lang="ts">
/**
 * LxDynamicForm：schema 驱动的 LxUI 表单编排器。
 *
 * 页面只提供字段 schema 和受控值；每个字段类型由独立子组件维护，
 * 子组件组合公开的 Lx* 控件，业务请求仍由宿主通过 props/adapter 注入。
 * `value`/`change` 提供可选的受控值调用方式；`v-model` 保持兼容。
 */
import type { FormInstance, FormItemRule } from 'element-plus'
import {
  computed,
  getCurrentInstance,
  nextTick,
  ref,
  useSlots,
  watch,
  type Component,
} from 'vue'

import LxButton from '../LxButton/index.vue'
import LxForm from '../LxForm/index.vue'
import LxFormItem from '../LxForm/LxFormItem.vue'
import LxDynamicFieldCheckbox from './fields/LxDynamicFieldCheckbox.vue'
import LxDynamicFieldDate from './fields/LxDynamicFieldDate.vue'
import LxDynamicFieldInput from './fields/LxDynamicFieldInput.vue'
import LxDynamicFieldNumber from './fields/LxDynamicFieldNumber.vue'
import LxDynamicFieldPassword from './fields/LxDynamicFieldPassword.vue'
import LxDynamicFieldRadio from './fields/LxDynamicFieldRadio.vue'
import LxDynamicFieldRemoteSelect from './fields/LxDynamicFieldRemoteSelect.vue'
import LxDynamicFieldSelect from './fields/LxDynamicFieldSelect.vue'
import LxDynamicFieldSwitch from './fields/LxDynamicFieldSwitch.vue'
import LxDynamicFieldTextarea from './fields/LxDynamicFieldTextarea.vue'
import LxDynamicFieldTreeSelect from './fields/LxDynamicFieldTreeSelect.vue'
import LxDynamicFieldUpload from './fields/LxDynamicFieldUpload.vue'
import LxDynamicFieldDateRange from './fields/LxDynamicFieldDateRange.vue'
import { isDateRangeValue } from './fields/types'
import type {
  LxDynamicFormField,
  LxDynamicFormFieldFeedback,
  LxDynamicFormInstance,
  LxDynamicFormProps,
  LxDynamicFormSlotProps,
} from './types'
import { focusFirstInvalidFormField } from '../../utils/focusInvalidFormField'
import './style.css'

defineOptions({ name: 'LxDynamicForm', inheritAttrs: false })

const props = withDefaults(defineProps<LxDynamicFormProps>(), {
  modelValue: undefined,
  value: undefined,
  labelWidth: '',
  labelPosition: 'top',
  disabled: false,
  columns: 1,
  adaptive: true,
  // 与表单设计稿一致：行间 12px，列间距由 LxForm 固定为 16px。
  rowGap: 12,
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  /** 受控值事件，载荷为更新后的完整表单值。 */
  change: [value: Record<string, unknown>]
  'field-change': [key: string, value: unknown, field: LxDynamicFormField]
  validate: [valid: boolean, fields?: Record<string, unknown>]
  submit: [value: Record<string, unknown>]
  reset: []
}>()

const slots = useSlots()
defineSlots<Record<string, (scope: LxDynamicFormSlotProps) => unknown>>()

const fieldComponents: Partial<Record<LxDynamicFormField['type'], Component>> =
  {
    input: LxDynamicFieldInput,
    password: LxDynamicFieldPassword,
    textarea: LxDynamicFieldTextarea,
    number: LxDynamicFieldNumber,
    select: LxDynamicFieldSelect,
    'remote-select': LxDynamicFieldRemoteSelect,
    'tree-select': LxDynamicFieldTreeSelect,
    date: LxDynamicFieldDate,
    daterange: LxDynamicFieldDateRange,
    switch: LxDynamicFieldSwitch,
    radio: LxDynamicFieldRadio,
    checkbox: LxDynamicFieldCheckbox,
    upload: LxDynamicFieldUpload,
  }

const formRef = ref<FormInstance>()
const dynamicFormContainer = ref<HTMLElement>()
const formInstanceId = getCurrentInstance()?.uid ?? 0

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

const sourceModel = computed<Record<string, unknown>>(
  () => props.value ?? props.modelValue ?? {},
)
const formModel = ref(modelWithDefaults(sourceModel.value, props.fields))
const initialModel = ref({ ...formModel.value })
const layoutColumns = computed(() => (props.adaptive ? 3 : props.columns))

function fieldStyle(field: LxDynamicFormField): Record<string, string> {
  const spanUnits = field.span ?? 8
  const spanThreeColumns = Math.min(3, Math.max(1, Math.ceil(spanUnits / 8)))
  const spanTwoColumns = Math.min(2, Math.max(1, Math.ceil(spanUnits / 12)))
  const fixedColumns = Math.min(4, Math.max(1, props.columns))
  const fixedSpan =
    spanUnits === 24
      ? '1 / -1'
      : `span ${Math.min(
          fixedColumns,
          Math.max(1, Math.ceil((spanUnits * fixedColumns) / 24)),
        )}`

  // 自适应模式不能把三列基准写进 inline grid-column：inline 样式会压过
  // container query 的两列规则，导致文档容器中 12 栅格字段错误地占满整行。
  // 改用 CSS 变量让当前容器断点选择有效 span；固定列模式仍保留明确的
  // inline grid-column，兼容旧调用方和实例测试。
  return props.adaptive
    ? {
        '--lx-dynamic-form-span-3': String(spanThreeColumns),
        '--lx-dynamic-form-span-2': String(spanTwoColumns),
      }
    : {
        gridColumn: fixedSpan,
        '--lx-dynamic-form-span-3': String(spanThreeColumns),
        '--lx-dynamic-form-span-2': String(spanTwoColumns),
      }
}

watch(
  () => [sourceModel.value, props.fields] as const,
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
  const isTextEntry = ['input', 'password', 'textarea', 'number'].includes(
    field.type,
  )
  const isArrayValue =
    field.type === 'checkbox' ||
    field.type === 'daterange' ||
    (['select', 'remote-select', 'tree-select', 'upload'].includes(
      field.type,
    ) &&
      field.props?.multiple === true)
  const message =
    field.type === 'upload'
      ? `请上传${field.label}`
      : field.type === 'switch'
        ? `请开启${field.label}`
        : `${isTextEntry ? '请输入' : '请选择'}${field.label}`
  const requiredRule: FormItemRule =
    field.type === 'switch'
      ? {
          validator: (_rule, value, callback) => {
            const switchProps = field.props ?? {}
            const activeValue = Object.prototype.hasOwnProperty.call(
              switchProps,
              'activeValue',
            )
              ? switchProps.activeValue
              : Object.prototype.hasOwnProperty.call(
                    switchProps,
                    'active-value',
                  )
                ? switchProps['active-value']
                : true
            callback(value === activeValue ? undefined : new Error(message))
          },
          message,
          trigger: 'change',
        }
      : field.type === 'daterange'
        ? {
            validator: (_rule, value, callback) => {
              const valueFormat = field.props?.valueFormat
              callback(
                isDateRangeValue(
                  value,
                  typeof valueFormat === 'string' ? valueFormat : undefined,
                )
                  ? undefined
                  : new Error(message),
              )
            },
            message,
            trigger: 'change',
          }
        : {
            required: true,
            ...(isArrayValue ? { type: 'array' as const } : {}),
            message,
            trigger: isTextEntry ? 'blur' : 'change',
          }
  return [requiredRule, ...(field.rules ?? [])]
}

function fieldValue(field: LxDynamicFormField): unknown {
  return formModel.value[field.key]
}

function fieldFeedbackId(field: LxDynamicFormField): string {
  const encodedKey =
    Array.from(
      field.key,
      (character) => character.codePointAt(0)?.toString(16) ?? '0',
    ).join('-') || 'empty'
  return `lx-dynamic-form-${formInstanceId}-feedback-${encodedKey}`
}

function feedbackStatus(
  feedback: LxDynamicFormFieldFeedback,
): NonNullable<LxDynamicFormFieldFeedback['status']> {
  return feedback.status ?? 'info'
}

function retryFieldFeedback(field: LxDynamicFormField): void {
  if (isDisabled(field) || field.feedback?.status === 'loading') return
  field.feedback?.retry?.()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function updateField(field: LxDynamicFormField, value: unknown): void {
  if (isDisabled(field)) return
  const next = { ...formModel.value, [field.key]: value }
  formModel.value = next
  emit('update:modelValue', next)
  emit('change', next)
  emit('field-change', field.key, value, field)
}

function fieldComponent(field: LxDynamicFormField): Component | undefined {
  return fieldComponents[field.type]
}

function slotName(field: LxDynamicFormField): string {
  return field.slot ?? field.key
}

function hasCustomSlot(field: LxDynamicFormField): boolean {
  return Boolean(slots[slotName(field)])
}

function slotProps(field: LxDynamicFormField): LxDynamicFormSlotProps {
  return {
    field,
    value: fieldValue(field),
    disabled: isDisabled(field),
    ariaDescribedBy: field.feedback ? fieldFeedbackId(field) : undefined,
    update: (value: unknown) => updateField(field, value),
  }
}

function validate(): Promise<boolean> {
  if (!formRef.value) return Promise.resolve(false)
  return formRef.value
    .validate()
    .then(() => {
      emit('validate', true, { ...formModel.value })
      emit('submit', { ...formModel.value })
      return true
    })
    .catch((fields: unknown) => {
      emit('validate', false, isRecord(fields) ? fields : undefined)
      const firstInvalidField = isRecord(fields)
        ? Object.keys(fields)[0]
        : undefined
      if (firstInvalidField) formRef.value?.scrollToField(firstInvalidField)
      if (firstInvalidField) {
        return nextTick().then(() => {
          const root = dynamicFormContainer.value
          if (root) focusFirstInvalidFormField(root)
          return false
        })
      }
      return false
    })
}

function resetFields(): void {
  formRef.value?.resetFields()
  const next = { ...initialModel.value }
  formModel.value = next
  emit('update:modelValue', next)
  emit('change', next)
  emit('reset')
  void nextTick(() => formRef.value?.clearValidate())
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
  <div ref="dynamicFormContainer" class="lx-dynamic-form-container">
    <LxForm
      ref="formRef"
      class="lx-dynamic-form"
      :class="{ 'lx-dynamic-form--fixed': !adaptive }"
      v-bind="$attrs"
      :model="formModel"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :disabled="disabled"
      :columns="layoutColumns"
      :row-gap="rowGap"
      :scroll-to-error="true"
    >
      <template v-for="field in fields" :key="field.key">
        <template v-if="isVisible(field)">
          <h3
            v-if="field.sectionTitleBefore"
            class="lx-dynamic-form__section-title"
          >
            {{ field.sectionTitleBefore }}
          </h3>
          <LxFormItem
            class="lx-dynamic-form__item"
            :style="fieldStyle(field)"
            :label="field.label"
            :prop="field.key"
            :rules="fieldRules(field)"
            :required="field.required"
            :span="field.span === 24 ? 'full' : 1"
          >
            <slot
              v-if="
                field.type === 'slot' ||
                (field.type === 'upload' && hasCustomSlot(field))
              "
              :name="slotName(field)"
              v-bind="slotProps(field)"
            />
            <component
              :is="fieldComponent(field)"
              v-else-if="fieldComponent(field)"
              :field="field"
              :value="fieldValue(field)"
              :disabled="isDisabled(field)"
              :aria-describedby="
                field.feedback ? fieldFeedbackId(field) : undefined
              "
              @change="updateField(field, $event)"
            />
            <div
              v-if="field.feedback"
              :id="fieldFeedbackId(field)"
              class="lx-dynamic-form__feedback"
              :class="`is-${feedbackStatus(field.feedback)}`"
              :role="
                feedbackStatus(field.feedback) === 'error' ? 'alert' : 'status'
              "
              :aria-live="
                feedbackStatus(field.feedback) === 'error'
                  ? 'assertive'
                  : 'polite'
              "
              data-lx-field-feedback
            >
              <span>{{ field.feedback.message }}</span>
              <LxButton
                v-if="field.feedback.retry"
                type="text"
                size="sm"
                :disabled="
                  isDisabled(field) ||
                  feedbackStatus(field.feedback) === 'loading'
                "
                @click="retryFieldFeedback(field)"
              >
                {{ field.feedback.retryLabel ?? '重试' }}
              </LxButton>
            </div>
          </LxFormItem>
        </template>
      </template>
    </LxForm>
  </div>
</template>
