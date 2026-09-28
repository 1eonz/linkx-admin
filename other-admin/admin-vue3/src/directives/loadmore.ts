import type { Directive } from 'vue';

interface LoadmoreState {
  callback?: () => void;
  dropdown?: HTMLElement;
  observer?: MutationObserver;
  syncDropdown: () => void;
  onOpen: EventListener;
  onScroll: EventListener;
}

const states = new WeakMap<HTMLElement, LoadmoreState>();

function findScrollContainer(element: HTMLElement): HTMLElement | null {
  if (element.matches('.el-select-dropdown__wrap, .el-scrollbar__wrap')) return element;

  return (
    element.closest<HTMLElement>('.el-select-dropdown__wrap, .el-scrollbar__wrap') ??
    element.querySelector<HTMLElement>('.el-select-dropdown__wrap, .el-scrollbar__wrap')
  );
}

function findDropdown(root: HTMLElement): HTMLElement | null {
  const controls = [root, ...root.querySelectorAll<HTMLElement>('[aria-controls]')];
  const controlledIds = controls.flatMap((element) =>
    (element.getAttribute('aria-controls') ?? '').split(/\s+/).filter(Boolean),
  );

  for (const id of controlledIds) {
    const controlledElement = document.getElementById(id);
    if (!controlledElement) continue;

    const scrollContainer = findScrollContainer(controlledElement);
    if (scrollContainer) return scrollContainer;
  }

  return root.querySelector<HTMLElement>('.el-select-dropdown__wrap, .el-scrollbar__wrap');
}

function observeBody(observer?: MutationObserver): void {
  observer?.observe(document.body ?? document.documentElement, {
    attributes: true,
    attributeFilter: ['aria-controls'],
    childList: true,
    subtree: true,
  });
}

/** el-select 下拉列表滚动到底部时触发回调，支持远程分页加载。 */
const loadmore: Directive<HTMLElement, (() => void) | undefined> = {
  mounted(root, binding) {
    const state: LoadmoreState = {
      callback: binding.value,
      onOpen: () => {
        state.syncDropdown();
        if (!state.dropdown) observeBody(state.observer);
      },
      onScroll: () => {
        const dropdown = state.dropdown;
        if (!dropdown) return;

        const { scrollTop, scrollHeight, clientHeight } = dropdown;
        if (scrollHeight - scrollTop <= clientHeight + 5) state.callback?.();
      },
      syncDropdown: () => {
        const nextDropdown = findDropdown(root);
        if (nextDropdown === state.dropdown) return;

        state.dropdown?.removeEventListener('scroll', state.onScroll);
        state.dropdown = nextDropdown ?? undefined;
        state.dropdown?.addEventListener('scroll', state.onScroll);
        if (state.dropdown) state.observer?.disconnect();
      },
    };

    root.addEventListener('click', state.onOpen);
    root.addEventListener('focusin', state.onOpen);
    root.addEventListener('keydown', state.onOpen);

    if (typeof MutationObserver !== 'undefined') {
      state.observer = new MutationObserver(state.syncDropdown);
    }

    state.syncDropdown();
    if (root.querySelector('[aria-expanded="true"]')) observeBody(state.observer);
    states.set(root, state);
  },

  updated(root, binding) {
    const state = states.get(root);
    if (!state) return;

    state.callback = binding.value;
    state.syncDropdown();
    if (!state.dropdown && root.querySelector('[aria-expanded="true"]')) {
      observeBody(state.observer);
    }
  },

  unmounted(root) {
    const state = states.get(root);
    if (!state) return;

    state.observer?.disconnect();
    state.dropdown?.removeEventListener('scroll', state.onScroll);
    root.removeEventListener('click', state.onOpen);
    root.removeEventListener('focusin', state.onOpen);
    root.removeEventListener('keydown', state.onOpen);
    states.delete(root);
  },
};

export default loadmore;
