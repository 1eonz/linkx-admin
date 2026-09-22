<script setup lang="ts">
/**
 * 轮播图管理
 *
 * 功能：
 * - 分页查询轮播图列表（按标题模糊搜索）
 * - 新增/编辑轮播图（图片上传 + 公众号/文章联动）
 * - 删除轮播图（单条）
 *
 * 列表表格展示：轮播图（AuthImg 鉴权图片）/ 标题 / 跳转链接 / 排序值 / 操作
 * 表单弹窗：见 components/CarouselForm.vue
 */
import { Delete, Edit, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import CarouselForm from './components/CarouselForm.vue';
import { deleteCarousel, getCarouselPage, type CarouselItem } from '@/api/h5/carousel';
import ActionButtons from '@/components/ActionButtons/index.vue';
import AuthImg from '@/components/AuthImg/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'Carousel' });

// ===== 受控模式状态 =====
const list = ref<CarouselItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  title: '',
});

const tableRef = ref<InstanceType<typeof ProTable>>();
const formRef = ref<InstanceType<typeof CarouselForm>>();

// ===== 列定义 =====
const columns: ITableColumn[] = [
  { prop: 'pciUrl', label: '轮播图', width: 300, align: 'center', slotName: 'pciUrl' },
  { prop: 'title', label: '标题', minWidth: 150, showOverflowTooltip: true },
  { prop: 'url', label: '跳转链接', minWidth: 200, showOverflowTooltip: true },
  { prop: 'sort', label: '排序值', width: 80, align: 'center' },
  { prop: 'operation', label: '操作', width: 200, align: 'center', slotName: 'operation' },
];

// ===== 搜索区按钮 =====
const actions = computed(() => [
  { key: 'create', label: '新增', type: 'primary' as const, icon: Plus, onClick: handleCreate },
]);

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as CarouselItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.title = '';
  tableRef.value?.init();
}

// ===== 新增 =====
function handleCreate(): void {
  formRef.value?.open('create');
}

// ===== 编辑 =====
function handleUpdate(row: CarouselItem): void {
  formRef.value?.open('update', row.id);
}

// ===== 删除 =====
function handleDelete(row: CarouselItem): void {
  ElMessageBox.confirm(`确定删除轮播图「${row.title ?? ''}」？删除后将无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => deleteCarousel(row.id))
    .then(({ code, msg }) => {
      if (code !== 0) {
        ElMessage.error(msg || '删除失败，请重试');
        return;
      }
      ElMessage.success('删除成功');
      tableRef.value?.refresh();
    })
    .catch(() => {});
}

// ===== 表单提交成功后刷新 =====
function handleSuccess(): void {
  tableRef.value?.refresh();
}

/** 从 ProTable slot scope 中安全获取 CarouselItem */
function getRow(scope: any): CarouselItem {
  return (scope?.row as CarouselItem) ?? ({} as CarouselItem);
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <SearchBar
        v-model:search-key="searchParams.title as string"
        placeholder="标题"
        :actions="actions"
        @search="handleSearch"
        @reset="handleReset"
      />

      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="getCarouselPage"
        :data="list"
        :total="total"
        :search-params="searchParams"
        show-index
        index-label="序号"
        :index-width="80"
        @response="handleResponse"
      >
        <!-- 轮播图列：AuthImg 鉴权渲染 -->
        <template #pciUrl="scope">
          <AuthImg v-if="getRow(scope).pciUrl" :auth-src="getRow(scope).pciUrl as string" class="head-shot" />
        </template>

        <!-- 操作列 -->
        <template #operation="scope">
          <ActionButtons
            :buttons="[
              { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleUpdate(getRow(scope)) },
              { type: 'danger', icon: Delete, label: '删除', onClick: () => handleDelete(getRow(scope)) },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <!-- 表单弹窗 -->
    <CarouselForm ref="formRef" @success="handleSuccess" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

:deep(.head-shot) {
  width: 170px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}
</style>
