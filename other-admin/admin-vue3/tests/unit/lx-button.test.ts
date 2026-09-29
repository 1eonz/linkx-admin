import { mount } from '@vue/test-utils';
import { LxButton, type LxButtonSize, type LxButtonType } from 'lx-ui';
import { describe, expect, it } from 'vitest';

const TYPES: LxButtonType[] = ['primary', 'success', 'warning', 'danger', 'default', 'text'];

const SIZES: LxButtonSize[] = ['sm', 'md', 'lg'];

/** EP 内核档位映射：Lx 工程档名 sm/md/lg → small/default/large */
const EP_SIZE: Record<LxButtonSize, string> = {
  sm: 'el-button--small',
  md: 'el-button--default',
  lg: 'el-button--large',
};

describe('LxButton', () => {
  it('renders every type with the lx-btn class family', () => {
    for (const type of TYPES) {
      const wrapper = mount(LxButton, { props: { type } });

      expect(wrapper.classes(), `type=${type}`).toContain('lx-btn');
      expect(wrapper.classes(), `type=${type}`).toContain(`lx-btn--${type}`);
      wrapper.unmount();
    }
  });

  it('maps engineering sizes onto the Element Plus kernel sizes', () => {
    for (const size of SIZES) {
      const wrapper = mount(LxButton, { props: { size } });

      expect(wrapper.classes()).toContain(`lx-btn--${size}`);
      expect(wrapper.classes()).toContain(EP_SIZE[size]);
      wrapper.unmount();
    }
  });

  it('renders the text variant through the EP text mode instead of the deprecated type', () => {
    const wrapper = mount(LxButton, { props: { type: 'text' } });

    expect(wrapper.classes()).toContain('is-text');
    wrapper.unmount();
  });

  it('combines danger semantics with the text variant for inline destructive actions', () => {
    // 标本"移出布控"行内高危操作：红字无底色，样式钩子依赖 is-text + el-button--danger 同时命中
    const wrapper = mount(LxButton, { props: { type: 'danger', text: true } });

    expect(wrapper.classes()).toContain('is-text');
    expect(wrapper.classes()).toContain('el-button--danger');
    wrapper.unmount();

    // 未开启 text 时 danger 仍为实底形态
    const solid = mount(LxButton, { props: { type: 'danger', text: false } });
    expect(solid.classes()).not.toContain('is-text');
    solid.unmount();
  });

  it('exposes the semantic text variant for success and warning as well', () => {
    for (const type of ['success', 'warning'] as const) {
      const wrapper = mount(LxButton, { props: { type, text: true } });

      expect(wrapper.classes(), `type=${type}`).toContain('is-text');
      expect(wrapper.classes(), `type=${type}`).toContain(`el-button--${type}`);
      wrapper.unmount();
    }
  });

  it('injects the custom text color as a CSS variable for the text variant', () => {
    const wrapper = mount(LxButton, {
      props: { type: 'text', textColor: '#7c3aed' },
      slots: { default: '自定义色链接' },
    });

    // 以 --lx-btn-text-color 变量注入，样式层据此覆盖语义色并派生 hover 底
    expect(wrapper.attributes('style')).toContain('--lx-btn-text-color: #7c3aed');
    wrapper.unmount();

    // 未提供时注入空样式，保持内核默认
    const plain = mount(LxButton, { props: { type: 'text' }, slots: { default: '检索详情' } });
    expect(plain.attributes('style')).toBeUndefined();
    plain.unmount();
  });

  it('shows the default slot as the label', () => {
    const wrapper = mount(LxButton, { props: { type: 'primary' }, slots: { default: '确认下发指令' } });

    expect(wrapper.get('.lx-btn__label').text()).toBe('确认下发指令');
    wrapper.unmount();
  });

  it('swaps the label for loadingText while loading and blocks clicks', async () => {
    const wrapper = mount(LxButton, {
      props: { type: 'primary', loading: false, loadingText: '下发指令中...' },
      slots: { default: '确认下发指令' },
    });

    expect(wrapper.get('.lx-btn__label').text()).toBe('确认下发指令');

    await wrapper.setProps({ loading: true });
    expect(wrapper.get('.lx-btn__label').text()).toBe('下发指令中...');
    expect(wrapper.attributes('aria-busy')).toBe('true');
    // EP 内核 loading → 原生 disabled，点击不派发
    expect(wrapper.attributes('disabled')).toBeDefined();
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
    wrapper.unmount();
  });

  it('keeps the original label while loading without loadingText', async () => {
    const wrapper = mount(LxButton, {
      props: { loading: true, loadingText: '' },
      slots: { default: '指令下发' },
    });

    expect(wrapper.get('.lx-btn__label').text()).toBe('指令下发');
    wrapper.unmount();
  });

  it('renders the leading icon through LxIcon instead of the EP icon channel', () => {
    const wrapper = mount(LxButton, {
      props: { icon: 'plus', iconPosition: 'left' },
      slots: { default: '新增警务服务' },
    });

    const icon = wrapper.get('.lx-icon');
    expect(icon.attributes('data-icon-name')).toBe('plus');
    // 前置图标走 EP icon 槽（loading 时由内核替换为 spinner）
    expect(wrapper.find('.el-button [data-icon-name="plus"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders the trailing icon inside the label row for iconPosition="right"', () => {
    const wrapper = mount(LxButton, {
      props: { icon: 'chevron-right', iconPosition: 'right' },
      slots: { default: '下一步' },
    });

    const trailing = wrapper.get('.lx-btn__icon-right');
    expect(trailing.attributes('data-icon-name')).toBe('chevron-right');
    wrapper.unmount();
  });

  it('keeps the trailing icon while loading to avoid the label shifting sideways', async () => {
    // loading 时 spinner 由前置 icon 槽插入，后置图标需保留占位防止文字横向跳动
    const wrapper = mount(LxButton, {
      props: { icon: 'chevron-right', iconPosition: 'right', loading: false },
      slots: { default: '下一步' },
    });

    await wrapper.setProps({ loading: true });
    expect(wrapper.find('.lx-btn__icon-right').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders an icon-only text button without an empty label node', () => {
    const wrapper = mount(LxButton, {
      props: { type: 'text', icon: 'refresh', iconPosition: 'left' },
      attrs: { 'aria-label': '刷新数据' },
    });

    expect(wrapper.find('.lx-btn__label').exists()).toBe(false);
    expect(wrapper.get('.lx-icon').attributes('data-icon-name')).toBe('refresh');
    // attrs 透传到内核 button，纯图标形态依赖调用方提供可访问名称
    expect(wrapper.attributes('aria-label')).toBe('刷新数据');
    wrapper.unmount();
  });

  it('renders a tooltip carrying the aria-label for icon-only buttons', () => {
    // 纯图标 + aria-label：悬停提示对视觉用户可见（读屏用户仍读 aria-label 本身）
    const wrapper = mount(LxButton, {
      props: { type: 'text', icon: 'refresh' },
      attrs: { 'aria-label': '刷新数据' },
    });
    expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(true);
    wrapper.unmount();

    // 有文字的按钮不挂 tooltip（aria-label 仅服务读屏）
    const labeled = mount(LxButton, {
      props: { type: 'text', icon: 'search' },
      attrs: { 'aria-label': '检索详情' },
      slots: { default: '检索详情' },
    });
    expect(labeled.findComponent({ name: 'ElTooltip' }).exists()).toBe(false);
    labeled.unmount();
  });

  it('does not emit click while disabled', async () => {
    const wrapper = mount(LxButton, {
      props: { type: 'primary', disabled: true },
      slots: { default: '不可操作态' },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
    wrapper.unmount();
  });

  it('emits click for interactive states', async () => {
    const wrapper = mount(LxButton, {
      props: { type: 'primary' },
      slots: { default: '主操作按钮' },
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
    wrapper.unmount();
  });

  it('supports the block layout class and the native type attribute', () => {
    const wrapper = mount(LxButton, {
      props: { block: true, nativeType: 'submit' },
      slots: { default: '块级提交' },
    });

    expect(wrapper.classes()).toContain('lx-btn--block');
    expect(wrapper.attributes('type')).toBe('submit');
    wrapper.unmount();
  });
});
