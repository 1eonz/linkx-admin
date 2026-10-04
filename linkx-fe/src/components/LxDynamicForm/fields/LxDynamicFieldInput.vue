<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, stringValue, type LxDynamicFieldProps } from './types'
import LxInput from '../../LxInput/index.vue'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: string] }>()

const inputType = computed(() =>
  props.field.type === 'password' ? 'password' : 'text',
)
const inputProps = computed(() =>
  omitFieldProps(props.field.props, ['type', 'disabled']),
)
</script>

<template>
  <LxInput
    v-bind="inputProps"
    :model-value="stringValue(value)"
    :type="inputType"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  />
</template>
