<script setup lang="ts">
import type { LxBreadcrumbItem, LxBreadcrumbProps } from './types'

defineOptions({ name: 'LxBreadcrumb' })

withDefaults(defineProps<LxBreadcrumbProps>(), {
  items: () => [],
  separator: '/',
})

// 宿主可通过事件参数阻止原生导航，再交由 Vue Router 处理。
const emit = defineEmits<{
  select: [item: LxBreadcrumbItem, event: MouseEvent]
}>()
</script>

<template>
  <nav class="lx-breadcrumb" aria-label="面包屑导航">
    <ol v-if="items.length" class="lx-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="`${item.title}-${index}`"
        class="lx-breadcrumb__segment"
      >
        <span
          v-if="index > 0"
          class="lx-breadcrumb__separator"
          aria-hidden="true"
          >{{ separator }}</span
        >
        <a
          v-if="item.to && index < items.length - 1"
          class="lx-breadcrumb__item is-link"
          :href="item.to"
          :title="item.title"
          @click="emit('select', item, $event)"
          >{{ item.title }}</a
        >
        <span
          v-else
          class="lx-breadcrumb__item"
          :title="item.title"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
          >{{ item.title }}</span
        >
      </li>
    </ol>
    <span v-if="$slots.default" class="lx-breadcrumb__extra"><slot /></span>
  </nav>
</template>

<style scoped>
.lx-breadcrumb {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
  color: var(--lx-text-regular);
  font-size: 13px;
  line-height: 20px;
}

.lx-breadcrumb__list {
  display: flex;
  min-width: 0;
  max-width: 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-xs) var(--lx-space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.lx-breadcrumb__segment {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  align-items: center;
  gap: var(--lx-space-sm);
  margin: 0;
}

.lx-breadcrumb__item {
  display: inline-block;
  min-width: 0;
  min-height: 24px;
  overflow: hidden;
  max-width: 18ch;
  color: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 24px;
}

.lx-breadcrumb__item[aria-current='page'] {
  color: var(--lx-text-primary);
}

.lx-breadcrumb__item.is-link {
  text-decoration: none;
}

.lx-breadcrumb__item.is-link:hover,
.lx-breadcrumb__item.is-link:focus-visible {
  color: var(--lx-color-primary);
  text-decoration: underline;
}

.lx-breadcrumb__item.is-link:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}

.lx-breadcrumb__separator {
  flex: none;
  color: var(--lx-text-placeholder);
}

.lx-breadcrumb__extra {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}

@media (pointer: coarse) {
  .lx-breadcrumb__item.is-link {
    min-height: 44px;
    line-height: 44px;
  }
}
</style>
