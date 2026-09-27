<script setup lang="ts">
import LxIcon from '../LxIcon/index.vue'
import LxTag from '../LxTag/index.vue'
import type { LxSectionTitleProps } from './types'

defineOptions({ name: 'LxSectionTitle' })

withDefaults(defineProps<LxSectionTitleProps>(), {
  title: '',
  subtitle: '',
  variant: 'border',
  size: 'default',
  iconColor: '',
  tagType: 'info',
})
</script>

<template>
  <header
    class="lx-section-title"
    :class="[`lx-section-title--${variant}`, `lx-section-title--${size}`]"
  >
    <div class="lx-section-title__heading">
      <span
        v-if="variant === 'border'"
        class="lx-section-title__bar"
        aria-hidden="true"
      />
      <span
        v-if="icon || $slots.leading"
        class="lx-section-title__leading"
        :style="{ color: iconColor || undefined }"
      >
        <slot name="leading"
          ><LxIcon v-if="icon" :name="icon" :size="16"
        /></slot>
      </span>
      <div class="lx-section-title__copy">
        <h3 class="lx-section-title__text">
          <span class="lx-section-title__label"
            ><slot>{{ title }}</slot></span
          >
          <LxTag
            v-if="tag !== undefined && tag !== ''"
            :type="tagType"
            size="small"
          >
            {{ tag }}
          </LxTag>
        </h3>
        <p v-if="subtitle" class="lx-section-title__subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.extra" class="lx-section-title__extra">
      <slot name="extra" />
    </div>
  </header>
</template>

<style scoped>
.lx-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-md);
  min-height: var(--lx-control-height);
  min-width: 0;
}

.lx-section-title__heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--lx-space-sm);
}

.lx-section-title__bar {
  width: 3px;
  height: 14px;
  flex: 0 0 3px;
  border-radius: 2px;
  background: var(--lx-color-primary);
}

.lx-section-title__leading {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  color: var(--lx-color-primary);
}

.lx-section-title__copy {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-xs);
}

.lx-section-title__text,
.lx-section-title__subtitle {
  margin: 0;
}

.lx-section-title__text {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--lx-space-sm);
  color: var(--lx-text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.lx-section-title__label {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-section-title__subtitle {
  color: var(--lx-text-secondary);
  font-size: 12px;
  line-height: 18px;
}

.lx-section-title__extra {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--lx-space-sm);
}

.lx-section-title--small {
  min-height: var(--lx-control-height-sm);
}

.lx-section-title--small .lx-section-title__text {
  font-size: 12px;
  line-height: 18px;
}

.lx-section-title--small .lx-section-title__bar {
  height: 12px;
}

.lx-section-title--large {
  min-height: var(--lx-control-height-lg);
}

.lx-section-title--large .lx-section-title__text {
  font-size: 18px;
  line-height: 24px;
}

.lx-section-title--large .lx-section-title__bar {
  height: 18px;
}

.lx-section-title--dashed {
  min-height: 0;
  padding-block-end: var(--lx-space-sm);
  margin-block-end: var(--lx-space-md);
  border-block-end: 1px dashed var(--lx-border);
}

.lx-section-title--plain {
  min-height: 0;
  align-items: flex-start;
}

.lx-section-title--plain .lx-section-title__heading {
  align-items: flex-start;
}
</style>
