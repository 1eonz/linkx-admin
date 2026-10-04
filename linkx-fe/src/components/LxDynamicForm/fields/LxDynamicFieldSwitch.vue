<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, type LxDynamicFieldProps } from './types'
import LxSwitch from '../../LxSwitch/index.vue'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: boolean | string | number] }>()

const switchProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled']),
)

const switchValue = computed(() =>
  typeof props.value === 'boolean' ||
  typeof props.value === 'string' ||
  typeof props.value === 'number'
    ? props.value
    : false,
)
</script>

<template>
  <LxSwitch
    v-bind="switchProps"
    :model-value="switchValue"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  />
</template>
