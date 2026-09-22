<script setup lang="ts">
/**
 * IcpAuthManage - 通信服务授权管理
 *
 * ICP 权限管理组件：
 * 1. 左侧部门树（queryDepartmentTree，字段 name/code/id）+ 树搜索
 * 2. 顶部搜索栏：姓名 + 身份证号 + 包含子部门 switch + 搜索/重置 + 批量授权按钮
 * 3. 右侧表格：姓名/身份证/所属组织/组织编码/直属领导名/直属领导id/操作
 * 4. 操作列：设备组织部门授权 / 摄像头层级授权
 * 5. 批量按钮：批量授权部门设备 / 批量授权部门摄像头（依赖选中部门）
 * 6. 4 个弹窗：AuthTreeModal（通过 props.api 区分 get/set）
 */
import { ElMessage } from 'element-plus';
import type ElTree from 'element-plus/es/components/tree/index';
import { computed, onMounted, reactive, ref, watch } from 'vue';

import AuthTreeModal from './AuthTreeModal.vue';
import { queryDepartmentTree, queryUserByIdCard } from '@/api/h5/collaboration';
import { getUserPageByDept, type IcpUserItem } from '@/api/thirdInterface/unifiedComm';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import { hasBtnPermission } from '@/composables/usePermission';
import { getIdCardNum, getIsAdmin } from '@/utils/auth';

defineOptions({ name: 'IcpAuthManage' });

// ===== 部门树（queryDepartmentTree，字段 name/code/id）=====
interface DepartmentTreeNode {
  id: string;
  code: string;
  name: string;
  children?: DepartmentTreeNode[];
  [key: string]: unknown;
}

const treeRef = ref<InstanceType<typeof ElTree>>();
const treeLoading = ref(false);
const treeData = ref<DepartmentTreeNode[]>([]);
const defaultExpandedKeys = ref<string[]>([]);
const treeProps = { label: 'name', children: 'children' };
const treeFilterText = ref('');

watch(treeFilterText, (val) => {
  treeRef.value?.filter(val);
});

function filterNode(value: string, data: any): boolean {
  if (!value) return true;
  return data.name?.includes(value) ?? false;
}

const filterNodeMethod = filterNode as never;

/** 当前选中部门节点 */
const currentDept = ref<DepartmentTreeNode | null>(null);

// ===== 非管理员数据隔离 =====
const isAdmin = getIsAdmin();
const idCardNum = getIdCardNum();
/** 非管理员的部门编码（用于过滤部门树）*/
const userDepartmentCode = ref('');

/**
 * 根据身份证号获取用户组织名称
 *
 * 非管理员数据隔离逻辑：
 * - 管理员直接返回，不调用接口
 * - 非管理员调用 queryUserByIdCard 拉取 userDepartments，
 *   取首个部门编码写入 userDepartmentCode，用于后续过滤部门树
 * - 接口失败仅打印日志，不阻塞后续流程
 *
 * @returns Promise<void> 无返回值
 */
async function getUserOrgNameByIdCardNum(): Promise<void> {
  if (isAdmin) return;
  try {
    const res = await queryUserByIdCard({ idCard: idCardNum });
    const depts = res?.data?.userDepartments ?? [];
    if (depts.length > 0) {
      userDepartmentCode.value = depts[0]?.departmentCode ?? '';
    }
  } catch (e) {
    console.error('[IcpAuthManage] 获取用户部门失败', e);
  }
}

/**
 * 标准化树数据
 *
 * 递归遍历后端返回的部门树节点，确保每个节点的 children 字段为数组：
 * - children 存在且为数组时递归 normalizeTree
 * - children 不存在或非数组时统一置为空数组 []
 *
 * 用于规避后端可能返回 null/undefined children 导致 el-tree 渲染异常。
 *
 * @param nodes 原始部门树节点数组
 * @returns DepartmentTreeNode[] 标准化后的部门树（children 字段均为数组）
 */
function normalizeTree(nodes: DepartmentTreeNode[]): DepartmentTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children && Array.isArray(node.children) ? normalizeTree(node.children) : [],
  }));
}

/**
 * 加载部门树数据
 *
 * 调用 queryDepartmentTree 拉取部门树：
 * - 非管理员且已获取 userDepartmentCode 时，传入 parentCode 只加载自己所在部门及子部门
 * - 管理员加载完整部门树
 * 拉取后通过 normalizeTree 标准化，并默认展开首个根节点。
 *
 * @returns Promise<void> 无返回值
 */
async function loadTreeData(): Promise<void> {
  treeLoading.value = true;
  try {
    // 非管理员只加载自己所在部门及子部门
    const params: { parentCode?: string } = {};
    if (!isAdmin && userDepartmentCode.value) {
      params.parentCode = userDepartmentCode.value;
    }
    const res = await queryDepartmentTree(params);
    if (res?.code === 0 && res.data) {
      const list = Array.isArray(res.data) ? res.data : [res.data];
      treeData.value = normalizeTree(list as DepartmentTreeNode[]);
      if (treeData.value.length > 0) {
        defaultExpandedKeys.value = [treeData.value[0].id];
      }
    }
  } catch (e) {
    console.error('[IcpAuthManage] 加载部门树失败', e);
  } finally {
    treeLoading.value = false;
  }
}

/**
 * 树节点点击处理
 *
 * 点击左侧部门树节点时同步更新搜索参数（departmentCode/departmentName/privString），
 * 将 pageNum 重置为 1，并触发 ProTable 重新初始化拉取人员列表。
 *
 * @param data 当前选中的部门节点
 * @returns void 无返回值
 */
function handleTreeNodeClick(data: DepartmentTreeNode): void {
  currentDept.value = data;
  listQuery.departmentCode = data.code || '';
  listQuery.departmentName = data.name || '';
  listQuery.privString = data.id || '';
  listQuery.pageNum = 1;
  tableRef.value?.init();
}

// ===== 搜索参数 =====
interface ListQuery {
  pageNum: number;
  pageSize: number;
  departmentName: string;
  departmentCode: string;
  privString: string;
  name: string;
  idCard: string;
  isChildren: number;
}

const listQuery = reactive<ListQuery>({
  pageNum: 1,
  pageSize: 10,
  departmentName: '',
  departmentCode: '',
  privString: '',
  name: '',
  idCard: '',
  isChildren: 1,
});

/**
 * 筛选处理
 *
 * 点击搜索按钮或回车时触发：将 pageNum 重置为 1，
 * 并调用 ProTable 的 init 触发新一轮远程拉取。
 *
 * @returns void 无返回值
 */
function handleFilter(): void {
  listQuery.pageNum = 1;
  tableRef.value?.init();
}

/**
 * 重置筛选条件
 *
 * 清空搜索栏的姓名/身份证/部门相关参数，并将 isChildren 置为 0，
 * 同时清除左侧部门树当前选中节点（currentDept + setCurrentKey(null)），
 * 然后调用 ProTable 的 init 拉取全量数据。
 *
 * @returns void 无返回值
 */
function handleReset(): void {
  listQuery.name = '';
  listQuery.idCard = '';
  listQuery.departmentName = '';
  listQuery.departmentCode = '';
  listQuery.privString = '';
  listQuery.isChildren = 0;
  currentDept.value = null;
  treeRef.value?.setCurrentKey(null);
  tableRef.value?.init();
}

// ===== 右侧人员列表（受控模式）=====
const userList = ref<IcpUserItem[]>([]);
const userTotal = ref(0);
const tableRef = ref<InstanceType<typeof ProTable>>();

const panelTitle = computed(() => (currentDept.value ? `「${currentDept.value.name}」下的人员` : '人员列表'));

const columns: ITableColumn[] = [
  { prop: 'name', label: '姓名', minWidth: 100, showOverflowTooltip: true },
  { prop: 'idCard', label: '身份证号', minWidth: 160, showOverflowTooltip: true },
  { prop: 'departmentName', label: '所属组织', minWidth: 140, showOverflowTooltip: true },
  { prop: 'departmentCode', label: '组织编码', minWidth: 120, showOverflowTooltip: true },
  { prop: 'directLeaderName', label: '直属领导', minWidth: 100, showOverflowTooltip: true },
  { prop: 'directLeaderId', label: '领导ID', minWidth: 100, showOverflowTooltip: true },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    width: 280,
    align: 'center',
    slotName: 'actions',
  },
];

/**
 * 拉取用户列表
 *
 * ProTable 远程模式的 fetchApi 回调：
 * 合并 listQuery 搜索参数与 ProTable 透传的分页参数（pageNum/pageSize），
 * 调用 getUserPageByDept 接口，将完整响应返回给 ProTable，
 * 由 handleResponse 在 @response 回调中负责字段映射。
 *
 * @param params ProTable 透传的分页参数（pageNum、pageSize）
 * @returns Promise<unknown> 接口原始响应，交由 handleResponse 处理
 */
async function fetchUserList(params: Record<string, unknown>): Promise<unknown> {
  return getUserPageByDept({
    ...listQuery,
    pageNum: Number(params.pageNum ?? 1),
    pageSize: Number(params.pageSize ?? 10),
  });
}

/**
 * 处理接口响应
 *
 * ProTable @response 回调：使用 defaultTableFormatter 兼容多种后端响应结构，
 * 提取 records 写入 userList，提取 total 写入 userTotal，
 * 实现 ProTable 受控模式的数据更新。
 *
 * @param res fetchUserList 返回的接口原始响应
 * @returns void 无返回值
 */
function handleResponse(res: unknown): void {
  userList.value = defaultTableFormatter.getRecords(res) as IcpUserItem[];
  userTotal.value = defaultTableFormatter.getTotal(res);
}

/**
 * 行数据预处理
 *
 * ProTable slot scope 的类型推断不完善（参考 REFACTOR_PLAN.md 6.5.1），
 * 此 helper 用于从 scope 中安全提取 row 字段并转换为业务类型，
 * 取不到时返回空对象，避免 undefined 行操作列报错。
 *
 * @param scope ProTable actions slot 透传的 scope 对象
 * @returns IcpUserItem 当前行的业务数据（取不到时返回空对象）
 */
function getRow(scope: any): IcpUserItem {
  return (scope?.row as IcpUserItem) ?? ({} as IcpUserItem);
}

// ===== 授权弹窗（通用 AuthTreeModal）=====
const authModalVisible = ref(false);
const authModalTitle = ref('');
/** 弹窗类型：org 单用户设备 / camera 单用户摄像头 / batchOrg 批量部门设备 / batchCamera 批量部门摄像头 */
const authApiType = ref<'org' | 'camera' | 'batchOrg' | 'batchCamera'>('org');
const authTargetId = ref('');
const authDeptCode = ref('');
const authDeptName = ref('');
const authIsChildren = ref<number>(1);
/** 授权弹窗所需的树字段（部门树 departmentid/departmentname，摄像头树 levelNumber/nodeName）*/
const authTreeFields = ref<{ id: string; label: string }>({ id: 'id', label: 'label' });

/**
 * 打开组织部门权限弹窗
 *
 * 单用户 - 设备组织部门授权：
 * - 设置 authApiType 为 'org'，AuthTreeModal 内部据此调用对应 get/set 接口
 * - 写入目标用户 id、清空部门参数、设置弹窗标题
 * - 设置树字段为 departmentid/departmentname，匹配后端设备组织树字段
 *
 * @param row 当前行用户数据（必须含 id 与 name）
 * @returns Promise<void> 无返回值
 */
async function openOrgDeptDialog(row: IcpUserItem): Promise<void> {
  authApiType.value = 'org';
  authTargetId.value = row.id;
  authDeptCode.value = '';
  authDeptName.value = '';
  authModalTitle.value = `设备组织部门授权 - ${row.name ?? ''}`;
  authTreeFields.value = { id: 'departmentid', label: 'departmentname' };
  authModalVisible.value = true;
}

/**
 * 打开摄像头层级权限弹窗
 *
 * 单用户 - 摄像头层级授权：
 * - 设置 authApiType 为 'camera'，AuthTreeModal 内部据此调用对应 get/set 接口
 * - 写入目标用户 id、清空部门参数、设置弹窗标题
 * - 设置树字段为 levelNumber/nodeName，匹配后端摄像头层级树字段
 *
 * @param row 当前行用户数据（必须含 id 与 name）
 * @returns Promise<void> 无返回值
 */
async function openCameraLevelDialog(row: IcpUserItem): Promise<void> {
  authApiType.value = 'camera';
  authTargetId.value = row.id;
  authDeptCode.value = '';
  authDeptName.value = '';
  authModalTitle.value = `摄像头层级授权 - ${row.name ?? ''}`;
  authTreeFields.value = { id: 'levelNumber', label: 'nodeName' };
  authModalVisible.value = true;
}

/**
 * 打开批量部门权限弹窗
 *
 * 批量 - 部门设备授权：
 * - 未选中部门时弹窗警告并中断
 * - 设置 authApiType 为 'batchOrg'，targetId 置空
 * - 写入当前部门 code/name 与 isChildren 开关，供 AuthTreeModal 批量查询
 * - 设置树字段为 departmentid/departmentname
 *
 * @returns void 无返回值
 */
function openBatchDeptOrgDialog(): void {
  if (!currentDept.value) {
    ElMessage.warning('请先在左侧选择一个部门');
    return;
  }
  authApiType.value = 'batchOrg';
  authTargetId.value = '';
  authDeptCode.value = currentDept.value.code || '';
  authDeptName.value = currentDept.value.name || '';
  authIsChildren.value = listQuery.isChildren;
  authModalTitle.value = `批量设置部门设备权限 - ${currentDept.value.name}`;
  authTreeFields.value = { id: 'departmentid', label: 'departmentname' };
  authModalVisible.value = true;
}

/**
 * 打开批量摄像头权限弹窗
 *
 * 批量 - 部门摄像头授权：
 * - 未选中部门时弹窗警告并中断
 * - 设置 authApiType 为 'batchCamera'，targetId 置空
 * - 写入当前部门 code/name 与 isChildren 开关，供 AuthTreeModal 批量查询
 * - 设置树字段为 levelNumber/nodeName
 *
 * @returns void 无返回值
 */
function openBatchDeptCameraDialog(): void {
  if (!currentDept.value) {
    ElMessage.warning('请先在左侧选择一个部门');
    return;
  }
  authApiType.value = 'batchCamera';
  authTargetId.value = '';
  authDeptCode.value = currentDept.value.code || '';
  authDeptName.value = currentDept.value.name || '';
  authIsChildren.value = listQuery.isChildren;
  authModalTitle.value = `批量设置部门摄像头权限 - ${currentDept.value.name}`;
  authTreeFields.value = { id: 'levelNumber', label: 'nodeName' };
  authModalVisible.value = true;
}

/**
 * 权限授权成功后处理
 *
 * AuthTreeModal @success 事件回调：
 * 授权保存成功后，调用 ProTable 的 refresh 刷新当前人员列表，
 * 让前端状态与后端最新权限保持一致。
 *
 * @returns void 无返回值
 */
function handleAuthSuccess(): void {
  // 保存成功后刷新列表
  tableRef.value?.refresh();
}

// ===== 权限校验 =====
const canAuthImuser = computed(() => hasBtnPermission('/admin/trUserRole/createMany'));
const canAuthCamera = computed(() => hasBtnPermission('/admin/trUserRole/createMany'));

onMounted(async () => {
  // 非管理员先获取自己所在部门编码，再加载部门树
  if (!isAdmin) {
    await getUserOrgNameByIdCardNum();
  }
  loadTreeData();
});
</script>

<template>
  <div class="icp-auth-manage">
    <!-- 顶部搜索栏 -->
    <div class="header-bar">
      <el-input
        v-model="listQuery.name"
        placeholder="姓名"
        style="width: 150px"
        clearable
        @keyup.enter="handleFilter"
      />
      <el-input
        v-model="listQuery.idCard"
        placeholder="身份证号"
        style="width: 180px"
        clearable
        @keyup.enter="handleFilter"
      />
      <div class="switch-filter">
        <span class="switch-label">包含子部门</span>
        <el-switch
          v-model="listQuery.isChildren"
          :active-value="1"
          :inactive-value="0"
          inline-prompt
          @change="handleFilter"
        />
      </div>
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" plain @click="handleReset">重置</el-button>
      <el-button type="primary" plain :disabled="!currentDept" @click="openBatchDeptOrgDialog">
        批量授权部门设备
      </el-button>
      <el-button type="primary" plain :disabled="!currentDept" @click="openBatchDeptCameraDialog">
        批量授权部门摄像头
      </el-button>
    </div>

    <!-- 主体区：左树 + 右表 -->
    <div class="main-area">
      <div class="content-row">
        <!-- 左侧部门树 -->
        <div class="left-panel">
          <div class="panel-header">
            <span class="panel-title">组织部门</span>
          </div>
          <div class="panel-content">
            <el-input
              v-model="treeFilterText"
              placeholder="搜索部门"
              clearable
              size="small"
              class="tree-filter-input"
            />
            <div v-loading="treeLoading" class="tree-scroll">
              <el-tree
                ref="treeRef"
                :data="treeData"
                :props="treeProps"
                node-key="id"
                highlight-current
                :expand-on-click-node="false"
                :default-expanded-keys="defaultExpandedKeys"
                :filter-node-method="filterNodeMethod"
                @current-change="handleTreeNodeClick"
              >
                <template #default="{ node }">
                  <span class="tree-node-label" :title="node.label">{{ node.label }}</span>
                </template>
              </el-tree>
            </div>
          </div>
        </div>

        <!-- 右侧人员表 -->
        <div class="right-panel">
          <div class="panel-header">
            <span class="panel-title">{{ panelTitle }}</span>
          </div>
          <div class="table-wrap">
            <ProTable
              ref="tableRef"
              :columns="columns"
              :fetch-api="fetchUserList"
              :data="userList"
              :total="userTotal"
              :page="listQuery.pageNum"
              :limit="listQuery.pageSize"
              :immediate="true"
              show-index
              index-label="序号"
              :index-width="60"
              row-key="id"
              @response="handleResponse"
              @pagination="
                (val) => {
                  listQuery.pageNum = val.page;
                  listQuery.pageSize = val.limit;
                }
              "
            >
              <template #actions="scope">
                <ActionButtons
                  :buttons="[
                    {
                      type: 'success',
                      label: '设备组织部门授权',
                      visible: canAuthImuser,
                      onClick: () => openOrgDeptDialog(getRow(scope)),
                    },
                    {
                      type: 'primary',
                      label: '摄像头层级授权',
                      visible: canAuthCamera,
                      onClick: () => openCameraLevelDialog(getRow(scope)),
                    },
                  ]"
                />
              </template>
            </ProTable>
          </div>
        </div>
      </div>
    </div>

    <!-- 通用授权弹窗 -->
    <AuthTreeModal
      v-model:visible="authModalVisible"
      :title="authModalTitle"
      :api="authApiType"
      :target-id="authTargetId"
      :dept-code="authDeptCode"
      :dept-name="authDeptName"
      :is-children="authIsChildren"
      :tree-fields="authTreeFields"
      @success="handleAuthSuccess"
    />
  </div>
</template>

<style lang="less" scoped>
.icp-auth-manage {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: @color-bg-card;
  border-radius: 6px 6px 0 0;
  gap: 8px;
  flex-wrap: wrap;
}

.switch-filter {
  display: flex;
  align-items: center;
  gap: 6px;

  .switch-label {
    font-size: 13px;
    color: @color-text-regular;
    white-space: nowrap;
  }
}

.main-area {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: @color-bg-card;
  padding: 0 10px;
}

.content-row {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.left-panel {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 260px;
  min-width: 180px;
  max-width: 480px;
  min-height: 0;
  border-left: 1px solid @color-border-panel;
  border-top: 1px solid @color-border-panel;
  border-bottom: 1px solid @color-border-panel;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 8px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid @color-border-panel;
  flex-shrink: 0;
  background: @color-bg-table-header;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: @color-text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.panel-content {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
  padding: 8px;
  overflow: hidden;
}

.tree-filter-input {
  margin-bottom: 8px;
}

.tree-scroll {
  flex: 1;
  height: 0;
  overflow-y: auto;
}

.tree-node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
