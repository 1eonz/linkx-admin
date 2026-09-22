import ElementPlus from 'element-plus';
import { createApp } from 'vue';

import App from './App.vue';
import i18n from './locales';
import router from './router';
import pinia from './store';

// Element Plus
import 'element-plus/dist/index.css';

// 全局样式
import '@/styles/index.less';

// 路由守卫（导入即触发 beforeEach 注册）
import './router/routerGuard';

// 指令
import { setupDirectives } from './directives';

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(i18n);
app.use(ElementPlus, { size: 'large' });

setupDirectives(app);

app.mount('#app');
