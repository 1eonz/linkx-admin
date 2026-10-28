<script setup lang="ts">
import {
  ElBadge,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
} from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { LxNavbarProps } from './types'
import LxIcon from '../LxIcon/index.vue'
import LxStatusDot from '../LxStatusDot/index.vue'
import 'element-plus/es/components/badge/style/css'
import 'element-plus/es/components/dropdown/style/css'

defineOptions({ name: 'LxNavbar' })

const props = withDefaults(defineProps<LxNavbarProps>(), {
  searchPlaceholder: '搜索…',
  notificationCount: undefined,
  networkLabel: '',
  networkStatus: 'online',
  user: undefined,
  showFullscreen: true,
})

const emit = defineEmits<{
  search: [keyword: string]
  'notification-click': []
  'fullscreen-toggle': [full: boolean]
  'fullscreen-error': [error: Error]
  'user-command': [command: 'profile' | 'password' | 'logout']
}>()

const keyword = ref('')
const navbar = ref<HTMLElement | null>(null)
const menuTheme = ref<Record<string, string>>({})
let menuThemeObserver: MutationObserver | undefined
const isFullscreen = ref(false)
const fullscreenPending = ref(false)
const fullscreenError = ref('')
let unmounted = false
const notificationText = computed(() =>
  props.notificationCount && props.notificationCount > 99
    ? '99+'
    : props.notificationCount,
)

function search() {
  emit('search', keyword.value.trim())
}

/** 浮层仍挂到 body，打开期间只同步来源祖先的令牌，避免裁切或污染全局主题。 */
function syncMenuTheme() {
  if (!navbar.value || unmounted) return
  const style = getComputedStyle(navbar.value)
  menuTheme.value = Object.fromEntries(
    Array.from(style)
      .filter((name) => name.startsWith('--lx-'))
      .map((name) => [name, style.getPropertyValue(name)]),
  )
}

function onMenuVisibleChange(visible: boolean) {
  menuThemeObserver?.disconnect()
  if (!visible || !navbar.value) return
  syncMenuTheme()
  menuThemeObserver = new MutationObserver(syncMenuTheme)
  let ancestor: HTMLElement | null = navbar.value
  while (ancestor) {
    menuThemeObserver.observe(ancestor, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    ancestor = ancestor.parentElement
  }
}

watch(
  () => props.user,
  (user) => {
    if (!user) menuThemeObserver?.disconnect()
  },
)

async function toggleFullscreen() {
  if (typeof document === 'undefined' || fullscreenPending.value) return
  fullscreenPending.value = true
  fullscreenError.value = ''
  let failure: Error | undefined
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch (error) {
    failure = error instanceof Error ? error : new Error('浏览器拒绝全屏请求')
  } finally {
    // 全屏请求可能在卸载后才结束，不再回写状态或向失效宿主发送事件。
    if (!unmounted) {
      syncFullscreen()
      fullscreenPending.value = false
      emit('fullscreen-toggle', isFullscreen.value)
      if (failure) {
        fullscreenError.value =
          '无法切换全屏，请检查浏览器或嵌入页面权限后重试。'
        emit('fullscreen-error', failure)
      }
    }
  }
}

function syncFullscreen() {
  isFullscreen.value =
    typeof document !== 'undefined' && Boolean(document.fullscreenElement)
}

onMounted(() => {
  syncFullscreen()
  document.addEventListener('fullscreenchange', syncFullscreen)
})

onBeforeUnmount(() => {
  unmounted = true
  menuThemeObserver?.disconnect()
  document.removeEventListener('fullscreenchange', syncFullscreen)
})
</script>

<template>
  <header ref="navbar" class="lx-navbar">
    <div class="lx-navbar__left">
      <slot name="leading" />
      <slot name="breadcrumb" />
    </div>

    <div class="lx-navbar__right">
      <label v-if="searchPlaceholder" class="lx-navbar__search">
        <LxIcon name="search" :size="16" />
        <input
          v-model="keyword"
          type="search"
          :placeholder="searchPlaceholder"
          aria-label="全局搜索"
          @keyup.enter="search"
        />
      </label>

      <span v-if="networkLabel" class="lx-navbar__network">
        <LxStatusDot
          :status="networkStatus"
          :size="6"
          :pulse="networkStatus === 'online'"
        />
        {{ networkLabel }}
      </span>

      <ElBadge
        v-if="notificationCount !== undefined"
        :value="notificationText"
        :max="99"
        class="lx-navbar__badge"
      >
        <button
          class="lx-navbar__icon-button"
          type="button"
          aria-label="通知"
          title="通知"
          @click="emit('notification-click')"
        >
          <LxIcon name="bell" :size="18" />
        </button>
      </ElBadge>

      <button
        v-if="showFullscreen"
        class="lx-navbar__icon-button"
        type="button"
        :aria-label="isFullscreen ? '退出全屏' : '切换全屏'"
        :title="isFullscreen ? '退出全屏' : '切换全屏'"
        :aria-pressed="isFullscreen"
        :aria-busy="fullscreenPending"
        :disabled="fullscreenPending"
        @click="toggleFullscreen"
      >
        <LxIcon
          :name="isFullscreen ? 'fullscreen-exit' : 'fullscreen'"
          :size="18"
        />
      </button>

      <ElDropdown
        v-if="user"
        trigger="click"
        popper-class="lx-navbar__menu"
        :popper-style="menuTheme"
        @visible-change="onMenuVisibleChange"
        @command="emit('user-command', $event)"
      >
        <button
          class="lx-navbar__user"
          type="button"
          :aria-label="`${user.name} 的用户菜单`"
          :title="`${user.name} 的用户菜单`"
        >
          <span class="lx-navbar__avatar"
            ><img v-if="user.avatar" :src="user.avatar" alt="" /><span v-else>{{
              user.name.slice(0, 1)
            }}</span></span
          >
          <span class="lx-navbar__user-copy"
            ><strong>{{ user.name }}</strong
            ><small v-if="user.role">{{ user.role }}</small></span
          >
          <LxIcon name="chevron-down" :size="14" />
        </button>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem command="profile">个人资料</ElDropdownItem>
            <ElDropdownItem command="password">修改密码</ElDropdownItem>
            <ElDropdownItem command="logout" divided>退出登录</ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
      <slot name="trailing" />
    </div>
    <p
      v-if="fullscreenError && showFullscreen"
      class="lx-navbar__error"
      role="status"
    >
      {{ fullscreenError }}
    </p>
  </header>
</template>

<style scoped>
.lx-navbar {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-height: var(--lx-navbar-height);
  container: lx-navbar / inline-size;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-lg);
  row-gap: var(--lx-space-xs);
  padding: var(--lx-space-xs) var(--lx-space-lg);
  border-bottom: 1px solid var(--lx-border);
  background: var(--lx-bg-card);
}

.lx-navbar__left,
.lx-navbar__right,
.lx-navbar__network,
.lx-navbar__search,
.lx-navbar__user {
  display: flex;
  min-width: 0;
  align-items: center;
}

.lx-navbar__left,
.lx-navbar__right {
  gap: var(--lx-space-sm);
}

.lx-navbar__left {
  flex: 1 1 auto;
  overflow: hidden;
}

.lx-navbar__right {
  justify-content: flex-end;
  flex: 0 1 auto;
  flex-wrap: wrap;
}

.lx-navbar__right > :deep(*) {
  max-width: 100%;
}

.lx-navbar__left:empty {
  display: none;
}

.lx-navbar__left :deep(*) {
  min-width: 0;
}

.lx-navbar__search {
  width: 200px;
  min-width: min(160px, 100%);
  flex: 0 1 200px;
  box-sizing: border-box;
  min-height: var(--lx-control-height);
  gap: var(--lx-space-xs);
  padding: 0 var(--lx-space-sm);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  color: var(--lx-text-secondary);
}

.lx-navbar__search:focus-within {
  border-color: var(--lx-color-primary);
  box-shadow: var(--lx-focus-ring);
}

.lx-navbar__search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-navbar__search input::placeholder {
  color: var(--lx-text-secondary);
  opacity: 1;
}

.lx-navbar__network {
  gap: var(--lx-space-xs);
  color: var(--lx-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.lx-navbar__icon-button {
  display: inline-flex;
  width: max(var(--lx-control-height), 32px);
  min-width: var(--lx-control-height);
  height: var(--lx-control-height);
  min-height: var(--lx-control-height);
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-text-regular);
  cursor: pointer;
}

.lx-navbar__icon-button:hover {
  background: var(--lx-bg-card-hover);
  color: var(--lx-color-primary);
}

.lx-navbar__icon-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.lx-navbar__error {
  flex: 1 1 100%;
  margin: 0;
  color: var(--lx-color-error-strong);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.lx-navbar__icon-button:focus-visible,
.lx-navbar__user:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-navbar__badge :deep(.el-badge__content) {
  pointer-events: none;
  transform: translateY(-2px) translateX(4px);
  background: var(--lx-color-error);
  color: var(--lx-color-on-danger);
}

:global(html:root .lx-navbar__menu.el-popper) {
  --el-bg-color-overlay: var(--lx-bg-card);
  --el-border-color-light: var(--lx-border);
  --el-text-color-regular: var(--lx-text-regular);
  border-color: var(--lx-border);
  background: var(--lx-bg-card);
}

@media (pointer: coarse), (max-width: 640px) {
  :global(html:root .lx-navbar__menu .el-dropdown-menu__item) {
    min-height: 44px;
  }
}

.lx-navbar__user {
  gap: var(--lx-space-sm);
  flex: 0 1 auto;
  min-height: var(--lx-control-height);
  padding: 0 var(--lx-space-sm);
  border: 0;
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-text-regular);
  cursor: pointer;
}

.lx-navbar__user:hover {
  background: var(--lx-bg-card-hover);
}

.lx-navbar__avatar {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.lx-navbar__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lx-navbar__user-copy {
  display: grid;
  gap: 0;
  text-align: start;
}

.lx-navbar__user-copy strong {
  color: var(--lx-text-primary);
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
}

.lx-navbar__user-copy small {
  color: var(--lx-text-secondary);
  font-size: 11px;
  line-height: 14px;
}

@media (max-width: 960px) {
  .lx-navbar__network,
  .lx-navbar__user-copy {
    display: none;
  }

  .lx-navbar__search {
    width: 160px;
    flex-basis: 160px;
  }
}

@media (max-width: 640px) {
  .lx-navbar {
    gap: var(--lx-space-sm);
    padding-inline: var(--lx-space-sm);
  }

  .lx-navbar__search {
    width: clamp(96px, 30vw, 140px);
    flex-basis: clamp(96px, 30vw, 140px);
  }
}

/* 按组件容器而非整页视口收拢，文档栏与侧栏布局中同样保留全部操作。 */
@container lx-navbar (max-width: 760px) {
  .lx-navbar__left,
  .lx-navbar__right {
    flex: 1 1 100%;
  }

  .lx-navbar__right {
    justify-content: flex-start;
  }

  .lx-navbar__search {
    flex: 1 1 160px;
  }

  .lx-navbar__network,
  .lx-navbar__user-copy {
    display: none;
  }
}

/* 触屏设备上保留 44px 点按区，视觉图标仍由内部 18px 图形承载。 */
@media (pointer: coarse), (max-width: 640px) {
  .lx-navbar__icon-button,
  .lx-navbar__user {
    min-width: 44px;
    min-height: 44px;
  }

  .lx-navbar__search {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lx-navbar__icon-button,
  .lx-navbar__user,
  .lx-navbar__search {
    transition: none;
  }
}
</style>
