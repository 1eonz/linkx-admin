<script setup lang="ts">
/**
 * TypeManage - 警单类型管理列表
 *
 * 功能特性：
 * 1. ProTable 受控模式 + SearchBar 搜索栏（按 tag 模糊搜索）
 * 2. 分页字段使用 pagenum/pagesize（小写，通过 page-num-field/page-size-field 适配）
 * 3. 新增/编辑调用 TypeEdit 弹窗，删除二次确认
 *
 * @example 父组件用法
 * ```vue
 * <TypeManage />
 * ```
 */
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import TypeEdit from './TypeEdit.vue';
import {
  deletePolicetickettype,
  getPolicetickettypesPage,
  type PoliceticketTypeItem,
} from '@/api/thirdInterface/policeReport';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'TypeManage' });

// ===== 受控模式状态 =====
const list = ref<PoliceticketTypeItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  tag: '',
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();
const editRef = ref<InstanceType<typeof TypeEdit>>();

// 列定义：标签/创建时间/操作
const columns = computed<ITableColumn[]>(() => [
  { prop: 'tag', label: '类型标签', minWidth: 200, align: 'center', showOverflowTooltip: true },
  { prop: 'gmtCreated', label: '创建时间', width: 200, align: 'center', showOverflowTooltip: true },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    width: 180,
    align: 'center',
    slotName: 'actions',
  },
]);

// 搜索区按钮：新增
const actions = computed(() => [{ label: '新增', type: 'primary' as const, icon: Plus, onClick: handleCreate }]);

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as PoliceticketTypeItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.tag = '';
  tableRef.value?.init();
}

// 新增
function handleCreate(): void {
  editRef.value?.open('create');
}

// 编辑
function handleUpdate(row: PoliceticketTypeItem): void {
  editRef.value?.open('update', row);
}

// 删除
function handleDelete(row: PoliceticketTypeItem): void {
  if (!row.id) return;
  ElMessageBox.confirm(`确认删除类型「${row.tag}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deletePolicetickettype(row.id as string)
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success('删除成功');
            tableRef.value?.refresh();
          } else {
            ElMessage.error(result.msg ?? '删除失败');
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/** 从 ProTable slot scope 中安全获取 PoliceticketTypeItem */
function getRow(scope: any): PoliceticketTypeItem {
  return (scope?.row as PoliceticketTypeItem) ?? ({} as PoliceticketTypeItem);
}
</script>

<template>
  <div class="type-manage">
    <SearchBar :actions="actions" @search="handleSearch" @reset="handleReset">
      <template #filters>
        <el-input
          v-model="searchParams.tag as string"
          placeholder="类型标签"
          class="filter-item"
          style="width: 220px"
          clearable
          @keyup.enter="handleSearch"
        />
      </template>
    </SearchBar>

    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="getPolicetickettypesPage"
      :data="list"
      :total="total"
      :search-params="searchParams"
      page-num-field="pagenum"
      page-size-field="pagesize"
      @response="handleResponse"
    >
      <!-- 操作列 -->
      <template #actions="scope">
        <ActionButtons
          :buttons="[
            { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleUpdate(getRow(scope)) },
            { type: 'danger', icon: Delete, label: '删除', onClick: () => handleDelete(getRow(scope)) },
          ]"
        />
      </template>
    </ProTable>

    <TypeEdit ref="editRef" @success="tableRef?.refresh()" />
  </div>
</template>

<style lang="less" scoped>
.type-manage {
  width: 100%;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}
</style>
