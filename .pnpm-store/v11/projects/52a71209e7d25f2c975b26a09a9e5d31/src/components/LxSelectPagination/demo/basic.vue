<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LxSelectPagination from '../index.vue'
import type {
  LxSelectPaginationItem,
  LxSelectPaginationRemoteMethod,
  LxSelectPaginationValue,
} from '../types'

type DemoMode = 'normal' | 'failure'

const officers = Array.from({ length: 12 }, (_, index) => ({
  policeCode: `POL-${String(index + 1).padStart(5, '0')}`,
  name: ['孙志国', '李建华', '陈明远', '王雪', '赵立东', '周敏'][index % 6],
  department: index % 2 ? '便衣支队' : '指挥中心',
}))

const selectedIds = ref<LxSelectPaginationValue>([
  'POL-00001',
  'POL-00002',
  'POL-00003',
])
const selectRef = ref<{ reload: () => void } | null>(null)
const targetMap = Object.fromEntries(
  officers.slice(0, 3).map((officer) => [officer.policeCode, officer]),
)
const requestParams = { status: 'active', regionId: 'region-01' }
const formatOfficerLabel = (item: LxSelectPaginationItem) =>
  `${item.name} (${item.policeCode})`
const disabled = ref(false)
const emptyResults = ref(false)
const nextMode = ref<DemoMode>('normal')
const requestCount = ref(0)
const cancelledCount = ref(0)
const lastChange = ref('尚未修改已选人员')
const themeEnabled = ref(false)
const originalDark = ref(false)

const selectedSummary = computed(() => {
  const values = Array.isArray(selectedIds.value)
    ? selectedIds.value
    : selectedIds.value === undefined
      ? []
      : [selectedIds.value]
  return values.map(String).join('、') || '未选择'
})

const remoteMethod: LxSelectPaginationRemoteMethod = (
  keyword,
  page,
  options,
) => {
  requestCount.value += 1
  const pageSize = options?.pageSize ?? 4
  const signal = options?.signal
  const shouldFail = nextMode.value === 'failure'
  nextMode.value = 'normal'

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      if (shouldFail) {
        reject(new Error('Mock 远程服务暂不可用'))
        return
      }
      if (emptyResults.value) {
        resolve({ list: [], total: 0, hasMore: false })
        return
      }

      const normalized = keyword.trim().toLocaleLowerCase()
      const matched = normalized
        ? officers.filter((officer) =>
            `${officer.name} ${officer.department} ${officer.policeCode}`
              .toLocaleLowerCase()
              .includes(normalized),
          )
        : officers
      const start = (page - 1) * pageSize
      resolve({
        list: matched.slice(start, start + pageSize),
        total: matched.length,
        hasMore: start + pageSize < matched.length,
      })
    }, 180)

    function onAbort() {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      cancelledCount.value += 1
      reject(new DOMException('请求已取消', 'AbortError'))
    }

    if (signal?.aborted) onAbort()
    else signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function onChange(
  value: LxSelectPaginationValue,
  selected: LxSelectPaginationItem[],
) {
  lastChange.value = `${Array.isArray(value) ? value.length : value === undefined ? 0 : 1} 项；${selected.map((item) => String(item.name ?? item.policeCode ?? '')).join('、')}`
}

function toggleEmptyResults() {
  emptyResults.value = !emptyResults.value
  selectRef.value?.reload()
}

onMounted(() => {
  originalDark.value = document.documentElement.classList.contains('dark')
})

watch(themeEnabled, (enabled) => {
  if (typeof document !== 'undefined')
    document.documentElement.classList.toggle('dark', enabled)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined')
    document.documentElement.classList.toggle('dark', originalDark.value)
})
</script>

<template>
  <section
    class="lx-select-pagination-demo"
    aria-labelledby="lx-select-pagination-demo-title"
  >
    <div class="lx-select-pagination-demo__heading">
      <div>
        <h2 id="lx-select-pagination-demo-title">远程人员选择</h2>
        <p data-testid="selected-summary">当前多选值：{{ selectedSummary }}</p>
      </div>
      <label class="lx-select-pagination-demo__theme">
        <input v-model="themeEnabled" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <label class="lx-select-pagination-demo__field">
      <span>指派涉案警员</span>
      <LxSelectPagination
        ref="selectRef"
        v-model="selectedIds"
        :remote-method="remoteMethod"
        :target-map="targetMap"
        :params="requestParams"
        value-key="policeCode"
        :label-key="formatOfficerLabel"
        description-key="department"
        search-placeholder="输入姓名、警号或部门检索"
        placeholder="选择涉案警员"
        multiple
        :max="8"
        :max-collapse-tags="2"
        :page-size="4"
        :debounce="300"
        :disabled="disabled"
        @change="onChange"
      />
    </label>

    <div class="lx-select-pagination-demo__actions" aria-label="演示状态">
      <button type="button" @click="nextMode = 'failure'">下次请求失败</button>
      <button type="button" @click="toggleEmptyResults">
        {{ emptyResults ? '恢复成功结果' : '显示空结果' }}
      </button>
      <button
        type="button"
        :aria-pressed="disabled"
        @click="disabled = !disabled"
      >
        {{ disabled ? '启用选择器' : '禁用选择器' }}
      </button>
      <button type="button" @click="selectedIds = []">清空选择</button>
    </div>

    <dl class="lx-select-pagination-demo__stats" aria-live="polite">
      <div>
        <dt>Mock 请求</dt>
        <dd>{{ requestCount }}</dd>
      </div>
      <div>
        <dt>已取消</dt>
        <dd>{{ cancelledCount }}</dd>
      </div>
      <div>
        <dt>最近变更</dt>
        <dd>{{ lastChange }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.lx-select-pagination-demo {
  display: grid;
  max-width: 720px;
  gap: 20px;
  padding: 20px;
  border: 1px solid var(--lx-border-light);
  background: var(--lx-bg-white);
  color: var(--lx-text-primary);
}

.lx-select-pagination-demo__heading,
.lx-select-pagination-demo__actions,
.lx-select-pagination-demo__theme {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.lx-select-pagination-demo__heading h2 {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
}

.lx-select-pagination-demo__heading p {
  margin: 4px 0 0;
  color: var(--lx-text-secondary);
  font-size: 13px;
}

.lx-select-pagination-demo__theme,
.lx-select-pagination-demo__field {
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-select-pagination-demo__field {
  display: grid;
  max-width: 420px;
  gap: 8px;
}

.lx-select-pagination-demo__theme input {
  accent-color: var(--lx-color-primary);
}

.lx-select-pagination-demo__actions {
  flex-wrap: wrap;
  justify-content: flex-start;
}

.lx-select-pagination-demo__actions button {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--lx-border-light);
  background: var(--lx-bg-white);
  color: var(--lx-text-primary);
  cursor: pointer;
  font: inherit;
}

.lx-select-pagination-demo__actions button:focus-visible,
.lx-select-pagination-demo__theme input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-select-pagination-demo__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.lx-select-pagination-demo__stats div {
  min-width: 0;
}

.lx-select-pagination-demo__stats dt {
  margin-bottom: 4px;
}

.lx-select-pagination-demo__stats dd {
  overflow-wrap: anywhere;
  margin: 0;
  color: var(--lx-text-primary);
}

@media (max-width: 540px) {
  .lx-select-pagination-demo {
    padding: 16px;
  }

  .lx-select-pagination-demo__heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .lx-select-pagination-demo__stats {
    grid-template-columns: 1fr;
  }
}
</style>
