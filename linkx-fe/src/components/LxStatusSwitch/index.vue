<script setup lang="ts">
/**
 * 行内启用/禁用开关：0=开启、1=关闭的旧业务值保持兼容。
 * 开关本体复用 LxSwitch（inline 文字模式），胶囊色彩/几何/焦点/触屏规格统一由
 * LxSwitch style.css 固化，本组件只保留业务值映射、确认拦截与只读 Tag。
 */
import { computed, ref, type PropType, useAttrs, watch } from 'vue'
import LxSwitch from '../LxSwitch/index.vue'
import LxTag from '../LxTag/index.vue'
import { hasPermission } from '../../permissions'
import { lxConfirm } from '../LxConfirm'
import type { LxStatusSwitchConfirmOptions, LxStatusSwitchProps } from './types'

defineOptions({ inheritAttrs: false, name: 'LxStatusSwitch' })

const props = defineProps({
  modelValue: {
    type: [Boolean, Number] as PropType<LxStatusSwitchProps['modelValue']>,
    default: false,
  },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  permission: { type: String, default: undefined },
  fallbackTag: { type: Boolean, default: true },
  confirm: {
    type: [String, Boolean, Object] as PropType<
      NonNullable<LxStatusSwitchProps['confirm']>
    >,
    default: false,
  },
  onText: { type: String, default: '开启' },
  offText: { type: String, default: '关闭' },
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | number]
  change: [value: boolean | number]
}>()
const attrs = useAttrs()
const wrapperAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) =>
        ![
          'aria-label',
          'aria-labelledby',
          'aria-describedby',
          'aria-busy',
        ].includes(key),
    ),
  ),
)
const accessibleLabel = computed(() =>
  typeof attrs['aria-label'] === 'string'
    ? attrs['aria-label']
    : `${props.onText} / ${props.offText}`,
)
const accessibleLabelledby = computed(() =>
  typeof attrs['aria-labelledby'] === 'string'
    ? attrs['aria-labelledby']
    : undefined,
)
const accessibleDescribedby = computed(() =>
  typeof attrs['aria-describedby'] === 'string'
    ? attrs['aria-describedby']
    : undefined,
)

const isNumericModel = computed(() => typeof props.modelValue === 'number')
const isOn = computed(() =>
  isNumericModel.value ? props.modelValue === 0 : Boolean(props.modelValue),
)
const stateLabel = computed(() => (isOn.value ? props.onText : props.offText))
function hasCurrentPermission(): boolean {
  return props.permission ? hasPermission(props.permission) : true
}

const permissionAllowed = computed(hasCurrentPermission)
const showFallbackTag = computed(
  () => props.disabled || (!permissionAllowed.value && props.fallbackTag),
)
const modelVersion = ref(0)

watch(
  () => props.modelValue,
  () => {
    modelVersion.value += 1
  },
)

function businessValue(value: boolean): boolean | number {
  return isNumericModel.value ? (value ? 0 : 1) : value
}

async function beforeChange(): Promise<boolean> {
  if (props.loading || props.disabled || !permissionAllowed.value) return false
  if (!isOn.value && props.confirm) return true
  if (isOn.value && props.confirm) {
    const requestVersion = modelVersion.value
    const requestModelValue = props.modelValue
    const options: LxStatusSwitchConfirmOptions =
      typeof props.confirm === 'string'
        ? { message: props.confirm }
        : props.confirm
    const message = [
      options.message,
      options.targetEntity ? `目标实体：${options.targetEntity}` : undefined,
      options.impact ? `影响范围：${options.impact}` : undefined,
      options.audit ? `审计记录：${options.audit}` : undefined,
    ]
      .filter((item): item is string => Boolean(item))
      .join('\n')
    const confirmed = await lxConfirm({
      title: options.title ?? '确认关闭？',
      message,
      confirmText: options.confirmText ?? '确认关闭',
      cancelText: options.cancelText ?? '取消',
      danger: options.type !== 'warning',
      customClass: options.customClass,
    })
    // 确认框打开期间宿主可能已完成另一笔保存、切换账号或撤销权限；
    // 此时丢弃旧确认结果，避免异步回写覆盖最新状态。
    return (
      confirmed &&
      modelVersion.value === requestVersion &&
      props.modelValue === requestModelValue &&
      isOn.value &&
      !props.loading &&
      !props.disabled &&
      hasCurrentPermission()
    )
  }
  return true
}

function onChange(value: string | number | boolean) {
  if (!permissionAllowed.value || props.disabled || props.loading) return
  const next = businessValue(value === true)
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <span v-bind="wrapperAttrs" class="lx-status-switch">
    <LxTag
      v-if="showFallbackTag"
      class="lx-status-switch__fallback"
      type="info"
      size="small"
      aria-disabled="true"
      :aria-label="
        permissionAllowed ? `${stateLabel}（只读）` : '无权限，禁用/只读'
      "
      :aria-labelledby="accessibleLabelledby"
      :aria-describedby="accessibleDescribedby"
      >{{ permissionAllowed ? `${stateLabel}（只读）` : '禁用/只读' }}</LxTag
    >
    <LxSwitch
      v-else
      :model-value="isOn"
      :loading="loading"
      :disabled="!permissionAllowed"
      :active-text="onText"
      :inactive-text="offText"
      :before-change="beforeChange"
      :aria-busy="loading ? 'true' : undefined"
      :aria-label="accessibleLabel"
      :aria-labelledby="accessibleLabelledby"
      :aria-describedby="accessibleDescribedby"
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

.lx-status-switch__fallback {
  min-height: 20px;
}

@media (max-width: 480px) {
  .lx-status-switch {
    min-height: 44px;
  }
}
</style>
