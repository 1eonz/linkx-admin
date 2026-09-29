import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: ['vue', 'element-plus'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#': fileURLToPath(new URL('./types', import.meta.url)),
      // 统一 vue / element-plus 到单一实例：lx-ui 为 link 依赖，其源码默认从
      // linkx-fe/node_modules 解析出第二份 vue(3.5.43)/EP(2.14.6)，与宿主
      // 3.5.39/2.14.2 并存导致 provide/inject 与响应性跨实例断链。
      // 按后续全量替换 lx-ui 的方向，EP 以组件库锁定的 2.14.6 为准；
      // vue 统一到宿主实例，保证 test-utils 与组件共用同一响应式系统。
      vue: fileURLToPath(new URL('./node_modules/vue', import.meta.url)),
      'element-plus': fileURLToPath(new URL('../../linkx-fe/node_modules/element-plus', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      less: { additionalData: '@import "@/styles/variables.less";' },
    },
  },
  test: {
    // 本地 lx-ui 导入 Element Plus 的按需 CSS，交给 Vite 转换，避免 Node 直接加载样式。
    server: { deps: { inline: ['element-plus', 'lx-ui'] } },
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
