<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, stringValue, type LxDynamicFieldProps } from './types'
import LxPasswordInput from '../../LxPasswordInput/index.vue'

defineOptions({ name: 'LxDynamicFieldPassword' })

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: string] }>()

const inputProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled', 'type']),
)
</script>

<template>
  <LxPasswordInput
    v-bind="inputProps"
    :model-value="stringValue(value)"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  />
</template>
