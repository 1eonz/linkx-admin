import { mount } from '@vue/test-utils';
import { LxSplitLayout } from 'lx-ui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref, watch } from 'vue';

/** 使用可取消的鼠标事件补齐指针身份，保持 jsdom 与浏览器的可观察交互一致。 */
function pointer(type: string, pointerId: number, clientX = 0, button = 0, isPrimary = true) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button });
  Object.defineProperties(event, { pointerId: { value: pointerId }, isPrimary: { value: isPrimary } });
  return event;
}

describe('LxSplitLayout', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('键盘调整侧栏宽度并遵守上下限', async () => {
    const wrapper = mount(LxSplitLayout, {
      props: { asideWidth: 280, resizable: true },
    });
    const separator = wrapper.get('[role="separator"]');

    expect(separator.attributes('aria-valuenow')).toBe('280');
    expect(separator.attributes('aria-valuemin')).toBe('200');
    await separator.trigger('keydown', { key: 'ArrowRight' });
    expect(separator.attributes('aria-valuenow')).toBe('288');
    await separator.trigger('keydown', { key: 'Home' });
    expect(separator.attributes('aria-valuenow')).toBe('200');
    await separator.trigger('keydown', { key: 'End' });
    expect(separator.attributes('aria-valuenow')).toBe('480');
    expect(wrapper.emitted('resize')).toEqual([[288], [200], [480]]);

    wrapper.unmount();
  });

  it('请求受控折叠并在折叠后移除分隔栏', async () => {
    const wrapper = mount(LxSplitLayout, {
      props: { resizable: true, collapsed: false },
    });

    await wrapper.get('.lx-split-layout__toggle').trigger('click');
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]]);

    await wrapper.setProps({ collapsed: true });
    expect(wrapper.find('[role="separator"]').exists()).toBe(false);
    expect(wrapper.get('aside').attributes('style')).toContain('width: 0px');

    wrapper.unmount();
  });

  it('父级同步回传resize时，保存值、实际样式和ARIA在多次更新后仍一致', async () => {
    const savedWidth = ref(280);
    const wrapper = mount({
      components: { LxSplitLayout },
      setup: () => ({ savedWidth }),
      template: '<LxSplitLayout :aside-width="savedWidth" resizable @resize="savedWidth = $event" />',
    });
    try {
      const aside = wrapper.get('aside');
      vi.spyOn(aside.element, 'getBoundingClientRect').mockImplementation(
        () => new DOMRect(0, 0, parseFloat(aside.element.style.width), 300),
      );
      const separator = wrapper.get('[role="separator"]');
      for (const [key, expected] of [
        ['Home', 200],
        ['ArrowRight', 208],
        ['ArrowLeft', 200],
        ['End', 480],
      ] as const) {
        await separator.trigger('keydown', { key });
        await nextTick();
        await nextTick();
        expect(savedWidth.value).toBe(expected);
        expect(separator.attributes('aria-valuenow')).toBe(String(expected));
        expect(aside.element.style.width).toBe(`${expected}px`);
      }
      separator.element.dispatchEvent(pointer('pointerdown', 8, 100));
      window.dispatchEvent(pointer('pointermove', 8, 60));
      window.dispatchEvent(pointer('pointerup', 8));
      await nextTick();
      await nextTick();
      expect(savedWidth.value).toBe(440);
      expect(separator.attributes('aria-valuenow')).toBe('440');
      expect(aside.element.style.width).toBe('440px');
    } finally {
      wrapper.unmount();
    }
  });

  it('布局重测忽略数字宽度的旧渲染几何，不把过渡中间值写回模型', async () => {
    let notify = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const wrapper = mount(LxSplitLayout, { props: { asideWidth: 280, resizable: true } });
    try {
      const aside = wrapper.get('aside');
      vi.spyOn(aside.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 280, 300));
      await wrapper.setProps({ asideWidth: 200 });
      notify();
      await nextTick();
      expect(aside.element.style.width).toBe('200px');
      expect(wrapper.get('[role="separator"]').attributes('aria-valuenow')).toBe('200');
      expect(wrapper.emitted('resize')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  it('卸载时断开尺寸观察器', () => {
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = disconnect;
        takeRecords() {
          return [];
        }
      },
    );

    const wrapper = mount(LxSplitLayout);
    wrapper.unmount();

    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('只跟踪当前主指针，取消后停止更新并释放捕获', async () => {
    const wrapper = mount(LxSplitLayout, { attachTo: document.body, props: { resizable: true } });
    try {
      const separator = wrapper.get('[role="separator"]');
      const capture = vi.fn();
      const release = vi.fn();
      separator.element.setPointerCapture = capture;
      separator.element.hasPointerCapture = () => true;
      separator.element.releasePointerCapture = release;
      separator.element.dispatchEvent(pointer('pointerdown', 10, 100));
      separator.element.dispatchEvent(pointer('pointerdown', 20, 100));
      expect(capture).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(separator.element);
      window.dispatchEvent(pointer('pointermove', 11, 180));
      expect(wrapper.emitted('resize')).toBeUndefined();
      window.dispatchEvent(pointer('pointerup', 11));
      window.dispatchEvent(pointer('pointermove', 10, 130));
      await nextTick();
      expect(separator.attributes('aria-valuenow')).toBe('310');
      window.dispatchEvent(pointer('pointercancel', 10));
      window.dispatchEvent(pointer('pointermove', 10, 160));
      expect(wrapper.emitted('resize')).toEqual([[310]]);
      expect(capture).toHaveBeenCalledWith(10);
      expect(release).toHaveBeenCalledWith(10);
    } finally {
      wrapper.unmount();
    }
  });

  it('非主键和非主指针不能发起拖动，捕获丢失后停止拖动', () => {
    const wrapper = mount(LxSplitLayout, { props: { resizable: true } });
    try {
      const separator = wrapper.get('[role="separator"]');
      separator.element.dispatchEvent(pointer('pointerdown', 1, 100, 2));
      window.dispatchEvent(pointer('pointermove', 1, 160));
      separator.element.dispatchEvent(pointer('pointerdown', 2, 100, 0, false));
      window.dispatchEvent(pointer('pointermove', 2, 160));
      expect(wrapper.emitted('resize')).toBeUndefined();
      separator.element.dispatchEvent(pointer('pointerdown', 3, 100));
      separator.element.dispatchEvent(pointer('lostpointercapture', 3));
      window.dispatchEvent(pointer('pointermove', 3, 160));
      expect(wrapper.emitted('resize')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  it('关闭调整能力时终止活动拖动并回收分隔栏焦点', async () => {
    const wrapper = mount(LxSplitLayout, { attachTo: document.body, props: { resizable: true } });
    try {
      wrapper.get('[role="separator"]').element.dispatchEvent(pointer('pointerdown', 1, 100));
      await wrapper.setProps({ resizable: false });
      await nextTick();
      window.dispatchEvent(pointer('pointermove', 1, 180));
      expect(wrapper.emitted('resize')).toBeUndefined();
      expect(wrapper.find('[role="separator"]').exists()).toBe(false);
      expect(document.activeElement).toBe(wrapper.get('.lx-split-layout__toggle').element);
    } finally {
      wrapper.unmount();
    }
  });

  it('外部折叠隐藏已聚焦的侧栏时，把焦点交还展开按钮', async () => {
    const wrapper = mount(LxSplitLayout, {
      attachTo: document.body,
      props: { resizable: true },
      slots: { aside: '<button type="button">侧栏动作</button>' },
    });
    try {
      const toggle = wrapper.get('.lx-split-layout__toggle');
      const aside = wrapper.get('aside');
      expect(toggle.attributes('aria-controls')).toBe(aside.attributes('id'));
      expect(toggle.attributes('aria-expanded')).toBe('true');
      wrapper.get('aside button').element.focus();
      await wrapper.setProps({ collapsed: true });
      await nextTick();
      expect(toggle.attributes('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(toggle.element);
      await wrapper.setProps({ collapsed: false });
      expect(toggle.attributes('aria-expanded')).toBe('true');
    } finally {
      wrapper.unmount();
    }
  });

  it('容器变窄转为堆叠时取消拖动并保留可操作焦点', async () => {
    let notify = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const wrapper = mount(LxSplitLayout, { attachTo: document.body, props: { resizable: true } });
    try {
      wrapper.get('[role="separator"]').element.dispatchEvent(pointer('pointerdown', 7, 100));
      Object.defineProperty(wrapper.element, 'clientWidth', { configurable: true, value: 420 });
      notify();
      await nextTick();
      await nextTick();
      expect(wrapper.classes()).toContain('is-stacked');
      window.dispatchEvent(pointer('pointermove', 7, 180));
      expect(wrapper.emitted('resize')).toBeUndefined();
      expect(document.activeElement).toBe(wrapper.get('.lx-split-layout__toggle').element);
    } finally {
      wrapper.unmount();
    }
  });

  it('保留非调整模式的CSS宽度，多个实例有独立控制目标且不生成嵌套main', async () => {
    const first = mount(LxSplitLayout, { props: { asideWidth: '25%' } });
    const pair = mount({
      components: { LxSplitLayout },
      template: '<div><LxSplitLayout /><LxSplitLayout /></div>',
    });
    try {
      expect(first.get('aside').attributes('style')).toContain('width: 25%');
      const panels = pair.findAll('aside');
      expect(panels[0].attributes('id')).not.toBe(panels[1].attributes('id'));
      expect(first.find('main').exists()).toBe(false);
      await first.setProps({ asideWidth: 360 });
      expect(first.get('aside').attributes('style')).toContain('width: 360px');
    } finally {
      first.unmount();
      pair.unmount();
    }
  });

  it('活动拖动中卸载后不再处理全局指针事件', () => {
    const wrapper = mount(LxSplitLayout, { props: { resizable: true } });
    wrapper.get('[role="separator"]').element.dispatchEvent(pointer('pointerdown', 1, 100));
    wrapper.unmount();
    window.dispatchEvent(pointer('pointermove', 1, 200));
    expect(wrapper.emitted('resize')).toBeUndefined();
  });

  it('外部折叠也回收已聚焦的分隔栏', async () => {
    const wrapper = mount(LxSplitLayout, { attachTo: document.body, props: { resizable: true } });
    try {
      wrapper.get('[role="separator"]').element.focus();
      await wrapper.setProps({ collapsed: true });
      await nextTick();
      expect(document.activeElement).toBe(wrapper.get('.lx-split-layout__toggle').element);
    } finally {
      wrapper.unmount();
    }
  });

  it('非调整模式堆叠再恢复时不把全宽测量覆盖桌面偏好', async () => {
    let notify = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const wrapper = mount(LxSplitLayout, { props: { asideWidth: 280 } });
    let availableWidth = 900;
    try {
      const aside = wrapper.get('aside');
      Object.defineProperty(wrapper.element, 'clientWidth', { get: () => availableWidth });
      vi.spyOn(aside.element, 'getBoundingClientRect').mockImplementation(
        () =>
          new DOMRect(
            0,
            0,
            wrapper.classes().includes('is-stacked') ? availableWidth : parseFloat(aside.element.style.width),
            300,
          ),
      );
      notify();
      availableWidth = 420;
      notify();
      await nextTick();
      expect(wrapper.classes()).toContain('is-stacked');
      expect(aside.attributes('style')).toContain('width: 280px');
      availableWidth = 900;
      notify();
      await nextTick();
      await nextTick();
      expect(wrapper.classes()).not.toContain('is-stacked');
      expect(aside.attributes('style')).toContain('width: 280px');
    } finally {
      wrapper.unmount();
    }
  });

  it('视口媒体查询触发堆叠时停止拖动，卸载后清理媒体监听', async () => {
    let notify = () => {};
    const media = {
      matches: false,
      addEventListener: vi.fn((_event: string, callback: () => void) => {
        notify = callback;
      }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('matchMedia', () => media);
    const wrapper = mount(LxSplitLayout, { attachTo: document.body, props: { resizable: true } });
    try {
      Object.defineProperty(wrapper.element, 'clientWidth', { value: 640 });
      wrapper.get('[role="separator"]').element.dispatchEvent(pointer('pointerdown', 5, 100));
      media.matches = true;
      notify();
      await nextTick();
      await nextTick();
      expect(wrapper.classes()).toContain('is-stacked');
      expect(document.activeElement).toBe(wrapper.get('.lx-split-layout__toggle').element);
      window.dispatchEvent(pointer('pointermove', 5, 180));
      expect(wrapper.emitted('resize')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('不覆盖宿主post watcher主动设置的主区焦点', async () => {
    const collapsed = ref(false);
    const mainAction = ref<HTMLButtonElement>();
    const stop = watch(collapsed, () => mainAction.value?.focus(), { flush: 'post' });
    const wrapper = mount(
      {
        components: { LxSplitLayout },
        setup: () => ({ collapsed, mainAction }),
        template:
          '<LxSplitLayout :collapsed="collapsed" resizable><template #aside><button>侧栏操作</button></template><button ref="mainAction">主区操作</button></LxSplitLayout>',
      },
      { attachTo: document.body },
    );
    try {
      wrapper.get('aside button').element.focus();
      collapsed.value = true;
      await nextTick();
      await nextTick();
      expect(document.activeElement).toBe(mainAction.value);
    } finally {
      stop();
      wrapper.unmount();
    }
  });

  it('可调整模式恢复时等待旧堆叠DOM更新，再校正最大值与当前宽度', async () => {
    let notify = () => {};
    const media = {
      matches: false,
      addEventListener: (_event: string, callback: () => void) => {
        notify = callback;
      },
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('matchMedia', () => media);
    const style = document.createElement('style');
    style.textContent =
      '.lx-split-layout { column-gap: 16px; } .is-stacked .lx-split-layout__resizer { display: none; }';
    document.head.append(style);
    const wrapper = mount(LxSplitLayout, { attachTo: document.body, props: { resizable: true, asideWidth: 280 } });
    try {
      Object.defineProperty(wrapper.element, 'clientWidth', { value: 640 });
      const aside = wrapper.get('aside');
      vi.spyOn(aside.element, 'getBoundingClientRect').mockImplementation(
        () =>
          new DOMRect(
            0,
            0,
            wrapper.classes().includes('is-stacked') ? 640 : parseFloat(aside.element.style.width),
            300,
          ),
      );
      vi.spyOn(wrapper.get('[role="separator"]').element, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(0, 0, 24, 300),
      );
      vi.spyOn(wrapper.get('.lx-split-layout__toggle').element, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(0, 0, 44, 44),
      );
      media.matches = true;
      notify();
      await nextTick();
      expect(aside.attributes('style')).toContain('width: 280px');
      media.matches = false;
      notify();
      await nextTick();
      await nextTick();
      const separator = wrapper.get('[role="separator"]');
      const maximum = Number(separator.attributes('aria-valuemax'));
      expect(maximum).toBeLessThan(280);
      expect(separator.attributes('aria-valuenow')).toBe(String(maximum));
      expect(wrapper.emitted('resize')?.at(-1)).toEqual([maximum]);
    } finally {
      wrapper.unmount();
      style.remove();
    }
  });
});
