<script setup lang="ts">
import { Delete, Download, Plus, RefreshRight } from '@element-plus/icons-vue';
import { computed, reactive } from 'vue';
import type { Component } from 'vue';

import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'ColSearch' });

const props = withDefaults(
  defineProps<{
    /** 是否主列表（colManage 用 true，记录页用 false） */
    isMain?: boolean;
    /** 是否管理员（用于 getQueryParams 兜底 orgId） */
    isAdmin?: boolean;
    /** 非管理员时兜底的 orgIds */
    orgIds?: string;
    /** 是否启用部门同步（DEPARTMENT_SYNC_SIGN） */
    departmentSyncSign?: boolean;
    /** 同步按钮 loading */
    syncLoading?: boolean;
    /** 是否隐藏同步按钮 */
    hiddenSync?: boolean;
  }>(),
  {
    isMain: false,
    isAdmin: false,
    orgIds: '',
    departmentSyncSign: false,
    syncLoading: false,
    hiddenSync: true,
  },
);

const emit = defineEmits<{
  (e: 'query', params: Record<string, unknown>): void;
  (e: 'reset'): void;
  (e: 'open', type: string): void;
  (e: 'sync'): void;
  (e: 'del-batch'): void;
  (e: 'export', params: Record<string, unknown>): void;
}>();

/** 搜索参数 */
interface SearchParams {
  postName: string;
  orgId: string;
  orgName: string;
  relatedUserNames: string;
  startTime: string;
  endTime: string;
  [key: string]: unknown;
}

const queryParams = reactive({
  postName: '',
  orgName: '',
  orgId: '',
  relatedUserNames: '',
  time: [] as string[],
});

// 组织树当前选中节点
function organizationCurrentChange(data: { id?: string; name?: string; code?: string }): void {
  queryParams.orgId = data.id ?? '';
  queryParams.orgName = data.name ?? '';
}

function cleanOrganizationInput(): void {
  queryParams.orgId = '';
  queryParams.orgName = '';
}

/** 获取查询参数：合并非管理员 orgId 兜底 */
function getQueryParams(): SearchParams {
  const { postName, relatedUserNames, time } = queryParams;
  let orgId = queryParams.orgId;
  if (!props.isAdmin && props.orgIds) {
    orgId = orgId || props.orgIds;
  }
  return {
    postName,
    orgId,
    orgName: queryParams.orgName,
    relatedUserNames,
    startTime: time && time.length > 0 ? time[0] : '',
    endTime: time && time.length > 1 ? time[1] : '',
  };
}

// 搜索
function handleQuery(): void {
  emit('query', getQueryParams());
}

/** 重置：清空字段 + cleanOrganizationInput，再 emit reset */
function handleReset(): void {
  queryParams.postName = '';
  queryParams.orgName = '';
  queryParams.orgId = '';
  queryParams.relatedUserNames = '';
  queryParams.time = [];
  emit('reset');
}

// 新增
function handleOpen(): void {
  emit('open', 'create');
}

// 数据同步
function handleSync(): void {
  emit('sync');
}

// 批量删除
function handleDelBatch(): void {
  emit('del-batch');
}

// 导出
function handleExport(): void {
  emit('export', getQueryParams());
}

// 右侧 actions 配置（根据 isMain 切换）
interface ActionItem {
  label: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  icon?: Component;
  onClick?: () => void;
  disabled?: boolean;
  visible?: boolean;
}

const actions = computed<ActionItem[]>(() => {
  const list: ActionItem[] = [];
  if (props.isMain) {
    list.push({
      label: '新增',
      type: 'primary',
      icon: Plus,
      onClick: handleOpen,
    });
    // 数据同步按钮：永远隐藏（保留兼容字段）
    if (!props.hiddenSync && false) {
      list.push({
        label: '数据同步',
        type: 'primary',
        icon: RefreshRight,
        onClick: handleSync,
        disabled: props.syncLoading,
      });
    }
    list.push({
      label: '批量删除',
      type: 'danger',
      icon: Delete,
      onClick: handleDelBatch,
    });
  } else {
    list.push({
      label: '导出',
      type: 'info',
      icon: Download,
      onClick: handleExport,
    });
  }
  return list;
});

/** 暴露给父组件 */
defineExpose({
  handleQuery,
  getQueryParams,
});
</script>

<template>
  <SearchBar :actions="actions" @search="handleQuery" @reset="handleReset">
    <template #filters>
      <el-input
        v-model="queryParams.postName"
        placeholder="协同岗名称"
        class="filter-item"
        style="width: 180px"
        clearable
        @keyup.enter="handleQuery"
      />
      <OrgTreeSelect
        v-model="queryParams.orgName"
        :is-init-value="false"
        :department-code="departmentSyncSign ? '' : ''"
        placeholder="所属组织"
        class="filter-item"
        width="180px"
        @clear-val="cleanOrganizationInput"
        @current-change="organizationCurrentChange"
      />
      <el-input
        v-model="queryParams.relatedUserNames"
        placeholder="关联人员"
        class="filter-item"
        style="width: 180px"
        clearable
        @keyup.enter="handleQuery"
      />
      <el-date-picker
        v-model="queryParams.time"
        type="daterange"
        range-separator="-"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        class="filter-item"
        value-format="YYYY-MM-DD"
        style="display: inline-flex; align-items: center; width: 250px"
        @change="handleQuery"
      />
    </template>
  </SearchBar>
</template>

<style lang="less" scoped>
// 让 filters 插槽内的项之间保持 8px 间距，与 SearchBar gap 对齐
:deep(.filter-item) {
  margin-right: 8px;
}
</style>
