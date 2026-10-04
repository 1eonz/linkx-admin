<script setup lang="ts">
// demo：出警抽检审计抽屉 — 480px 详情（stitch DetailDrawer 原型场景）
import { onBeforeUnmount, ref, watch } from 'vue'
import { LxButton, LxDrawer, lxConfirm } from '../../../index'

const visible = ref(false)
const darkTheme = ref(false)

function syncThemeRoot(enabled: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', enabled)
  document.documentElement.classList.toggle('lx-theme-hud', enabled)
}

watch(darkTheme, syncThemeRoot)
onBeforeUnmount(() => syncThemeRoot(false))

async function revoke() {
  const ok = await lxConfirm({
    title: '撤回该抽检审计结论？',
    message: '撤回后该记录回到待抽检池，需重新指派督察员。',
    confirmText: '撤回结论',
    danger: true,
  })
  if (ok) visible.value = false
}
</script>

<template>
  <section
    class="drawer-demo"
    :class="{ 'lx-theme-hud': darkTheme }"
    aria-label="抽屉示例"
  >
    <label class="drawer-demo__theme">
      <input v-model="darkTheme" type="checkbox" />
      HUD 深色主题
    </label>
    <LxButton type="primary" aria-label="打开审计抽屉" @click="visible = true">
      打开审计抽屉
    </LxButton>

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
        <div class="drawer-demo__actions">
          <LxButton @click="visible = false">关闭</LxButton>
          <LxButton type="danger" @click="revoke">撤回结论</LxButton>
        </div>
      </template>
    </LxDrawer>
  </section>
</template>

<style scoped>
.drawer-demo {
  display: grid;
  gap: var(--lx-space-md);
  min-width: 0;
  padding: var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
}

.drawer-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lx-space-sm);
}

.drawer-demo__theme {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: var(--lx-space-sm);
  color: var(--lx-text-secondary);
  font-size: 13px;
}

.drawer-demo__theme input {
  accent-color: var(--lx-color-primary);
}

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
