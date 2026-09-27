<script setup lang="ts">
import LxIcon from '../LxIcon/index.vue';
import type { LxBreadcrumbItem, LxBreadcrumbProps } from './types';

defineOptions({ name: 'LxBreadcrumb' });

withDefaults(defineProps<LxBreadcrumbProps>(), {
  items: () => [],
  separator: '/',
});

// 宿主可通过事件参数阻止原生导航，再交由 Vue Router 处理。
const emit = defineEmits<{ select: [item: LxBreadcrumbItem, event: MouseEvent] }>();
</script>

<template>
  <nav class="lx-breadcrumb" aria-label="面包屑导航">
    <template v-for="(item, index) in items" :key="`${item.title}-${index}`">
      <a
        v-if="item.to && index < items.length - 1"
        class="lx-breadcrumb__item is-link"
        :href="item.to"
        @click="emit('select', item, $event)"
      >{{ item.title }}</a>
      <span v-else class="lx-breadcrumb__item" :aria-current="index === items.length - 1 ? 'page' : undefined">{{ item.title }}</span>
      <span v-if="index < items.length - 1" class="lx-breadcrumb__separator" aria-hidden="true">{{ separator }}</span>
    </template>
    <slot />
  </nav>
</template>

<style scoped>
.lx-breadcrumb {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--lx-space-sm);
  color: var(--lx-text-secondary);
  font-size: 13px;
  line-height: 20px;
}

.lx-breadcrumb__item {
  overflow: hidden;
  max-width: 18ch;
  color: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-breadcrumb__item[aria-current='page'] {
  color: var(--lx-text-regular);
}

.lx-breadcrumb__item.is-link {
  text-decoration: none;
}

.lx-breadcrumb__item.is-link:hover,
.lx-breadcrumb__item.is-link:focus-visible {
  color: var(--lx-color-primary);
  text-decoration: underline;
}

.lx-breadcrumb__separator {
  color: var(--lx-text-placeholder);
}
</style>
