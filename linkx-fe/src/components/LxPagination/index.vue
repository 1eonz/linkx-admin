<script setup lang="ts">
/**
 * LxPagination — 分页器（Element Plus el-pagination 二次封装）
 * 纯受控：页码计算与请求由业务负责，样式由 token 桥接层接管
 */
import { computed, ref } from 'vue'
import { ElPagination } from 'element-plus'
import type { LxPaginationProps } from './types'
import 'element-plus/es/components/pagination/style/css'

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
  layout: undefined,
  background: false,
  ariaLabel: '分页导航',
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:page-size': [size: number]
  change: [page: number, size: number]
}>()

const paginationRef = ref<{ $el?: HTMLElement }>()

const resolvedLayout = computed(
  () =>
    props.layout ??
    [
      props.showTotal && 'total',
      props.showSize && 'sizes',
      'prev',
      'pager',
      'next',
      props.showJumper && 'jumper',
    ]
      .filter(Boolean)
      .join(', '),
)

/** 查找分页器所在的可滚动祖先，避免嵌套列表翻页时把整个页面拉回顶部。 */
function findScrollableAncestor(element: HTMLElement | undefined) {
  let parent = element?.parentElement
  while (parent && parent !== document.body) {
    const style = getComputedStyle(parent)
    const canScrollVertically = /(auto|scroll|overlay)/.test(style.overflowY)
    if (canScrollVertically && parent.scrollHeight > parent.clientHeight) {
      return parent
    }
    parent = parent.parentElement
  }
  return undefined
}

/** 切页回顶：优先定位最近的滚动容器，找不到时兼容原有窗口回顶行为。 */
function scrollToTop() {
  if (typeof window === 'undefined') return
  const mediaQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
  const reducedMotion = mediaQuery?.matches ?? false
  const behavior = reducedMotion ? 'auto' : 'smooth'
  const container = findScrollableAncestor(paginationRef.value?.$el)
  if (container && typeof container.scrollTo === 'function') {
    container.scrollTo({ top: 0, behavior })
    return
  }
  if (typeof window.scrollTo === 'function') {
    window.scrollTo({ top: 0, behavior })
  }
}

function onPage(p: number) {
  emit('update:page', p)
  emit('change', p, props.pageSize)
  if (props.autoScroll) scrollToTop()
}

function onSize(s: number) {
  emit('update:page-size', s)
  // 切换条数回到第一页（设计拍板 #5：受控 + 内置惯用法）
  if (props.autoReset) emit('update:page', 1)
  emit('change', props.autoReset ? 1 : props.page, s)
  if (props.autoScroll) scrollToTop()
}
</script>

<template>
  <nav class="lx-pagination-nav" :aria-label="ariaLabel">
    <ElPagination
      ref="paginationRef"
      class="lx-pagination"
      :class="`lx-pagination--${size}`"
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      :layout="resolvedLayout"
      :background="background"
      :small="size === 'small'"
      @update:current-page="onPage"
      @update:page-size="onSize"
    />
  </nav>
</template>

<style scoped>
.lx-pagination {
  --el-pagination-font-size: 12px;
  --el-pagination-button-width: var(--lx-control-height-sm);
  --el-pagination-button-height: var(--lx-control-height-sm);
  --el-pagination-hover-color: var(--lx-color-primary);
  --el-pagination-button-bg-color: transparent;
  --el-pagination-button-color: var(--lx-text-regular);
  --el-pagination-button-disabled-color: var(--lx-text-placeholder);
  --el-pagination-button-disabled-bg-color: var(--lx-bg-table-header);
  color: var(--lx-text-regular);
  justify-content: flex-end;
}

.lx-pagination-nav {
  min-width: 0;
  max-width: 100%;
}

.lx-pagination--default {
  --el-pagination-button-width: var(--lx-control-height-sm);
  --el-pagination-button-height: var(--lx-control-height-sm);
}

.lx-pagination--small {
  --el-pagination-font-size: 12px;
  --el-pagination-button-width: var(--lx-control-height-sm);
  --el-pagination-button-height: var(--lx-control-height-sm);
}

.lx-pagination--large {
  --el-pagination-font-size: 13px;
  --el-pagination-button-width: var(--lx-control-height-lg);
  --el-pagination-button-height: var(--lx-control-height-lg);
}

@media (max-width: 767px) {
  /* 窄屏保留紧凑布局，同时把分页操作的实际触控命中区提升到 44px。 */
  .lx-pagination :deep(.btn-prev),
  .lx-pagination :deep(.btn-next),
  .lx-pagination :deep(.el-pager li),
  .lx-pagination :deep(.el-pagination__sizes .el-select__wrapper) {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
