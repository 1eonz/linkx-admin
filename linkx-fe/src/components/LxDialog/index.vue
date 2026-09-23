<script setup lang="ts">
/**
 * LxDialog — 表单弹窗（Element Plus el-dialog 二次封装）
 * 视觉源：stitch Modals & Feedback · FormModal（DIALOG 徽标）
 *   三段式：图标+标题+X 标题栏（底 1px 分隔线）/ 内容区 / 右对齐按钮栏（顶 1px 分隔线）
 *   表单区建议双列 grid（业务用 .lx-dialog__grid 工具类）
 * 纯受控：确认不做任何请求，loading 由业务驱动（P7）
 */
import { computed } from 'vue';
import { ElDialog } from 'element-plus';
import type { LxDialogProps } from './types';
import LxIcon from '../LxIcon/index.vue';
import 'element-plus/es/components/dialog/style/css';

const props = withDefaults(defineProps<LxDialogProps>(), {
  modelValue: false,
  title: '',
  icon: undefined,
  width: 672,
  danger: false,
  confirmText: '确认',
  cancelText: '取消',
  loading: false,
  closeOnClickModal: false,
  closeOnPressEsc: true,
  draggable: true,
  hideFooter: false,
});

const emit = defineEmits<{
  'update:modelValue': [visible: boolean];
  /** 点击确认按钮（业务在此校验/提交，成功后自行置 visible=false） */
  confirm: [];
  cancel: [];
}>();

const visible = computed(() => props.modelValue);

const headerIcon = computed(() => (props.danger ? 'alert' : props.icon));
const titleColor = computed(() =>
  props.danger ? 'var(--lx-color-error-strong)' : 'var(--lx-text-primary)'
);
const iconColor = computed(() =>
  props.danger ? 'var(--lx-color-error)' : 'var(--lx-color-primary)'
);

function close() {
  emit('update:modelValue', false);
}

function onCancel() {
  emit('cancel');
  close();
}

function onConfirm() {
  if (props.loading) return;
  emit('confirm');
}
</script>

<template>
  <ElDialog
    class="lx-dialog"
    :model-value="visible"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEsc"
    :draggable="draggable"
    :show-close="false"
    align-center
    append-to-body
    @update:model-value="close"
  >
    <!-- 标题栏：图标 + 标题 + X，底 1px 分隔线（stitch 三段式） -->
    <template #header>
      <div class="lx-dialog__header">
        <div class="lx-dialog__title-wrap">
          <LxIcon
            v-if="headerIcon"
            :name="headerIcon"
            :size="18"
            class="lx-dialog__title-icon"
            :style="{ color: iconColor }"
          />
          <span class="lx-dialog__title" :style="{ color: titleColor }">{{ title }}</span>
        </div>
        <button class="lx-dialog__close" type="button" aria-label="关闭" @click="close">
          <LxIcon name="x" :size="16" />
        </button>
      </div>
    </template>

    <slot />

    <!-- 底部：顶 1px 分隔线，按钮右对齐：取消（灰）在左、主操作在右（stitch 按钮律） -->
    <template v-if="!hideFooter" #footer>
      <div class="lx-dialog__footer">
        <button class="lx-dialog__btn" type="button" @click="onCancel">{{ cancelText }}</button>
        <button
          class="lx-dialog__btn lx-dialog__btn--primary"
          :class="{ 'lx-dialog__btn--danger': danger }"
          type="button"
          :disabled="loading"
          @click="onConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </template>

    <template v-else #footer>
      <slot name="footer" />
    </template>
  </ElDialog>
</template>

<style scoped>
/* EP 容器 → Lx 令牌 */
:global(.lx-dialog) {
  --el-dialog-border-radius: var(--lx-radius-lg);
  --el-dialog-padding-primary: var(--lx-space-lg);
  --el-dialog-bg-color: var(--lx-bg-card);
  box-shadow: var(--lx-shadow-modal);
}

:global(.lx-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:global(.lx-dialog .el-dialog__body) {
  padding: var(--lx-space-lg) var(--lx-space-lg) 0;
}

:global(.lx-dialog .el-dialog__footer) {
  padding: 0 var(--lx-space-lg) var(--lx-space-lg);
}

.lx-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lx-space-md) var(--lx-space-lg);
  border-bottom: 1px solid var(--lx-border-light);
  cursor: move; /* 默认 draggable=true，头部即拖拽把手（设计拍板 #9） */
}

.lx-dialog__title-wrap {
  display: flex;
  align-items: center;
  gap: var(--lx-space-sm);
  min-width: 0;
}

.lx-dialog__title-icon {
  flex-shrink: 0;
}

.lx-dialog__title {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-dialog__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-text-secondary);
  cursor: pointer;
  transition: all var(--lx-transition);
}

.lx-dialog__close:hover {
  background: var(--lx-bg-card-hover);
  color: var(--lx-text-primary);
}

.lx-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--lx-space-sm);
  padding-top: var(--lx-space-lg);
  border-top: 1px solid var(--lx-border-light);
  margin-top: var(--lx-space-lg);
}

/* 按钮高度 32px（--lx-control-height），主按钮蓝底白字加粗 */
.lx-dialog__btn {
  height: var(--lx-control-height);
  padding: 0 var(--lx-space-lg);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--lx-transition);
}

.lx-dialog__btn:hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.lx-dialog__btn--primary {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary);
  color: var(--lx-color-on-primary);
  font-weight: 600;
}

.lx-dialog__btn--primary:hover {
  border-color: var(--lx-color-primary-hover);
  background: var(--lx-color-primary-hover);
  color: var(--lx-color-on-primary);
}

/* 危险模式：红底白字（stitch DANGER） */
.lx-dialog__btn--danger {
  border-color: var(--lx-color-error);
  background: var(--lx-color-error);
}

.lx-dialog__btn--danger:hover {
  border-color: var(--lx-color-error-strong);
  background: var(--lx-color-error-strong);
}

.lx-dialog__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
