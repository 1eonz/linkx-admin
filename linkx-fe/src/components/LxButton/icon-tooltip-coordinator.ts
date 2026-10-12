import { computed, ref, shallowRef } from 'vue'
import type { ComputedRef, Ref } from 'vue'

interface IconTooltipCoordinator {
  hoveredId: Ref<symbol | null>
  focusedId: Ref<symbol | null>
  visibleId: Ref<symbol | null>
  pendingId: symbol | null
  timer: ReturnType<typeof setTimeout> | undefined
}

const coordinators = new WeakMap<Document, IconTooltipCoordinator>()
const fallbackCoordinator = createCoordinator()

function createCoordinator(): IconTooltipCoordinator {
  return {
    hoveredId: ref<symbol | null>(null),
    focusedId: ref<symbol | null>(null),
    visibleId: ref<symbol | null>(null),
    pendingId: null,
    timer: undefined,
  }
}

function getCoordinator(ownerDocument?: Document): IconTooltipCoordinator {
  const targetDocument =
    ownerDocument ?? (typeof document === 'undefined' ? undefined : document)
  if (!targetDocument) return fallbackCoordinator

  const existing = coordinators.get(targetDocument)
  if (existing) return existing

  const coordinator = createCoordinator()
  coordinators.set(targetDocument, coordinator)
  return coordinator
}

function clearControllerState(coordinator: IconTooltipCoordinator, id: symbol) {
  if (coordinator.hoveredId.value === id) coordinator.hoveredId.value = null
  if (coordinator.focusedId.value === id) coordinator.focusedId.value = null
  syncVisibility(coordinator)
}

/** 同一文档只显示当前悬停或聚焦按钮的提示，并保留原有 200ms 延迟。 */
function syncVisibility(coordinator: IconTooltipCoordinator) {
  const owner = coordinator.hoveredId.value ?? coordinator.focusedId.value

  if (owner === null) {
    if (coordinator.timer !== undefined) clearTimeout(coordinator.timer)
    coordinator.timer = undefined
    coordinator.pendingId = null
    coordinator.visibleId.value = null
    return
  }

  if (coordinator.visibleId.value === owner && coordinator.timer === undefined)
    return
  if (coordinator.pendingId === owner && coordinator.timer !== undefined) return

  if (coordinator.timer !== undefined) clearTimeout(coordinator.timer)
  coordinator.visibleId.value = null
  coordinator.pendingId = owner
  coordinator.timer = setTimeout(() => {
    if (
      (coordinator.hoveredId.value ?? coordinator.focusedId.value) === owner
    ) {
      coordinator.visibleId.value = owner
    }
    coordinator.pendingId = null
    coordinator.timer = undefined
  }, 200)
}

export interface IconTooltipController {
  visible: ComputedRef<boolean>
  /** 将控制器绑定到按钮根节点所属文档，支持同一运行时下的 iframe。 */
  bindDocument: (ownerDocument?: Document) => void
  mouseEnter: () => void
  mouseLeave: () => void
  focus: () => void
  blur: () => void
  clear: () => void
}

export function createIconTooltipController(): IconTooltipController {
  const id = Symbol('LxButton')
  const coordinator = shallowRef(getCoordinator())

  function bindDocument(ownerDocument?: Document) {
    const nextCoordinator = getCoordinator(ownerDocument)
    if (nextCoordinator === coordinator.value) return

    clearControllerState(coordinator.value, id)
    coordinator.value = nextCoordinator
  }

  function mouseEnter() {
    coordinator.value.hoveredId.value = id
    syncVisibility(coordinator.value)
  }

  function mouseLeave() {
    if (coordinator.value.hoveredId.value !== id) return
    coordinator.value.hoveredId.value = null
    syncVisibility(coordinator.value)
  }

  function focus() {
    // 聚焦不改动悬停状态，鼠标仍在按钮上时必须继续优先显示该按钮提示。
    coordinator.value.focusedId.value = id
    syncVisibility(coordinator.value)
  }

  function blur() {
    if (coordinator.value.focusedId.value !== id) return
    coordinator.value.focusedId.value = null
    syncVisibility(coordinator.value)
  }

  function clear() {
    clearControllerState(coordinator.value, id)
  }

  return {
    visible: computed(() => coordinator.value.visibleId.value === id),
    bindDocument,
    mouseEnter,
    mouseLeave,
    focus,
    blur,
    clear,
  }
}
