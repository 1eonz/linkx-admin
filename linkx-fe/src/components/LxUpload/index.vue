<script setup lang="ts">
/** 上传界面只处理前端校验与状态展示，网络传输由 Element Plus 或业务侧配置负责。 */
import { computed, ref } from 'vue'
import { ElUpload } from 'element-plus'
import type {
  UploadFile,
  UploadFiles,
  UploadInstance,
  UploadProgressEvent,
  UploadRawFile,
  UploadRequestHandler,
  UploadRequestOptions,
  UploadStatus,
  UploadUserFile,
} from 'element-plus'
import LxIcon from '../LxIcon/index.vue'
import { lxMessage } from '../LxMessage'
import type { LxUploadFile, LxUploadProps } from './types'
import 'element-plus/es/components/upload/style/css'

defineOptions({ name: 'LxUpload' })

const props = withDefaults(defineProps<LxUploadProps>(), {
  modelValue: () => [],
  action: '',
  accept: '',
  limit: undefined,
  maxSize: undefined,
  draggable: true,
  drag: undefined,
  autoUpload: false,
  disabled: false,
  multiple: false,
  listType: 'standard-rows',
  chunkSize: 1024,
  httpRequest: undefined,
  headers: () => ({}),
  name: 'file',
  withCredentials: false,
})

const emit = defineEmits<{
  'update:modelValue': [files: LxUploadFile[]]
  success: [file: LxUploadFile]
  error: [file: LxUploadFile, error: Error]
  exceed: [files: File[]]
  change: [file: LxUploadFile, files: LxUploadFile[]]
  progress: [file: LxUploadFile, files: LxUploadFile[]]
  remove: [file: LxUploadFile]
}>()

const uploadRef = ref<UploadInstance>()
const announcement = ref('')
const uploadErrors = ref<Record<number, string>>({})
const draggable = computed(() => props.drag ?? props.draggable)

function recordOf(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined
}

function stableUid(
  value: unknown,
  index: number,
  name: string,
  size?: number,
): number {
  const record = recordOf(value)
  if (typeof record?.uid === 'number') return record.uid

  const seed =
    typeof record?.uid === 'string'
      ? record.uid
      : `${name}:${size ?? 0}:${index}`
  let hash = 2166136261
  for (const character of seed)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  return hash >>> 0
}

function isUploadRawFile(value: unknown): value is UploadRawFile {
  if (typeof File === 'undefined' || !(value instanceof File)) return false
  return typeof (value as File & { uid?: unknown }).uid === 'number'
}

function uploadStatus(status: unknown): UploadStatus {
  if (status === 'uploading' || status === 'success' || status === 'fail')
    return status
  return 'ready'
}

function toUploadUserFile(
  value: unknown,
  index: number,
): UploadUserFile | undefined {
  if (typeof File !== 'undefined' && value instanceof File) {
    return {
      uid: stableUid(value, index, value.name, value.size),
      name: value.name || '未命名文件',
      size: value.size,
      status: 'ready',
    }
  }

  const record = recordOf(value)
  if (!record || typeof record.name !== 'string') return undefined

  const name = record.name || '未命名文件'
  const size = typeof record.size === 'number' ? record.size : undefined
  const rawStatus = record.status === 'error' ? 'fail' : record.status
  return {
    uid: stableUid(value, index, name, size),
    name,
    size,
    status: uploadStatus(rawStatus),
    percentage:
      typeof record.percentage === 'number' ? record.percentage : undefined,
    raw: isUploadRawFile(record.raw) ? record.raw : undefined,
    url: typeof record.url === 'string' ? record.url : undefined,
  }
}

const files = computed<UploadUserFile[]>(() =>
  props.modelValue
    .map(toUploadUserFile)
    .filter((file): file is UploadUserFile => file !== undefined),
)

const requestHandler = computed<UploadRequestHandler | undefined>(() => {
  if (!props.httpRequest) return undefined
  const handler = props.httpRequest
  return (options: UploadRequestOptions) =>
    handler({ ...options, chunkSize: Math.max(1, Math.floor(props.chunkSize)) })
})

function toLxFiles(source: UploadFiles): LxUploadFile[] {
  return source.map((file) => ({
    uid: file.uid,
    name: file.name,
    size: file.size,
    type: file.raw?.type,
    status: file.status === 'fail' ? 'error' : file.status,
    percentage: file.percentage,
    raw: file.raw,
  }))
}

function accepted(raw: UploadRawFile): boolean {
  if (!props.accept) return true
  const candidates = props.accept
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  if (!candidates.length) return true
  const fileName = raw.name.toLowerCase()
  const mime = raw.type.toLowerCase()
  return candidates.some((candidate) => {
    if (candidate.startsWith('.')) return fileName.endsWith(candidate)
    if (candidate.endsWith('/*')) return mime.startsWith(candidate.slice(0, -1))
    return mime === candidate
  })
}

function beforeUpload(raw: UploadRawFile): boolean {
  if (!props.httpRequest && !props.action) {
    lxMessage.error('请先配置上传地址或上传处理函数')
    return false
  }
  if (!accepted(raw)) {
    lxMessage.error(`文件格式不符合要求：${props.accept}`)
    return false
  }
  if (props.maxSize && raw.size > props.maxSize * 1024 * 1024) {
    lxMessage.error(`单个文件不能超过 ${props.maxSize}MB`)
    return false
  }
  return true
}

function onChange(file: UploadFile, list: UploadFiles) {
  const next = toLxFiles(list)
  emit('update:modelValue', next)
  emit('change', toLxFiles([file])[0], next)
}

function onProgress(
  event: UploadProgressEvent,
  file: UploadFile,
  list: UploadFiles,
) {
  const progressFile: LxUploadFile = {
    ...toLxFiles([file])[0],
    status: 'uploading',
    percentage: Math.round(event.percent),
  }
  const next = toLxFiles(list)
  const index = next.findIndex((item) => item.uid === file.uid)
  if (index === -1) next.push(progressFile)
  else next[index] = progressFile
  emit('update:modelValue', next)
  emit('progress', progressFile, next)
}

function onSuccess(_: unknown, file: UploadFile, list: UploadFiles) {
  delete uploadErrors.value[file.uid]
  const uploaded = toLxFiles([file])[0]
  const next = toLxFiles(list)
  const index = next.findIndex((item) => item.uid === file.uid)
  if (index === -1) next.push(uploaded)
  else next[index] = uploaded
  emit('update:modelValue', next)
  announcement.value = `${uploaded.name} 上传成功`
  emit('success', uploaded)
}

function onError(error: Error, file: UploadFile, list: UploadFiles) {
  uploadErrors.value = {
    ...uploadErrors.value,
    [file.uid]: error.message || '上传失败',
  }
  const failed = { ...toLxFiles([file])[0], error }
  const next = toLxFiles(list)
  const index = next.findIndex((item) => item.uid === file.uid)
  if (index === -1) next.push(failed)
  else next[index] = failed
  emit('update:modelValue', next)
  announcement.value = `${failed.name} 上传失败，可重试`
  emit('error', failed, error)
}

function onRemove(file: UploadFile, list: UploadFiles) {
  const next = toLxFiles(list)
  delete uploadErrors.value[file.uid]
  emit('update:modelValue', next)
  const removed = toLxFiles([file])[0]
  announcement.value = `${removed.name} 已移除`
  emit('remove', removed)
}

function onExceed(rawFiles: File[]) {
  emit('exceed', rawFiles)
  lxMessage.warning(
    props.limit ? `最多可选择 ${props.limit} 个文件` : '文件数量超过限制',
  )
}

function toUploadFile(file: UploadUserFile): UploadFile {
  return {
    uid: file.uid ?? stableUid(file, 0, file.name, file.size),
    name: file.name,
    status: file.status ?? 'ready',
    size: file.size,
    percentage: file.percentage,
    raw: file.raw,
    url: file.url,
  }
}

function remove(file: UploadUserFile) {
  if (props.disabled) return
  uploadRef.value?.handleRemove(toUploadFile(file))
}

function retry(file: UploadUserFile) {
  if (!file.raw || props.disabled) return
  delete uploadErrors.value[file.uid ?? -1]
  uploadRef.value?.handleRemove(toUploadFile(file))
  uploadRef.value?.handleStart(file.raw)
  uploadRef.value?.submit()
}

function statusText(file: UploadUserFile): string {
  if (file.status === 'uploading') return '上传中'
  if (file.status === 'success') return '上传成功'
  if (file.status === 'fail') return '上传失败'
  return '等待上传'
}

function statusIcon(file: UploadUserFile): string {
  if (file.status === 'uploading') return 'loading'
  if (file.status === 'success') return 'check'
  if (file.status === 'fail') return 'alert'
  return 'clock'
}

function progressPercent(file: UploadUserFile): number {
  return Math.min(100, Math.max(0, Math.round(file.percentage ?? 0)))
}

function errorText(file: UploadUserFile): string {
  return uploadErrors.value[file.uid ?? -1] ?? '上传失败，可重试'
}

function fileSize(size?: number): string {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function submit() {
  if (!props.disabled) uploadRef.value?.submit()
}

function clearFiles() {
  if (props.disabled) return
  uploadRef.value?.clearFiles()
  emit('update:modelValue', [])
  announcement.value = '文件列表已清空'
}

function abort(file?: LxUploadFile) {
  if (!file) {
    uploadRef.value?.abort()
    return
  }
  const target = files.value.find(
    (item) => String(item.uid) === String(file.uid),
  )
  if (target) uploadRef.value?.abort(toUploadFile(target))
}

// 公开方法与受控列表保持一致；禁用态不触发提交或清空。
defineExpose({
  submit,
  abort,
  clearFiles,
})
</script>

<template>
  <div class="lx-upload" :class="{ 'is-disabled': disabled }">
    <ElUpload
      ref="uploadRef"
      class="lx-upload__trigger"
      :action="action"
      :accept="accept || undefined"
      :limit="limit"
      :disabled="disabled"
      :multiple="multiple"
      :auto-upload="autoUpload"
      :drag="draggable"
      :show-file-list="false"
      :file-list="files"
      :headers="headers"
      :name="name"
      :with-credentials="withCredentials"
      :http-request="requestHandler"
      :before-upload="beforeUpload"
      :on-change="onChange"
      :on-progress="onProgress"
      :on-success="onSuccess"
      :on-error="onError"
      :on-remove="onRemove"
      :on-exceed="onExceed"
    >
      <template v-if="draggable">
        <div class="lx-upload__dropzone">
          <span class="lx-upload__drop-icon"
            ><LxIcon name="upload" :size="28"
          /></span>
          <p class="lx-upload__title">点击或拖拽文件到此处上传</p>
          <p class="lx-upload__hint">
            <template v-if="accept">支持扩展名：{{ accept }}</template>
            <template v-else>支持常见文件格式</template>
            <template v-if="maxSize">，单文件不超过 {{ maxSize }}MB</template>
          </p>
        </div>
      </template>
      <template v-else>
        <span class="lx-upload__button">
          <LxIcon name="upload" :size="16" />
          选择文件
        </span>
      </template>
    </ElUpload>

    <ul
      v-if="files.length"
      class="lx-upload__list"
      :class="{
        'lx-upload__list--compact-chips': listType === 'compact-chips',
      }"
      aria-label="已选文件"
    >
      <li
        v-for="file in files"
        :key="String(file.uid)"
        class="lx-upload__file"
        :class="`is-${file.status ?? 'ready'}`"
      >
        <span
          class="lx-upload__file-icon"
          :class="`is-${file.status ?? 'ready'}`"
        >
          <LxIcon
            :name="statusIcon(file)"
            :spin="file.status === 'uploading'"
            :size="18"
          />
        </span>
        <div class="lx-upload__file-main">
          <div class="lx-upload__file-heading">
            <span class="lx-upload__file-name" :title="file.name">{{
              file.name
            }}</span>
            <span
              class="lx-upload__file-status"
              :class="`is-${file.status ?? 'ready'}`"
            >
              {{ statusText(file) }}
            </span>
            <span
              v-if="file.status === 'uploading'"
              class="lx-upload__file-percentage"
            >
              {{ progressPercent(file) }}%
            </span>
          </div>
          <div
            v-if="file.status === 'uploading'"
            class="lx-upload__progress-track"
            role="progressbar"
            :aria-label="`${file.name} 上传进度`"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="progressPercent(file)"
          >
            <span
              class="lx-upload__progress-value"
              :style="{ '--lx-upload-progress': progressPercent(file) / 100 }"
            />
          </div>
          <div class="lx-upload__file-meta">
            <span v-if="file.size != null">{{ fileSize(file.size) }}</span>
            <span v-if="file.status === 'fail'" class="lx-upload__file-error">
              {{ errorText(file) }}
            </span>
            <span v-else>{{ statusText(file) }}</span>
          </div>
        </div>
        <div class="lx-upload__file-actions">
          <button
            v-if="file.status === 'fail' && file.raw"
            class="lx-upload__retry"
            type="button"
            :disabled="disabled"
            @click="retry(file)"
          >
            重新上传
          </button>
          <button
            class="lx-upload__remove"
            type="button"
            :aria-label="`${file.status === 'uploading' ? '取消并移除' : '移除'} ${file.name}`"
            :disabled="disabled"
            @click="remove(file)"
          >
            <LxIcon name="x" :size="14" />
          </button>
        </div>
      </li>
    </ul>
    <span class="lx-upload__announcement" role="status" aria-live="polite">{{
      announcement
    }}</span>
  </div>
</template>

<style scoped>
.lx-upload {
  display: grid;
  gap: var(--lx-space-sm);
  min-width: 0;
}

.lx-upload__trigger,
.lx-upload__trigger :deep(.el-upload),
.lx-upload__trigger :deep(.el-upload-dragger) {
  width: 100%;
}

.lx-upload__trigger :deep(.el-upload-dragger) {
  height: 120px;
  overflow: hidden;
  border: 2px dashed var(--lx-border);
  border-radius: var(--lx-radius-lg);
  background: var(--lx-bg-card);
  transition:
    border-color var(--lx-transition),
    background-color var(--lx-transition);
}

.lx-upload__trigger :deep(.el-upload-dragger:hover),
.lx-upload__trigger :deep(.el-upload-dragger.is-dragover) {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary-light);
}

.lx-upload__trigger :deep(.el-upload-dragger:focus-visible),
.lx-upload__trigger :deep(.el-upload:focus-visible) {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-upload__dropzone {
  display: grid;
  height: 100%;
  place-content: center;
  justify-items: center;
  gap: var(--lx-space-xs);
}

.lx-upload__drop-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lx-color-primary);
}

.lx-upload__title,
.lx-upload__hint {
  margin: 0;
}

.lx-upload__title {
  color: var(--lx-text-primary);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.lx-upload__hint {
  color: var(--lx-text-secondary);
  font-size: 12px;
  line-height: 18px;
}

.lx-upload__button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: var(--lx-space-xs);
  padding: 0 var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-upload__list {
  display: grid;
  overflow: hidden;
  margin: 0;
  padding: 0;
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  list-style: none;
}

.lx-upload__file {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  min-height: 64px;
  gap: var(--lx-space-md);
  padding: var(--lx-space-md);
  border-bottom: 1px solid var(--lx-border-light);
  background: var(--lx-bg-card);
}

.lx-upload__file:last-child {
  border-bottom: 0;
}

.lx-upload__file.is-fail {
  background: var(--lx-color-error-light);
}

.lx-upload__file-icon {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: var(--lx-radius-md);
  background: var(--lx-color-info-light);
  color: var(--lx-color-info-strong);
}

.lx-upload__file-icon.is-uploading {
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-upload__file-icon.is-success {
  background: var(--lx-color-success-light);
  color: var(--lx-color-success-strong);
}

.lx-upload__file-icon.is-fail {
  background: var(--lx-color-error-light);
  color: var(--lx-color-error-strong);
}

.lx-upload__file-main {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-xs);
}

.lx-upload__file-heading,
.lx-upload__file-meta,
.lx-upload__file-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--lx-space-sm);
}

.lx-upload__file-heading {
  flex-wrap: wrap;
}

.lx-upload__file-name {
  overflow: hidden;
  min-width: 0;
  flex: 1 1 160px;
  color: var(--lx-text-regular);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-upload__file-status,
.lx-upload__file-percentage,
.lx-upload__file-meta {
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.lx-upload__file-status.is-uploading,
.lx-upload__file-percentage {
  color: var(--lx-color-primary);
}

.lx-upload__file-status.is-success {
  color: var(--lx-color-success-strong);
}

.lx-upload__file-status.is-fail,
.lx-upload__file-error {
  color: var(--lx-color-error-strong);
}

.lx-upload__file-percentage {
  font-family: var(--lx-font-mono);
  font-variant-numeric: tabular-nums;
}

.lx-upload__file-meta {
  flex-wrap: wrap;
  overflow-wrap: anywhere;
  font-size: 11px;
}

.lx-upload__progress-track {
  overflow: hidden;
  height: 4px;
  border-radius: 999px;
  background: var(--lx-bg-card-hover);
}

.lx-upload__progress-value {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--lx-color-primary);
  transform: scaleX(var(--lx-upload-progress, 0));
  transform-origin: left center;
  transition: transform var(--lx-transition);
}

:dir(rtl) .lx-upload__progress-value {
  transform-origin: right center;
}

@media (prefers-reduced-motion: reduce) {
  .lx-upload__progress-value {
    transition: none;
  }
}

.lx-upload__file-actions {
  justify-content: flex-end;
}

.lx-upload__remove {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-text-secondary);
  cursor: pointer;
}

.lx-upload__retry {
  min-height: 44px;
  padding: 0 var(--lx-space-sm);
  border: 0;
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-color-primary);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}

.lx-upload__retry:disabled,
.lx-upload__remove:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.lx-upload__retry:hover:not(:disabled) {
  text-decoration: underline;
}

.lx-upload__retry:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-upload__remove:hover:not(:disabled) {
  background: var(--lx-color-error-light);
  color: var(--lx-color-error);
}

.lx-upload__remove:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-upload.is-disabled {
  opacity: 0.6;
}

.lx-upload__announcement {
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.lx-upload__list--compact-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lx-space-sm);
  overflow: visible;
  border: 0;
  background: transparent;
}

.lx-upload__list--compact-chips .lx-upload__file {
  grid-template-columns: 24px minmax(0, 1fr) auto;
  width: min(100%, 360px);
  min-height: 56px;
  padding: var(--lx-space-xs) var(--lx-space-sm);
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-md);
}

.lx-upload__list--compact-chips .lx-upload__file-icon {
  width: 24px;
  height: 24px;
}

@media (max-width: 480px) {
  .lx-upload__file {
    grid-template-columns: 32px minmax(0, 1fr) auto;
    gap: var(--lx-space-sm);
    padding: var(--lx-space-sm);
  }

  .lx-upload__file-heading {
    gap: var(--lx-space-xs);
  }

  .lx-upload__file-name {
    flex-basis: 100%;
  }

  .lx-upload__list--compact-chips .lx-upload__file {
    width: 100%;
  }
}
</style>
