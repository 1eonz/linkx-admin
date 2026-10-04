<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, type LxDynamicFieldProps } from './types'
import LxTreeSelect from '../../LxTreeSelect/index.vue'
import type { LxTreeSelectValue } from '../../LxTreeSelect/types'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: unknown] }>()

function isTreeValue(value: unknown): value is LxTreeSelectValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    (typeof value === 'object' && value !== null)
  )
}

const treeProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled']),
)

const treeValue = computed(() => {
  const value = props.value
  if (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }
  if (isTreeValue(value)) return value
  return undefined
})
</script>

<template>
  <LxTreeSelect
    v-bind="treeProps"
    class="lx-dynamic-tree-select"
    :model-value="treeValue"
    :disabled="disabled"
    @update:model-value="emit('change', $event)"
  />
</template>
