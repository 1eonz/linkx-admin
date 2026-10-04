<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, type LxDynamicFieldProps } from './types'
import LxCheckbox from '../../LxCheckbox/index.vue'
import LxCheckboxGroup from '../../LxCheckboxGroup/index.vue'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: (string | number)[]] }>()

const checkboxProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled']),
)

const options = computed(() =>
  (props.field.options ?? []).flatMap((option) => {
    const value = option.value
    if (typeof value === 'string' || typeof value === 'number') {
      return [{ ...option, value }]
    }
    return []
  }),
)

const checkboxValue = computed<(string | number)[]>(() =>
  Array.isArray(props.value)
    ? props.value.filter(
        (item): item is string | number =>
          typeof item === 'string' || typeof item === 'number',
      )
    : [],
)
</script>

<template>
  <LxCheckboxGroup
    v-bind="checkboxProps"
    :model-value="checkboxValue"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  >
    <LxCheckbox
      v-for="option in options"
      :key="String(option.value)"
      :value="option.value"
      :disabled="option.disabled || disabled"
    >
      {{ option.label }}
    </LxCheckbox>
  </LxCheckboxGroup>
</template>
