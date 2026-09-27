<script setup lang="ts">
import { ref } from 'vue'
import LxSectionTitle from '../index.vue'
import type { LxSectionTitleSize } from '../types'

const size = ref<LxSectionTitleSize>('default')
const hudTheme = ref(false)
const lastAction = ref('标题仅负责分组和说明，不加载业务数据。')
</script>

<template>
  <div class="lx-section-title-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-section-title-demo__toolbar">
      <label>
        标题尺寸
        <select v-model="size" aria-label="标题尺寸">
          <option value="small">小</option>
          <option value="default">默认</option>
          <option value="large">大</option>
        </select>
      </label>
      <label class="lx-section-title-demo__theme">
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-section-title-demo__panel" data-testid="variant-border">
      <LxSectionTitle
        title="基础信息档案"
        variant="border"
        :size="size"
        tag="8 项字段"
        tag-type="primary"
      >
        <template #extra>
          <button
            class="lx-section-title-demo__action"
            type="button"
            @click="lastAction = '打开基础信息编辑'"
          >
            编辑
          </button>
        </template>
      </LxSectionTitle>
    </section>

    <section class="lx-section-title-demo__panel" data-testid="variant-dashed">
      <LxSectionTitle
        title="南向接口服务配置"
        variant="dashed"
        :size="size"
        icon="link"
        tag="运行正常"
        tag-type="success"
      >
        <template #extra>
          <button
            class="lx-section-title-demo__action"
            type="button"
            @click="lastAction = '刷新接口配置'"
          >
            刷新
          </button>
        </template>
      </LxSectionTitle>
    </section>

    <section class="lx-section-title-demo__panel" data-testid="variant-plain">
      <LxSectionTitle
        title="预警推送策略"
        variant="plain"
        :size="size"
        subtitle="用于配置警情处置流程与责任人分派机制。"
        tag="待确认"
        tag-type="warning"
      >
        <template #extra>
          <button
            class="lx-section-title-demo__action"
            type="button"
            @click="lastAction = '打开预警推送策略'"
          >
            配置通道
          </button>
        </template>
      </LxSectionTitle>
    </section>

    <section
      class="lx-section-title-demo__long-title"
      data-testid="long-title-case"
    >
      <LxSectionTitle
        title="辖区协同指挥中心公共安全设备与网络凭证综合配置"
        variant="border"
        :size="size"
        tag="配置中"
        tag-type="info"
      >
        <template #extra>
          <button class="lx-section-title-demo__action" type="button">
            查看
          </button>
        </template>
      </LxSectionTitle>
    </section>

    <p class="lx-section-title-demo__status" aria-live="polite">
      {{ lastAction }}
    </p>
  </div>
</template>

<style scoped>
.lx-section-title-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-section-title-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  font-size: 13px;
}

.lx-section-title-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
}

.lx-section-title-demo__toolbar select {
  min-height: 32px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

.lx-section-title-demo__panel,
.lx-section-title-demo__long-title {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-section-title-demo__long-title {
  max-width: 420px;
}

.lx-section-title-demo__action {
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-color-primary);
  cursor: pointer;
}

.lx-section-title-demo__action:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-section-title-demo__status {
  margin: 0;
  color: var(--lx-text-regular);
  font-size: 12px;
}
</style>
