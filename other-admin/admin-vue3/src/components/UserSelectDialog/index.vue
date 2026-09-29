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
  submitting?: boolean;
  /** 已选用户 ID 数组，用于打开弹窗时回显已有绑定 */
  selectedUserIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  roleId: '',
  roleName: '',
  submitting: false,
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
/** 跨页保存的用户行；初始化时只有 ID 的成员以占位行保留 */
const selectedUsers = ref(new Map<string, AdminUserItem>());

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
  selectedUsers.value = new Map(
    props.selectedUserIds.map((id) => [String(id), { id: String(id), idCard: '', status: 0 }]),
  );
  selectedCount.value = selectedUsers.value.size;
  await nextTick();
  tableRef.value?.init();
}

/** ProTable @response 回调 */
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as AdminUserItem[];
  total.value = defaultTableFormatter.getTotal(res);
  nextTick(() => {
    list.value.forEach((user) => {
      if (selectedUsers.value.has(String(user.id))) {
        selectedUsers.value.set(String(user.id), user);
        tableRef.value?.toggleRowSelection(user, true);
      }
    });
    selectedCount.value = selectedUsers.value.size;
  });
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
  const selectedIds = new Set(selection.map((user) => String(user.id)));
  list.value.forEach((user) => {
    const id = String(user.id);
    if (selectedIds.has(id)) selectedUsers.value.set(id, user);
    else selectedUsers.value.delete(id);
  });
  selection.forEach((user) => selectedUsers.value.set(String(user.id), user));
  selectedCount.value = selectedUsers.value.size;
}

/** 确认 */
function handleConfirm(): void {
  if (props.submitting) return;
  const selected = [...selectedUsers.value.values()];
  emit('confirm', selected);
}

/** 关闭 */
function handleClose(): void {
  innerVisible.value = false;
  searchParams.value.name = '';
  selectedUsers.value.clear();
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
    :close-on-press-escape="!props.submitting"
    :show-close="!props.submitting"
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
      reserve-selection
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
        <el-button :disabled="props.submitting" @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :disabled="props.submitting"
          :loading="props.submitting"
          :aria-busy="props.submitting ? 'true' : undefined"
          @click="handleConfirm"
        >
          确定
        </el-button>
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
