import { mount } from '@vue/test-utils';
import { LxActionButtons, type LxActionItem } from 'lx-ui';
import { describe, expect, it, vi } from 'vitest';

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

    // 外显按钮为 LxButton 文字形态（.lx-actions__item），“更多”触发按钮同为文字形态
    expect(wrapper.findAll('.lx-actions__item').map((button) => button.text().trim())).toEqual(['查看', '其他操作']);

    const moreButton = wrapper.get('button[aria-controls]');
    expect(moreButton.attributes('aria-expanded')).toBe('false');
    await moreButton.trigger('click');

    const actionGroup = wrapper.get('[role="group"][aria-label="其他操作"]');
    await actionGroup.get('button').trigger('click');

    expect(wrapper.emitted('click')).toEqual([[overflowAction]]);
    expect(actionGroup.attributes('style')).toContain('display: none');
    wrapper.unmount();
  });

  it('maps every semantic type onto the LxButton text variant', () => {
    // 语义色档（2026-09-29 调研拍板）：primary/default 归一为 text 形态默认蓝，
    // danger/success/warning 走 type + text 组合激活 LxButton 文字形态语义色
    const wrapper = mount(LxActionButtons, {
      props: {
        max: 5,
        actions: [
          { label: '编辑', type: 'primary' },
          { label: '授权', type: 'success' },
          { label: '启用', type: 'warning' },
          { label: '删除', type: 'danger' },
          { label: '查看' },
        ],
      },
    });

    const items = wrapper.findAll('.lx-actions__item');
    expect(items).toHaveLength(5);
    // 全部为文字形态（拍板 #11：表格行内一律 text，禁止实底）
    expect(items.every((item) => item.classes().includes('is-text'))).toBe(true);

    expect(items[0].classes()).toContain('lx-btn--text');
    expect(items[1].classes()).toContain('lx-btn--success');
    expect(items[2].classes()).toContain('lx-btn--warning');
    expect(items[3].classes()).toContain('lx-btn--danger');
    // default 兼容旧值，渲染与 primary 同为蓝色文字形态
    expect(items[4].classes()).toContain('lx-btn--text');
    wrapper.unmount();
  });

  it('keeps the semantic color of overflow actions inside the more menu', async () => {
    const wrapper = mount(LxActionButtons, {
      props: {
        max: 1,
        actions: [{ label: '编辑' }, { label: '删除', type: 'danger' }, { label: '授权', type: 'success' }],
      },
    });

    await wrapper.get('button[aria-controls]').trigger('click');
    const menuItems = wrapper.findAll('.lx-actions__menu-item');
    // 折叠进菜单后保持语义色，不因折叠状态变色
    expect(menuItems[0].classes()).toContain('lx-actions__btn--danger');
    expect(menuItems[1].classes()).toContain('lx-actions__btn--success');
    wrapper.unmount();
  });

  it('invokes the per-item onClick callback after emitting the unified click event', async () => {
    const editClick = vi.fn();
    const action: LxActionItem = { label: '编辑', onClick: editClick, meta: { id: 1 } };
    const wrapper = mount(LxActionButtons, {
      props: { actions: [action] },
    });

    await wrapper.get('.lx-actions__item').trigger('click');

    // 派发顺序：先统一 click 事件，后项上 onClick 回调
    expect(wrapper.emitted('click')).toEqual([[action]]);
    expect(editClick).toHaveBeenCalledTimes(1);
    expect(editClick).toHaveBeenCalledWith(action);
    wrapper.unmount();
  });

  it('forwards textColor to the LxButton text variant', () => {
    const wrapper = mount(LxActionButtons, {
      props: { actions: [{ label: '自定义色', textColor: '#7c3aed' }] },
    });

    expect(wrapper.get('.lx-actions__item').attributes('style')).toContain('--lx-btn-text-color: #7c3aed');
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
