﻿<script setup lang="ts">
/**
 * EditRole - 角色新增/编辑弹窗
 *
 * 角色编辑弹窗：
 * - 基本信息：角色名称（编辑时禁用）
 * - 双 Tab：角色权限（RoleAuth）+ 数据权限（DataAuth）
 *   - 角色权限 Tab：三按钮切换 client/admin/h5 三套权限树
 *     - 按钮文案：{title}客户端 / {title}后台管理系统 / {title}H5
 *     - 三棵树同时加载，切换时保留各自选中状态
 *     - 系统内置菜单（status=2）默认勾选 + 禁用编辑
 *     - client 树：勾选「群组归档」自动勾选「协同群组」（反向同理）
 *     - h5 树：同 client 联动逻辑
 *     - License 过滤：groupCollaborationAuth / AICollaborationAuth
 *     - admin 树：隐藏非叶子节点的 checkbox，叶子节点的展开图标保留
 *   - 数据权限 Tab：使用 DataPermissionTree 穿梭树组件
 * - 提交参数字段：{ name, iccPrivJson, adminPrivJson, cappPrivJson, orgPrivList }
 */
import type { ElTree, FormInstance, FormRules } from 'element-plus';
import { computed, nextTick, ref, watch } from 'vue';

import type { MenuItem } from '#/menu';
import { getMenuList } from '@/api/permission/menu';
import type { RoleItem } from '@/api/permission/role';
import { useSettingsStore } from '@/store/modules/useSettingsStore';
import { useUserStore } from '@/store/modules/useUserStore';
import DataPermissionTree from '@/views/authority/components/DataPermissionTree.vue';

defineOptions({ name: 'EditRole' });

interface Props {
  /** 弹窗是否可见（v-model:visible） */
  visible: boolean;
  /** 弹窗标题 */
  title: string;
  /** 角色表单初始数据 */
  form: Partial<RoleItem>;
  /** 兼容旧 prop（未使用） */
  applicationId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '新增角色',
  form: () => ({}),
  applicationId: '',
});

const emit = defineEmits<{
  /** 弹窗可见性变化时触发（用于 v-model:visible） */
  (e: 'update:visible', v: boolean): void;
  /** 提交表单时触发，返回完整 payload */
  (e: 'submit', payload: Record<string, unknown>): void;
}>();

const formRef = ref<FormInstance>();
// 三棵权限树 ref
const clientTreeRef = ref<InstanceType<typeof ElTree>>();
const adminTreeRef = ref<InstanceType<typeof ElTree>>();
const h5TreeRef = ref<InstanceType<typeof ElTree>>();
// 数据权限穿梭树 ref（指向 DataPermissionTree 组件实例）
const dataAuthTreeRef = ref<InstanceType<typeof DataPermissionTree>>();

const innerVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

/** 角色基本信息表单结构 */
const formData = ref<Partial<RoleItem> & { dataAuthTreecheckedKeys?: string[] }>({
  name: '',
  iccPrivJson: [],
  adminPrivJson: [],
  cappPrivJson: [],
  orgPrivList: [],
  dataAuthTreecheckedKeys: [],
});

const rules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
};

/** 是否为编辑模式（form.id 存在） */
const isEdit = computed(() => Boolean(props.form?.id));

/** 弹窗标题（fallback） */
const dialogTitle = computed(() => props.title || (isEdit.value ? '编辑角色' : '新增角色'));

/** 系统标题（用于按钮文案） */
const settingsStore = useSettingsStore();
const systemTitle = computed(() => settingsStore.systemName);
/** 三个按钮文案：ICC={title}客户端 / ICS={title}后台管理系统 / Capp={title}H5 */
const iccButtonText = computed(() => `${systemTitle.value}客户端`);
const icsButtonText = computed(() => `${systemTitle.value}后台管理系统`);
const cappButtonText = computed(() => `${systemTitle.value}H5`);

// ===== Tab 切换：角色权限 / 数据权限 =====
type RoleTabName = 'RoleAuth' | 'DataAuth';
const activeTab = ref<RoleTabName>('RoleAuth');

// ===== 三按钮切换：client / admin / h5 =====
type AppScope = 'client' | 'admin' | 'h5';
const activeButton = ref<AppScope>('client');

// ===== 三棵权限树数据 =====
const menuTree = ref<MenuItem[][]>([[], [], []]);
const treeLoading = ref(false);

// 硬编码的菜单 ID（applicationId 映射）
const APP_IDS = ['1289822833455460001', '', '1289822833455460002'];

// 群组归档 / 协同群组联动 ID
const CLIENT_GROUP_ARCHIVE_ID = '1522392406668870002';
const CLIENT_COLLAB_GROUP_ID = '1522392406668870001';
const H5_GROUP_ARCHIVE_ID = '1522392406668870010';
const H5_COLLAB_GROUP_ID = '1522392406668870009';

// License 过滤的菜单 ID
const LICENSE_FILTER_IDS = {
  groupCollaborationAuth: {
    0: ['1522392406668870001', '1522392406668870002'],
    1: ['1522392406668869809'],
    2: ['1522392406668870009', '1522392406668870010'],
  },
  AICollaborationAuth: {
    2: ['1522392406668869999'],
  },
};

const userStore = useUserStore();

/** 监听 visible，打开时初始化 */
watch(
  () => props.visible,
  async (v) => {
    if (!v) return;
    // 重置 Tab 状态
    activeTab.value = 'RoleAuth';
    activeButton.value = 'client';
    // 重置并填充表单
    formData.value = {
      name: '',
      iccPrivJson: [],
      adminPrivJson: [],
      cappPrivJson: [],
      orgPrivList: [],
      dataAuthTreecheckedKeys: [],
      ...props.form,
    };
    // 确保数组字段存在
    formData.value.iccPrivJson = formData.value.iccPrivJson ?? [];
    formData.value.adminPrivJson = formData.value.adminPrivJson ?? [];
    formData.value.cappPrivJson = formData.value.cappPrivJson ?? [];
    formData.value.orgPrivList = formData.value.orgPrivList ?? [];
    formData.value.dataAuthTreecheckedKeys = getAllIds(formData.value.orgPrivList);

    // 加载三棵权限树（仅首次加载，如未加载）
    if (menuTree.value.every((t) => t.length === 0)) {
      await loadAllMenuTrees();
    }
    // 树渲染完后回填三棵权限树的选中状态
    await nextTick();
    setCheckedKeysForAll();

    // 弹窗打开后恢复数据权限选中状态
    await nextTick();
    if (dataAuthTreeRef.value) {
      const normalized = dataAuthTreeRef.value.syncFromDetail({
        orgList: formData.value.orgPrivList as Array<{ id: string; name: string; path?: string }>,
      });
      if (normalized && normalized.length) {
        formData.value.orgPrivList = normalized;
      }
    }
  },
);

/**
 * 加载所有 Tab 的菜单树数据
 * - admin 菜单树（status=2 的系统内置菜单默认勾选并 disabled）
 * - client 菜单树
 * - h5 菜单树
 */
async function loadAllMenuTrees(): Promise<void> {
  treeLoading.value = true;
  try {
    const licenseAuth = (userStore as unknown as { licenseAuth?: Record<string, boolean> }).licenseAuth;
    const promises = APP_IDS.map((appId, index) =>
      getMenuList({ applicationId: appId })
        .then((res) => {
          if (res?.code === 0 && res.data) {
            let data = filterPermissionData(res.data as MenuItem[]);
            // 系统内置菜单（status=2）默认勾选 + 禁用编辑
            data = data.map((item) => {
              const cloned = { ...item };
              if ((item as { status?: number }).status === 2) {
                cloned.disabled = true;
                const key = (['iccPrivJson', 'adminPrivJson', 'cappPrivJson'] as const)[index];
                if (!formData.value[key]?.includes(item.id)) {
                  formData.value[key] = [...(formData.value[key] ?? []), item.id];
                }
              }
              return cloned;
            });
            // License 过滤
            if (licenseAuth?.groupCollaborationAuth) {
              const filterIds = LICENSE_FILTER_IDS.groupCollaborationAuth[index as 0 | 1 | 2];
              if (filterIds) {
                data = data.filter((item) => !filterIds.includes(item.id));
              }
            }
            if (licenseAuth?.AICollaborationAuth && index === 2) {
              const filterIds = LICENSE_FILTER_IDS.AICollaborationAuth[2];
              if (filterIds) {
                data = data.filter((item) => !filterIds.includes(item.id));
              }
            }
            menuTree.value[index] = data;
          }
        })
        .catch((e) => {
          console.error(`[EditRole] 加载权限树 ${index} 失败:`, e);
        }),
    );
    await Promise.all(promises);
  } finally {
    treeLoading.value = false;
  }
}

/**
 * 批量设置三棵权限树的选中状态
 * - 依据 formData 中的 iccPrivJson / adminPrivJson / cappPrivJson
 * - 在 nextTick 中执行，确保树已渲染
 */
function setCheckedKeysForAll(): void {
  nextTick(() => {
    clientTreeRef.value?.setCheckedKeys(formData.value.iccPrivJson ?? []);
    adminTreeRef.value?.setCheckedKeys(formData.value.adminPrivJson ?? []);
    h5TreeRef.value?.setCheckedKeys(formData.value.cappPrivJson ?? []);
  });
}

/**
 * 过滤权限数据：递归剔除 status 非 0/2 的禁用菜单
 * 仅保留 status=0（启用）或 status=2（系统内置）的菜单
 * @param data - 原始菜单树
 * @returns 过滤后的菜单树
 */
function filterPermissionData(data: MenuItem[]): MenuItem[] {
  if (!data || data.length === 0) return [];
  return data.reduce<MenuItem[]>((result, item) => {
    const status = (item as { status?: number }).status;
    if (status !== 0 && status !== 2) {
      return result;
    }
    const cloned: MenuItem = { ...item };
    if (item.children && item.children.length > 0) {
      const filteredChildren = filterPermissionData(item.children);
      if (filteredChildren.length > 0) {
        cloned.children = filteredChildren;
      } else {
        cloned.children = null;
      }
    }
    result.push(cloned);
    return result;
  }, []);
}

/**
 * 递归收集所有节点 id（含父节点）
 * @param data - 菜单树
 * @returns 所有节点 id 数组
 */
function getAllIds(data: unknown[]): string[] {
  const ids: string[] = [];
  function traverse(nodes: unknown[]): void {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      const n = node as { id?: string; children?: unknown[] };
      if (n.id) ids.push(n.id);
      if (n.children && Array.isArray(n.children)) traverse(n.children);
    }
  }
  traverse(data);
  return ids;
}

// ===== 三棵权限树的勾选事件 =====
/**
 * client 权限树勾选变化处理
 * - 同步 formData.iccPrivJson
 * - 联动：勾选「群组归档」时自动勾选「协同群组」
 * - 反向：取消「协同群组」时自动取消「群组归档」
 * @param node - 当前操作的节点
 * @param isSelect - 是否为选中（true=勾选，false=取消）
 */
function handleClientCheckChange(node: MenuItem | null, isSelect: boolean): void {
  const checkedKeys = clientTreeRef.value?.getCheckedKeys() as string[];
  formData.value.iccPrivJson = checkedKeys ?? [];
  // 联动：勾选「群组归档」时自动勾选「协同群组」
  if (node && (node as { id?: string }).id === CLIENT_GROUP_ARCHIVE_ID && isSelect) {
    if (!checkedKeys.includes(CLIENT_COLLAB_GROUP_ID)) {
      formData.value.iccPrivJson = [CLIENT_COLLAB_GROUP_ID, ...checkedKeys];
      clientTreeRef.value?.setCheckedKeys(formData.value.iccPrivJson);
    }
  }
  // 反向：取消「协同群组」时自动取消「群组归档」
  if (node && (node as { id?: string }).id === CLIENT_COLLAB_GROUP_ID && !isSelect) {
    if (checkedKeys.includes(CLIENT_GROUP_ARCHIVE_ID)) {
      formData.value.iccPrivJson = checkedKeys.filter((k) => k !== CLIENT_GROUP_ARCHIVE_ID);
      clientTreeRef.value?.setCheckedKeys(formData.value.iccPrivJson);
    }
  }
}

/**
 * admin 权限树勾选变化处理
 * 同步 formData.adminPrivJson（admin 树使用 check-strictly，仅叶子节点可勾选）
 */
function handleAdminCheckChange(): void {
  formData.value.adminPrivJson = adminTreeRef.value?.getCheckedKeys() as string[];
}

/**
 * h5 权限树勾选变化处理
 * - 同步 formData.cappPrivJson
 * - 联动：勾选「群组归档」时自动勾选「协同群组」
 * - 反向：取消「协同群组」时自动取消「群组归档」
 * @param node - 当前操作的节点
 * @param isSelect - 是否为选中（true=勾选，false=取消）
 */
function handleH5CheckChange(node: MenuItem | null, isSelect: boolean): void {
  const checkedKeys = h5TreeRef.value?.getCheckedKeys() as string[];
  formData.value.cappPrivJson = checkedKeys ?? [];
  if (node && (node as { id?: string }).id === H5_GROUP_ARCHIVE_ID && isSelect) {
    if (!checkedKeys.includes(H5_COLLAB_GROUP_ID)) {
      formData.value.cappPrivJson = [H5_COLLAB_GROUP_ID, ...checkedKeys];
      h5TreeRef.value?.setCheckedKeys(formData.value.cappPrivJson);
    }
  }
  if (node && (node as { id?: string }).id === H5_COLLAB_GROUP_ID && !isSelect) {
    if (checkedKeys.includes(H5_GROUP_ARCHIVE_ID)) {
      formData.value.cappPrivJson = checkedKeys.filter((k) => k !== H5_GROUP_ARCHIVE_ID);
      h5TreeRef.value?.setCheckedKeys(formData.value.cappPrivJson);
    }
  }
}

// ===== 数据权限 Tab =====
/**
 * 数据权限穿梭树勾选变化时触发
 * 接收 DataPermissionTree 的 change 事件，同步选中节点到 formData.orgPrivList
 * @param checkedDetail - 选中节点详情数组，元素结构: { id, name, path? }
 */
function changeDataAuthCheckKeys(checkedDetail: Array<{ id: string; name: string; path?: string }>): void {
  formData.value.orgPrivList = checkedDetail;
}

/**
 * 提交表单：组装 payload 并 emit submit 事件
 * payload 字段：{ name, iccPrivJson, adminPrivJson, cappPrivJson, orgPrivList, id? }
 * @returns Promise<void>，校验失败时静默捕获
 */
async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate();
    const params: Record<string, unknown> = {
      name: formData.value.name,
      iccPrivJson: formData.value.iccPrivJson ?? [],
      adminPrivJson: formData.value.adminPrivJson ?? [],
      cappPrivJson: formData.value.cappPrivJson ?? [],
      orgPrivList: formData.value.orgPrivList ?? [],
    };
    if (isEdit.value && formData.value.id) {
      params.id = formData.value.id;
    }
    emit('submit', params);
  } catch {
    // 校验失败
  }
}

/** 关闭弹窗：重置表单状态并 emit update:visible=false */
function handleClose(): void {
  innerVisible.value = false;
  formRef.value?.resetFields();
  // 清空所有树选中状态
  nextTick(() => {
    clientTreeRef.value?.setCheckedKeys([]);
    adminTreeRef.value?.setCheckedKeys([]);
    h5TreeRef.value?.setCheckedKeys([]);
    dataAuthTreeRef.value?.reset();
  });
}
</script>

<template>
  <el-dialog
    v-model="innerVisible"
    :title="dialogTitle"
    width="800px"
    align-center
    :close-on-click-modal="false"
    class="edit-role-dialog"
    @close="handleClose"
  >
    <!-- 基本信息 -->
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="left">
      <el-form-item label="角色名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入角色名称"
          maxlength="50"
          show-word-limit
          clearable
          :disabled="isEdit"
        />
      </el-form-item>
    </el-form>

    <!-- 双 Tab：角色权限 / 数据权限 -->
    <el-tabs v-model="activeTab" class="role-tabs">
      <!-- 角色权限 Tab -->
      <el-tab-pane label="角色权限" name="RoleAuth" style="max-height: 400px; overflow-y: auto">
        <div class="my-tab-pane-btn">
          <!-- 三按钮切换：size=default 对应 Element UI small 尺寸 32px -->
          <div class="my-tab-btn">
            <el-button
              :type="activeButton === 'client' ? 'primary' : ''"
              plain
              size="default"
              @click="activeButton = 'client'"
            >
              {{ iccButtonText }}
            </el-button>
            <el-button
              :type="activeButton === 'admin' ? 'primary' : ''"
              plain
              size="default"
              @click="activeButton = 'admin'"
            >
              {{ icsButtonText }}
            </el-button>
            <el-button :type="activeButton === 'h5' ? 'primary' : ''" plain size="default" @click="activeButton = 'h5'">
              {{ cappButtonText }}
            </el-button>
          </div>

          <!-- 三棵树（v-show 切换保留状态） -->
          <div v-loading="treeLoading" class="my-tab-content">
            <div v-show="activeButton === 'client'" class="client-tree">
              <el-tree
                ref="clientTreeRef"
                node-key="id"
                show-checkbox
                default-expand-all
                highlight-current
                :props="{ children: 'children', label: 'name', disabled: 'disabled' }"
                :data="menuTree[0]"
                @check-change="(node: any, isSelect: boolean) => handleClientCheckChange(node, isSelect)"
              />
            </div>
            <div v-show="activeButton === 'admin'" class="admin-tree">
              <el-tree
                ref="adminTreeRef"
                node-key="id"
                show-checkbox
                default-expand-all
                highlight-current
                :check-strictly="true"
                :props="{ children: 'children', label: 'name', disabled: 'disabled' }"
                :data="menuTree[1]"
                @check-change="handleAdminCheckChange"
              />
            </div>
            <div v-show="activeButton === 'h5'" class="h5-tree">
              <el-tree
                ref="h5TreeRef"
                node-key="id"
                show-checkbox
                default-expand-all
                highlight-current
                :props="{ children: 'children', label: 'name', disabled: 'disabled' }"
                :data="menuTree[2]"
                @check-change="(node: any, isSelect: boolean) => handleH5CheckChange(node, isSelect)"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 数据权限 Tab -->
      <el-tab-pane label="数据权限" name="DataAuth">
        <div class="data-auth-wrapper">
          <DataPermissionTree
            ref="dataAuthTreeRef"
            :check-strictly="true"
            :default-checked-keys="formData.dataAuthTreecheckedKeys"
            :show-node-select-all="true"
            :show-node-cancel-all="false"
            height="100%"
            left-title="部门列表"
            right-title="已选择"
            filter-placeholder="搜索部门"
            @change="changeDataAuthCheckKeys"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
// ===== 角色编辑弹窗样式 =====
.data-auth-wrapper {
  height: 400px;
  overflow: hidden;
}

// el-tabs 标签字号调大（视觉强调）
.role-tabs {
  :deep(.el-tabs__header) {
    margin: 0 0 @spacing-md;
  }

  :deep(.el-tabs__nav-wrap) {
    .el-tabs__item {
      font-size: @font-size-md-plus !important; // 15px
      font-weight: @font-weight-medium !important;
      height: 44px !important;
      line-height: 44px !important;
      padding: 0 @spacing-lg !important;
    }
  }
}

// admin 树：隐藏非叶子节点的 checkbox，但保留叶子节点的 checkbox
.admin-tree {
  :deep(.el-tree) {
    .el-tree-node {
      // 叶子节点的 checkbox 显示
      .is-leaf + .el-checkbox .el-checkbox__inner {
        display: inline-block;
      }
      // 非叶子节点的 checkbox 隐藏
      .el-checkbox .el-checkbox__inner {
        display: none;
      }
    }
  }
}

// 三按钮 + 树容器样式
.my-tab-pane-btn {
  .my-tab-btn {
    display: flex;
    gap: @spacing-sm;
    margin-bottom: @spacing-sm-plus;

    :deep(.el-button--primary.is-plain:focus),
    :deep(.el-button--primary.is-plain:hover) {
      background-color: @color-primary-light-9;
      color: @color-primary;
    }
  }

  .my-tab-content {
    margin-top: @spacing-md;
    min-height: 300px;
  }

  // client / h5 树容器：添加左右 padding，让整行点击选中样式更美观
  .client-tree,
  .h5-tree {
    :deep(.el-tree-node__content) {
      height: 32px;
      border-radius: @radius-sm;
      padding-right: @spacing-sm;
      transition: background-color 0.2s;

      &:hover {
        background-color: @color-bg-table-row-hover;
      }
    }

    :deep(.el-tree-node.is-checked > .el-tree-node__content) {
      background-color: @color-primary-light-9;
    }
  }

  // 隐藏叶子节点的展开图标，但 admin-tree 中保留
  :deep(.el-tree-node__expand-icon.is-leaf) {
    display: none;
  }

  .admin-tree :deep(.el-tree-node__expand-icon.is-leaf) {
    display: inline-block;
  }

  // disabled 节点变灰色（不可编辑状态视觉反馈）
  // Element Plus 中 disabled 节点的 checkbox 有 is-disabled class，文字需要手动变灰
  :deep(.el-tree-node) {
    // 含 disabled 数据的节点：文字变灰
    .el-tree-node__content:has(.el-checkbox.is-disabled) {
      .el-tree-node__label,
      .custom-tree-node .node-label {
        color: @color-text-placeholder;
        cursor: not-allowed;
      }
    }

    // disabled checkbox 样式
    .el-checkbox.is-disabled {
      .el-checkbox__inner {
        background-color: @color-bg-table-row-hover !important;
        border-color: @color-border !important;
        cursor: not-allowed !important;

        &::after {
          border-color: @color-text-placeholder !important;
        }
      }

      // 已勾选的 disabled checkbox 保持主色但不可点击（light-7 弱化）
      &.is-checked .el-checkbox__inner {
        background-color: @color-primary-light-7 !important;
        border-color: @color-primary-light-7 !important;

        &::after {
          border-color: @color-bg-card !important;
        }
      }
    }
  }
}

// 角色名称表单
:deep(.el-input.is-disabled .el-input__inner) {
  background-color: transparent;
}

:deep(.el-form-item) {
  margin-bottom: @spacing-xs-plus;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: @spacing-xs;
}
</style>
