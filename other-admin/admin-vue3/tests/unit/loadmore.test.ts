import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, withDirectives } from 'vue';

import loadmore from '@/directives/loadmore';

function mountSelect(callback: () => void) {
  const callbackRef = ref(callback);
  const wrapper = mount(
    defineComponent({
      setup() {
        return () =>
          withDirectives(h('div', { class: 'select-root' }, [h('input', { 'aria-controls': 'select-options' })]), [
            [loadmore, callbackRef.value],
          ]);
      },
    }),
  );

  return { callbackRef, wrapper };
}

function createTeleportedDropdown() {
  const dropdown = document.createElement('div');
  dropdown.className = 'el-select-dropdown__wrap el-scrollbar__wrap';
  dropdown.innerHTML = '<div id="select-options" role="listbox"></div>';
  Object.defineProperties(dropdown, {
    clientHeight: { configurable: true, value: 100 },
    scrollHeight: { configurable: true, value: 200 },
  });
  document.body.append(dropdown);
  return dropdown;
}

function waitForMutationObserver() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('v-loadmore', () => {
  it('下拉列表延迟 teleport 到 body 后，在滚动到底部时触发回调', async () => {
    const callback = vi.fn();
    const { wrapper } = mountSelect(callback);
    wrapper.get('.select-root').element.dispatchEvent(new Event('focusin', { bubbles: true }));
    const dropdown = createTeleportedDropdown();
    await waitForMutationObserver();

    dropdown.scrollTop = 80;
    dropdown.dispatchEvent(new Event('scroll'));
    expect(callback).not.toHaveBeenCalled();

    dropdown.scrollTop = 95;
    dropdown.dispatchEvent(new Event('scroll'));
    expect(callback).toHaveBeenCalledOnce();

    wrapper.unmount();
    dropdown.remove();
  });

  it('更新回调并在卸载时移除滚动监听', async () => {
    const originalCallback = vi.fn();
    const updatedCallback = vi.fn();
    const { callbackRef, wrapper } = mountSelect(originalCallback);
    wrapper.get('.select-root').element.dispatchEvent(new Event('focusin', { bubbles: true }));
    const dropdown = createTeleportedDropdown();
    await waitForMutationObserver();

    callbackRef.value = updatedCallback;
    await wrapper.vm.$nextTick();
    dropdown.scrollTop = 100;
    dropdown.dispatchEvent(new Event('scroll'));

    expect(originalCallback).not.toHaveBeenCalled();
    expect(updatedCallback).toHaveBeenCalledOnce();

    wrapper.unmount();
    dropdown.dispatchEvent(new Event('scroll'));
    expect(updatedCallback).toHaveBeenCalledOnce();
    dropdown.remove();
  });

  it('下拉尚未挂载时卸载会停止 DOM 观察', async () => {
    const callback = vi.fn();
    const { wrapper } = mountSelect(callback);
    wrapper.get('.select-root').element.dispatchEvent(new Event('focusin', { bubbles: true }));
    wrapper.unmount();

    const dropdown = createTeleportedDropdown();
    await waitForMutationObserver();
    dropdown.scrollTop = 100;
    dropdown.dispatchEvent(new Event('scroll'));

    expect(callback).not.toHaveBeenCalled();
    dropdown.remove();
  });
});
