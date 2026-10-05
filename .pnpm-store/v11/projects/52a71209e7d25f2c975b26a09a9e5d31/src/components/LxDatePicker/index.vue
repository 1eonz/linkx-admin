<script setup lang="ts">
/**
 * LxDatePicker — 日期选择器（Element Plus el-date-picker 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 06
 *   触发器 font-mono、激活主色光环；区间连贯浅蓝带 #ecf5ff（经
 *   --el-datepicker-inrange-bg-color 变量注入 popper）。
 * 周一起始为默认契约：注册 Day.js zh-cn 数据，并通过组件局部 locale
 * 提供日历文案与周首，不修改宿主 Day.js 全局 locale。
 * popper teleport 到 body，经 popper-class 注入 lx-date-picker__popper
 * 锚定类固化区间带与面板终态，脱离全局桥不漂移。
 * disabled-date / default-value / unlink-panels 等经 $attrs 透传；
 * calendar-change / panel-change 等低频事件经 $attrs 监听器直达内核。
 * 模板绑定顺序契约：v-bind="$attrs" 在前、显式绑定在后，宿主自定义
 * popperClass 被合并进 lx-date-picker__popper 锚定类而非被丢弃。
 * 模板保持单根（无根级注释）：注释节点会引入 Fragment 根，
 * 破坏 $attrs 单根继承与测试工具对根元素类的断言。
 */
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { ElDatePicker, provideGlobalConfig } from 'element-plus'
import type { DateCell, DatePickerInstance } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'dayjs/locale/zh-cn'
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
} from 'vue'

import type {
  LxDatePickerSize,
  LxDateModelValue,
  LxDatePickerProps,
} from './types'
import { syncAriaDescribedBy } from '../../utils/syncAriaDescribedBy'
import 'element-plus/es/components/date-picker/style/css'
import './style.css'

dayjs.extend(customParseFormat)

defineOptions({ name: 'LxDatePicker', inheritAttrs: false })

defineSlots<{
  /** 日期单元格；保留 EP DateCell 原始字段与日期引用。 */
  default?: (cell: DateCell) => unknown
  'range-separator'?: () => unknown
  'prev-month'?: () => unknown
  'next-month'?: () => unknown
  'prev-year'?: () => unknown
  'next-year'?: () => unknown
  sidebar?: (scope: { class: string }) => unknown
}>()

/**
 * 注入 zh-cn 日历语境（周一起始 + 中文面板文案）。
 * 与 <ElConfigProvider :locale="zhCn"> 等价（后者 setup 内部即调用
 * provideGlobalConfig），但不经 renderSlot 引入 Fragment 根，
 * 保持模板单根以承载 $attrs 单根继承与根元素类断言。
 */
const datePickerLocale = {
  ...zhCn,
  el: {
    ...zhCn.el,
    datepicker: {
      ...zhCn.el.datepicker,
      dateTablePrompt:
        '按 ArrowDown 打开日历并进入日期网格，方向键移动日期焦点，按 Enter 选择日期，按 Escape 关闭日历',
    },
  },
}

provideGlobalConfig({ locale: datePickerLocale })

const props = withDefaults(defineProps<LxDatePickerProps>(), {
  modelValue: undefined,
  type: 'date',
  placeholder: '',
  startPlaceholder: '',
  endPlaceholder: '',
  // 区间分隔符：中文契约"至"（标本 06 闭合态；EP 原生默认 "-"）
  rangeSeparator: '至',
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（表单禁用继承）
  // 才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  readonly: false,
  clearable: true,
  format: undefined,
  valueFormat: undefined,
  shortcuts: undefined,
  popperClass: undefined,
  size: 'md',
  name: undefined,
  singlePanel: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: LxDateModelValue]
  change: [value: LxDateModelValue]
  'visible-change': [visible: boolean]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const attrs = useAttrs()

/** EP 内核实例引用：focus/blur 方法透传给调用方 */
const pickerRef = ref<DatePickerInstance>()
const managedDescriptionIds = new WeakMap<HTMLInputElement, Set<string>>()
const instanceClass = `lx-date-picker--instance-${getCurrentInstance()?.uid ?? 'unknown'}`
const instancePopperClass = `lx-date-picker__popper--instance-${getCurrentInstance()?.uid ?? 'unknown'}`
const viewportFitClass = 'lx-date-picker__popper--viewport-fit'
const isNarrowViewport = ref(false)
const singlePanel = computed(() => props.singlePanel ?? isNarrowViewport.value)
let viewportQuery: MediaQueryList | undefined
let viewportFitFrame: number | undefined

function updateViewportMode(): void {
  isNarrowViewport.value = viewportQuery?.matches ?? window.innerWidth <= 640
  if (!isNarrowViewport.value) {
    getPickerPopper()?.classList.remove(viewportFitClass)
    return
  }

  scheduleViewportFit()
}

function getPickerContainer(): HTMLElement | undefined {
  const root = pickerRef.value?.$el
  if (root instanceof HTMLElement) return root

  const parentElement = root?.parentElement
  if (!(parentElement instanceof HTMLElement)) return undefined

  // ElDatePicker 在部分版本以 Fragment 作为根，注释节点的父节点本身
  // 可能就是当前触发器；若不是，再在父节点内按实例标记查找。
  return parentElement.classList.contains(instanceClass)
    ? parentElement
    : (parentElement.querySelector<HTMLElement>(`.${instanceClass}`) ??
        undefined)
}

function syncInputDescriptions(): void {
  const container = getPickerContainer()
  if (!container) return

  container.querySelectorAll('input').forEach((input) => {
    let managedIds = managedDescriptionIds.get(input)
    if (!managedIds) {
      managedIds = new Set<string>()
      managedDescriptionIds.set(input, managedIds)
    }
    syncAriaDescribedBy(input, attrs['aria-describedby'], managedIds)
  })
}

let rangeFocusFrame: number | undefined
let focusedRangeInput: HTMLInputElement | undefined

function getVisiblePopper(): HTMLElement | undefined {
  return (
    document.querySelector<HTMLElement>(
      `.${instancePopperClass}[aria-hidden="false"]`,
    ) ?? undefined
  )
}

function getPickerPopper(): HTMLElement | undefined {
  return (
    document.querySelector<HTMLElement>(`.${instancePopperClass}`) ?? undefined
  )
}

function syncViewportFit(): void {
  const popper = getVisiblePopper()
  if (!popper) return

  popper.classList.remove(viewportFitClass)
  // 等待 Element Plus 根据新视口完成弹层翻转后，再判断锚点位置是否仍越界。
  viewportFitFrame = window.requestAnimationFrame(() => {
    viewportFitFrame = undefined
    const currentPopper = getVisiblePopper()
    if (!currentPopper) return

    const { top, bottom } = currentPopper.getBoundingClientRect()
    const overflowsViewport = top < 8 || bottom > window.innerHeight - 8
    if (isNarrowViewport.value && overflowsViewport) {
      currentPopper.classList.add(viewportFitClass)
    }
  })
}

function scheduleViewportFit(): void {
  if (viewportFitFrame !== undefined) {
    window.cancelAnimationFrame(viewportFitFrame)
  }

  viewportFitFrame = window.requestAnimationFrame(() => {
    viewportFitFrame = undefined
    syncViewportFit()
  })
}

function handlePickerVisibleChange(visible: boolean): void {
  emit('visible-change', visible)
  if (visible) {
    scheduleViewportFit()
  }
}

function getRangeEndpointDate(isEndInput: boolean) {
  if (!Array.isArray(props.modelValue)) return undefined

  const value = props.modelValue[isEndInput ? 1 : 0]
  if (value === undefined) return undefined

  const date =
    typeof value === 'string' && props.valueFormat
      ? dayjs(value, props.valueFormat, true)
      : dayjs(value)

  return date.isValid() ? date : undefined
}

function getPanelMonth(
  panel: HTMLElement,
): { year: number; month: number } | undefined {
  const labels = panel.querySelectorAll<HTMLElement>(
    '.el-date-range-picker__header-label',
  )
  const year = Number(labels[0]?.textContent?.match(/\d+/)?.[0])
  const month = Number(labels[1]?.textContent?.match(/\d+/)?.[0])
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return undefined
  }
  return { year, month }
}

async function showEndpointMonth(
  panel: HTMLElement,
  endpointDate: dayjs.Dayjs,
  popper: HTMLElement,
  input: HTMLInputElement,
): Promise<void> {
  const visibleMonth = getPanelMonth(panel)
  if (!visibleMonth) return

  const monthDifference =
    (endpointDate.year() - visibleMonth.year) * 12 +
    endpointDate.month() +
    1 -
    visibleMonth.month
  if (monthDifference === 0) return

  const direction = monthDifference > 0 ? 1 : -1
  const yearSteps = Math.trunc(monthDifference / 12)
  const monthSteps = monthDifference - yearSteps * 12
  const navigation = [
    ...Array.from({ length: Math.abs(yearSteps) }, () => ({
      direction: Math.sign(yearSteps),
      unit: 'year',
    })),
    ...Array.from({ length: Math.abs(monthSteps) }, () => ({
      direction,
      unit: 'month',
    })),
  ]

  for (const step of navigation) {
    if (!input.isConnected || getVisiblePopper() !== popper) return

    const label =
      step.unit === 'year'
        ? step.direction > 0
          ? '后一年'
          : '前一年'
        : step.direction > 0
          ? '下个月'
          : '上个月'
    const button = panel.querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]`,
    )
    if (!button || button.disabled) return

    button.click()
    await nextTick()
  }
}

async function focusRangeDate(input: HTMLInputElement): Promise<void> {
  const popper = getVisiblePopper()
  if (!popper) return

  const container = getPickerContainer()
  const inputs =
    container?.querySelectorAll<HTMLInputElement>('.el-range-input')
  const isEndInput = inputs?.item(1) === input
  const panels = Array.from(
    popper.querySelectorAll<HTMLElement>('.el-date-range-picker__content'),
  ).filter((candidate) => candidate.getClientRects().length > 0)
  let panel =
    panels.find((candidate) =>
      candidate.querySelector(`td.${isEndInput ? 'end-date' : 'start-date'}`),
    ) ??
    (!singlePanel.value && isEndInput
      ? panels.find((candidate) => candidate.classList.contains('is-right'))
      : panels.find((candidate) => candidate.classList.contains('is-left'))) ??
    panels[0] ??
    popper
  const endpointSelector = isEndInput ? 'td.end-date' : 'td.start-date'

  if (
    isEndInput &&
    singlePanel.value &&
    !panel.querySelector(endpointSelector)
  ) {
    const endpointDate = getRangeEndpointDate(true)
    if (endpointDate) {
      await showEndpointMonth(panel, endpointDate, popper, input)
      panel =
        Array.from(
          popper.querySelectorAll<HTMLElement>(
            '.el-date-range-picker__content',
          ),
        ).find((candidate) => candidate.getClientRects().length > 0) ?? panel
    }
  }

  const cell =
    panel.querySelector<HTMLElement>(`${endpointSelector}:not(.disabled)`) ??
    panel.querySelector<HTMLElement>('td.available:not(.disabled)')

  if (cell && !cell.hasAttribute('tabindex')) {
    cell.tabIndex = -1
  }
  cell?.focus()
}

function handleDateRangeKeydown(event: KeyboardEvent): void {
  if (props.type !== 'daterange' && props.type !== 'datetimerange') return

  const eventTarget = event.target
  const container = getPickerContainer()
  if (
    eventTarget instanceof HTMLInputElement &&
    eventTarget.classList.contains('el-range-input') &&
    container?.contains(eventTarget)
  ) {
    if (event.key !== 'ArrowDown') return

    focusedRangeInput = eventTarget
    if (rangeFocusFrame !== undefined) {
      window.cancelAnimationFrame(rangeFocusFrame)
    }
    rangeFocusFrame = window.requestAnimationFrame(() => {
      rangeFocusFrame = undefined
      void focusRangeDate(eventTarget)
    })
    return
  }

  const popper = getVisiblePopper()
  const table =
    eventTarget instanceof HTMLElement
      ? eventTarget.closest<HTMLTableElement>('.el-date-table')
      : null
  if (!popper || !table || !popper.contains(table)) return

  const currentCell =
    eventTarget instanceof HTMLElement
      ? eventTarget.closest<HTMLTableCellElement>('td')
      : null
  if (!currentCell) return

  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    pickerRef.value?.handleClose()
    focusedRangeInput?.focus()
    return
  }

  const movement: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
  }
  const step = movement[event.key]
  if (step !== undefined) {
    event.preventDefault()
    event.stopPropagation()

    const cells = Array.from(table.querySelectorAll<HTMLTableCellElement>('td'))
    const currentIndex = cells.indexOf(currentCell)
    const stride = Math.abs(step) === 7 ? step : Math.sign(step)
    for (
      let targetIndex = currentIndex + step;
      targetIndex >= 0 && targetIndex < cells.length;
      targetIndex += stride
    ) {
      const targetCell = cells[targetIndex]
      if (
        targetCell.classList.contains('disabled') ||
        targetCell.classList.contains('week')
      ) {
        continue
      }
      targetCell.focus()
      break
    }
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
    currentCell.click()
  }
}

onMounted(() => {
  syncInputDescriptions()
  document.addEventListener('keydown', handleDateRangeKeydown, true)
  const query =
    typeof window.matchMedia === 'function'
      ? (window.matchMedia('(max-width: 640px)') ?? undefined)
      : undefined
  viewportQuery = query
  updateViewportMode()

  if (query && typeof query.addEventListener === 'function') {
    query.addEventListener('change', updateViewportMode)
    stopViewportTracking = () =>
      query.removeEventListener('change', updateViewportMode)
  }

  window.addEventListener('resize', updateViewportMode)
  const stopResizeTracking = () =>
    window.removeEventListener('resize', updateViewportMode)
  const stopMediaQueryTracking = stopViewportTracking
  stopViewportTracking = () => {
    stopResizeTracking()
    stopMediaQueryTracking?.()
  }
})

let stopViewportTracking: (() => void) | undefined

onBeforeUnmount(() => {
  stopViewportTracking?.()
  document.removeEventListener('keydown', handleDateRangeKeydown, true)
  focusedRangeInput = undefined
  if (rangeFocusFrame !== undefined) {
    window.cancelAnimationFrame(rangeFocusFrame)
  }
  if (viewportFitFrame !== undefined) {
    window.cancelAnimationFrame(viewportFitFrame)
  }
})

onUpdated(syncInputDescriptions)

function handlePickerFocus(event: FocusEvent): void {
  const target = event.target
  if (
    target instanceof HTMLInputElement &&
    target.classList.contains('el-range-input') &&
    getPickerContainer()?.contains(target)
  ) {
    focusedRangeInput = target
  }
  emit('focus', event)
}

/** 档位映射：Lx 工程档名 → EP 内核档（高度由全局令牌桥收敛 28/32/40px） */
const SIZE_MAP: Record<LxDatePickerSize, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
}

defineExpose({
  /** 聚焦触发器 */
  focus: () => pickerRef.value?.focus(),
  /** 移除焦点 */
  blur: () => pickerRef.value?.blur(),
})
</script>

<template>
  <ElDatePicker
    ref="pickerRef"
    class="lx-date-picker"
    :class="[`lx-date-picker--${size}`, instanceClass]"
    v-bind="$attrs"
    :popper-class="[
      'lx-date-picker__popper',
      instancePopperClass,
      props.popperClass,
    ]"
    :model-value="modelValue"
    :type="type"
    :placeholder="placeholder"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :range-separator="rangeSeparator"
    :disabled="disabled"
    :readonly="readonly"
    :clearable="clearable"
    :format="format"
    :value-format="valueFormat"
    :shortcuts="shortcuts"
    :size="SIZE_MAP[size]"
    :name="name"
    :single-panel="singlePanel"
    @update:model-value="emit('update:modelValue', $event as LxDateModelValue)"
    @change="emit('change', $event as LxDateModelValue)"
    @visible-change="handlePickerVisibleChange"
    @focus="handlePickerFocus"
    @blur="emit('blur', $event)"
  >
    <template v-if="$slots.default" #default="cell">
      <slot v-bind="cell" />
    </template>
    <template v-if="$slots['range-separator']" #range-separator>
      <slot name="range-separator" />
    </template>
    <template v-if="$slots['prev-month']" #prev-month>
      <slot name="prev-month" />
    </template>
    <template v-if="$slots['next-month']" #next-month>
      <slot name="next-month" />
    </template>
    <template v-if="$slots['prev-year']" #prev-year>
      <slot name="prev-year" />
    </template>
    <template v-if="$slots['next-year']" #next-year>
      <slot name="next-year" />
    </template>
    <template v-if="$slots.sidebar" #sidebar="scope">
      <slot name="sidebar" v-bind="scope" />
    </template>
  </ElDatePicker>
</template>
