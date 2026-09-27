<script setup lang="ts">
import { ref } from 'vue';
import { lxConfirm, lxMessage } from '../../../index';

const lastResult = ref('');

async function standard() {
  const ok = await lxConfirm({
    title: '归档该警情记录？',
    message: '归档后记录转入冷存储，仅指挥级账号可调阅。',
    confirmText: '确认归档',
  });
  lastResult.value = `标准确认 → ${ok ? '已确认' : '已取消'}`;
}

async function danger() {
  const ok = await lxConfirm({
    title: '确认解除 3 号网格警戒线？',
    message: '将同步通知 18 名执勤警力撤出封控区，该操作不可逆。',
    confirmText: '强制解除警戒',
    danger: true,
  });
  lastResult.value = `危险确认 → ${ok ? '已执行' : '已放弃'}`;
  if (ok) lxMessage.success('3 号网格警戒线已解除');
}
</script>

<template>
  <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center">
    <button class="demo-btn" @click="standard">标准确认</button>
    <button class="demo-btn demo-btn--danger" @click="danger">危险确认</button>
    <span v-if="lastResult" style="font-size: 12px; color: var(--lx-text-secondary)">
      {{ lastResult }}
    </span>
  </div>
</template>
