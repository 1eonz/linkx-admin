import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

import { addRouterByPermissions } from './filterChain';
import router, { addDynamicRoute } from './index';
import { useUserStore } from '@/store/modules/useUserStore';
import { getToken } from '@/utils/auth';
import { getPageTitle } from '@/utils/get-page-title';

NProgress.configure({ showSpinner: false });

const whiteList = ['/login', '/index.html'];

router.beforeEach((to, from, next) => {
  NProgress.start();

  const userStore = useUserStore();
  const hasToken = getToken();

  // 先验证令牌，再发起受保护的菜单和权限请求。
  if (!hasToken) {
    if (to.path === '/login') next();
    else next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    NProgress.done();
    return;
  }

  if (whiteList.includes(to.path)) {
    next({ path: '/' });
    NProgress.done();
    return;
  }

  // 首次进入：菜单为空时拉取菜单并注册动态路由
  if (!whiteList.includes(to.path) && !userStore.menuLoaded) {
    const sessionEpoch = userStore.sessionEpoch;
    userStore
      .getMenuAction()
      .then((loaded) => {
        // 等待接口期间若登出或切换账号，应废弃旧导航。
        if (sessionEpoch !== userStore.sessionEpoch) {
          next(false);
          NProgress.done();
          return Promise.resolve();
        }
        if (!loaded) {
          return userStore.resetTokenAction().then(() => {
            NProgress.done();
            next('/login');
          });
        }

        const { menu: newMenu, permissions } = userStore;
        return addRouterByPermissions(newMenu, permissions.menus).then((filteredRoutes) => {
          if (sessionEpoch !== userStore.sessionEpoch) {
            next(false);
            NProgress.done();
            return;
          }

          // 逐个添加动态路由（Vue Router 4 API）
          filteredRoutes.forEach((route) => {
            addDynamicRoute(route);
          });
          // 重新按完整地址解析，使首次直达的动态路由拿到新注册的 matched 记录。
          // 直接展开旧的 to 对象会复用通配路由的匹配结果，出现地址正确但页面仍显示首页的问题。
          const browserPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
          const initialFallbackPath =
            to.path === '/dashboard' && from.path === '/' && browserPath !== '/dashboard' && browserPath !== '/';
          next({ path: initialFallbackPath ? browserPath : to.fullPath, replace: true });
        });
      })
      .catch(() => {
        NProgress.done();
        next(false);
      });
    return;
  }

  // 设置页面标题
  document.title = getPageTitle(to.meta?.title as string | undefined);

  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
