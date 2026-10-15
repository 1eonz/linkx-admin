import { mount } from '@vue/test-utils';
import { LxActionButtons, setupLxPermission, type LxActionItem } from 'lx-ui';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

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

  it('normalizes max to a non-negative integer before splitting actions', async () => {
    const fractional = mount(LxActionButtons, {
      props: { max: 1.8, actions: [{ label: '查看' }, { label: '编辑' }] },
    });
    expect(fractional.findAll('.lx-actions__item')).toHaveLength(2);
    await fractional.get('button[aria-controls]').trigger('click');
    expect(fractional.findAll('.lx-actions__menu-item')).toHaveLength(1);
    fractional.unmount();

    const negative = mount(LxActionButtons, {
      props: { max: -1, actions: [{ label: '查看' }, { label: '编辑' }] },
    });
    expect(negative.findAll('.lx-actions__item')).toHaveLength(1);
    await negative.get('button[aria-controls]').trigger('click');
    expect(negative.findAll('.lx-actions__menu-item')).toHaveLength(2);
    negative.unmount();
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

  it('renders an optional icon while keeping the action text label', () => {
    const wrapper = mount(LxActionButtons, {
      props: { actions: [{ label: '查看', icon: 'search' }] },
    });

    expect(wrapper.get('button').text()).toContain('查看');
    expect(wrapper.find('svg').exists()).toBe(true);
    wrapper.unmount();
  });

  it('hides auth-gated actions when no permission source is configured', () => {
    const restorePermission = setupLxPermission(() => undefined);
    const wrapper = mount(LxActionButtons, {
      props: { actions: [{ label: '查看', auth: 'user:read' }] },
    });

    expect(wrapper.find('.lx-actions').exists()).toBe(false);
    wrapper.unmount();
    restorePermission();
  });

  it('keeps auth-omitted actions visible and hides explicit empty auth values', () => {
    const restorePermission = setupLxPermission(() => undefined);
    const wrapper = mount(LxActionButtons, {
      props: {
        actions: [{ label: '公开查看' }, { label: '空字符串权限', auth: '' }, { label: '空数组权限', auth: [] }],
      },
    });

    try {
      expect(wrapper.findAll('.lx-actions__item').map((button) => button.text())).toEqual(['公开查看']);
    } finally {
      wrapper.unmount();
      restorePermission();
    }
  });

  it('fails closed for empty auth codes, even when the permission source contains them', () => {
    const restorePermission = setupLxPermission(() => ({
      codes: { users: ['', ' ', 'user:read'] },
      current: () => 'users',
    }));
    const wrapper = mount(LxActionButtons, {
      props: {
        actions: [
          { label: '空权限码', auth: '' },
          { label: '空白权限码', auth: ' ' },
          { label: '空权限数组', auth: [] },
          { label: '空数组项', auth: [''] },
          { label: '有效权限', auth: 'user:read' },
        ],
      },
    });

    try {
      expect(wrapper.findAll('.lx-actions__item').map((button) => button.text())).toEqual(['有效权限']);
    } finally {
      wrapper.unmount();
      restorePermission();
    }
  });

  it('updates permission-filtered actions and restores focus when an overflow action disappears', async () => {
    const permissionCodes = ref<string[]>(['user:delete']);
    const restorePermission = setupLxPermission(() => ({
      codes: { users: permissionCodes.value },
      current: () => 'users',
    }));
    const wrapper = mount(LxActionButtons, {
      attachTo: document.body,
      props: {
        max: 1,
        actions: [{ label: '查看' }, { label: '删除', type: 'danger', auth: 'user:delete' }],
      },
    });

    try {
      const moreButton = wrapper.get('button[aria-controls]');
      await moreButton.trigger('click');
      const overflowAction = wrapper.get('.lx-actions__menu-item');
      overflowAction.element.focus();
      expect(document.activeElement).toBe(overflowAction.element);

      permissionCodes.value = [];
      await nextTick();
      await nextTick();

      expect(wrapper.find('.lx-actions__menu').exists()).toBe(false);
      expect(wrapper.find('button[aria-controls]').exists()).toBe(false);
      expect(document.activeElement).toBe(wrapper.get('.lx-actions__item').element);
    } finally {
      wrapper.unmount();
      restorePermission();
    }
  });

  it('repositions an open menu when reactive permissions move the more button', async () => {
    const permissionCodes = ref<string[]>(['user:edit']);
    const restorePermission = setupLxPermission(() => ({
      codes: { users: permissionCodes.value },
      current: () => 'users',
    }));
    const wrapper = mount(LxActionButtons, {
      attachTo: document.body,
      props: {
        max: 2,
        actions: [{ label: '查看' }, { label: '编辑', auth: 'user:edit' }, { label: '删除' }, { label: '导出' }],
      },
    });

    try {
      const moreButton = wrapper.get('button[aria-controls]');
      const buttonLeft = vi.fn(() => (permissionCodes.value.length ? 120 : 80));
      moreButton.element.getBoundingClientRect = () =>
        ({
          left: buttonLeft(),
          right: buttonLeft() + 44,
          top: 120,
          bottom: 148,
          width: 44,
          height: 28,
          x: buttonLeft(),
          y: 120,
          toJSON: () => ({}),
        }) as DOMRect;
      wrapper.get('.lx-actions__menu').element.getBoundingClientRect = () =>
        ({
          left: 0,
          right: 96,
          top: 0,
          bottom: 100,
          width: 96,
          height: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;

      await moreButton.trigger('click');
      await nextTick();
      expect(wrapper.get('.lx-actions__menu').attributes('style')).toContain('left: 68px');

      permissionCodes.value = [];
      await nextTick();
      await nextTick();

      expect(wrapper.findAll('.lx-actions__menu-item')).toHaveLength(1);
      expect(wrapper.get('.lx-actions__menu').attributes('style')).toContain('left: 28px');
    } finally {
      wrapper.unmount();
      restorePermission();
    }
  });

  it('repositions an open menu when max changes and overflow remains', async () => {
    const wrapper = mount(LxActionButtons, {
      attachTo: document.body,
      props: {
        max: 1,
        actions: [{ label: '查看' }, { label: '编辑' }, { label: '删除' }, { label: '导出' }],
      },
    });

    try {
      const moreButton = wrapper.get('button[aria-controls]');
      moreButton.element.getBoundingClientRect = () => {
        const left = wrapper.props('max') === 1 ? 120 : 80;
        return {
          left,
          right: left + 44,
          top: 120,
          bottom: 148,
          width: 44,
          height: 28,
          x: left,
          y: 120,
          toJSON: () => ({}),
        } as DOMRect;
      };
      wrapper.get('.lx-actions__menu').element.getBoundingClientRect = () =>
        ({
          left: 0,
          right: 96,
          top: 0,
          bottom: 100,
          width: 96,
          height: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;

      await moreButton.trigger('click');
      await nextTick();
      expect(wrapper.get('.lx-actions__menu').attributes('style')).toContain('left: 68px');

      await wrapper.setProps({ max: 2 });
      await nextTick();
      expect(wrapper.findAll('.lx-actions__menu-item')).toHaveLength(2);
      expect(wrapper.get('.lx-actions__menu').attributes('style')).toContain('left: 28px');
    } finally {
      wrapper.unmount();
    }
  });

  it('keeps focus on an action that moves from the menu into the visible list', async () => {
    const wrapper = mount(LxActionButtons, {
      attachTo: document.body,
      props: {
        max: 1,
        actions: [{ label: '查看' }, { label: '编辑' }, { label: '删除' }],
      },
    });

    try {
      await wrapper.get('button[aria-controls]').trigger('click');
      const menuAction = wrapper.get('.lx-actions__menu-item[data-action-key="编辑-1"]');
      menuAction.element.focus();
      expect(document.activeElement).toBe(menuAction.element);

      await wrapper.setProps({ max: 2 });
      await nextTick();

      const visibleAction = wrapper.get('.lx-actions__item[data-action-key="编辑-1"]');
      expect(document.activeElement).toBe(visibleAction.element);
      expect(wrapper.get('button[aria-controls]').attributes('aria-expanded')).toBe('true');
    } finally {
      wrapper.unmount();
    }
  });

  it('keeps focus on the matching duplicate-label action when max changes', async () => {
    const wrapper = mount(LxActionButtons, {
      attachTo: document.body,
      props: {
        max: 1,
        actions: [{ label: '查看' }, { label: '重复操作' }, { label: '重复操作' }, { label: '删除' }],
      },
    });

    try {
      await wrapper.get('button[aria-controls]').trigger('click');
      const secondDuplicate = wrapper.get('.lx-actions__menu-item[data-action-key="重复操作-2"]');
      secondDuplicate.element.focus();
      expect(secondDuplicate.attributes('data-action-key')).toBe('重复操作-2');
      expect(document.activeElement).toBe(secondDuplicate.element);

      await wrapper.setProps({ max: 3 });
      await nextTick();

      const matchingAction = wrapper.get('.lx-actions__item[data-action-key="重复操作-2"]');
      expect(document.activeElement).toBe(matchingAction.element);
      expect(wrapper.get('button[aria-controls]').attributes('aria-expanded')).toBe('true');
    } finally {
      wrapper.unmount();
    }
  });

  it('keeps focus when an earlier permission-filtered action disappears', async () => {
    const permissionCodes = ref<string[]>(['user:restricted']);
    const restorePermission = setupLxPermission(() => ({
      codes: { users: permissionCodes.value },
      current: () => 'users',
    }));
    const wrapper = mount(LxActionButtons, {
      attachTo: document.body,
      props: {
        max: 1,
        actions: [{ label: '受限操作', auth: 'user:restricted' }, { label: '查看' }, { label: '删除' }],
      },
    });

    try {
      await wrapper.get('button[aria-controls]').trigger('click');
      const targetAction = wrapper.get('.lx-actions__menu-item[data-action-key="删除-2"]');
      targetAction.element.focus();
      expect(document.activeElement).toBe(targetAction.element);

      permissionCodes.value = [];
      await nextTick();
      await nextTick();

      const retainedAction = wrapper.get('.lx-actions__menu-item[data-action-key="删除-2"]');
      expect(document.activeElement).toBe(retainedAction.element);
      expect(wrapper.get('button[aria-controls]').attributes('aria-expanded')).toBe('true');
    } finally {
      wrapper.unmount();
      restorePermission();
    }
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
