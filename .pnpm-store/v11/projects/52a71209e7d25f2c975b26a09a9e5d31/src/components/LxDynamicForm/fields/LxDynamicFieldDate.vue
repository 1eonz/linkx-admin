<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, type LxDynamicFieldProps } from './types'
import LxDatePicker from '../../LxDatePicker/index.vue'
import type { LxDateModelValue } from '../../LxDatePicker/types'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: LxDateModelValue | undefined] }>()

const dateProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled', 'type']),
)

const dateValue = computed<LxDateModelValue | undefined>(() => {
  const value = props.value
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    value instanceof Date
  )
    return value
  if (Array.isArray(value)) {
    const values = value.filter(
      (item): item is string | number | Date =>
        typeof item === 'string' ||
        typeof item === 'number' ||
        item instanceof Date,
    )
    if (values.every((item) => typeof item === 'string'))
      return values as string[]
    if (values.every((item) => typeof item === 'number'))
      return values as number[]
    if (values.every((item) => item instanceof Date)) return values as Date[]
  }
  return undefined
})

const dateType = computed(() =>
  props.field.type === 'daterange' ? 'daterange' : 'date',
)
</script>

<template>
  <LxDatePicker
    v-bind="dateProps"
    :model-value="dateValue"
    :type="dateType"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  />
</template>
