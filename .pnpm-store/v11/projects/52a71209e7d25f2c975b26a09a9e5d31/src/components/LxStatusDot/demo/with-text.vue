<script setup lang="ts">
// demo：表格状态列典型用法（showText + 等宽数值）
import { LxStatusDot, type LxStatus } from '../../../index';

const rows: { name: string; status: LxStatus; desc: string; latency: string }[] = [
  { name: '滨江网关-01', status: 'online', desc: '链路正常', latency: '12ms' },
  { name: '滨江网关-02', status: 'busy', desc: '队列积压', latency: '340ms' },
  { name: '城域节点-03', status: 'error', desc: '心跳丢失', latency: '—' },
  { name: '城域节点-04', status: 'offline', desc: '已停用', latency: '—' },
];
</script>

<template>
  <table style="border-collapse: collapse; width: 100%; font-size: 13px">
    <thead>
      <tr style="background: var(--lx-bg-table-header)">
        <th style="text-align: left; padding: 8px 12px">节点</th>
        <th style="text-align: left; padding: 8px 12px">状态</th>
        <th style="text-align: left; padding: 8px 12px">时延</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r.name" style="border-top: 1px solid var(--lx-border-light)">
        <td style="padding: 10px 12px">{{ r.name }}</td>
        <td style="padding: 10px 12px">
          <LxStatusDot :status="r.status" show-text :status-desc="r.desc" />
        </td>
        <td style="padding: 10px 12px; font-family: var(--lx-font-mono)">{{ r.latency }}</td>
      </tr>
    </tbody>
  </table>
</template>
