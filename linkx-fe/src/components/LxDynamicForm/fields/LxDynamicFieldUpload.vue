<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, type LxDynamicFieldProps } from './types'
import LxUpload from '../../LxUpload/index.vue'
import type { LxUploadFile } from '../../LxUpload/types'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: unknown] }>()

const uploadProps = computed(() =>
  omitFieldProps(props.field.props, ['disabled', 'multiple']),
)

const multiple = computed(() => props.field.props?.multiple === true)

function isUploadFile(value: unknown): value is LxUploadFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'uid' in value &&
    (typeof value.uid === 'string' || typeof value.uid === 'number') &&
    'name' in value &&
    typeof value.name === 'string'
  )
}

function toUploadFile(value: unknown, index: number): LxUploadFile | undefined {
  if (typeof value === 'string') {
    if (!value.trim()) return undefined
    return {
      uid: `lx-dynamic-${index}`,
      name: value.split('/').pop() || `文件${index + 1}`,
      url: value,
      status: 'success',
    }
  }
  if (isUploadFile(value)) return value
  return undefined
}

const files = computed<LxUploadFile[]>(() => {
  if (Array.isArray(props.value)) {
    return props.value
      .map((value, index) => toUploadFile(value, index))
      .filter((value): value is LxUploadFile => Boolean(value))
  }
  const file = toUploadFile(props.value, 0)
  if (file) return [file]
  return []
})

function updateFiles(nextFiles: LxUploadFile[]): void {
  emit('change', multiple.value ? nextFiles : (nextFiles[0] ?? null))
}
</script>

<template>
  <LxUpload
    v-bind="uploadProps"
    :model-value="files"
    :multiple="multiple"
    :disabled="disabled"
    @update:model-value="updateFiles"
  />
</template>
