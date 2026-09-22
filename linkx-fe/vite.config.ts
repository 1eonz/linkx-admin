import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

// lib 模式构建：dist/lx-ui.js + style.css + .d.ts 类型声明
export default defineConfig({
  plugins: [
    vue(),
    dts({ tsconfigPath: './tsconfig.json', include: ['src'] }),
  ],
  // 隔离上层目录（老项目）的 postcss 配置
  css: { postcss: {} },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'LxUI',
      fileName: 'lx-ui',
      formats: ['es'],
    },
    rollupOptions: {
      // vue / element-plus 为 peer，不打进产物
      external: ['vue', 'element-plus'],
    },
    cssCodeSplit: false,
  },
});
