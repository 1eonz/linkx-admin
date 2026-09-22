import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import type { ApiResponse } from '#/axios';
import type { LicenseAuth } from '#/license';
import { DEFAULT_LICENSE_AUTH } from '#/license';
import type { GlobalItem, MenuItem, OAuthMenuItem, Permissions } from '#/menu';
import type { LoginResult, UserInputForm, UserInfo } from '#/user';
import { getGlobalsList } from '@/api/dictionary/globals';
import { getLicenseInfo } from '@/api/license';
import { getOauthMenuList } from '@/api/oauth/menu';
import { getMenuList } from '@/api/permission/menu';
import { login as loginApi, logout as logoutApi, getRolePermissions } from '@/api/user';
import {
  getIsAdmin,
  getLicenseAuth,
  getToken,
  removeButtons,
  removeIdCardNum,
  removeIsAdmin,
  removeLicenseAuth,
  removeToken,
  setButtons,
  setIdCardNum,
  setIsAdmin,
  setToken,
  setUserId,
  setUserName,
} from '@/utils/auth';

function getDefaultLicenseAuth(): LicenseAuth {
  return getLicenseAuth() ?? { ...DEFAULT_LICENSE_AUTH };
}

export const useUserStore = defineStore('user', () => {
  // ===== state =====
  const token = ref<string>(getToken() ?? '');
  const name = ref<string>('');
  const avatar = ref<string>('');
  const buttons = ref<string[]>([]);
  const type = ref<unknown>(null);
  const hasChildOrgPriv = ref<unknown>(null);
  const menu = ref<MenuItem[]>([]);
  const permissions = ref<Permissions>({ menus: [], actions: [] });
  const permissionsMenu = ref<RouteRecordRaw[]>([]);
  const oauthMenu = ref<OAuthMenuItem[]>([]);
  const oauthMenuLoaded = ref(false);
  const globals = ref<GlobalItem[]>([]);
  const userInfo = ref<UserInfo | null>(null);
  const licenseAuth = ref<LicenseAuth>(getDefaultLicenseAuth());

  // ===== getters =====
  const isLoggedIn = computed(() => !!token.value);
  const isSuperAdmin = computed(() => getIsAdmin());

  // ===== actions =====
  async function loginAction(userInput: UserInputForm): Promise<ApiResponse<LoginResult>> {
    const result = await loginApi(userInput);
    console.log('[UserStore] loginAction result:', { code: result?.code, msg: result?.msg, hasData: !!result?.data });

    // 登录成功（code=0）或密码即将过期（code=121）均视为登录成功
    if (result && (result.code === 0 || result.code === 121)) {
      const data = result.data;
      if (!data) {
        console.error('[UserStore] 登录返回 code 成功但 data 为空');
        return result;
      }
      token.value = data.accessToken;
      name.value = data.userName;
      setToken(data.accessToken);
      setUserName(data.userName);
      setUserId(data.userId);
      setIdCardNum(data.idCardNum);
      setIsAdmin(data.isAdmin);
    }
    return result;
  }

  async function logoutAction(): Promise<void> {
    try {
      await logoutApi();
    } finally {
      removeToken();
      removeButtons();
      removeIsAdmin();
      removeIdCardNum();
      removeLicenseAuth();
      resetState();
    }
  }

  async function resetTokenAction(): Promise<void> {
    removeToken();
    removeButtons();
    resetState();
  }

  function resetState(): void {
    token.value = '';
    name.value = '';
    avatar.value = '';
    buttons.value = [];
    type.value = null;
    hasChildOrgPriv.value = null;
    menu.value = [];
    permissions.value = { menus: [], actions: [] };
    permissionsMenu.value = [];
    oauthMenu.value = [];
    oauthMenuLoaded.value = false;
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

  async function getMenuAction(): Promise<boolean> {
    try {
      await getGlobalsAction();
      await getPermissionsAction();

      const res = await getMenuList({ applicationId: '' });
      if (res.code === 0) {
        menu.value = res.data ?? [];
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function getOauthMenuAction(): Promise<OAuthMenuItem[]> {
    try {
      const res = await getOauthMenuList();
      if (res.code === 0) {
        oauthMenu.value = res.data ?? [];
        return oauthMenu.value;
      }
      console.warn('[OAuth菜单] 接口返回 code 不为 0:', res.code);
      return [];
    } catch (err) {
      console.error('[OAuth菜单] 请求失败:', err);
      return [];
    }
  }

  async function getPermissionsAction(): Promise<void> {
    const res = await getRolePermissions();
    if (res.code === 0) {
      const data = res.data as unknown as Permissions;
      const buttonAuthList = data.actions ?? [];
      setButtons(buttonAuthList);
      buttons.value = buttonAuthList;
      permissions.value = data;
    } else {
      throw new Error('获取权限失败');
    }
  }

  async function getGlobalsAction(): Promise<void> {
    const res = await getGlobalsList();
    if (res.code === 0) {
      globals.value = res.data ?? [];
    } else {
      throw new Error('获取全局参数失败');
    }
  }

  async function refreshLicenseAuthAction(): Promise<LicenseAuth> {
    const newAuth: LicenseAuth = {
      groupCollaborationAuth: false,
      taskCollaborationAuth: false,
      businessCollaborationAuth: false,
      AICollaborationAuth: false,
      northboundDataInterface: false,
      licenseState: 999,
      expireDate: '',
    };

    try {
      const res = await getLicenseInfo();
      if (res.code === 0) {
        const authData = res.data;
        if ([1, 2, 4].includes(Number(authData.status))) {
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
        newAuth.licenseState = Number(authData.status);
        newAuth.expireDate = authData.expireDate ?? '';
      } else {
        console.error('LicenseInfo 获取失败');
      }
    } catch (error) {
      console.error('LicenseInfo 获取失败', error);
    }

    // 写入 localStorage 缓存
    const { setLicenseAuth } = await import('@/utils/auth');
    setLicenseAuth(newAuth);
    licenseAuth.value = newAuth;
    return newAuth;
  }

  function setPermissionsMenu(routes: RouteRecordRaw[]): void {
    permissionsMenu.value = routes;
  }

  function setOauthMenuLoaded(loaded: boolean): void {
    oauthMenuLoaded.value = loaded;
  }

  return {
    // state
    token,
    name,
    avatar,
    buttons,
    type,
    hasChildOrgPriv,
    menu,
    permissions,
    permissionsMenu,
    oauthMenu,
    oauthMenuLoaded,
    globals,
    userInfo,
    licenseAuth,
    // getters
    isLoggedIn,
    isSuperAdmin,
    // actions
    loginAction,
    logoutAction,
    resetTokenAction,
    resetState,
    setUserInfoAction,
    setTypeAction,
    setPrivAction,
    getMenuAction,
    getOauthMenuAction,
    getPermissionsAction,
    getGlobalsAction,
    refreshLicenseAuthAction,
    setPermissionsMenu,
    setOauthMenuLoaded,
  };
});
