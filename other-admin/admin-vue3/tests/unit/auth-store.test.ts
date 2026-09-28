import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getGlobalsList } from '@/api/dictionary/globals';
import { getLicenseInfo } from '@/api/license';
import { getMenuList } from '@/api/permission/menu';
import { getRolePermissions, login } from '@/api/user';
import { useUserStore } from '@/store/modules/useUserStore';
import { getLicenseAuth, getToken, setButtons, setIsAdmin, setLicenseAuth, setToken, setUserId } from '@/utils/auth';

vi.mock('@/api/dictionary/globals', () => ({ getGlobalsList: vi.fn() }));
vi.mock('@/api/permission/menu', () => ({ getMenuList: vi.fn() }));
vi.mock('@/api/user', () => ({ getRolePermissions: vi.fn(), login: vi.fn(), logout: vi.fn() }));
vi.mock('@/api/license', () => ({ getLicenseInfo: vi.fn() }));
vi.mock('@/router', () => ({ resetRouter: vi.fn() }));
vi.mock('@/utils/session', () => ({ stopSessionMonitoring: vi.fn() }));

const globals = vi.mocked(getGlobalsList);
const menus = vi.mocked(getMenuList);
const permissions = vi.mocked(getRolePermissions);
const loginApi = vi.mocked(login);
const licenseInfo = vi.mocked(getLicenseInfo);

describe('authentication menu bootstrap', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key),
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    setActivePinia(createPinia());
    globals.mockResolvedValue({ code: 0, msg: '', data: [] } as never);
    permissions.mockResolvedValue({ code: 0, msg: '', data: { menus: [], actions: [] } } as never);
    licenseInfo.mockReset();
  });

  it('marks a valid empty menu as loaded instead of fetching it on every navigation', async () => {
    menus.mockResolvedValue({ code: 0, msg: '', data: [] } as never);
    const store = useUserStore();

    await expect(store.getMenuAction()).resolves.toBe(true);
    expect(store.menu).toEqual([]);
    expect(store.menuLoaded).toBe(true);
  });

  it('discards a menu response that returns after the session has been reset', async () => {
    let resolveMenu!: (value: unknown) => void;
    menus.mockReturnValue(
      new Promise((resolve) => {
        resolveMenu = resolve;
      }) as never,
    );
    const store = useUserStore();
    const pending = store.getMenuAction();

    await Promise.resolve();
    store.resetState();
    resolveMenu({ code: 0, msg: '', data: [{ id: 'stale' }] });

    await expect(pending).resolves.toBe(false);
    expect(store.menu).toEqual([]);
    expect(store.menuLoaded).toBe(false);
  });

  it('clears prior account permissions and identity when a new account logs in', async () => {
    setToken('old-token');
    setUserId('1');
    setIsAdmin(true);
    setButtons(['user:create']);
    const store = useUserStore();
    store.permissions = { type: 0, menus: ['old-menu'], actions: ['user:create'] };
    store.menuLoaded = true;
    loginApi.mockResolvedValue({
      code: 0,
      msg: '',
      data: {
        accessToken: 'new-token',
        userName: 'new-user',
        userId: '2',
        idCardNum: '',
        isAdmin: false,
      },
    } as never);

    await store.loginAction({ username: 'new-user', password: 'secret' });

    expect(getToken()).toBe('new-token');
    expect(localStorage.getItem('back_user_id')).toBe('2');
    expect(localStorage.getItem('is_admin')).toBe('false');
    expect(localStorage.getItem('buttons')).toBeNull();
    expect(store.permissions).toEqual({ menus: [], actions: [] });
    expect(store.menuLoaded).toBe(false);
  });

  it('retains persisted license authorization when the request fails', async () => {
    const previousAuth = {
      groupCollaborationAuth: true,
      taskCollaborationAuth: false,
      businessCollaborationAuth: true,
      AICollaborationAuth: false,
      northboundDataInterface: true,
      licenseState: 2,
      expireDate: '2030-01-01',
    };
    setLicenseAuth(previousAuth);
    licenseInfo.mockRejectedValueOnce(new Error('network unavailable'));
    const store = useUserStore();

    await expect(store.refreshLicenseAuthAction()).resolves.toEqual(previousAuth);

    expect(store.licenseAuth).toEqual(previousAuth);
    expect(getLicenseAuth()).toEqual(previousAuth);
  });

  it('retains persisted license authorization for business and invalid-data failures', async () => {
    const previousAuth = {
      groupCollaborationAuth: true,
      taskCollaborationAuth: false,
      businessCollaborationAuth: true,
      AICollaborationAuth: false,
      northboundDataInterface: true,
      licenseState: 1,
      expireDate: '2031-06-30',
    };
    setLicenseAuth(previousAuth);
    const store = useUserStore();
    licenseInfo.mockResolvedValueOnce({ code: 1, msg: 'license unavailable', data: { status: 1 } });

    await expect(store.refreshLicenseAuthAction()).resolves.toEqual(previousAuth);

    licenseInfo.mockResolvedValueOnce({ code: 0, msg: '', data: { status: Number.NaN } });

    await expect(store.refreshLicenseAuthAction()).resolves.toEqual(previousAuth);
    expect(store.licenseAuth).toEqual(previousAuth);
    expect(getLicenseAuth()).toEqual(previousAuth);
  });

  it('updates store and persistence only for a valid license response', async () => {
    const previousAuth = {
      groupCollaborationAuth: false,
      taskCollaborationAuth: false,
      businessCollaborationAuth: false,
      AICollaborationAuth: false,
      northboundDataInterface: false,
      licenseState: 5,
      expireDate: '',
    };
    const nextAuth = {
      groupCollaborationAuth: true,
      taskCollaborationAuth: false,
      businessCollaborationAuth: true,
      AICollaborationAuth: false,
      northboundDataInterface: true,
      licenseState: 1,
      expireDate: '2032-12-31',
    };
    setLicenseAuth(previousAuth);
    licenseInfo.mockResolvedValueOnce({
      code: 0,
      msg: '',
      data: {
        status: 1,
        expireDate: '2032-12-31',
        LINKXBS: '1',
        LINKXGCF: '0',
        LINKXTCF: '1',
        LINKXBCF: '0',
        LINKXACF: '1',
        LINKXNDI: '0',
      },
    });
    const store = useUserStore();

    await expect(store.refreshLicenseAuthAction()).resolves.toEqual(nextAuth);

    expect(store.licenseAuth).toEqual(nextAuth);
    expect(getLicenseAuth()).toEqual(nextAuth);
  });
});
