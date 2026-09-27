<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  LxDynamicForm,
  type LxDynamicFormField,
  type LxDynamicFormInstance,
  type LxDynamicFormOption,
  type LxDynamicFormSlotProps,
} from '../../../index'

type CandidateMode = 'success' | 'empty' | 'error'
type CandidateStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

const formRef = ref<LxDynamicFormInstance>()
const form = ref<Record<string, unknown>>({
  name: '',
  mode: 'patrol',
  officer: '',
  enabled: true,
  attachment: '',
})
const columns = ref<1 | 2 | 3>(2)
const disabled = ref(false)
const darkTheme = ref(false)
const candidateMode = ref<CandidateMode>('success')
const candidateStatus = ref<CandidateStatus>('idle')
const candidateOptions = ref<LxDynamicFormOption[]>([])
const lastAction = ref('')
let requestId = 0
let timer: ReturnType<typeof setTimeout> | undefined

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
      lastAction.value = options.length
        ? `候选人员：${options.length} 项`
        : '没有匹配的候选人员'
    })
    .catch((error: unknown) => {
      if (currentRequest !== requestId) return
      candidateOptions.value = []
      candidateStatus.value = 'error'
      lastAction.value =
        error instanceof Error ? error.message : '候选人员读取失败'
    })
    .finally(() => {
      if (currentRequest === requestId) timer = undefined
    })
}

function setCandidateMode(mode: CandidateMode) {
  candidateMode.value = mode
  loadCandidates()
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
    key: 'attachment',
    label: '任务附件',
    type: 'upload',
    slot: 'attachment',
    span: 24,
  },
])

function submit() {
  formRef.value?.validate().then((valid) => {
    if (!valid) lastAction.value = '请填写标红的必填字段'
  })
}

function reset() {
  formRef.value?.resetFields()
  lastAction.value = '表单已恢复初始值'
}

function onFileChange(event: Event, update: LxDynamicFormSlotProps['update']) {
  const input = event.target as HTMLInputElement
  update(input.files?.[0]?.name ?? '')
}

onBeforeUnmount(() => {
  requestId += 1
  if (timer) clearTimeout(timer)
})

loadCandidates()
</script>

<template>
  <div class="dynamic-form-demo" :class="{ 'lx-theme-hud': darkTheme }">
    <div class="dynamic-form-demo__toolbar">
      <div class="dynamic-form-demo__modes" role="group" aria-label="表单列数">
        <button
          v-for="count in [1, 2, 3] as const"
          :key="count"
          type="button"
          :aria-pressed="columns === count"
          @click="columns = count"
        >
          {{ count }} 列
        </button>
      </div>
      <label><input v-model="disabled" type="checkbox" /> 禁用表单</label>
      <label><input v-model="darkTheme" type="checkbox" /> HUD 深色主题</label>
    </div>

    <div class="dynamic-form-demo__candidate-controls">
      <span>候选人员数据</span>
      <div
        class="dynamic-form-demo__modes"
        role="group"
        aria-label="候选人员模拟结果"
      >
        <button
          type="button"
          :aria-pressed="candidateMode === 'success'"
          @click="setCandidateMode('success')"
        >
          成功
        </button>
        <button
          type="button"
          :aria-pressed="candidateMode === 'empty'"
          @click="setCandidateMode('empty')"
        >
          空结果
        </button>
        <button
          type="button"
          :aria-pressed="candidateMode === 'error'"
          @click="setCandidateMode('error')"
        >
          失败
        </button>
      </div>
      <button
        v-if="candidateStatus === 'error'"
        type="button"
        @click="loadCandidates()"
      >
        重试
      </button>
      <span
        class="dynamic-form-demo__status"
        :role="candidateStatus === 'error' ? 'alert' : 'status'"
      >
        {{
          candidateStatus === 'loading'
            ? '候选人员加载中'
            : candidateStatus === 'error'
              ? '候选人员读取失败'
              : candidateStatus === 'empty'
                ? '暂无候选人员'
                : `${candidateOptions.length} 名候选人员`
        }}
      </span>
    </div>

    <LxDynamicForm
      ref="formRef"
      v-model="form"
      :fields="fields"
      :columns="columns"
      :disabled="disabled"
      @field-change="lastAction = `字段已更新：${$event}`"
      @submit="lastAction = `表单已校验：${String($event.name)}`"
      @reset="lastAction = '表单已恢复初始值'"
    >
      <template #attachment="{ value, disabled: fieldDisabled, update }">
        <label class="dynamic-form-demo__file">
          <span>{{ value || '选择本地附件' }}</span>
          <input
            type="file"
            :disabled="fieldDisabled"
            @change="onFileChange($event, update)"
          />
        </label>
      </template>
    </LxDynamicForm>

    <div class="dynamic-form-demo__footer">
      <button type="button" :disabled="disabled" @click="submit">
        提交校验
      </button>
      <button type="button" :disabled="disabled" @click="reset">重置</button>
      <span role="status" aria-live="polite">{{ lastAction }}</span>
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

.dynamic-form-demo__toolbar,
.dynamic-form-demo__candidate-controls,
.dynamic-form-demo__footer,
.dynamic-form-demo__modes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
}

.dynamic-form-demo__toolbar label {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-xs);
}

.dynamic-form-demo input[type='checkbox'] {
  accent-color: var(--lx-color-primary);
}

.dynamic-form-demo button {
  min-height: 32px;
  padding: 4px 10px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
}

.dynamic-form-demo button:hover,
.dynamic-form-demo button[aria-pressed='true'] {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.dynamic-form-demo button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.dynamic-form-demo button:focus-visible,
.dynamic-form-demo input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.dynamic-form-demo__status {
  color: var(--lx-text-secondary);
}

.dynamic-form-demo__file {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
  min-width: 0;
}

.dynamic-form-demo__file input {
  max-width: 100%;
}

.dynamic-form-demo__footer {
  padding-top: var(--lx-space-sm);
  border-top: 1px solid var(--lx-border-light);
}

.dynamic-form-demo__footer span {
  color: var(--lx-text-secondary);
}
</style>
