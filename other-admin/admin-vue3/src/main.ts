import ElementPlus from 'element-plus';
import { setupLxPermission } from 'lx-ui';
import { createApp } from 'vue';

import App from './App.vue';
import { setupDirectives } from './directives';
import i18n from './locales';
import router from './router';
import pinia from './store';
import { useUserStore } from './store/modules/useUserStore';

// Element Plus
import 'element-plus/dist/index.css';

// 全局样式
import '@/styles/index.less';
// 统一组件库令牌及 Element Plus 主题，业务组件继续负责请求与权限。
import 'lx-ui/style.css';
import '@/styles/lx-bridge.css';

// 路由守卫（导入即触发 beforeEach 注册）
import './router/routerGuard';

const app = createApp(App);

app.use(pinia);
// lx-ui 只消费已有 actions；字段脱敏等待后端 maskedFields 契约，不在宿主臆造。
setupLxPermission(() => {
  const userStore = useUserStore();
  return {
    codes: { legacy: userStore.buttons },
    maskedFields: {},
  };
});
app.use(router);
app.use(i18n);
app.use(ElementPlus, { size: 'large' });

setupDirectives(app);

app.mount('#app');
