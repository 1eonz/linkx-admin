import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'node:url';

// 放开 fs 限制（demo 文件位于 src/components）
const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));

export default defineConfig({
  title: 'LxUI',
  description: 'LinkX 业务组件库 · Vue3 + Element Plus 二次封装 · 设计令牌驱动',
  vite: {
    // 关键：阻止 vitepress 加载根目录 vite.config.ts，避免 vue 插件重复注册
    // （重复注册会导致所有 .vue 被 transform 两次 → "At least one <template> or <script> is required"）
    configFile: false,
    // 隔离上层目录（老项目）的 postcss 配置（autoprefixer 在本包不可达）
    css: { postcss: { plugins: [] } },
    // SSR 构建时把 element-plus 打进 bundle（默认 external 会让 Node 原生加载 .css 失败）
    ssr: { noExternal: ['element-plus'] },
    server: { fs: { allow: [workspaceRoot] } },
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '组件', link: '/components/lxsidebar' },
    ],
    sidebar: {
      '/components/': [
        {
          text: '基础',
          items: [
            { text: 'LxIcon 图标总览', link: '/components/lxicons' },
          ],
        },
        {
          text: '布局导航',
          items: [
            { text: 'LxSidebar 侧边栏', link: '/components/lxsidebar' },
            { text: 'LxSelectTree 组织树选择', link: '/components/lxselecttree' },
          ],
        },
        {
          text: '数据展示',
          items: [
            { text: 'LxProTable 数据表格', link: '/components/lxprotable' },
            { text: 'LxPagination 分页', link: '/components/lxpagination' },
            { text: 'LxStatusDot 状态点', link: '/components/lxstatusdot' },
            { text: 'LxTag 浅底标签', link: '/components/lxtag' },
            { text: 'LxActionButtons 行内操作', link: '/components/lxactionbuttons' },
            { text: 'LxEmpty 空态', link: '/components/lxempty' },
            { text: 'LxGauge 圆环仪表', link: '/components/lxgauge' },
            { text: 'LxNodeBadge 节点徽章', link: '/components/lxnodebadge' },
          ],
        },
        {
          text: '数据录入',
          items: [
            { text: 'LxForm 表单', link: '/components/lxform' },
          ],
        },
        {
          text: '反馈与浮层',
          items: [
            { text: 'LxMessage 全局提示', link: '/components/lxmessage' },
            { text: 'LxConfirm 确认框', link: '/components/lxconfirm' },
            { text: 'LxDialog 表单弹窗', link: '/components/lxdialog' },
            { text: 'LxDrawer 详情抽屉', link: '/components/lxdrawer' },
            { text: 'LxFormErrorBanner 校验横幅', link: '/components/lxformerrorbanner' },
          ],
        },
      ],
    },
  },
});
