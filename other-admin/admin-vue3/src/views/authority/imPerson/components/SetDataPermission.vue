<script setup lang="ts">
/**
 * SetDataPermission - 设置数据权限弹窗（前台用户）
 *
 * 功能特性：
 * - 显示用户姓名
 * - 部门树多选（show-checkbox + 父子联动）
 * - 提交时更新 imOrgPrivJson 字段（数组形式）
 *
 * 简化方案：基于 el-tree + queryDepartment API
 */
import { ElMessage } from 'element-plus';
import type { ElTree, FormInstance } from 'element-plus';
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { queryDepartment } from '@/api/h5/collaboration';
import { updatePerson } from '@/api/permission/user';
import type { UserItem } from '@/api/permission/user';

defineOptions({ name: 'SetDataPermission' });

interface DepartmentNode {
  id: string;
  name: string;
  code?: string;
  parentId?: string;
  children?: DepartmentNode[];
  [key: string]: unknown;
}

const { t } = useI18n({ useScope: 'global' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const dialogVisible = ref(false);
const submitLoading = ref(false);
const treeLoading = ref(false);

const formRef = ref<FormInstance>();
const treeRef = ref<InstanceType<typeof ElTree>>();

/** 当前编辑用户 */
const currentUser = ref<Partial<UserItem> | null>(null);

/** 部门树数据 */
const departmentTree = ref<DepartmentNode[]>([]);

/** 已选部门 ID 列表（初始化用） */
const checkedKeys = ref<string[]>([]);

const dialogTitle = computed(() => '设置数据权限');

/** 获取所有节点 ID（递归） */
function getAllIds(nodes: DepartmentNode[]): string[] {
  const ids: string[] = [];
  function traverse(list: DepartmentNode[]): void {
    if (!Array.isArray(list)) return;
    for (const node of list) {
      if (node.id) ids.push(node.id);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  traverse(nodes);
  return ids;
}

/** 加载部门树 */
async function loadDepartmentTree(): Promise<void> {
  treeLoading.value = true;
  try {
    const res = await queryDepartment({});
    if (res?.code === 0 && res.data) {
      departmentTree.value = res.data as DepartmentNode[];
    }
  } catch (e) {
    console.error('[SetDataPermission] 加载部门树失败:', e);
    ElMessage.error('加载部门树失败');
  } finally {
    treeLoading.value = false;
  }
}

/** 初始化（对外暴露） */
async function init(row: UserItem): Promise<void> {
  currentUser.value = { ...row };
  // 解析 imOrgPrivJson 获取已选 id 列表
  const imOrgPrivJson = (row as { imOrgPrivJson?: unknown }).imOrgPrivJson;
  if (Array.isArray(imOrgPrivJson)) {
    checkedKeys.value = getAllIds(imOrgPrivJson as DepartmentNode[]);
  } else {
    checkedKeys.value = [];
  }
  // 加载部门树
  await loadDepartmentTree();
  // 显示弹窗
  dialogVisible.value = true;
  // 树渲染完成后回填选中
  await nextTick();
  if (treeRef.value && checkedKeys.value.length > 0) {
    treeRef.value.setCheckedKeys(checkedKeys.value);
  }
}

/** 确认提交 */
async function handleConfirm(): Promise<void> {
  if (!currentUser.value?.id) {
    ElMessage.error('用户信息缺失');
    return;
  }
  submitLoading.value = true;
  try {
    const checked = treeRef.value?.getCheckedKeys() as string[];
    const halfChecked = treeRef.value?.getHalfCheckedKeys() as string[];
    const imOrgPrivJson = [...checked, ...halfChecked].map((id) => ({ id }));
    // 调用 updatePerson 更新 imOrgPrivJson 字段
    const res = await updatePerson({
      id: currentUser.value.id,
      imOrgPrivJson,
    } as Partial<UserItem>);
    if (res.code === 0) {
      ElMessage.success(res.msg || '设置成功');
      emit('success');
      handleClose();
    } else {
      ElMessage.error(res.msg || '设置失败');
    }
  } catch {
    ElMessage.error('设置失败');
  } finally {
    submitLoading.value = false;
  }
}

/** 关闭弹窗 */
function handleClose(): void {
  dialogVisible.value = false;
  currentUser.value = null;
  checkedKeys.value = [];
  nextTick(() => {
    treeRef.value?.setCheckedKeys([]);
  });
}

defineExpose({ init });
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    width="640px"
    align-center
    @close="handleClose"
  >
    <el-form ref="formRef" label-width="100px">
      <el-form-item label="用户姓名">
        <span>{{ currentUser?.name || '-' }}</span>
      </el-form-item>
      <el-form-item label="数据权限">
        <el-card v-loading="treeLoading" shadow="never" class="tree-card">
          <el-tree
            ref="treeRef"
            :data="departmentTree"
            show-checkbox
            node-key="id"
            default-expand-all
            :props="{ children: 'children', label: 'name' }"
            class="department-tree"
          />
          <div v-if="!treeLoading && departmentTree.length === 0" class="empty-state">暂无部门数据</div>
        </el-card>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleConfirm">
        {{ t('determine') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.tree-card {
  max-height: 400px;
  overflow-y: auto;

  :deep(.el-card__body) {
    padding: 12px;
  }
}

.department-tree {
  :deep(.el-tree-node__content) {
    height: 32px;
  }
}

.empty-state {
  text-align: center;
  color: @color-text-secondary;
  padding: 40px 0;
}
</style>
