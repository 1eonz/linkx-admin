# LxIcon 图标总览

管理台图标目录，覆盖 94 个图形、96 个可用名称。可按英文名称或中文用途搜索；点击图标卡片复制用法代码。

## 图标列表（94 个图形，96 个可用名称）

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  LxIcon,
  LX_ICON_29_NAMES,
  LX_ICON_MOTION_NAMES,
  LX_ICON_NAMES,
  LX_ICON_P0_NAMES,
  LX_ICON_P1_NAMES,
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
  'file-check': '已授权节点',
  star: '收藏',
  tag: '分类标签',
  image: '图片',
  video: '视频',
  mobile: '手机',
  link: '链接',
  share: '分享',
  'arrow-up': '上移',
  'arrow-down': '下移',
  'arrow-left': '返回上一级',
  'arrow-right': '前进',
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
    title: 'P0 高频核心·常用操作',
    names: ['delete', 'edit', 'plus', 'refresh'],
  },
  {
    title: 'P0 高频核心·内容与状态',
    names: ['undo', 'download', 'upload', 'eye', 'loading', 'more', 'folder', 'folder-open', 'warning'],
  },
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
const copyFeedback = ref<{ type: 'success' | 'error'; message: string }>();
const copyFallback = ref<{ name: LxIconName; snippet: string }>();
const copyFallbackInput = ref<HTMLTextAreaElement>();
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
const searchStatus = computed(() => {
  if (!keyword.value.trim()) return '';
  const iconCount = visibleGroups.value.reduce((count, group) => count + group.names.length, 0);
  return iconCount
    ? `找到 ${iconCount} 个匹配图标，分布在 ${visibleGroups.value.length} 个分类中`
    : '无匹配图标';
});

watch(keyword, () => {
  copyFeedback.value = undefined;
  copyFallback.value = undefined;
});

function clearSearch() {
  keyword.value = '';
  nextTick(() => searchInput.value?.focus());
}

function selectCopyFallback() {
  copyFallbackInput.value?.focus();
  copyFallbackInput.value?.select();
}

async function copy(name: LxIconName) {
  const snippet = `<LxIcon name="${name}" :size="20" />`;
  copyFeedback.value = undefined;
  copyFallback.value = undefined;
  try {
    await navigator.clipboard.writeText(snippet);
    copyFeedback.value = { type: 'success', message: `已复制：${snippet}` };
  } catch {
    copyFeedback.value = { type: 'error', message: '复制失败，手动复制代码已就绪。' };
    copyFallback.value = { name, snippet };
    nextTick(selectCopyFallback);
  }
}
</script>

<div class="icon-catalog">
<div class="icon-searchbar" role="search" aria-label="图标目录筛选">
  <input ref="searchInput" v-model="keyword" class="icon-search" type="text" aria-label="按名称或中文用途筛选图标" placeholder="搜索图标名称或用途" />
  <button v-if="keyword" class="icon-search__clear" type="button" aria-label="清除筛选" title="清除筛选" @click="clearSearch">
    <LxIcon name="close" :size="16" />
  </button>
</div>

<p
  class="icon-copy-feedback"
  :class="{ 'is-empty': !copyFeedback, 'is-error': copyFeedback?.type === 'error' }"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {{ copyFeedback?.message ?? '' }}
</p>

<div
  v-if="copyFallback"
  class="icon-copy-fallback"
>
  <p id="icon-copy-fallback-help">请使用下方已选中的代码进行手动复制：</p>
  <textarea
    ref="copyFallbackInput"
    :aria-label="`LxIcon ${copyFallback.name} 用法代码`"
    aria-describedby="icon-copy-fallback-help"
    readonly
    rows="1"
    :value="copyFallback.snippet"
    @focus="selectCopyFallback"
  />
</div>

<details
  v-for="g in visibleGroups"
  :key="`${g.title}-${keyword.trim()}`"
  class="icon-group"
  :open="Boolean(keyword.trim()) || g.title === 'P0 高频核心·常用操作'"
>
  <summary class="icon-group-title">
    <span>{{ g.title }}（{{ g.names.length }}）</span>
    <LxIcon name="chevron-down" :size="16" aria-hidden="true" />
  </summary>
  <div class="icon-grid">
    <button v-for="n in g.names" :key="n" class="icon-tile" type="button" :aria-label="`复制 ${n}（${ICON_LABELS[n]}）图标用法`" @click="copy(n)">
      <LxIcon :name="n" :size="20" />
      <span class="icon-tile__meaning">{{ ICON_LABELS[n] }}</span>
      <span class="icon-tile__name">{{ n }}</span>
    </button>
  </div>
</details>

<p class="icon-search-status" role="status" aria-live="polite" aria-atomic="true">
  {{ searchStatus }}
</p>
<p v-if="!visibleGroups.length" class="icon-empty" aria-hidden="true">无匹配图标</p>
</div>

## 图标规格与动效

内置 SVG 图标使用 24×24 画布、1.5px 描边和圆角端点；`currentColor` 继承文字颜色，无需单独传色。

动效仅配置在 69 个名称上，其余名称保持静态。悬停或键盘聚焦时采用自然减速曲线；`warning` 与 `email` 使用短促的语义反馈，不使用弹性回弹。系统开启减少动效后停用图标动画。

## 业务组合示例

权限节点列表可以用主体、资源和状态图标一起说明授权关系：

<figure class="icon-business-example" aria-labelledby="icon-business-example-title">
  <figcaption id="icon-business-example-title">权限节点状态组合</figcaption>
  <div class="icon-business-example__flow">
    <span class="icon-business-example__node"><LxIcon name="people" :size="16" aria-hidden="true" />运维组</span>
    <LxIcon name="arrow-right" :size="16" aria-hidden="true" />
    <span class="icon-business-example__node"><LxIcon name="file-check" :size="16" aria-hidden="true" />设备管理</span>
    <span class="icon-business-example__node"><LxIcon name="shield" :size="16" aria-hidden="true" />已授权</span>
  </div>
</figure>

## 使用

```vue
<LxIcon name="shield" :size="20" />
```

默认尺寸为 `18px`，常用对照尺寸为 `16` / `18` / `20px`；设计稿中的 `24px` 是 SVG 画布预览尺寸，不是额外标准档。`size` 可按布局需要自定义。组件库导出由 `LX_ICONS` 键自动推导的 `LxIconName`；静态配置请使用该类型，外部字符串需先通过 `resolveLxIconName` 校验。未知运行时名称会显示问号图标并带有可访问错误名称。

## 设计清单覆盖

三份参考清单逐项对应标准图形或兼容别名；去重后共有 {{ LX_ICON_MOTION_NAMES.length }} 个动效名称。其他可用名称不执行 hover/focus 图标动效；`spin` 可按需驱动旋转状态。

<p class="icon-count-note">P1 清单包含 27 个名称：图标卡片展示 26 个标准图形键，兼容别名 <code>date</code> 单列展示，不重复计入卡片。</p>

<dl class="icon-checklist">
  <div v-for="list in MOTION_CHECKLISTS" :key="list.title" class="icon-checklist__row">
    <dt>{{ list.title }}</dt>
    <dd><span>{{ list.names.length }} 个</span><code>{{ list.names.join('、') }}</code></dd>
  </div>
  <div class="icon-checklist__row">
    <dt>去重合计</dt>
    <dd><span>{{ LX_ICON_MOTION_NAMES.length }} 个</span><span>别名按独立可用名称计数，动效复用标准图形。</span></dd>
  </div>
</dl>

## 新增图标

在 `src/components/LxIcon/icons.ts` 的 `LX_ICONS` 中按组追加图形，键为 kebab-case 名称，值为 24×24 viewBox 的 SVG path 数组。仅当设计或业务契约存在同义旧名称时，才在 `LX_ICON_ALIASES` 中映射到标准图形；`LxIconName` 和本页总览会同时包含标准键与别名。

## 兼容别名

<div
  class="icon-alias-table-region"
  role="region"
  aria-label="兼容别名对应关系"
  aria-describedby="icon-alias-table-hint"
  tabindex="0"
>
  <p id="icon-alias-table-hint" class="icon-alias-table-hint">窄屏可在表格区域横向滚动查看完整说明。</p>
  <table class="icon-alias-table">
    <thead>
      <tr>
        <th scope="col">名称</th>
        <th scope="col">标准图形</th>
        <th scope="col">来源</th>
        <th scope="col">说明</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>date</code></td>
        <td><code>calendar</code></td>
        <td>P1 清单</td>
        <td>保留设计文档名称，复用已有日历图形。</td>
      </tr>
      <tr>
        <td><code>eye-on</code></td>
        <td><code>eye</code></td>
        <td>29 枚清单</td>
        <td>与现有可见状态图形同义，避免新增重复路径。</td>
      </tr>
    </tbody>
  </table>
</div>

业务存量值 `calendar`、`eye` 仍可照常使用；别名不会改变它们的序列化值。

<style>
.icon-catalog {
  box-sizing: border-box;
  width: 100%;
}
.icon-business-example {
  margin: 12px 0 20px;
  padding: 12px 0;
  border-block: 1px solid var(--vp-c-divider);
}
.icon-business-example figcaption {
  margin-bottom: 8px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 600;
}
.icon-business-example__flow,
.icon-business-example__node {
  display: flex;
  align-items: center;
}
.icon-business-example__flow {
  flex-wrap: wrap;
  gap: 8px 12px;
  color: var(--vp-c-text-1);
  font-size: 13px;
}
.icon-business-example__node {
  gap: 6px;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: var(--lx-text-primary);
  cursor: pointer;
  list-style: none;
}
.icon-group-title::-webkit-details-marker {
  display: none;
}
.icon-group-title .lx-icon {
  flex: 0 0 auto;
  transition: transform 0.2s ease-out;
}
.icon-group[open] > .icon-group-title .lx-icon {
  transform: rotate(180deg);
}
.icon-copy-fallback {
  margin: 0 0 16px;
  padding: 12px;
  border: 1px solid var(--lx-color-form-error);
  border-radius: 4px;
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}
.icon-copy-fallback p {
  margin: 0 0 8px;
  color: inherit;
  font-size: 13px;
}
.icon-copy-fallback textarea {
  box-sizing: border-box;
  width: min(100%, 480px);
  min-height: 36px;
  padding: 8px;
  border: 1px solid var(--lx-border);
  border-radius: 2px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
  font: 12px/1.4 var(--lx-font-mono);
  resize: vertical;
  user-select: all;
}
.icon-copy-feedback {
  margin: 0 0 12px;
  padding: 8px 10px;
  border: 1px solid var(--lx-color-primary);
  border-radius: 4px;
  color: var(--lx-color-primary);
  font-size: 13px;
}
.icon-copy-feedback.is-error {
  border-color: var(--lx-color-form-error);
  color: var(--lx-color-form-error);
}
.icon-copy-feedback.is-empty,
.icon-search-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
.icon-checklist {
  margin: 16px 0 24px;
  border-top: 1px solid var(--lx-border);
}
.icon-checklist__row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 8px 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--lx-border);
}
.icon-checklist__row dt {
  color: var(--vp-c-text-1);
  font-weight: 600;
}
.icon-checklist__row dd {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  min-width: 0;
  margin: 0;
  color: var(--lx-text-regular);
  overflow-wrap: anywhere;
}
.icon-checklist__row code {
  min-width: 0;
  overflow-wrap: anywhere;
}
.icon-alias-table-region {
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}
.icon-alias-table-region:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
.icon-alias-table-hint {
  display: none;
}
.icon-alias-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}
.icon-alias-table th,
.icon-alias-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--vp-c-divider);
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
}
.icon-alias-table th {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-weight: 600;
}
.icon-alias-table td {
  color: var(--vp-c-text-1);
}
.icon-alias-table tbody tr:last-child td {
  border-bottom: 0;
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
  .icon-search__clear {
    flex-basis: 44px;
    width: 44px;
    height: 44px;
  }
  .icon-checklist__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
  }
  .icon-alias-table-hint {
    display: block;
    margin: 0;
    padding: 8px 10px;
    color: var(--vp-c-text-2);
    font-size: 12px;
  }
  .icon-alias-table {
    min-width: 520px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .icon-tile,
  .icon-group-title .lx-icon {
    transition: none;
  }
}
</style>
