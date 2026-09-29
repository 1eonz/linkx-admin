<script setup lang="ts">
/**
 * LxActionButtons Demo — 表格行内操作演示
 * 语义色档（2026-09-29 两项目 192 例调研拍板）：
 * 编辑/详情=primary、删除/禁用=danger、启用/恢复=warning、激活/授权=success。
 * 演示数据仅存在于页面内存，不请求后端。
 */
import { ref } from 'vue'
import LxActionButtons from '../index.vue'
import type { LxActionItem } from '../types'

const lastAction = ref('点击行内操作观察反馈；演示数据仅存在于页面内存。')

/** 基础组合：编辑蓝 + 删除红（两项目占比最高的行内操作形态） */
const basicActions: LxActionItem[] = [
  { label: '编辑' },
  { label: '删除', type: 'danger' },
]

/** 全语义色档：多按钮行的视觉区分（用户管理典型行） */
const semanticActions: LxActionItem[] = [
  { label: '编辑' },
  { label: '重置密码', type: 'warning' },
  { label: '删除', type: 'danger' },
  { label: '授权', type: 'success' },
]

/** 图标 + 文字：常用操作提速识别；纯文字高密度场景降噪 */
const iconActions: LxActionItem[] = [
  { label: '查看', icon: 'search' },
  { label: '编辑', icon: 'setting' },
  { label: '授权', type: 'success', icon: 'key' },
  { label: '删除', type: 'danger', icon: 'circle-x' },
]

/** onClick per-item 回调：与统一 click 事件并存，免父级按 key 分发 */
const callbackActions: LxActionItem[] = [
  {
    label: '编辑',
    onClick: (action) => (lastAction.value = `onClick 回调：${action.label}`),
  },
  {
    label: '删除',
    type: 'danger',
    onClick: (action) => (lastAction.value = `onClick 回调：${action.label}`),
  },
]

/** 溢出折叠：超过 max 折叠进「更多」菜单，菜单项保持语义色 */
const overflowActions: LxActionItem[] = [
  { label: '设置角色' },
  { label: '数据权限' },
  { label: '设备调度权限' },
  { label: '摄像头权限' },
  { label: '重置密码', type: 'warning' },
  { label: '删除', type: 'danger' },
]

/** 禁用项：点击被拦截 */
const disabledActions: LxActionItem[] = [
  { label: '编辑' },
  { label: '无权审批', disabled: true },
]

/** 统一 click 事件：父级集中处理（与 onClick 并存，先派发事件后调用回调） */
function onAction(action: LxActionItem) {
  lastAction.value = `统一 click 事件：${action.label}`
}
</script>

<template>
  <div class="lx-actions-demo">
    <section class="lx-actions-demo__panel" data-testid="basic">
      <h4>基础组合（编辑蓝 + 删除红）</h4>
      <div class="lx-actions-demo__row">
        <LxActionButtons :actions="basicActions" @click="onAction" />
      </div>
    </section>

    <section class="lx-actions-demo__panel" data-testid="semantic">
      <h4>全语义色档</h4>
      <div class="lx-actions-demo__row">
        <LxActionButtons :actions="semanticActions" @click="onAction" />
      </div>
      <p class="lx-actions-demo__tip">
        语义映射：编辑/详情=primary（蓝）、删除/禁用=danger（红）、
        启用/恢复=warning（橙）、激活/授权=success（绿）。
      </p>
    </section>

    <section class="lx-actions-demo__panel" data-testid="icons">
      <h4>图标与禁用</h4>
      <div class="lx-actions-demo__row">
        <LxActionButtons :actions="iconActions" :max="4" @click="onAction" />
      </div>
      <div class="lx-actions-demo__row">
        <LxActionButtons :actions="disabledActions" @click="onAction" />
      </div>
    </section>

    <section class="lx-actions-demo__panel" data-testid="callback">
      <h4>onClick 回调（免父级分发）</h4>
      <div class="lx-actions-demo__row">
        <LxActionButtons :actions="callbackActions" @click="onAction" />
      </div>
    </section>

    <section class="lx-actions-demo__panel" data-testid="overflow">
      <h4>溢出折叠（超过 max 进「更多」）</h4>
      <div class="lx-actions-demo__row">
        <LxActionButtons
          :actions="overflowActions"
          :max="3"
          @click="onAction"
        />
      </div>
      <p class="lx-actions-demo__tip">
        权限过滤/条件显隐后数量动态变化时，「更多」入口随之自动增减；
        菜单项与外显按钮保持同一语义色。
      </p>
    </section>

    <p class="lx-actions-demo__status" aria-live="polite">{{ lastAction }}</p>
  </div>
</template>

<style scoped>
.lx-actions-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-actions-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-actions-demo__panel h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-actions-demo__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.lx-actions-demo__status,
.lx-actions-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary);
}
</style>
