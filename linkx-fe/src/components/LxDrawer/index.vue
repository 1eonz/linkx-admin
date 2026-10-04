<script setup lang="ts">
/**
 * LxDrawer — 详情抽屉（Element Plus el-drawer 二次封装）
 * 视觉源：stitch Modals & Feedback · DetailDrawer（Audit Drawer）
 *   右侧滑出 480px / 标题栏带图标 + X / 内容区（标签-值两端对齐描述行由业务排布）
 *   footer 左侧提示文字 + 右侧按钮组（slot 完全交给业务）
 */
import { computed, useId } from 'vue'
import { ElDrawer } from 'element-plus'
import type { LxDrawerProps } from './types'
import LxIcon from '../LxIcon/index.vue'
import 'element-plus/es/components/drawer/style/css'

defineOptions({ name: 'LxDrawer' })

const props = withDefaults(defineProps<LxDrawerProps>(), {
  modelValue: false,
  title: '',
  icon: undefined,
  size: 480,
  closeOnClickModal: false,
  // Esc 是详情抽屉的标准退出路径；有未保存数据时由宿主显式关闭。
  closeOnPressEsc: true,
})

const emit = defineEmits<{
  'update:modelValue': [visible: boolean]
}>()

const visible = computed(() => props.modelValue)
const drawerSize = computed(() =>
  typeof props.size === 'number' ? `min(${props.size}px, 100vw)` : props.size,
)
const titleId = `lx-drawer-title-${useId()}`

function updateVisible(nextVisible: boolean) {
  emit('update:modelValue', nextVisible)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <ElDrawer
    class="lx-drawer"
    :model-value="visible"
    :size="drawerSize"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEsc"
    :show-close="false"
    :aria-label="title ? undefined : '详情抽屉'"
    :aria-labelledby="title ? titleId : undefined"
    append-to-body
    @update:model-value="updateVisible"
  >
    <template #header>
      <div class="lx-drawer__header">
        <div class="lx-drawer__title-wrap">
          <span v-if="icon" class="lx-drawer__icon">
            <LxIcon :name="icon" :size="16" />
          </span>
          <span :id="titleId" class="lx-drawer__title">{{ title }}</span>
        </div>
        <button
          class="lx-drawer__close"
          type="button"
          aria-label="关闭"
          @click="close"
        >
          <LxIcon name="x" :size="16" />
        </button>
      </div>
    </template>

    <slot />

    <template v-if="$slots.footer" #footer>
      <div class="lx-drawer__footer">
        <slot name="footer" />
      </div>
    </template>
  </ElDrawer>
</template>

<style scoped>
:global(.lx-drawer) {
  --el-drawer-bg-color: var(--lx-bg-card);
  max-width: 100vw;
  min-width: 0;
  box-shadow: var(--lx-shadow-modal);
}

/* append-to-body 后的抽屉仍需显式继承 html 上的 HUD 主题令牌。 */
:global(html.lx-theme-hud .lx-drawer) {
  --el-drawer-bg-color: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

:global(.lx-drawer .el-drawer__header) {
  padding: 0;
  margin-bottom: 0;
}

:global(.lx-drawer .el-drawer__body) {
  min-width: 0;
  padding: var(--lx-space-lg);
  overscroll-behavior: contain;
}

:global(.lx-drawer .el-drawer__footer) {
  padding: 0;
}

.lx-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lx-space-md) var(--lx-space-lg);
  border-bottom: 1px solid var(--lx-border-light);
}

.lx-drawer__title-wrap {
  display: flex;
  align-items: center;
  gap: var(--lx-space-sm);
  min-width: 0;
}

/* 圆形图标块（stitch DetailDrawer header 图标） */
.lx-drawer__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
  flex-shrink: 0;
}

.lx-drawer__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--lx-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-drawer__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border: none;
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-text-secondary);
  cursor: pointer;
  transition:
    background-color var(--lx-transition),
    color var(--lx-transition);
}

.lx-drawer__close:hover {
  background: var(--lx-bg-card-hover);
  color: var(--lx-text-primary);
}

.lx-drawer__close:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

/* footer：左侧提示 + 右侧按钮组（flex 两端，业务用 gap 摆放） */
.lx-drawer__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--lx-space-md);
  padding: var(--lx-space-md) var(--lx-space-lg);
  border-top: 1px solid var(--lx-border-light);
}

@media (max-width: 640px) {
  :global(.lx-drawer .el-drawer__body) {
    padding: var(--lx-space-md);
  }

  .lx-drawer__header,
  .lx-drawer__footer {
    padding-inline: var(--lx-space-md);
  }
}

@media (max-width: 480px) {
  .lx-drawer__footer {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lx-drawer__close {
    transition: none;
  }
}
</style>
