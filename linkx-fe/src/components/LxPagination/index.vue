<script setup lang="ts">
/**
 * LxPagination — 分页器（Element Plus el-pagination 二次封装）
 * 纯受控：页码计算与请求由业务负责，样式由 token 桥接层接管
 */
import { computed } from 'vue';
import { ElPagination } from 'element-plus';
import type { LxPaginationProps } from './types';
import 'element-plus/es/components/pagination/style/css';

const props = withDefaults(defineProps<LxPaginationProps>(), {
  page: 1,
  pageSize: 10,
  total: 0,
  pageSizes: () => [10, 20, 50, 100],
  showSize: true,
  showTotal: true,
  showJumper: false,
  size: 'default',
});

const emit = defineEmits<{
  'update:page': [page: number];
  'update:page-size': [size: number];
  change: [page: number, size: number];
}>();

const layout = computed(() =>
  [
    props.showTotal && 'total',
    props.showSize && 'sizes',
    'prev',
    'pager',
    'next',
    props.showJumper && 'jumper',
  ]
    .filter(Boolean)
    .join(', ')
);

function onPage(p: number) {
  emit('update:page', p);
  emit('change', p, props.pageSize);
}

function onSize(s: number) {
  emit('update:page-size', s);
  emit('update:page', 1); // 切换条数回到第一页
  emit('change', 1, s);
}
</script>

<template>
  <ElPagination
    class="lx-pagination"
    :current-page="page"
    :page-size="pageSize"
    :page-sizes="pageSizes"
    :total="total"
    :layout="layout"
    :small="size === 'small'"
    @update:current-page="onPage"
    @update:page-size="onSize"
  />
</template>

<style scoped>
.lx-pagination {
  --el-pagination-font-size: 12px;
  --el-pagination-button-width: 32px;
  --el-pagination-button-height: var(--lx-control-height);
  --el-pagination-hover-color: var(--lx-color-primary);
  color: var(--lx-text-regular);
  justify-content: flex-end;
}
</style>
