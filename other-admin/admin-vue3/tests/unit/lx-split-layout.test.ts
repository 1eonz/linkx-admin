import { mount } from '@vue/test-utils';
import { LxSplitLayout } from 'lx-ui';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('LxSplitLayout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adjusts the aside width with keyboard controls and enforces its bounds', async () => {
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

  it('requests controlled collapse and removes the resizer while collapsed', async () => {
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

  it('disconnects its ResizeObserver when unmounted', () => {
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
});
