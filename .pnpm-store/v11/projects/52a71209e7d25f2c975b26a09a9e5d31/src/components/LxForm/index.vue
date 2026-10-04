<script setup lang="ts">
/**
 * LxForm — 表单容器（Element Plus el-form 二次封装）
 * 视觉源：design/表单控件八件套/（32px 控件、标签、错误态与业务表单）
 * 铁律：
 *  - $attrs 全透传：未声明的 props（statusIcon/scrollToError/labelSuffix/hideRequiredAsterisk/
 *    validateOnRuleChange/size…）与 @validate 事件原样传给 el-form，存量用法零成本迁移
 *  - 错误提示样式由组件库接管（style.css），校验色与表单设计标本一致
 *  - 纯受控零请求（P7）：校验/提交/重置全部由业务驱动
 */
import { ElForm } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { computed, getCurrentInstance, nextTick, onMounted, ref } from 'vue'

import { focusFirstInvalidFormField } from '../../utils/focusInvalidFormField'
import type { LxFormInstance, LxFormProps } from './types'
import './style.css'
import 'element-plus/es/components/form/style/css'

const props = withDefaults(defineProps<LxFormProps>(), {
  model: () => ({}),
  rules: () => ({}),
  labelWidth: '',
  labelPosition: 'top',
  inline: false,
  disabled: false,
  columns: 1,
  // 设计稿采用水平 16px、垂直 12px 的紧凑表单节奏。
  rowGap: 12,
  scrollToError: false,
})

const formRef = ref<FormInstance>()
const formRootRef = ref<HTMLElement>()
const componentInstance = getCurrentInstance()

onMounted(() => {
  const root = componentInstance?.vnode.el
  if (root instanceof HTMLElement) formRootRef.value = root
})

function formRoot(): HTMLElement | undefined {
  if (formRootRef.value) return formRootRef.value
  const root = (formRef.value as FormInstance & { $el?: unknown })?.$el
  return root instanceof HTMLElement ? root : undefined
}

function focusInvalidField(): void {
  const root = formRoot()
  if (!props.scrollToError || !root) return

  const focus = () => focusFirstInvalidFormField(root)
  focus()

  // ElDialog 的 focus-trap 可能在确认事件结束时恢复按钮焦点。让首个错误
  // 字段在当前渲染帧、下一帧和事件队列末尾各尝试一次，确保 LxForm 与
  // LxDynamicForm 对键盘用户提供一致的恢复路径。
  if (typeof window !== 'undefined') {
    const requestFrame =
      typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (callback: FrameRequestCallback) => window.setTimeout(callback, 0)
    requestFrame(() => {
      focus()
      window.setTimeout(focus, 0)
    })
  }
}

const isGrid = computed(() => props.columns > 1 && !props.inline)

const gridStyle = computed(() =>
  isGrid.value
    ? {
        gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`,
        rowGap: `${props.rowGap}px`,
      }
    : undefined,
)

/**
 * 转发 FormInstance 校验能力（业务模板 ref 直接调用）：
 *   validate / validateField / resetFields / clearValidate / scrollToField
 * 典型惯用法见 demo：
 *   - 提交：formRef.value!.validate().then(submit).catch(() => lxMessage.warning(...))
 *   - 弹窗回显后清残留：nextTick(() => formRef.value?.clearValidate())
 */
const validate: LxFormInstance['validate'] = (...args) => {
  const form = formRef.value!
  const [callback] = args
  if (callback) {
    return form.validate((valid, invalidFields) => {
      if (!valid && props.scrollToError) {
        void nextTick(() => focusInvalidField())
      }
      return callback(valid, invalidFields)
    })
  }
  return form.validate().then(
    (valid) => valid,
    (invalidFields) =>
      nextTick().then(() => {
        focusInvalidField()
        return Promise.reject(invalidFields)
      }),
  )
}

defineExpose({
  validate,
  validateField: (...args: Parameters<FormInstance['validateField']>) =>
    formRef.value!.validateField(...args),
  resetFields: (...args: Parameters<FormInstance['resetFields']>) =>
    formRef.value!.resetFields(...args),
  clearValidate: (...args: Parameters<FormInstance['clearValidate']>) =>
    formRef.value!.clearValidate(...args),
  scrollToField: (...args: Parameters<FormInstance['scrollToField']>) =>
    formRef.value!.scrollToField(...args),
})
</script>

<template>
  <ElForm
    ref="formRef"
    class="lx-form"
    :class="{ 'lx-form--grid': isGrid }"
    :style="gridStyle"
    v-bind="$attrs"
    :model="model"
    :rules="rules"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :inline="inline"
    :disabled="disabled"
    :scroll-to-error="scrollToError"
  >
    <slot />
  </ElForm>
</template>
