<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  LxButton,
  LxCheckbox,
  LxDynamicForm,
  type LxDynamicFormField,
  type LxDynamicFormInstance,
  type LxDynamicFormOption,
  type LxUploadRequestOptions,
} from '../../../index'

type CandidateMode = 'success' | 'empty' | 'error'
type CandidateStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

const formRef = ref<LxDynamicFormInstance>()
const form = ref<Record<string, unknown>>({
  name: '',
  mode: 'patrol',
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
    {
      uid: 'demo-photo-2',
      name: '西门现场.jpg',
      size: 221184,
      status: 'success',
    },
  ],
})
const columns = ref<1 | 2 | 3>(2)
const adaptive = ref(true)
const disabled = ref(false)
const darkTheme = ref(false)
const validationError = ref(false)
const candidateMode = ref<CandidateMode>('success')
const candidateStatus = ref<CandidateStatus>('idle')
const candidateOptions = ref<LxDynamicFormOption[]>([])
const lastAction = ref('')
let requestId = 0
let timer: ReturnType<typeof setTimeout> | undefined
const uploadTimers = new Set<number>()
let originalDark = false
let originalHud = false

const allCandidates: LxDynamicFormOption[] = [
  { label: '李警官 · 指挥中心', value: 'officer-1' },
  { label: '陈警官 · 一大队', value: 'officer-2' },
  { label: '周警官 · 二大队', value: 'officer-3' },
]

function mockCandidates(
  keyword: string,
  mode: CandidateMode,
): Promise<LxDynamicFormOption[]> {
  return new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      if (mode === 'error') {
        reject(new Error('候选人员读取失败'))
        return
      }
      resolve(
        mode === 'empty'
          ? []
          : allCandidates.filter((item) => item.label.includes(keyword.trim())),
      )
    }, 300)
  })
}

function loadCandidates(keyword = '') {
  const currentRequest = ++requestId
  if (timer) clearTimeout(timer)
  candidateStatus.value = 'loading'
  mockCandidates(keyword, candidateMode.value)
    .then((options) => {
      if (currentRequest !== requestId) return
      candidateOptions.value = options
      candidateStatus.value = options.length ? 'ready' : 'empty'
    })
    .catch(() => {
      if (currentRequest !== requestId) return
      candidateOptions.value = []
      candidateStatus.value = 'error'
    })
    .finally(() => {
      if (currentRequest === requestId) timer = undefined
    })
}

/** 仅供文档演示的内存上传适配器，不发起网络请求。 */
function mockImageUpload(options: LxUploadRequestOptions): XMLHttpRequest {
  const request = new XMLHttpRequest()
  let timerId: number | undefined

  const finish = () => {
    if (timerId !== undefined) uploadTimers.delete(timerId)
    const progress = Object.assign(new ProgressEvent('progress'), {
      percent: 100,
    })
    options.onProgress(progress)
    options.onSuccess({ success: true, fileName: options.file.name })
  }

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

function showCandidateLoading() {
  requestId += 1
  if (timer) clearTimeout(timer)
  timer = undefined
  candidateStatus.value = 'loading'
}

function candidateFeedback() {
  if (candidateStatus.value === 'loading') {
    return { status: 'loading' as const, message: '候选人员加载中' }
  }
  if (candidateStatus.value === 'empty') {
    return { status: 'info' as const, message: '暂无候选人员' }
  }
  if (candidateStatus.value === 'error') {
    return {
      status: 'error' as const,
      message: '候选人员读取失败',
      retry: () => loadCandidates(),
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
    required: true,
    span: 12,
    props: { placeholder: '输入任务名称', clearable: true },
  },
  {
    key: 'mode',
    label: '任务类型',
    type: 'select',
    span: 12,
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
    span: 12,
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
    validationError.value = !valid
    if (!valid) lastAction.value = '请填写标红的必填字段'
  })
}

function reset() {
  validationError.value = false
  formRef.value?.resetFields()
  lastAction.value = '表单已恢复初始值'
}

function onFieldChange(key: string) {
  validationError.value = false
  lastAction.value = `字段已更新：${key}`
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
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', originalDark)
    document.documentElement.classList.toggle('lx-theme-hud', originalHud)
  }
  requestId += 1
  if (timer) clearTimeout(timer)
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
        低频检查项：布局、禁用、主题与 Mock 状态
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
        <LxCheckbox v-model="darkTheme">HUD 深色主题</LxCheckbox>
      </div>

      <div class="dynamic-form-demo__candidate-controls">
        <span>候选人员数据</span>
        <div
          class="dynamic-form-demo__modes"
          role="group"
          aria-label="候选人员模拟结果"
        >
          <LxButton
            size="sm"
            :type="candidateStatus === 'loading' ? 'primary' : 'default'"
            :aria-pressed="candidateStatus === 'loading'"
            @click="showCandidateLoading"
          >
            加载中
          </LxButton>
          <LxButton
            size="sm"
            :type="candidateMode === 'success' ? 'primary' : 'default'"
            :aria-pressed="candidateMode === 'success'"
            @click="setCandidateMode('success')"
          >
            成功
          </LxButton>
          <LxButton
            size="sm"
            :type="candidateMode === 'empty' ? 'primary' : 'default'"
            :aria-pressed="candidateMode === 'empty'"
            @click="setCandidateMode('empty')"
          >
            空结果
          </LxButton>
          <LxButton
            size="sm"
            :type="candidateMode === 'error' ? 'primary' : 'default'"
            :aria-pressed="candidateMode === 'error'"
            @click="setCandidateMode('error')"
          >
            失败
          </LxButton>
        </div>
        <span
          v-if="candidateStatus === 'ready'"
          class="dynamic-form-demo__status"
        >
          {{ candidateOptions.length }} 名候选人员
        </span>
      </div>
    </details>

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
      <span
        :role="validationError ? 'alert' : 'status'"
        :aria-live="validationError ? 'assertive' : 'polite'"
      >
        {{ lastAction }}
      </span>
    </div>
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
</style>
