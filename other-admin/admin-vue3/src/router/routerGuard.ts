import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

import { addRouterByPermissions } from './filterChain';
import router from './index';
import { useUserStore } from '@/store/modules/useUserStore';
import { getToken } from '@/utils/auth';
import { getPageTitle } from '@/utils/get-page-title';
import { buildRoutesFromOauthMenu, printMatchedInfo } from '@/utils/menuRouteMapper';

NProgress.configure({ showSpinner: false });

const whiteList = ['/login', '/index.html'];

// OAuth 菜单是否已加载
let oauthMenuLoaded = false;

router.beforeEach(async (to, from, next) => {
  NProgress.start();

  const userStore = useUserStore();
  const { menu } = userStore;

  // 首次进入：菜单为空时拉取菜单并注册动态路由
  if (!whiteList.includes(to.path) && menu.length === 0) {
    const res = await userStore.getMenuAction();
    if (!res) {
      NProgress.done();
      next('/login');
      return;
    }

    const { menu: newMenu, permissions } = userStore;
    const filteredRoutes = await addRouterByPermissions(newMenu, permissions.menus);

    // 逐个添加动态路由（Vue Router 4 API）
    filteredRoutes.forEach((route) => {
      router.addRoute(route);
    });

    // 诊断：打印注册后的所有路由
    console.log(
      '[RouterGuard] 已注册路由:',
      router.getRoutes().map((r) => ({ path: r.path, name: r.name })),
    );

    // 加载 OAuth 菜单（生产环境跳过，开发环境并行）
    if (!oauthMenuLoaded) {
      if (import.meta.env.PROD) {
        oauthMenuLoaded = true;
      } else {
        loadOauthMenu();
      }
    }

    // next(to.redirectedFrom) 确保新添加的路由生效
    // 当直接访问 /authority/role 时 redirectedFrom 为 undefined，next() 继续导航到 to
    const redirectFrom = to.redirectedFrom;
    if (redirectFrom) {
      next(redirectFrom);
    } else {
      next();
    }
    return;
  }

  // 设置页面标题
  document.title = getPageTitle(to.meta?.title as string | undefined);

  // Token 校验
  const hasToken = getToken();
  if (hasToken) {
    const targetPath = typeof to.redirectedFrom === 'string' ? to.redirectedFrom : to.path;
    if (whiteList.includes(targetPath)) {
      next({ path: '/' });
      NProgress.done();
    } else {
      next();
    }
  } else {
    if (to.path === '/login') {
      next();
    } else {
      next(`/login?redirect=${to.path}`);
      NProgress.done();
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});

/**
 * 加载 OAuth 菜单并构建路由（并行运行，不影响现有菜单显示）
 */
async function loadOauthMenu(): Promise<void> {
  try {
    const menuData = await useUserStore().getOauthMenuAction();
    if (!menuData || menuData.length === 0) {
      console.warn('[OAuth菜单] 未获取到菜单数据');
      return;
    }

    const { routes, matchedInfo } = buildRoutesFromOauthMenu(menuData);
    printMatchedInfo(matchedInfo);

    if (import.meta.env.PROD) {
      useUserStore().setOauthMenuLoaded(true);
    }
    oauthMenuLoaded = true;
  } catch (err) {
    console.error('[OAuth菜单] 加载失败:', err);
  }
}

export default router;
