import { mount } from '@vue/test-utils';
import { LxNavbar } from 'lx-ui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

const originalElement = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
const originalRequest = Object.getOwnPropertyDescriptor(document.documentElement, 'requestFullscreen');
const originalExit = Object.getOwnPropertyDescriptor(document, 'exitFullscreen');
let currentFullscreen: Element | null;
let requestFullscreen = vi.fn<() => Promise<void>>();
let exitFullscreen = vi.fn<() => Promise<void>>();

beforeEach(() => {
  currentFullscreen = null;
  requestFullscreen = vi.fn(async () => {
    currentFullscreen = document.documentElement;
    document.dispatchEvent(new Event('fullscreenchange'));
  });
  exitFullscreen = vi.fn(async () => {
    currentFullscreen = null;
    document.dispatchEvent(new Event('fullscreenchange'));
  });
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => currentFullscreen });
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    configurable: true,
    value: requestFullscreen,
  });
  Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen });
});

afterEach(() => {
  for (const [target, key, original] of [
    [document, 'fullscreenElement', originalElement],
    [document.documentElement, 'requestFullscreen', originalRequest],
    [document, 'exitFullscreen', originalExit],
  ] as const) {
    if (original) Object.defineProperty(target, key, original);
    else Reflect.deleteProperty(target, key);
  }
});

describe('LxNavbar 通用交互', () => {
  it('菜单打开时同步局部主题并在主题变更后更新，关闭时释放监听', async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const wrapper = mount(LxNavbar, { attachTo: document.body, props: { user: { name: '预览用户' } } });
    try {
      const header = wrapper.get('header').element;
      header.style.setProperty('--lx-bg-card', '#112233');
      const dropdown = wrapper.findComponent({ name: 'ElDropdown' });
      dropdown.vm.$emit('visible-change', true);
      await nextTick();
      expect(dropdown.props('popperStyle')).toMatchObject({ '--lx-bg-card': '#112233' });
      header.style.setProperty('--lx-bg-card', '#334455');
      await nextTick();
      await nextTick();
      expect(dropdown.props('popperStyle')).toMatchObject({ '--lx-bg-card': '#334455' });
      disconnect.mockClear();
      dropdown.vm.$emit('visible-change', false);
      expect(disconnect).toHaveBeenCalledOnce();
    } finally {
      wrapper.unmount();
    }
  });

  it('搜索去除两端空格，通知保留事件及封顶数字', async () => {
    const wrapper = mount(LxNavbar, { props: { notificationCount: 120 } });
    try {
      await wrapper.get('input').setValue('  运行总览  ');
      await wrapper.get('input').trigger('keyup', { key: 'Enter' });
      expect(wrapper.emitted('search')).toEqual([['运行总览']]);
      await wrapper.get('[aria-label="通知"]').trigger('click');
      expect(wrapper.emitted('notification-click')).toEqual([[]]);
      expect(wrapper.text()).toContain('99+');
      await wrapper.setProps({ showFullscreen: false, searchPlaceholder: '', notificationCount: undefined });
      expect(wrapper.find('input').exists()).toBe(false);
      expect(wrapper.find('[aria-label="通知"]').exists()).toBe(false);
      expect(wrapper.find('[aria-label="切换全屏"]').exists()).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it('进入和退出全屏同步真实状态，支持浏览器外部退出', async () => {
    const wrapper = mount(LxNavbar);
    try {
      await wrapper.get('[aria-label="切换全屏"]').trigger('click');
      await nextTick();
      expect(wrapper.get('[aria-label="退出全屏"]').attributes('aria-pressed')).toBe('true');
      await wrapper.get('[aria-label="退出全屏"]').trigger('click');
      await nextTick();
      expect(exitFullscreen).toHaveBeenCalledOnce();
      expect(wrapper.emitted('fullscreen-toggle')).toEqual([[true], [false]]);
      currentFullscreen = document.documentElement;
      document.dispatchEvent(new Event('fullscreenchange'));
      await nextTick();
      expect(wrapper.get('[aria-label="退出全屏"]').exists()).toBe(true);
      currentFullscreen = null;
      document.dispatchEvent(new Event('fullscreenchange'));
      await nextTick();
      expect(wrapper.get('[aria-label="切换全屏"]').exists()).toBe(true);
    } finally {
      wrapper.unmount();
    }
  });

  it('请求未结束时禁用重复提交，结束后可以继续操作', async () => {
    let resolve: (() => void) | undefined;
    requestFullscreen.mockImplementation(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const wrapper = mount(LxNavbar);
    try {
      const button = wrapper.get('[aria-label="切换全屏"]');
      await button.trigger('click');
      expect(button.attributes('disabled')).toBeDefined();
      expect(button.attributes('aria-busy')).toBe('true');
      await button.trigger('click');
      expect(requestFullscreen).toHaveBeenCalledOnce();
      resolve?.();
      await nextTick();
      await nextTick();
      expect(button.attributes('disabled')).toBeUndefined();
      expect(button.attributes('aria-busy')).toBe('false');
    } finally {
      wrapper.unmount();
    }
  });

  it('浏览器拒绝全屏时显示失败原因并允许重试，不误报进入', async () => {
    const error = new Error('浏览器策略拒绝');
    requestFullscreen.mockRejectedValueOnce(error);
    const wrapper = mount(LxNavbar);
    try {
      await wrapper.get('[aria-label="切换全屏"]').trigger('click');
      await nextTick();
      expect(wrapper.get('[role="status"]').text()).toContain('无法切换全屏');
      expect(wrapper.emitted('fullscreen-error')).toEqual([[error]]);
      expect(wrapper.emitted('fullscreen-toggle')).toEqual([[false]]);
      await wrapper.get('[aria-label="切换全屏"]').trigger('click');
      await nextTick();
      expect(wrapper.find('[role="status"]').exists()).toBe(false);
      expect(wrapper.emitted('fullscreen-toggle')).toEqual([[false], [true]]);
    } finally {
      wrapper.unmount();
    }
  });

  it('卸载后清理监听并忽略迟到的拒绝结果', async () => {
    let reject: ((error: Error) => void) | undefined;
    requestFullscreen.mockImplementation(
      () =>
        new Promise<void>((_, fail) => {
          reject = fail;
        }),
    );
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const wrapper = mount(LxNavbar);
    await wrapper.get('[aria-label="切换全屏"]').trigger('click');
    const listener = add.mock.calls.find(([event]) => event === 'fullscreenchange')?.[1];
    wrapper.unmount();
    expect(remove).toHaveBeenCalledWith('fullscreenchange', listener);
    reject?.(new Error('迟到的拒绝'));
    await nextTick();
    await nextTick();
    expect(wrapper.emitted('fullscreen-toggle')).toBeUndefined();
    expect(wrapper.emitted('fullscreen-error')).toBeUndefined();
  });

  it('浏览器不提供全屏 API 时仍有明确反馈且释放禁用状态', async () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: undefined });
    const wrapper = mount(LxNavbar);
    try {
      const button = wrapper.get('[aria-label="切换全屏"]');
      await button.trigger('click');
      await nextTick();
      expect(wrapper.get('[role="status"]').text()).toContain('检查浏览器');
      expect(button.attributes('disabled')).toBeUndefined();
      expect(wrapper.emitted('fullscreen-toggle')).toEqual([[false]]);
      expect(wrapper.emitted('fullscreen-error')?.[0]?.[0]).toBeInstanceOf(Error);
    } finally {
      wrapper.unmount();
    }
  });
});
