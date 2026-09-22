<script setup lang="ts">
/**
 * PoliceSelectDialog - 警员选择弹窗（简化版）
 *
 * 功能特性：
 * 1. 基于 ProTable 跨页多选（row-key + reserve-selection）
 * 2. 搜索条件：姓名、身份证号、组织（OrgTreeSelect）
 * 3. 内置分页，可清空、可重置
 * 4. 通过 visible (v-model) 控制显隐，confirm 事件回传选中警员
 *
 * @example
 * <PoliceSelectDialog v-model:visible="visible" :node-id="nodeId" :node-name="nodeName" @confirm="onConfirm" />
 */
import { Search } from '@element-plus/icons-vue';
import { computed, reactive, ref, watch } from 'vue';

import type { AvailableUserItem } from '@/api/authority/customDepartment';
import { getAvailableUsers } from '@/api/authority/customDepartment';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'PoliceSelectDialog' });

interface Props {
  /** 显隐控制（v-model） */
  visible: boolean;
  /** 当前绑定节点 id */
  nodeId: string;
  /** 当前绑定节点名称（用于弹窗标题展示） */
  nodeName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  nodeName: '',
});

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  /** 确认选择，参数为选中的警员数组 */
  (e: 'confirm', selected: AvailableUserItem[]): void;
}>();

// ===== 内部显隐（v-model:visible 代理） =====
const dialogVisible = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
});

// ===== 受控模式状态 =====
const list = ref<AvailableUserItem[]>([]);
const total = ref(0);
const selected = ref<AvailableUserItem[]>([]);

// 搜索参数
const searchParams = reactive<Record<string, unknown>>({
  name: '',
  idCard: '',
  departmentName: '',
  departmentCode: '',
  privString: '',
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();

// 标题
const dialogTitle = computed(() => `绑定警员${props.nodeName ? ` - ${props.nodeName}` : ''}`);

// 列配置
const columns: ITableColumn[] = [
  { prop: 'name', label: '姓名', minWidth: 100, showOverflowTooltip: true },
  { prop: 'idCard', label: '身份证号', minWidth: 160, showOverflowTooltip: true },
  { prop: 'mobile', label: '联系电话', minWidth: 120, showOverflowTooltip: true },
  { prop: 'departmentName', label: '所属组织', minWidth: 140, showOverflowTooltip: true },
];

// ===== ProTable fetchApi =====
async function fetchAvailableUsers(params: Record<string, unknown>): Promise<unknown> {
  const pageNum = Number(params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  return getAvailableUsers({
    pageNum,
    pageSize,
    name: String(searchParams.name ?? ''),
    idCard: String(searchParams.idCard ?? ''),
    departmentCode: String(searchParams.departmentCode ?? ''),
    privString: String(searchParams.privString ?? ''),
  });
}

// ===== @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as AvailableUserItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// 选中变化
function handleSelectionChange(rows: AvailableUserItem[]): void {
  selected.value = rows;
}

// 搜索
function handleSearch(): void {
  tableRef.value?.init();
}

// 重置
function handleReset(): void {
  searchParams.name = '';
  searchParams.idCard = '';
  searchParams.departmentName = '';
  searchParams.departmentCode = '';
  searchParams.privString = '';
  tableRef.value?.init();
}

// 组织选择回调
function organizationCurrentChange(data: unknown): void {
  const dept = data as { code?: string; name?: string; id?: string };
  searchParams.departmentCode = dept.code || '';
  searchParams.departmentName = dept.name || '';
  searchParams.privString = dept.id || '';
}

// 清空组织
function cleanOrganizationInput(): void {
  searchParams.departmentName = '';
  searchParams.departmentCode = '';
  searchParams.privString = '';
}

// 确认
function handleConfirm(): void {
  emit('confirm', selected.value);
  dialogVisible.value = false;
}

// 弹窗关闭时重置
function handleClose(): void {
  tableRef.value?.clearSelection();
  selected.value = [];
  searchParams.name = '';
  searchParams.idCard = '';
  searchParams.departmentName = '';
  searchParams.departmentCode = '';
  searchParams.privString = '';
}

// visible 由 false → true 时，重置并刷新
watch(
  () => props.visible,
  (val) => {
    if (val) {
      handleClose();
      // 等弹窗内 ProTable 渲染完成后触发首次请求
      // immediate=false，避免节点未就绪时发请求
      tableRef.value?.init();
    }
  },
);
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="900px"
    align-center
    append-to-body
    @close="handleClose"
  >
    <div class="police-select-dialog__search">
      <el-input
        v-model="searchParams.name as string"
        placeholder="请输入姓名"
        clearable
        style="width: 160px"
        @keyup.enter="handleSearch"
      />
      <el-input
        v-model="searchParams.idCard as string"
        placeholder="请输入身份证号"
        clearable
        style="width: 200px; margin-left: 8px"
        @keyup.enter="handleSearch"
      />
      <OrgTreeSelect
        v-model="searchParams.departmentName as string"
        :is-init-value="false"
        placeholder="所属组织"
        style="display: inline-block; margin-left: 8px"
        width="180px"
        @clear-val="cleanOrganizationInput"
        @current-change="organizationCurrentChange"
      />
      <el-button type="primary" :icon="Search" style="margin-left: 8px" @click="handleSearch">搜索</el-button>
      <el-button style="margin-left: 8px" @click="handleReset">重置</el-button>
    </div>

    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="fetchAvailableUsers"
      :data="list"
      :total="total"
      :search-params="searchParams"
      :page-sizes="[10, 20, 50]"
      :immediate="false"
      show-selection
      row-key="id"
      @response="handleResponse"
      @selection-change="handleSelectionChange"
    />
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :disabled="selected.length === 0" @click="handleConfirm">
        确定（已选 {{ selected.length }} 个）
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.police-select-dialog__search {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: @spacing-sm;
  padding-bottom: @spacing-md;
  margin-bottom: @spacing-xs;
  border-bottom: 1px solid @color-border-light;
}
</style>
