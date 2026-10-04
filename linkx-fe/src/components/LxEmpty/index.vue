<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { LxEmptyProps } from './types'

defineOptions({ name: 'LxEmpty' })

const props = withDefaults(defineProps<LxEmptyProps>(), {
  description: '暂无数据',
  size: 'default',
})

const imageStyle = computed<CSSProperties | undefined>(() => {
  const size = props.imageSize

  if (size === undefined || !Number.isFinite(size) || size <= 0) {
    return undefined
  }

  return { width: `${size}px`, height: `${size}px` }
})
</script>

<template>
  <div
    class="lx-empty"
    :class="`lx-empty--${props.size}`"
    role="status"
    aria-live="polite"
  >
    <div class="lx-empty__image" :style="imageStyle" aria-hidden="true">
      <slot>
        <svg class="lx-empty__icon" viewBox="0 0 48 48" fill="none">
          <path
            d="M14 8h20l8 8v24a4 4 0 01-4 4H14a4 4 0 01-4-4V12a4 4 0 014-4z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-dasharray="3 3"
          />
          <path
            d="M34 8v8h8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-dasharray="3 3"
          />
          <path
            d="M19 26h10M19 32h6"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </slot>
    </div>
    <p class="lx-empty__desc">{{ description }}</p>
    <div v-if="$slots.footer" class="lx-empty__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.lx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-sm);
  min-width: 0;
  padding: var(--lx-space-xl) var(--lx-space-md);
  color: var(--lx-text-regular);
}

.lx-empty--compact {
  padding: var(--lx-space-lg) var(--lx-space-md);
}

.lx-empty__image {
  display: grid;
  width: 64px;
  height: 64px;
  flex: 0 0 auto;
  place-items: center;
  color: var(--lx-text-regular);
}

.lx-empty--compact .lx-empty__image {
  width: 48px;
  height: 48px;
}

.lx-empty__icon {
  display: block;
  width: 100%;
  height: 100%;
}

.lx-empty__desc {
  max-width: 65ch;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  text-align: center;
}

.lx-empty--compact .lx-empty__desc {
  font-size: 12px;
}

.lx-empty__footer {
  display: flex;
  max-width: 100%;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-sm);
}
</style>
