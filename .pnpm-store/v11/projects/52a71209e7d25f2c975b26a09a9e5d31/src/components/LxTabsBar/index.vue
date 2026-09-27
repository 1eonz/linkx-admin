<script setup lang="ts">
import LxIcon from '../LxIcon/index.vue';
import type { LxTabItem, LxTabsBarProps } from './types';

defineOptions({ name: 'LxTabsBar' });

withDefaults(defineProps<LxTabsBarProps>(), {
  tabs: () => [],
  modelValue: '',
});

const emit = defineEmits<{
  'update:modelValue': [key: string];
  close: [key: string];
  'context-menu': [event: { key: string; x: number; y: number }];
}>();

function select(tab: LxTabItem) {
  emit('update:modelValue', tab.key);
}

function openContext(event: MouseEvent, tab: LxTabItem) {
  event.preventDefault();
  emit('context-menu', { key: tab.key, x: event.clientX, y: event.clientY });
}
</script>

<template>
  <nav class="lx-tabs-bar" aria-label="已打开页面">
    <div class="lx-tabs-bar__scroll">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="lx-tabs-bar__tab"
        :class="{ 'is-active': tab.key === modelValue }"
        @contextmenu="openContext($event, tab)"
      >
        <button
          class="lx-tabs-bar__trigger"
          type="button"
          :aria-current="tab.key === modelValue ? 'page' : undefined"
          @click="select(tab)"
        ><span class="lx-tabs-bar__title">{{ tab.title }}</span></button>
        <button
          v-if="tab.closable"
          class="lx-tabs-bar__close"
          type="button"
          :aria-label="`关闭 ${tab.title}`"
          @click.stop="emit('close', tab.key)"
        ><LxIcon name="x" :size="14" /></button>
      </div>
    </div>
    <slot name="extra" />
  </nav>
</template>

<style scoped>
.lx-tabs-bar {
  display: flex;
  min-height: var(--lx-tabsbar-height);
  align-items: flex-end;
  gap: var(--lx-space-sm);
  padding-inline: var(--lx-space-md);
  border-bottom: 1px solid var(--lx-border);
  background: var(--lx-bg-tabsbar);
}

.lx-tabs-bar__scroll {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: flex-end;
  overflow-x: auto;
  scrollbar-width: none;
}

.lx-tabs-bar__scroll::-webkit-scrollbar {
  display: none;
}

.lx-tabs-bar__tab {
  display: inline-flex;
  min-width: 104px;
  max-width: 220px;
  min-height: var(--lx-tabsbar-height);
  align-items: center;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: var(--lx-radius-md) var(--lx-radius-md) 0 0;
}

.lx-tabs-bar__trigger {
  display: inline-flex;
  min-width: 0;
  height: 100%;
  flex: 1;
  align-items: center;
  padding: 0 var(--lx-space-sm);
  border: 0;
  background: transparent;
  color: var(--lx-text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  text-align: start;
}

.lx-tabs-bar__trigger:hover {
  color: var(--lx-text-regular);
}

.lx-tabs-bar__tab.is-active {
  border-color: var(--lx-border);
  background: var(--lx-bg-card);
}

.lx-tabs-bar__tab.is-active .lx-tabs-bar__trigger {
  color: var(--lx-color-primary);
  font-weight: 500;
}

.lx-tabs-bar__trigger:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}

.lx-tabs-bar__title {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-tabs-bar__close {
  display: inline-flex;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.lx-tabs-bar__close:hover {
  background: var(--lx-color-info-light);
}
</style>
