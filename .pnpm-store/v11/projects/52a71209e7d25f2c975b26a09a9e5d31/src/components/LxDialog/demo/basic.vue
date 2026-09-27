<script setup lang="ts">
import { ref } from 'vue'
import { LxDialog, lxMessage } from '../../../index'

type DemoMode = 'form' | 'danger' | 'custom'

const visible = ref(false)
const loading = ref(false)
const mode = ref<DemoMode>('form')
const form = ref({ level: '紧急', place: '', assignee: '084920 (张警官)' })

function openDialog(nextMode: DemoMode) {
  mode.value = nextMode
  visible.value = true
}

function submit() {
  if (mode.value === 'form' && !form.value.place.trim()) {
    lxMessage.warning('请填写案发精确地点')
    return
  }
  loading.value = true
  const currentMode = mode.value
  setTimeout(() => {
    loading.value = false
    visible.value = false
    lxMessage.success(
      currentMode === 'danger' ? '测试资源已删除' : '工单已派发至 3 号网格',
    )
  }, 800)
}
</script>

<template>
  <div class="lx-dialog-demo">
    <div class="lx-dialog-demo__actions" role="group" aria-label="弹窗示例">
      <button class="demo-btn" type="button" @click="openDialog('form')">
        新建涉警联动工单
      </button>
      <button class="demo-btn" type="button" @click="openDialog('danger')">
        危险操作
      </button>
      <button class="demo-btn" type="button" @click="openDialog('custom')">
        自定义底部
      </button>
    </div>

    <LxDialog
      v-model="visible"
      :title="
        mode === 'form'
          ? '新建涉警联动工单'
          : mode === 'danger'
            ? '删除测试资源'
            : '工单信息'
      "
      :icon="mode === 'form' ? 'shield' : 'info'"
      :danger="mode === 'danger'"
      :hide-footer="mode === 'custom'"
      :confirm-text="mode === 'form' ? '确认派单' : '确认删除'"
      :loading="loading"
      @confirm="submit"
    >
      <div v-if="mode === 'form'" class="lx-dialog-form-grid">
        <label class="lx-dialog-form-field">
          <span class="lx-dialog-form-label">接报人警号</span>
          <input
            class="lx-dialog-form-input"
            v-model="form.assignee"
            readonly
          />
        </label>
        <label class="lx-dialog-form-field">
          <span class="lx-dialog-form-label">险情响应等级</span>
          <select class="lx-dialog-form-input" v-model="form.level">
            <option>紧急</option>
            <option>重大</option>
            <option>一般</option>
          </select>
        </label>
        <label class="lx-dialog-form-field lx-dialog-form-field--full">
          <span class="lx-dialog-form-label">案发精确地点</span>
          <input
            class="lx-dialog-form-input"
            v-model="form.place"
            placeholder="道路 + 门牌 / 网格编号"
          />
        </label>
      </div>
      <p v-else-if="mode === 'danger'" class="lx-dialog-danger" role="alert">
        删除后无法恢复，请确认当前资源已不再使用。
      </p>
      <dl v-else class="lx-dialog-details">
        <dt>工单编号</dt>
        <dd>AL-2026-0001</dd>
        <dt>当前状态</dt>
        <dd>等待指派</dd>
      </dl>

      <template v-if="mode === 'custom'" #footer>
        <button
          class="lx-dialog-demo__custom-button"
          type="button"
          @click="visible = false"
        >
          完成
        </button>
      </template>
    </LxDialog>
  </div>
</template>

<style scoped>
.lx-dialog-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lx-space-sm);
}

.demo-btn {
  min-height: var(--lx-control-height);
  padding: 0 var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
}

.demo-btn:hover,
.demo-btn:focus-visible {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.demo-btn:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-dialog-demo__custom-button {
  min-height: var(--lx-control-height);
  padding: 0 var(--lx-space-lg);
  border: 1px solid var(--lx-color-primary);
  border-radius: var(--lx-radius-md);
  background: var(--lx-color-primary);
  color: var(--lx-color-on-primary);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.lx-dialog-demo__custom-button:hover {
  border-color: var(--lx-color-primary-hover);
  background: var(--lx-color-primary-hover);
}

.lx-dialog-demo__custom-button:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-dialog-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--lx-space-md);
}

.lx-dialog-form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lx-dialog-form-field--full {
  grid-column: 1 / -1;
}

.lx-dialog-form-label {
  font-size: 11px;
  color: var(--lx-text-secondary);
}

.lx-dialog-form-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: var(--lx-control-height);
  padding: 0 var(--lx-space-sm);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-dialog-form-input:focus {
  outline: none;
  border-color: var(--lx-color-primary);
}

.lx-dialog-form-input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 1px;
}

.lx-dialog-danger {
  margin: 0;
  color: var(--lx-text-regular);
  line-height: 1.6;
}

.lx-dialog-details {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--lx-space-sm) var(--lx-space-md);
  margin: 0;
}

.lx-dialog-details dt {
  color: var(--lx-text-secondary);
}

.lx-dialog-details dd {
  min-width: 0;
  margin: 0;
  color: var(--lx-text-primary);
}

@media (max-width: 600px) {
  .demo-btn,
  .lx-dialog-demo__custom-button {
    min-height: 44px;
  }

  .lx-dialog-form-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .lx-dialog-form-field--full {
    grid-column: auto;
  }

  .lx-dialog-form-input {
    height: 44px;
  }
}
</style>
