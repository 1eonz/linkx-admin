<script setup lang="ts">
import { ref } from 'vue'

import LxNavbar from '../index.vue'
import type { LxNavbarUser } from '../types'

const user: LxNavbarUser = { name: '张晨', role: '值班管理员' }
const lastAction = ref('等待操作')
const showFullscreen = ref(true)
const hudTheme = ref(false)

function recordSearch(keyword: string) {
  lastAction.value = keyword ? `搜索：${keyword}` : '已提交空关键词'
}
</script>

<template>
  <section class="navbar-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <LxNavbar
      search-placeholder="搜索菜单或业务对象"
      :notification-count="120"
      network-label="内网在线"
      network-status="online"
      :user="user"
      :show-fullscreen="showFullscreen"
      @search="recordSearch"
      @notification-click="lastAction = '已打开通知'"
      @fullscreen-toggle="lastAction = $event ? '已进入全屏' : '未处于全屏'"
      @user-command="lastAction = `用户操作：${$event}`"
    >
      <template #leading>
        <strong class="navbar-demo__brand">LinkX</strong>
      </template>
      <template #breadcrumb>
        <span class="navbar-demo__page-name">运行总览</span>
      </template>
      <template #trailing>
        <button
          class="navbar-demo__theme"
          type="button"
          @click="hudTheme = !hudTheme"
        >
          {{ hudTheme ? '浅色' : 'HUD 深色' }}
        </button>
      </template>
    </LxNavbar>

    <div class="navbar-demo__settings">
      <label>
        <input v-model="showFullscreen" type="checkbox" />
        显示全屏按钮
      </label>
    </div>
    <p
      class="navbar-demo__status"
      role="status"
      aria-live="polite"
      data-testid="last-action"
    >
      {{ lastAction }}
    </p>
  </section>
</template>

<style scoped>
.navbar-demo {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--lx-border);
  border-radius: 4px;
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}

.navbar-demo__brand {
  color: var(--lx-text-primary);
  font-size: 14px;
}

.navbar-demo__page-name {
  color: var(--lx-text-secondary);
  font-size: 13px;
}

.navbar-demo__theme {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-text-regular);
  cursor: pointer;
}

.navbar-demo__theme:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.navbar-demo__settings {
  display: flex;
  min-height: 44px;
  align-items: center;
  padding-inline: var(--lx-space-md);
}

.navbar-demo__settings label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--lx-text-secondary);
  font-size: 13px;
}

.navbar-demo__settings input {
  accent-color: var(--lx-color-primary);
}

.navbar-demo__status {
  min-height: 20px;
  margin: 0;
  padding: 0 var(--lx-space-md) var(--lx-space-md);
  color: var(--lx-text-secondary);
  font-size: 13px;
}

@media (max-width: 640px) {
  .navbar-demo__brand,
  .navbar-demo__page-name {
    display: none;
  }

  .navbar-demo__theme {
    display: none;
  }
}
</style>
