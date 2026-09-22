<script setup lang="ts">
/* global document, MouseEvent */
import { More } from '@element-plus/icons-vue';
import { onBeforeUnmount, ref } from 'vue';

defineOptions({ name: 'SplitDivider' });

interface Props {
  /** 当前宽度（px） */
  modelValue: number;
  /** 最小宽度（px），默认 180 */
  min?: number;
  /** 最大宽度（px），默认 480 */
  max?: number;
}

const props = withDefaults(defineProps<Props>(), {
  min: 180,
  max: 480,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const isDragging = ref(false);
let dragStartX = 0;
let dragStartWidth = 0;
let onMouseMove: ((ev: MouseEvent) => void) | null = null;
let onMouseUp: (() => void) | null = null;

function startDrag(e: MouseEvent): void {
  isDragging.value = true;
  dragStartX = e.clientX;
  dragStartWidth = props.modelValue;

  // 拖拽期间禁止文本选中、改变光标
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';

  onMouseMove = (ev: MouseEvent) => {
    const delta = ev.clientX - dragStartX;
    const newWidth = Math.min(props.max, Math.max(props.min, dragStartWidth + delta));
    emit('update:modelValue', newWidth);
  };

  onMouseUp = () => stopDrag();

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function stopDrag(): void {
  isDragging.value = false;
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  removeListeners();
}

function removeListeners(): void {
  if (onMouseMove) {
    document.removeEventListener('mousemove', onMouseMove);
    onMouseMove = null;
  }
  if (onMouseUp) {
    document.removeEventListener('mouseup', onMouseUp);
    onMouseUp = null;
  }
}

onBeforeUnmount(() => {
  removeListeners();
});
</script>

<template>
  <div class="split-divider" :class="{ 'is-dragging': isDragging }" @mousedown="startDrag">
    <div class="split-divider__line" />
    <div class="split-divider__handle">
      <el-icon><More /></el-icon>
    </div>
  </div>
</template>

<style lang="less" scoped>
.split-divider {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  flex-shrink: 0;
  cursor: col-resize;
  z-index: 10;

  &__line {
    width: 1px;
    height: 100%;
    background: @color-divider;
    transition: background 0.2s;
  }

  &__handle {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 10px;
    height: 40px;
    border-radius: @radius-3px;
    background: @color-divider;
    transition:
      background 0.2s,
      opacity 0.2s;
    opacity: 0;
    color: @color-icon-muted;

    .el-icon {
      font-size: @font-size-xs;
    }
  }

  &:hover {
    .split-divider__line {
      background: @color-primary;
    }

    .split-divider__handle {
      opacity: 1;
      background: @color-primary-light-9;
    }
  }

  &.is-dragging {
    .split-divider__line {
      background: @color-primary;
      width: 2px;
    }

    .split-divider__handle {
      opacity: 1;
      background: @color-primary;
      color: @menu-active-text;
    }
  }
}
</style>
