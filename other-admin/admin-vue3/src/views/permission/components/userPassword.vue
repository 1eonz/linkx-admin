<script setup lang="ts">
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { queryGlobalsList } from '@/api/dictionary/globals';
import { updatePersonPwd } from '@/api/permission/user';
import { changePwd } from '@/api/user';
import PasswordInput from '@/components/PasswordInput/index.vue';
import { validateSimpleMode, validateComplexMode, validateRepeatPassword } from '@/utils/passwordValidator';

defineOptions({ name: 'UserPassword' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { t } = useI18n({ useScope: 'global' });

const visible = ref(false);
const formRef = ref<FormInstance>();
const isSelf = ref(false);
const simplePassWord = ref<boolean | string>(localStorage.getItem('simplePassWord') === 'true');

const form = reactive({
  id: '',
  username: '',
  oldPwd: '',
  newPwd: '',
  repeatNewPwd: '',
});

const rules = computed<FormRules>(() => ({
  oldPwd: [
    {
      required: true,
      message: t('index.pass.enterOldPassTip'),
      trigger: ['change', 'blur'],
    },
  ],
  newPwd: [
    {
      required: true,
      message: simplePassWord.value ? t('index.pass.passRuleTipSimple') : t('index.pass.passRuleTip'),
      trigger: 'blur',
    },
    {
      validator: (_rule, value, callback) => {
        const i18n = (key: string) => t(key);
        const error = simplePassWord.value
          ? validateSimpleMode(value as string, i18n)
          : validateComplexMode(value as string, form.username, i18n);
        if (error) {
          callback(new Error(error));
        } else {
          callback();
        }
        // 触发确认密码验证
        if (form.repeatNewPwd !== '') {
          formRef.value?.validateField('repeatNewPwd');
        }
      },
      trigger: ['change', 'blur'],
    },
  ],
  repeatNewPwd: [
    {
      required: true,
      message: t('index.pass.enterNewPassAgainTip'),
      trigger: ['change', 'blur'],
    },
    {
      validator: (_rule, value, callback) => {
        const i18n = (key: string) => t(key);
        const error = validateRepeatPassword(value as string, form.newPwd, i18n);
        if (error) {
          callback(new Error(error));
        } else {
          callback();
        }
      },
      trigger: ['change', 'blur'],
    },
  ],
}));

async function getGlobal(): Promise<void> {
  try {
    const res = await queryGlobalsList();
    if (res?.data) {
      if (res.data.ALLOW_SIMPLE_PASSWORD === '1') {
        localStorage.setItem('simplePassWord', 'true');
        simplePassWord.value = true;
      } else {
        localStorage.removeItem('simplePassWord');
        simplePassWord.value = false;
      }
    }
  } catch (error) {
    console.error('[UserPassword] 获取全局参数失败:', error);
  }
}

/** 设置弹窗数据并打开 */
async function setData(row: { id?: string; username?: string; name?: string }, self: boolean): Promise<void> {
  await getGlobal();
  form.id = row.id || '';
  form.username = row.username || row.name || '';
  form.oldPwd = '';
  form.newPwd = '';
  form.repeatNewPwd = '';
  isSelf.value = self;
  visible.value = true;
}

function closePwdDialog(): void {
  visible.value = false;
  formRef.value?.resetFields();
}

function changePwdSubmit(): void {
  formRef.value?.validate((valid) => {
    if (!valid) return;
    const { id, username, oldPwd, newPwd, repeatNewPwd } = form;
    let param: Record<string, unknown>;
    let api: (data: any) => Promise<{ code: number; msg?: string }>;
    if (isSelf.value) {
      param = { username, oldPassword: oldPwd, newPassword: newPwd, repeatNewPassword: repeatNewPwd };
      api = changePwd;
    } else {
      param = { id, password: newPwd, repeatNewPwd };
      api = updatePersonPwd;
    }
    api(param)
      .then((result) => {
        if (result.code === 0) {
          closePwdDialog();
          ElMessage.success(t('index.operations.change') + t('succeed'));
          emit('success');
        } else {
          ElMessage.error(result.msg || '');
        }
      })
      .catch(() => {
        ElMessage.error(t('index.operations.change') + t('fail'));
      });
  });
}

defineExpose({ setData });
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('index.pass.passModify')"
    :close-on-click-modal="false"
    width="800px"
    align-center
    @close="closePwdDialog"
  >
    <el-form ref="formRef" :rules="rules" :model="form" label-position="left" label-width="160px" style="width: 700px">
      <el-form-item v-if="isSelf" :label="t('index.pass.oldPass')" prop="oldPwd">
        <PasswordInput v-model="form.oldPwd" input-class="edit-input" />
      </el-form-item>
      <el-form-item :label="t('index.pass.newPass')" prop="newPwd">
        <PasswordInput v-model="form.newPwd" input-class="edit-input" />
      </el-form-item>
      <el-form-item :label="t('index.pass.confirmNewPass')" prop="repeatNewPwd">
        <PasswordInput v-model="form.repeatNewPwd" input-class="edit-input" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closePwdDialog">{{ t('cancel') }}</el-button>
      <el-button type="primary" @click="changePwdSubmit">{{ t('index.operations.change') }}</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
:deep(.edit-input) {
  width: 500px;
}

:deep(.el-form-item) {
  margin-bottom: 30px;
}
</style>
