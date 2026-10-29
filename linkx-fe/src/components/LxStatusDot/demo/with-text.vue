<script setup lang="ts">
import { LxStatusDot, type LxStatus } from '../../../index'
const rows: {
  name: string
  status: LxStatus
  desc: string
  latency: string
}[] = [
  { name: '滨江网关-01', status: 'online', desc: '链路正常', latency: '12ms' },
  { name: '滨江网关-02', status: 'busy', desc: '队列积压', latency: '340ms' },
  { name: '城域节点-03', status: 'error', desc: '心跳丢失', latency: '—' },
  { name: '城域节点-04', status: 'offline', desc: '已停用', latency: '—' },
]
</script>
<template>
  <div
    class="lx-status-table"
    role="region"
    aria-label="节点状态表，可横向滚动"
    tabindex="0"
  >
    <table>
      <thead>
        <tr>
          <th scope="col">节点</th>
          <th scope="col">状态</th>
          <th scope="col">时延</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.name">
          <td>{{ row.name }}</td>
          <td>
            <LxStatusDot
              :status="row.status"
              show-text
              :status-desc="row.desc"
              :pulse="false"
            />
          </td>
          <td class="lx-status-table__latency">{{ row.latency }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
.lx-status-table {
  max-width: 100%;
  overflow: auto;
}
.lx-status-table:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}
.lx-status-table table {
  display: table;
  width: 100%;
  min-width: 400px;
  margin: 0;
  border-collapse: collapse;
  font-size: 13px;
}
.lx-status-table tr,
.lx-status-table tr:nth-child(2n) {
  background: var(--lx-bg-card);
}
.lx-status-table th,
.lx-status-table td {
  padding: var(--lx-space-sm) var(--lx-space-md);
  border: 0;
  border-bottom: 1px solid var(--lx-border-light);
  color: var(--lx-text-regular);
  text-align: start;
  white-space: nowrap;
}
.lx-status-table th {
  background: var(--lx-bg-table-header);
  color: var(--lx-text-primary);
}
.lx-status-table__latency {
  font-family: var(--lx-font-mono);
  font-variant-numeric: tabular-nums;
}
</style>
