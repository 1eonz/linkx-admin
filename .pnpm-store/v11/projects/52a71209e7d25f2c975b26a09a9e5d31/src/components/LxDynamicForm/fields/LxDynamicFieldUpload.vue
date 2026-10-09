<script setup lang="ts">
import { computed } from 'vue'

import { omitFieldProps, type LxDynamicFieldProps } from './types'
import LxUpload from '../../LxUpload/index.vue'
import type { LxUploadFile } from '../../LxUpload/types'

const props = defineProps<LxDynamicFieldProps>()
const emit = defineEmits<{ change: [value: unknown] }>()

const multiple = computed(() => props.field.props?.multiple === true)
const uploadProps = computed(() => {
  const fieldProps = omitFieldProps(props.field.props, ['disabled', 'multiple'])
  return multiple.value ? fieldProps : { ...fieldProps, limit: 1 }
})

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

function toUploadFile(
  value: unknown,
  index: number,
  usedUids: Set<string>,
): LxUploadFile | undefined {
  if (typeof value === 'string') {
    if (!value.trim()) return undefined
    const fileName = value.split(/[?#]/, 1)[0]?.split('/').pop()
    const baseUid = `lx-dynamic-${index}`
    let uid = baseUid
    let suffix = 1
    while (usedUids.has(uid)) {
      uid = `${baseUid}-${suffix}`
      suffix += 1
    }
    usedUids.add(uid)
    return {
      uid,
      name: fileName || `文件${index + 1}`,
      url: value,
      status: 'success',
    }
  }
  if (isUploadFile(value)) return value
  return undefined
}

const files = computed<LxUploadFile[]>(() => {
  const values = Array.isArray(props.value) ? props.value : [props.value]
  const usedUids = new Set(
    values.filter(isUploadFile).map((file) => String(file.uid)),
  )
  return values
    .map((value, index) => toUploadFile(value, index, usedUids))
    .filter((value): value is LxUploadFile => Boolean(value))
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
