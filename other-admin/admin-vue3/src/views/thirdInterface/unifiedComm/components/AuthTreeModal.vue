<script setup lang="ts">
/**
 * AuthTreeModal - 通用授权弹窗（el-tree 多选 + 回显 + 保存）
 *
 * 权限树弹窗：
 * 1. 单用户设备授权（api='org'）：getImuserPriv / setImuserPriv + getIcpDepartmentTree
 * 2. 单用户摄像头授权（api='camera'）：getCameraPriv / setCameraPriv + getIcpCameraTree
 * 3. 批量部门设备授权（api='batchOrg'）：getDeptOrgPriv + batchSetDeptOrgPriv + getIcpDepartmentTree
 * 4. 批量部门摄像头授权（api='batchCamera'）：getDeptCameraPriv + batchSetDeptCameraPriv + getIcpCameraTree
 *
 * 通过 props.treeFields 适配不同的树节点字段：
 * - 部门树：departmentid / departmentname
 * - 摄像头树：levelNumber / nodeName
 *
 * Props:
 * - visible: boolean，v-model 控制显隐
 * - title: string，弹窗标题
 * - api: 'org' | 'camera' | 'batchOrg' | 'batchCamera'
 * - targetId: string，单用户场景传 userId
 * - deptCode: string，批量场景传部门编码
 * - deptName: string，批量场景显示部门名（顶部 batch-info）
 * - isChildren: number，批量场景是否包含子部门
 * - treeFields: { id: string; label: string }，授权树的 id/label 字段名
 *
 * Events:
 * - update:visible
 * - success: 保存成功
 */
import { ElMessage } from 'element-plus';
import type ElTree from 'element-plus/es/components/tree/index';
import { computed, nextTick, ref, watch } from 'vue';

import {
  batchSetDeptCameraPriv,
  batchSetDeptOrgPriv,
  getCameraPriv,
  getDeptCameraPriv,
  getDeptOrgPriv,
  getIcpCameraTree,
  getIcpDepartmentTree,
  getImuserPriv,
  setCameraPriv,
  setImuserPriv,
} from '@/api/thirdInterface/unifiedComm';

defineOptions({ name: 'AuthTreeModal' });

interface Props {
  /** 弹窗是否可见（v-model:visible） */
  visible: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 保存接口函数 */
  api?: 'org' | 'camera' | 'batchOrg' | 'batchCamera';
  /** 授权目标 ID */
  targetId?: string;
  /** 部门编码（用于过滤可见数据） */
  deptCode?: string;
  /** 部门名称 */
  deptName?: string;
  /** 是否包含子部门数据 */
  isChildren?: number;
  /** 树字段配置（id/label 字段名） */
  treeFields?: { id: string; label: string };
}

const props = withDefaults(defineProps<Props>(), {
  title: '授权',
  api: 'org',
  targetId: '',
  deptCode: '',
  deptName: '',
  isChildren: 1,
  treeFields: () => ({ id: 'id', label: 'label' }),
});

const emit = defineEmits<{
  /** 弹窗可见性变化 */
  (e: 'update:visible', v: boolean): void;
  /** 授权保存成功后触发 */
  (e: 'success'): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

const treeRef = ref<InstanceType<typeof ElTree>>();
const loading = ref(false);
const submitting = ref(false);
/** 原始树数据（未拍平字段名）*/
const rawTreeData = ref<Record<string, unknown>[]>([]);
/** 已勾选的 key 数组 */
const checkedKeys = ref<string[]>([]);
/** 树搜索关键字 */
const filterText = ref('');

watch(filterText, (val) => {
  treeRef.value?.filter(val);
});

function filterNode(value: string, data: any): boolean {
  if (!value) return true;
  const label = data?.[props.treeFields.label] ?? data?.label ?? '';
  return String(label).includes(value);
}

const filterNodeMethod = filterNode as never;

const treeProps = computed(() => ({
  label: props.treeFields.label,
  children: 'children',
}));

/** 当前是否批量模式 */
const isBatchMode = computed(() => props.api === 'batchOrg' || props.api === 'batchCamera');
/** 当前是否摄像头场景 */
const isCameraMode = computed(() => props.api === 'camera' || props.api === 'batchCamera');

/**
 * 简化树数据结构
 *
 * 递归遍历树节点，仅保留指定的 id/label 字段及 children，剔除冗余字段。
 *
 * @param data 原始树数据数组
 * @param idField 节点 id 对应的字段名
 * @param labelField 节点 label 对应的字段名
 * @returns 精简后的树数据数组
 */
function simplifyTreeData(
  data: Record<string, unknown>[],
  idField: string,
  labelField: string,
): Record<string, unknown>[] {
  const simplify = (nodes: Record<string, unknown>[]): Record<string, unknown>[] => {
    return nodes.map((node) => {
      const simplified: Record<string, unknown> = {
        [idField]: node[idField],
        [labelField]: node[labelField],
      };
      if (Array.isArray(node.children) && node.children.length > 0) {
        simplified.children = simplify(node.children as Record<string, unknown>[]);
      }
      return simplified;
    });
  };
  return simplify(data);
}

/**
 * 拉取权限树数据
 *
 * 并行请求权限树（部门树/摄像头树）和已选权限回显数据，根据 api 模式自动选择对应接口：
 * - 单用户模式：按 targetId 查询用户权限
 * - 批量模式：按 deptCode 查询部门权限
 *
 * 请求成功后简化树结构并设置已勾选节点。
 *
 * @returns Promise，无返回值
 */
async function fetchData(): Promise<void> {
  loading.value = true;
  try {
    // 并行请求树和权限
    const treePromise = isCameraMode.value ? getIcpCameraTree() : getIcpDepartmentTree();
    let privPromise: Promise<{ code?: number; data?: unknown } | null> = Promise.resolve(null);

    if (isBatchMode.value) {
      // 批量模式：按部门回显
      if (props.deptCode) {
        privPromise = isCameraMode.value ? getDeptCameraPriv(props.deptCode) : getDeptOrgPriv(props.deptCode);
      }
    } else {
      // 单用户模式：按 userId 回显
      if (props.targetId) {
        privPromise = isCameraMode.value ? getCameraPriv(props.targetId) : getImuserPriv(props.targetId);
      }
    }

    const [treeRes, privRes] = await Promise.all([treePromise, privPromise]);

    // 处理树数据
    if (treeRes?.code === 0 && treeRes.data) {
      const treeList = Array.isArray(treeRes.data) ? treeRes.data : [treeRes.data];
      rawTreeData.value = simplifyTreeData(
        treeList as Record<string, unknown>[],
        props.treeFields.id,
        props.treeFields.label,
      );
    } else {
      rawTreeData.value = [];
    }

    // 处理已选权限
    if (privRes && (privRes.code === 0 || privRes.code === 200) && Array.isArray(privRes.data)) {
      checkedKeys.value = privRes.data as string[];
    } else {
      checkedKeys.value = [];
    }

    // 树渲染完后设置勾选
    nextTick(() => {
      treeRef.value?.setCheckedKeys(checkedKeys.value);
    });
  } catch (e) {
    console.error('[AuthTreeModal] 加载数据失败', e);
  } finally {
    loading.value = false;
  }
}

/** 弹窗打开时拉取 */
watch(
  () => props.visible,
  (val) => {
    if (val) {
      filterText.value = '';
      checkedKeys.value = [];
      rawTreeData.value = [];
      nextTick(() => {
        fetchData();
      });
    }
  },
);

/**
 * 保存授权
 *
 * 校验必填参数（targetId 或 deptCode），获取树组件当前勾选节点，
 * 根据 api 模式调用对应的保存接口，成功后提示并触发 success 事件关闭弹窗。
 *
 * @returns Promise，无返回值
 */
async function handleSave(): Promise<void> {
  // 校验
  if (isBatchMode.value) {
    if (!props.deptCode) {
      ElMessage.warning('缺少部门编码');
      return;
    }
  } else {
    if (!props.targetId) {
      ElMessage.warning('缺少目标用户 id');
      return;
    }
  }

  submitting.value = true;
  try {
    const keys = (treeRef.value?.getCheckedKeys() as string[]) ?? [];
    let ok = false;

    if (props.api === 'org' && props.targetId) {
      const res = await setImuserPriv(props.targetId, keys);
      ok = res?.code === 0;
    } else if (props.api === 'camera' && props.targetId) {
      const res = await setCameraPriv(props.targetId, keys);
      ok = res?.code === 0;
    } else if (props.api === 'batchOrg') {
      const res = await batchSetDeptOrgPriv({
        deptCodes: [props.deptCode],
        privs: keys,
        isChildren: props.isChildren,
      });
      ok = res?.code === 0 || res?.code === 200;
    } else if (props.api === 'batchCamera') {
      const res = await batchSetDeptCameraPriv({
        deptCodes: [props.deptCode],
        privs: keys,
        isChildren: props.isChildren,
      });
      ok = res?.code === 0 || res?.code === 200;
    }

    if (!ok) {
      ElMessage.error('保存失败');
      return;
    }
    ElMessage.success('保存成功');
    emit('success');
    dialogVisible.value = false;
  } finally {
    submitting.value = false;
  }
}

/**
 * 取消并关闭弹窗
 *
 * 通过设置 dialogVisible 为 false 触发 update:visible 事件关闭弹窗。
 */
function handleCancel(): void {
  dialogVisible.value = false;
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="600px"
    align-center
    append-to-body
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="auth-tree-modal">
      <!-- 批量模式：显示当前部门 -->
      <div v-if="isBatchMode && deptName" class="batch-info">
        <span class="batch-label">当前选中部门：</span>
        <el-tag size="default" effect="plain">{{ deptName }}</el-tag>
      </div>

      <el-input v-model="filterText" placeholder="输入关键字进行过滤" clearable style="margin-bottom: 12px" />

      <div class="tree-wrapper">
        <el-tree
          v-if="rawTreeData.length > 0 && !loading"
          ref="treeRef"
          :data="rawTreeData"
          :props="treeProps"
          :node-key="treeFields.id"
          show-checkbox
          :check-strictly="false"
          default-expand-all
          :filter-node-method="filterNodeMethod"
        />
        <el-empty v-if="!loading && rawTreeData.length === 0" description="暂无数据" />
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.auth-tree-modal {
  .batch-info {
    background: @color-bg-page;
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
  }

  .batch-label {
    font-size: 13px;
    color: @color-text-regular;
    margin-right: 8px;
  }

  .tree-wrapper {
    height: 420px;
    overflow-y: auto;
  }
}
</style>
