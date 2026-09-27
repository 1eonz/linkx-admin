import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteRecordRaw } from 'vue-router';

import type { FilterContext } from '#/menu';
import { getLicenseInfoUtil } from '@/composables/useLicense';
import {
  cloneModuleRoutes,
  LicenseFilter,
  MenuPermissionFilter,
  moduleRoutes,
  UserAuthFilter,
} from '@/router/filterChain';
import { useUserStore } from '@/store/modules/useUserStore';

vi.mock('@/composables/useLicense', () => ({ getLicenseInfoUtil: vi.fn() }));
vi.mock('@/layout/index.vue', () => ({ default: {} }));
vi.mock('@/router', () => ({ resetRouter: vi.fn() }));

const context = (menuPermissions: string[], globals: FilterContext['globals'] = []): FilterContext => ({
  menu: [
    { id: 'parent', url: '/baseData', children: [{ id: 'banner', url: 'layoutConfig/banner' }] },
  ] as FilterContext['menu'],
  menuPermissions,
  globals,
  isAdmin: false,
  userId: '2',
  isProd: false,
});

const routes = (): RouteRecordRaw[] => [
  {
    path: '/baseData',
    children: [{ path: 'layoutConfig' }, { path: 'gateway' }],
  } as RouteRecordRaw,
];

describe('authentication route isolation', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    setActivePinia(createPinia());
  });

  it('creates independent route trees without serializing component functions', () => {
    const cloned = cloneModuleRoutes();
    const original = moduleRoutes[0];

    expect(cloned[0]).not.toBe(original);
    expect(cloned[0].component).toBe(original.component);
    expect(cloned[0].children).not.toBe(original.children);

    cloned[0].children?.pop();
    expect(moduleRoutes[0].children?.length).toBeGreaterThan(cloned[0].children?.length ?? 0);
  });

  it('allows a permitted menu prefix but denies an empty restricted menu', async () => {
    const filter = new MenuPermissionFilter();
    useUserStore().permissions = { type: 1, menus: ['parent', 'banner'], actions: [] };

    const allowed = await filter.filter(routes(), context(['parent', 'banner']));
    expect(allowed[0].children?.map((child) => child.path)).toEqual(['layoutConfig']);
    expect(await filter.filter(routes(), context([]))).toEqual([]);
  });

  it('does not restore a disabled menu even when its permission ID remains', async () => {
    const filter = new MenuPermissionFilter();
    useUserStore().permissions = { type: 1, menus: ['parent', 'banner', 'disabled'], actions: [] };

    const filtered = await filter.filter(routes(), {
      ...context(['parent', 'banner', 'disabled']),
      menu: [
        {
          id: 'parent',
          url: '/baseData',
          children: [
            { id: 'banner', url: 'layoutConfig/banner', status: 1 },
            { id: 'disabled', url: 'gateway', status: 0 },
          ],
        },
      ] as FilterContext['menu'],
    });

    expect(filtered[0]?.children?.map((child) => child.path)).toEqual(['layoutConfig']);
  });

  it('keeps disabled menus hidden for super administrators', async () => {
    const filter = new MenuPermissionFilter();
    useUserStore().permissions = { type: 0, menus: [], actions: [] };

    const filtered = await filter.filter(
      [{ path: '/authority', children: [{ path: 'role' }, { path: 'person' }] }] as RouteRecordRaw[],
      {
        ...context([]),
        menu: [
          {
            id: 'authority',
            url: '/authority',
            status: 1,
            children: [{ id: 'role', url: '/authority/role', status: 0 }],
          },
        ] as FilterContext['menu'],
      },
    );

    expect(filtered[0]?.children?.map((child) => child.path)).toEqual(['person']);
  });

  it('keeps child routes when backend permissions use the full parent URL', async () => {
    const source = [{ path: '/authority', children: [{ path: 'role' }, { path: 'person' }] }] as RouteRecordRaw[];
    const filtered = await new MenuPermissionFilter().filter(source, {
      ...context(['role']),
      menu: [{ id: 'role', url: '/authority/role' }],
    });
    expect(filtered[0].children?.map((route) => route.path)).toEqual(['role']);
  });

  it('applies global feature switches even to super administrators', async () => {
    useUserStore().permissions = { type: 0, menus: [], actions: [] };

    const filtered = await new MenuPermissionFilter().filter(
      routes(),
      context([], [{ name: 'EDGEGATEWAY_BREAKER', value: '0' }]),
    );
    expect(filtered[0].children?.map((child) => child.path)).toEqual(['layoutConfig']);
  });

  it('keeps collaboration visible while filtering expired group-license routes', async () => {
    vi.mocked(getLicenseInfoUtil).mockResolvedValue({ groupCollaborationAuth: true } as never);
    const source = [
      { path: '/collaboration', name: 'Collaboration', children: [{ path: 'index', name: 'CollaborationIndex' }] },
      {
        path: '/h5',
        name: 'H5',
        children: [
          { path: 'ArchivedTable', name: 'ArchivedTable' },
          { path: 'carousel', name: 'Carousel' },
        ],
      },
      { path: '/location', name: 'location', children: [{ path: 'location', name: 'Location' }] },
    ] as RouteRecordRaw[];

    const filtered = await new LicenseFilter().filter(source, context([]));
    expect(filtered.map((route) => route.path)).toEqual(['/collaboration', '/h5']);
    expect(filtered[1].children?.map((route) => route.path)).toEqual(['carousel']);
  });

  it('retains layout configuration for a restricted user granted the banner menu', async () => {
    const filter = new UserAuthFilter();
    const source = [
      { path: '/baseData', children: [{ path: 'layoutConfig' }, { path: 'globals' }] },
    ] as RouteRecordRaw[];

    const granted = await filter.filter(cloneModuleRoutes(source), context(['parent', 'banner']));
    expect(granted[0].children?.map((route) => route.path)).toEqual(['layoutConfig', 'globals']);

    const denied = await filter.filter(cloneModuleRoutes(source), { ...context([]), menu: [] });
    expect(denied[0].children?.map((route) => route.path)).toEqual(['globals']);
  });

  it('hides the six permission routes in production for the full administrator account', async () => {
    const authority = moduleRoutes.find((route) => route.path === '/authority');
    expect(authority).toBeDefined();
    if (!authority) return;

    const filtered = await new UserAuthFilter().filter(cloneModuleRoutes([authority]), {
      ...context([]),
      isAdmin: true,
      userId: '1',
      isProd: true,
    });

    expect(filtered[0]?.children?.map((route) => route.path)).toEqual([
      'role',
      'person',
      'userManage',
      'customDepartment',
    ]);
  });
});
