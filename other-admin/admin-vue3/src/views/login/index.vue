<script setup lang="ts">
import { ArrowRight, ArrowDown, Key, Loading, Lock, User, WarnTriangleFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { ref, computed, markRaw, onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import type { PasswordChangeRequiredResult, UserInputForm } from '#/user';
import { getGlobalsList, queryGlobalsList } from '@/api/dictionary/globals';
import { changePwd, getVersion } from '@/api/user';
import { getLicenseInfoUtil } from '@/composables/useLicense';
import { useSystemTitle } from '@/composables/useSystemTitle';
import { setLanguage } from '@/locales';
import { useSettingsStore } from '@/store/modules/useSettingsStore';
import { useUserStore } from '@/store/modules/useUserStore';
import { setPasswordChangeToken } from '@/utils/auth';
import { validateComplexMode, validateRepeatPassword, validateSimpleMode } from '@/utils/passwordValidator';
import { startSessionMonitoring } from '@/utils/session';

defineOptions({ name: 'Login' });

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const { systemName: systemTitle } = useSystemTitle();

const rememberedUsernameKey = 'linkx_admin_remembered_username';
const rememberedUsername = localStorage.getItem(rememberedUsernameKey);
const loginForm = ref<UserInputForm>({ username: rememberedUsername ?? '', password: '' });
const loading = ref(false);
const rememberMe = ref(rememberedUsername !== null);
const language = ref(localStorage.getItem('localLanguage') || 'cn');

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const formRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();
const passwordChangeVisible = ref(false);
const passwordChangeLoading = ref(false);
const passwordChangeTitle = ref('请修改密码');
const passwordChangeForm = reactive({ username: '', oldPassword: '', newPassword: '', repeatNewPassword: '' });
const passwordChangeRules = computed<FormRules>(() => ({
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        const simple = localStorage.getItem('simplePassWord') === 'true';
        const error = simple
          ? validateSimpleMode(value as string)
          : validateComplexMode(value as string, passwordChangeForm.username);
        callback(error ? new Error(error) : undefined);
        if (passwordChangeForm.repeatNewPassword) passwordFormRef.value?.validateField('repeatNewPassword');
      },
      trigger: ['blur', 'change'],
    },
  ],
  repeatNewPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        const error = validateRepeatPassword(value as string, passwordChangeForm.newPassword);
        callback(error ? new Error(error) : undefined);
      },
      trigger: ['blur', 'change'],
    },
  ],
}));

// 输入框前缀图标（用 markRaw 避免响应式开销）
const userIcon = markRaw(User);
const lockIcon = markRaw(Lock);

// 当前年份（左侧版权用）
const currentYear = computed(() => new Date().getFullYear());

// 版本号（左侧底部展示）
const version = ref('');
getVersion()
  .then((res) => {
    const data = res?.data as { linkx?: { serviceVersion?: string } } | undefined;
    version.value = data?.linkx?.serviceVersion ?? '';
  })
  .catch(() => {
    // 静默失败
  });

// 获取全局参数中的 SYSTEM_NAME
onMounted(() => {
  queryGlobalsList()
    .then((res) => {
      const data = res?.data as Record<string, string> | undefined;
      if (data) {
        // 系统名称
        if (data.SYSTEM_NAME) {
          settingsStore.setSystemName(data.SYSTEM_NAME);
        }
        // 简单密码标识
        if (data.ALLOW_SIMPLE_PASSWORD === '1') {
          localStorage.setItem('simplePassWord', 'true');
        } else {
          localStorage.removeItem('simplePassWord');
        }
        localStorage.setItem('globalConfig', JSON.stringify(data));
      }
    })
    .catch(() => {
      // 静默失败
    });
});

function showLicenseStateWarning(): Promise<void> {
  return getLicenseInfoUtil().then((license) => {
    let message = '';
    if (license.licenseState === 0) message = 'license未激活';
    if (license.licenseState === 3 || license.licenseState === 5) message = 'license已过期，请重新导入';
    const showMessage = (): Promise<void> => {
      if (!message) return Promise.resolve();
      return ElMessageBox.alert(message, 'License 提示').then(
        () => undefined,
        () => undefined,
      );
    };
    if (license.licenseState !== 2 || !license.expireDate) return showMessage();

    const remainingDays = Math.ceil(
      (new Date(license.expireDate.replace(/-/g, '/')).getTime() - Date.now()) / 86400000,
    );
    return getGlobalsList()
      .then((globals) => {
        const threshold = Number(globals.data?.find((item) => item.name === 'MSIP_LICENSE_EXPIRED_TIME')?.value);
        if (Number.isFinite(remainingDays) && Number.isFinite(threshold) && remainingDays < threshold) {
          message = `您的账户还有${remainingDays}天到期，请及时联系相关人员进行续费，以免影响您的业务`;
        }
      })
      .catch(() => {
        // 提示信息查询失败不阻断已成功的登录。
      })
      .then(showMessage);
  });
}

function handleLogin(): void {
  formRef.value
    ?.validate()
    .then(() => {
      loading.value = true;
      userStore
        .loginAction(loginForm.value)
        .then((result) => {
          if (result && (result.code === 0 || result.code === 121)) {
            if (rememberMe.value && loginForm.value.username) {
              localStorage.setItem(rememberedUsernameKey, loginForm.value.username);
            } else {
              localStorage.removeItem(rememberedUsernameKey);
            }
            const loginToken = userStore.token;
            const warningPromise = result.licenseWarning
              ? ElMessageBox.alert(result.licenseWarning, 'License 提示').then(
                  () => undefined,
                  () => undefined,
                )
              : Promise.resolve();
            const expiryPromise =
              result.code === 121
                ? ElMessageBox.alert(`您的密码将在 ${result.msg || ''} 后过期，请及时修改。`, '密码即将过期').then(
                    () => undefined,
                    () => undefined,
                  )
                : Promise.resolve();
            return warningPromise
              .then(() => expiryPromise)
              .then(() => showLicenseStateWarning())
              .then(() => {
                if (userStore.token !== loginToken) return;
                ElMessage.success('登录成功');
                startSessionMonitoring();
                const redirect = (route.query.redirect as string) || '/';
                return router.push(redirect);
              });
          } else {
            const required = result?.data as PasswordChangeRequiredResult | undefined;
            if ([114, 115, 137].includes(result?.code ?? -1) && required?.accessToken) {
              setPasswordChangeToken(required.accessToken);
              passwordChangeTitle.value = result?.msg || '密码已过期，请修改密码';
              passwordChangeForm.username = required.userName || loginForm.value.username;
              passwordChangeForm.oldPassword = loginForm.value.password;
              passwordChangeForm.newPassword = '';
              passwordChangeForm.repeatNewPassword = '';
              passwordChangeVisible.value = true;
            } else {
              ElMessage.error(result?.msg || '登录失败');
            }
          }
        })
        .catch((error) => {
          ElMessage.error(error?.response?.data?.msg || '登录失败，请稍后重试');
        })
        .finally(() => {
          loading.value = false;
        });
    })
    .catch(() => {
      // 表单校验失败，不提交
    });
}

function submitPasswordChange(): void {
  if (passwordChangeLoading.value) return;
  passwordFormRef.value?.validate((valid) => {
    if (!valid || passwordChangeLoading.value) return;
    passwordChangeLoading.value = true;
    changePwd({ ...passwordChangeForm })
      .then((result) => {
        if (result.code === 0) {
          passwordChangeVisible.value = false;
          ElMessage.success('密码修改成功，请重新登录');
          return userStore.resetTokenAction();
        }
        ElMessage.error(result.msg || '密码修改失败');
      })
      .catch((error) => {
        ElMessage.error((error as { response?: { data?: { msg?: string } } })?.response?.data?.msg || '密码修改失败');
      })
      .finally(() => {
        passwordChangeLoading.value = false;
      });
  });
}

function handleCommand(command: string): void {
  language.value = command;
  setLanguage(command as 'cn' | 'en');
}

function handleRememberMeChange(checked: string | number | boolean): void {
  if (!checked) localStorage.removeItem(rememberedUsernameKey);
}
</script>

<template>
  <div class="login-page">
    <div class="login-grid" aria-hidden="true"></div>

    <header class="login-header">
      <div class="network-id">
        <span class="network-id__indicator" aria-hidden="true"></span>
        <span>公安移动专网安全接入</span>
      </div>

      <div class="lang-switch">
        <el-dropdown trigger="click" @command="handleCommand">
          <button class="lang-trigger" type="button" aria-label="切换系统语言">
            <span>{{ language === 'cn' ? '简体中文' : 'English' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="cn">简体中文</el-dropdown-item>
              <el-dropdown-item command="en">English</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="login-main">
      <section class="login-container" aria-labelledby="login-system-title">
        <div class="login-brand">
          <div class="police-logo" aria-hidden="true">
            <el-icon><Key /></el-icon>
          </div>

          <h1 id="login-system-title" class="brand-title">
            {{ systemTitle || '警务协同移动指挥后台管理系统' }}
          </h1>
          <p class="brand-subtitle">LinkX Mobile Command &amp; Operations Management System</p>
        </div>

        <div class="login-form-wrapper">
          <div class="login-section-title">
            <h2>身份认证</h2>
            <span class="required-note">带 * 的项目为必填</span>
          </div>

          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="username" label="用户 / 账号" required>
              <el-input
                v-model="loginForm.username"
                placeholder="请输入警号或账号"
                size="large"
                :prefix-icon="userIcon"
                autocomplete="username"
              />
            </el-form-item>

            <el-form-item prop="password" label="密码" required>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="lockIcon"
                show-password
                autocomplete="current-password"
                @copy.prevent
                @paste.prevent
                @cut.prevent
              />
            </el-form-item>

            <div class="form-options">
              <el-checkbox v-model="rememberMe" @change="handleRememberMeChange">记住账号</el-checkbox>
              <span class="account-assistance">忘记密码请联系系统管理员</span>
            </div>

            <button
              type="submit"
              class="btn-submit"
              :class="{ 'is-loading': loading }"
              :disabled="loading"
              :aria-busy="loading"
            >
              <el-icon v-if="loading" class="is-loading"><Loading /></el-icon>
              <span>{{ loading ? '正在验证身份…' : '安全登录' }}</span>
              <el-icon v-if="!loading"><ArrowRight /></el-icon>
            </button>
          </el-form>

          <div class="form-footer">
            <el-icon aria-hidden="true"><WarnTriangleFilled /></el-icon>
            <span>未经授权禁止登录，系统全程安全审计</span>
          </div>
        </div>

        <span class="visually-hidden" role="status" aria-live="polite">{{ loading ? '正在验证身份' : '' }}</span>
      </section>
    </main>

    <footer class="login-footer">
      <span>版本 {{ version || '—' }}</span>
      <span>Copyright © {{ currentYear }} LinkX Platform</span>
    </footer>

    <el-dialog
      v-model="passwordChangeVisible"
      :title="passwordChangeTitle"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      width="min(560px, calc(100vw - 32px))"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordChangeForm"
        :rules="passwordChangeRules"
        label-position="top"
        @submit.prevent="submitPasswordChange"
      >
        <el-form-item label="原密码" prop="oldPassword"
          ><el-input
            v-model="passwordChangeForm.oldPassword"
            type="password"
            show-password
            autocomplete="current-password"
        /></el-form-item>
        <el-form-item label="新密码" prop="newPassword"
          ><el-input v-model="passwordChangeForm.newPassword" type="password" show-password autocomplete="new-password"
        /></el-form-item>
        <el-form-item label="确认新密码" prop="repeatNewPassword"
          ><el-input
            v-model="passwordChangeForm.repeatNewPassword"
            type="password"
            show-password
            autocomplete="new-password"
        /></el-form-item>
      </el-form>
      <template #footer>
        <el-button
          type="primary"
          :loading="passwordChangeLoading"
          :disabled="passwordChangeLoading"
          @click="submitPasswordChange"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
