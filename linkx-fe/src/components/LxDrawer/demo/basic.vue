<script setup lang="ts">
// demo：出警抽检审计抽屉 — 480px 详情（stitch DetailDrawer 原型场景）
import { ref } from 'vue';
import { LxDrawer, lxConfirm } from '../../../index';

const visible = ref(false);

async function revoke() {
  const ok = await lxConfirm({
    title: '撤回该抽检审计结论？',
    message: '撤回后该记录回到待抽检池，需重新指派督察员。',
    confirmText: '撤回结论',
    danger: true,
  });
  if (ok) visible.value = false;
}
</script>

<template>
  <div>
    <button class="demo-btn" @click="visible = true">打开审计抽屉</button>

    <LxDrawer v-model="visible" title="出警抽检审计抽屉" icon="shield">
      <div class="audit-row">
        <span class="audit-label">抽检审计人</span>
        <span class="audit-value">督察大队 #0421</span>
      </div>
      <div class="audit-row">
        <span class="audit-label">执法记录仪录像</span>
        <span class="audit-value audit-link">REC_20241024_0911.mp4</span>
      </div>
      <div class="audit-row">
        <span class="audit-label">AI 话术合规得分</span>
        <span class="audit-value audit-pass">98.5（合格）</span>
      </div>

      <template #footer>
        <span class="audit-hint">抽检结论一经确认将同步至督察系统</span>
        <div style="display: flex; gap: 8px">
          <button class="demo-btn" @click="visible = false">关闭</button>
          <button class="demo-btn demo-btn--danger" @click="revoke">撤回结论</button>
        </div>
      </template>
    </LxDrawer>
  </div>
</template>

<style scoped>
/* 标签-值两端对齐描述行（stitch DetailDrawer 规格） */
.audit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lx-space-md) 0;
  border-bottom: 1px solid var(--lx-border-light);
  font-size: 12px;
}

.audit-label {
  color: var(--lx-text-secondary);
}

.audit-value {
  color: var(--lx-text-regular);
}

.audit-link {
  color: var(--lx-color-primary);
  text-decoration: underline;
  cursor: pointer;
}

.audit-pass {
  color: var(--lx-color-success);
  font-weight: 600;
}

.audit-hint {
  font-size: 12px;
  color: var(--lx-text-secondary);
}
</style>
