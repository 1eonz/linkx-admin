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
  autoReset: true,
  autoScroll: true,
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

/** 切页回顶：定位组件所在文档位置回滚（列表容器内滚动时业务可关掉自行处理） */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onPage(p: number) {
  emit('update:page', p);
  emit('change', p, props.pageSize);
  if (props.autoScroll) scrollToTop();
}

function onSize(s: number) {
  emit('update:page-size', s);
  // 切换条数回到第一页（设计拍板 #5：受控 + 内置惯用法）
  if (props.autoReset) emit('update:page', 1);
  emit('change', props.autoReset ? 1 : props.page, s);
  if (props.autoScroll) scrollToTop();
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
