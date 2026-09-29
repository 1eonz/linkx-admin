<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  LxUpload,
  type LxUploadFile,
  type LxUploadInstance,
  type LxUploadListType,
  type LxUploadRequestOptions,
} from '../../../index'

type MockMode = 'success' | 'failure'

const uploadRef = ref<LxUploadInstance>()
const files = ref<LxUploadFile[]>([])
const nextMode = ref<MockMode>('success')
const listType = ref<LxUploadListType>('standard-rows')
const disabled = ref(false)
const autoUpload = ref(false)
const hudTheme = ref(false)
const requestCount = ref(0)
const cancelledCount = ref(0)
const lastAction = ref('尚未上传文件')
let originalDark = false
let originalHud = false

function mockUpload(options: LxUploadRequestOptions): XMLHttpRequest {
  requestCount.value += 1
  let percentage = 0
  let timer: number | undefined
  const request = new XMLHttpRequest()

  request.abort = () => {
    if (timer !== undefined) window.clearInterval(timer)
    cancelledCount.value += 1
    lastAction.value = `${options.file.name} 已取消`
  }

  timer = window.setInterval(() => {
    percentage += 20
    if (percentage < 100) {
      const event = Object.assign(new ProgressEvent('progress'), {
        percent: percentage,
      })
      options.onProgress(event)
      return
    }

    window.clearInterval(timer)
    timer = undefined
    if (nextMode.value === 'failure') {
      nextMode.value = 'success'
      const error = Object.assign(new Error('本地 Mock 上传失败'), {
        name: 'UploadAjaxError',
        status: 500,
        method: options.method,
        url: options.action,
      })
      options.onError(error)
      lastAction.value = `${options.file.name} 上传失败`
      return
    }

    options.onSuccess({ success: true, fileName: options.file.name })
    lastAction.value = `${options.file.name} 上传成功`
  }, 160)

  return request
}

function setNextFailure() {
  nextMode.value = 'failure'
  lastAction.value = '下一次本地 Mock 请求将失败'
}

function handleSuccess(file: LxUploadFile) {
  lastAction.value = `${file.name} 上传成功`
}

function handleError(file: LxUploadFile, error: Error) {
  lastAction.value = `${file.name} 上传失败：${error.message}`
}

function setTheme(enabled: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', enabled || originalDark)
  document.documentElement.classList.toggle(
    'lx-theme-hud',
    enabled || originalHud,
  )
}

watch(hudTheme, setTheme)

onMounted(() => {
  originalDark = document.documentElement.classList.contains('dark')
  originalHud = document.documentElement.classList.contains('lx-theme-hud')
  setTheme(hudTheme.value)
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', originalDark)
  document.documentElement.classList.toggle('lx-theme-hud', originalHud)
})
</script>

<template>
  <section class="lx-upload-demo" aria-labelledby="lx-upload-demo-title">
    <header class="lx-upload-demo__header">
      <div>
        <h2 id="lx-upload-demo-title">排班数据导入</h2>
        <p>
          支持 CSV、Excel 文件；所有传输状态均由本地内存 Mock
          驱动。拖拽文件到虚线框可见"释放鼠标即可上传"切换态；开启"选择后立即上传"后，上传期间拖区切换为聚合进度面板，可随时取消；关闭时文件以"排队中"徽章等待提交。
        </p>
      </div>
      <label class="lx-upload-demo__toggle">
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </header>

    <div class="lx-upload-demo__toolbar">
      <fieldset class="lx-upload-demo__mode-group">
        <legend>文件列表</legend>
        <button
          type="button"
          :aria-pressed="listType === 'standard-rows'"
          @click="listType = 'standard-rows'"
        >
          标准行
        </button>
        <button
          type="button"
          :aria-pressed="listType === 'compact-chips'"
          @click="listType = 'compact-chips'"
        >
          紧凑标签
        </button>
      </fieldset>
      <label class="lx-upload-demo__toggle">
        <input v-model="autoUpload" type="checkbox" />
        选择后立即上传
      </label>
      <label class="lx-upload-demo__toggle">
        <input v-model="disabled" type="checkbox" />
        禁用上传
      </label>
    </div>

    <label class="lx-upload-demo__field">
      <span>上传文件</span>
      <LxUpload
        ref="uploadRef"
        v-model="files"
        action="mock://upload"
        accept=".xlsx,.csv"
        :limit="5"
        :max-size="10"
        :auto-upload="autoUpload"
        :disabled="disabled"
        :multiple="true"
        :drag="true"
        :list-type="listType"
        :chunk-size="1024"
        :http-request="mockUpload"
        @success="handleSuccess"
        @error="handleError"
      />
    </label>

    <div class="lx-upload-demo__actions" aria-label="上传操作">
      <button
        type="button"
        :disabled="disabled || files.length === 0"
        @click="uploadRef?.submit()"
      >
        开始上传
      </button>
      <button
        type="button"
        :disabled="disabled || files.length === 0"
        @click="uploadRef?.clearFiles()"
      >
        清空文件
      </button>
      <button type="button" :disabled="disabled" @click="setNextFailure">
        下一次上传失败
      </button>
    </div>

    <dl class="lx-upload-demo__stats" aria-live="polite">
      <div>
        <dt>Mock 请求</dt>
        <dd data-testid="upload-request-count">{{ requestCount }}</dd>
      </div>
      <div>
        <dt>已取消</dt>
        <dd data-testid="upload-cancel-count">{{ cancelledCount }}</dd>
      </div>
      <div>
        <dt>最近状态</dt>
        <dd data-testid="upload-last-action">{{ lastAction }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.lx-upload-demo {
  display: grid;
  max-width: 760px;
  min-width: 0;
  gap: 20px;
  padding: 20px;
  border: 1px solid var(--lx-border-light);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

.lx-upload-demo__header,
.lx-upload-demo__toolbar,
.lx-upload-demo__toggle,
.lx-upload-demo__actions,
.lx-upload-demo__mode-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lx-upload-demo__header,
.lx-upload-demo__toolbar {
  justify-content: space-between;
}

.lx-upload-demo__header h2 {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
}

.lx-upload-demo__header p,
.lx-upload-demo__mode-group legend {
  margin: 4px 0 0;
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.lx-upload-demo__toggle,
.lx-upload-demo__field,
.lx-upload-demo__mode-group {
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-upload-demo__toggle input {
  accent-color: var(--lx-color-primary);
}

.lx-upload-demo__field {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-sm);
}

.lx-upload-demo__mode-group {
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  border: 0;
}

.lx-upload-demo__mode-group legend {
  float: left;
  padding: 0;
}

.lx-upload-demo__mode-group button,
.lx-upload-demo__actions button {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
  cursor: pointer;
  font: inherit;
}

.lx-upload-demo__mode-group button[aria-pressed='true'],
.lx-upload-demo__actions button:first-child {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-upload-demo__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.lx-upload-demo__mode-group button:focus-visible,
.lx-upload-demo__actions button:focus-visible,
.lx-upload-demo__toggle input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-upload-demo__actions {
  flex-wrap: wrap;
  justify-content: flex-start;
}

.lx-upload-demo__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.lx-upload-demo__stats div {
  min-width: 0;
}

.lx-upload-demo__stats dt {
  margin-bottom: 4px;
}

.lx-upload-demo__stats dd {
  overflow-wrap: anywhere;
  margin: 0;
  color: var(--lx-text-primary);
}

@media (max-width: 600px) {
  .lx-upload-demo {
    padding: 16px;
  }

  .lx-upload-demo__header,
  .lx-upload-demo__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .lx-upload-demo__stats {
    grid-template-columns: 1fr;
  }
}
</style>
