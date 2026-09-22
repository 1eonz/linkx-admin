<script setup lang="ts">
import {
  ArrowRight,
  ArrowDown,
  Key,
  Loading,
  Lock,
  User,
  UserFilled,
  WarnTriangleFilled,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { ref, computed, markRaw, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import type { UserInputForm } from '#/user';
import { queryGlobalsList } from '@/api/dictionary/globals';
import { getVersion } from '@/api/user';
import { useSystemTitle } from '@/composables/useSystemTitle';
import { setLanguage } from '@/locales';
import { useSettingsStore } from '@/store/modules/useSettingsStore';
import { useUserStore } from '@/store/modules/useUserStore';

defineOptions({ name: 'Login' });

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const { systemName: systemTitle, loginTitle } = useSystemTitle();

const loginForm = ref<UserInputForm>({ username: '', password: '' });
const loading = ref(false);
const language = ref(localStorage.getItem('localLanguage') || 'cn');

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const formRef = ref();

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
  })
  .finally(() => {
    // 无清理逻辑
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

function handleLogin(): void {
  formRef.value
    ?.validate()
    .then(() => {
      loading.value = true;
      userStore
        .loginAction(loginForm.value)
        .then((result) => {
          if (result && (result.code === 0 || result.code === 121)) {
            ElMessage.success('登录成功');
            const redirect = (route.query.redirect as string) || '/';
            router.push(redirect);
          } else {
            const errorMsg = (result && result.msg) || '登录失败';
            ElMessage.error(errorMsg);
          }
        })
        .catch(() => {
          ElMessage.error('登录失败，请稍后重试');
        })
        .finally(() => {
          loading.value = false;
        });
    })
    .catch(() => {
      // 表单校验失败，不提交
    });
}

function handleCommand(command: string): void {
  language.value = command;
  setLanguage(command as 'cn' | 'en');
}

// 仅 UI 占位状态（非业务逻辑）：记住警号 checkbox + 警号 tag 展示
const rememberMe = ref(false);
</script>

<template>
  <div class="login-page">
    <!-- 4 层呼吸背景（对齐原型 docs/login-demo.html） -->
    <div class="bg-base"></div>
    <div class="bg-grid"></div>
    <div class="glow-sphere-primary"></div>
    <div class="glow-sphere-secondary"></div>

    <!-- 语言切换（右上角浮层） -->
    <div class="lang-switch">
      <el-dropdown trigger="click" @command="handleCommand">
        <button class="lang-trigger" type="button">
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

    <!-- 居中登录卡片 -->
    <div class="login-container">
      <!-- 左侧品牌区 -->
      <div class="login-brand">
        <!-- 警务 Logo 方块（蓝色渐变 + 主色光晕） -->
        <div class="police-logo">
          <el-icon><Key /></el-icon>
        </div>

        <!-- 品牌长标题（自适应折行） -->
        <h1 class="brand-title">{{ systemTitle }}</h1>

        <!-- 状态徽章（胶囊形 + 绿色 pulse dot + "系统就绪"） -->
        <div class="status-badge">
          <span class="status-dot online"></span>
          <span>系统就绪</span>
        </div>

        <!-- 版本与版权（底部） -->
        <div class="brand-footer-info">
          <span class="version-label">版本 {{ version || '—' }} · © {{ currentYear }} Linkx Platform</span>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="login-form-wrapper">
        <div>
          <!-- 表单区块标题（图标 + 虚线分隔） -->
          <div class="login-section-title">
            <el-icon><UserFilled /></el-icon>
            <span>{{ loginTitle || '身份认证' }}</span>
          </div>

          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="username" label="警号 / 账号">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入警号"
                size="large"
                :prefix-icon="userIcon"
                tabindex="1"
                autocomplete="username"
              >
                <template #append>
                  <span class="police-id-tag">POLICE</span>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password" label="安全密码">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="lockIcon"
                tabindex="2"
                show-password
                autocomplete="current-password"
                @copy.prevent
                @paste.prevent
                @cut.prevent
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <!-- 记住警号 + 忘记密码（UI 占位） -->
            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住警号</el-checkbox>
              <a href="javascript:void(0);">忘记密码?</a>
            </div>

            <button type="submit" class="btn-submit" :class="{ 'is-loading': loading }" :disabled="loading">
              <el-icon v-if="loading" class="is-loading"><Loading /></el-icon>
              <span>{{ loading ? '验证中...' : '进入系统' }}</span>
              <el-icon v-if="!loading"><ArrowRight /></el-icon>
            </button>
          </el-form>
        </div>

        <!-- 底部安全提示 -->
        <div class="form-footer">
          <el-icon><WarnTriangleFilled /></el-icon>
          <span>未经授权禁止登录，系统全程安全审计</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
// 登录页主体样式已迁移至 src/styles/login.less（全局通用）
// 此处仅补充 scoped 级别的细节调整

// 语言切换按钮（深色背景上的浅色按钮）
.lang-switch {
  position: absolute;
  top: @spacing-lg;
  right: @spacing-xl;
  z-index: 20;

  .lang-trigger {
    display: inline-flex;
    align-items: center;
    gap: @spacing-xs;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: @radius-md;
    color: @navbar-text;
    font-size: @font-size-sm;
    cursor: pointer;
    transition: all @transition-duration @transition-timing;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      color: @navbar-text-active;
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
}

// 品牌区底部版本信息
.brand-footer-info {
  position: absolute;
  bottom: 24px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: @font-size-2xs;
  color: fade(@navbar-text, 50%);
  letter-spacing: 0.5px;
}

// el-form 局部样式覆盖
.login-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    font-size: @font-size-sm;
    font-weight: @font-weight-semibold;
    color: @color-text-regular;
    padding-bottom: 6px;
  }

  // 输入框 append 区域（POLICE tag）
  :deep(.el-input-group__append) {
    background: @color-primary-light-9;
    border: 1px solid @color-primary-light-7;
    border-left: none;
    padding: 0 12px;
  }

  // checkbox 样式
  :deep(.el-checkbox) {
    color: @color-text-secondary;

    .el-checkbox__label {
      font-size: @font-size-sm;
    }
  }
}

// 提交按钮 loading 状态
.btn-submit.is-loading {
  opacity: 0.85;
  cursor: not-allowed;

  .el-icon.is-loading {
    animation: btn-loading-spin 0.8s linear infinite;
  }
}

@keyframes btn-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
