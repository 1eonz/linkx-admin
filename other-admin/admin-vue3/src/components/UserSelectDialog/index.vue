<script setup lang="ts">
/**
 * UserSelectDialog - 用户多选弹窗组件
 *
 * 功能：
 * - 为角色绑定用户（adminRole/设置用户）
 * - 支持用户搜索、分页
 * - 支持多选，切换分页/搜索时保持选中状态
 * - 显示已选人数提示
 *
 * 用户选择弹窗行为：
 * - props: visible / roleId / roleName / selectedUserIds
 * - emit: update:visible / confirm
 */
import { computed, nextTick, ref, watch } from 'vue';

import { getAdminUserList, type AdminUserItem } from '@/api/authority/adminUser';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'UserSelectDialog' });

interface Props {
  visible: boolean;
  roleId?: string | number;
  roleName?: string;
  /** 已选用户 ID 数组（暂未启用回填，预留接口） */
  selectedUserIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  roleId: '',
  roleName: '',
  selectedUserIds: () => [],
});

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'confirm', users: AdminUserItem[]): void;
}>();

const innerVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

/** 搜索参数 */
const searchParams = ref<{ name: string }>({ name: '' });

/** 列表数据（受控模式） */
const list = ref<AdminUserItem[]>([]);
const total = ref(0);

const tableRef = ref<InstanceType<typeof ProTable>>();

/** 跨页选中数量 */
const selectedCount = ref(0);

/** 列定义 */
const columns = computed<ITableColumn[]>(() => [
  { prop: 'idCard', label: '用户名', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'status', label: '状态', minWidth: 80, align: 'center', slotName: 'status' },
]);

/** 弹窗标题 */
const dialogTitle = computed(() => {
  const count = selectedCount.value;
  const suffix = count > 0 ? ` (已选${count}人)` : '';
  return `设置用户 - ${props.roleName || '角色'}${suffix}`;
});

/** 监听 visible：打开时初始化 */
watch(
  () => props.visible,
  (v) => {
    if (v) {
      initDialog();
    }
  },
);

/** 初始化弹窗 */
async function initDialog(): Promise<void> {
  searchParams.value.name = '';
  selectedCount.value = 0;
  await nextTick();
  tableRef.value?.init();
}

/** ProTable @response 回调 */
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as AdminUserItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

/** 搜索 */
function handleSearch(): void {
  tableRef.value?.init();
}

/** 重置 */
function handleReset(): void {
  searchParams.value.name = '';
  tableRef.value?.init();
}

/** 选中变化 */
function handleSelectionChange(selection: AdminUserItem[]): void {
  selectedCount.value = selection.length;
}

/** 确认 */
function handleConfirm(): void {
  const selected = tableRef.value?.getSelection() as AdminUserItem[];
  emit('confirm', selected);
  handleClose();
}

/** 关闭 */
function handleClose(): void {
  innerVisible.value = false;
  searchParams.value.name = '';
  selectedCount.value = 0;
  nextTick(() => {
    tableRef.value?.clearSelection();
  });
}

/** 从 ProTable slot scope 中安全获取 AdminUserItem */
function getUser(scope: any): AdminUserItem {
  return (scope?.row as AdminUserItem) ?? ({} as AdminUserItem);
}
</script>

<template>
  <el-dialog
    v-model="innerVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    width="800px"
    align-center
    class="user-select-dialog"
    @close="handleClose"
  >
    <SearchBar
      v-model:search-key="searchParams.name"
      placeholder="请输入用户名"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="getAdminUserList"
      :data="list"
      :total="total"
      :search-params="searchParams"
      show-selection
      row-key="id"
      height="400px"
      @response="handleResponse"
      @selection-change="handleSelectionChange"
    >
      <template #status="scope">
        <el-tag :type="getUser(scope).status === 0 ? 'success' : 'danger'" size="small">
          {{ getUser(scope).status === 0 ? '正常' : '禁用' }}
        </el-tag>
      </template>
    </ProTable>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

<style lang="less">
.user-select-dialog {
  margin-top: 0 !important;
  top: 50%;
  transform: translateY(-50%);
}
</style>
