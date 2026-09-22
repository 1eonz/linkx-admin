<script setup lang="ts">
/**
 * BindUser - 角色绑定用户弹窗
 *
 * 功能特性：
 * 1. 为指定角色批量绑定用户（人员）
 * 2. 支持按姓名、身份证号、组织名称搜索筛选人员
 * 3. 组织名称选择使用 OrgTreeSelect 组件（兼容同步/懒加载模式）
 * 4. 跨页选中支持（row-key + reserve-selection）
 *
 * @example 父组件调用
 * ```vue
 * <BindUser ref="bindUserRef" @success="refresh" />
 * // 打开
 * bindUserRef.value?.open(role)
 * ```
 *
 * Props: 无
 *
 * Events:
 * - success: 绑定成功后触发，父组件刷新列表
 *
 * Methods:
 * - open(role: RoleItem): 打开弹窗，传入角色对象
 */
import { Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { reactive, ref } from 'vue';

import { setBatchRole } from '@/api/permission/role';
import type { RoleItem } from '@/api/permission/role';
import { getPersonList, type UserItem } from '@/api/permission/user';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'BindUser' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const submitLoading = ref(false);
const tableRef = ref<InstanceType<typeof ProTable>>();

/** 当前角色信息 */
const roleId = ref('');
const roleName = ref('');

// ===== 受控模式状态 =====
const list = ref<UserItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  name: '',
  idCard: '',
  departmentName: '',
  departmentCode: '',
});

// ===== 选中行 =====
const selectedRows = ref<UserItem[]>([]);

// ===== 列定义 =====
const columns: ITableColumn[] = [
  { prop: 'name', label: '姓名', minWidth: 60, align: 'center', showOverflowTooltip: true },
  { prop: 'idCard', label: '身份证号', minWidth: 80, align: 'center', showOverflowTooltip: true },
  { prop: 'departmentName', label: '组织名称', minWidth: 80, align: 'center', showOverflowTooltip: true },
  { prop: 'departmentCode', label: '组织编码', minWidth: 80, align: 'center', showOverflowTooltip: true },
  { prop: 'directLeaderName', label: '直接上级', minWidth: 80, align: 'center', showOverflowTooltip: true },
  { prop: 'directLeaderId', label: '上级ID', minWidth: 80, align: 'center', showOverflowTooltip: true },
];

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as UserItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

function handleSelectionChange(rows: UserItem[]): void {
  selectedRows.value = rows;
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.name = '';
  searchParams.idCard = '';
  searchParams.departmentName = '';
  searchParams.departmentCode = '';
  tableRef.value?.init();
}

/** 组织树选择回调 */
function handleOrgChange(data: { code: string; name: string } | null): void {
  if (data) {
    searchParams.departmentName = data.name;
    searchParams.departmentCode = data.code;
  } else {
    searchParams.departmentName = '';
    searchParams.departmentCode = '';
  }
}

// ===== 弹窗打开 =====
function open(role: RoleItem): void {
  roleId.value = role.id;
  roleName.value = role.name;
  // 重置查询条件
  searchParams.name = '';
  searchParams.idCard = '';
  searchParams.departmentName = '';
  searchParams.departmentCode = '';
  selectedRows.value = [];
  dialogVisible.value = true;
  // 等待 ProTable 渲染后加载数据
  setTimeout(() => {
    tableRef.value?.init();
  }, 100);
}

defineExpose({ open });

// ===== 提交绑定 =====
async function handleSubmit(): Promise<void> {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要绑定的用户');
    return;
  }

  const userIds = selectedRows.value.map((u) => u.id);
  const count = userIds.length;

  try {
    await ElMessageBox.confirm(`确定将选中的 ${count} 个用户绑定到角色【${roleName.value}】吗？`, '绑定确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }

  submitLoading.value = true;
  try {
    const res = await setBatchRole(roleId.value, userIds);
    if (res.code === 0) {
      ElMessage.success('绑定成功');
      emit('success');
      dialogVisible.value = false;
    } else {
      ElMessage.error(res.msg || '绑定失败');
    }
  } catch {
    ElMessage.error('绑定用户失败');
  } finally {
    submitLoading.value = false;
  }
}

/** 关闭弹窗 */
function handleClose(): void {
  dialogVisible.value = false;
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="绑定用户"
    width="1000px"
    align-center
    :close-on-click-modal="false"
    append-to-body
    @close="handleClose"
  >
    <el-form label-width="100px" class="bind-form">
      <el-form-item label="角色名称">
        <span>{{ roleName }}</span>
      </el-form-item>

      <el-form-item label="选择用户">
        <div class="filter-container">
          <el-input
            v-model="searchParams.name as string"
            placeholder="姓名"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="searchParams.idCard as string"
            placeholder="身份证号"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
          <OrgTreeSelect
            :model-value="searchParams.departmentName as string"
            placeholder="组织名称"
            style="width: 200px"
            @change="handleOrgChange"
          />
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </div>
      </el-form-item>
    </el-form>

    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="getPersonList"
      :data="list"
      :total="total"
      :search-params="searchParams"
      show-selection
      row-key="id"
      height="370px"
      @response="handleResponse"
      @selection-change="handleSelectionChange"
    />

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.bind-form {
  margin-bottom: 12px;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
