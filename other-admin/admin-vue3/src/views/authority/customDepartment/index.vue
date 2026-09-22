<script setup lang="ts">
/**
 * customDepartment/index.vue - 自定义组织管理
 *
 * 三栏布局：
 * 1. 左侧：组织树面板（el-tree 懒加载，组织 + 部门混合树）
 *    - 组织节点 isOrg=true：dropdown 增/删/改组织
 *    - 部门节点 isOrg=false：dropdown 增/删/改部门
 *    - 组织节点点击仅展开/收起，部门节点点击加载右侧人员
 * 2. 中间：拖拽分割线（SplitDivider，180~480px）
 * 3. 右侧：节点下警员列表（ProTable 受控模式）
 *    - 顶部：节点名 + 搜索框 + 搜索/重置 + 绑定警员按钮
 *    - 操作：解绑警员（二次确认）
 *
 * 弹窗：
 * - orgDialog：name + dutyType（下拉来自 getDutyTypes）
 * - nodeDialog：code + name + type（1=单位/2=部门）
 * - PoliceSelectDialog：跨页多选警员
 *
 * ProTable 主体采用受控模式（fetchApi + data + @response）：
 * - searchParams 含 nodeId + userName，分页由 ProTable 内部管理
 * - immediate=false，等节点点击后才触发
 */
import { CircleClose, Delete, Edit, Files, More, Plus, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import type ElTree from 'element-plus/es/components/tree/index';
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef } from 'vue';

import {
  bindCustomDepartmentUsers,
  createCustomDepartment,
  createOrganization,
  deleteCustomDepartment,
  deleteOrganization,
  getAvailableUsers,
  getCustomDepartmentChildren,
  getCustomDepartmentUserPage,
  getOrganizationTree,
  unbindCustomDepartmentUsers,
  updateCustomDepartment,
  updateOrganization,
  type AvailableUserItem,
  type BindUserItem,
  type CustomDepartmentTreeNode,
  type CustomDepartmentUserItem,
  type DepartmentItem,
  type OrganizationItem,
} from '@/api/authority/customDepartment';
import { getDutyTypes, type DutyTypeItem } from '@/api/shiftScheduling/dutyType';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';
import PoliceSelectDialog from '@/components/PoliceSelectDialog/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SplitDivider from '@/views/collaboration/components/SplitDivider.vue';

defineOptions({ name: 'CustomDepartment' });

// ===== 拖拽分割线 =====
const LEFT_DEFAULT = 260;
const leftWidth = ref(LEFT_DEFAULT);

// ===== 组织树 =====
const treeRef = ref<InstanceType<typeof ElTree>>();
const treeLoading = ref(false);
const treeData = ref<CustomDepartmentTreeNode[]>([]);
const treeProps = { label: 'name', children: 'children', isLeaf: 'isLeaf' };
const openDropdownId = ref<string | null>(null);

// el-tree Node 实例（仅用必要字段；用 unknown 中转兼容 Element Plus 内部 Node 类型）
interface TreeNodeInstance {
  id: string | number;
  level: number;
  isLeaf?: boolean;
  expanded: boolean;
  loaded: boolean;
  data: CustomDepartmentTreeNode;
  parent: TreeNodeInstance | null;
  expand(): void;
  collapse(): void;
}

// ===== 当前选中节点 =====
const currentNode = ref<CustomDepartmentTreeNode | null>(null);

// ===== 受控模式状态（右侧警员列表） =====
const userList = ref<CustomDepartmentUserItem[]>([]);
const userTotal = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  nodeId: '',
  userName: '',
});

const tableRef = ref<InstanceType<typeof ProTable>>();

// ===== 排班类型下拉 =====
const dutyTypeOptions = ref<{ label: string; value: string }[]>([]);

// ===== 弹窗：组织 =====
interface OrgForm {
  name: string;
  dutyType: string;
}
const orgDialogVisible = ref(false);
const orgDialogLoading = ref(false);
const orgDialogType = ref<'create' | 'edit'>('create');
const orgEditData = ref<OrganizationItem | null>(null);
const orgForm = reactive<OrgForm>({ name: '', dutyType: '' });
const orgFormRef = useTemplateRef<FormInstance>('orgFormRef');
const orgDialogTitle = computed(() => (orgDialogType.value === 'create' ? '新增组织' : '编辑组织'));

// ===== 弹窗：部门 =====
interface NodeForm {
  code: string;
  name: string;
  type: 1 | 2;
  parentId: string;
  departmentCustomId: string;
}
const nodeDialogVisible = ref(false);
const nodeDialogLoading = ref(false);
const nodeDialogType = ref<'create' | 'edit'>('create');
const nodeEditData = ref<DepartmentItem | null>(null);
const nodeParentData = ref<CustomDepartmentTreeNode | null>(null);
const nodeForm = reactive<NodeForm>({
  code: '',
  name: '',
  type: 2,
  parentId: '',
  departmentCustomId: '',
});
const nodeFormRef = useTemplateRef<FormInstance>('nodeFormRef');
const nodeDialogTitle = computed(() => (nodeDialogType.value === 'create' ? '新增单位/部门' : '编辑单位/部门'));

// 父节点为部门时只能选部门（type=2）
const nodeTypeDisabled = computed(() => {
  const parent = nodeParentData.value;
  return Boolean(parent && !parent.isOrg);
});

// ===== 警员选择弹窗 =====
const policeDialogVisible = ref(false);

// ===== ProTable 列配置 =====
const columns: ITableColumn[] = [
  { prop: 'userName', label: '姓名', minWidth: 100, showOverflowTooltip: true },
  { prop: 'mobile', label: '联系电话', minWidth: 120, showOverflowTooltip: true },
  { prop: 'departmentName', label: '所属组织', minWidth: 140, showOverflowTooltip: true },
  { prop: 'operateTime', label: '操作时间', width: 160, align: 'center' },
  { prop: 'action', label: '操作', width: 100, align: 'center', slotName: 'action' },
];

const panelTitle = computed(() => (currentNode.value ? `「${currentNode.value.name}」下的警员` : '警员列表'));

// ===== 工具函数 =====
/** 是否组织节点 */
function isOrgNode(node: CustomDepartmentTreeNode | null | undefined): node is OrganizationItem {
  return Boolean(node && (node as OrganizationItem).isOrg === true);
}

/** 是否部门节点 */
function isDeptNode(node: CustomDepartmentTreeNode | null | undefined): node is DepartmentItem {
  return Boolean(node && (node as DepartmentItem).isOrg === false);
}

/** 规范化节点：明确 hasChildren 字段控制 isLeaf
 * - 根节点（getOrganizationTree 返回）一律为组织节点
 * - 子节点（getCustomDepartmentChildren 返回）一律为部门节点
 * 子节点 isOrg=false
 */
function normalizeNodes(list: CustomDepartmentTreeNode[], isRoot: boolean): CustomDepartmentTreeNode[] {
  return list.map((item) => {
    if (isRoot) {
      // 根节点（一级组织）一定有部门子节点
      return { ...(item as Record<string, unknown>), isOrg: true, isLeaf: false } as OrganizationItem;
    }
    // 子节点（部门）一律标记为 isOrg=false，避免后端未返回 isOrg 字段时被误判为组织节点
    return {
      ...(item as Record<string, unknown>),
      isOrg: false,
      isLeaf: !item.hasChildren,
    } as DepartmentItem;
  });
}

// ===== 组织树加载 =====
/** 首次加载根节点（组织列表） */
async function fetchRootNodes(): Promise<void> {
  treeLoading.value = true;
  try {
    const res = await getOrganizationTree();
    treeData.value = normalizeNodes((res?.data ?? []) as CustomDepartmentTreeNode[], true);
  } catch (e) {
    ElMessage.error('加载组织结构失败');
  } finally {
    treeLoading.value = false;
  }
}

/** el-tree 懒加载子节点 */
async function loadTreeNode(node: any, resolve: (data: CustomDepartmentTreeNode[]) => void): Promise<void> {
  if (node.level === 0) {
    resolve(treeData.value);
    return;
  }
  try {
    const data = node.data as CustomDepartmentTreeNode;
    // 组织下加载部门：parentId=0, departmentCustomId=组织 id
    // 部门下加载子部门：parentId=部门 id, departmentCustomId=组织 id（从父继承）
    let parentId = '0';
    let departmentCustomId = '';
    if (isOrgNode(data)) {
      parentId = '0';
      departmentCustomId = data.id;
    } else if (isDeptNode(data)) {
      parentId = data.id;
      departmentCustomId = data.departmentCustomId;
    }
    const res = await getCustomDepartmentChildren({ parentId, departmentCustomId });
    const children = normalizeNodes((res?.data ?? []) as CustomDepartmentTreeNode[], false);
    // 子部门继承父级的 departmentCustomId
    children.forEach((child) => {
      if (!(child as DepartmentItem).departmentCustomId) {
        (child as DepartmentItem).departmentCustomId = departmentCustomId;
      }
    });
    resolve(children);
  } catch {
    resolve([]);
    ElMessage.error('加载子节点失败');
  }
}

// ===== 节点交互 =====
/** dropdown 显隐 */
function handleDropdownVisibleChange(visible: boolean, nodeId: string): void {
  openDropdownId.value = visible ? nodeId : null;
}

/** dropdown 命令派发 */
function handleNodeCommand(command: string, node: TreeNodeInstance, data: CustomDepartmentTreeNode): void {
  switch (command) {
    case 'addChild':
      openNodeDialog('create', data);
      break;
    case 'edit':
      if (isOrgNode(data)) {
        openOrgDialog('edit', data);
      } else {
        openNodeDialog('edit', data);
      }
      break;
    case 'delete':
      if (isOrgNode(data)) {
        confirmDeleteOrg(data);
      } else {
        confirmDeleteNode(data);
      }
      break;
    default:
      break;
  }
}

/** 节点点击：组织仅展开/收起，部门加载人员 */
function handleNodeClick(data: CustomDepartmentTreeNode, node: TreeNodeInstance): void {
  if (isOrgNode(data)) {
    // 组织节点仅展开/收起
    if (node.expanded) {
      node.collapse();
    } else {
      node.expand();
    }
    return;
  }
  // 部门节点：加载右侧人员
  currentNode.value = data;
  searchParams.userName = '';
  searchParams.nodeId = data.id;
  nextTick(() => {
    tableRef.value?.init();
  });
}

/** 刷新指定父节点的子列表 */
function refreshNodeChildren(parentData: CustomDepartmentTreeNode): void {
  if (!treeRef.value) return;
  const parentNode = treeRef.value.getNode(parentData.id) as unknown as TreeNodeInstance | null;
  if (parentNode) {
    parentNode.loaded = false;
    parentNode.collapse();
    parentNode.expand();
  }
}

// ===== 组织弹窗 =====
function openOrgDialog(type: 'create' | 'edit', data: OrganizationItem | null): void {
  orgDialogType.value = type;
  if (type === 'edit' && data) {
    orgEditData.value = data;
    orgForm.name = data.name;
    orgForm.dutyType = data.dutyType ?? '';
  } else {
    orgEditData.value = null;
    orgForm.name = '';
    orgForm.dutyType = '';
  }
  orgDialogVisible.value = true;
  nextTick(() => {
    orgFormRef.value?.clearValidate();
  });
}

async function submitOrg(): Promise<void> {
  try {
    await orgFormRef.value?.validate();
  } catch {
    return;
  }
  orgDialogLoading.value = true;
  try {
    const payload = { name: orgForm.name, dutyType: orgForm.dutyType };
    if (orgDialogType.value === 'create') {
      const res = await createOrganization(payload);
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg ?? '创建组织失败');
        return;
      }
      ElMessage.success('组织创建成功');
      await fetchRootNodes();
    } else if (orgEditData.value) {
      const res = await updateOrganization(orgEditData.value.id, payload);
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg ?? '更新组织失败');
        return;
      }
      ElMessage.success('组织更新成功');
      orgEditData.value.name = orgForm.name;
      orgEditData.value.dutyType = orgForm.dutyType;
      // 同步当前选中节点显示
      if (currentNode.value && currentNode.value.id === orgEditData.value.id) {
        currentNode.value = { ...currentNode.value, name: orgForm.name };
      }
    }
    orgDialogVisible.value = false;
  } finally {
    orgDialogLoading.value = false;
  }
}

/** 二次确认删除组织 */
function confirmDeleteOrg(data: OrganizationItem): void {
  ElMessageBox.confirm(`确定删除组织「${data.name}」？删除后将无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  })
    .then(async () => {
      try {
        const res = await deleteOrganization(data.id);
        if (!res || res.code !== 0) {
          ElMessage.error(res?.msg ?? '删除组织失败');
          return;
        }
        ElMessage.success('组织删除成功');
        // 清空右侧选中（如果删的是当前节点）
        if (currentNode.value && currentNode.value.id === data.id) {
          clearCurrentNode();
        }
        await fetchRootNodes();
      } catch (e) {
        ElMessage.error((e as Error)?.message ?? '删除组织失败');
      }
    })
    .catch(() => {
      // 取消删除
    });
}

// ===== 部门弹窗 =====
function openNodeDialog(type: 'create' | 'edit', data: CustomDepartmentTreeNode | null): void {
  nodeDialogType.value = type;
  if (type === 'edit' && isDeptNode(data)) {
    nodeEditData.value = data;
    nodeParentData.value = null;
    nodeForm.code = data.code;
    nodeForm.name = data.name;
    nodeForm.type = data.type;
    nodeForm.parentId = data.parentId;
    nodeForm.departmentCustomId = data.departmentCustomId;
  } else {
    // 新建：parent 为 data（可能为组织或部门）
    nodeEditData.value = null;
    nodeParentData.value = data;
    nodeForm.code = '';
    nodeForm.name = '';
    // 父节点为部门时只能新建部门（type=2）
    if (isDeptNode(data)) {
      nodeForm.type = 2;
    } else {
      nodeForm.type = 2;
    }
    if (isOrgNode(data)) {
      // 组织下挂部门：parentId=0, departmentCustomId=组织 id
      nodeForm.parentId = '0';
      nodeForm.departmentCustomId = data.id;
    } else if (isDeptNode(data)) {
      // 部门下挂子部门
      nodeForm.parentId = data.id;
      nodeForm.departmentCustomId = data.departmentCustomId;
    } else {
      nodeForm.parentId = '0';
      nodeForm.departmentCustomId = '';
    }
  }
  nodeDialogVisible.value = true;
  nextTick(() => {
    nodeFormRef.value?.clearValidate();
  });
}

async function submitNode(): Promise<void> {
  try {
    await nodeFormRef.value?.validate();
  } catch {
    return;
  }
  nodeDialogLoading.value = true;
  try {
    const payload: NodeForm = {
      code: nodeForm.code,
      name: nodeForm.name,
      type: nodeForm.type,
      parentId: nodeForm.parentId,
      departmentCustomId: nodeForm.departmentCustomId,
    };
    if (nodeDialogType.value === 'create') {
      const res = await createCustomDepartment(payload);
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg ?? '创建部门失败');
        return;
      }
      ElMessage.success('部门创建成功');
      // 刷新父节点子列表
      if (nodeParentData.value) {
        refreshNodeChildren(nodeParentData.value);
      } else {
        await fetchRootNodes();
      }
    } else if (nodeEditData.value) {
      const res = await updateCustomDepartment(nodeEditData.value.id, payload);
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg ?? '更新部门失败');
        return;
      }
      ElMessage.success('部门更新成功');
      nodeEditData.value.name = nodeForm.name;
      nodeEditData.value.code = nodeForm.code;
      nodeEditData.value.type = nodeForm.type;
      // 同步当前选中节点显示
      if (currentNode.value && currentNode.value.id === nodeEditData.value.id) {
        currentNode.value = { ...currentNode.value, name: nodeForm.name };
      }
    }
    nodeDialogVisible.value = false;
  } finally {
    nodeDialogLoading.value = false;
  }
}

/** 二次确认删除部门 */
function confirmDeleteNode(data: DepartmentItem): void {
  ElMessageBox.confirm(`确定删除「${data.name}」？删除后将无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  })
    .then(async () => {
      try {
        const res = await deleteCustomDepartment(data.id);
        if (!res || res.code !== 0) {
          ElMessage.error(res?.msg ?? '删除部门失败');
          return;
        }
        ElMessage.success('部门删除成功');
        // 清空右侧选中（如果删的是当前节点）
        if (currentNode.value && currentNode.value.id === data.id) {
          clearCurrentNode();
        }
        // 刷新父节点子列表
        // 父节点 id 等于 0 时表示直接挂在组织下，刷新对应组织
        if (data.parentId === '0') {
          // 找到对应的组织节点刷新
          const orgParent = treeData.value.find((n) => isOrgNode(n) && n.id === data.departmentCustomId);
          if (orgParent) {
            refreshNodeChildren(orgParent);
          } else {
            await fetchRootNodes();
          }
        } else {
          // 通过 el-tree 找父节点
          if (treeRef.value) {
            const parent = treeRef.value.getNode(data.parentId) as unknown as TreeNodeInstance | null;
            if (parent?.data) {
              refreshNodeChildren(parent.data);
            } else {
              await fetchRootNodes();
            }
          } else {
            await fetchRootNodes();
          }
        }
      } catch (e) {
        ElMessage.error((e as Error)?.message ?? '删除部门失败');
      }
    })
    .catch(() => {
      // 取消删除
    });
}

function clearCurrentNode(): void {
  currentNode.value = null;
  userList.value = [];
  userTotal.value = 0;
  searchParams.nodeId = '';
  searchParams.userName = '';
}

// ===== 右侧人员列表 =====
async function fetchUserList(params: Record<string, unknown>): Promise<unknown> {
  const nodeId = String(searchParams.nodeId ?? '');
  if (!nodeId) return undefined;
  const pageNum = Number(params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  // 搜索参数后端字段名为 keyword
  return getCustomDepartmentUserPage(nodeId, {
    pageNum,
    pageSize,
    userName: String(searchParams.userName ?? ''),
  });
}

/**
 * 处理后端返回：字段拍平逻辑
 * 后端 records 结构：{ id, userId, gmtCreated, user: { name, idCard, mobile, departmentName, gender } }
 * 前端列直接读 userName/mobile/departmentName/operateTime，需要先拍平
 */
function handleResponse(res: unknown): void {
  const records = defaultTableFormatter.getRecords(res) as Array<{
    id?: string;
    userId?: string;
    gmtCreated?: string;
    user?: {
      name?: string;
      idCard?: string;
      mobile?: string;
      departmentName?: string;
      gender?: string | number;
    };
    [key: string]: unknown;
  }>;
  userList.value = records.map((item) => ({
    id: item.id ?? '',
    userId: item.userId ?? '',
    userName: item.user?.name || '-',
    idCard: item.user?.idCard || '-',
    departmentName: item.user?.departmentName || '-',
    mobile: item.user?.mobile || '-',
    gender: item.user?.gender ?? '-',
    operateTime: item.gmtCreated || '-',
  })) as CustomDepartmentUserItem[];
  userTotal.value = defaultTableFormatter.getTotal(res);
}

function handleUserSearch(): void {
  tableRef.value?.init();
}

function handleUserSearchReset(): void {
  searchParams.userName = '';
  tableRef.value?.init();
}

/** 从 ProTable slot scope 中安全获取行数据 */
function getRow(scope: any): CustomDepartmentUserItem {
  return (scope?.row as CustomDepartmentUserItem) ?? ({} as CustomDepartmentUserItem);
}

// ===== 绑定/解绑警员 =====
function openPoliceDialog(): void {
  if (!currentNode.value || !isDeptNode(currentNode.value)) {
    ElMessage.warning('请先选择一个部门节点');
    return;
  }
  policeDialogVisible.value = true;
}

async function handlePoliceConfirm(selected: AvailableUserItem[]): Promise<void> {
  const node = currentNode.value;
  if (!isDeptNode(node)) return;
  if (selected.length === 0) {
    ElMessage.warning('请选择警员');
    return;
  }
  try {
    // 参数结构为 { users: [{ departmentCode, departmentId, id }] }
    const users: BindUserItem[] = selected.map((u) => ({
      departmentCode: u.departmentCode,
      departmentId: u.departmentId,
      id: u.id,
    }));
    const res = await bindCustomDepartmentUsers(node.id, { users });
    if (!res || res.code !== 0) {
      ElMessage.error(res?.msg ?? '绑定警员失败');
      return;
    }
    ElMessage.success(`成功绑定 ${selected.length} 名警员`);
    tableRef.value?.refresh();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? '绑定警员失败');
  }
}

/** 解绑警员 */
async function handleUnbindUser(row: CustomDepartmentUserItem): Promise<void> {
  const node = currentNode.value;
  if (!isDeptNode(node)) return;
  try {
    await ElMessageBox.confirm(`确定将「${row.userName}」从当前节点解绑？`, '解绑确认', {
      type: 'warning',
      confirmButtonText: '确定解绑',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  try {
    const res = await unbindCustomDepartmentUsers(node.id, { userIds: [row.userId] });
    if (!res || res.code !== 0) {
      ElMessage.error(res?.msg ?? '解绑失败');
      return;
    }
    ElMessage.success('解绑成功');
    tableRef.value?.refresh();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? '解绑失败');
  }
}

// ===== 排班类型下拉 =====
async function loadDutyTypes(): Promise<void> {
  try {
    const res = await getDutyTypes({ pageNum: 1, pageSize: 100 });
    const types = (res?.data?.records ?? []) as DutyTypeItem[];
    dutyTypeOptions.value = types.map((item) => ({
      label: `${item.name}(${item.type})`,
      value: item.type,
    }));
  } catch (e) {
    console.error('获取排班类型失败', e);
  }
}

// ===== 表单校验规则 =====
const orgRules: FormRules = {
  name: [
    { required: true, message: '请输入组织名称', trigger: 'blur' },
    { max: 32, message: '最多 32 个字符', trigger: 'blur' },
  ],
};

const nodeRules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { max: 32, message: '最多 32 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入编码', trigger: 'blur' },
    { max: 64, message: '最多 64 个字符', trigger: 'blur' },
  ],
};

// 暴露 PoliceSelectDialog 使用的可绑定警员 API（保留 import 引用以避免未使用警告）
void getAvailableUsers;

onMounted(() => {
  fetchRootNodes();
  loadDutyTypes();
});
</script>

<template>
  <div class="custom-department">
    <!-- 左侧：组织树面板 -->
    <div class="level-tree-panel" :style="{ width: leftWidth + 'px' }">
      <div class="panel-header">
        <span class="panel-title">组织结构</span>
      </div>

      <div class="tree-body">
        <el-tree
          ref="treeRef"
          class="level-tree"
          node-key="id"
          :data="treeData"
          :props="treeProps"
          :load="loadTreeNode"
          lazy
          highlight-current
          :expand-on-click-node="false"
          :empty-text="treeLoading ? '' : '暂无组织数据'"
          @node-click="
            (data, node) => handleNodeClick(data as CustomDepartmentTreeNode, node as unknown as TreeNodeInstance)
          "
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <el-icon class="node-folder-icon"><Files /></el-icon>
              <span class="node-label" :title="(data as CustomDepartmentTreeNode).name">
                {{ (data as CustomDepartmentTreeNode).name }}
              </span>
              <el-dropdown
                class="node-more"
                :class="{ 'is-open': openDropdownId === (data as CustomDepartmentTreeNode).id }"
                trigger="click"
                placement="bottom-end"
                @visible-change="
                  (visible: boolean) => handleDropdownVisibleChange(visible, (data as CustomDepartmentTreeNode).id)
                "
                @command="
                  (cmd: string) => handleNodeCommand(cmd, node as TreeNodeInstance, data as CustomDepartmentTreeNode)
                "
              >
                <span class="node-more-icon" @click.stop>
                  <el-icon><More /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="addChild" :icon="Plus">新增单位/部门</el-dropdown-item>
                    <el-dropdown-item command="edit" :icon="Edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="delete" :icon="Delete" class="dropdown-item--danger">
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-tree>
      </div>

      <div class="tree-add-root">
        <el-button type="primary" :icon="Plus" style="width: 100%" @click="openOrgDialog('create', null)">
          新增组织
        </el-button>
      </div>
    </div>

    <!-- 拖拽分割线 -->
    <SplitDivider v-model="leftWidth" :min="180" :max="480" />

    <!-- 右侧：人员列表面板 -->
    <div class="level-content-panel">
      <div class="panel-header">
        <span class="panel-title">{{ panelTitle }}</span>
        <div class="panel-header__actions">
          <div class="search-wrap">
            <el-input
              v-model="searchParams.userName as string"
              placeholder="搜索姓名"
              clearable
              style="width: 160px; margin-right: 6px"
              @keyup.enter="handleUserSearch"
            />
            <el-button type="primary" :icon="Search" @click="handleUserSearch">搜索</el-button>
            <el-button type="info" :icon="CircleClose" @click="handleUserSearchReset"> 重置 </el-button>
          </div>
          <el-button v-if="currentNode" type="primary" :icon="Plus" @click="openPoliceDialog"> 绑定警员 </el-button>
        </div>
      </div>

      <!-- 未选中节点占位 -->
      <div v-if="!currentNode" class="empty-placeholder">
        <el-empty description="请在左侧选择一个部门节点" />
      </div>

      <!-- 已选中节点 -->
      <template v-else>
        <div class="table-wrap">
          <ProTable
            ref="tableRef"
            :columns="columns"
            :fetch-api="fetchUserList"
            :data="userList"
            :total="userTotal"
            :search-params="searchParams"
            :page-sizes="[10, 20, 50]"
            :immediate="false"
            show-index
            index-label="序号"
            :index-width="100"
            row-key="id"
            @response="handleResponse"
          >
            <template #action="scope">
              <el-button type="danger" link :icon="Delete" @click="handleUnbindUser(getRow(scope))"> 解绑 </el-button>
            </template>
          </ProTable>
        </div>
      </template>
    </div>

    <!-- 组织弹窗 -->
    <el-dialog v-model="orgDialogVisible" :title="orgDialogTitle" width="420px" align-center append-to-body>
      <el-form ref="orgFormRef" :model="orgForm" :rules="orgRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="orgForm.name" placeholder="请输入组织名称" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="排班类型" prop="dutyType">
          <el-select v-model="orgForm.dutyType" placeholder="请选择排班类型" clearable style="width: 100%">
            <el-option v-for="opt in dutyTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orgDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="orgDialogLoading" @click="submitOrg">确定</el-button>
      </template>
    </el-dialog>

    <!-- 部门弹窗 -->
    <el-dialog v-model="nodeDialogVisible" :title="nodeDialogTitle" width="480px" append-to-body>
      <el-form ref="nodeFormRef" :model="nodeForm" :rules="nodeRules" label-width="90px">
        <el-form-item label="编码" prop="code">
          <el-input v-model="nodeForm.code" placeholder="请输入编码" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="nodeForm.name" placeholder="请输入名称" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="nodeForm.type" :disabled="nodeTypeDisabled">
            <el-radio :value="1">单位</el-radio>
            <el-radio :value="2">部门</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="nodeDialogLoading" @click="submitNode">确定</el-button>
      </template>
    </el-dialog>

    <!-- 警员选择弹窗 -->
    <PoliceSelectDialog
      v-model:visible="policeDialogVisible"
      :node-id="currentNode ? currentNode.id : ''"
      :node-name="currentNode ? currentNode.name : ''"
      @confirm="handlePoliceConfirm"
    />
  </div>
</template>

<style lang="less" scoped>
.custom-department {
  display: flex;
  height: 100%;
  overflow: hidden;
  background: @color-bg-card;
  border-radius: @radius-md;
}

.level-tree-panel {
  display: flex;
  flex-direction: column;
  background: @color-bg-card;
  overflow: hidden;
  flex-shrink: 0;
  margin: @spacing-sm 0 @spacing-sm @spacing-sm;
  min-width: 180px;
  max-width: 480px;
  transition: width 0s;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: @panel-header-height;
  padding: 0 14px;
  border-bottom: 1px solid @color-border-panel;
  flex-shrink: 0;
  background: @color-bg-card;

  &__actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}

.panel-title {
  font-size: @font-size-md;
  font-weight: 600;
  color: @color-text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: @radius-xs;
    background: @color-scrollbar-thumb-strong;
  }
}

.level-tree {
  width: 100%;
}

// 自定义树节点
.custom-tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  font-size: @font-size-sm;
  overflow: hidden;

  .node-folder-icon {
    flex-shrink: 0;
    margin-right: 6px;
    font-size: @font-size-md-plus;
    color: @color-icon-folder;
  }

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .node-more {
    flex-shrink: 0;
    visibility: hidden;
    margin-left: 4px;

    &.is-open {
      visibility: visible;

      .node-more-icon {
        background: @color-bg-hover;
      }
    }
  }

  &:hover .node-more {
    visibility: visible;
  }

  .node-more-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: @radius-sm;
    cursor: pointer;
    color: @color-icon-muted;
    transform: rotate(90deg);

    &:hover {
      background: @color-border-panel;
      color: @color-primary;
    }
  }
}

// 选中节点高亮
:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: @color-primary-light-9;
  color: @color-primary;
  font-weight: 600;

  .node-folder-icon {
    color: @color-primary;
  }
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;

  .el-icon {
    margin-right: 6px;
    flex-shrink: 0;
  }
}

:deep(.el-tree-node__content) {
  height: 32px;
  line-height: 32px;
  border-radius: @radius-xs;
}

.tree-add-root {
  flex-shrink: 0;
  padding: 10px 12px;
  border-top: 1px solid @color-border-panel;
  background: @color-bg-card;
}

.dropdown-item--danger {
  color: @color-danger;
}

.level-content-panel {
  display: flex;
  flex-direction: column;
  background: @color-bg-card;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  margin: @spacing-sm @spacing-sm @spacing-sm 0;
}

.search-wrap {
  display: flex;
  margin-right: 12px;
  align-items: center;
}

.empty-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-wrap {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
