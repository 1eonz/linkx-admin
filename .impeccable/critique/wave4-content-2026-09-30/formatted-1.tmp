<script setup lang="ts">
import { ref } from 'vue'
import LxCodeSlot from '../index.vue'

const copied = ref('尚未复制')
const hudTheme = ref(false)
</script>

<template>
  <section
    class="lx-code-slot-demo"
    :class="{ 'lx-theme-hud': hudTheme }"
    aria-label="代码槽示例"
  >
    <label class="lx-code-slot-demo__theme">
      <input v-model="hudTheme" type="checkbox" />
      HUD 深色主题
    </label>
    <div class="lx-code-slot-demo__row">
      <span class="lx-code-slot-demo__label">节点编号</span>
      <LxCodeSlot @copy="copied = `已复制：${$event}`">NODE-01</LxCodeSlot>
    </div>
    <div class="lx-code-slot-demo__row">
      <span class="lx-code-slot-demo__label">长标识</span>
      <LxCodeSlot ellipsis>GB28181-P2P-EDGE-NODE-20260930-0001</LxCodeSlot>
    </div>
    <div class="lx-code-slot-demo__row">
      <span class="lx-code-slot-demo__label">只读代码</span>
      <LxCodeSlot :copyable="false">ZONE-A-07</LxCodeSlot>
    </div>
    <p class="lx-code-slot-demo__status" role="status" aria-live="polite">
      {{ copied }}
    </p>
  </section>
</template>

<style scoped>
.lx-code-slot-demo {
  display: grid;
  gap: var(--lx-space-md);
  width: 100%;
  max-width: 520px;
  min-width: 0;
  padding: var(--lx-space-lg);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-code-slot-demo__theme {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: var(--lx-space-sm);
}

.lx-code-slot-demo__theme input {
  accent-color: var(--lx-color-primary);
}

.lx-code-slot-demo__row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-md);
}

.lx-code-slot-demo__label {
  flex: 0 0 auto;
}

.lx-code-slot-demo__status {
  min-height: 20px;
  margin: 0;
  padding-top: var(--lx-space-sm);
  border-top: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

@media (max-width: 359px) {
  .lx-code-slot-demo {
    padding: var(--lx-space-md);
  }
}
</style>
