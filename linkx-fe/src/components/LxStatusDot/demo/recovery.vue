<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

import { LxButton, LxStatusDot, type LxStatus } from '../../../index'

const props = defineProps<{
  /** 宿主注入本地Mock，取消后不得回写状态。 */
  loadStatus: (
    signal: AbortSignal,
    scenario: string,
  ) => Promise<LxStatus | null>
}>()
const scenario = ref('success')
const currentStatus = ref<LxStatus>('error')
const empty = ref(false)
const busy = ref(false)
const message = ref('当前样例为心跳丢失；刷新后由宿主更新状态。')
let controller: AbortController | undefined
let disposed = false

function refresh() {
  if (busy.value) return
  const request = new AbortController()
  controller = request
  busy.value = true
  message.value = '正在读取状态，保留上次结果。'
  // 保留最后可信状态，失败或取消时不伪造在线结果。
  Promise.resolve()
    .then(() => props.loadStatus(request.signal, scenario.value))
    .then((status) => {
      if (disposed || request.signal.aborted) return
      empty.value = status === null
      if (status) currentStatus.value = status
      message.value =
        status === 'online'
          ? '状态已更新，链路恢复在线。'
          : status
            ? '状态已更新。'
            : '未查询到节点，请确认节点是否仍在监测范围。'
    })
    .catch((error: unknown) => {
      if (disposed || request.signal.aborted) return
      message.value =
        error instanceof Error ? error.message : '读取失败，请稍后重新刷新。'
    })
    .finally(() => {
      if (disposed || controller !== request) return
      busy.value = false
      controller = undefined
    })
}
function cancel() {
  const request = controller
  controller = undefined
  busy.value = false
  request?.abort()
  message.value = '已取消刷新，保留上次结果。'
}
onBeforeUnmount(() => {
  disposed = true
  controller?.abort()
})
</script>

<template>
  <div class="lx-status-recovery" :aria-busy="busy">
    <label
      ><span>模拟结果</span
      ><select v-model="scenario" :disabled="busy" aria-label="模拟结果">
        <option value="success">成功</option>
        <option value="failure">请求失败</option>
        <option value="empty">空结果</option>
        <option value="forbidden">权限不足</option>
      </select></label
    >
    <div class="lx-status-recovery__actions">
      <LxButton
        type="primary"
        :loading="busy"
        loading-text="正在刷新"
        @click="refresh"
        >刷新状态</LxButton
      >
      <LxButton :disabled="!busy" @click="cancel">取消刷新</LxButton>
    </div>
    <div data-testid="status-recovery-result">
      <span v-if="empty">暂无节点状态</span
      ><LxStatusDot v-else :status="currentStatus" show-text :pulse="false" />
    </div>
    <p role="status" aria-live="polite" aria-atomic="true">{{ message }}</p>
  </div>
</template>

<style scoped>
.lx-status-recovery {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-md);
}
.lx-status-recovery label,
.lx-status-recovery__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--lx-space-md);
}
.lx-status-recovery select {
  min-height: var(--lx-control-height);
  max-width: 100%;
  padding: var(--lx-space-xs) var(--lx-space-sm);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
  font: inherit;
}
.lx-status-recovery select:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}
.lx-status-recovery p {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 20px;
}
@media (pointer: coarse) {
  .lx-status-recovery select {
    min-height: 44px;
  }
}
</style>
