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
