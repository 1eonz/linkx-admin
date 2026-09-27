<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import LxStatusSwitch from '../index.vue'

const enabled = ref(true)
const numericValue = ref(0)
const loading = ref(false)
const failNextSave = ref(false)
const confirmValue = ref(true)
const darkTheme = ref(false)
const lastAction = ref('状态由宿主持有；此示例不会请求后端。')
const isFailure = computed(() => lastAction.value.includes('失败'))
let timer: ReturnType<typeof setTimeout> | undefined

function saveEnabled(value: boolean | number) {
  const nextValue = typeof value === 'number' ? value === 0 : value
  loading.value = true
  lastAction.value = '正在保存状态…'

  new Promise<void>((resolve, reject) => {
    timer = setTimeout(() => {
      if (failNextSave.value) {
        reject(new Error('模拟保存失败'))
        return
      }
      resolve()
    }, 250)
  })
    .then(() => {
      enabled.value = nextValue
      lastAction.value = `已保存为${nextValue ? '开启' : '关闭'}`
    })
    .catch(() => {
      lastAction.value = '保存失败，状态未修改；可以重新切换重试。'
    })
    .finally(() => {
      loading.value = false
      failNextSave.value = false
      timer = undefined
    })
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="status-switch-demo" :class="{ 'lx-theme-hud': darkTheme }">
    <div class="status-switch-demo__toolbar">
      <label><input v-model="darkTheme" type="checkbox" /> HUD 深色主题</label>
      <label
        ><input v-model="failNextSave" type="checkbox" /> 下一次保存失败</label
      >
    </div>

    <div class="status-switch-demo__rows">
      <div class="status-switch-demo__row" data-testid="boolean-row">
        <div>
          <strong>布控服务</strong>
          <span>布控视频中继集群</span>
        </div>
        <div class="status-switch-demo__control">
          <LxStatusSwitch
            :model-value="enabled"
            :loading="loading"
            @update:model-value="saveEnabled"
          />
          <span data-testid="boolean-state">{{
            enabled ? '开启' : '关闭'
          }}</span>
        </div>
      </div>

      <div class="status-switch-demo__row" data-testid="numeric-row">
        <div>
          <strong>兼容旧状态值</strong>
          <span>0 表示开启，1 表示关闭</span>
        </div>
        <div class="status-switch-demo__control">
          <LxStatusSwitch
            :model-value="numericValue"
            @update:model-value="numericValue = Number($event)"
          />
          <span data-testid="numeric-state">{{ numericValue }}</span>
        </div>
      </div>

      <div class="status-switch-demo__row" data-testid="loading-row">
        <div>
          <strong>保存处理中</strong>
          <span>提交期间锁定开关</span>
        </div>
        <LxStatusSwitch
          :model-value="false"
          loading
          @change="lastAction = '加载中的开关不应触发 change 事件'"
        />
      </div>

      <div class="status-switch-demo__row" data-testid="readonly-row">
        <div>
          <strong>只读状态</strong>
          <span>保留当前业务状态，不提供切换入口</span>
        </div>
        <LxStatusSwitch :model-value="true" disabled />
      </div>

      <div class="status-switch-demo__row" data-testid="confirm-row">
        <div>
          <strong>关闭前确认</strong>
          <span>取消确认时维持原状态</span>
        </div>
        <div class="status-switch-demo__control">
          <LxStatusSwitch
            :model-value="confirmValue"
            confirm="关闭后将中断节点通信，并记录操作审计。"
            @update:model-value="confirmValue = Boolean($event)"
          />
          <span data-testid="confirm-state">{{
            confirmValue ? '开启' : '关闭'
          }}</span>
        </div>
      </div>
    </div>

    <p
      v-if="isFailure"
      class="status-switch-demo__feedback"
      role="alert"
      data-testid="last-action"
    >
      {{ lastAction }}
    </p>
    <p
      v-else
      class="status-switch-demo__feedback"
      role="status"
      aria-live="polite"
      data-testid="last-action"
    >
      {{ lastAction }}
    </p>
  </div>
</template>

<style scoped>
.status-switch-demo {
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

.status-switch-demo__toolbar,
.status-switch-demo__toolbar label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
}

.status-switch-demo input[type='checkbox'] {
  accent-color: var(--lx-color-primary);
}

.status-switch-demo__rows {
  display: grid;
}

.status-switch-demo__row {
  display: flex;
  min-width: 0;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-md);
  border-bottom: 1px solid var(--lx-border-light);
}

.status-switch-demo__row > div {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-2xs);
}

.status-switch-demo__control {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--lx-space-sm);
}

.status-switch-demo__row span,
.status-switch-demo__feedback {
  color: var(--lx-text-secondary);
}

.status-switch-demo__feedback {
  min-height: 20px;
  margin: 0;
}

@media (max-width: 480px) {
  .status-switch-demo__row {
    gap: var(--lx-space-sm);
  }
}
</style>
