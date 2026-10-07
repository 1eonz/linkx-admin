<script setup lang="ts">
/** 远程检索由宿主注入；跨页已选项的显示元数据独立于当前结果页缓存。 */
import { useFormDisabled } from 'element-plus'
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'

import type {
  LxSelectPaginationItem,
  LxSelectPaginationProps,
  LxSelectPaginationRequestParams,
  LxSelectPaginationResult,
  LxSelectPaginationValue,
} from './types'
import LxIcon from '../LxIcon/index.vue'
import LxInput from '../LxInput/index.vue'
import { lxMessage } from '../LxMessage'
import LxSelect from '../LxSelect/index.vue'
import type { LxSelectOption } from '../LxSelect/types'

defineOptions({ name: 'LxSelectPagination' })

const props = withDefaults(defineProps<LxSelectPaginationProps>(), {
  modelValue: undefined,
  api: undefined,
  remoteMethod: undefined,
  params: () => ({}),
  multiple: false,
  placeholder: '请选择',
  searchPlaceholder: '输入姓名、警号或名称检索...',
  pageSize: 20,
  valueKey: 'id',
  labelKey: 'name',
  descriptionKey: '',
  targetMap: () => ({}),
  valueMap: () => ({}),
  debounce: 300,
  maxCollapseTags: 2,
  // 保留 undefined，使 Element Plus 表单禁用态可以沿 useFormDisabled 继承。
  disabled: undefined,
  clearable: true,
  max: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: LxSelectPaginationValue]
  change: [value: LxSelectPaginationValue, items: LxSelectPaginationItem[]]
  load: [items: LxSelectPaginationItem[], total: number]
}>()

const selectRef = ref<InstanceType<typeof LxSelect>>()
const isDisabled = useFormDisabled(computed(() => props.disabled))
const instanceId = getCurrentInstance()?.uid ?? 'standalone'
const items = ref<LxSelectPaginationItem[]>([])
const selectedMeta = ref<Record<string, LxSelectPaginationItem>>({})
const keyword = ref('')
const page = ref(1)
const total = ref(0)
const pageHasMore = ref<boolean>()
const failedPage = ref<number>()
const loading = ref(false)
const visible = ref(false)
const loadError = ref(false)
const popperClass = `lx-select-pagination-popper-${instanceId}`
let queryTimer: ReturnType<typeof setTimeout> | undefined
let requestId = 0
let requestController: AbortController | undefined
let activeRequest: { page: number; reset: boolean } | undefined
let scrollTarget: HTMLElement | undefined

const selectedValues = computed<(string | number)[]>(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue
  return props.modelValue === undefined ||
    props.modelValue === null ||
    props.modelValue === ''
    ? []
    : [props.modelValue]
})

function itemValue(item: LxSelectPaginationItem): string | number | undefined {
  const value = item[props.valueKey]
  return typeof value === 'string' || typeof value === 'number'
    ? value
    : undefined
}

function normalizeMappedItem(
  key: string,
  item: LxSelectPaginationItem,
): LxSelectPaginationItem {
  return itemValue(item) === undefined
    ? { ...item, [props.valueKey]: key }
    : item
}

function externalItem(key: string): LxSelectPaginationItem | undefined {
  const target = props.targetMap[key]
  if (target) return normalizeMappedItem(key, target)

  const mapped = props.valueMap[key]
  if (!mapped) return undefined
  if (mapped.item) return normalizeMappedItem(key, mapped.item)

  const item: LxSelectPaginationItem = { [props.valueKey]: key }
  if (typeof props.labelKey === 'string') item[props.labelKey] = mapped.label
  else item.label = mapped.label
  if (props.descriptionKey) item[props.descriptionKey] = mapped.description
  else if (mapped.description) item.description = mapped.description
  return item
}

function itemLabel(item: LxSelectPaginationItem): string {
  const value =
    typeof props.labelKey === 'function'
      ? props.labelKey(item)
      : item[props.labelKey]
  const fallback = item.label ?? item.name ?? item[props.valueKey]
  return String(value ?? fallback ?? '')
}

function itemDescription(item: LxSelectPaginationItem): string {
  const value = props.descriptionKey
    ? item[props.descriptionKey]
    : item.description
  return value === undefined || value === null ? '' : String(value)
}

const selectedOptions = computed<LxSelectPaginationItem[]>(() =>
  selectedValues.value.map((value) => {
    const key = String(value)
    return (
      selectedMeta.value[key] ??
      items.value.find((item) => String(itemValue(item)) === key) ??
      externalItem(key) ?? { [props.valueKey]: value, label: String(value) }
    )
  }),
)

const options = computed(() => {
  const seen = new Set<string>()
  return [...selectedOptions.value, ...items.value].filter((item) => {
    const value = itemValue(item)
    if (value === undefined) return false
    const key = String(value)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const selectOptions = computed<LxSelectOption[]>(() =>
  options.value.flatMap((item) => {
    const value = itemValue(item)
    if (value === undefined) return []
    return [
      {
        label: itemLabel(item),
        value,
        description: itemDescription(item),
      },
    ]
  }),
)

const hasMore = computed(
  () => pageHasMore.value ?? total.value > items.value.length,
)

function resultData(result: LxSelectPaginationResult) {
  const source = result.data ?? result
  const records = source.records ?? source.list ?? []
  const parsedTotal = Number(source.total ?? 0)
  return {
    records,
    total: Number.isFinite(parsedTotal) && parsedTotal >= 0 ? parsedTotal : 0,
    hasMore: source.hasMore,
  }
}

function rememberSelected(loaded: LxSelectPaginationItem[]) {
  const selected = new Set(selectedValues.value.map(String))
  for (const item of loaded) {
    const value = itemValue(item)
    if (value !== undefined && selected.has(String(value)))
      selectedMeta.value[String(value)] = item
  }
}

function syncSelectedMeta(value: LxSelectPaginationValue) {
  const values = Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ''
      ? []
      : [value]
  const selected = new Set(values.map(String))

  for (const key of Object.keys(selectedMeta.value)) {
    if (!selected.has(key)) delete selectedMeta.value[key]
  }
  for (const entry of values) {
    const key = String(entry)
    const mapped = externalItem(key)
    const loaded = items.value.find((item) => String(itemValue(item)) === key)
    if (mapped) selectedMeta.value[key] = mapped
    else if (loaded) selectedMeta.value[key] = loaded
  }
}

watch(() => props.modelValue, syncSelectedMeta, { immediate: true, deep: true })
watch(
  () => [props.targetMap, props.valueMap] as const,
  () => syncSelectedMeta(props.modelValue),
  { immediate: true, deep: true },
)

function resultTotal(
  data: ReturnType<typeof resultData>,
  nextItems: LxSelectPaginationItem[],
) {
  if (data.total > 0 || data.records.length === 0) return data.total
  return data.records.length < props.pageSize
    ? nextItems.length
    : nextItems.length + 1
}

function abortRequest() {
  requestController?.abort()
  requestController = undefined
}

function invalidateRequest(rollbackPage = false) {
  ++requestId
  if (rollbackPage && activeRequest && !activeRequest.reset) {
    page.value = Math.max(1, activeRequest.page - 1)
  }
  activeRequest = undefined
  abortRequest()
  loading.value = false
}

function load(reset = false) {
  if (isDisabled.value || (!props.api && !props.remoteMethod)) return

  if (reset) {
    if (queryTimer) clearTimeout(queryTimer)
    queryTimer = undefined
    invalidateRequest()
    page.value = 1
    items.value = []
    total.value = 0
    pageHasMore.value = undefined
    failedPage.value = undefined
  } else if (activeRequest) {
    return
  }

  const id = ++requestId
  const requestedPage = page.value
  const requestedKeyword = keyword.value
  const requestParamsSnapshot = { ...props.params }
  const requestedPageSize = props.pageSize
  const requestApi = props.api
  const requestRemoteMethod = props.remoteMethod
  const controller = new AbortController()
  requestController = controller
  activeRequest = { page: requestedPage, reset }
  loading.value = true
  loadError.value = false

  const requestParams: LxSelectPaginationRequestParams = {
    ...requestParamsSnapshot,
    page: requestedPage,
    pageSize: requestedPageSize,
    keyword: requestedKeyword,
    signal: controller.signal,
  }

  void Promise.resolve()
    .then(() => {
      if (requestRemoteMethod) {
        return requestRemoteMethod(requestedKeyword, requestedPage, {
          pageSize: requestedPageSize,
          params: requestParamsSnapshot,
          signal: controller.signal,
        })
      }
      if (requestApi) return requestApi(requestParams)
      throw new Error('请提供 remoteMethod 或 api')
    })
    .then((result) => {
      if (id !== requestId || isDisabled.value) return
      const data = resultData(result)
      const nextItems = reset ? data.records : [...items.value, ...data.records]
      items.value = nextItems
      total.value = resultTotal(data, nextItems)
      pageHasMore.value = data.hasMore
      failedPage.value = undefined
      rememberSelected(data.records)
      syncSelectedMeta(props.modelValue)
      emit('load', data.records, total.value)
    })
    .catch(() => {
      if (id !== requestId || controller.signal.aborted || isDisabled.value)
        return
      if (!reset) page.value = Math.max(1, requestedPage - 1)
      failedPage.value = requestedPage
      loadError.value = true
      lxMessage.error('加载选项失败，请重试')
    })
    .finally(() => {
      if (id !== requestId) return
      loading.value = false
      activeRequest = undefined
      if (requestController === controller) requestController = undefined
    })
}

function scheduleSearch(value: string) {
  if (isDisabled.value) return
  keyword.value = value
  if (queryTimer) clearTimeout(queryTimer)
  invalidateRequest()
  loadError.value = false
  items.value = []
  total.value = 0
  pageHasMore.value = undefined
  failedPage.value = undefined
  page.value = 1
  const configuredDelay = Number.isFinite(props.debounce) ? props.debounce : 300
  const delay = Math.min(400, Math.max(250, configuredDelay))
  queryTimer = setTimeout(() => load(true), delay)
}

watch(
  () => [props.api, props.remoteMethod, props.params, props.pageSize] as const,
  () => {
    if (queryTimer) clearTimeout(queryTimer)
    invalidateRequest()
    loadError.value = false
    items.value = []
    total.value = 0
    pageHasMore.value = undefined
    failedPage.value = undefined
    page.value = 1
    if (visible.value && !isDisabled.value) load(true)
  },
  { deep: true },
)

watch(isDisabled, (disabled) => {
  if (!disabled) return
  if (queryTimer) clearTimeout(queryTimer)
  invalidateRequest(true)
  failedPage.value = undefined
  loadError.value = false
  visible.value = false
  detachScroll()
})

function loadMore() {
  if (isDisabled.value || !hasMore.value || loading.value) return
  page.value += 1
  load()
}

function selectedItems(
  value: LxSelectPaginationValue,
): LxSelectPaginationItem[] {
  const values = Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ''
      ? []
      : [value]
  return values.map((entry) => {
    const key = String(entry)
    return (
      selectedMeta.value[key] ??
      items.value.find((item) => String(itemValue(item)) === key) ??
      externalItem(key) ?? { [props.valueKey]: entry }
    )
  })
}

function onChange(value: unknown) {
  if (isDisabled.value) return
  const normalized: LxSelectPaginationValue = Array.isArray(value)
    ? value.filter(
        (item): item is string | number =>
          typeof item === 'string' || typeof item === 'number',
      )
    : typeof value === 'string' || typeof value === 'number'
      ? value
      : undefined
  if (
    props.multiple &&
    Array.isArray(normalized) &&
    props.max !== undefined &&
    normalized.length > props.max
  ) {
    const next = normalized.slice(0, props.max)
    syncSelectedMeta(next)
    lxMessage.warning(`最多可选择 ${props.max} 项`)
    emit('update:modelValue', next)
    emit('change', next, selectedItems(next))
    return
  }
  syncSelectedMeta(normalized)
  emit('update:modelValue', normalized)
  emit('change', normalized, selectedItems(normalized))
}

function detachScroll() {
  scrollTarget?.removeEventListener('scroll', onDropdownScroll)
  scrollTarget = undefined
}

function onDropdownScroll() {
  if (!scrollTarget) return
  const remaining =
    scrollTarget.scrollHeight -
    scrollTarget.scrollTop -
    scrollTarget.clientHeight
  if (remaining <= 24) loadMore()
}

async function attachScroll() {
  await nextTick()
  if (!visible.value || isDisabled.value) return
  const popper = document.querySelector<HTMLElement>(`.${popperClass}`)
  scrollTarget =
    popper?.querySelector<HTMLElement>('.el-select-dropdown__wrap') ?? undefined
  scrollTarget?.addEventListener('scroll', onDropdownScroll, { passive: true })
}

function onVisibleChange(next: boolean) {
  if (next && isDisabled.value) {
    visible.value = false
    detachScroll()
    return
  }
  visible.value = next
  if (next && !isDisabled.value) {
    attachScroll()
    if (!items.value.length && !loading.value) load(true)
  } else {
    detachScroll()
  }
}

function onSearchKeydown(event: Event | KeyboardEvent) {
  if (
    !('key' in event) ||
    typeof event.key !== 'string' ||
    event.key !== 'Escape'
  )
    event.stopPropagation()
}

function retry() {
  if (isDisabled.value || loading.value) return
  if (failedPage.value !== undefined) {
    page.value = failedPage.value
    load()
  } else {
    load(true)
  }
}

defineExpose({
  reload: () => load(true),
  loadMore,
  focus: () => selectRef.value?.focus(),
})

onBeforeUnmount(() => {
  if (queryTimer) clearTimeout(queryTimer)
  invalidateRequest()
  detachScroll()
})
</script>

<template>
  <LxSelect
    ref="selectRef"
    class="lx-select-pagination"
    :model-value="modelValue"
    :options="selectOptions"
    :multiple="multiple"
    :collapse-tags="multiple"
    :collapse-tags-tooltip="multiple"
    :max-collapse-tags="maxCollapseTags"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :loading="loading"
    :aria-busy="loading"
    :popper-class="popperClass"
    @update:model-value="onChange"
    @visible-change="onVisibleChange"
  >
    <template #header>
      <div class="lx-select-pagination__search" @click.stop>
        <LxIcon name="search" :size="14" aria-hidden="true" />
        <LxInput
          :model-value="keyword"
          :placeholder="searchPlaceholder"
          :aria-label="searchPlaceholder"
          clearable
          :disabled="disabled"
          @update:model-value="scheduleSearch"
          @keydown="onSearchKeydown"
        />
      </div>
    </template>

    <template #option="{ option }">
      <div class="lx-select-pagination__option">
        <span class="lx-select-pagination__option-label">{{
          option.label
        }}</span>
        <span
          v-if="option.description"
          class="lx-select-pagination__option-description"
          >{{ option.description }}</span
        >
      </div>
    </template>

    <template #footer>
      <div class="lx-select-pagination__footer" @click.stop>
        <span v-if="loading" role="status" aria-live="polite" aria-atomic="true"
          >正在加载第 {{ page }} 页...</span
        >
        <div
          v-else-if="loadError"
          class="lx-select-pagination__error"
          role="alert"
        >
          <span>选项暂时无法加载</span>
          <button type="button" :disabled="isDisabled" @click="retry">
            重新加载
          </button>
        </div>
        <button
          v-else-if="hasMore"
          type="button"
          :disabled="isDisabled"
          @click="loadMore"
        >
          继续加载（{{ items.length }} / {{ total }}）
        </button>
        <span v-else-if="items.length" role="status" aria-live="polite"
          >已加载 {{ items.length }} 条</span
        >
        <span v-else role="status" aria-live="polite">暂无匹配项</span>
      </div>
    </template>
  </LxSelect>
</template>

<style scoped>
.lx-select-pagination {
  width: 100%;
  min-width: 0;
}

:global(.lx-select-pagination__search) {
  display: flex;
  align-items: center;
  gap: var(--lx-space-xs);
  padding: var(--lx-space-sm);
  border-bottom: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary);
}

:global(.lx-select-pagination__search .el-input) {
  flex: 1;
  min-width: 0;
}

:global(.lx-select-pagination__option) {
  display: grid;
  min-width: 0;
  gap: 1px;
  padding-block: var(--lx-space-xs);
}

:global(.lx-select-pagination__option-label) {
  overflow: hidden;
  color: var(--lx-text-regular);
  font-size: 13px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.lx-select-pagination__option-description) {
  overflow: hidden;
  color: var(--lx-text-secondary);
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.lx-select-pagination__footer) {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0 var(--lx-space-sm);
  border-top: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary);
  font-size: 12px;
}

:global(.lx-select-pagination__error) {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-sm);
}

:global(.lx-select-pagination__footer button) {
  min-height: 48px;
  padding: 0 var(--lx-space-sm);
  border: 0;
  background: transparent;
  color: var(--lx-color-primary);
  cursor: pointer;
  font: inherit;
}

:global(.lx-select-pagination__footer button:disabled) {
  color: var(--lx-text-placeholder);
  cursor: not-allowed;
}

:global(.lx-select-pagination__footer button:focus-visible) {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

:global(.el-select__popper[class*='lx-select-pagination-popper-']) {
  max-width: calc(100vw - 24px);
}
</style>
