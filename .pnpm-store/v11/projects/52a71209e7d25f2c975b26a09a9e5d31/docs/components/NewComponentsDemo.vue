<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  LxAuthImg,
  LxBreadcrumb,
  LxCodeSlot,
  LxDescriptions,
  LxDutyCalendar,
  LxIcon,
  LxMetricCard,
  LxNavbar,
  LxPageCard,
  LxPasswordInput,
  LxSearchBar,
  LxSectionTitle,
  LxSelectPagination,
  LxSplitLayout,
  LxStatusSwitch,
  LxTabsBar,
  LxTransferPanel,
  LxUpload,
  LxVirtualTree,
  type LxDescriptionItem,
  type LxDutyShift,
  type LxSearchBarProps,
  type LxSelectPaginationApi,
  type LxSelectPaginationItem,
  type LxUploadFile,
  type LxVirtualTreeNode,
} from '../../src';
import CascaderDemo from '../../src/components/LxCascader/demo/basic.vue';

const lastAction = ref('等待操作');
const query = ref<Record<string, unknown>>({ keyword: '', status: 'online', date: '' });
const searchFields: NonNullable<LxSearchBarProps['fields']> = [
  { key: 'keyword', label: '关键字', type: 'input', placeholder: '名称或编号' },
  {
    key: 'status',
    label: '运行状态',
    type: 'select',
    options: [
      { label: '在线', value: 'online' },
      { label: '繁忙', value: 'busy' },
      { label: '离线', value: 'offline' },
    ],
  },
  { key: 'date', label: '登记日期', type: 'date' },
];

const statusValue = ref<number>(0);
const passwordValue = ref('LinkX-2026');
const uploadFiles = ref<LxUploadFile[]>([]);
const selectedCandidate = ref<(string | number)[]>(['user-02']);
const selectedTreeKeys = ref<(string | number)[]>(['node-01-01']);
const selectedTransferKeys = ref<(string | number)[]>(['node-01-02']);
const splitCollapsed = ref(false);
const splitWidth = ref(240);
const activeTab = ref('roster');
const tabs = ref([
  { key: 'roster', title: '资源名册', closable: false },
  { key: 'schedule', title: '勤务排班', closable: true },
  { key: 'audit', title: '操作审计', closable: true },
]);

const candidates = Array.from({ length: 48 }, (_, index) => ({
  id: `user-${String(index + 1).padStart(2, '0')}`,
  name: `协同警员 ${String(index + 1).padStart(2, '0')}`,
  department: index % 2 ? '指挥中心' : '辖区勤务组',
}));

const loadCandidates: LxSelectPaginationApi = async ({ page, pageSize, keyword }) => {
  const normalizedKeyword = String(keyword).trim().toLocaleLowerCase();
  const matched = normalizedKeyword
    ? candidates.filter((item) => `${item.name} ${item.department}`.toLocaleLowerCase().includes(normalizedKeyword))
    : candidates;
  return {
    records: matched.slice((page - 1) * pageSize, page * pageSize),
    total: matched.length,
  };
};

const treeData: LxVirtualTreeNode[] = Array.from({ length: 12 }, (_, groupIndex) => ({
  id: `node-${String(groupIndex + 1).padStart(2, '0')}`,
  label: `辖区单位 ${String(groupIndex + 1).padStart(2, '0')}`,
  children: Array.from({ length: 10 }, (_, itemIndex) => ({
    id: `node-${String(groupIndex + 1).padStart(2, '0')}-${String(itemIndex + 1).padStart(2, '0')}`,
    label: `执勤单元 ${String(itemIndex + 1).padStart(2, '0')}`,
    disabled: groupIndex === 2 && itemIndex === 8,
  })),
}));

const shifts: LxDutyShift[] = [
  { date: '2026-09-04', label: '早班', status: 'online', count: 18 },
  { date: '2026-09-04', label: '夜班', status: 'busy', count: 11 },
  { date: '2026-09-10', label: '值守', status: 'processing', count: 8 },
  { date: '2026-09-18', label: '应急班', status: 'error', count: 5 },
  { date: '2026-09-24', label: '早班', status: 'online', count: 16 },
];

const descriptionItems = computed<LxDescriptionItem[]>(() => [
  { key: 'status', label: '启用状态', value: statusValue.value === 0 ? '开启（0）' : '关闭（1）', labelWidth: 88 },
  { key: 'selection', label: '已选人员', value: `${selectedCandidate.value.length} 人`, labelWidth: 88 },
  { key: 'action', label: '最近操作', value: lastAction.value, span: 2, labelWidth: 88 },
]);

async function loadAvatar(_src: string, signal?: AbortSignal): Promise<Blob> {
  if (signal?.aborted) throw new DOMException('已取消', 'AbortError');
  return new Blob(
    [
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#ecf5ff"/><circle cx="48" cy="34" r="16" fill="#0060a9"/><path d="M18 88c4-20 17-30 30-30s26 10 30 30" fill="#409eff"/><text x="48" y="84" text-anchor="middle" font-family="sans-serif" font-size="13" fill="white">LX</text></svg>',
    ],
    { type: 'image/svg+xml' },
  );
}

function closeTab(key: string) {
  tabs.value = tabs.value.filter((tab) => tab.key !== key);
  if (activeTab.value === key) activeTab.value = tabs.value[0]?.key ?? '';
  lastAction.value = `关闭页签：${key}`;
}

function performSearch() {
  lastAction.value = `查询：${String(query.value.keyword || '全部')} / ${String(query.value.status || '不限')}`;
}

function onCandidateChange(_value: string | number | (string | number)[] | undefined, items: LxSelectPaginationItem[]) {
  // change 第一个参数是选中值，第二个参数才是选项对象列表；人数必须由第二个参数计算。
  lastAction.value = `已选择 ${items.length} 名人员`;
}

function onTreeCheckChange(keys: (string | number)[], _nodes: LxVirtualTreeNode[]) {
  // check-change 的第一个参数是选中键数组，不能当成事件参数元组再取下标。
  lastAction.value = `树节点已选 ${keys.length} 项`;
}

function onPermissionChange(keys: (string | number)[], _nodes: LxVirtualTreeNode[]) {
  // 穿梭面板 change 同样先返回选中键数组，再返回对应节点列表。
  lastAction.value = `权限已选 ${keys.length} 项`;
}
</script>

<template>
  <div class="new-components-demo">
    <p class="new-components-demo__status" aria-live="polite">{{ lastAction }}</p>

    <div class="new-components-demo__section-title-examples" aria-label="区块标题变体">
      <LxSectionTitle variant="border" title="警员在岗档案">
        <template #extra><el-tag size="small">8 项字段</el-tag></template>
      </LxSectionTitle>
      <LxSectionTitle variant="dashed" title="南向接口服务配置" icon="link">
        <template #extra>
          <el-button text @click="lastAction = '刷新接口配置'">
            <LxIcon name="refresh" :size="16" />刷新
          </el-button>
        </template>
      </LxSectionTitle>
      <LxSectionTitle variant="plain" title="预警推送策略" subtitle="用于配置警情处置流程与责任人分派机制。">
        <template #extra><el-button link @click="lastAction = '打开推送策略配置'">配置通道</el-button></template>
      </LxSectionTitle>
    </div>

    <section class="new-components-demo__section">
      <LxSectionTitle title="布局与导航">
        <template #extra><span class="new-components-demo__caption">受控页签、面包屑和可缩放分栏</span></template>
      </LxSectionTitle>
      <div class="new-components-demo__shell">
        <LxNavbar
          search-placeholder="搜索资源"
          network-label="协同专网在线"
          :notification-count="3"
          :user="{ name: '李警官', role: '系统管理员' }"
          @search="lastAction = `全局搜索：${$event || '空条件'}`"
          @notification-click="lastAction = '查看通知'"
          @user-command="lastAction = `用户操作：${$event}`"
        >
          <template #breadcrumb>
            <LxBreadcrumb :items="[{ title: '首页', to: '#' }, { title: '警务资源管理' }, { title: '资源名册' }]" @select="lastAction = `面包屑：${$event.title}`" />
          </template>
        </LxNavbar>
        <LxTabsBar v-model="activeTab" :tabs="tabs" @close="closeTab" @context-menu="lastAction = `页签菜单：${$event.key}`" />
        <LxSplitLayout
          :aside-width="splitWidth"
          :collapsed="splitCollapsed"
          resizable
          @resize="splitWidth = $event"
          @update:collapsed="splitCollapsed = $event"
        >
          <template #aside>
            <div class="new-components-demo__aside">
              <strong>组织范围</strong>
              <button type="button" @click="lastAction = '选择指挥中心'">指挥中心</button>
              <button type="button" @click="lastAction = '选择辖区勤务组'">辖区勤务组</button>
            </div>
          </template>
          <LxPageCard title="资源名册" subtitle="标准页面内容容器" :body-padding="true">
            <p class="new-components-demo__body-copy">左栏可用拖动手柄或左右方向键调整宽度；收起后仍保留展开按钮。</p>
          </LxPageCard>
        </LxSplitLayout>
      </div>
    </section>

    <section class="new-components-demo__section">
      <LxSectionTitle title="检索与表单控件">
        <template #extra><span class="new-components-demo__caption">查询、状态切换、远程选择和上传</span></template>
      </LxSectionTitle>
      <LxPageCard :body-padding="false">
        <LxSearchBar v-model="query" :fields="searchFields" @search="performSearch" @reset="lastAction = '已重置检索条件'">
          <template #actions><button class="new-components-demo__text-button" type="button" @click="lastAction = '导出当前结果'">导出</button></template>
        </LxSearchBar>
      </LxPageCard>
      <div class="new-components-demo__control-grid">
        <label class="new-components-demo__field">
          <span>状态开关（0 = 开启）</span>
          <LxStatusSwitch v-model="statusValue" confirm="关闭后将停止资源服务。" @change="lastAction = `状态切换为：${$event}`" />
        </label>
        <label class="new-components-demo__field">
          <span>远程分页选择</span>
          <LxSelectPagination
            v-model="selectedCandidate"
            :api="loadCandidates"
            multiple
            :max="3"
            value-key="id"
            label-key="name"
            description-key="department"
            @change="onCandidateChange"
          />
        </label>
        <label class="new-components-demo__field">
          <span>密码输入保护</span>
          <LxPasswordInput v-model="passwordValue" />
        </label>
        <div class="new-components-demo__field">
          <span>文件上传（手动提交模式）</span>
          <LxUpload v-model="uploadFiles" accept=".xlsx,.csv" :max-size="10" :auto-upload="false" />
        </div>
      </div>
    </section>

    <section class="new-components-demo__section">
      <LxSectionTitle title="级联选择">
        <template #extra><span class="new-components-demo__caption">单选/多选、加载、失败重试与禁用状态</span></template>
      </LxSectionTitle>
      <CascaderDemo />
    </section>

    <section class="new-components-demo__section">
      <LxSectionTitle title="数据展示">
        <template #extra><span class="new-components-demo__caption">指标、描述行、代码槽和排班日历</span></template>
      </LxSectionTitle>
      <div class="new-components-demo__metrics">
        <LxMetricCard label="在线资源" :value="1428" unit="个" badge="在岗率 94.6%" :progress="94.6" footer-label="较昨日" footer-value="+8.4%" />
        <LxMetricCard label="待处理告警" :value="23" unit="条" badge="需关注" badge-status="busy" trend="较上一时段增加" trend-status="busy" :progress="31" />
      </div>
      <div class="new-components-demo__display-grid">
        <LxPageCard title="资源摘要">
          <LxDescriptions :items="descriptionItems" :columns="2" bordered />
          <div class="new-components-demo__code-row">案件编号：<LxCodeSlot @copy="lastAction = `已复制编号：${$event}`">AJ-202609-0008</LxCodeSlot></div>
        </LxPageCard>
        <LxDutyCalendar month="2026-09" :shifts="shifts" @cell-click="lastAction = `选择日期：${$event}`" @shift-click="lastAction = `选择班次：${$event.label}`" />
      </div>
    </section>

    <section class="new-components-demo__section">
      <LxSectionTitle title="树与权限分配">
        <template #extra><span class="new-components-demo__caption">窗口化大树与双栏穿梭</span></template>
      </LxSectionTitle>
      <div class="new-components-demo__tree-grid">
        <LxPageCard title="虚拟组织树">
          <LxVirtualTree
            v-model="selectedTreeKeys"
            :data="treeData"
            :height="280"
            show-checkbox
            @check-change="onTreeCheckChange"
            @node-click="lastAction = `查看节点：${$event.label}`"
          />
        </LxPageCard>
        <LxTransferPanel v-model="selectedTransferKeys" :tree-data="treeData" :max-count="4" @change="onPermissionChange" />
      </div>
    </section>

    <section class="new-components-demo__section">
      <LxSectionTitle title="鉴权图片">
        <template #extra><span class="new-components-demo__caption">请求函数由业务侧注入</span></template>
      </LxSectionTitle>
      <div class="new-components-demo__image-row">
        <LxAuthImg src="protected://avatar/lx" :request="loadAvatar" alt="LinkX 鉴权头像" :width="72" :height="72" @load="lastAction = '鉴权图片加载完成'" @error="lastAction = '鉴权图片加载失败'" />
        <span>组件不持有 token；请求函数可接收并使用 `AbortSignal`。</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.new-components-demo {
  display: grid;
  gap: var(--lx-space-xl);
}

.new-components-demo__status {
  margin: 0;
  padding: var(--lx-space-sm) var(--lx-space-md);
  border-inline-start: 3px solid var(--lx-color-primary);
  background: var(--lx-color-primary-light);
  color: var(--lx-text-regular);
  font-size: 13px;
  line-height: 20px;
}

.new-components-demo__section {
  display: grid;
  gap: var(--lx-space-md);
}

.new-components-demo__caption {
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.new-components-demo__shell {
  overflow: hidden;
  border: 1px solid var(--lx-border);
  background: var(--lx-bg-page);
}

.new-components-demo__shell :deep(.lx-split-layout) {
  padding: var(--lx-space-lg);
}

.new-components-demo__aside {
  display: grid;
  gap: var(--lx-space-xs);
  padding: var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.new-components-demo__aside button,
.new-components-demo__text-button {
  justify-self: start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--lx-color-primary);
  cursor: pointer;
  font: inherit;
}

.new-components-demo__aside button:hover,
.new-components-demo__text-button:hover {
  text-decoration: underline;
}

.new-components-demo__aside button:focus-visible,
.new-components-demo__text-button:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.new-components-demo__body-copy {
  margin: 0;
  color: var(--lx-text-regular);
  font-size: 13px;
  line-height: 20px;
}

.new-components-demo__control-grid,
.new-components-demo__display-grid,
.new-components-demo__tree-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--lx-space-lg);
}

.new-components-demo__control-grid {
  align-items: start;
}

.new-components-demo__field {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-sm);
  color: var(--lx-text-regular);
  font-size: 13px;
  line-height: 20px;
}

.new-components-demo__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--lx-space-lg);
}

.new-components-demo__code-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
  margin-top: var(--lx-space-lg);
  color: var(--lx-text-secondary);
  font-size: 13px;
}

.new-components-demo__image-row {
  display: flex;
  align-items: center;
  gap: var(--lx-space-md);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.new-components-demo__section-title-examples {
  display: grid;
  gap: var(--lx-space-md);
  padding: var(--lx-space-lg);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
}

@media (max-width: 767px) {
  .new-components-demo__control-grid,
  .new-components-demo__display-grid,
  .new-components-demo__tree-grid,
  .new-components-demo__metrics {
    grid-template-columns: 1fr;
  }

  .new-components-demo__caption {
    display: none;
  }
}
</style>
