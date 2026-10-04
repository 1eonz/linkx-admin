<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue'
import { useFormDisabled } from 'element-plus'
import LxInput from '../LxInput/index.vue'
import type { LxInputSize } from '../LxInput/types'
import type { InputInstance } from 'element-plus'
import type { LxPasswordInputProps } from './types'
import LxIcon from '../LxIcon/index.vue'

defineOptions({ inheritAttrs: false, name: 'LxPasswordInput' })

const props = withDefaults(defineProps<LxPasswordInputProps>(), {
  modelValue: '',
  placeholder: '',
  // 保持 undefined，让 ElForm/LxForm 的禁用态通过 Element Plus 上下文继承；
  // 显式传 true/false 时仍由宿主覆盖。
  disabled: undefined,
  clearable: false,
  showPassword: true,
  preventClipboard: false,
  maxlength: undefined,
  minlength: undefined,
  size: 'md',
  autocomplete: 'off',
  readonly: false,
  name: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  clear: []
}>()

const inputRef = ref<InputInstance>()
const isPasswordVisible = ref(false)
const attrs = useAttrs()
const isDisabled = useFormDisabled()
const inputSize = computed<LxInputSize>(() => {
  if (props.size === 'sm' || props.size === 'small') return 'sm'
  if (props.size === 'lg' || props.size === 'large') return 'lg'
  return 'md'
})
const maxLength = computed(() =>
  props.maxlength == null ? undefined : Number(props.maxlength),
)
const minLength = computed(() =>
  props.minlength == null ? undefined : Number(props.minlength),
)

watch(
  () => props.showPassword,
  (showPassword) => {
    if (!showPassword) isPasswordVisible.value = false
  },
  { flush: 'sync' },
)

function preventClipboard(event: ClipboardEvent) {
  if (!props.preventClipboard) return
  event.preventDefault()
}

function getForwardedAttrs() {
  // 密码框的 type 由显隐状态控制，不允许调用方透传属性覆盖遮罩。
  const forwardedAttrs = { ...attrs }
  delete forwardedAttrs.type
  return forwardedAttrs
}

function togglePasswordVisibility() {
  if (isDisabled.value) return
  isPasswordVisible.value = !isPasswordVisible.value
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select(),
})
</script>

<template>
  <LxInput
    ref="inputRef"
    class="lx-password-input"
    :model-value="props.modelValue"
    :type="isPasswordVisible ? 'text' : 'password'"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :clearable="props.clearable"
    :show-password="false"
    :maxlength="maxLength"
    :minlength="minLength"
    :size="inputSize"
    :autocomplete="props.autocomplete"
    :readonly="props.readonly"
    :name="props.name"
    v-bind="getForwardedAttrs()"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
    @clear="emit('clear')"
    @copy="preventClipboard"
    @cut="preventClipboard"
    @paste="preventClipboard"
  >
    <template v-if="props.showPassword" #suffix>
      <button
        class="lx-password-input__toggle"
        type="button"
        :disabled="isDisabled"
        :aria-label="isPasswordVisible ? '隐藏密码' : '显示密码'"
        :aria-pressed="isPasswordVisible"
        @click="togglePasswordVisibility"
      >
        <LxIcon :name="isPasswordVisible ? 'eye-off' : 'eye'" :size="16" />
      </button>
    </template>
  </LxInput>
</template>

<style scoped>
.lx-password-input {
  width: 100%;
}

:deep(.lx-password-input__toggle) {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-text-secondary-strong);
  cursor: pointer;
}

:deep(.lx-password-input__toggle:hover:not(:disabled)) {
  color: var(--lx-color-primary);
}

:deep(.lx-password-input__toggle:focus-visible) {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 1px;
}

:deep(.lx-password-input__toggle:disabled) {
  cursor: not-allowed;
}

@media (max-width: 480px) {
  :deep(.lx-password-input__toggle) {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    /* 触控区域保持 44px，负外边距抵消布局增量，让输入框外框仍对齐尺寸令牌。 */
    margin-block: calc((var(--el-input-height) - 46px) / 2);
  }

  :deep(.lx-password-input__toggle:focus-visible) {
    outline-offset: -2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.lx-password-input__toggle),
  :deep(.lx-password-input__toggle *) {
    transition: none;
  }
}
</style>
