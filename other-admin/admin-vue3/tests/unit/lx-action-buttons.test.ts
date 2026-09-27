import { mount } from '@vue/test-utils';
import { LxActionButtons, type LxActionItem } from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxActionButtons', () => {
  it('filters hidden items, honors max and moreText, and emits the original overflow action', async () => {
    const overflowAction: LxActionItem = {
      key: 'disable',
      label: '停用',
      type: 'danger',
      meta: { id: 7 },
    };
    const wrapper = mount(LxActionButtons, {
      props: {
        max: 1,
        moreText: '其他操作',
        actions: [{ label: '查看' }, { label: '隐藏项', hidden: true }, overflowAction],
      },
    });

    expect(wrapper.findAll('.lx-actions__btn').map((button) => button.text().trim())).toEqual(['查看', '其他操作']);

    const moreButton = wrapper.get('button[aria-controls]');
    expect(moreButton.attributes('aria-expanded')).toBe('false');
    await moreButton.trigger('click');

    const actionGroup = wrapper.get('[role="group"][aria-label="其他操作"]');
    await actionGroup.get('button').trigger('click');

    expect(wrapper.emitted('click')).toEqual([[overflowAction]]);
    expect(actionGroup.attributes('style')).toContain('display: none');
    wrapper.unmount();
  });

  it('renders disabled actions as native disabled buttons and suppresses their events', async () => {
    const wrapper = mount(LxActionButtons, {
      props: {
        actions: [{ label: '暂不可执行', disabled: true }],
      },
    });

    const actionButton = wrapper.get('button');
    expect(actionButton.element.disabled).toBe(true);
    await actionButton.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
    wrapper.unmount();
  });

  it('closes on Escape and restores focus to the disclosure button', async () => {
    const wrapper = mount(LxActionButtons, {
      attachTo: document.body,
      props: {
        actions: [{ label: '查看' }, { label: '编辑' }],
        max: 1,
      },
    });
    const moreButton = wrapper.get('button[aria-controls]');
    moreButton.element.focus();
    await moreButton.trigger('click');

    const overflowAction = wrapper.get('.lx-actions__menu-item');
    overflowAction.element.focus();
    await overflowAction.trigger('keydown', { key: 'Escape' });

    expect(document.activeElement).toBe(moreButton.element);
    expect(moreButton.attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });
});
