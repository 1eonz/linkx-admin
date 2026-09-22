<script setup lang="ts">
/**
 * LxActionButtons — 表格行内操作（纯文字链接 + 溢出折叠，P2 铁律：禁止图标按钮）
 * 视觉源：stitch 行内操作 a.text-primary hover:underline text-xs
 */
import { computed, ref } from 'vue';
import type { LxActionButtonsProps, LxActionItem } from './types';

const props = withDefaults(defineProps<LxActionButtonsProps>(), {
  actions: () => [],
  max: 3,
  moreText: '更多',
});

const emit = defineEmits<{ click: [action: LxActionItem] }>();

const visible = computed(() => props.actions.filter((a) => !a.hidden));
const shown = computed(() => visible.value.slice(0, props.max));
const overflow = computed(() => visible.value.slice(props.max));
const moreOpen = ref(false);

function onClick(action: LxActionItem) {
  emit('click', action);
  moreOpen.value = false;
}
</script>

<template>
  <span class="lx-actions" @mouseleave="moreOpen = false">
    <template v-for="action in shown" :key="action.label">
      <a
        class="lx-actions__btn"
        :class="`lx-actions__btn--${action.type || 'default'}`"
        href="javascript:;"
        @click="onClick(action)"
      >{{ action.label }}</a>
    </template>

    <!-- 溢出折叠 -->
    <span v-if="overflow.length" class="lx-actions__more-wrap">
      <a class="lx-actions__btn" href="javascript:;" @mouseenter="moreOpen = true">更多</a>
      <span v-show="moreOpen" class="lx-actions__menu">
        <a
          v-for="action in overflow"
          :key="action.label"
          class="lx-actions__menu-item"
          :class="`lx-actions__btn--${action.type || 'default'}`"
          href="javascript:;"
          @click="onClick(action)"
        >{{ action.label }}</a>
      </span>
    </span>
  </span>
</template>

<style scoped>
.lx-actions {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.lx-actions__btn {
  color: var(--lx-color-primary);
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
  margin-right: var(--lx-space-md);
  transition: opacity var(--lx-transition);
}

.lx-actions__btn:hover {
  text-decoration: underline;
  opacity: 0.85;
}

.lx-actions__btn--danger {
  color: var(--lx-color-error);
}

.lx-actions__more-wrap {
  position: relative;
  display: inline-flex;
}

.lx-actions__menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 2000;
  min-width: 96px;
  padding: var(--lx-space-xs);
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  box-shadow: var(--lx-shadow-pop);
}

.lx-actions__menu-item {
  display: block;
  padding: 6px var(--lx-space-sm);
  border-radius: var(--lx-radius-sm);
  font-size: 12px;
  color: var(--lx-text-regular);
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--lx-transition), color var(--lx-transition);
}

.lx-actions__menu-item:hover {
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}
</style>
