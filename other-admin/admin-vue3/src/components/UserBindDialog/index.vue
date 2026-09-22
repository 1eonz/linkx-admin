<script setup lang="ts">
/**
 * UserBindDialog - 用户单选绑定弹窗
 *
 * 功能特性：
 * - 用于管理员绑定警员（单选模式）
 * - 支持用户搜索、分页
 * - 表格最后一列显示"绑定/解绑"按钮
 * - 支持显示已绑定用户信息卡片
 * - 基于 ProTable 受控模式 + SearchBar 封装
 *
 * @example 基础用法
 * ```vue
 * <UserBindDialog v-model:visible="dialogVisible" :bind-user="bindUserInfo" @bind-refresh="handleBindSuccess" @unbind="handleUnbindSuccess" />
 * ```
 */
import { Delete, Link, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

import {
  bindUser as bindUserApi,
  getAvailableUsers,
  unbindUser as unbindUserApi,
  type AvailableUserItem,
  type BindUserInfo,
} from '@/api/authority/customDepartment';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'UserBindDialog' });

const props = defineProps<{
  /** 弹窗显隐 v-model */
  visible: boolean;
  /** 当前绑定的用户信息 */
  bindUser: BindUserInfo | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'bindRefresh'): void;
  (e: 'unbind'): void;
}>();

// 弹窗 v-model
const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

// ===== 受控模式状态 =====
const userList = ref<AvailableUserItem[]>([]);
const userTotal = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  name: '',
});
const tableRef = ref<InstanceType<typeof ProTable>>();

// ===== 加载状态 =====
const bindLoading = ref(false);
const unbindLoading = ref(false);

// ===== 列配置 =====
const columns: ITableColumn[] = [
  { prop: 'name', label: '姓名', minWidth: 120, showOverflowTooltip: true },
  { prop: 'idCard', label: '身份证号', minWidth: 180, showOverflowTooltip: true },
  { prop: 'departmentName', label: '组织名称', minWidth: 150, showOverflowTooltip: true },
  { prop: 'departmentCode', label: '组织编码', minWidth: 120, showOverflowTooltip: true },
  { prop: 'action', label: '操作', width: 100, align: 'center', slotName: 'action', fixed: 'right' },
];

// 是否已绑定用户
const isBound = computed(() => Boolean(props.bindUser && props.bindUser.imUserName));

// ===== ProTable fetchApi 包装 =====
async function fetchUserList(params: Record<string, unknown>): Promise<unknown> {
  const pageNum = Number(params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  return getAvailableUsers({
    pageNum,
    pageSize,
    name: String(searchParams.name ?? ''),
  });
}

function handleResponse(res: unknown): void {
  userList.value = defaultTableFormatter.getRecords(res) as AvailableUserItem[];
  userTotal.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.name = '';
  tableRef.value?.init();
}

// ===== 绑定确认 =====
function handleBindConfirm(row: AvailableUserItem): void {
  if (bindLoading.value) return;
  ElMessageBox.confirm(`确定绑定警员"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      bindLoading.value = true;
      try {
        const res = await bindUserApi({ imUserId: row.id });
        if (!res || res.code !== 0) {
          ElMessage.error(res?.msg ?? '绑定失败');
          return;
        }
        ElMessage.success('绑定成功');
        emit('bindRefresh');
        // 刷新列表（标记当前行为已绑定）
        tableRef.value?.refresh();
      } catch (e) {
        ElMessage.error('绑定失败');
      } finally {
        bindLoading.value = false;
      }
    })
    .catch(() => {});
}

// ===== 解绑确认 =====
function handleUnbindConfirm(): void {
  if (unbindLoading.value) return;
  const userName = props.bindUser?.imUserName || '该警员';
  ElMessageBox.confirm(`确定解绑警员"${userName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      unbindLoading.value = true;
      try {
        const res = await unbindUserApi();
        if (!res || res.code !== 0) {
          ElMessage.error(res?.msg ?? '解绑失败');
          return;
        }
        ElMessage.success('解绑成功');
        emit('unbind');
        // 刷新列表
        tableRef.value?.refresh();
      } catch (e) {
        ElMessage.error('解绑失败');
      } finally {
        unbindLoading.value = false;
      }
    })
    .catch(() => {});
}

// ===== 弹窗打开时初始化 =====
watch(
  () => props.visible,
  (val) => {
    if (val) {
      searchParams.name = '';
      // ProTable immediate=true 会自动触发首次加载
    }
  },
);

/** 从 ProTable slot scope 中安全获取行数据 */
function getRow(scope: any): AvailableUserItem {
  return (scope?.row as AvailableUserItem) ?? ({} as AvailableUserItem);
}

/** 判断当前行是否为已绑定用户 */
function isBoundRow(row: AvailableUserItem): boolean {
  return Boolean(props.bindUser && props.bindUser.imUserId === row.id);
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="绑定警员"
    :close-on-click-modal="false"
    width="800px"
    align-center
    append-to-body
  >
    <!-- 已绑定用户信息卡片 -->
    <div v-if="isBound" class="bind-user-card">
      <div class="card-header">
        <span class="card-title">当前绑定警员</span>
        <el-button
          type="danger"
          link
          :icon="Delete"
          :loading="unbindLoading"
          :disabled="unbindLoading"
          @click="handleUnbindConfirm"
        >
          解绑
        </el-button>
      </div>
      <div class="card-content">
        <div class="info-item">
          <span class="label">姓名：</span>
          <span class="value">{{ bindUser?.imUserName || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">账号：</span>
          <span class="value">{{ bindUser?.imUserId || bindUser?.id || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <SearchBar
      v-model:search-key="searchParams.name as string"
      placeholder="请输入用户姓名"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 用户列表表格 -->
    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="fetchUserList"
      :data="userList"
      :total="userTotal"
      :search-params="searchParams"
      @response="handleResponse"
    >
      <template #action="scope">
        <template v-if="isBoundRow(getRow(scope))">
          <el-button
            type="danger"
            link
            :icon="Delete"
            :loading="unbindLoading"
            :disabled="unbindLoading"
            @click="handleUnbindConfirm"
          >
            解绑
          </el-button>
        </template>
        <template v-else>
          <el-button
            type="primary"
            link
            :icon="Link"
            :loading="bindLoading"
            :disabled="bindLoading"
            @click="handleBindConfirm(getRow(scope))"
          >
            绑定
          </el-button>
        </template>
      </template>
    </ProTable>
  </el-dialog>
</template>

<style lang="less" scoped>
// 已绑定用户卡片
.bind-user-card {
  margin-bottom: @spacing-md;
  padding: 12px 16px;
  background: @color-success-light-9;
  border-radius: @radius-sm;
  border: 1px solid fade(@color-success, 30%);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: @spacing-sm;

    .card-title {
      font-size: @font-size-md;
      font-weight: @font-weight-semibold;
      color: @color-success;
    }
  }

  .card-content {
    display: flex;
    gap: @spacing-xl;

    .info-item {
      font-size: @font-size-sm;

      .label {
        color: @color-text-secondary;
      }

      .value {
        color: @color-text-primary;
      }
    }
  }
}
</style>
