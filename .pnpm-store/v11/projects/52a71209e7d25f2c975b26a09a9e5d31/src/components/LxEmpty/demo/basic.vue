<script setup lang="ts">
import { ref, watch } from 'vue'
import LxIcon from '../../LxIcon/index.vue'
import LxEmpty from '../index.vue'

const darkTheme = ref(false)
const createdMappings = ref<string[]>([])
const createFeedback = ref('')
const filterCleared = ref(false)
const matchingRecords = ['人员组织映射', '预警等级映射']
const createButton = ref<HTMLButtonElement | null>(null)
const createdMappingsList = ref<HTMLUListElement | null>(null)
const clearFilterButton = ref<HTMLButtonElement | null>(null)
const resultsList = ref<HTMLUListElement | null>(null)

function createMapping() {
  const name = `新建映射 ${createdMappings.value.length + 1}`
  createdMappings.value = [...createdMappings.value, name]
  createFeedback.value = `已创建映射：${name}`
}

function resetCreatedMappings() {
  createdMappings.value = []
  createFeedback.value = ''
}

watch(
  () => createdMappings.value.length,
  (count) => {
    if (count === 1) {
      createdMappingsList.value?.focus()
    } else if (count === 0) {
      createButton.value?.focus()
    }
  },
  { flush: 'post' },
)

watch(
  filterCleared,
  (cleared) => {
    if (cleared) {
      resultsList.value?.focus()
    } else {
      clearFilterButton.value?.focus()
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <section
    class="empty-demo"
    :class="{ 'lx-theme-hud': darkTheme }"
    aria-label="空态示例"
  >
    <label class="empty-demo__theme">
      <input v-model="darkTheme" type="checkbox" />
      HUD 深色主题
    </label>

    <div class="empty-demo__examples">
      <section class="empty-demo__example" data-testid="default-example">
        <h2>默认空态</h2>
        <LxEmpty v-if="createdMappings.length === 0" description="暂无映射配置">
          <template #footer>
            <button
              ref="createButton"
              class="empty-demo__action"
              type="button"
              @click="createMapping"
            >
              新建映射
            </button>
          </template>
        </LxEmpty>
        <div v-else class="empty-demo__created-results">
          <ul
            ref="createdMappingsList"
            class="empty-demo__result-list"
            data-testid="created-mappings"
            aria-label="已创建的映射配置"
            tabindex="-1"
          >
            <li v-for="mapping in createdMappings" :key="mapping">
              {{ mapping }}
            </li>
          </ul>
          <div class="empty-demo__actions">
            <button
              class="empty-demo__action"
              type="button"
              @click="createMapping"
            >
              再新建映射
            </button>
            <button
              class="empty-demo__action empty-demo__action--secondary"
              type="button"
              @click="resetCreatedMappings"
            >
              恢复空态
            </button>
          </div>
        </div>
      </section>

      <section class="empty-demo__example" data-testid="image-size-example">
        <h2>兼容自定义图标尺寸</h2>
        <LxEmpty description="暂无可用配置" :image-size="80" />
      </section>

      <section class="empty-demo__example" data-testid="compact-example">
        <h2>紧凑空态与自定义图标</h2>
        <LxEmpty size="compact" description="暂无关联映射配置">
          <LxIcon class="empty-demo__custom-icon" name="search" :size="40" />
        </LxEmpty>
      </section>

      <section
        class="empty-demo__example"
        data-testid="long-description-example"
      >
        <h2>长描述换行</h2>
        <LxEmpty
          v-if="!filterCleared"
          description="最近 30 天内没有找到匹配当前筛选条件的记录。清除筛选后可查看全部映射配置。"
          data-testid="filtered-empty"
        >
          <template #footer>
            <button
              ref="clearFilterButton"
              class="empty-demo__action"
              type="button"
              @click="filterCleared = true"
            >
              清除筛选
            </button>
          </template>
        </LxEmpty>
        <div v-else class="empty-demo__created-results">
          <ul
            ref="resultsList"
            class="empty-demo__result-list"
            data-testid="filtered-results"
            aria-label="筛选恢复后的映射配置"
            tabindex="-1"
          >
            <li v-for="record in matchingRecords" :key="record">
              {{ record }}
            </li>
          </ul>
          <button
            class="empty-demo__action empty-demo__action--secondary"
            type="button"
            @click="filterCleared = false"
          >
            重新应用筛选
          </button>
        </div>
      </section>
    </div>

    <p
      v-if="createFeedback"
      class="empty-demo__feedback"
      role="status"
      aria-live="polite"
      data-testid="create-feedback"
    >
      {{ createFeedback }}
    </p>
  </section>
</template>

<style scoped>
.empty-demo {
  display: grid;
  gap: var(--lx-space-md);
  padding: var(--lx-space-md);
  background: var(--lx-bg-page);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.empty-demo__theme {
  display: inline-flex;
  width: fit-content;
  min-height: 44px;
  align-items: center;
  gap: var(--lx-space-sm);
}

.empty-demo__theme input {
  accent-color: var(--lx-color-primary);
}

.empty-demo__examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: var(--lx-space-md);
}

.empty-demo__example {
  min-width: 0;
  border-top: 1px solid var(--lx-border);
  padding-top: var(--lx-space-sm);
}

.empty-demo__example h2 {
  margin: 0;
  color: var(--lx-text-regular);
  font-size: 14px;
  font-weight: 600;
}

.empty-demo__action {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  border-radius: var(--lx-radius-sm);
  padding: 0 var(--lx-space-md);
  background: var(--lx-color-primary);
  color: var(--lx-color-on-primary);
  cursor: pointer;
  font: inherit;
}

.empty-demo__action--secondary {
  border: 1px solid var(--lx-color-primary);
  background: transparent;
  color: var(--lx-color-primary);
}

.empty-demo__action:hover {
  background: var(--lx-color-primary-hover);
}

.empty-demo__action--secondary:hover {
  background: var(--lx-color-primary-light);
}

.empty-demo__created-results,
.empty-demo__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
}

.empty-demo__created-results {
  flex-direction: column;
  align-items: flex-start;
}

.empty-demo__actions {
  max-width: 100%;
}

.empty-demo__action:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.empty-demo__feedback {
  min-height: 20px;
  margin: 0;
  color: var(--lx-text-regular);
}

.empty-demo__result-list {
  display: grid;
  gap: var(--lx-space-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.empty-demo__result-list li {
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  padding: var(--lx-space-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}

:deep(.empty-demo__custom-icon) {
  color: var(--lx-color-primary);
}

@media (max-width: 480px) {
  .empty-demo {
    padding: var(--lx-space-sm);
  }
}
</style>
