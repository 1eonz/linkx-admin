<script setup lang="ts">
/**
 * DockManage - 警单对接列表
 *
 * 功能特性：
 * 1. ProTable 受控模式 + SearchBar 搜索栏（支持系统名称/IP/路径搜索）
 * 2. 分页字段使用 current/size（通过 page-num-field/page-size-field 适配）
 * 3. 启用/禁用切换：el-switch + changeDockEnable 接口
 * 4. 新增/编辑调用 EditDock 弹窗，删除二次确认
 *
 * @example 父组件用法
 * ```vue
 * <DockManage />
 * ```
 */
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import EditDock from './EditDock.vue';
import { changeDockEnable, deleteDock, getDockPage, type DockItem } from '@/api/thirdInterface/policeReport';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'DockManage' });

// ===== 受控模式状态 =====
const list = ref<DockItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  systemName: '',
  ip: '',
  path: '',
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();
const editRef = ref<InstanceType<typeof EditDock>>();

// 启用/禁用切换 loading（按 id 记录）
const statusLoadingMap = reactive<Record<string, boolean>>({});

// 列定义：名称/所属系统/系统编码/访问协议/访问IP/端口/接口名称/请求方式/请求头/请求体/请求参数/执行周期/状态/操作时间/操作
const columns = computed<ITableColumn[]>(() => [
  { prop: 'name', label: '名称', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'systemName', label: '所属系统', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'systemCode', label: '系统编码', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'schema', label: '访问协议', minWidth: 100, align: 'center', showOverflowTooltip: true },
  { prop: 'ip', label: '访问IP', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'port', label: '端口', width: 90, align: 'center' },
  { prop: 'path', label: '接口名称', minWidth: 140, align: 'center', showOverflowTooltip: true },
  { prop: 'method', label: '请求方式', minWidth: 100, align: 'center', showOverflowTooltip: true },
  { prop: 'headers', label: '请求头', minWidth: 160, align: 'center', showOverflowTooltip: true },
  { prop: 'body', label: '请求体', minWidth: 160, align: 'center', showOverflowTooltip: true },
  { prop: 'params', label: '请求参数', minWidth: 160, align: 'center', showOverflowTooltip: true },
  { prop: 'executePeriod', label: '执行周期', width: 120, align: 'center', slotName: 'executePeriod' },
  { prop: 'status', label: '状态', width: 100, align: 'center', slotName: 'status' },
  { prop: 'gmtCreated', label: '操作时间', width: 180, align: 'center', showOverflowTooltip: true },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    width: 200,
    align: 'center',
    slotName: 'actions',
  },
]);

// 搜索区按钮：新增
const actions = computed(() => [{ label: '新增', type: 'primary' as const, icon: Plus, onClick: handleCreate }]);

// ===== 执行周期映射（毫秒 → 可读文本） =====
const periodMap: Record<number, string> = {
  1800000: '30 分钟',
  3600000: '1 小时',
  21600000: '6 小时',
  43200000: '12 小时',
  86400000: '24 小时',
};

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as DockItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.systemName = '';
  searchParams.ip = '';
  searchParams.path = '';
  tableRef.value?.init();
}

// 新增
function handleCreate(): void {
  editRef.value?.open('create');
}

// 编辑
function handleUpdate(row: DockItem): void {
  editRef.value?.open('update', row);
}

// 启用/禁用切换（二次确认 + 失败回滚，成功后本地更新不 refresh）
async function handleStatusChange(row: DockItem, val: 0 | 1): Promise<void> {
  if (!row.id) return;
  const title = val === 1 ? '启用' : '禁用';
  try {
    // 二次确认，用户取消则回滚 UI
    await ElMessageBox.confirm(`确认${title}吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    });
  } catch {
    row.status = val === 1 ? 0 : 1;
    return;
  }
  statusLoadingMap[row.id] = true;
  try {
    const res = await changeDockEnable({ id: row.id, status: val });
    if (res.code === 0) {
      ElMessage.success(`${title}成功`);
      // 成功后直接更新本地，避免 refresh 导致循环
      row.status = val;
    } else {
      ElMessage.error(res.msg ?? `${title}失败`);
      // 失败时回滚 UI
      row.status = val === 1 ? 0 : 1;
    }
  } catch {
    ElMessage.error(`${title}失败`);
    row.status = val === 1 ? 0 : 1;
  } finally {
    statusLoadingMap[row.id] = false;
  }
}

// 删除
function handleDelete(row: DockItem): void {
  if (!row.id) return;
  ElMessageBox.confirm(`确认删除对接「${row.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deleteDock(row.id as string)
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

/** 从 ProTable slot scope 中安全获取 DockItem */
function getRow(scope: any): DockItem {
  return (scope?.row as DockItem) ?? ({} as DockItem);
}
</script>

<template>
  <div class="dock-manage">
    <SearchBar :actions="actions" @search="handleSearch" @reset="handleReset">
      <template #filters>
        <el-input
          v-model="searchParams.systemName as string"
          placeholder="系统名称"
          class="filter-item"
          style="width: 180px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchParams.ip as string"
          placeholder="IP"
          class="filter-item"
          style="width: 160px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchParams.path as string"
          placeholder="路径"
          class="filter-item"
          style="width: 180px"
          clearable
          @keyup.enter="handleSearch"
        />
      </template>
    </SearchBar>

    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="getDockPage"
      :data="list"
      :total="total"
      :search-params="searchParams"
      page-num-field="current"
      page-size-field="size"
      @response="handleResponse"
    >
      <!-- 执行周期列 -->
      <template #executePeriod="scope">
        {{ periodMap[getRow(scope).executePeriod] ?? getRow(scope).executePeriod }}
      </template>

      <!-- 状态列：v-model 直接绑定 row.status，切换时由 handleStatusChange 处理确认/回滚 -->
      <template #status="scope">
        <el-switch
          v-model="getRow(scope).status"
          :loading="statusLoadingMap[getRow(scope).id as string]"
          active-text="启用"
          inactive-text="禁用"
          inline-prompt
          :active-value="1"
          :inactive-value="0"
          @change="(val) => handleStatusChange(getRow(scope), val as 0 | 1)"
        />
      </template>

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

    <EditDock ref="editRef" @success="tableRef?.refresh()" />
  </div>
</template>

<style lang="less" scoped>
.dock-manage {
  width: 100%;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}
</style>
