import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'node:url'

// 放开 fs 限制（demo 文件位于 src/components）
const workspaceRoot = fileURLToPath(new URL('../', import.meta.url))

export default defineConfig({
  lang: 'zh-CN',
  title: 'LxUI',
  description: 'LinkX 业务组件库 · Vue3 + Element Plus 二次封装 · 设计令牌驱动',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  ],
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
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: {
            combineWith: 'AND',
            prefix: false,
            fuzzy: false,
          },
          options: {
            // 汉字只索引相邻双字，避免单字匹配扩大结果范围。
            tokenize: (text: string) => {
              const segments =
                text.toLowerCase().match(/[\p{Script=Han}]+|[a-z0-9]+/gu) ?? []
              const tokens = new Set<string>()

              for (const segment of segments) {
                if (/^\p{Script=Han}+$/u.test(segment)) {
                  const characters = Array.from(segment)
                  for (
                    let index = 0;
                    index < characters.length - 1;
                    index += 1
                  ) {
                    tokens.add(`${characters[index]}${characters[index + 1]}`)
                  }
                } else {
                  tokens.add(segment)
                }
              }

              return [...tokens]
            },
          },
        },
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            displayDetails: '显示详细结果',
            resetButtonTitle: '清除搜索',
            backButtonTitle: '返回',
            noResultsText: '没有找到相关结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '按回车键选择',
              navigateText: '切换结果',
              navigateUpKeyAriaLabel: '向上切换结果',
              navigateDownKeyAriaLabel: '向下切换结果',
              closeText: '关闭',
              closeKeyAriaLabel: '按 Esc 关闭',
            },
          },
        },
      },
    },
    sidebarMenuLabel: '菜单',
    outlineTitle: '本页导航',
    returnToTopLabel: '返回顶部',
    nav: [
      { text: '首页', link: '/' },
      { text: '组件', link: '/components/lxsidebar' },
      { text: '新增组件', link: '/components/new-components' },
    ],
    sidebar: {
      '/components/': [
        {
          text: '新增组件',
          items: [{ text: '新增组件总览', link: '/components/new-components' }],
        },
        {
          text: '基础',
          items: [
            { text: '基础控件桥接', link: '/components/element-bridge' },
            { text: 'LxButton 按钮', link: '/components/lxbutton' },
            { text: 'LxIcon 图标总览', link: '/components/lxicons' },
          ],
        },
        {
          text: '布局导航',
          items: [
            { text: 'LxSidebar 侧边栏', link: '/components/lxsidebar' },
            { text: 'LxNavbar 顶部导航', link: '/components/lxnavbar' },
            { text: 'LxBreadcrumb 面包屑', link: '/components/lxbreadcrumb' },
            { text: 'LxTabsBar 页签栏', link: '/components/lxtabsbar' },
            {
              text: 'LxSplitLayout 分栏布局',
              link: '/components/lxsplitlayout',
            },
            {
              text: 'LxSelectTree 组织树选择',
              link: '/components/lxselecttree',
            },
          ],
        },
        {
          text: '数据展示',
          items: [
            {
              text: '表格、分页与详情',
              items: [
                { text: 'LxProTable 数据表格', link: '/components/lxprotable' },
                { text: 'LxPagination 分页', link: '/components/lxpagination' },
                {
                  text: 'LxDescriptions 详情描述',
                  link: '/components/lxdescriptions',
                },
              ],
            },
            {
              text: '页面与指标',
              items: [
                { text: 'LxPageCard 页面容器', link: '/components/lxpagecard' },
                {
                  text: 'LxMetricCard 指标卡',
                  link: '/components/lxmetriccard',
                },
                {
                  text: 'LxSectionTitle 区块标题',
                  link: '/components/lxsectiontitle',
                },
              ],
            },
            {
              text: '日历与组织',
              items: [
                {
                  text: 'LxDutyCalendar 排班日历',
                  link: '/components/lxdutycalendar',
                },
                { text: 'LxAuthImg 鉴权图片', link: '/components/lxauthimg' },
                {
                  text: 'LxVirtualTree 虚拟树',
                  link: '/components/lxvirtualtree',
                },
                {
                  text: 'LxTransferPanel 双栏穿梭',
                  link: '/components/lxtransferpanel',
                },
              ],
            },
            {
              text: '状态与辅助',
              items: [
                { text: 'LxStatusDot 状态点', link: '/components/lxstatusdot' },
                { text: 'LxTag 浅底标签', link: '/components/lxtag' },
                {
                  text: 'LxNodeBadge 节点徽章',
                  link: '/components/lxnodebadge',
                },
                { text: 'LxEmpty 空态', link: '/components/lxempty' },
              ],
            },
            {
              text: '图形与操作',
              items: [
                { text: 'LxCodeSlot 代码槽', link: '/components/lxcodeslot' },
                {
                  text: 'LxActionButtons 行内操作',
                  link: '/components/lxactionbuttons',
                },
                { text: 'LxGauge 圆环仪表', link: '/components/lxgauge' },
                { text: '权限消费', link: '/components/permissions' },
              ],
            },
          ],
        },
        {
          text: '数据录入',
          items: [
            {
              text: '表单与基础字段',
              items: [
                { text: 'LxForm 表单', link: '/components/lxform' },
                { text: 'LxInput 输入框', link: '/components/lxinput' },
                { text: 'LxTextarea 文本域', link: '/components/lxtextarea' },
                {
                  text: 'LxInputNumber 数字输入',
                  link: '/components/lxinputnumber',
                },
                {
                  text: 'LxPasswordInput 密码输入框',
                  link: '/components/lxpasswordinput',
                },
              ],
            },
            {
              text: '选项控件',
              items: [
                { text: 'LxRadio 单选组', link: '/components/lxradio' },
                { text: 'LxCheckbox 复选组', link: '/components/lxcheckbox' },
                { text: 'LxSwitch 开关', link: '/components/lxswitch' },
                { text: 'LxSelect 下拉选择', link: '/components/lxselect' },
              ],
            },
            {
              text: '树形与日期选择',
              items: [
                {
                  text: 'LxTreeSelect 树形下拉',
                  link: '/components/lxtreeselect',
                },
                { text: 'LxCascader 级联选择', link: '/components/lxcascader' },
                {
                  text: 'LxDatePicker 日期选择',
                  link: '/components/lxdatepicker',
                },
              ],
            },
            {
              text: '检索与复杂字段',
              items: [
                {
                  text: 'LxSearchBar 检索面板',
                  link: '/components/lxsearchbar',
                },
                {
                  text: 'LxDynamicForm 动态表单',
                  link: '/components/lxdynamicform',
                },
                {
                  text: 'LxStatusSwitch 状态开关',
                  link: '/components/lxstatusswitch',
                },
                { text: 'LxUpload 文件上传', link: '/components/lxupload' },
                {
                  text: 'LxSelectPagination 远程分页选择',
                  link: '/components/lxselectpagination',
                },
              ],
            },
          ],
        },
        {
          text: '反馈与浮层',
          items: [
            { text: 'LxMessage 全局提示', link: '/components/lxmessage' },
            { text: 'LxConfirm 确认框', link: '/components/lxconfirm' },
            { text: 'LxDialog 表单弹窗', link: '/components/lxdialog' },
            { text: 'LxDrawer 详情抽屉', link: '/components/lxdrawer' },
            {
              text: 'LxFormErrorBanner 校验横幅',
              link: '/components/lxformerrorbanner',
            },
          ],
        },
      ],
    },
  },
})
