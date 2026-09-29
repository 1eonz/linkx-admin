<script setup lang="ts">
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';

import type { RoleItem } from '@/api/permission/role';
import { setBatchRole } from '@/api/resource/person';
import { getRoleList } from '@/api/resource/role';

defineOptions({ name: 'SetBatchRole' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t } = useI18n({ useScope: 'global' });

const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const roleList = ref<RoleItem[]>([]);

const form = reactive({
  relatedUserNames: '',
  relatedUserIds: [] as string[],
  roleIds: '' as string | string[],
});

const rules: FormRules = {
  roleIds: [{ required: true, message: t('index.messageText.roleCannotBeEmpty'), trigger: 'change' }],
  relatedUserNames: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
};

// init 入口：rowArr 为选中人员数组
function init(rowArr: Array<{ id: string; name: string }>): Promise<void> {
  if (rowArr) {
    form.relatedUserNames = rowArr.map((item) => item.name).join(',');
    form.relatedUserIds = rowArr.map((item) => item.id);
  }
  return getList().then((loaded) => {
    if (loaded) dialogVisible.value = true;
  });
}

// 获取角色列表：status === 0 的角色
function getList(): Promise<boolean> {
  const params = { name: '', pageSize: 100, pageNum: 1 };
  return getRoleList(params)
    .then((roleListRes) => {
      roleList.value = (roleListRes.data?.records as RoleItem[])?.filter((item) => item.status === 0) ?? [];
      return true;
    })
    .catch(() => {
      ElMessage.error('获取角色列表失败');
      return false;
    });
}

function handleConfirm(): void {
  if (submitting.value) return;
  submitting.value = true;
  formRef.value?.validate((valid) => {
    if (!valid) {
      submitting.value = false;
      return;
    }
    const params = {
      userIds: form.relatedUserIds,
      roleId: form.roleIds as string,
    };
    setBatchRole(params)
      .then((result) => {
        if (result.code === 0) {
          ElMessage.success(result.msg || '');
          emit('success');
          closeDialog(true);
        } else {
          ElMessage.error(result.msg || '');
        }
      })
      .catch(() => {})
      .finally(() => {
        submitting.value = false;
      });
  });
}

function closeDialog(force = false): void {
  if (submitting.value && !force) return;
  form.relatedUserNames = '';
  form.relatedUserIds = [];
  form.roleIds = '';
  formRef.value?.resetFields();
  dialogVisible.value = false;
}

defineExpose({ init });
</script>

<template>
  <el-dialog
    v-if="dialogVisible"
    v-model="dialogVisible"
    :close-on-click-modal="false"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    :title="t('index.operations.setRole')"
    align-center
    @close="closeDialog"
  >
    <el-form ref="formRef" :model="form" label-position="left" :rules="rules" label-width="80px">
      <el-form-item :label="t('index.list.compellation')" prop="relatedUserNames">
        <el-select
          v-if="dialogVisible"
          v-model="form.relatedUserNames"
          :disabled="true"
          filterable
          remote
          style="width: 100%"
          reserve-keyword
          :placeholder="t('selects')"
        >
          <el-option
            v-for="(name, index) in form.relatedUserNames.split(',')"
            :key="index"
            :label="name"
            :value="name"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('index.list.role')" prop="roleIds">
        <el-select v-model="form.roleIds" collapse-tags value-key="key" :placeholder="t('selects')" style="width: 100%">
          <el-option v-for="item in roleList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="() => closeDialog()">{{ t('cancel') }}</el-button>
      <el-button
        type="primary"
        :disabled="submitting"
        :loading="submitting"
        :aria-busy="submitting ? 'true' : undefined"
        @click="handleConfirm"
      >
        {{ t('index.operations.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>
