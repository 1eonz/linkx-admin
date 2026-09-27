import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getGlobalsList } from '@/api/dictionary/globals';
import { getMenuList } from '@/api/permission/menu';
import { getRolePermissions, login } from '@/api/user';
import { useUserStore } from '@/store/modules/useUserStore';
import { getToken, setButtons, setIsAdmin, setToken, setUserId } from '@/utils/auth';

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

describe('authentication menu bootstrap', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key),
    });
    setActivePinia(createPinia());
    globals.mockResolvedValue({ code: 0, msg: '', data: [] } as never);
    permissions.mockResolvedValue({ code: 0, msg: '', data: { menus: [], actions: [] } } as never);
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
});
