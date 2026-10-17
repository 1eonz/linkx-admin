<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
} from 'vue'
import LxIcon from '../LxIcon/index.vue'
import { lxMessage } from '../LxMessage'
import type { LxCodeSlotProps } from './types'

defineOptions({ name: 'LxCodeSlot', inheritAttrs: false })

const props = withDefaults(defineProps<LxCodeSlotProps>(), {
  copyable: true,
  ellipsis: false,
})

const emit = defineEmits<{ copy: [value: string] }>()
const attrs = useAttrs()
const contentRef = ref<HTMLElement>()
const copyTitle = ref('点击复制')
const copyValue = ref('')
const normalizeAriaLabel = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''
const providedAriaLabel = ref(normalizeAriaLabel(attrs['aria-label']))
const copying = ref(false)
let mounted = true

const copyAriaLabel = computed(() => {
  if (providedAriaLabel.value) return providedAriaLabel.value
  return copyValue.value ? `复制代码：${copyValue.value}` : '点击复制代码'
})

const externallyDisabled = computed(() => {
  const value = attrs.disabled
  return value === '' || value === true || value === 'true'
})

function updateCopyTitle() {
  const value = contentRef.value?.textContent?.trim() ?? ''
  copyValue.value = value
  providedAriaLabel.value = normalizeAriaLabel(attrs['aria-label'])
  const title =
    props.ellipsis && value
      ? `${props.copyable ? '点击复制：' : '完整内容：'}${value}`
      : props.copyable
        ? '点击复制'
        : ''
  if (copyTitle.value !== title) copyTitle.value = title
}

onMounted(updateCopyTitle)
onUpdated(updateCopyTitle)

async function copy() {
  if (!props.copyable || externallyDisabled.value || copying.value) return
  const value = copyValue.value
  if (!value) {
    lxMessage.warning('暂无可复制内容')
    return
  }

  copying.value = true
  try {
    if (!navigator.clipboard) throw new Error('Clipboard API is unavailable')
    await navigator.clipboard.writeText(value)
    if (!mounted) return
    emit('copy', value)
    lxMessage.success('已复制')
  } catch {
    if (!mounted) return
    lxMessage.error('复制失败，请手动复制')
  } finally {
    if (mounted) copying.value = false
  }
}

onBeforeUnmount(() => {
  mounted = false
})
</script>

<template>
  <button
    v-if="copyable"
    class="lx-code-slot lx-code-slot--copyable"
    :class="{ 'is-ellipsis': ellipsis }"
    type="button"
    v-bind="attrs"
    :title="copying ? '正在复制' : copyTitle"
    :aria-label="copyAriaLabel"
    :aria-busy="copying"
    :disabled="externallyDisabled || copying"
    @click="copy"
  >
    <span ref="contentRef" class="lx-code-slot__content"><slot /></span>
    <LxIcon
      :name="copying ? 'loading' : 'copy'"
      :size="14"
      class="lx-code-slot__icon"
    />
  </button>
  <span
    v-else
    ref="contentRef"
    class="lx-code-slot"
    :class="{ 'is-ellipsis': ellipsis }"
    v-bind="attrs"
    :title="copyTitle || undefined"
    ><slot
  /></span>
</template>

<style scoped>
.lx-code-slot {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  gap: var(--lx-space-xs);
  padding: 2px 6px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-color-info-light);
  color: var(--lx-text-regular);
  font-family: var(--lx-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 18px;
}

.lx-code-slot--copyable {
  cursor: pointer;
  transition:
    color var(--lx-transition),
    border-color var(--lx-transition),
    background-color var(--lx-transition);
}

.lx-code-slot--copyable:hover {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-code-slot--copyable:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-code-slot--copyable:disabled {
  cursor: wait;
  opacity: 0.72;
}

.lx-code-slot__content {
  min-width: 0;
}

.lx-code-slot.is-ellipsis .lx-code-slot__content {
  width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-code-slot__icon {
  flex-shrink: 0;
  opacity: 0.72;
}

@media (prefers-reduced-motion: reduce) {
  .lx-code-slot--copyable {
    transition: none;
  }
}

@media (max-width: 640px) {
  .lx-code-slot--copyable {
    min-height: 44px;
  }
}
</style>
