<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  ElOption,
  ElOptionGroup,
  LxButton,
  LxCheckbox,
  LxDynamicForm,
  LxInput,
  LxRadio,
  LxRadioGroup,
  LxSelect,
  type LxDynamicFormField,
  type LxDynamicFormInstance,
  type LxDynamicFormOption,
  type LxUploadRequestOptions,
} from '../../../index'

type CandidateMode = 'success' | 'empty' | 'error'
type CandidateDemoMode = CandidateMode | 'loading'
type CandidateStatus =
  'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'cancelled'

const formRef = ref<LxDynamicFormInstance>()
const schemaPreviewRef = ref<HTMLDetailsElement | null>(null)
const form = ref<Record<string, unknown>>({
  name: '',
  password: '',
  mode: '',
  officer: '',
  enabled: true,
  cover: null,
  photos: [
    {
      uid: 'demo-photo-1',
      name: '东门现场.jpg',
      size: 184320,
      status: 'success',
    },
  ],
})
const columns = ref<1 | 2 | 3>(2)
const adaptive = ref(true)
const disabled = ref(false)
const darkTheme = ref(false)
const candidateMode = ref<CandidateMode>('success')
const candidateStatus = ref<CandidateStatus>('idle')
const candidateDemoMode = computed<CandidateDemoMode>({
  get: () =>
    candidateStatus.value === 'loading' ? 'loading' : candidateMode.value,
  set: (mode) => {
    if (mode === 'loading') {
      showCandidateLoading()
      return
    }
    setCandidateMode(mode)
  },
})
const candidateOptions = ref<LxDynamicFormOption[]>([])
const cancelledCandidateRequests = ref(0)
const ignoredLateCandidateResponses = ref(0)
const lastAction = ref('')
let requestId = 0
let activeCandidateController: AbortController | undefined
let schemaPreviewRequestId = 0
let activeSchemaPreviewController: AbortController | undefined
let demoMounted = true
const candidateTimers = new Set<number>()
const uploadTimers = new Set<number>()
const uploadAttemptsByFile = new WeakMap<File, number>()
let originalDark = false
let originalHud = false

const allCandidates: LxDynamicFormOption[] = [
  { label: '李警官 · 指挥中心', value: 'officer-1' },
  { label: '陈警官 · 一大队', value: 'officer-2' },
  { label: '周警官 · 二大队', value: 'officer-3' },
]

const schemaPreviewTypeGroups: Array<{
  label: string
  options: Array<{
    label: string
    value: LxDynamicFormField['type']
  }>
}> = [
  {
    label: '文本类字段',
    options: [
      { label: '文本输入', value: 'input' },
      { label: '密码输入', value: 'password' },
      { label: '多行文本', value: 'textarea' },
    ],
  },
  {
    label: '单值选择',
    options: [
      { label: '下拉选择', value: 'select' },
      { label: '远程选择', value: 'remote-select' },
      { label: '树形选择', value: 'tree-select' },
      { label: '单选组', value: 'radio' },
    ],
  },
  {
    label: '日期与数值',
    options: [
      { label: '数字输入', value: 'number' },
      { label: '日期选择', value: 'date' },
      { label: '日期范围', value: 'daterange' },
    ],
  },
  {
    label: '多值、状态与扩展',
    options: [
      { label: '多选组', value: 'checkbox' },
      { label: '开关', value: 'switch' },
      { label: '文件上传', value: 'upload' },
      { label: '自定义插槽', value: 'slot' },
    ],
  },
]
const schemaPreviewTypes = schemaPreviewTypeGroups.flatMap(
  (group) => group.options,
)

const schemaPreviewCategory = ref(schemaPreviewTypeGroups[0].label)
const schemaPreviewType = ref<LxDynamicFormField['type']>('input')
const schemaPreviewCategoryTypes = computed(
  () =>
    schemaPreviewTypeGroups.find(
      (group) => group.label === schemaPreviewCategory.value,
    )?.options ?? schemaPreviewTypeGroups[0].options,
)
const schemaPreviewForm = ref<Record<string, unknown>>({ previewValue: '' })
const schemaPreviewDateRangeValue = computed(() => {
  const value = schemaPreviewForm.value.previewValue
  return value === null ? 'null' : JSON.stringify(value)
})
const schemaPreviewCandidateOptions = ref<LxDynamicFormOption[]>(allCandidates)
const schemaPreviewCandidateMode = ref<CandidateMode>('success')
const schemaPreviewCandidateStatus = ref<CandidateStatus>('idle')
const schemaPreviewLastKeyword = ref('')
const schemaPreviewFields = computed<LxDynamicFormField[]>(() => {
  const selectedType = schemaPreviewType.value
  const selectedLabel =
    schemaPreviewTypes.find((item) => item.value === selectedType)?.label ??
    '字段'
  const field: LxDynamicFormField = {
    key: 'previewValue',
    label: `${selectedLabel}示例`,
    type: selectedType,
    span: 24,
  }

  if (selectedType === 'select' || selectedType === 'remote-select') {
    if (selectedType === 'select') {
      field.options = [
        { label: '日常巡防', value: 'patrol' },
        { label: '应急支援', value: 'support' },
      ]
    } else {
      field.options = schemaPreviewCandidateOptions.value
      field.props = {
        filterable: true,
        remote: true,
        debounce: 0,
        loading: schemaPreviewCandidateStatus.value === 'loading',
        loadingText: '正在搜索候选人员',
        remoteMethod: loadSchemaPreviewCandidates,
        placeholder: '搜索候选人员',
      }
      field.feedback = schemaPreviewCandidateFeedback()
    }
  }

  if (selectedType === 'tree-select') {
    field.props = {
      data: [
        {
          id: 'east-division',
          name: '东城分局',
          children: [{ id: 'east-zone', name: '东城辖区' }],
        },
      ],
      props: { label: 'name', children: 'children', value: 'id' },
      placeholder: '选择所属辖区',
    }
  }

  if (selectedType === 'date') {
    field.props = {
      valueFormat: 'YYYY-MM-DD',
      placeholder: '选择任务日期',
    }
  }

  if (selectedType === 'daterange') {
    field.props = {
      valueFormat: 'YYYY-MM-DD',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
    }
  }

  if (selectedType === 'radio' || selectedType === 'checkbox') {
    field.options = [
      { label: '日常巡防', value: 'patrol' },
      { label: '应急支援', value: 'support' },
    ]
  }

  if (selectedType === 'upload') {
    field.props = {
      accept: 'image/*',
      autoUpload: true,
      httpRequest: mockImageUpload,
      limit: 2,
      maxSize: 10,
      multiple: true,
    }
  }

  if (selectedType === 'slot') field.slot = 'preview-custom'

  return [field]
})

function schemaPreviewDefault(type: LxDynamicFormField['type']): unknown {
  switch (type) {
    case 'checkbox':
      return ['patrol']
    case 'date':
      return '2026-10-06'
    case 'daterange':
      return ['2026-10-01', '2026-10-06']
    case 'number':
      return 12
    case 'radio':
    case 'select':
      return 'patrol'
    case 'remote-select':
      return 'officer-1'
    case 'switch':
      return true
    case 'tree-select':
      return 'east-zone'
    case 'upload':
      return []
    case 'slot':
      return '自定义字段值'
    default:
      return ''
  }
}

watch(schemaPreviewType, (type) => {
  if (type !== 'remote-select') {
    schemaPreviewRequestId += 1
    activeSchemaPreviewController?.abort()
    activeSchemaPreviewController = undefined
    schemaPreviewCandidateOptions.value = allCandidates
    schemaPreviewCandidateMode.value = 'success'
    schemaPreviewCandidateStatus.value = 'idle'
    schemaPreviewLastKeyword.value = ''
  }
  schemaPreviewForm.value = { previewValue: schemaPreviewDefault(type) }
})

watch(schemaPreviewCategory, (category) => {
  const group = schemaPreviewTypeGroups.find((item) => item.label === category)
  if (!group) return
  schemaPreviewType.value = group.options[0].value
})

function mockCandidates(
  keyword: string,
  mode: CandidateMode,
  signal: AbortSignal,
): Promise<LxDynamicFormOption[]> {
  return new Promise((resolve, reject) => {
    const query = keyword.trim()
    // 慢查询模拟取消后仍迟到的回包，用来验证旧结果不会覆盖新查询。
    const returnsAfterAbort = query === '慢查询'
    const delay = query === '慢查询' ? 500 : query === '快查询' ? 60 : 300
    let timerId: number | undefined

    const handleAbort = () => {
      if (demoMounted) cancelledCandidateRequests.value += 1
      if (returnsAfterAbort) return
      if (timerId !== undefined) {
        window.clearTimeout(timerId)
        candidateTimers.delete(timerId)
      }
      signal.removeEventListener('abort', handleAbort)
      reject(createAbortError())
    }

    const finish = () => {
      if (timerId !== undefined) candidateTimers.delete(timerId)
      signal.removeEventListener('abort', handleAbort)
      if (mode === 'error') {
        reject(new Error('候选人员读取失败'))
        return
      }
      if (query === '慢查询') {
        resolve([{ label: '慢查询结果', value: 'slow-result' }])
        return
      }
      if (query === '快查询') {
        resolve([{ label: '快查询结果', value: 'fast-result' }])
        return
      }
      resolve(
        mode === 'empty'
          ? []
          : allCandidates.filter((item) => item.label.includes(query)),
      )
    }

    if (signal.aborted) {
      reject(createAbortError())
      return
    }

    signal.addEventListener('abort', handleAbort, { once: true })
    timerId = window.setTimeout(finish, delay)
    candidateTimers.add(timerId)
  })
}

function createAbortError(): Error {
  const error = new Error('候选人员查询已取消')
  error.name = 'AbortError'
  return error
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function loadCandidates(keyword = '') {
  const currentRequest = ++requestId
  activeCandidateController?.abort()
  const controller = new AbortController()
  activeCandidateController = controller
  candidateStatus.value = 'loading'
  let nextStatus: CandidateStatus = 'error'

  mockCandidates(keyword, candidateMode.value, controller.signal)
    .then((options) => {
      if (currentRequest !== requestId) {
        if (demoMounted) ignoredLateCandidateResponses.value += 1
        return
      }
      candidateOptions.value = options
      nextStatus = options.length ? 'ready' : 'empty'
    })
    .catch((error: unknown) => {
      if (currentRequest !== requestId) return
      if (isAbortError(error)) {
        nextStatus = 'cancelled'
        return
      }
      candidateOptions.value = []
      nextStatus = 'error'
    })
    .finally(() => {
      if (activeCandidateController === controller) {
        activeCandidateController = undefined
      }
      if (currentRequest === requestId) candidateStatus.value = nextStatus
    })
}

function loadSchemaPreviewCandidates(
  keyword = '',
  mode = schemaPreviewCandidateMode.value,
) {
  const currentRequest = ++schemaPreviewRequestId
  schemaPreviewLastKeyword.value = keyword
  activeSchemaPreviewController?.abort()
  const controller = new AbortController()
  activeSchemaPreviewController = controller
  schemaPreviewCandidateStatus.value = 'loading'

  mockCandidates(keyword, mode, controller.signal)
    .then((options) => {
      if (currentRequest === schemaPreviewRequestId && demoMounted) {
        schemaPreviewCandidateOptions.value = options
        schemaPreviewCandidateStatus.value = options.length ? 'ready' : 'empty'
      }
    })
    .catch((error: unknown) => {
      if (
        currentRequest === schemaPreviewRequestId &&
        demoMounted &&
        !isAbortError(error)
      ) {
        schemaPreviewCandidateOptions.value = []
        schemaPreviewCandidateStatus.value = 'error'
      }
    })
    .finally(() => {
      if (activeSchemaPreviewController === controller) {
        activeSchemaPreviewController = undefined
      }
      if (currentRequest === schemaPreviewRequestId && demoMounted) {
        if (schemaPreviewCandidateStatus.value === 'loading') {
          schemaPreviewCandidateStatus.value = 'cancelled'
        }
      }
    })
}

function retrySchemaPreviewCandidates() {
  schemaPreviewCandidateMode.value = 'success'
  loadSchemaPreviewCandidates(schemaPreviewLastKeyword.value)
}

function setSchemaPreviewCandidateMode(mode: CandidateMode) {
  schemaPreviewCandidateMode.value = mode
  loadSchemaPreviewCandidates(schemaPreviewLastKeyword.value)
}

function schemaPreviewCandidateFeedback() {
  if (schemaPreviewCandidateStatus.value === 'loading') {
    return { status: 'loading' as const, message: '候选人员加载中' }
  }
  if (schemaPreviewCandidateStatus.value === 'empty') {
    return { status: 'info' as const, message: '暂无候选人员' }
  }
  if (schemaPreviewCandidateStatus.value === 'error') {
    return {
      status: 'error' as const,
      message: '候选人员读取失败',
      retry: retrySchemaPreviewCandidates,
      retryLabel: '重试',
    }
  }
  return undefined
}

/** 仅供文档演示的内存上传适配器，不发起网络请求。 */
function mockImageUpload(options: LxUploadRequestOptions): XMLHttpRequest {
  const request = new XMLHttpRequest()
  const previousAttempts = uploadAttemptsByFile.get(options.file) ?? 0
  uploadAttemptsByFile.set(options.file, previousAttempts + 1)
  const failOnce =
    options.file.name.startsWith('重试-') && previousAttempts === 0
  let timerId: number | undefined

  const finish = () => {
    if (timerId !== undefined) uploadTimers.delete(timerId)
    if (failOnce) {
      const error = Object.assign(new Error('上传失败，请重试'), {
        name: 'UploadAjaxError',
        status: 500,
        method: options.method,
        url: options.action,
      })
      options.onError(error)
      return
    }
    const progress = Object.assign(new ProgressEvent('progress'), {
      percent: 100,
    })
    options.onProgress(progress)
    options.onSuccess({ success: true, fileName: options.file.name })
  }

  options.onProgress(
    Object.assign(new ProgressEvent('progress'), { percent: 15 }),
  )
  // 给文档验收留出读取“上传中”状态的窗口，同时保持 Mock 不阻塞示例。
  timerId = window.setTimeout(finish, 900)
  uploadTimers.add(timerId)
  request.abort = () => {
    if (timerId === undefined) return
    window.clearTimeout(timerId)
    uploadTimers.delete(timerId)
    timerId = undefined
  }
  return request
}

function setCandidateMode(mode: CandidateMode) {
  candidateMode.value = mode
  loadCandidates()
}

function cancelCandidates() {
  if (candidateStatus.value !== 'loading') return
  requestId += 1
  activeCandidateController?.abort()
  activeCandidateController = undefined
  candidateStatus.value = 'cancelled'
}

function retryCandidates() {
  candidateMode.value = 'success'
  loadCandidates()
}

function showCandidateLoading() {
  requestId += 1
  activeCandidateController?.abort()
  activeCandidateController = undefined
  candidateStatus.value = 'loading'
}

function candidateFeedback() {
  if (candidateStatus.value === 'loading') {
    return { status: 'loading' as const, message: '候选人员加载中' }
  }
  if (candidateStatus.value === 'empty') {
    return { status: 'info' as const, message: '暂无候选人员' }
  }
  if (candidateStatus.value === 'cancelled') {
    return { status: 'info' as const, message: '查询已取消' }
  }
  if (candidateStatus.value === 'error') {
    return {
      status: 'error' as const,
      message: '候选人员读取失败',
      retry: retryCandidates,
      retryLabel: '重试',
    }
  }
  return undefined
}

function setFixedColumns(count: 1 | 2 | 3) {
  adaptive.value = false
  columns.value = count
}

const fields = computed<LxDynamicFormField[]>(() => [
  {
    key: 'name',
    label: '任务名称',
    type: 'input',
    sectionTitleBefore: '任务信息',
    required: true,
    span: 12,
    props: { placeholder: '输入任务名称', clearable: true },
  },
  {
    key: 'password',
    label: '访问密码',
    type: 'password',
    required: true,
    span: 12,
    // 用透传 type 验证 password schema 始终保持遮罩。
    props: { type: 'text', placeholder: '输入访问密码' },
  },
  {
    key: 'mode',
    label: '任务类型',
    type: 'select',
    required: true,
    span: 12,
    props: { placeholder: '选择任务类型' },
    options: [
      { label: '日常巡防', value: 'patrol' },
      { label: '应急支援', value: 'support' },
    ],
  },
  {
    key: 'officer',
    label: '负责人',
    type: 'remote-select',
    span: 12,
    options: candidateOptions.value,
    props: {
      filterable: true,
      remote: true,
      debounce: 0,
      remoteMethod: loadCandidates,
      loading: candidateStatus.value === 'loading',
      placeholder: '搜索候选人员',
    },
    feedback: candidateFeedback(),
  },
  {
    key: 'enabled',
    label: '启用任务',
    type: 'switch',
    sectionTitleBefore: '任务状态',
    span: 24,
  },
  {
    key: 'supportNote',
    label: '支援说明',
    type: 'textarea',
    span: 24,
    visible: (model) => model.mode === 'support',
    props: { rows: 2, placeholder: '填写支援范围' },
  },
  {
    key: 'cover',
    label: '任务封面（单张）',
    type: 'upload',
    sectionTitleBefore: '附件',
    span: 12,
    props: {
      accept: 'image/*',
      autoUpload: true,
      drag: true,
      httpRequest: mockImageUpload,
      limit: 1,
      maxSize: 10,
    },
  },
  {
    key: 'photos',
    label: '现场图片（多张）',
    type: 'upload',
    span: 24,
    props: {
      accept: 'image/*',
      autoUpload: true,
      drag: true,
      httpRequest: mockImageUpload,
      limit: 5,
      maxSize: 10,
      multiple: true,
    },
  },
])

function submit() {
  formRef.value?.validate().then((valid) => {
    if (!valid) lastAction.value = '请检查各字段旁的错误提示。'
  })
}

function reset() {
  cancelCandidates()
  formRef.value?.resetFields()
  lastAction.value = '表单已恢复初始值'
}

function onFieldChange(key: string) {
  lastAction.value = `字段已更新：${key}`
}

function openSchemaPreview() {
  if (schemaPreviewRef.value) schemaPreviewRef.value.open = true
}

function syncTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(
    'dark',
    darkTheme.value || originalDark,
  )
  document.documentElement.classList.toggle(
    'lx-theme-hud',
    darkTheme.value || originalHud,
  )
}

watch(darkTheme, syncTheme)

onMounted(() => {
  if (typeof document === 'undefined') return
  originalDark = document.documentElement.classList.contains('dark')
  originalHud = document.documentElement.classList.contains('lx-theme-hud')
  syncTheme()
})

onBeforeUnmount(() => {
  demoMounted = false
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', originalDark)
    document.documentElement.classList.toggle('lx-theme-hud', originalHud)
  }
  requestId += 1
  activeCandidateController?.abort()
  activeCandidateController = undefined
  schemaPreviewRequestId += 1
  activeSchemaPreviewController?.abort()
  activeSchemaPreviewController = undefined
  candidateTimers.forEach((timerId) => window.clearTimeout(timerId))
  candidateTimers.clear()
  uploadTimers.forEach((timerId) => window.clearTimeout(timerId))
  uploadTimers.clear()
})

loadCandidates()
</script>

<template>
  <div class="dynamic-form-demo" :class="{ 'lx-theme-hud': darkTheme }">
    <details class="dynamic-form-demo__settings">
      <summary>演示设置</summary>
      <p class="dynamic-form-demo__settings-hint">
        低频检查项：布局、禁用、主题与本地模拟状态；示例数据仅在浏览器中生成
      </p>
      <div class="dynamic-form-demo__toolbar">
        <div
          class="dynamic-form-demo__modes"
          role="group"
          aria-label="表单列数"
        >
          <LxButton
            size="sm"
            :type="adaptive ? 'primary' : 'default'"
            :aria-pressed="adaptive"
            @click="adaptive = true"
          >
            自适应
          </LxButton>
          <LxButton
            v-for="count in [1, 2, 3] as const"
            :key="count"
            size="sm"
            :type="!adaptive && columns === count ? 'primary' : 'default'"
            :aria-pressed="!adaptive && columns === count"
            @click="setFixedColumns(count)"
          >
            {{ count }} 列
          </LxButton>
        </div>
        <LxCheckbox v-model="disabled">禁用表单</LxCheckbox>
        <LxCheckbox v-model="darkTheme">文档站整体深色（HUD）</LxCheckbox>
      </div>

      <div class="dynamic-form-demo__candidate-controls">
        <span>候选人员数据</span>
        <LxRadioGroup
          v-model="candidateDemoMode"
          class="dynamic-form-demo__candidate-modes"
          aria-label="候选人员模拟结果"
        >
          <LxRadio value="loading">加载中</LxRadio>
          <LxRadio value="success">成功</LxRadio>
          <LxRadio value="empty">空结果</LxRadio>
          <LxRadio value="error">失败</LxRadio>
        </LxRadioGroup>
        <LxButton
          size="sm"
          :disabled="candidateStatus !== 'loading'"
          @click="cancelCandidates"
        >
          取消查询
        </LxButton>
        <span
          class="dynamic-form-demo__status"
          data-testid="candidate-request-status"
          role="status"
        >
          已取消旧查询：{{ cancelledCandidateRequests }} 次；已忽略迟到响应：{{
            ignoredLateCandidateResponses
          }}
          次
        </span>
        <span
          v-if="candidateStatus === 'ready'"
          class="dynamic-form-demo__status"
        >
          {{ candidateOptions.length }} 名候选人员
        </span>
      </div>
    </details>

    <a
      class="dynamic-form-demo__schema-link"
      href="#dynamic-form-schema-preview"
      @click="openSchemaPreview"
    >
      浏览全部字段类型
    </a>

    <LxDynamicForm
      ref="formRef"
      v-model="form"
      :fields="fields"
      :columns="columns"
      :adaptive="adaptive"
      :disabled="disabled"
      @field-change="onFieldChange"
      @submit="lastAction = `表单已校验：${String($event.name)}`"
      @reset="lastAction = '表单已恢复初始值'"
    />

    <div class="dynamic-form-demo__footer">
      <LxButton type="primary" :disabled="disabled" @click="submit">
        提交校验
      </LxButton>
      <LxButton :disabled="disabled" @click="reset">重置</LxButton>
      <span role="status" aria-live="polite">
        {{ lastAction }}
      </span>
    </div>

    <details
      ref="schemaPreviewRef"
      id="dynamic-form-schema-preview"
      class="dynamic-form-demo__schema-preview"
    >
      <summary>
        <span>字段类型预览</span>
        <span class="dynamic-form-demo__schema-summary-hint">4 类 · 14 种</span>
      </summary>
      <label for="dynamic-form-schema-category">字段类别</label>
      <LxSelect
        id="dynamic-form-schema-category"
        v-model="schemaPreviewCategory"
        aria-label="字段类别"
        placeholder="选择字段类别"
        :clearable="false"
      >
        <ElOption
          v-for="group in schemaPreviewTypeGroups"
          :key="group.label"
          :label="group.label"
          :value="group.label"
        />
      </LxSelect>
      <label for="dynamic-form-schema-type">字段类型</label>
      <LxSelect
        id="dynamic-form-schema-type"
        v-model="schemaPreviewType"
        aria-label="字段类型"
        placeholder="搜索当前类别的字段类型"
        :clearable="false"
        filterable
      >
        <ElOption
          v-for="option in schemaPreviewCategoryTypes"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </LxSelect>
      <p class="dynamic-form-demo__schema-hint">
        先选字段类别，再搜索该类别中的类型；全部支持 14 种。
      </p>
      <div
        v-if="schemaPreviewType === 'remote-select'"
        class="dynamic-form-demo__preview-candidates"
      >
        <span>预览候选数据</span>
        <div role="group" aria-label="预览候选模拟结果">
          <LxButton
            v-for="mode in ['success', 'empty', 'error'] as const"
            :key="mode"
            size="sm"
            :type="schemaPreviewCandidateMode === mode ? 'primary' : 'default'"
            :aria-pressed="schemaPreviewCandidateMode === mode"
            @click="setSchemaPreviewCandidateMode(mode)"
          >
            {{ { success: '成功', empty: '空结果', error: '失败' }[mode] }}
          </LxButton>
        </div>
      </div>
      <LxDynamicForm
        v-model="schemaPreviewForm"
        :fields="schemaPreviewFields"
        :adaptive="false"
        :columns="1"
      >
        <template
          #preview-custom="{
            value,
            disabled: fieldDisabled,
            ariaDescribedBy,
            update,
          }"
        >
          <LxInput
            :model-value="String(value ?? '')"
            :disabled="fieldDisabled"
            :aria-describedby="ariaDescribedBy"
            placeholder="输入自定义字段内容"
            @update:model-value="update"
          />
        </template>
      </LxDynamicForm>
      <output
        v-if="schemaPreviewType === 'daterange'"
        class="dynamic-form-demo__date-range-value"
        data-testid="date-range-model-value"
        role="status"
      >
        字段值：{{ schemaPreviewDateRangeValue }}
      </output>
    </details>
  </div>
</template>

<style scoped>
.dynamic-form-demo {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-md);
  padding: var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.dynamic-form-demo__settings {
  display: grid;
  gap: var(--lx-space-sm);
}

.dynamic-form-demo__settings > summary {
  min-height: 32px;
  padding: 6px 0;
  color: var(--lx-text-regular);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.dynamic-form-demo__schema-preview {
  display: grid;
  gap: var(--lx-space-sm);
  padding-top: var(--lx-space-sm);
  border-top: 1px solid var(--lx-border-light);
}

.dynamic-form-demo__schema-preview > summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
  min-height: 32px;
  padding: 6px 0;
  color: var(--lx-text-regular);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.dynamic-form-demo__schema-preview > summary::marker {
  color: var(--lx-color-primary);
}

.dynamic-form-demo__schema-summary-hint {
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  font-weight: 400;
}

.dynamic-form-demo__schema-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  width: fit-content;
  color: var(--lx-color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.dynamic-form-demo__schema-link:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.dynamic-form-demo__schema-hint {
  margin: 0;
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  line-height: 18px;
}

.dynamic-form-demo__preview-candidates {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

.dynamic-form-demo__preview-candidates > div {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lx-space-xs);
}

.dynamic-form-demo__schema-preview > label {
  color: var(--lx-text-regular);
}

.dynamic-form-demo__date-range-value {
  min-width: 0;
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.dynamic-form-demo__settings > summary::marker {
  color: var(--lx-color-primary);
}

.dynamic-form-demo__settings-hint {
  margin: 0;
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  line-height: 18px;
}

.dynamic-form-demo__toolbar,
.dynamic-form-demo__candidate-controls,
.dynamic-form-demo__footer,
.dynamic-form-demo__modes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
}

.dynamic-form-demo__candidate-modes {
  flex-wrap: wrap;
}

.dynamic-form-demo__toolbar {
  padding: var(--lx-space-sm);
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-page);
}

.dynamic-form-demo__candidate-controls {
  padding: var(--lx-space-sm);
  border-top: 1px solid var(--lx-border-light);
}

.dynamic-form-demo__status {
  color: var(--lx-text-secondary-strong);
}

.dynamic-form-demo__footer {
  padding-top: var(--lx-space-sm);
  border-top: 1px solid var(--lx-border-light);
}

.dynamic-form-demo__footer span {
  color: var(--lx-text-secondary-strong);
}

@media (max-width: 640px) {
  .dynamic-form-demo__schema-preview > summary {
    min-height: 44px;
  }
}
</style>
