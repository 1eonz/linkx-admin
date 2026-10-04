import { mount } from '@vue/test-utils';
import { LxDrawer, type LxDrawerProps } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

const DrawerStub = defineComponent({
  name: 'ElDrawer',
  props: {
    modelValue: { type: Boolean, default: false },
    size: { type: [String, Number], default: undefined },
    closeOnPressEscape: { type: Boolean, default: false },
    ariaLabel: { type: String, default: undefined },
    ariaLabelledby: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    return () =>
      props.modelValue
        ? h(
            'section',
            {
              role: 'dialog',
              'aria-label': props.ariaLabel,
              'aria-labelledby': props.ariaLabelledby,
              'data-size': props.size,
              'data-esc': props.closeOnPressEscape,
            },
            [h('header', slots.header?.()), h('main', slots.default?.()), h('footer', slots.footer?.())],
          )
        : null;
  },
});

function mountDrawer(props: LxDrawerProps = {}, slots = {}) {
  return mount(LxDrawer, {
    props: { modelValue: true, title: '审计详情', ...props },
    global: { stubs: { ElDrawer: DrawerStub } },
    slots,
  });
}

describe('LxDrawer', () => {
  it('associates the visible title with the dialog name and clamps numeric size', () => {
    const wrapper = mountDrawer({ size: 480 });
    const dialog = wrapper.get('[role="dialog"]');
    const title = wrapper.get('.lx-drawer__title');

    expect(dialog.attributes('aria-labelledby')).toBe(title.attributes('id'));
    expect(dialog.attributes('aria-label')).toBeUndefined();
    expect(dialog.attributes('data-size')).toBe('min(480px, 100vw)');
    expect(dialog.attributes('data-esc')).toBe('true');
    wrapper.unmount();
  });

  it('allows a host with unsaved data to disable Escape closing explicitly', () => {
    const wrapper = mountDrawer({ closeOnPressEsc: false });

    expect(wrapper.get('[role="dialog"]').attributes('data-esc')).toBe('false');
    wrapper.unmount();
  });

  it('emits one model update when the header close button is activated', async () => {
    const wrapper = mountDrawer();

    await wrapper.get('.lx-drawer__close').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    wrapper.unmount();
  });

  it('supports an unlabeled drawer fallback and footer slot', () => {
    const wrapper = mountDrawer({ title: '', size: '30rem' }, { footer: '<button type="button">处理</button>' });
    const dialog = wrapper.get('[role="dialog"]');

    expect(dialog.attributes('aria-label')).toBe('详情抽屉');
    expect(dialog.attributes('aria-labelledby')).toBeUndefined();
    expect(dialog.attributes('data-size')).toBe('30rem');
    expect(wrapper.get('footer button').text()).toBe('处理');
    wrapper.unmount();
  });
});
