<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, type LxDynamicFieldProps } from './types'
import LxInputNumber from '../../LxInputNumber/index.vue'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: number | undefined] }>()

const numberProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled']),
)

const numberValue = computed(() =>
  typeof props.value === 'number' ? props.value : undefined,
)
</script>

<template>
  <LxInputNumber
    v-bind="numberProps"
    :model-value="numberValue"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  />
</template>
