<script setup lang="ts">
import { computed } from 'vue'

import {
  isDateRangeValue,
  omitFieldProps,
  type LxDynamicDateRangeValue,
  type LxDynamicFieldProps,
} from './types'
import LxDatePicker from '../../LxDatePicker/index.vue'
import type { LxDateModelValue } from '../../LxDatePicker/types'

defineOptions({ name: 'LxDynamicFieldDateRange' })

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: LxDateModelValue] }>()

const dateProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled', 'type']),
)

const dateRangeValue = computed<LxDynamicDateRangeValue | undefined>(() =>
  isDateRangeValue(
    props.value,
    typeof props.field.props?.valueFormat === 'string'
      ? props.field.props.valueFormat
      : undefined,
  )
    ? props.value
    : undefined,
)
</script>

<template>
  <LxDatePicker
    v-bind="dateProps"
    :model-value="dateRangeValue"
    type="daterange"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  />
</template>
