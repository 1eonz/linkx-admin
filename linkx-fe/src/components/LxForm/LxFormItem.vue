<script setup lang="ts">
/**
 * LxFormItem — 表单项（Element Plus el-form-item 二次封装）
 * 额外能力：span 跨列（LxForm columns>1 网格内生效；'full' 通栏）
 * $attrs 全透传（labelWidth/error/showMessage/inlineMessage…），插槽原样转发（含 #error）
 */
import { ElFormItem } from 'element-plus'
import 'element-plus/es/components/form/style/css'
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

import type { LxFormItemProps } from './types'

const props = withDefaults(defineProps<LxFormItemProps>(), {
  label: '',
  prop: undefined,
  rules: undefined,
  required: undefined,
  span: 1,
})

interface FormItemInstance {
  $el: HTMLElement
}

interface AriaState {
  invalid: string | null
  required: string | null
  describedBy: string | null
  appliedDescribedBy: string | null
}

const formItemRef = ref<FormItemInstance>()
const formItemErrorId = `lx-form-item-error-${getCurrentInstance()?.uid ?? 0}`
const ariaState = new Map<HTMLElement, AriaState>()
let observer: MutationObserver | undefined

const spanStyle = computed(() => {
  if (props.span === 'full') return { gridColumn: '1 / -1' }
  if (typeof props.span === 'number' && props.span > 1)
    return { gridColumn: `span ${props.span}` }
  return undefined
})

function restoreAttribute(
  element: HTMLElement,
  name: string,
  value: string | null,
): void {
  if (value === null) {
    if (element.hasAttribute(name)) element.removeAttribute(name)
    return
  }

  // 相同值也会触发属性观察器，避免重复同步形成循环。
  if (element.getAttribute(name) !== value) element.setAttribute(name, value)
}

function originalDescriptionIds(
  control: HTMLElement,
  root: HTMLElement,
): string | null {
  const managedIds = new Set(
    Array.from(
      root.querySelectorAll<HTMLElement>(
        '.el-form-item__error, [data-lx-field-feedback]',
      ),
      (element) => element.id,
    ).filter(Boolean),
  )
  const ids = (control.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter((id) => id && id !== formItemErrorId && !managedIds.has(id))
  return ids.length ? [...new Set(ids)].join(' ') : null
}

function synchronizeFieldAccessibility(): void {
  const root = formItemRef.value?.$el
  if (!root) return

  const errorMessage = root.querySelector<HTMLElement>('.el-form-item__error')
  const invalid = root.classList.contains('is-error')
  const required = root.classList.contains('is-required')
  if (errorMessage) errorMessage.id = formItemErrorId

  const selector = [
    'input:not([type="hidden"])',
    'textarea',
    'select',
    '[role="combobox"]',
    '[role="group"]',
    '[role="radiogroup"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '.el-upload[role="button"]',
  ].join(',')
  const controls = new Set(root.querySelectorAll<HTMLElement>(selector))

  for (const [control, original] of ariaState) {
    if (controls.has(control)) continue
    restoreAttribute(control, 'aria-invalid', original.invalid)
    restoreAttribute(control, 'aria-required', original.required)
    restoreAttribute(control, 'aria-describedby', original.describedBy)
    ariaState.delete(control)
  }

  controls.forEach((control) => {
    let original = ariaState.get(control)
    if (!original && (required || invalid)) {
      const currentDescription = control.getAttribute('aria-describedby')
      original = {
        invalid: control.getAttribute('aria-invalid'),
        required: control.getAttribute('aria-required'),
        describedBy: originalDescriptionIds(control, root),
        appliedDescribedBy: currentDescription,
      }
      ariaState.set(control, original)
    }
    if (!original) return

    if (required) control.setAttribute('aria-required', 'true')
    else restoreAttribute(control, 'aria-required', original.required)

    if (invalid) control.setAttribute('aria-invalid', 'true')
    else restoreAttribute(control, 'aria-invalid', original.invalid)

    const describedBy = (control.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => id && id !== formItemErrorId)
    if (invalid && errorMessage) describedBy.push(formItemErrorId)
    if (describedBy.length) {
      const nextDescription = [...new Set(describedBy)].join(' ')
      if (control.getAttribute('aria-describedby') !== nextDescription)
        control.setAttribute('aria-describedby', nextDescription)
      original.appliedDescribedBy = nextDescription
    } else {
      restoreAttribute(control, 'aria-describedby', original.describedBy)
      original.appliedDescribedBy = original.describedBy
    }

    if (!required && !invalid) ariaState.delete(control)
  })
}

onMounted(() => {
  const root = formItemRef.value?.$el
  if (!root || typeof MutationObserver === 'undefined') return

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type !== 'attributes' ||
        mutation.attributeName !== 'aria-describedby' ||
        !(mutation.target instanceof HTMLElement)
      )
        return

      const control = mutation.target
      const original = ariaState.get(control)
      if (
        !original ||
        control.getAttribute('aria-describedby') === original.appliedDescribedBy
      )
        return

      original.describedBy = originalDescriptionIds(control, root)
    })
    synchronizeFieldAccessibility()
  })
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['aria-describedby', 'class'],
    childList: true,
    characterData: true,
    subtree: true,
  })
  synchronizeFieldAccessibility()
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <ElFormItem
    ref="formItemRef"
    class="lx-form-item"
    :label="label"
    :prop="prop"
    :rules="rules"
    :required="required"
    :style="spanStyle"
    v-bind="$attrs"
  >
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </ElFormItem>
</template>
