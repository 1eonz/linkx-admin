<script setup lang="ts">
/** 上传界面只处理前端校验与状态展示，网络传输由 Element Plus 或业务侧配置负责。 */
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
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  watch,
} from 'vue'

import type { LxUploadFile, LxUploadProps } from './types'
import { createUploadInstanceUidPrefix } from './uid'
import type { LxIconName } from '../LxIcon/icons'
import LxIcon from '../LxIcon/index.vue'
import { lxMessage } from '../LxMessage'
import 'element-plus/es/components/upload/style/css'

defineOptions({ name: 'LxUpload' })

const generatedUidPrefix = createUploadInstanceUidPrefix()

// 用私有标记保存宿主 UID，避免内部映射信息进入上传模型。
const sourceUidKey: unique symbol = Symbol('lx-upload-source-uid')
const sourceRawKey: unique symbol = Symbol('lx-upload-source-raw')

type LxUploadUserFile = UploadUserFile & {
  error?: Error
  [sourceUidKey]?: number | string
  [sourceRawKey]?: File
}

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
const rootRef = ref<HTMLElement>()
const announcement = ref('')
const uploadErrors = ref<Record<number, string>>({})
const activeUploadRequests = new Map<number, AbortController>()
const internalUidBySource = new Map<string, number>()
const sourceUidByInternal = new Map<number, string | number>()
const sourceKeyByInternal = new Map<number, string>()
const sourceRawByInternal = new Map<number, File>()
// 无 UID 时按原始 File 对象区分同名同大小文件，避免列表重排转移请求身份。
const fallbackSourceKeyByRaw = new WeakMap<File, string>()
let fallbackSourceSequence = 0
let forwardedDescriptionIds = new Set<string>()
const elementRawByInternal = new Map<
  number,
  { source: UploadRawFile; upload: UploadRawFile }
>()
const attrs = useAttrs()
function synchronizeTriggerDescription(): void {
  const trigger = rootRef.value?.querySelector<HTMLElement>(
    '.el-upload[role="button"]',
  )
  const value = attrs['aria-describedby']
  if (!trigger) return

  const suppliedIds =
    typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : []
  const managedIds = new Set([...forwardedDescriptionIds, ...suppliedIds])
  const preservedIds = (trigger.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter((id) => id && !managedIds.has(id))
  const mergedIds = [...new Set([...preservedIds, ...suppliedIds])]
  const nextValue = mergedIds.join(' ')
  const currentValue = trigger.getAttribute('aria-describedby')

  if (nextValue) {
    if (currentValue !== nextValue)
      trigger.setAttribute('aria-describedby', nextValue)
  } else if (currentValue !== null) {
    trigger.removeAttribute('aria-describedby')
  }
  forwardedDescriptionIds = new Set(suppliedIds)
}

onMounted(synchronizeTriggerDescription)
onUpdated(synchronizeTriggerDescription)

watch(
  () => attrs['aria-describedby'],
  () => nextTick(synchronizeTriggerDescription),
  { flush: 'post' },
)

function setRootElement(element: unknown): void {
  rootRef.value = element instanceof HTMLElement ? element : undefined
}

const draggable = computed(() => props.drag ?? props.draggable)

const acceptLabels: Record<string, string> = {
  'image/*': '图片',
  'video/*': '视频',
  'audio/*': '音频',
  'application/pdf': 'PDF',
  'application/msword': 'Word 文档',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'Word 文档',
  'application/vnd.ms-excel': 'Excel 表格',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'Excel 表格',
  'application/vnd.ms-powerpoint': 'PowerPoint 演示文稿',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'PowerPoint 演示文稿',
  '.doc': 'Word 文档',
  '.docx': 'Word 文档',
  '.xls': 'Excel 表格',
  '.xlsx': 'Excel 表格',
  '.csv': 'CSV 文件',
  '.pdf': 'PDF',
  '.ppt': 'PowerPoint 演示文稿',
  '.pptx': 'PowerPoint 演示文稿',
  '.jpg': '图片',
  '.jpeg': '图片',
  '.png': '图片',
  '.gif': '图片',
  '.webp': '图片',
}

function acceptLabel(accept: string): string {
  if (!accept.trim()) return '常见文件格式'
  const labels = accept
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => acceptLabels[item] ?? '指定格式')
  return [...new Set(labels)].join('、')
}

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

function sourceUidKeyFor(uid: string | number): string {
  return `${typeof uid}:${uid}`
}

function fallbackSourceKeyFor(file: LxUploadUserFile, index: number): string {
  const raw = file[sourceRawKey] ?? file.raw
  if (!raw) return `fallback:${index}:${file.name}:${file.size ?? 0}`

  const existing = fallbackSourceKeyByRaw.get(raw)
  if (existing) return existing

  fallbackSourceSequence += 1
  const sourceKey = `fallback:${generatedUidPrefix}raw:${fallbackSourceSequence}`
  fallbackSourceKeyByRaw.set(raw, sourceKey)
  return sourceKey
}

function assignInternalUid(
  sourceKey: string,
  preferredUid: number,
  sourceUid?: string | number,
): number {
  const existing = internalUidBySource.get(sourceKey)
  if (existing !== undefined) return existing

  // Element Plus 使用 uid ||= genFileId()，内部 UID 必须非零。
  let uid =
    Number.isSafeInteger(preferredUid) && preferredUid !== 0 ? preferredUid : 1
  while (
    sourceKeyByInternal.has(uid) &&
    sourceKeyByInternal.get(uid) !== sourceKey
  ) {
    uid = uid === Number.MAX_SAFE_INTEGER ? Number.MIN_SAFE_INTEGER : uid + 1
    if (uid === 0) uid = 1
  }

  internalUidBySource.set(sourceKey, uid)
  sourceKeyByInternal.set(uid, sourceKey)
  if (sourceUid !== undefined) sourceUidByInternal.set(uid, sourceUid)
  return uid
}

function modelUidFor(internalUid: number): number | string {
  const sourceUid = sourceUidByInternal.get(internalUid)
  if (sourceUid !== undefined) return sourceUid

  const sourceKey = sourceKeyByInternal.get(internalUid)
  if (!sourceKey?.startsWith('fallback:')) return internalUid

  const generatedUid = `${generatedUidPrefix}${internalUid}`
  internalUidBySource.set(sourceUidKeyFor(generatedUid), internalUid)
  sourceUidByInternal.set(internalUid, generatedUid)
  return generatedUid
}

function uploadRequestUid(file: UploadUserFile): number {
  if (typeof file.uid === 'number') return file.uid

  const rawUid = recordOf(file.raw)?.uid
  if (typeof rawUid === 'number') return rawUid
  return file.uid ?? stableUid(file, 0, file.name, file.size)
}

function elementRawFile(
  source: UploadRawFile,
  internalUid: number,
): UploadRawFile {
  if (source.uid === internalUid) return source

  const cached = elementRawByInternal.get(internalUid)
  if (cached?.source === source) return cached.upload

  const upload = Object.assign(
    new File([source], source.name, {
      type: source.type,
      lastModified: source.lastModified,
    }),
    { uid: internalUid },
  )
  elementRawByInternal.set(internalUid, { source, upload })
  return upload
}

function isUploadRawFile(value: unknown): value is UploadRawFile {
  if (typeof File === 'undefined' || !(value instanceof File)) return false
  return typeof (value as File & { uid?: unknown }).uid === 'number'
}

function toUploadRawFile(value: File, uid: number): UploadRawFile {
  if (isUploadRawFile(value)) return value
  return Object.assign(
    new File([value], value.name, {
      type: value.type,
      lastModified: value.lastModified,
    }),
    { uid },
  )
}

function uploadStatus(status: unknown): UploadStatus {
  if (status === 'uploading' || status === 'success' || status === 'fail')
    return status
  return 'ready'
}

function toUploadUserFile(
  value: unknown,
  index: number,
): LxUploadUserFile | undefined {
  const sourceUid = recordOf(value)?.uid
  if (typeof File !== 'undefined' && value instanceof File) {
    const uid = stableUid(value, index, value.name, value.size)
    return {
      uid,
      name: value.name || '未命名文件',
      size: value.size,
      status: 'ready',
      raw: toUploadRawFile(value, uid),
      [sourceRawKey]: value,
      ...(typeof sourceUid === 'number' || typeof sourceUid === 'string'
        ? { [sourceUidKey]: sourceUid }
        : {}),
    }
  }

  const record = recordOf(value)
  if (!record || typeof record.name !== 'string') return undefined

  const name = record.name || '未命名文件'
  const size = typeof record.size === 'number' ? record.size : undefined
  const rawStatus = record.status === 'error' ? 'fail' : record.status
  const error = record.error instanceof Error ? record.error : undefined
  const sourceRaw =
    typeof File !== 'undefined' && record.raw instanceof File
      ? record.raw
      : undefined
  const uid = stableUid(value, index, name, size)
  return {
    uid,
    name,
    size,
    status: uploadStatus(rawStatus),
    percentage:
      typeof record.percentage === 'number' ? record.percentage : undefined,
    raw: sourceRaw ? toUploadRawFile(sourceRaw, uid) : undefined,
    ...(sourceRaw ? { [sourceRawKey]: sourceRaw } : {}),
    url: typeof record.url === 'string' ? record.url : undefined,
    ...(record.response === undefined ? {} : { response: record.response }),
    ...(error === undefined ? {} : { error }),
    ...(typeof sourceUid === 'number' || typeof sourceUid === 'string'
      ? { [sourceUidKey]: sourceUid }
      : {}),
  }
}

function uniqueUploadFiles(values: unknown[]): LxUploadUserFile[] {
  const mapped = values
    .map((value, index) => ({
      index,
      file: toUploadUserFile(value, index),
    }))
    .filter(
      (entry): entry is { index: number; file: LxUploadUserFile } =>
        entry.file !== undefined,
    )

  // 先登记数值 UID，再登记字符串 UID，避免两种来源占用同一个内部编号。
  for (const { file } of mapped) {
    const sourceUid = file[sourceUidKey]
    if (typeof sourceUid !== 'number') continue
    assignInternalUid(sourceUidKeyFor(sourceUid), sourceUid, sourceUid)
  }

  const stringUids = [
    ...new Set(
      mapped.flatMap(({ file }) => {
        const sourceUid = file[sourceUidKey]
        return typeof sourceUid === 'string' ? [sourceUid] : []
      }),
    ),
  ].sort()
  for (const sourceUid of stringUids) {
    const sourceFile = mapped.find(
      ({ file }) => file[sourceUidKey] === sourceUid,
    )?.file
    const rawUid = sourceFile?.raw?.uid
    assignInternalUid(
      sourceUidKeyFor(sourceUid),
      typeof rawUid === 'number'
        ? rawUid
        : stableUid({ uid: sourceUid }, 0, sourceUid),
      sourceUid,
    )
  }

  const next = mapped.map(({ index, file }) => {
    const sourceUid = file[sourceUidKey]
    const sourceKey =
      typeof sourceUid === 'number' || typeof sourceUid === 'string'
        ? sourceUidKeyFor(sourceUid)
        : fallbackSourceKeyFor(file, index)
    const uid = assignInternalUid(sourceKey, file.uid ?? 1, sourceUid)
    const sourceRaw = file.raw
    if (!sourceRaw) {
      sourceRawByInternal.delete(uid)
      elementRawByInternal.delete(uid)
      return uid === file.uid ? file : { ...file, uid }
    }

    sourceRawByInternal.set(uid, file[sourceRawKey] ?? sourceRaw)
    return {
      ...file,
      uid,
      raw: elementRawFile(sourceRaw, uid),
    }
  })

  const activeUids = new Set(next.map((file) => file.uid))
  for (const uid of sourceRawByInternal.keys()) {
    if (activeUids.has(uid)) continue
    sourceRawByInternal.delete(uid)
    elementRawByInternal.delete(uid)
  }
  return next
}

const files = computed(() => uniqueUploadFiles(props.modelValue))

watch(files, (currentFiles, previousFiles) => {
  const currentUids = new Set(
    currentFiles.flatMap((file) =>
      typeof file.uid === 'number' ? [file.uid] : [],
    ),
  )
  for (const file of previousFiles) {
    const uid = file.uid
    if (typeof uid !== 'number' || currentUids.has(uid)) continue
    invalidateUploadRequest(uid)
    uploadRef.value?.abort(toUploadFile(file))
  }
})

/** 拖区态C（上传中）：任一文件处于 uploading 即激活聚合进度面板 */
const isUploading = computed(() =>
  files.value.some((file) => file.status === 'uploading'),
)

const uploadingCount = computed(
  () => files.value.filter((file) => file.status === 'uploading').length,
)

/** 聚合总进度：上传中文件的平均进度（裁剪版不含速率/分片/批次，见审计 §三 #2） */
const aggregatePercent = computed(() => {
  const uploading = files.value.filter((file) => file.status === 'uploading')
  if (!uploading.length) return 0
  const total = uploading.reduce(
    (sum, file) => sum + Math.min(100, Math.max(0, file.percentage ?? 0)),
    0,
  )
  return Math.round(total / uploading.length)
})

const requestHandler = computed<UploadRequestHandler | undefined>(() => {
  if (!props.httpRequest) return undefined
  const handler = props.httpRequest
  return (options: UploadRequestOptions) => {
    const uid = options.file.uid
    invalidateUploadRequest(uid)
    const controller = new AbortController()
    const request = controller
    activeUploadRequests.set(uid, request)
    const isCurrent = () =>
      activeUploadRequests.get(uid) === request && !controller.signal.aborted

    // Element Plus 会在 Promise 完成后调用这些回调；必须隔离取消或重试前后的请求。
    const onProgress = options.onProgress
    const onSuccess = options.onSuccess
    const onError = options.onError

    options.onProgress = (...args) => {
      if (isCurrent()) onProgress(...args)
    }
    options.onSuccess = (...args) => {
      if (!isCurrent()) return
      activeUploadRequests.delete(uid)
      onSuccess(...args)
    }
    options.onError = (...args) => {
      if (!isCurrent()) return
      activeUploadRequests.delete(uid)
      onError(...args)
    }

    try {
      return handler({
        ...options,
        chunkSize: Math.max(1, Math.floor(props.chunkSize)),
        signal: controller.signal,
      })
    } catch (error) {
      if (activeUploadRequests.get(uid) === request) {
        activeUploadRequests.delete(uid)
      }
      controller.abort()
      throw error
    }
  }
})

function invalidateUploadRequest(uid: number) {
  const controller = activeUploadRequests.get(uid)
  if (!controller) return
  activeUploadRequests.delete(uid)
  controller.abort()
}

function invalidateAllUploadRequests() {
  for (const uid of activeUploadRequests.keys()) invalidateUploadRequest(uid)
}

onBeforeUnmount(() => {
  invalidateAllUploadRequests()
  uploadRef.value?.abort()
})

function toLxFiles(source: UploadFiles): LxUploadFile[] {
  return source.map((file) => {
    const error = recordOf(file)?.error
    return {
      uid: modelUidFor(file.uid),
      name: file.name,
      size: file.size,
      type: file.raw?.type,
      status: file.status === 'fail' ? 'error' : file.status,
      percentage: file.percentage,
      raw: sourceRawByInternal.get(file.uid) ?? file.raw,
      ...(file.url === undefined ? {} : { url: file.url }),
      ...(file.response === undefined ? {} : { response: file.response }),
      ...(error instanceof Error ? { error } : {}),
    }
  })
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
  const index = next.findIndex((item) => item.uid === progressFile.uid)
  if (index === -1) next.push(progressFile)
  else next[index] = progressFile
  emit('update:modelValue', next)
  emit('progress', progressFile, next)
}

function onSuccess(response: unknown, file: UploadFile, list: UploadFiles) {
  delete uploadErrors.value[file.uid]
  const uploaded = {
    ...toLxFiles([file])[0],
    ...(response === undefined ? {} : { response }),
  }
  const next = toLxFiles(list)
  const index = next.findIndex((item) => item.uid === uploaded.uid)
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
  const index = next.findIndex((item) => item.uid === failed.uid)
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
    ...(file.response === undefined ? {} : { response: file.response }),
  }
}

function remove(file: UploadUserFile) {
  if (props.disabled) return
  const requestUid = uploadRequestUid(file)
  invalidateUploadRequest(requestUid)
  uploadRef.value?.abort({ ...toUploadFile(file), uid: requestUid })
  uploadRef.value?.handleRemove(toUploadFile(file))
}

async function retry(file: UploadUserFile) {
  if (!file.raw || props.disabled) return
  const requestUid = uploadRequestUid(file)
  invalidateUploadRequest(requestUid)
  uploadRef.value?.abort({ ...toUploadFile(file), uid: requestUid })
  delete uploadErrors.value[file.uid ?? -1]
  await uploadRef.value?.handleRemove(toUploadFile(file))
  await nextTick()
  if (props.disabled || !uploadRef.value) return
  uploadRef.value?.handleStart(file.raw)
  submit()
}

function statusText(file: UploadUserFile): string {
  if (file.status === 'uploading') return '上传中'
  if (file.status === 'success') return '上传成功'
  if (file.status === 'fail') return '上传失败'
  return '排队中'
}

function statusIcon(file: UploadUserFile): LxIconName {
  if (file.status === 'uploading') return 'loading'
  if (file.status === 'success') return 'check'
  if (file.status === 'fail') return 'alert'
  return 'clock'
}

function progressPercent(file: UploadUserFile): number {
  return Math.min(100, Math.max(0, Math.round(file.percentage ?? 0)))
}

function errorText(file: LxUploadUserFile): string {
  return (
    uploadErrors.value[file.uid ?? -1] ??
    file.error?.message ??
    '上传失败，可重试'
  )
}

function fileSize(size?: number): string {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function submit() {
  if (props.disabled) return
  uploadRef.value?.submit()
}

function clearFiles() {
  if (props.disabled) return
  invalidateAllUploadRequests()
  uploadRef.value?.abort()
  uploadRef.value?.clearFiles()
  emit('update:modelValue', [])
  announcement.value = '文件列表已清空'
}

function abort(file?: LxUploadFile) {
  // 父级同步回传生成 UID 时，按内部映射找回当前受控文件。
  const target = file
    ? files.value.find(
        (item) =>
          item[sourceUidKey] === file.uid ||
          item.uid === file.uid ||
          sourceUidByInternal.get(Number(item.uid)) === file.uid,
      )
    : undefined
  const targets = file
    ? target
      ? [target]
      : []
    : files.value.filter((item) => item.status === 'uploading')
  if (file) {
    if (!target) return
    const requestUid = uploadRequestUid(target)
    invalidateUploadRequest(requestUid)
    uploadRef.value?.abort({ ...toUploadFile(target), uid: requestUid })
  } else {
    invalidateAllUploadRequests()
    uploadRef.value?.abort()
  }

  const targetUids = new Set(
    targets
      .filter((item) => item.status === 'uploading')
      .map((item) => Number(item.uid)),
  )
  if (!targetUids.size) return
  const reset = files.value.map((item) =>
    targetUids.has(Number(item.uid))
      ? toUploadFile({ ...item, status: 'ready', percentage: 0 })
      : toUploadFile(item),
  )
  emit('update:modelValue', toLxFiles(reset))
}

/**
 * 拖区态C"取消上传"：abort 全部进行中请求并复位。
 * EP abort() 只调用 req.abort()（XHR abort 不派发 error 事件），
 * 文件状态会停留 uploading，因此必须主动复位 v-model 回排队态。
 */
function cancelUpload() {
  if (props.disabled) return
  abort()
  announcement.value = '已取消上传，文件已回到队列'
}

// 公开方法与受控列表保持一致；禁用态不触发提交或清空。
defineExpose({
  submit,
  abort,
  clearFiles,
})
</script>

<template>
  <div
    :ref="setRootElement"
    class="lx-upload"
    :class="{ 'is-disabled': disabled, 'is-uploading': isUploading }"
  >
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
        <!-- 态C 上传中：拖区整体变形为聚合进度面板（裁剪版，见审计 §三 #2） -->
        <div v-if="isUploading" class="lx-upload__panel">
          <div class="lx-upload__panel-info">
            <p class="lx-upload__panel-title">
              <LxIcon
                name="loading"
                :size="16"
                :spin="true"
                aria-hidden="true"
              />
              正在上传 {{ uploadingCount }} 个文件
            </p>
            <p class="lx-upload__panel-hint">
              总进度
              <span class="lx-upload__panel-percent"
                >{{ aggregatePercent }}%</span
              >，请勿关闭页面
            </p>
          </div>
          <div
            class="lx-upload__panel-track"
            role="progressbar"
            aria-label="批量上传总进度"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="aggregatePercent"
          >
            <span
              class="lx-upload__panel-value"
              :style="{ '--lx-upload-panel-progress': aggregatePercent / 100 }"
            />
          </div>
          <button
            class="lx-upload__cancel"
            type="button"
            :disabled="disabled"
            @click.stop="cancelUpload"
          >
            取消上传
          </button>
        </div>
        <!-- 态A 默认就绪 / 态B 拖拽悬停：内容切换由 EP .is-dragover 类驱动（纯 CSS） -->
        <div v-else class="lx-upload__dropzone">
          <div class="lx-upload__dropzone-idle">
            <span class="lx-upload__drop-icon"
              ><LxIcon name="upload" :size="36"
            /></span>
            <p class="lx-upload__title">点击或拖拽文件到此处上传</p>
            <p class="lx-upload__hint">
              <template v-if="accept">支持{{ acceptLabel(accept) }}</template>
              <template v-else>支持常见文件格式</template>
              <template v-if="maxSize">，单文件不超过 {{ maxSize }}MB</template>
              <template v-if="limit">，最多 {{ limit }} 个文件</template>
            </p>
            <!-- 外层上传触发器提供按钮语义；这里仅显示文件选择提示。 -->
            <span class="lx-upload__browse"> 浏览本地文件 </span>
          </div>
          <div class="lx-upload__dropzone-over">
            <span class="lx-upload__drop-over-icon"
              ><LxIcon name="upload" :size="20"
            /></span>
            <p class="lx-upload__over-title">释放鼠标即可上传</p>
          </div>
        </div>
      </template>
      <template v-else>
        <span class="lx-upload__button">
          <LxIcon name="upload" :size="16" />
          选择文件
        </span>
      </template>
    </ElUpload>

    <div v-if="files.length" class="lx-upload__list-wrap">
      <div class="lx-upload__list-header">
        <span class="lx-upload__list-title"
          >已选 {{ files.length }} 个文件</span
        >
        <button
          class="lx-upload__clear"
          type="button"
          :disabled="disabled"
          @click="clearFiles"
        >
          全部清空
        </button>
      </div>
      <ul
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
            <div
              v-if="file.size != null || file.status === 'fail'"
              class="lx-upload__file-meta"
            >
              <span v-if="file.size != null">{{ fileSize(file.size) }}</span>
              <span v-if="file.status === 'fail'" class="lx-upload__file-error">
                {{ errorText(file) }}
              </span>
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
    </div>
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
  height: auto;
  min-height: 120px;
  overflow: hidden;
  padding: 0;
  border: 2px dashed var(--lx-control-border);
  border-radius: var(--lx-radius-lg);
  background: var(--lx-bg-card-hover);
  transition:
    border-color var(--lx-transition),
    background-color var(--lx-transition);
}

.lx-upload__trigger :deep(.el-upload-dragger:hover),
.lx-upload__trigger :deep(.el-upload-dragger.is-dragover) {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary-light);
}

/* 态B 拖拽悬停：inset 阴影强化"按下"感（标本 UploadDropZone 拖入态） */
.lx-upload__trigger :deep(.el-upload-dragger.is-dragover) {
  box-shadow: inset 0 0 0 2px var(--lx-color-primary-light);
}

/* 态C 上传中：拖区整体变形为进度面板，虚线换实线主色边（标本态C） */
.lx-upload.is-uploading .lx-upload__trigger :deep(.el-upload-dragger) {
  border-style: solid;
  border-color: var(--lx-control-border);
  background: var(--lx-bg-card);
}

.lx-upload__trigger :deep(.el-upload-dragger:focus-visible),
.lx-upload__trigger :deep(.el-upload:focus-visible) {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-upload__dropzone {
  box-sizing: border-box;
  display: grid;
  min-height: 120px;
  min-width: 0;
  padding: var(--lx-space-md) var(--lx-space-lg);
  place-content: center;
}

.lx-upload__dropzone-idle {
  display: grid;
  max-width: 100%;
  min-width: 0;
  justify-items: center;
  gap: var(--lx-space-xs);
}

/* 态B 内容切换：EP dragger 拖入时加 .is-dragover，纯 CSS 切换两块内容 */
.lx-upload__dropzone-over {
  display: none;
  max-width: 100%;
  min-width: 0;
  justify-items: center;
  gap: var(--lx-space-xs);
}

.lx-upload__trigger
  :deep(.el-upload-dragger.is-dragover)
  .lx-upload__dropzone-idle {
  display: none;
}

.lx-upload__trigger
  :deep(.el-upload-dragger.is-dragover)
  .lx-upload__dropzone-over {
  display: grid;
}

.lx-upload__drop-over-icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--lx-color-primary);
  color: var(--lx-bg-card);
}

.lx-upload__over-title {
  margin: 0;
  color: var(--lx-color-primary);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.lx-upload__browse {
  display: inline-flex;
  min-height: 18px;
  align-items: center;
  padding: 0;
  color: var(--lx-color-primary);
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  line-height: 18px;
  text-decoration: underline;
}

.lx-upload.is-disabled .lx-upload__browse {
  color: var(--lx-text-secondary-strong);
  cursor: not-allowed;
  text-decoration: none;
}

/* 态C 聚合进度面板（裁剪版：总进度 + 8px 条纹条 + 取消上传） */
.lx-upload__panel {
  display: grid;
  height: 100%;
  grid-template-columns: auto minmax(120px, 1fr) auto;
  align-items: center;
  gap: var(--lx-space-md);
  padding-inline: var(--lx-space-md);
}

.lx-upload__panel-info {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.lx-upload__panel-title,
.lx-upload__panel-hint {
  margin: 0;
  white-space: nowrap;
}

.lx-upload__panel-title {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-xs);
  color: var(--lx-text-primary);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.lx-upload__panel-hint {
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  line-height: 18px;
}

.lx-upload__panel-percent {
  font-family: var(--lx-font-mono);
  font-variant-numeric: tabular-nums;
}

.lx-upload__panel-track {
  position: relative;
  overflow: hidden;
  height: 8px;
  border-radius: 999px;
  background: var(--lx-bg-card-hover);
}

.lx-upload__panel-value {
  position: absolute;
  inset-block: 0;
  left: 0;
  width: 100%;
  border-radius: inherit;
  transform: scaleX(var(--lx-upload-panel-progress, 0));
  transform-origin: left center;
  /* 8px 条纹动画条：主色/浅主色 45° 相间，背景位移动画产生流动感 */
  background: repeating-linear-gradient(
    -45deg,
    var(--lx-color-primary) 0 10px,
    var(--lx-color-primary-light) 10px 20px
  );
  animation: lx-upload-stripes 0.8s linear infinite;
  transition: transform var(--lx-transition);
}

/* 20px 渐变周期沿 45° 轴，水平位移一个视觉周期 = 20px / cos(45°) ≈ 28.28px */
@keyframes lx-upload-stripes {
  to {
    background-position: 28.28px 0;
  }
}

:dir(rtl) .lx-upload__panel-value {
  transform-origin: right center;
}

@media (prefers-reduced-motion: reduce) {
  .lx-upload__panel-value {
    animation: none;
    transition: none;
  }
}

.lx-upload__cancel {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  padding: 0 var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
}

.lx-upload__cancel:hover:not(:disabled) {
  border-color: var(--lx-color-error);
  color: var(--lx-color-error);
}

.lx-upload__cancel:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-upload__cancel:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.lx-upload__drop-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lx-color-primary);
}

.lx-upload__title,
.lx-upload__hint {
  max-width: 100%;
  margin: 0;
  overflow-wrap: anywhere;
  text-align: center;
}

.lx-upload__title {
  color: var(--lx-text-primary);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.lx-upload__hint {
  color: var(--lx-text-secondary-strong);
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

.lx-upload__list-wrap {
  display: grid;
  min-width: 0;
}

.lx-upload__list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
  padding: 0 var(--lx-space-xs) var(--lx-space-xs);
}

.lx-upload__list-title {
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  line-height: 18px;
}

/* "全部清空"列表头文字按钮（复用 clearFiles 实例逻辑） */
.lx-upload__clear {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--lx-space-xs);
  border: 0;
  background: none;
  color: var(--lx-text-secondary-strong);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 18px;
}

.lx-upload__clear:hover:not(:disabled) {
  color: var(--lx-color-error);
}

.lx-upload__clear:focus-visible {
  border-radius: var(--lx-radius-sm);
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-upload__clear:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.lx-upload__list {
  display: grid;
  overflow: hidden;
  margin: 0;
  padding: 0;
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-lg);
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
  color: var(--lx-color-success-text);
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

/* 状态胶囊徽章：排队/上传中/成功/失败四态（标本文件列表行内徽章，文案去标本化） */
.lx-upload__file-status {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--lx-color-info-light);
  color: var(--lx-text-secondary-strong);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}

.lx-upload__file-status.is-uploading {
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-upload__file-status.is-success {
  background: var(--lx-color-success-light);
  color: var(--lx-color-success-text);
}

.lx-upload__file-status.is-fail {
  background: var(--lx-color-error-light);
  color: var(--lx-color-error-strong);
}

.lx-upload__file-percentage,
.lx-upload__file-meta {
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

.lx-upload__file-percentage {
  color: var(--lx-color-primary);
}

/* 失败行文件名红字（标本失败态：徽章 + 红字文件名双层强化） */
.lx-upload__file.is-fail .lx-upload__file-name,
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
  color: var(--lx-text-secondary-strong);
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

  /* 态C 面板窄屏堆叠：信息/进度条/按钮纵向排列 */
  .lx-upload__panel {
    grid-template-columns: minmax(0, 1fr);
    justify-items: start;
    gap: var(--lx-space-xs);
    padding-inline: var(--lx-space-sm);
  }

  .lx-upload.is-uploading .lx-upload__trigger :deep(.el-upload-dragger) {
    height: auto;
    min-height: 120px;
  }

  .lx-upload.is-uploading .lx-upload__panel {
    height: auto;
    min-height: 120px;
    padding-block: var(--lx-space-xs);
  }

  .lx-upload__panel-track {
    width: 100%;
  }

  .lx-upload__panel-title,
  .lx-upload__panel-hint {
    white-space: normal;
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

/* 触屏：文件选择提示和操作按钮保留足够触控空间。 */
@media (hover: none) {
  .lx-upload__cancel {
    min-height: 44px;
  }

  .lx-upload__clear {
    min-height: 44px;
  }
}
</style>
