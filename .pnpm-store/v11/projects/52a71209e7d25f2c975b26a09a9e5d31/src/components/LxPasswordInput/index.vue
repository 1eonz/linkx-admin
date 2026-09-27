<script setup lang="ts">
import { ref } from 'vue';
import { ElInput } from 'element-plus';
import type { InputInstance } from 'element-plus';
import type { LxPasswordInputProps } from './types';
import 'element-plus/es/components/input/style/css';

defineOptions({ inheritAttrs: false, name: 'LxPasswordInput' });

const props = withDefaults(defineProps<LxPasswordInputProps>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  clearable: false,
  showPassword: true,
  maxlength: undefined,
  minlength: undefined,
  size: '',
  autocomplete: 'off',
  readonly: false,
  name: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  clear: [];
}>();

const inputRef = ref<InputInstance>();

function preventClipboard(event: ClipboardEvent) {
  event.preventDefault();
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select(),
});
</script>

<template>
  <ElInput
    ref="inputRef"
    class="lx-password-input"
    :model-value="modelValue"
    type="password"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :show-password="showPassword"
    :maxlength="maxlength"
    :minlength="minlength"
    :size="size || undefined"
    :autocomplete="autocomplete"
    :readonly="readonly"
    :name="name"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
    @clear="emit('clear')"
    @copy="preventClipboard"
    @cut="preventClipboard"
    @paste="preventClipboard"
  />
</template>

<style scoped>
.lx-password-input {
  width: 100%;
}
</style>
