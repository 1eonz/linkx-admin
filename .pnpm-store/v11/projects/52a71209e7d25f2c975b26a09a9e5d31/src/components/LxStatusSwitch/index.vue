<script setup lang="ts">
/**
 * 行内启用/禁用开关：0=开启、1=关闭的旧业务值保持兼容。
 * 开关本体复用 LxSwitch（inline 文字模式），胶囊色彩/几何/焦点/触屏规格统一由
 * LxSwitch style.css 固化，本组件只保留业务值映射、确认拦截与只读 Tag。
 */
import { computed } from 'vue'
import LxSwitch from '../LxSwitch/index.vue'
import LxTag from '../LxTag/index.vue'
import { lxConfirm } from '../LxConfirm'
import type { LxStatusSwitchProps } from './types'

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
    <LxSwitch
      v-else
      :model-value="isOn"
      :loading="loading"
      :active-text="onText"
      :inactive-text="offText"
      :before-change="beforeChange"
      :aria-label="`${onText} / ${offText}`"
      @change="onChange"
    />
  </span>
</template>

<style scoped>
/* 仅保留行内容器高度；胶囊 42×20、色彩、焦点环、触屏 44px 等规格由 LxSwitch 统一固化 */
.lx-status-switch {
  display: inline-flex;
  align-items: center;
  min-height: var(--lx-control-height);
}

@media (max-width: 480px) {
  .lx-status-switch {
    min-height: 44px;
  }
}
</style>
