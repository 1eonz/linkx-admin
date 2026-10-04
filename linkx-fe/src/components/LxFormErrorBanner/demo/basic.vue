<script setup lang="ts">
import { ref } from 'vue'
import { LxButton, LxFormErrorBanner } from '../../../index'

const darkTheme = ref(false)
const showDetails = ref(false)
</script>

<template>
  <section
    class="form-error-demo"
    :class="{ 'lx-theme-hud': darkTheme }"
    aria-label="表单错误横幅示例"
  >
    <label class="form-error-demo__theme">
      <input v-model="darkTheme" type="checkbox" />
      HUD 深色主题
    </label>

    <LxFormErrorBanner
      title="校验阻断：当前区域处于战备封控期"
      description="封控期间禁止新增派单，请联系指挥中心调整封控范围后重试。"
    >
      <div v-if="showDetails" class="form-error-demo__details">
        <span>受影响字段：派单区域、响应等级</span>
        <LxButton
          type="text"
          text-color="var(--lx-color-form-error)"
          @click="showDetails = false"
        >
          收起字段清单
        </LxButton>
      </div>
      <LxButton
        v-else
        type="text"
        text-color="var(--lx-color-form-error)"
        @click="showDetails = true"
      >
        查看受影响字段
      </LxButton>
    </LxFormErrorBanner>
  </section>
</template>

<style scoped>
.form-error-demo {
  display: grid;
  gap: var(--lx-space-md);
  min-width: 0;
  padding: var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
}

.form-error-demo__theme {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: var(--lx-space-sm);
  color: var(--lx-text-secondary);
  font-size: 13px;
}

.form-error-demo__theme input {
  accent-color: var(--lx-color-primary);
}

.form-error-demo__details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
  color: var(--lx-color-form-error);
  font-size: 12px;
}
</style>
