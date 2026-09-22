<script setup lang="ts">
/**
 * 位置信息管理
 *
 * 功能：
 * - 分页查询位置列表（按组织名称搜索）
 * - 新增/编辑位置（组织 + 经纬度，经纬度需通过格式和范围校验）
 * - 删除位置
 */
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import EditLocation from './components/EditLocation.vue';
import { deleteLocation, getLocationList, type LocationItem } from '@/api/resource/location';
import ActionButtons from '@/components/ActionButtons/index.vue';
import ModernCard from '@/components/ModernCard/index.vue';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';
import { hasBtnPermission } from '@/composables/usePermission';

defineOptions({ name: 'Location' });

// ===== 受控模式状态 =====
const list = ref<LocationItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  deptName: '',
  deptCode: '',
});

const tableRef = ref<InstanceType<typeof ProTable>>();
const editRef = ref<InstanceType<typeof EditLocation>>();

// ===== 列定义 =====
const columns: ITableColumn[] = [
  { prop: 'departmentName', label: '组织名称', minWidth: 100, showOverflowTooltip: true },
  { prop: 'location', label: '经纬度', minWidth: 60, showOverflowTooltip: true },
  { prop: 'actions', label: '操作', width: 200, align: 'center', slotName: 'actions', fixed: 'right' },
];

// ===== 权限 =====
const canCreate = computed(() => hasBtnPermission('/admin/role/create'));
const canUpdate = computed(() => hasBtnPermission('/admin/role/update'));
const canDelete = computed(() => hasBtnPermission('/admin/role/delete'));

// ===== 搜索区按钮 =====
const actions = computed(() => [
  {
    key: 'create',
    label: '新增',
    type: 'primary' as const,
    icon: Plus,
    onClick: handleCreate,
    visible: canCreate.value,
  },
]);

// ===== 弹窗状态 =====
const dialogVisible = ref(false);

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as LocationItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.deptName = '';
  searchParams.deptCode = '';
  tableRef.value?.init();
}

/** OrgTreeSelect 节点选中 */
function handleDeptChange(data: { code?: string; name?: string }): void {
  searchParams.deptCode = data?.code ?? '';
  searchParams.deptName = data?.name ?? '';
}

/** OrgTreeSelect 清空 */
function handleDeptClear(): void {
  searchParams.deptCode = '';
  searchParams.deptName = '';
}

// ===== 新增 =====
function handleCreate(): void {
  editRef.value?.init();
}

// ===== 编辑 =====
function handleUpdate(row: LocationItem): void {
  editRef.value?.init(row);
}

// ===== 删除 =====
function handleDelete(row: LocationItem): void {
  ElMessageBox.confirm('确认删除吗？', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => deleteLocation(row.id))
    .then((result) => {
      if (!result || result.code !== 0) {
        ElMessage.error(result?.msg || '删除失败');
        return;
      }
      ElMessage.success('删除成功');
      tableRef.value?.refresh();
    })
    .catch(() => {});
}

// ===== 弹窗提交成功 =====
function handleSuccess(): void {
  tableRef.value?.refresh();
}

/** 从 ProTable slot scope 中安全获取 LocationItem */
function getRow(scope: any): LocationItem {
  return (scope?.row as LocationItem) ?? ({} as LocationItem);
}
</script>

<template>
  <div class="app-container">
    <ModernCard class="page-card">
      <SearchBar :actions="actions" @search="handleSearch" @reset="handleReset">
        <template #filters>
          <OrgTreeSelect
            v-model="searchParams.deptName as string"
            placeholder="请选择组织"
            width="220px"
            @current-change="handleDeptChange"
            @clear-val="handleDeptClear"
          />
        </template>
      </SearchBar>

      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="getLocationList"
        :data="list"
        :total="total"
        :search-params="searchParams"
        show-index
        @response="handleResponse"
      >
        <template #actions="scope">
          <ActionButtons
            :buttons="[
              {
                type: 'primary',
                icon: Edit,
                label: '编辑',
                visible: canUpdate,
                onClick: () => handleUpdate(getRow(scope)),
              },
              {
                type: 'danger',
                icon: Delete,
                label: '删除',
                visible: canDelete,
                onClick: () => handleDelete(getRow(scope)),
              },
            ]"
          />
        </template>
      </ProTable>
    </ModernCard>

    <EditLocation ref="editRef" v-model:visible="dialogVisible" @success="handleSuccess" />
  </div>
</template>

<style lang="less" scoped>
// ModernCard 已提供 .modern-card 基础样式（border + radius + padding + shadow）
// 此处补充页面级容器行为：高度撑满 + 滚动
.page-card {
  height: 100%;
  overflow-y: auto;
}
</style>
