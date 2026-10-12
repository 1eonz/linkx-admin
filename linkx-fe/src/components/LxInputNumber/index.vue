<script setup lang="ts">
/**
 * LxInputNumber — 数字输入器（Element Plus el-input-number 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 05
 *   默认宽 160px、值文字 mono + 600 字重左对齐、步进钮右侧垂直拆分
 *   （controlsPosition 默认 'right'，标本 05 唯一形态）。
 * 默认右侧步进按钮由 Lx 实现；窄屏切换为两个并排的 44px 触控目标。
 * controlsPosition='' 时保留 Element Plus 两侧原生步进控件。
 * value-on-clear / autocomplete 等低频 props 经 $attrs 透传。
 * 模板绑定顺序契约：v-bind="$attrs" 在前、显式绑定在后。
 * 模板保持单根（无根级注释）：注释节点会引入 Fragment 根，
 * 破坏 $attrs 单根继承与测试工具对根元素类的断言。
 */
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
} from 'vue'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElIcon, ElInputNumber } from 'element-plus'
import type { InputNumberInstance } from 'element-plus'
import type {
  LxInputNumberAlign,
  LxInputNumberProps,
  LxInputNumberSize,
} from './types'
import { syncAriaDescribedBy } from '../../utils/syncAriaDescribedBy'
import 'element-plus/es/components/input-number/style/css'
import './style.css'

defineOptions({ name: 'LxInputNumber', inheritAttrs: false })

const props = withDefaults(defineProps<LxInputNumberProps>(), {
  modelValue: undefined,
  // 边界默认值与 EP 内核对齐（-Infinity/Infinity），显式固化防升级漂移
  min: -Infinity,
  max: Infinity,
  step: 1,
  stepStrictly: false,
  precision: undefined,
  // disabled 显式 default: undefined：absent 时保持 undefined 而非被 Vue cast
  // 为 false，useFormDisabled 的 ?? 链（表单禁用继承）才不会被短路
  disabled: undefined,
  readonly: false,
  controls: true,
  // Lx 默认右侧垂直拆分（标本 05 契约；EP 原生默认 '' 两侧形态）
  controlsPosition: 'right',
  placeholder: '',
  // 值文字左对齐（标本 05 契约；EP 原生默认 'center'）。经 EP 内核
  // align prop → 根类 is-left → 原生规则 .el-input-number.is-left .el-input__inner
  align: 'left',
  size: 'md',
  name: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [currentValue: number | undefined, oldValue: number | undefined]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

/** EP 内核实例引用：focus/blur 方法透传给调用方 */
const numberRef = ref<InputNumberInstance>()
const attrs = useAttrs()
const managedDescriptionIds = new Set<string>()
const hasCustomControls = computed(
  () => props.controls && props.controlsPosition === 'right',
)
let stepperObserver: MutationObserver | undefined
let repeatDelayTimer: number | undefined
let repeatIntervalTimer: number | undefined

type StepDirection = 'increase' | 'decrease'

function syncInputAttributes(): void {
  const input = numberRef.value?.$el?.querySelector('input')
  if (!(input instanceof HTMLInputElement)) return
  for (const name of [
    'id',
    'name',
    'autocomplete',
    'aria-label',
    'aria-labelledby',
  ]) {
    const value = name === 'name' ? props.name : attrs[name]
    if (typeof value === 'string' && value.length > 0)
      input.setAttribute(name, value)
    else input.removeAttribute(name)
  }
  // 只读限制直接键入；内核仍须保留方向键步进，步进按钮按独立操作处理。
  input.readOnly = props.readonly
  syncAriaDescribedBy(input, attrs['aria-describedby'], managedDescriptionIds)
}

function isStepperDisabled(direction: StepDirection): boolean {
  const root = numberRef.value?.$el
  const value = props.modelValue
  const atBoundary =
    typeof value === 'number' &&
    (direction === 'increase' ? value >= props.max : value <= props.min)

  return (
    props.disabled === true ||
    Boolean(root?.classList.contains('is-disabled')) ||
    atBoundary
  )
}

function syncStepperAttributes(): void {
  const root = numberRef.value?.$el
  if (!root) return

  if (hasCustomControls.value) {
    const buttons = root.querySelectorAll('.lx-input-number__stepper-button')
    for (let index = 0; index < buttons.length; index += 1) {
      const candidate: unknown = buttons.item(index)
      if (!(candidate instanceof HTMLButtonElement)) continue
      const direction: StepDirection = candidate.classList.contains(
        'lx-input-number__stepper-button--increase',
      )
        ? 'increase'
        : 'decrease'
      const disabled = isStepperDisabled(direction)
      candidate.disabled = disabled
      candidate.setAttribute('aria-disabled', String(disabled))
      candidate.setAttribute('tabindex', disabled ? '-1' : '0')
    }
    return
  }

  const buttons = root.querySelectorAll(
    '.el-input-number__increase, .el-input-number__decrease',
  )
  for (let index = 0; index < buttons.length; index += 1) {
    const candidate: unknown = buttons.item(index)
    if (!(candidate instanceof HTMLElement)) continue

    const disabled =
      root.classList.contains('is-disabled') ||
      candidate.classList.contains('is-disabled')
    const label = candidate.classList.contains('el-input-number__increase')
      ? '增加数值'
      : '减少数值'

    if (candidate.getAttribute('aria-label') !== label)
      candidate.setAttribute('aria-label', label)
    if (candidate.getAttribute('aria-disabled') !== String(disabled))
      candidate.setAttribute('aria-disabled', String(disabled))
    if (candidate.getAttribute('tabindex') !== (disabled ? '-1' : '0'))
      candidate.setAttribute('tabindex', disabled ? '-1' : '0')
  }
}

function getStepperButton(target: EventTarget | null): HTMLElement | undefined {
  const root = numberRef.value?.$el
  if (!(target instanceof Element) || !root) return

  const button = target.closest<HTMLElement>(
    '.el-input-number__increase, .el-input-number__decrease',
  )
  return button && root.contains(button) ? button : undefined
}

function isSpaceKey(event: KeyboardEvent): boolean {
  return event.key === ' ' || event.key === 'Spacebar'
}

function handleStepperKeydown(event: KeyboardEvent): void {
  if (
    hasCustomControls.value ||
    !isSpaceKey(event) ||
    !getStepperButton(event.target)
  )
    return
  event.preventDefault()
}

function handleStepperKeyup(event: KeyboardEvent): void {
  if (hasCustomControls.value || !isSpaceKey(event)) return
  const button = getStepperButton(event.target)
  if (!button) return
  event.preventDefault()
  if (button.getAttribute('aria-disabled') === 'true') return

  // EP 步进指令监听 mousedown；空格键在 keyup 时合成一次按下并立即释放。
  button.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, button: 0 }),
  )
  document.dispatchEvent(
    new MouseEvent('mouseup', { bubbles: true, button: 0 }),
  )
}

function stopStepperRepeat(): void {
  if (repeatDelayTimer !== undefined) {
    window.clearTimeout(repeatDelayTimer)
    repeatDelayTimer = undefined
  }
  if (repeatIntervalTimer !== undefined) {
    window.clearInterval(repeatIntervalTimer)
    repeatIntervalTimer = undefined
  }
}

function triggerStep(direction: StepDirection): void {
  if (isStepperDisabled(direction)) return
  const input = numberRef.value?.$el?.querySelector('input')
  if (!(input instanceof HTMLInputElement)) return

  const key = direction === 'increase' ? 'ArrowUp' : 'ArrowDown'
  // 仅让内核输入节点处理步进事件，避免宿主快捷键监听器误触发。
  input.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      code: key,
      bubbles: false,
      cancelable: true,
    }),
  )
}

function startStepperRepeat(
  direction: StepDirection,
  event: PointerEvent,
): void {
  if (event.button !== 0 || isStepperDisabled(direction)) return
  stopStepperRepeat()
  triggerStep(direction)
  repeatDelayTimer = window.setTimeout(() => {
    repeatIntervalTimer = window.setInterval(() => triggerStep(direction), 100)
  }, 600)
}

function handleStepperClick(event: MouseEvent, direction: StepDirection): void {
  // 鼠标和触屏在 pointerdown 已处理；detail 为 0 时是键盘或辅助技术激活。
  if (event.detail !== 0) return
  triggerStep(direction)
}

onMounted(() => {
  syncInputAttributes()
  syncStepperAttributes()

  const root = numberRef.value?.$el
  if (!root) return
  root.addEventListener('keydown', handleStepperKeydown)
  root.addEventListener('keyup', handleStepperKeyup)
  window.addEventListener('blur', stopStepperRepeat)
  stepperObserver = new MutationObserver(syncStepperAttributes)
  stepperObserver.observe(root, {
    attributes: true,
    subtree: true,
    attributeFilter: ['class'],
  })
})

onUpdated(() => {
  syncInputAttributes()
  syncStepperAttributes()
})

onBeforeUnmount(() => {
  stopStepperRepeat()
  window.removeEventListener('blur', stopStepperRepeat)
  stepperObserver?.disconnect()
  const root = numberRef.value?.$el
  root?.removeEventListener('keydown', handleStepperKeydown)
  root?.removeEventListener('keyup', handleStepperKeyup)
})

/** 档位映射：Lx 工程档名 → EP 内核档（高度由全局令牌桥收敛 28/32/40px） */
const SIZE_MAP: Record<LxInputNumberSize, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
}

defineExpose({
  /** 聚焦输入框 */
  focus: () => numberRef.value?.focus(),
  /** 移除焦点 */
  blur: () => numberRef.value?.blur(),
})
</script>

<template>
  <ElInputNumber
    ref="numberRef"
    class="lx-input-number"
    :class="{ 'lx-input-number--custom-controls': hasCustomControls }"
    v-bind="$attrs"
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :step-strictly="stepStrictly"
    :precision="precision"
    :disabled="disabled"
    :controls="controls && !hasCustomControls"
    :controls-position="controlsPosition"
    :placeholder="placeholder"
    :align="align"
    :size="SIZE_MAP[size]"
    :name="name"
    @update:model-value="emit('update:modelValue', $event)"
    @change="
      (currentValue: number | undefined, oldValue: number | undefined) =>
        emit('change', currentValue, oldValue)
    "
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  >
    <template #suffix>
      <div
        v-if="hasCustomControls"
        class="lx-input-number__stepper"
        role="group"
        aria-label="数值步进"
      >
        <button
          type="button"
          class="lx-input-number__stepper-button lx-input-number__stepper-button--increase"
          aria-label="增加数值"
          :aria-disabled="isStepperDisabled('increase')"
          :disabled="isStepperDisabled('increase')"
          :tabindex="isStepperDisabled('increase') ? -1 : 0"
          @pointerdown="startStepperRepeat('increase', $event)"
          @pointerup="stopStepperRepeat"
          @pointerleave="stopStepperRepeat"
          @pointercancel="stopStepperRepeat"
          @click="handleStepperClick($event, 'increase')"
        >
          <ElIcon aria-hidden="true"><ArrowUp /></ElIcon>
        </button>
        <button
          type="button"
          class="lx-input-number__stepper-button lx-input-number__stepper-button--decrease"
          aria-label="减少数值"
          :aria-disabled="isStepperDisabled('decrease')"
          :disabled="isStepperDisabled('decrease')"
          :tabindex="isStepperDisabled('decrease') ? -1 : 0"
          @pointerdown="startStepperRepeat('decrease', $event)"
          @pointerup="stopStepperRepeat"
          @pointerleave="stopStepperRepeat"
          @pointercancel="stopStepperRepeat"
          @click="handleStepperClick($event, 'decrease')"
        >
          <ElIcon aria-hidden="true"><ArrowDown /></ElIcon>
        </button>
      </div>
    </template>
  </ElInputNumber>
</template>
