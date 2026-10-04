<script setup lang="ts">
/**
 * LxDatePicker — 日期选择器（Element Plus el-date-picker 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 06
 *   触发器 font-mono、激活主色光环；区间连贯浅蓝带 #ecf5ff（经
 *   --el-datepicker-inrange-bg-color 变量注入 popper）。
 * 周一起始为默认契约：内置 ElConfigProvider(zh-cn) 提供日历语境
 * （dayjs zh-cn weekStart=1），文档站与宿主均不依赖全局 locale 配置。
 * popper teleport 到 body，经 popper-class 注入 lx-date-picker__popper
 * 锚定类固化区间带与面板终态，脱离全局桥不漂移。
 * disabled-date / default-value / unlink-panels 等经 $attrs 透传；
 * calendar-change / panel-change 等低频事件经 $attrs 监听器直达内核。
 * 模板绑定顺序契约：v-bind="$attrs" 在前、显式绑定在后，宿主自定义
 * popperClass 被合并进 lx-date-picker__popper 锚定类而非被丢弃。
 * 模板保持单根（无根级注释）：注释节点会引入 Fragment 根，
 * 破坏 $attrs 单根继承与测试工具对根元素类的断言。
 */
import { ElDatePicker, provideGlobalConfig } from 'element-plus'
import type { DateCell, DatePickerInstance } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {
  computed,
  getCurrentInstance,
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
provideGlobalConfig({ locale: zhCn })

withDefaults(defineProps<LxDatePickerProps>(), {
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
  size: 'md',
  name: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: LxDateModelValue]
  change: [value: LxDateModelValue]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const attrs = useAttrs()
const userPopperClass = computed(() => {
  const value = attrs.popperClass ?? attrs['popper-class']
  return typeof value === 'string' ? value : undefined
})

/** EP 内核实例引用：focus/blur 方法透传给调用方 */
const pickerRef = ref<DatePickerInstance>()
const managedDescriptionIds = new WeakMap<HTMLInputElement, Set<string>>()
const instanceClass = `lx-date-picker--instance-${getCurrentInstance()?.uid ?? 'unknown'}`

function syncInputDescriptions(): void {
  const root = pickerRef.value?.$el
  let container: HTMLElement | undefined
  if (root instanceof HTMLElement) {
    container = root
  } else {
    const parentElement = root?.parentElement
    if (parentElement instanceof HTMLElement) {
      // ElDatePicker 在部分版本以 Fragment 作为根，注释节点的父节点本身
      // 可能就是当前触发器；若不是，再在父节点内按实例标记查找，避免
      // 把说明 ID 写入同级日期选择器的输入框。
      const trigger = parentElement.classList.contains(instanceClass)
        ? parentElement
        : parentElement.querySelector<HTMLElement>(`.${instanceClass}`)
      if (trigger) container = trigger
    }
  }
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

onMounted(syncInputDescriptions)
onUpdated(syncInputDescriptions)

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
    :popper-class="['lx-date-picker__popper', userPopperClass]"
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
    @update:model-value="emit('update:modelValue', $event as LxDateModelValue)"
    @change="emit('change', $event as LxDateModelValue)"
    @focus="emit('focus', $event)"
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
