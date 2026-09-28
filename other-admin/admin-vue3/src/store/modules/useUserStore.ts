import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import type { ApiResponse } from '#/axios';
import type { LicenseAuth } from '#/license';
import { DEFAULT_LICENSE_AUTH } from '#/license';
import type { GlobalItem, MenuItem, Permissions } from '#/menu';
import type { LoginResult, UserInputForm, UserInfo } from '#/user';
import { useKeepAliveStore } from './useKeepAliveStore';
import { getGlobalsList } from '@/api/dictionary/globals';
import { getLicenseInfo } from '@/api/license';
import { getMenuList } from '@/api/permission/menu';
import { login as loginApi, logout as logoutApi, getRolePermissions } from '@/api/user';
import { resetRouter } from '@/router';
import {
  clearAuthStorage,
  getIsAdmin,
  getLicenseAuth,
  getToken,
  setButtons,
  setIdCardNum,
  setIsAdmin,
  setLicenseAuth,
  setToken,
  setUserId,
  setUserName,
} from '@/utils/auth';

function getDefaultLicenseAuth(): LicenseAuth {
  return getLicenseAuth() ?? { ...DEFAULT_LICENSE_AUTH };
}

export const useUserStore = defineStore('user', () => {
  // 会话状态
  const token = ref<string>(getToken() ?? '');
  const name = ref<string>('');
  const avatar = ref<string>('');
  const buttons = ref<string[]>([]);
  const type = ref<unknown>(null);
  const hasChildOrgPriv = ref<unknown>(null);
  const menu = ref<MenuItem[]>([]);
  const menuLoaded = ref(false);
  const sessionEpoch = ref(0);
  const permissions = ref<Permissions>({ menus: [], actions: [] });
  const permissionsMenu = ref<RouteRecordRaw[]>([]);
  const globals = ref<GlobalItem[]>([]);
  const userInfo = ref<UserInfo | null>(null);
  const licenseAuth = ref<LicenseAuth>(getDefaultLicenseAuth());

  // 派生状态
  const isLoggedIn = computed(() => !!token.value);
  const isSuperAdmin = computed(() => getIsAdmin());

  // 会话操作
  function loginAction(userInput: UserInputForm): Promise<ApiResponse<LoginResult>> {
    const expectedEpoch = sessionEpoch.value;
    return loginApi(userInput).then((result) => {
      // 登录成功（code=0）或密码即将过期（code=121）均视为登录成功
      if (!result || (result.code !== 0 && result.code !== 121)) return result;
      if (expectedEpoch !== sessionEpoch.value) throw new Error('登录会话已变化');
      const data = result.data;
      if (!data?.accessToken) throw new Error('登录返回缺少令牌');
      return resetTokenAction().then(() => {
        token.value = data.accessToken;
        name.value = data.userName;
        setToken(data.accessToken);
        setUserName(data.userName);
        setUserId(data.userId);
        setIdCardNum(data.idCardNum);
        setIsAdmin(data.isAdmin);
        return result;
      });
    });
  }

  function logoutAction(): Promise<void> {
    sessionEpoch.value += 1;
    return logoutApi()
      .catch(() => {
        // 服务端登出失败时也必须立即清除本地会话。
      })
      .finally(() => clearLocalSession())
      .then(() => undefined);
  }

  async function resetTokenAction(): Promise<void> {
    await clearLocalSession();
  }

  async function clearLocalSession(): Promise<void> {
    const { stopSessionMonitoring } = await import('@/utils/session');
    stopSessionMonitoring();
    clearAuthStorage();
    resetRouter();
    useKeepAliveStore().clearCachedViews();
    resetState();
  }

  function resetState(): void {
    sessionEpoch.value += 1;
    token.value = '';
    name.value = '';
    avatar.value = '';
    buttons.value = [];
    type.value = null;
    hasChildOrgPriv.value = null;
    menu.value = [];
    menuLoaded.value = false;
    permissions.value = { menus: [], actions: [] };
    permissionsMenu.value = [];
    globals.value = [];
    userInfo.value = null;
    licenseAuth.value = { ...DEFAULT_LICENSE_AUTH };
  }

  function setUserInfoAction(info: UserInfo): void {
    userInfo.value = info;
  }

  function setTypeAction(value: unknown): void {
    type.value = value;
  }

  function setPrivAction(value: unknown): void {
    hasChildOrgPriv.value = value;
  }

  function getMenuAction(): Promise<boolean> {
    const expectedSessionEpoch = sessionEpoch.value;
    return getGlobalsAction(expectedSessionEpoch)
      .then(() => getPermissionsAction(expectedSessionEpoch))
      .then(() => getMenuList({ applicationId: '' }))
      .then((res) => {
        if (res.code !== 0 || expectedSessionEpoch !== sessionEpoch.value) return false;
        menu.value = res.data ?? [];
        menuLoaded.value = true;
        return true;
      })
      .catch(() => false);
  }

  function getPermissionsAction(expectedSessionEpoch = sessionEpoch.value): Promise<void> {
    return getRolePermissions().then((res) => {
      if (res.code !== 0 || expectedSessionEpoch !== sessionEpoch.value) throw new Error('获取权限失败');
      const data = res.data as unknown as Permissions;
      const buttonAuthList = data.actions ?? [];
      setButtons(buttonAuthList);
      buttons.value = buttonAuthList;
      permissions.value = data;
    });
  }

  function getGlobalsAction(expectedSessionEpoch = sessionEpoch.value): Promise<void> {
    return getGlobalsList().then((res) => {
      if (res.code !== 0 || expectedSessionEpoch !== sessionEpoch.value) throw new Error('获取全局参数失败');
      globals.value = res.data ?? [];
    });
  }

  function refreshLicenseAuthAction(): Promise<LicenseAuth> {
    const expectedEpoch = sessionEpoch.value;
    let refreshedAuth: LicenseAuth | null = null;

    return getLicenseInfo()
      .then((res) => {
        if (expectedEpoch !== sessionEpoch.value) return;
        if (!res || res.code !== 0) {
          console.error('LicenseInfo 获取失败');
          return;
        }

        const authData = res.data;
        const rawStatus: unknown = authData?.status;
        const licenseState =
          typeof rawStatus === 'number'
            ? rawStatus
            : typeof rawStatus === 'string' && rawStatus.trim()
              ? Number(rawStatus)
              : Number.NaN;
        if (
          !authData ||
          !Number.isFinite(licenseState) ||
          (authData.expireDate != null && typeof authData.expireDate !== 'string')
        ) {
          console.error('LicenseInfo 获取失败：响应数据无效');
          return;
        }

        const newAuth: LicenseAuth = {
          groupCollaborationAuth: false,
          taskCollaborationAuth: false,
          businessCollaborationAuth: false,
          AICollaborationAuth: false,
          northboundDataInterface: false,
          licenseState,
          expireDate: authData.expireDate ?? '',
        };
        if ([1, 2, 4].includes(licenseState)) {
          if (authData.LINKXBS === '1' && authData.LINKXGCF === '0') {
            newAuth.groupCollaborationAuth = true;
          }
          if (authData.LINKXBS === '1' && authData.LINKXTCF === '0') {
            newAuth.taskCollaborationAuth = true;
          }
          if (authData.LINKXBS === '1' && authData.LINKXBCF === '0') {
            newAuth.businessCollaborationAuth = true;
          }
          if (authData.LINKXBS === '1' && authData.LINKXACF === '0') {
            newAuth.AICollaborationAuth = true;
          }
          if (authData.LINKXBS === '1' && authData.LINKXNDI === '0') {
            newAuth.northboundDataInterface = true;
          }
        }

        setLicenseAuth(newAuth);
        licenseAuth.value = newAuth;
        refreshedAuth = newAuth;
      })
      .catch((error) => {
        console.error('LicenseInfo 获取失败', error);
      })
      .finally(() => {
        if (expectedEpoch !== sessionEpoch.value) refreshedAuth = null;
      })
      .then(() => {
        return refreshedAuth ?? licenseAuth.value;
      });
  }

  function setPermissionsMenu(routes: RouteRecordRaw[]): void {
    permissionsMenu.value = routes;
  }

  return {
    // 会话状态
    token,
    name,
    avatar,
    buttons,
    type,
    hasChildOrgPriv,
    menu,
    menuLoaded,
    sessionEpoch,
    permissions,
    permissionsMenu,
    globals,
    userInfo,
    licenseAuth,
    // 派生状态
    isLoggedIn,
    isSuperAdmin,
    // 会话操作
    loginAction,
    logoutAction,
    resetTokenAction,
    resetState,
    setUserInfoAction,
    setTypeAction,
    setPrivAction,
    getMenuAction,
    getPermissionsAction,
    getGlobalsAction,
    refreshLicenseAuthAction,
    setPermissionsMenu,
  };
});
