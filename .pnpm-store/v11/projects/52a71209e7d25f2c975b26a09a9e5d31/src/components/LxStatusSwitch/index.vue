<script setup lang="ts">
/** 行内启用/禁用开关：0=开启、1=关闭的旧业务值保持兼容。 */
import { computed } from 'vue'
import { ElSwitch } from 'element-plus'
import LxTag from '../LxTag/index.vue'
import { lxConfirm } from '../LxConfirm'
import type { LxStatusSwitchProps } from './types'
import 'element-plus/es/components/switch/style/css'

defineOptions({ name: 'LxStatusSwitch' })

const props = withDefaults(defineProps<LxStatusSwitchProps>(), {
  modelValue: false,
  loading: false,
  disabled: false,
  confirm: false,
  onText: '开启',
  offText: '关闭',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | number]
  change: [value: boolean | number]
}>()

const isNumericModel = computed(() => typeof props.modelValue === 'number')
const isOn = computed(() =>
  isNumericModel.value ? props.modelValue === 0 : Boolean(props.modelValue),
)
const stateLabel = computed(() => (isOn.value ? props.onText : props.offText))

function businessValue(value: boolean): boolean | number {
  return isNumericModel.value ? (value ? 0 : 1) : value
}

async function beforeChange(): Promise<boolean> {
  if (props.loading || props.disabled) return false
  if (!isOn.value && props.confirm) return true
  if (isOn.value && props.confirm) {
    return lxConfirm({
      title: '确认关闭？',
      message: props.confirm,
      confirmText: '确认关闭',
      cancelText: '取消',
      danger: true,
    })
  }
  return true
}

function onChange(value: string | number | boolean) {
  const next = businessValue(value === true)
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <span class="lx-status-switch">
    <LxTag v-if="disabled" type="info" size="small"
      >{{ stateLabel }}（只读）</LxTag
    >
    <ElSwitch
      v-else
      :model-value="isOn"
      :loading="loading"
      inline-prompt
      :active-text="onText"
      :inactive-text="offText"
      :before-change="beforeChange"
      :aria-label="`${onText} / ${offText}`"
      @change="onChange"
    />
  </span>
</template>

<style scoped>
.lx-status-switch {
  display: inline-flex;
  align-items: center;
  min-height: var(--lx-control-height);
}

.lx-status-switch :deep(.el-switch) {
  --el-switch-on-color: var(--lx-color-success);
  --el-switch-off-color: var(--lx-color-info);
  min-width: 42px;
  height: var(--lx-control-height);
  align-items: center;
}

.lx-status-switch :deep(.el-switch__core) {
  width: 42px;
  min-width: 42px;
  height: 20px;
  border-radius: 999px;
  transition: var(--lx-transition);
}

.lx-status-switch :deep(.el-switch__core .el-switch__action) {
  width: 16px;
  height: 16px;
  transition: var(--lx-transition);
}

.lx-status-switch :deep(.el-switch__input:focus-visible ~ .el-switch__core) {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-status-switch :deep(.el-switch__inner-wrapper) {
  color: var(--lx-status-switch-text);
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 480px) {
  .lx-status-switch {
    min-height: 44px;
  }

  .lx-status-switch :deep(.el-switch) {
    width: 44px;
    min-width: 44px;
    height: 44px;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lx-status-switch :deep(.el-switch__core),
  .lx-status-switch :deep(.el-switch__core .el-switch__action) {
    transition-duration: 0.01ms !important;
  }
}
</style>
