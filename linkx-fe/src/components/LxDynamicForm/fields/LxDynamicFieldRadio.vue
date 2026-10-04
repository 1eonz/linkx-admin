<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, type LxDynamicFieldProps } from './types'
import LxRadio from '../../LxRadio/index.vue'
import LxRadioGroup from '../../LxRadioGroup/index.vue'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{
  change: [value: string | number | boolean | undefined]
}>()

const radioProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled']),
)

const options = computed(() =>
  (props.field.options ?? []).flatMap((option) => {
    const value = option.value
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return [{ ...option, value }]
    }
    return []
  }),
)

const radioValue = computed(() =>
  typeof props.value === 'string' ||
  typeof props.value === 'number' ||
  typeof props.value === 'boolean'
    ? props.value
    : undefined,
)
</script>

<template>
  <LxRadioGroup
    v-bind="radioProps"
    :model-value="radioValue"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  >
    <LxRadio
      v-for="option in options"
      :key="String(option.value)"
      :value="option.value"
      :disabled="option.disabled || disabled"
    >
      {{ option.label }}
    </LxRadio>
  </LxRadioGroup>
</template>
