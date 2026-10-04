<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, type LxDynamicFieldProps } from './types'
import LxSelect from '../../LxSelect/index.vue'
import type {
  LxSelectModelValue,
  LxSelectOption,
  LxSelectOptionValue,
} from '../../LxSelect/types'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: unknown] }>()

const selectProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled', 'options']),
)

function isOptionValue(value: unknown): value is LxSelectOptionValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    (typeof value === 'object' && value !== null)
  )
}

const options = computed<LxSelectOption[]>(() =>
  (props.field.options ?? []).flatMap((option) =>
    isOptionValue(option.value)
      ? [
          {
            label: option.label,
            value: option.value,
            disabled: option.disabled,
          },
        ]
      : [],
  ),
)

const selectValue = computed<LxSelectModelValue | undefined>(() => {
  const value = props.value
  if (Array.isArray(value)) {
    return value.filter(isOptionValue)
  }
  if (isOptionValue(value)) {
    return value
  }
  return undefined
})
</script>

<template>
  <LxSelect
    v-bind="selectProps"
    :model-value="selectValue"
    :options="options"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  />
</template>
