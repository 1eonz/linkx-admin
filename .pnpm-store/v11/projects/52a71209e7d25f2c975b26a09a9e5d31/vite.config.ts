import { copyFileSync, existsSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

/**
 * 构建后处理：生成整合样式 dist/style.css（"一行引入"）
 * - dist/element-plus.css ← 复制 EP 全量样式（EP 是本包 dependencies，node_modules 内必然存在）
 * - dist/lx-ui.css        ← vite lib 产物（Lx 令牌 + EP 变量桥接 + 组件样式），产物名兜底 rename
 * - dist/style.css        ← @import 前两者，宿主项目 import 'lx-ui/style.css' 一行搞定
 */
function epStyleBundle(): Plugin {
  return {
    name: 'lx-ep-style-bundle',
    closeBundle() {
      const root = process.cwd();
      const outDir = resolve(root, 'dist');
      const lxUiCss = resolve(outDir, 'lx-ui.css');
      // vite lib 样式产物名兜底：cssFileName 未生效时产物为 style.css → rename 为 lx-ui.css
      if (!existsSync(lxUiCss)) {
        const viteCss = resolve(outDir, 'style.css');
        if (!existsSync(viteCss)) return;
        renameSync(viteCss, lxUiCss);
      }
      // EP 全量样式复制（宿主直接使用 ElButton 等 EP 组件时由整合入口提供）
      const epCss = resolve(root, 'node_modules/element-plus/dist/index.css');
      const imports = [];
      if (existsSync(epCss)) {
        copyFileSync(epCss, resolve(outDir, 'element-plus.css'));
        imports.push(`@import './element-plus.css';\n`);
      }
      imports.push(`@import './lx-ui.css';\n`);
      writeFileSync(resolve(outDir, 'style.css'), imports.join(''));
    },
  };
}

// lib 模式构建：dist/lx-ui.js + dist/lx-ui.css + dist/style.css（整合）+ .d.ts 类型声明
export default defineConfig({
  plugins: [
    vue(),
    dts({ tsconfigPath: './tsconfig.json', include: ['src'] }),
    epStyleBundle(),
  ],
  // 隔离上层目录（老项目）的 postcss 配置
  css: { postcss: {} },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'LxUI',
      fileName: 'lx-ui',
      cssFileName: 'lx-ui',
      formats: ['es'],
    },
    rollupOptions: {
      // vue 为 peer；element-plus（含 es 子路径按需样式）不打进产物：
      // JS 侧保留 import 语句由宿主构建解析，CSS 不内联进 lx-ui.css，保证与 EP 全量样式不重复
      external: [/^element-plus(?:\/.*)?$/, 'vue'],
    },
    cssCodeSplit: false,
  },
});
