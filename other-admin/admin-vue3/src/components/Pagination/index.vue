<script setup lang="ts">
/**
 * Pagination - 列表分页组件，基于 el-pagination 二次封装，支持 v-model 双向绑定 page/limit
 *
 * 功能特性：
 * 1. 通过 v-model:page / v-model:limit 实现分页状态双向绑定
 * 2. 切换 pageSize 时自动回到第一页（符合列表页规范）
 * 3. 分页变化统一通过 pagination 事件抛出 { page, limit }，便于父组件一次性发起请求
 * 4. 支持 hidden 控制整体显隐（如数据为空时隐藏分页）
 * 5. layout 字符串可自定义布局元素（total、sizes、prev、pager、next、jumper）
 * 6. 默认提供常用 pageSizes 选项 [10, 20, 50, 100]
 *
 * @example 基础用法（v-model 双向绑定）
 * <pagination
 *   v-model:page="page"
 *   v-model:limit="limit"
 *   :total="total"
 *   @pagination="getList"
 * />
 *
 * @example 隐藏分页（如数据为空时）
 * <pagination v-model:page="page" v-model:limit="limit" :total="total" hidden />
 *
 * Props:
 * - total: number，数据总条数（必填）
 * - page: number，当前页码，默认 1
 * - limit: number，每页条数，默认 20
 * - pageSizes: number[]，每页条数可选项，默认 [10, 20, 50, 100]
 * - layout: string，分页布局字符串，默认 'total, sizes, prev, pager, next, jumper'
 * - background: boolean，是否显示分页按钮背景色，默认 true
 * - autoScroll: boolean，分页变化后是否自动滚动到列表顶部（预留，当前实现未使用），默认 true
 * - hidden: boolean，是否隐藏整个分页组件，默认 false
 *
 * Events:
 * - update:page: 页码变化时触发，参数 value: number（新页码）
 * - update:limit: 每页条数变化时触发，参数 value: number（新每页条数）
 * - pagination: 页码或每页条数变化时触发，参数 { page: number; limit: number }，父组件据此发起列表请求
 *
 * Slots:
 * - 无
 *
 * Methods（defineExpose 暴露的方法）:
 * - 无
 */
import { LxPagination } from 'lx-ui';

defineOptions({ name: 'Pagination' });

interface Props {
  total: number;
  page?: number;
  limit?: number;
  pageSizes?: number[];
  layout?: string;
  background?: boolean;
  autoScroll?: boolean;
  hidden?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  page: 1,
  limit: 20,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  autoScroll: true,
  hidden: false,
});

const emit = defineEmits<{
  (e: 'update:page', value: number): void;
  (e: 'update:limit', value: number): void;
  (e: 'pagination', value: { page: number; limit: number }): void;
}>();

// 参数顺序由库的 change(page, pageSize) 适配为业务既有对象。
function handleChange(page: number, limit: number): void {
  emit('pagination', { page, limit });
}
</script>

<template>
  <div
    v-show="!hidden"
    class="pagination-wrapper"
    role="region"
    tabindex="0"
    aria-label="列表分页，可横向滚动查看全部控件"
  >
    <LxPagination
      :page="props.page"
      :page-size="props.limit"
      :total="total"
      :page-sizes="pageSizes"
      :layout="layout"
      :background="background"
      :auto-scroll="false"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:limit', $event)"
      @change="handleChange"
    />
  </div>
</template>

<style lang="less" scoped>
.pagination-wrapper {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  padding: 8px 0;
  overscroll-behavior-inline: contain;

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  :deep(.lx-pagination) {
    width: max-content;
    min-width: 100%;
  }
}
</style>
