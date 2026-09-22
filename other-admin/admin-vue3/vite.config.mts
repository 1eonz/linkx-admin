import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_PUBLIC_PATH || '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '#': resolve(__dirname, 'types'),
      },  
    },
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        resolvers: [ElementPlusResolver()],
        dts: 'types/auto-imports.d.ts',
        eslintrc: { enabled: true },
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'types/components.d.ts',
        dirs: ['src/components'],
      }),
    ],
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          // 全局注入 variables.less，让所有 .vue/.less 文件的 scoped style
          // 可直接使用 @color-* / @spacing-* / @radius-* 等设计令牌
          additionalData: `@import "@/styles/variables.less";`,
        },
      },
    },
    server: {
      port: 30845,
      open: false,
      proxy: {
        [env.VITE_BASE_API || '/linkx/admin']: {
          target: env.VITE_PROXY || 'https://172.16.23.8:30844',
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(new RegExp(`^${env.VITE_BASE_API || '/linkx/admin'}`), '/linkx/admin'),
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'static',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
          manualChunks: {
            'element-plus': ['element-plus', '@element-plus/icons-vue'],
            'vue-vendor': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
            utils: ['axios', 'dayjs', 'lodash-es', 'crypto-js', 'js-cookie', 'qs'],
          },
        },
      },
    },
  };
});
