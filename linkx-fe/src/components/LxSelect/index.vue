<script setup lang="ts">
/**
 * LxSelect — 下拉选择器（Element Plus el-select 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 02
 *   32px 触发器 + 真实 1px 边框；展开态主色边框 + 已选文字转主色 + 箭头旋转
 *   （旋转由 EP 2.14.6 原生 .el-select__caret.is-reverse 提供，无需覆写）。
 * popper 面板 teleport 到 body，组件经 popper-class 注入 lx-select__popper
 * 锚定类实现终态组件级固化（选项 32px 高 / 选中 #f5f7fa 底 + 主色 500 字重），
 * 脱离 element-theme.css 全局桥时规格不漂移。
 * 选项经默认插槽传 ElOption；低频 props（remote-method 等）经 $attrs 透传。
 * 模板绑定顺序契约：v-bind="$attrs" 在前、显式绑定在后，宿主自定义
 * popperClass 被 ['lx-select__popper', $attrs.popperClass] 合并保留而非丢弃。
 * 模板保持单根（无根级注释）：注释节点会引入 Fragment 根，
 * 破坏 $attrs 单根继承与测试工具对根元素类的断言。
 */
import { ref } from 'vue'
import { ElSelect } from 'element-plus'
import type { SelectInstance } from 'element-plus'
import type { LxSelectModelValue, LxSelectProps, LxSelectSize } from './types'
import 'element-plus/es/components/select/style/css'
import './style.css'

defineOptions({ name: 'LxSelect', inheritAttrs: false })

withDefaults(defineProps<LxSelectProps>(), {
  modelValue: undefined,
  placeholder: '',
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（表单禁用继承）
  // 才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  clearable: false,
  filterable: false,
  multiple: false,
  collapseTags: false,
  collapseTagsTooltip: false,
  loading: false,
  size: 'md',
  name: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: LxSelectModelValue]
  change: [value: LxSelectModelValue]
  clear: []
  'visible-change': [visible: boolean]
  'remove-tag': [tag: string | number | boolean]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

/** EP 内核实例引用：focus/blur 方法透传给调用方 */
const selectRef = ref<SelectInstance>()

/** 档位映射：Lx 工程档名 → EP 内核档（高度由全局令牌桥收敛 28/32/40px） */
const SIZE_MAP: Record<LxSelectSize, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
}

defineExpose({
  /** 聚焦触发器 */
  focus: () => selectRef.value?.focus(),
  /** 移除焦点 */
  blur: () => selectRef.value?.blur(),
})
</script>

<template>
  <ElSelect
    ref="selectRef"
    class="lx-select"
    :class="`lx-select--${size}`"
    v-bind="$attrs"
    :popper-class="['lx-select__popper', $attrs.popperClass]"
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :filterable="filterable"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :collapse-tags-tooltip="collapseTagsTooltip"
    :loading="loading"
    :size="SIZE_MAP[size]"
    :name="name"
    @update:model-value="
      emit('update:modelValue', $event as LxSelectModelValue)
    "
    @change="emit('change', $event as LxSelectModelValue)"
    @clear="emit('clear')"
    @visible-change="emit('visible-change', $event)"
    @remove-tag="
      // EP 类型声明 $event 为 unknown，运行时实际派发选项值，此处按选项值类型收窄
      emit('remove-tag', $event as string | number | boolean)
    "
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  >
    <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
    <template v-if="$slots.empty" #empty><slot name="empty" /></template>
    <slot />
  </ElSelect>
</template>
