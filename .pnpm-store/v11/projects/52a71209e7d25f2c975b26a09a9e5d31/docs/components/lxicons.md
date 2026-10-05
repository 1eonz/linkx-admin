# LxIcon 图标总览

内置 SVG 图标集：24×24 画布 / stroke 1.5 / round cap，`currentColor` 继承文字色（跟随文字颜色，无需单独传色）。**点击图标卡片复制完整用法代码** `<LxIcon name="xxx" :size="20" />`。

动效仅配置在 69 个名称上；其余名称保持静态。Hover/focus 微动效采用自然减速曲线；warning 与 email 使用短促的语义反馈，不使用弹性回弹。系统启用减少动效时停用图标运动。

## 图标列表（94 个图形，96 个可用名称）

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import {
  LxIcon,
  LX_ICON_29_NAMES,
  LX_ICON_MOTION_NAMES,
  LX_ICON_NAMES,
  LX_ICON_P0_NAMES,
  LX_ICON_P1_NAMES,
  lxMessage,
  type LxIconName,
} from '../../src';

interface IconGroup { title: string; names: LxIconName[] }

const MOTION_CHECKLISTS = [
  { title: 'P0 高频核心', names: LX_ICON_P0_NAMES },
  { title: 'P1 业务语义', names: LX_ICON_P1_NAMES },
  { title: '29 枚扩展', names: LX_ICON_29_NAMES },
];

const ICON_LABELS: Record<LxIconName, string> = {
  dashboard: '仪表盘',
  team: '团队',
  bell: '通知',
  calendar: '日历',
  setting: '设置',
  shield: '安全防护',
  cube: '设备',
  server: '服务器',
  key: '密钥',
  'map-pin': '地图定位',
  camera: '摄像头',
  alert: '警报',
  'chevron-down': '向下展开',
  'chevron-right': '向前展开',
  'chevron-left': '向左返回',
  'chevrons-left': '收起侧栏',
  check: '勾选',
  search: '搜索',
  x: '关闭',
  menu: '菜单',
  user: '用户',
  pulse: '实时状态',
  'circle-check': '成功',
  'circle-x': '失败',
  'circle-alert': '提示',
  report: '报告',
  delete: '删除',
  edit: '编辑',
  plus: '新增',
  refresh: '刷新',
  undo: '重置',
  download: '下载',
  upload: '上传',
  eye: '查看',
  loading: '加载中',
  more: '更多操作',
  folder: '文件夹',
  'folder-open': '展开文件夹',
  warning: '警告',
  people: '多人组织',
  file: '文件详情',
  'file-check': '已授权文件',
  star: '收藏',
  tag: '分类标签',
  image: '图片',
  video: '视频',
  mobile: '手机',
  link: '链接',
  share: '分享',
  'arrow-up': '上移',
  'arrow-down': '下移',
  'arrow-left': '上一项',
  'arrow-right': '下一项',
  'caret-down': '下拉选项',
  close: '清除标签',
  switch: '停用',
  power: '电源',
  clock: '时间',
  grid: '网格视图',
  list: '列表视图',
  copy: '复制',
  phone: '电话',
  email: '邮箱',
  lock: '锁定',
  unlock: '解锁',
  minus: '减少',
  'eye-on': '显示',
  'eye-off': '隐藏',
  filter: '筛选',
  sort: '排序',
  fullscreen: '全屏',
  'fullscreen-exit': '退出全屏',
  printer: '打印',
  info: '信息',
  'circle-question': '帮助',
  history: '历史记录',
  message: '消息',
  password: '密码',
  'id-card': '证件',
  logout: '退出登录',
  home: '首页',
  language: '语言',
  screenshot: '截图',
  wifi: '网络',
  cloud: '云服务',
  database: '数据库',
  terminal: '终端',
  cpu: '处理器',
  pin: '固定',
  'zoom-in': '放大',
  'zoom-out': '缩小',
  drag: '拖拽',
  save: '保存',
  export: '归档导出',
  'location-arrow': '导航定位',
  date: '日期',
};

const ICON_SEARCH_TERMS: Partial<Record<LxIconName, string>> = {
  dashboard: '首页 数据看板 总览 工作台',
  team: '成员 组织 群组',
  bell: '消息提醒 告警',
  setting: '配置 选项',
  shield: '权限 防护',
  cube: '终端 盒子',
  server: '节点 服务',
  key: '密码 权限',
  'map-pin': '位置 定位 地图',
  camera: '拍照 监控',
  alert: '告警 报警 异常',
  'chevron-down': '下拉 折叠',
  'chevron-right': '展开 下一级',
  'chevron-left': '返回 上一级',
  'chevrons-left': '折叠 侧栏',
  check: '选择 确认 完成',
  search: '查找 过滤',
  x: '叉号 取消',
  user: '账号 个人',
  pulse: '心跳 活跃',
  'circle-check': '完成 成功',
  'circle-x': '错误 失败',
  'circle-alert': '注意 警告',
  delete: '移除 清空',
  plus: '添加 创建',
  refresh: '重新加载',
  undo: '重置 查询 清除',
  download: '导出 模板',
  upload: '导入 文件',
  eye: '详情 可见',
  loading: '等待 请求中',
  more: '菜单 操作',
  'folder-open': '展开目录',
  warning: '危险 注意',
  people: '部门 成员 群组',
  file: '文档 详情',
  'file-check': '授权 权限',
  star: '默认 标记',
  tag: '分类',
  image: '轮播',
  video: '摄像 视频流',
  mobile: '移动 手机号',
  'arrow-up': '排序 上移',
  'arrow-down': '排序 下移',
  'arrow-left': '返回 上一级',
  'arrow-right': '前进 下一项',
  'caret-down': '展开 下拉',
  close: '清除 关闭',
  switch: '停用 禁用',
  power: '开机 关机',
  clock: '耗时',
  grid: '卡片视图',
  list: '列表',
  copy: '剪贴板',
  email: '邮件 信箱',
  lock: '只读',
  minus: '移除 减号',
  'eye-on': 'eye 可见 睁眼',
  'eye-off': '不可见 遮挡',
  filter: '筛选条件',
  sort: '上下排序',
  fullscreen: '放大 预览',
  'fullscreen-exit': '还原 退出预览',
  printer: '打印机',
  'circle-question': '说明 问号',
  history: '审计 操作记录',
  message: '对话 站内信',
  password: '凭据',
  'id-card': '身份证 警官证',
  logout: '登出 退出',
  home: '根目录',
  language: '国际化 翻译',
  screenshot: '截屏 取证',
  wifi: '在线 离线 网络状态',
  cloud: '同步 云端',
  database: '数据源',
  terminal: '控制台 命令行',
  cpu: '性能 处理器',
  pin: '置顶 固定列',
  'zoom-in': '镜头 放大',
  'zoom-out': '镜头 缩小',
  drag: '拖动 排序把手',
  export: '下载 导出',
  'location-arrow': '位置 导航 方向',
  date: '日历 calendar',
};

const GROUPS: IconGroup[] = [
  {
    title: '侧边栏菜单',
    names: ['dashboard', 'team', 'bell', 'calendar', 'setting', 'shield', 'cube', 'server', 'key', 'map-pin', 'camera', 'alert'],
  },
  {
    title: '交互',
    names: ['chevron-down', 'chevron-right', 'chevron-left', 'chevrons-left', 'check', 'search', 'x', 'menu', 'user', 'pulse'],
  },
  {
    title: '反馈提示',
    names: ['circle-check', 'circle-x', 'circle-alert', 'report'],
  },
  {
    title: 'P0 高频核心',
    names: ['delete', 'edit', 'plus', 'refresh', 'undo', 'download', 'upload', 'eye', 'loading', 'more', 'folder', 'folder-open', 'warning'],
  },
  {
    title: 'P1 业务语义',
    names: ['people', 'file', 'file-check', 'star', 'tag', 'image', 'video', 'mobile', 'link', 'share', 'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'caret-down', 'close', 'switch', 'power', 'clock', 'grid', 'list', 'copy', 'phone', 'email', 'lock', 'unlock'],
  },
  {
    title: 'P2 通用补充',
    names: ['minus', 'eye-off', 'filter', 'sort', 'fullscreen', 'fullscreen-exit', 'printer', 'info', 'circle-question', 'history', 'message', 'password', 'id-card', 'logout', 'home', 'language', 'screenshot', 'wifi', 'cloud', 'database', 'terminal', 'cpu', 'pin', 'zoom-in', 'zoom-out', 'drag', 'save', 'export', 'location-arrow'],
  },
  {
    title: '兼容别名',
    names: ['date', 'eye-on'],
  },
];

// 兜底：icons.ts 中新增但未登记分组的图标自动收进「其他」，保证总览永不缺漏
const grouped = new Set<LxIconName>(GROUPS.flatMap((g) => g.names));
const others = LX_ICON_NAMES.filter((name) => !grouped.has(name));
if (others.length) GROUPS.push({ title: '其他', names: others });

const keyword = ref('');
const searchInput = ref<HTMLInputElement>();
const visibleGroups = computed(() =>
  GROUPS.map((group) => ({
    ...group,
    names: group.names.filter((name) => {
      const query = keyword.value.trim().toLocaleLowerCase();
      const searchable = `${name} ${ICON_LABELS[name]} ${ICON_SEARCH_TERMS[name] ?? ''}`.toLocaleLowerCase();
      return !query || searchable.includes(query);
    }),
  })).filter((group) => group.names.length),
);

function clearSearch() {
  keyword.value = '';
  nextTick(() => searchInput.value?.focus());
}

async function copy(name: LxIconName) {
  const snippet = `<LxIcon name="${name}" :size="20" />`;
  try {
    await navigator.clipboard.writeText(snippet);
    lxMessage.success(`已复制：${snippet}`);
  } catch {
    lxMessage.error('复制失败，请手动复制代码');
  }
}
</script>

<div class="icon-catalog">
<div class="icon-searchbar" role="search" aria-label="图标目录筛选">
  <input ref="searchInput" v-model="keyword" class="icon-search" type="text" aria-label="按名称或中文用途筛选图标" placeholder="输入英文名称或中文用途，如：undo / 重置 / 登出" />
  <button v-if="keyword" class="icon-search__clear" type="button" aria-label="清除筛选" title="清除筛选" @click="clearSearch">
    <LxIcon name="close" :size="16" />
  </button>
</div>

<template v-for="g in visibleGroups" :key="g.title">
  <h3 class="icon-group-title">{{ g.title }}（{{ g.names.length }}）</h3>
  <div class="icon-grid">
    <button v-for="n in g.names" :key="n" class="icon-tile" type="button" :aria-label="`复制 ${n}（${ICON_LABELS[n]}）图标用法`" @click="copy(n)">
      <LxIcon :name="n" :size="20" />
      <span class="icon-tile__meaning">{{ ICON_LABELS[n] }}</span>
      <span class="icon-tile__name">{{ n }}</span>
    </button>
  </div>
</template>

<p v-if="!visibleGroups.length" class="icon-empty">无匹配图标</p>
</div>

## 使用

```vue
<LxIcon name="shield" :size="20" />
```

默认尺寸为 `18px`，常用对照尺寸为 `16` / `18` / `20px`；设计稿中的 `24px` 是 SVG 画布预览尺寸，不是额外标准档。`size` 可按布局需要自定义。组件库导出由 `LX_ICONS` 键自动推导的 `LxIconName`；静态配置请使用该类型，外部字符串需先通过 `resolveLxIconName` 校验。未知运行时名称会显示问号图标并带有可访问错误名称。

## 设计清单覆盖

三份参考清单逐项对应标准图形或兼容别名；去重后共有 {{ LX_ICON_MOTION_NAMES.length }} 个动效名称。其他可用名称不执行 hover/focus 图标动效；`spin` 可按需驱动旋转状态。

<p class="icon-count-note">P1 清单包含 27 个名称：图标卡片展示 26 个标准图形键，兼容别名 <code>date</code> 单列展示，不重复计入卡片。</p>

<table>
  <thead>
    <tr><th>清单</th><th>数量</th><th>名称</th></tr>
  </thead>
  <tbody>
    <tr v-for="list in MOTION_CHECKLISTS" :key="list.title">
      <td>{{ list.title }}</td>
      <td>{{ list.names.length }}</td>
      <td><code>{{ list.names.join('、') }}</code></td>
    </tr>
    <tr>
      <th>去重合计</th>
      <td>{{ LX_ICON_MOTION_NAMES.length }}</td>
      <td>别名按独立可用名称计数，动效复用标准图形。</td>
    </tr>
  </tbody>
</table>

## 新增图标

在 `src/components/LxIcon/icons.ts` 的 `LX_ICONS` 中按组追加图形，键为 kebab-case 名称，值为 24×24 viewBox 的 SVG path 数组。仅当设计或业务契约存在同义旧名称时，才在 `LX_ICON_ALIASES` 中映射到标准图形；`LxIconName` 和本页总览会同时包含标准键与别名。

## 兼容别名

| 名称     | 标准图形   | 来源      | 说明                                       |
| -------- | ---------- | --------- | ------------------------------------------ |
| `date`   | `calendar` | P1 清单   | 保留设计文档名称，复用已有日历图形。       |
| `eye-on` | `eye`      | 29 枚清单 | 与现有可见状态图形同义，避免新增重复路径。 |

业务存量值 `calendar`、`eye` 仍可照常使用；别名不会改变它们的序列化值。

<style>
.icon-catalog {
  box-sizing: border-box;
  width: 100%;
}
.lx-theme-hud .vp-doc .icon-catalog {
  margin-block: 12px;
  padding: 12px;
  border-radius: 4px;
  background: var(--lx-bg-page);
}
html.dark:not(.lx-theme-hud) .vp-doc .icon-catalog {
  color-scheme: dark;
  --lx-bg-card: var(--vp-c-bg-alt);
  --lx-border: var(--vp-c-divider);
  --lx-color-primary: var(--vp-c-brand-1);
  --lx-color-primary-light: var(--vp-c-brand-soft);
  --lx-text-primary: var(--vp-c-text-1);
  --lx-text-regular: var(--vp-c-text-1);
  --lx-text-secondary-strong: var(--vp-c-text-2);
}
.icon-searchbar {
  position: sticky;
  top: calc(var(--vp-nav-height, 64px) + 8px);
  z-index: 10;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 4px;
  width: min(360px, 100%);
  margin: 0 0 12px;
  padding: 4px;
  border: 1px solid var(--lx-border);
  border-radius: 4px;
  background: var(--lx-bg-card);
}
.icon-searchbar:focus-within {
  border-color: var(--lx-color-primary);
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 0;
}
.icon-search {
  box-sizing: border-box;
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: var(--lx-text-regular);
  font-size: 13px;
}
.icon-search__clear {
  box-sizing: border-box;
  display: grid;
  flex: 0 0 32px;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--lx-text-secondary-strong);
  cursor: pointer;
}
.icon-search__clear:hover {
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}
.icon-group-title {
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--lx-text-primary);
}
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
}
.icon-tile {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 96px;
  padding: 10px 4px;
  border: 1px solid var(--lx-border);
  border-radius: 4px;
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}
.icon-tile:hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
  box-shadow: var(--lx-shadow-pop);
}
.vp-doc .icon-grid .icon-tile:focus-visible {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
  box-shadow: none;
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 0;
}
.icon-tile:active {
  transform: scale(0.98);
}
.icon-tile__meaning {
  max-width: 100%;
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
  color: inherit;
}
.icon-tile__name {
  font-size: 11px;
  font-family: var(--lx-font-mono);
  color: inherit;
  overflow-wrap: anywhere;
}
.icon-empty {
  padding: 24px 0;
  color: var(--lx-text-secondary-strong);
  font-size: 13px;
  text-align: center;
}
@media (max-width: 640px) {
  .icon-searchbar {
    top: calc(var(--vp-nav-height-mobile, 56px) + 8px);
  }
  .icon-search__clear {
    flex-basis: 44px;
    width: 44px;
    height: 44px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .icon-tile {
    transition: none;
  }
}
</style>
