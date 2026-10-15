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

/** 表格行内示例：保留用户记录上下文并展示操作折叠。 */
const tableRowActions: LxActionItem[] = [
  { label: '查看' },
  { label: '编辑' },
  { label: '重置密码', type: 'warning' },
  { label: '删除', type: 'danger' },
]

/** 全语义色档：多按钮行的视觉区分（用户管理典型行） */
const semanticActions: LxActionItem[] = [
  { label: '编辑' },
  { label: '重置密码', type: 'warning' },
  { label: '删除', type: 'danger' },
  { label: '授权', type: 'success' },
]

/** 图标仅辅助识别；按钮始终保留文字标签 */
const iconActions: LxActionItem[] = [
  { label: '查看', icon: 'search' },
  { label: '编辑', icon: 'setting' },
  { label: '授权', type: 'success', icon: 'key' },
  { label: '删除', type: 'danger', icon: 'circle-x' },
]

/** 窄列长文案：展示表格列宽受限时的自动换行 */
const narrowActions: LxActionItem[] = [
  { label: '查看完整告警关联设备记录' },
  { label: '撤销当前跨区域布控任务', type: 'danger' },
]

/** 对照公开操作与显式空权限码；示例不授予或模拟真实权限。 */
const publicActions: LxActionItem[] = [{ label: '公开查看' }]
const emptyAuthActions: LxActionItem[] = [
  { label: '空字符串权限', auth: '' },
  { label: '空数组权限', auth: [] },
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
  { label: '重置密码', type: 'warning' },
  { label: '删除', type: 'danger' },
]

/** 禁用项：点击被拦截 */
const disabledActions: LxActionItem[] = [
  { label: '编辑' },
  { label: '暂不可执行', disabled: true },
]

/** 统一 click 事件：父级集中处理（与 onClick 并存，先派发事件后调用回调） */
function onAction(action: LxActionItem) {
  lastAction.value = action.label
}
</script>

<template>
  <div class="lx-actions-demo">
    <section class="lx-actions-demo__panel" data-testid="basic">
      <h3>基础组合（编辑蓝 + 删除红）</h3>
      <div class="lx-actions-demo__row">
        <LxActionButtons :actions="basicActions" @click="onAction" />
      </div>
    </section>

    <section class="lx-actions-demo__panel" data-testid="table-row">
      <h3>表格行内使用</h3>
      <div
        class="lx-actions-demo__table-scroll"
        role="region"
        aria-label="用户列表示例"
        tabindex="0"
      >
        <table class="lx-actions-demo__table">
          <caption>
            用户列表
          </caption>
          <thead>
            <tr>
              <th scope="col">用户</th>
              <th scope="col">角色</th>
              <th scope="col">状态</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">测试账号-037</th>
              <td>系统管理员</td>
              <td>启用</td>
              <td>
                <LxActionButtons
                  :actions="tableRowActions"
                  :max="2"
                  @click="onAction"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="lx-actions-demo__panel" data-testid="semantic">
      <h3>全语义色档</h3>
      <div class="lx-actions-demo__row">
        <LxActionButtons :actions="semanticActions" @click="onAction" />
      </div>
      <p class="lx-actions-demo__tip">
        语义映射：编辑/详情=primary（蓝）、删除/禁用=danger（红）、
        启用/恢复=warning（橙）、激活/授权=success（绿）。
      </p>
    </section>

    <section class="lx-actions-demo__panel" data-testid="states">
      <h3>图标辅助识别与受限状态</h3>
      <div class="lx-actions-demo__row">
        <LxActionButtons :actions="iconActions" @click="onAction" />
      </div>
      <div class="lx-actions-demo__row" data-testid="disabled-actions">
        <LxActionButtons
          :actions="disabledActions"
          :max="1"
          @click="onAction"
        />
      </div>
      <div class="lx-actions-demo__narrow-row" data-testid="narrow-actions">
        <LxActionButtons :actions="narrowActions" :max="1" @click="onAction" />
      </div>
    </section>

    <section
      class="lx-actions-demo__panel"
      data-testid="auth-boundary"
      aria-labelledby="lx-actions-demo-auth-title"
    >
      <h3 id="lx-actions-demo-auth-title">权限配置边界</h3>
      <p class="lx-actions-demo__tip">
        未传 auth
        的操作按公开操作显示；显式传入空字符串或空数组时，按无权处理并隐藏。真实权限码由宿主注入权限源后校验。
      </p>
      <div class="lx-actions-demo__auth-comparison">
        <div data-testid="auth-omitted">
          <h4>省略 auth</h4>
          <p class="lx-actions-demo__tip">公开操作会显示。</p>
          <LxActionButtons :actions="publicActions" />
        </div>
        <div data-testid="auth-empty">
          <h4>显式空权限码</h4>
          <p class="lx-actions-demo__tip">空字符串和空数组均不会渲染。</p>
          <LxActionButtons :actions="emptyAuthActions" />
          <p class="lx-actions-demo__empty-result" role="status">
            当前没有可显示的操作
          </p>
        </div>
      </div>
    </section>

    <section class="lx-actions-demo__panel" data-testid="callback">
      <h3>onClick 回调（免父级分发）</h3>
      <div class="lx-actions-demo__row">
        <LxActionButtons :actions="callbackActions" @click="onAction" />
      </div>
    </section>

    <section class="lx-actions-demo__panel" data-testid="overflow">
      <h3>溢出菜单与事件反馈</h3>
      <div class="lx-actions-demo__row">
        <LxActionButtons
          :actions="overflowActions"
          :max="2"
          @click="onAction"
        />
      </div>
      <p class="lx-actions-demo__tip">
        权限过滤/条件显隐后数量动态变化时，「更多」入口随之自动增减；
        菜单项与外显按钮保持同一语义色。
      </p>
    </section>

    <p
      class="lx-actions-demo__status"
      data-testid="last-action"
      aria-live="polite"
    >
      {{ lastAction }}
    </p>
  </div>
</template>

<style scoped>
.lx-actions-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  color: var(--lx-text-primary);
  background: var(--lx-bg-page);
}

.lx-actions-demo__panel {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
}

.lx-actions-demo__panel h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-actions-demo__auth-comparison {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.lx-actions-demo__auth-comparison h4 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
}

.lx-actions-demo__empty-result {
  display: flex;
  align-items: center;
  min-height: var(--lx-btn-height-sm);
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary-strong);
}

.lx-actions-demo__table-scroll {
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
}

.lx-actions-demo__table-scroll:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-actions-demo__table {
  width: 100%;
  min-width: 600px;
  font-size: 12px;
  text-align: left;
  border-collapse: collapse;
}

.lx-actions-demo__table caption {
  padding: 10px 12px;
  font-weight: 600;
  color: var(--lx-text-regular);
  text-align: left;
}

.lx-actions-demo__table th,
.lx-actions-demo__table td {
  padding: 10px 12px;
  vertical-align: middle;
  border-top: 1px solid var(--lx-border);
}

.lx-actions-demo__table thead {
  color: var(--lx-text-regular);
  background: var(--lx-bg-page);
}

.lx-actions-demo__table thead th {
  font-weight: 600;
}

.lx-actions-demo__table tbody th {
  font-weight: 500;
}

.lx-actions-demo__table th:last-child,
.lx-actions-demo__table td:last-child {
  min-width: 200px;
}

.lx-actions-demo__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.lx-actions-demo__narrow-row {
  width: min(100%, 144px);
}

.lx-actions-demo__status,
.lx-actions-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary-strong);
}

@media (max-width: 520px) {
  .lx-actions-demo__auth-comparison {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
