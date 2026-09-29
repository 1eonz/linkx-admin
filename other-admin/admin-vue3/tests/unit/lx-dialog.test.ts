import { mount } from '@vue/test-utils';
import { LxDialog, type LxDialogProps } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

const DialogStub = defineComponent({
  name: 'ElDialog',
  props: {
    modelValue: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () =>
      props.modelValue
        ? h('section', { role: 'dialog', 'aria-labelledby': 'dialog-title' }, [
            h(
              'header',
              slots.header?.({
                titleId: 'dialog-title',
                titleClass: 'el-dialog__title',
              }),
            ),
            h('main', slots.default?.()),
            h('footer', slots.footer?.()),
          ])
        : null;
  },
});

function mountDialog(props: LxDialogProps = {}, slots = {}) {
  return mount(LxDialog, {
    props: { modelValue: true, title: '资源配置', ...props },
    global: { stubs: { ElDialog: DialogStub } },
    slots,
  });
}

describe('LxDialog', () => {
  it('associates the custom title with Element Plus dialog naming', () => {
    const wrapper = mountDialog();

    expect(wrapper.get('[role="dialog"]').attributes('aria-labelledby')).toBe('dialog-title');
    expect(wrapper.get('#dialog-title').text()).toBe('资源配置');
    wrapper.unmount();
  });

  it('emits confirm without closing and blocks confirm while loading', async () => {
    const wrapper = mountDialog();
    // 底部操作已切换 LxButton 内核（.lx-btn 体系）
    const confirm = wrapper.get('.lx-btn--primary');

    await confirm.trigger('click');
    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await wrapper.setProps({ loading: true });
    expect(confirm.attributes('disabled')).toBeDefined();
    await confirm.trigger('click');
    expect(wrapper.emitted('confirm')).toHaveLength(1);
    wrapper.unmount();
  });

  it('emits cancel only for the cancel action and models header close', async () => {
    const cancelWrapper = mountDialog();
    await cancelWrapper.get('.lx-btn--default').trigger('click');
    expect(cancelWrapper.emitted('cancel')).toHaveLength(1);
    expect(cancelWrapper.emitted('update:modelValue')).toEqual([[false]]);
    cancelWrapper.unmount();

    const closeWrapper = mountDialog();
    await closeWrapper.get('.lx-dialog__close').trigger('click');
    expect(closeWrapper.emitted('cancel')).toBeUndefined();
    expect(closeWrapper.emitted('update:modelValue')).toEqual([[false]]);
    closeWrapper.unmount();
  });

  it('renders a consumer footer when the default footer is hidden', () => {
    const wrapper = mountDialog({ hideFooter: true }, { footer: '<button type="button">完成</button>' });

    expect(wrapper.get('footer button').text()).toBe('完成');
    expect(wrapper.find('.lx-btn').exists()).toBe(false);
    wrapper.unmount();
  });
});
