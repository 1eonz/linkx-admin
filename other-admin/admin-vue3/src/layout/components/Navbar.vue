<script setup lang="ts">
import { ElMessageBox } from 'element-plus';
import { LxIcon, LxNavbar } from 'lx-ui';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import type { BindUserInfo } from '@/api/authority/customDepartment';
import { getBindUser } from '@/api/authority/customDepartment';
import Breadcrumb from '@/components/Breadcrumb/index.vue';
import Hamburger from '@/components/Hamburger/index.vue';
import UserBindDialog from '@/components/UserBindDialog/index.vue';
import { useAppStore } from '@/store/modules/useAppStore';
import { useUserStore } from '@/store/modules/useUserStore';
import { getUserName } from '@/utils/auth';
import UserPassword from '@/views/permission/components/userPassword.vue';

defineOptions({ name: 'Navbar' });

const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();

const sidebar = computed(() => appStore.sidebar);
// 用户名：Navbar 展示 getUserName()，非 store.name
const role = ref<string>('');
// 头像首字（取用户名第一个字符）
const avatarText = computed(() => role.value.charAt(0) || '管');

// ===== 绑定警员弹窗 =====
const bindUserDialogVisible = ref(false);
const bindUserInfo = ref<BindUserInfo | null>(null);

// ===== 修改密码弹窗 =====
const passwordRef = ref<InstanceType<typeof UserPassword> | null>(null);

function toggleSidebar(): void {
  appStore.toggleSideBar();
}

function logout(): void {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => userStore.logoutAction())
    .then(() => router.push(`/login?redirect=${router.currentRoute.value.fullPath}`))
    .catch(() => {
      // 用户取消
    });
}

// 修改密码：调用 userPassword 组件的 setData，self=true 走 changePwd API
function handleChangePwd(): void {
  passwordRef.value?.setData({ username: role.value }, true);
}

// 查询当前管理员绑定的警员
function loadBindUser(): Promise<void> {
  return getBindUser()
    .then((res) => {
      bindUserInfo.value = res?.code === 0 && res.data ? res.data : null;
    })
    .catch(() => {
      bindUserInfo.value = null;
    });
}

// 绑定警员：打开弹窗前刷新绑定关系
function handleBindUser(): void {
  loadBindUser();
  bindUserDialogVisible.value = true;
}

// 绑定成功回调
function handleBindRefresh(): void {
  loadBindUser();
}

// 解绑成功回调
function handleUnbindSuccess(): void {
  bindUserInfo.value = null;
}

onMounted(() => {
  role.value = getUserName() ?? '';
  // 查询绑定关系
  loadBindUser();
});
</script>

<template>
  <LxNavbar class="navbar" :show-fullscreen="false" :search-placeholder="''">
    <template #leading>
      <Hamburger :is-active="sidebar.opened" class="hamburger-container" @toggle-click="toggleSidebar" />
    </template>
    <template #breadcrumb>
      <Breadcrumb class="breadcrumb-container" />
    </template>
    <template #trailing>
      <span class="right-tip">修改数据后，请重新登录客户端</span>
      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <span class="user-avatar">{{ avatarText }}</span>
          <span v-show="role" class="user-role">{{ role }}</span>
          <LxIcon class="arrow-icon" name="chevron-down" :size="12" />
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <router-link to="/">
              <el-dropdown-item>首页</el-dropdown-item>
            </router-link>
            <el-dropdown-item @click="handleChangePwd">修改密码</el-dropdown-item>
            <el-dropdown-item @click="handleBindUser">绑定警员</el-dropdown-item>
            <el-dropdown-item divided class="logout-item" @click="logout">
              <LxIcon name="logout" :size="16" /> 退出
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
  </LxNavbar>

  <!-- 弹窗必须位于 lx-navbar 外部：LxNavbar 只渲染具名插槽，默认插槽内容不会挂载。 -->
  <UserBindDialog
    v-model:visible="bindUserDialogVisible"
    :bind-user="bindUserInfo"
    @bind-refresh="handleBindRefresh"
    @unbind="handleUnbindSuccess"
  />
  <UserPassword ref="passwordRef" />
</template>

<style lang="less" scoped>
.navbar {
  height: @navbar-height;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  // 对齐原型 sider-nav-bar.html：深色顶栏
  background: @navbar-bg;
  border-bottom: 1px solid @navbar-border-color;
  padding: 0 @spacing-md-plus 0 0;

  .navbar-left {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .navbar-right {
    display: flex;
    align-items: center;
    gap: @spacing-md;
    height: 100%;
  }

  .hamburger-container {
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0 10px;
    color: @navbar-text;
    transition: all @transition-duration @transition-timing;
    -webkit-tap-highlight-color: transparent;
    border-right: 1px solid transparent;

    &:hover {
      background: @navbar-hover-bg;
      color: @navbar-text-active;
    }
  }

  .breadcrumb-container {
    display: flex;
    align-items: center;
    padding-left: @spacing-sm;
  }

  .right-tip {
    font-size: @font-size-xs;
    color: @navbar-text;
    line-height: 1;
    white-space: nowrap;
    padding-right: @spacing-sm;
    border-right: 1px solid fade(@navbar-text, 20%);
    margin-right: @spacing-sm;
  }

  .avatar-container {
    cursor: pointer;
    display: flex;
    align-items: center;
    height: 100%;

    .avatar-wrapper {
      display: flex;
      align-items: center;
      gap: @spacing-sm;
      padding: @spacing-xs @spacing-sm;
      border-radius: @radius-2xl;
      transition: all @transition-duration @transition-timing;

      &:hover {
        background: @navbar-hover-bg;
      }

      .user-role {
        font-size: @font-size-md;
        color: @navbar-text-active;
        font-weight: @font-weight-medium;
      }

      // 对齐原型：半透明主色背景 + 蓝色文字
      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        color: @color-primary-light-5;
        background: fade(@color-primary, 30%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: @font-size-sm;
        font-weight: @font-weight-semibold;
        transition: all @transition-duration @transition-timing;
      }

      .arrow-icon {
        color: @navbar-text;
        font-size: 12px;
        transition: color @transition-duration @transition-timing;
      }

      &:hover .user-avatar {
        background: fade(@color-primary, 45%);
      }

      &:hover .arrow-icon {
        color: @navbar-text-active;
      }
    }
  }
}

@media (max-width: 640px) {
  .navbar {
    padding-inline-end: @spacing-xs;

    :deep(.lx-navbar__left) {
      flex: 1;
      overflow: hidden;
    }

    :deep(.lx-navbar__right) {
      flex: 0 0 auto;
    }
  }

  .right-tip,
  .user-role {
    display: none;
  }

  .breadcrumb-container {
    min-width: 0;
    overflow: hidden;
  }

  .avatar-container {
    flex-shrink: 0;

    .avatar-wrapper {
      gap: @spacing-xs;
      padding-inline: @spacing-xs;
      white-space: nowrap;
    }
  }
}
</style>
