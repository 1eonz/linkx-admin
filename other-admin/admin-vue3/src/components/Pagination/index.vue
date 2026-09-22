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
import { computed } from 'vue';

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

const currentPage = computed({
  get: () => props.page,
  set: (v: number) => {
    emit('update:page', v);
    emit('pagination', { page: v, limit: props.limit });
  },
});

const pageSize = computed({
  get: () => props.limit,
  set: (v: number) => {
    // 切换 pageSize 时回到第一页（与业务规则一致）
    emit('update:limit', v);
    emit('update:page', 1);
    emit('pagination', { page: 1, limit: v });
  },
});
</script>

<template>
  <div v-show="!hidden" class="pagination-wrapper">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="pageSizes"
      :layout="layout"
      :background="background"
      :hide-on-single-page="false"
    />
  </div>
</template>

<style lang="less" scoped>
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}
</style>
