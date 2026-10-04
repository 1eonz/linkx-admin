<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, stringValue, type LxDynamicFieldProps } from './types'
import LxTextarea from '../../LxTextarea/index.vue'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: string] }>()

const textareaProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled']),
)
</script>

<template>
  <LxTextarea
    v-bind="textareaProps"
    :model-value="stringValue(value)"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  />
</template>
