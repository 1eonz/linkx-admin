<script setup lang="ts">
/**
 * OrgTreeSelect - 组织部门树选择器，下拉展示部门树并支持节点选择
 *
 * 功能特性：
 * - el-popover + el-input + el-tree 组合实现下拉树选择交互
 * - 支持懒加载与同步加载两种模式，懒加载模式可自动从全局配置读取
 * - 非 admin 用户可基于身份证号自动定位所属部门作为根节点
 * - 输入框实时过滤树节点，支持清空操作
 * - 通过 v-model 双向绑定显示文本
 * - 可配置占位符、禁用状态、输入框宽度
 * - 可指定父部门 code 限定首次查询范围
 * - 暴露 getTreeRef 方法，便于外部操作 el-tree 实例
 *
 * @example 基础用法
 * <OrgTreeSelect v-model="deptName" @current-change="handleDeptChange" />
 *
 * @example 非 admin 用户限定部门 + 自定义宽度
 * <OrgTreeSelect
 *   v-model="deptName"
 *   :is-use-user-department="true"
 *   :is-disabled="false"
 *   width="220px"
 *   @current-change="handleDeptChange"
 *   @clear-val="handleClear"
 * />
 *
 * Props:
 * - modelValue: string，显示文本（双向绑定），默认 ''
 * - isInitValue: boolean，是否在 mounted 时把 value 同步到输入框，默认 false
 * - placeholder: string，占位符，默认 '请选择'
 * - isDisabled: boolean，是否禁用，默认 false
 * - departmentCode: string，父部门 code（用于非 admin 用户首次查询限定），默认 ''
 * - isUseUserDepartMent: boolean，是否使用登录用户所属部门（非 admin 时用身份证号查），默认 true
 * - lazy: boolean，懒加载模式（true=懒加载 / false=同步加载），不传则自动从 localStorage.globalConfig.DEPARTMENT_SYNC_SIGN 读取，默认 undefined
 * - width: string，输入框宽度，默认 '150px'
 *
 * Events:
 * - update:modelValue: 输入框文本变化时触发，参数 v: string（当前文本）
 * - clear-val: 点击清空按钮时触发，无参数
 * - current-change: 选中树节点时触发，参数 data: DepartmentNode（选中的部门节点）
 *
 * Slots: 无
 *
 * Methods:
 * - getTreeRef: 获取 el-tree 实例引用，无参数，返回树实例
 */
import { Search } from '@element-plus/icons-vue';
import { ref, watch, onMounted, computed } from 'vue';

import { queryDepartment, queryDepartmentTree, queryUserByIdCard, type DepartmentNode } from '@/api/h5/collaboration';
import { useUserStore } from '@/store/modules/useUserStore';
import { getIsAdmin, getIdCardNum } from '@/utils/auth';

defineOptions({ name: 'OrgTreeSelect' });

interface Props {
  /** 显示文本（双向绑定） */
  modelValue?: string;
  /** 初始值：是否在 mounted 时把 value 同步到输入框 */
  isInitValue?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 禁用 */
  isDisabled?: boolean;
  /** 父部门 code（用于非 admin 用户首次查询限定） */
  departmentCode?: string;
  /** 是否使用登录用户所属部门（非 admin 时用身份证号查） */
  isUseUserDepartMent?: boolean;
  /**
   * 懒加载模式：true=懒加载 / false=同步加载
   * 默认：不传则自动从 localStorage.globalConfig.DEPARTMENT_SYNC_SIGN 读取
   * true → 同步加载
   * false → 懒加载
   * 页面层无需关心此 prop，组件内部自动适配
   */
  lazy?: boolean;
  /** 输入框宽度 */
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  isInitValue: false,
  placeholder: '请选择',
  isDisabled: false,
  departmentCode: '',
  isUseUserDepartMent: true,
  lazy: undefined,
  width: '150px',
});

/**
 * 从 localStorage.globalConfig 读取 DEPARTMENT_SYNC_SIGN 全局开关
 *   true  → 同步加载
 *   false → 懒加载
 */
function readDepartmentSyncSign(): boolean {
  const globalConfigStr = localStorage.getItem('globalConfig');
  if (!globalConfigStr) return false;
  try {
    const globalConfig = JSON.parse(globalConfigStr);
    return globalConfig.DEPARTMENT_SYNC_SIGN === 'true' || globalConfig.DEPARTMENT_SYNC_SIGN === true;
  } catch {
    return false;
  }
}

// lazy 最终值：显式传参优先，否则从全局配置自动读取
const lazyMode = computed(() => {
  if (props.lazy !== undefined) return props.lazy;
  const syncSign = readDepartmentSyncSign();
  // DEPARTMENT_SYNC_SIGN=true → 同步加载 → lazy=false
  // DEPARTMENT_SYNC_SIGN=false → 懒加载 → lazy=true
  return !syncSign;
});

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'clear-val'): void;
  (e: 'current-change', data: DepartmentNode): void;
}>();

const userStore = useUserStore();

const inputText = ref('');
const treeRef = ref();
const popoverVisible = ref(false);
const treeData = ref<DepartmentNode[]>([]);

const isAdmin = getIsAdmin();
const idCardNum = getIdCardNum();
// 非 admin 用户的部门 code（从身份证号查出）
const userDepartmentCode = ref('');

const treeProps = { label: 'name', children: 'children' };

// ============= 输入框 v-model 同步 =============
watch(
  () => props.modelValue,
  (val) => {
    inputText.value = val;
  },
);

watch(inputText, (val) => {
  emit('update:modelValue', val);
  treeRef.value?.filter(val);
});

onMounted(() => {
  if (props.isInitValue) {
    inputText.value = props.modelValue;
  }
  if (!lazyMode.value) {
    // 同步模式：mounted 时拉取整棵树
    loadSyncTree();
  }
  // 懒加载模式：el-tree 的 load 回调自动触发，无需手动拉取
});

// ============= 非 admin 用户：用身份证号查所属部门 =============
async function getUserDepartment(): Promise<void> {
  if (!props.isUseUserDepartMent || isAdmin || !idCardNum) return;
  try {
    const res = await queryUserByIdCard({ idCard: idCardNum });
    if (res?.data?.userDepartments?.length) {
      const first = res.data.userDepartments[0];
      userDepartmentCode.value = first.departmentCode;
      // 把 userInfo 存到 store
      userStore.setUserInfoAction(res.data as never);
    }
  } catch (error) {
    console.error('[OrgTreeSelect] 查询用户部门失败:', error);
  }
}

// ============= 同步加载：一次性拉整棵树 =============
async function loadSyncTree(): Promise<void> {
  await getUserDepartment();
  const params: { parentCode?: string } = {};
  // 非 admin 且有用户部门 code → 限定查询
  const code = !isAdmin && userDepartmentCode.value ? userDepartmentCode.value : props.departmentCode;
  if (code) params.parentCode = code;
  try {
    const { code: resCode, data } = await queryDepartmentTree(params);
    if (resCode === 0 && data) {
      treeData.value = [data];
    }
  } catch (error) {
    console.error('[OrgTreeSelect] 加载部门树失败:', error);
  }
}

// ============= 懒加载：el-tree load 回调 =============
async function loadNode(node: any, resolve: (data: DepartmentNode[]) => void): Promise<void> {
  // 非 admin 用户首次（level 0）：用身份证查所属部门作为根
  if (props.isUseUserDepartMent && !isAdmin && idCardNum && node.level === 0) {
    await getUserDepartment();
    let deptArr: DepartmentNode[] = [];
    if (userDepartmentCode.value) {
      // 用 userDepartments 直接作为根节点
      try {
        const res = await queryUserByIdCard({ idCard: idCardNum });
        if (res?.data?.userDepartments?.length) {
          deptArr = res.data.userDepartments.map((item) => ({
            id: item.departmentId,
            code: item.departmentCode,
            name: item.departmentName,
          }));
          userStore.setUserInfoAction(res.data as never);
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (deptArr.length === 0) {
      deptArr = await loadDepartmentList(node?.data?.code);
    }
    return resolve(deptArr);
  }
  const res = await loadDepartmentList(node?.data?.code);
  resolve(res);
}

// ============= 拉取下一级部门（懒加载分支用） =============
async function loadDepartmentList(code = ''): Promise<DepartmentNode[]> {
  let newId = code;
  if (!isAdmin && !code && userDepartmentCode.value) {
    newId = userDepartmentCode.value;
  } else if (!isAdmin && !code && props.departmentCode) {
    newId = props.departmentCode;
  }
  const params: { parentCode?: string } = {};
  if (newId) params.parentCode = newId;
  try {
    const res = await queryDepartment(params);
    if (res.code === 0 && res.data?.length) {
      return res.data;
    }
    return [];
  } catch {
    return [];
  }
}

// ============= 选中节点 =============
function currentChange(data: DepartmentNode): void {
  inputText.value = data.name;
  emit('current-change', data);
  // 关闭 popover
  popoverVisible.value = false;
}

// ============= 清空 =============
function clearVal(): void {
  inputText.value = '';
  emit('clear-val');
}

// ============= 节点过滤（filter-node-method）=============
function filterNode(value: string, data: any): boolean {
  if (!value) return true;
  return data.name.indexOf(value) !== -1;
}

defineExpose({
  getTreeRef: () => treeRef.value,
});
</script>

<template>
  <div class="org-tree-select" :style="{ width }">
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom-start"
      trigger="click"
      :width="'auto'"
      popper-class="org-tree-select__popper"
    >
      <template #reference>
        <el-input
          v-model="inputText"
          :placeholder="placeholder"
          :disabled="isDisabled"
          :prefix-icon="Search"
          clearable
          @clear="clearVal"
        />
      </template>
      <el-tree
        ref="treeRef"
        class="org-tree-select__tree"
        node-key="id"
        :data="treeData"
        :props="treeProps"
        :load="lazyMode ? loadNode : undefined"
        :lazy="lazyMode"
        :default-expand-all="!lazyMode"
        :highlight-current="true"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        @current-change="currentChange"
      />
    </el-popover>
  </div>
</template>

<style lang="less" scoped>
.org-tree-select {
  display: inline-block;
  vertical-align: middle;

  :deep(.el-input) {
    width: 100%;
  }
}

.org-tree-select__tree {
  max-height: 280px;
  overflow: auto;
  min-width: 200px;
}
</style>
