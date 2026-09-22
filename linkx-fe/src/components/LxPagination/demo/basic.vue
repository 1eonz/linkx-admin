<script setup lang="ts">
// demo：LxPagination 完整能力（总数/条数/跳页）
import { ref } from 'vue';
import { LxPagination } from '../../../index';
const page = ref(1), pageSize = ref(10), total = 365;
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:16px">
    <LxPagination v-model:page="page" v-model:page-size="pageSize" :total="total" show-jumper />
    <p style="font-size:12px;color:var(--lx-text-secondary)">当前：第 {{ page }} 页 / 每页 {{ pageSize }} 条</p>
  </div>
</template>
