<script setup lang="ts">
/**
 * EditUser - 管理员用户新增/编辑弹窗
 *
 * 功能特性：
 * 1. 用户名称（idCard）输入：不支持中文和空格，新增时可编辑，编辑时禁用
 * 2. 数据权限选择（DataPermissionTree 组件）：check-strictly 父子不联动
 * 3. 编辑回显：通过 getUserById 获取 orgIds/orgList，调 syncFromDetail 回显
 * 4. 提交前校验：至少选择 1 个数据权限
 *
 * @example 父组件调用
 * ```vue
 * <EditUser ref="editUserRef" @success="refresh" />
 * editUserRef.value?.open(row)  // 编辑
 * editUserRef.value?.open()     // 新增
 * ```
 *
 * Props: 无
 *
 * Events:
 * - success: 提交成功后触发
 *
 * Methods:
 * - open(row?: AdminUserItem): 打开弹窗（无参数为新增，有参数为编辑）
 */
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { nextTick, reactive, ref } from 'vue';

import { createAdminUser, getAdminUserById, updateAdminUser, type AdminUserItem } from '@/api/authority/adminUser';
import DataPermissionTree from '@/views/authority/components/DataPermissionTree.vue';

defineOptions({ name: 'EditUser' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const dialogTitle = ref('新增');
const isAdd = ref(true);
const confirmLoading = ref(false);
const detailLoading = ref(false);
const dataTreeReady = ref(false);

const formRef = ref<FormInstance>();
const dataAuthTreeRef = ref<InstanceType<typeof DataPermissionTree>>();

// ===== 表单数据 =====
const userForm = reactive<{
  idCard: string;
  orgIds: string[];
  orgList: Array<{ id: string; name: string; path?: string }>;
  dataAuthTreecheckedKeys: string[];
  id?: string;
}>({
  idCard: '',
  orgIds: [],
  orgList: [],
  dataAuthTreecheckedKeys: [],
});

// ===== 校验规则 =====
const rules: FormRules = {
  idCard: [
    { required: true, message: '用户名称不能为空', trigger: 'blur' },
    {
      pattern: /^[^\u4e00-\u9fa5\s]+$/,
      message: '不支持中文和空格，请输入英文、数字或特殊字符',
      trigger: 'blur',
    },
  ],
};

// ===== 打开弹窗 =====
function open(row?: AdminUserItem): Promise<void> {
  // 重置
  resetForm();
  isAdd.value = !row;
  dialogTitle.value = isAdd.value ? '新增' : '编辑';

  if (row) {
    // 编辑模式
    userForm.id = row.id;
    detailLoading.value = true;
    return getAdminUserById(row.id)
      .then((res) => {
        const data = res.data as AdminUserItem | undefined;
        if (data) {
          userForm.idCard = data.idCard ?? '';
          // 优先用 orgList（新格式）
          if (data.orgList && data.orgList.length > 0) {
            userForm.orgList = data.orgList;
            userForm.orgIds = data.orgIds ?? data.orgList.map((item) => item.id);
            userForm.dataAuthTreecheckedKeys = [];
          } else if (data.orgIds && data.orgIds.length > 0) {
            // 旧格式兜底
            userForm.orgIds = data.orgIds;
            userForm.orgList = [];
            userForm.dataAuthTreecheckedKeys = [];
          }
        }
        // 等待弹窗渲染后回显数据权限树
        nextTick(() => {
          syncTreeCheckedState();
        });
        dialogVisible.value = true;
      })
      .catch(() => {
        ElMessage.error('获取用户详情失败');
      })
      .finally(() => {
        detailLoading.value = false;
      });
  }

  dialogVisible.value = true;
  return Promise.resolve();
}

defineExpose({ open });

/** 同步树勾选状态 */
function syncTreeCheckedState(): void {
  const result = dataAuthTreeRef.value?.syncFromDetail({
    orgList: userForm.orgList,
    orgIds: userForm.orgIds,
  });
  if (result && result.length > 0) {
    userForm.orgList = result;
  }
}

/** 数据权限变化回调 */
function changeDataAuthCheckKeys(checkedDetail: Array<{ id: string; name: string; path?: string }>): void {
  userForm.orgList = checkedDetail;
  userForm.orgIds = checkedDetail.map((item) => item.id);
}

function handleDataTreeLoadState(ready: boolean): void {
  dataTreeReady.value = ready;
}

/** 用户名失焦去空格 */
function handleIdCardBlur(): void {
  if (isAdd.value) {
    userForm.idCard = userForm.idCard.trim();
  }
}

// ===== 提交 =====
async function handleConfirm(): Promise<void> {
  if (!dataTreeReady.value || detailLoading.value) return;
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  // 至少选择 1 个数据权限
  if (userForm.orgIds.length === 0) {
    ElMessage.warning('请至少选择一个数据权限');
    return;
  }

  confirmLoading.value = true;
  const param = {
    idCard: userForm.idCard,
    orgIds: userForm.orgIds,
    orgList: userForm.orgList,
    ...(isAdd.value ? {} : { id: userForm.id }),
  };
  const fn = isAdd.value ? createAdminUser : updateAdminUser;
  fn(param)
    .then((res) => {
      if (res.code === 0) {
        ElMessage.success(isAdd.value ? '新增成功' : '更新成功');
        emit('success');
        dialogVisible.value = false;
      } else {
        ElMessage.error(res.msg || '操作失败');
      }
    })
    .catch(() => {
      ElMessage.error('操作失败');
    })
    .finally(() => {
      confirmLoading.value = false;
    });
}

/** 关闭弹窗 */
function closeDialog(): void {
  resetForm();
  dataAuthTreeRef.value?.reset();
  dialogVisible.value = false;
}

/** 重置表单 */
function resetForm(): void {
  userForm.idCard = '';
  userForm.orgIds = [];
  userForm.orgList = [];
  userForm.dataAuthTreecheckedKeys = [];
  delete userForm.id;
  formRef.value?.resetFields();
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="900px"
    align-center
    :close-on-click-modal="false"
    append-to-body
    @close="closeDialog"
  >
    <el-form
      ref="formRef"
      v-loading="detailLoading"
      :model="userForm"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <el-form-item label="用户名称" prop="idCard">
        <el-input
          v-model="userForm.idCard"
          placeholder="请输入用户名称（不支持中文和空格）"
          maxlength="20"
          :disabled="!isAdd"
          @blur="handleIdCardBlur"
        />
      </el-form-item>

      <el-form-item label="数据权限" required>
        <div class="data-auth-section">
          <DataPermissionTree
            ref="dataAuthTreeRef"
            :check-strictly="true"
            :default-checked-keys="userForm.dataAuthTreecheckedKeys"
            left-title="部门列表"
            right-title="已选择"
            filter-placeholder="搜索部门"
            :height="400"
            @change="changeDataAuthCheckKeys"
            @load-state="handleDataTreeLoadState"
          />
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button
        type="primary"
        :disabled="detailLoading || !dataTreeReady"
        :loading="confirmLoading"
        @click="handleConfirm"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.data-auth-section {
  width: 100%;
  border: 1px solid @color-border-light;
  border-radius: 6px;
  padding: 12px;
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: transparent;
}
</style>
