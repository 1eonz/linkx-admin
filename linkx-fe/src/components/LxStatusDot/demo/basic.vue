<script setup lang="ts">
// demo：基础用法 — 五种状态，online 默认呼吸动画
import { LxStatusDot, type LxStatus } from '../../../index';

const states: { status: LxStatus; label: string }[] = [
  { status: 'online', label: '在线/正常' },
  { status: 'processing', label: '处理中/流转中' },
  { status: 'busy', label: '忙碌/临时离岗' },
  { status: 'error', label: '错误/断开' },
  { status: 'offline', label: '离线/停用' },
];
</script>

<template>
  <div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap">
    <span v-for="s in states" :key="s.status" style="display: inline-flex; align-items: center; gap: 8px">
      <LxStatusDot :status="s.status" />
      <span>{{ s.label }}</span>
    </span>
  </div>
</template>
