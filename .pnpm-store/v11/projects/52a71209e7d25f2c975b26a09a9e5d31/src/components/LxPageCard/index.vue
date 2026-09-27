<script setup lang="ts">
import { useId } from 'vue'
import LxIcon from '../LxIcon/index.vue'
import type { LxPageCardProps } from './types'

defineOptions({ name: 'LxPageCard' })

withDefaults(defineProps<LxPageCardProps>(), {
  title: '',
  subtitle: '',
  bodyPadding: true,
  bordered: true,
  loading: false,
})

const titleId = `lx-page-card-title-${useId()}`
</script>

<template>
  <section
    class="lx-page-card"
    :class="{ 'is-bordered': bordered }"
    :role="title ? 'region' : undefined"
    :aria-labelledby="title ? titleId : undefined"
    :aria-busy="loading || undefined"
  >
    <header
      v-if="title || subtitle || $slots['header-extra']"
      class="lx-page-card__header"
    >
      <div class="lx-page-card__heading">
        <h2 v-if="title" :id="titleId" class="lx-page-card__title">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="lx-page-card__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots['header-extra']" class="lx-page-card__header-extra">
        <slot name="header-extra" />
      </div>
    </header>

    <div class="lx-page-card__body" :class="{ 'has-padding': bodyPadding }">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="lx-page-card__footer">
      <slot name="footer" />
    </footer>

    <div
      v-if="loading"
      class="lx-page-card__loading"
      role="status"
      aria-label="加载中"
    >
      <LxIcon name="loading" :size="20" />
    </div>
  </section>
</template>

<style scoped>
.lx-page-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  box-shadow: var(--lx-shadow-card);
}

.lx-page-card.is-bordered {
  border: 1px solid var(--lx-border);
}

.lx-page-card__header,
.lx-page-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-md);
  padding: var(--lx-space-md) var(--lx-space-lg);
}

.lx-page-card__header {
  min-height: 48px;
  border-bottom: 1px solid var(--lx-border-light);
}

.lx-page-card__footer {
  min-height: 48px;
  border-top: 1px solid var(--lx-border-light);
}

.lx-page-card__heading {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-xs);
}

.lx-page-card__title {
  margin: 0;
  color: var(--lx-text-primary);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.lx-page-card__subtitle {
  margin: 0;
  color: var(--lx-text-secondary);
  font-size: 12px;
  line-height: 18px;
}

.lx-page-card__header-extra {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--lx-space-sm);
}

.lx-page-card__body.has-padding {
  padding: var(--lx-space-lg);
}

.lx-page-card__loading {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lx-bg-card);
  opacity: 0.72;
  color: var(--lx-color-primary);
}
</style>
