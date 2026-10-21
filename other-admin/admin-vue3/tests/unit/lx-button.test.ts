import { mount } from '@vue/test-utils';
import { ElForm } from 'element-plus';
import { LxButton, type LxButtonSize, type LxButtonType } from 'lx-ui';
import { createIconTooltipController } from 'lx-ui/src/components/LxButton/icon-tooltip-coordinator';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

const TYPES: LxButtonType[] = ['primary', 'success', 'warning', 'danger', 'default', 'text'];

const SIZES: LxButtonSize[] = ['sm', 'md', 'lg'];

/** EP 内核档位映射：Lx 工程档名 sm/md/lg → small/default/large */
const EP_SIZE: Record<LxButtonSize, string> = {
  sm: 'el-button--small',
  md: 'el-button--default',
  lg: 'el-button--large',
};

describe('LxButton', () => {
  it('继承父表单禁用并同步关闭图标提示，恢复后才允许点击', async () => {
    const disabled = ref(false);
    const click = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ElForm, { disabled: disabled.value }, () =>
            h(LxButton, { icon: 'refresh', 'aria-label': '刷新表单', onClick: click }),
          ),
      }),
    );
    try {
      expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(true);
      disabled.value = true;
      await nextTick();
      expect(wrapper.get('button').attributes('disabled')).toBeDefined();
      expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(false);
      await wrapper.get('button').trigger('click');
      expect(click).not.toHaveBeenCalled();
      disabled.value = false;
      await nextTick();
      expect(wrapper.get('button').attributes('disabled')).toBeUndefined();
      await wrapper.get('button').trigger('click');
      expect(click).toHaveBeenCalledTimes(1);
    } finally {
      wrapper.unmount();
    }
  });

  it('显式 false 保留覆盖父表单禁用的内核契约', async () => {
    const click = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ElForm, { disabled: true }, () => h(LxButton, { disabled: false, onClick: click }, () => '返回')),
      }),
    );
    try {
      expect(wrapper.get('button').attributes('disabled')).toBeUndefined();
      await wrapper.get('button').trigger('click');
      expect(click).toHaveBeenCalledTimes(1);
    } finally {
      wrapper.unmount();
    }
  });

  it('动态添加或移除文字插槽时同步纯图标布局和提示', async () => {
    const withText = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            LxButton,
            { icon: 'refresh', 'aria-label': '刷新动态数据' },
            withText.value ? { default: () => '刷新动态数据' } : {},
          ),
      }),
    );
    try {
      const button = wrapper.findComponent(LxButton);
      expect(button.classes()).toContain('lx-btn--icon-only');
      withText.value = true;
      await nextTick();
      expect(button.text()).toBe('刷新动态数据');
      expect(button.classes()).not.toContain('lx-btn--icon-only');
      expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(false);
      withText.value = false;
      await nextTick();
      expect(button.classes()).toContain('lx-btn--icon-only');
      expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(true);
    } finally {
      wrapper.unmount();
    }
  });

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

  it('keeps aria-busy true while loading even when attrs provides false', () => {
    const wrapper = mount(LxButton, {
      props: { loading: true },
      attrs: { 'aria-busy': 'false' },
      slots: { default: '正在提交' },
    });

    expect(wrapper.attributes('aria-busy')).toBe('true');
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

  it('renders an icon-only text button without an empty label node and applies icon-only geometry', () => {
    const wrapper = mount(LxButton, {
      props: { type: 'text', icon: 'refresh', iconPosition: 'left' },
      attrs: { 'aria-label': '刷新数据' },
    });

    expect(wrapper.find('.lx-btn__label').exists()).toBe(false);
    expect(wrapper.get('.lx-icon').attributes('data-icon-name')).toBe('refresh');
    expect(wrapper.classes()).toContain('lx-btn--icon-only');
    // attrs 透传到内核 button，纯图标形态依赖调用方提供可访问名称
    expect(wrapper.attributes('aria-label')).toBe('刷新数据');
    wrapper.unmount();
  });

  it('marks the default icon-only button and preserves its accessible name', () => {
    const wrapper = mount(LxButton, {
      props: { type: 'default', icon: 'refresh' },
      attrs: { 'aria-label': '刷新数据' },
    });

    expect(wrapper.classes()).toContain('lx-btn--icon-only');
    expect(wrapper.attributes('aria-label')).toBe('刷新数据');
    expect(wrapper.find('.lx-btn__label').exists()).toBe(false);
    wrapper.unmount();
  });

  it('updates the icon-only tooltip when aria-label is added, changed, or removed', async () => {
    const label = ref<string | undefined>(undefined);
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(LxButton, {
              type: 'text',
              icon: 'refresh',
              'aria-label': label.value,
            });
        },
      }),
    );
    const button = wrapper.get('button');

    expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(false);

    label.value = '刷新数据';
    await nextTick();
    await nextTick();
    expect(button.attributes('aria-label')).toBe('刷新数据');
    expect(wrapper.findComponent({ name: 'ElTooltip' }).props('content')).toBe('刷新数据');

    label.value = '同步数据';
    await nextTick();
    await nextTick();
    expect(button.attributes('aria-label')).toBe('同步数据');
    expect(wrapper.findComponent({ name: 'ElTooltip' }).props('content')).toBe('同步数据');

    label.value = undefined;
    await nextTick();
    await nextTick();
    expect(button.attributes('aria-label')).toBeUndefined();
    expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(false);
    wrapper.unmount();
  });

  it('shows a newly available tooltip for an already hovered and focused button', async () => {
    vi.useFakeTimers();
    const label = ref<string | undefined>(undefined);
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(LxButton, {
              type: 'text',
              icon: 'refresh',
              'aria-label': label.value,
            });
        },
      }),
      { attachTo: document.body },
    );
    const button = wrapper.get('button');

    try {
      button.element.focus();
      await nextTick();
      await button.trigger('pointerenter', { pointerType: 'mouse' });
      label.value = '刷新数据';
      await nextTick();
      await nextTick();

      const tooltip = wrapper.findComponent({ name: 'ElTooltip' });
      expect(tooltip.exists()).toBe(true);
      expect(tooltip.props('visible')).toBe(false);

      await vi.advanceTimersByTimeAsync(200);
      await nextTick();
      expect(tooltip.props('visible')).toBe(true);

      await button.trigger('pointerleave', { pointerType: 'mouse' });
      expect(tooltip.props('visible')).toBe(true);

      await button.trigger('blur');
      expect(tooltip.props('visible')).toBe(false);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it('shows a newly available tooltip for an already hovered button without focus', async () => {
    vi.useFakeTimers();
    const label = ref<string | undefined>(undefined);
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(LxButton, {
              type: 'text',
              icon: 'refresh',
              'aria-label': label.value,
            });
        },
      }),
    );
    const button = wrapper.get('button');

    try {
      await button.trigger('pointerenter', { pointerType: 'mouse' });
      label.value = '刷新数据';
      await nextTick();
      await nextTick();

      const tooltip = wrapper.findComponent({ name: 'ElTooltip' });
      expect(tooltip.exists()).toBe(true);
      await vi.advanceTimersByTimeAsync(200);
      await nextTick();
      expect(tooltip.props('visible')).toBe(true);

      await button.trigger('pointerleave', { pointerType: 'mouse' });
      expect(tooltip.props('visible')).toBe(false);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it('switches icon-only geometry while loading text is shown', async () => {
    const wrapper = mount(LxButton, {
      props: { icon: 'refresh', loading: false, loadingText: '正在刷新' },
      attrs: { 'aria-label': '刷新数据' },
    });

    expect(wrapper.classes()).toContain('lx-btn--icon-only');
    await wrapper.setProps({ loading: true });
    expect(wrapper.classes()).not.toContain('lx-btn--icon-only');
    expect(wrapper.get('.lx-btn__label').text()).toBe('正在刷新');
    wrapper.unmount();
  });

  it('coordinates icon-only tooltips across buttons and restores the focused hint after hover', async () => {
    vi.useFakeTimers();
    const wrapper = mount(LxButton, {
      props: { type: 'text', icon: 'refresh' },
      attrs: { 'aria-label': '刷新数据' },
      attachTo: document.body,
    });
    const hovered = mount(LxButton, {
      props: { type: 'text', icon: 'close' },
      attrs: { 'aria-label': '关闭筛选' },
      attachTo: document.body,
    });
    const focusedTooltip = wrapper.findComponent({ name: 'ElTooltip' });
    const hoveredTooltip = hovered.findComponent({ name: 'ElTooltip' });

    try {
      expect(focusedTooltip.props('trigger')).toEqual([]);
      expect(focusedTooltip.props('triggerKeys')).toEqual([]);
      expect(focusedTooltip.props('visible')).toBe(false);

      wrapper.get('button').element.focus();
      await nextTick();
      await vi.advanceTimersByTimeAsync(200);
      await nextTick();
      expect(focusedTooltip.props('visible')).toBe(true);

      await hovered.get('button').trigger('pointerenter', { pointerType: 'mouse' });
      await vi.advanceTimersByTimeAsync(200);
      await nextTick();
      expect({
        focused: focusedTooltip.props('visible'),
        hovered: hoveredTooltip.props('visible'),
      }).toEqual({ focused: false, hovered: true });

      await hovered.get('button').trigger('pointerleave', { pointerType: 'mouse' });
      await vi.advanceTimersByTimeAsync(200);
      await nextTick();
      expect(focusedTooltip.props('visible')).toBe(true);
      expect(hoveredTooltip.props('visible')).toBe(false);
    } finally {
      wrapper.unmount();
      hovered.unmount();
      vi.useRealTimers();
    }

    // 有文字的按钮不挂 tooltip（aria-label 仅服务读屏）。
    const labeled = mount(LxButton, {
      props: { type: 'text', icon: 'search' },
      attrs: { 'aria-label': '检索详情' },
      slots: { default: '检索详情' },
    });
    expect(labeled.findComponent({ name: 'ElTooltip' }).exists()).toBe(false);
    labeled.unmount();
  });

  it('closes the focused icon tooltip with Escape and shows it again after refocus', async () => {
    vi.useFakeTimers();
    const wrapper = mount(LxButton, {
      props: { type: 'text', icon: 'refresh' },
      attrs: { 'aria-label': '刷新数据' },
      attachTo: document.body,
    });
    const button = wrapper.get('button');
    const tooltip = wrapper.findComponent({ name: 'ElTooltip' });

    try {
      button.element.focus();
      await nextTick();
      await vi.advanceTimersByTimeAsync(200);
      await nextTick();
      expect(tooltip.props('visible')).toBe(true);

      await button.trigger('keydown', { key: 'Escape' });
      await nextTick();
      expect(tooltip.props('visible')).toBe(false);
      expect(document.activeElement).toBe(button.element);

      button.element.blur();
      await nextTick();
      button.element.focus();
      await nextTick();
      await vi.advanceTimersByTimeAsync(200);
      await nextTick();
      expect(tooltip.props('visible')).toBe(true);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it('keeps the hovered hint when another button receives focus', async () => {
    vi.useFakeTimers();
    const hovered = createIconTooltipController();
    const focused = createIconTooltipController();

    try {
      hovered.mouseEnter();
      focused.focus();
      await vi.advanceTimersByTimeAsync(200);

      expect(hovered.visible.value).toBe(true);
      expect(focused.visible.value).toBe(false);

      focused.blur();
      expect(hovered.visible.value).toBe(true);

      hovered.focus();
      hovered.blur();
      expect(hovered.visible.value).toBe(true);
    } finally {
      hovered.clear();
      focused.clear();
      vi.useRealTimers();
    }
  });

  it('isolates icon hints between documents in the same runtime', async () => {
    vi.useFakeTimers();
    const mainDocument = document.implementation.createHTMLDocument('主文档');
    const frameDocument = document.implementation.createHTMLDocument('子文档');
    const main = createIconTooltipController();
    const frame = createIconTooltipController();

    try {
      main.bindDocument(mainDocument);
      frame.bindDocument(frameDocument);
      main.mouseEnter();
      frame.mouseEnter();
      await vi.advanceTimersByTimeAsync(200);

      expect(main.visible.value).toBe(true);
      expect(frame.visible.value).toBe(true);
    } finally {
      main.clear();
      frame.clear();
      vi.useRealTimers();
    }
  });

  it('binds iframe tooltips to their own document and detects keyboard focus across realms', async () => {
    vi.useFakeTimers();
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const frameDocument = frame.contentDocument;
    if (!frameDocument?.body) throw new Error('iframe 文档未创建 body');

    const main = mount(LxButton, {
      props: { type: 'text', icon: 'refresh' },
      attrs: { 'aria-label': '主文档刷新' },
      attachTo: document.body,
    });
    const insideFrame = mount(LxButton, {
      props: { type: 'text', icon: 'refresh' },
      attrs: { 'aria-label': '子文档刷新' },
      attachTo: frameDocument.body,
    });

    try {
      await main.get('button').trigger('pointerenter', { pointerType: 'mouse' });
      await insideFrame.get('button').trigger('pointerenter', { pointerType: 'mouse' });
      await vi.advanceTimersByTimeAsync(200);

      expect(main.findComponent({ name: 'ElTooltip' }).props('visible')).toBe(true);
      expect(insideFrame.findComponent({ name: 'ElTooltip' }).props('visible')).toBe(true);
      expect(main.findComponent({ name: 'ElTooltip' }).props('appendTo')).toBe(document.body);
      expect(insideFrame.findComponent({ name: 'ElTooltip' }).props('appendTo')).toBe(frameDocument.body);

      await main.get('button').trigger('pointerleave');
      await insideFrame.get('button').trigger('pointerleave');
      await vi.runOnlyPendingTimersAsync();

      const frameButton = insideFrame.get('button').element;
      const matches = vi.spyOn(frameButton, 'matches').mockReturnValue(true);
      await insideFrame.get('button').trigger('focus');
      await vi.advanceTimersByTimeAsync(200);
      await nextTick();

      expect(matches).toHaveBeenCalledWith(':focus-visible');
      expect(insideFrame.findComponent({ name: 'ElTooltip' }).props('visible')).toBe(true);
    } finally {
      main.unmount();
      insideFrame.unmount();
      frame.remove();
      vi.useRealTimers();
    }
  });

  it('closes a keyboard tooltip when touch presses the already focused button', async () => {
    vi.useFakeTimers();
    const wrapper = mount(LxButton, {
      props: { type: 'text', icon: 'refresh' },
      attrs: { 'aria-label': '刷新数据' },
      attachTo: document.body,
    });
    const button = wrapper.get('button');
    const matches = vi.spyOn(button.element, 'matches').mockReturnValue(true);
    const tooltip = wrapper.findComponent({ name: 'ElTooltip' });

    try {
      button.element.focus();
      await nextTick();
      await vi.advanceTimersByTimeAsync(200);
      expect(tooltip.props('visible')).toBe(true);

      await button.trigger('pointerdown', { pointerType: 'touch' });
      await nextTick();
      expect(tooltip.props('visible')).toBe(false);
      expect(document.activeElement).toBe(button.element);
      expect(matches).toHaveBeenCalledWith(':focus-visible');

      await button.trigger('pointerup', { pointerType: 'touch' });
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it('rebinds theme observation after the button moves into a new HUD ancestor', async () => {
    vi.useFakeTimers();
    const wrapper = mount(LxButton, {
      props: { type: 'text', icon: 'refresh' },
      attrs: { 'aria-label': '刷新数据' },
      attachTo: document.body,
    });
    const button = wrapper.get('button');
    vi.spyOn(button.element, 'matches').mockReturnValue(true);
    const tooltip = wrapper.findComponent({ name: 'ElTooltip' });
    const hud = document.createElement('div');
    hud.className = 'lx-theme-hud';

    try {
      await button.trigger('focus');
      await vi.advanceTimersByTimeAsync(200);
      expect(tooltip.props('popperClass')).toBe('lx-button-icon-tooltip');

      document.body.append(hud);
      hud.append(button.element);
      await nextTick();
      await Promise.resolve();
      expect(tooltip.props('popperClass')).toBe('lx-button-icon-tooltip lx-theme-hud');

      vi.useRealTimers();
      hud.classList.remove('lx-theme-hud');
      await new Promise((resolve) => setTimeout(resolve, 0));
      await nextTick();
      expect(tooltip.props('popperClass')).toBe('lx-button-icon-tooltip');
    } finally {
      wrapper.unmount();
      hud.remove();
      vi.useRealTimers();
    }
  });

  it('does not register a theme observer when the button has no icon tooltip', async () => {
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    const wrapper = mount(LxButton, {
      props: { type: 'primary' },
      slots: { default: '保存' },
      attachTo: document.body,
    });

    try {
      await nextTick();
      const themeObservations = observe.mock.calls.filter(([, options]) => options.attributeFilter?.includes('class'));
      expect(themeObservations).toHaveLength(0);
    } finally {
      wrapper.unmount();
      observe.mockRestore();
    }
  });

  it('does not rebuild the theme observer for an unrelated body portal', async () => {
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    const wrapper = mount(LxButton, {
      props: { type: 'text', icon: 'refresh' },
      attrs: { 'aria-label': '刷新数据' },
      attachTo: document.body,
    });
    const portal = document.createElement('div');

    try {
      await nextTick();
      const themeObservationCount = observe.mock.calls.filter(([, options]) =>
        options.attributeFilter?.includes('class'),
      ).length;
      expect(themeObservationCount).toBeGreaterThan(0);

      document.body.append(portal);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const nextThemeObservationCount = observe.mock.calls.filter(([, options]) =>
        options.attributeFilter?.includes('class'),
      ).length;
      expect(nextThemeObservationCount).toBe(themeObservationCount);
    } finally {
      wrapper.unmount();
      portal.remove();
      observe.mockRestore();
    }
  });

  it('does not show icon tooltip for touch focus but keeps keyboard focus support', async () => {
    vi.useFakeTimers();
    const wrapper = mount(LxButton, {
      props: { icon: 'refresh' },
      attrs: { 'aria-label': '刷新数据' },
    });
    const button = wrapper.get('button');
    const matches = vi.spyOn(button.element, 'matches').mockReturnValue(true);

    try {
      await button.trigger('pointerdown', { pointerType: 'touch' });
      await button.trigger('focus');
      await vi.advanceTimersByTimeAsync(200);

      expect(matches).not.toHaveBeenCalled();
      expect(wrapper.findComponent({ name: 'ElTooltip' }).props('visible')).toBe(false);

      await button.trigger('pointerup', { pointerType: 'touch' });
      await button.trigger('blur');
      await button.trigger('focus');
      await vi.advanceTimersByTimeAsync(200);

      expect(matches).toHaveBeenCalledWith(':focus-visible');
      expect(wrapper.findComponent({ name: 'ElTooltip' }).props('visible')).toBe(true);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it('removes the icon-only tooltip while the button is disabled or loading', async () => {
    const wrapper = mount(LxButton, {
      props: { icon: 'refresh' },
      attrs: { 'aria-label': '刷新数据' },
    });

    expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(true);

    await wrapper.setProps({ disabled: true });
    expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(false);

    await wrapper.setProps({ disabled: false, loading: true });
    expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(false);

    await wrapper.setProps({ loading: false });
    expect(wrapper.findComponent({ name: 'ElTooltip' }).exists()).toBe(true);
    wrapper.unmount();
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
