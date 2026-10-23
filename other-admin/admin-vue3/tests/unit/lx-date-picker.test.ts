import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { ElDatePicker, type DateCell, type PopperCoreConfigProps } from 'element-plus';
import { LxDatePicker } from 'lx-ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref } from 'vue';

// EP date-picker 的 popper teleport 到 body 且卸载后节点残留，
// 每用例前清空避免 querySelector 命中旧实例的 popper
beforeEach(() => {
  document.body.innerHTML = '';
  vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
});

describe('LxDatePicker', () => {
  it('合并默认边界与宿主 Popper modifier，并保留回调、禁用设置和动态更新', async () => {
    const offset = vi.fn(() => [0, 24]);
    const modifierFn = vi.fn();
    const onFirstUpdate = vi.fn();
    const config = ref<PopperCoreConfigProps['popperOptions']>({
      strategy: 'fixed',
      onFirstUpdate,
      modifiers: [
        { name: 'offset', options: { offset } },
        { name: 'flip', enabled: false, options: { fallbackPlacements: ['top'] } },
        { name: 'preventOverflow', options: { altAxis: true } },
        { name: 'host-modifier', enabled: true, phase: 'main', fn: modifierFn },
      ],
    });
    const wrapper = mount({
      render: () => h(LxDatePicker, { modelValue: '', 'popper-options': config.value }),
    });

    try {
      const kernel = wrapper.findComponent(ElDatePicker);
      const initial = kernel.props('popperOptions');
      expect(initial.strategy).toBe('fixed');
      expect(initial.onFirstUpdate).toBe(onFirstUpdate);
      expect(initial.modifiers?.find((modifier) => modifier.name === 'offset')?.options?.offset).toBe(offset);
      expect(initial.modifiers?.find((modifier) => modifier.name === 'flip')).toMatchObject({
        enabled: false,
        options: { padding: 8, fallbackPlacements: ['top'] },
      });
      expect(initial.modifiers?.find((modifier) => modifier.name === 'preventOverflow')?.options).toEqual({
        padding: 8,
        altAxis: true,
      });
      expect(initial.modifiers?.find((modifier) => modifier.name === 'host-modifier')?.fn).toBe(modifierFn);

      config.value = { modifiers: [{ name: 'preventOverflow', options: { padding: 16 } }] };
      await nextTick();
      const updated = kernel.props('popperOptions');
      expect(updated.modifiers?.find((modifier) => modifier.name === 'preventOverflow')?.options?.padding).toBe(16);
      expect(updated.modifiers?.some((modifier) => modifier.name === 'host-modifier')).toBe(false);
      expect(updated.modifiers?.find((modifier) => modifier.name === 'flip')?.options?.padding).toBe(8);
    } finally {
      wrapper.unmount();
    }
  });

  it('上方 Popper 偏移读取各实例 scroll-margin，下方保留宿主 offset', () => {
    const wrapper = mount({
      render: () =>
        h('div', [
          h(LxDatePicker, { modelValue: '', style: 'scroll-margin-block-start: 28px', offset: 14 }),
          h(LxDatePicker, { modelValue: '', style: 'scroll-margin-block-start: 44px' }),
        ]),
    });
    try {
      const kernels = wrapper.findAllComponents(ElDatePicker);
      const first = kernels[0].props('popperOptions').modifiers?.find((modifier) => modifier.name === 'offset')
        ?.options?.offset;
      const second = kernels[1].props('popperOptions').modifiers?.find((modifier) => modifier.name === 'offset')
        ?.options?.offset;
      expect(typeof first).toBe('function');
      expect(typeof second).toBe('function');
      expect(first({ placement: 'top-start' })).toEqual([0, 36]);
      expect(first({ placement: 'bottom-start' })).toEqual([0, 14]);
      expect(second({ placement: 'top-start' })).toEqual([0, 52]);
    } finally {
      wrapper.unmount();
    }
  });

  it('短屏打开前合并触发器 scroll-margin 与滚动容器 scroll-padding', async () => {
    const originalHeight = window.innerHeight;
    vi.stubGlobal('innerHeight', 375);
    const scrollBy = vi.fn();
    const wrapper = mount(
      {
        render: () =>
          h('div', { style: 'overflow-y: auto; scroll-padding-block-start: 12px' }, [
            h(LxDatePicker, { modelValue: '', style: 'scroll-margin-block-start: 84px' }),
          ]),
      },
      { attachTo: document.body },
    );
    try {
      const container = wrapper.element;
      Object.defineProperties(container, {
        scrollHeight: { configurable: true, value: 1000 },
        clientHeight: { configurable: true, value: 300 },
        scrollBy: { configurable: true, value: scrollBy },
      });
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 20, 300, 300));
      const trigger = wrapper.find('.lx-date-picker').element;
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 300, 280, 44));
      await wrapper.find('input').trigger('click');
      expect(scrollBy).toHaveBeenCalledWith({ top: 184, behavior: 'instant' });
      expect(window.scrollBy).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
      vi.stubGlobal('innerHeight', originalHeight);
    }
  });

  it('滚动提示按真实余量隐藏与恢复，内容缩短及关闭后清理', async () => {
    const originalHeight = window.innerHeight;
    const originalResizeObserver = globalThis.ResizeObserver;
    const observers: PanelResizeObserver[] = [];
    class PanelResizeObserver implements ResizeObserver {
      readonly targets = new Set<Element>();
      readonly observe = vi.fn((target: Element) => this.targets.add(target));
      readonly unobserve = vi.fn((target: Element) => this.targets.delete(target));
      readonly disconnect = vi.fn();
      constructor(readonly callback: ResizeObserverCallback) {
        observers.push(this);
      }
    }
    vi.stubGlobal('innerHeight', 375);
    vi.stubGlobal('ResizeObserver', PanelResizeObserver);
    const wrapper = mount(LxDatePicker, {
      props: { modelValue: '' },
      attachTo: document.body,
      // visible-change 由真实过渡钩子发出；默认 Transition stub 不会执行该钩子。
      global: { stubs: { transition: false } },
    });
    let unmounted = false;
    try {
      // 使用内核真实点击入口打开面板；focus 只更新焦点状态，不保证弹出日期面板。
      const input = wrapper.find('input');
      input.element.focus();
      await input.trigger('keydown', { key: 'ArrowDown', code: 'ArrowDown' });
      await vi.waitFor(() => expect(document.querySelector('.lx-date-picker__scroll-cue')).not.toBeNull());
      const popper = document.querySelector<HTMLElement>('.lx-date-picker__popper')!;
      const panel = popper.querySelector<HTMLElement>('.el-picker-panel')!;
      const cue = popper.querySelector<HTMLElement>('.lx-date-picker__scroll-cue')!;
      const observer = observers.find(
        (observer) =>
          observer.targets.has(panel) && Array.from(panel.children).every((child) => observer.targets.has(child)),
      );
      expect(observer).toBeDefined();
      let contentHeight = 400;
      Object.defineProperties(panel, {
        scrollHeight: { configurable: true, get: () => contentHeight },
        clientHeight: { configurable: true, value: 240 },
      });
      panel.dispatchEvent(new Event('scroll'));
      expect(cue.hidden).toBe(false);
      expect(cue.getAttribute('aria-hidden')).toBe('true');
      expect(cue.querySelector('[data-icon-name="chevron-down"]')).not.toBeNull();
      expect(popper.classList.contains('lx-date-picker__popper--scrollable')).toBe(true);

      panel.scrollTop = 160;
      panel.dispatchEvent(new Event('scroll'));
      expect(cue.hidden).toBe(true);
      panel.scrollTop = 20;
      panel.dispatchEvent(new Event('scroll'));
      expect(cue.hidden).toBe(false);
      contentHeight = 200;
      observer!.callback([], observer!);
      expect(cue.hidden).toBe(true);
      expect(popper.classList.contains('lx-date-picker__popper--scrollable')).toBe(false);
      contentHeight = 400;
      observer!.callback([], observer!);
      expect(cue.hidden).toBe(false);
      expect(popper.classList.contains('lx-date-picker__popper--scrollable')).toBe(true);

      await input.trigger('keydown', { key: 'Escape', code: 'Escape' });
      await vi.waitFor(() => expect(popper.querySelector('.lx-date-picker__scroll-cue')).toBeNull());
      expect(observer!.disconnect).toHaveBeenCalledOnce();
      panel.dispatchEvent(new Event('scroll'));
      observer!.callback([], observer!);
      expect(popper.querySelector('.lx-date-picker__scroll-cue')).toBeNull();

      input.element.blur();
      input.element.focus();
      await input.trigger('keydown', { key: 'ArrowDown', code: 'ArrowDown' });
      await vi.waitFor(() => expect(popper.querySelector('.lx-date-picker__scroll-cue')).not.toBeNull());
      const reopenedObserver = observers.findLast((observer) => observer.targets.has(panel));
      expect(reopenedObserver).not.toBe(observer);
      wrapper.unmount();
      unmounted = true;
      expect(reopenedObserver!.disconnect).toHaveBeenCalledOnce();
      reopenedObserver!.callback([], reopenedObserver!);
      expect(popper.querySelector('.lx-date-picker__scroll-cue')).toBeNull();
    } finally {
      if (!unmounted) wrapper.unmount();
      vi.stubGlobal('innerHeight', originalHeight);
      vi.stubGlobal('ResizeObserver', originalResizeObserver);
    }
  });

  /**
   * EP 2.14.6 契约：date-picker 内核根为 ElTooltip 包装（Fragment 根），
   * mount 包装层 classes() 恒为空；锚定类 lx-date-picker 落在触发器
   * （单值 el-input / 区间 el-range-editor）上，经 find 断言。
   */
  it('renders the lx-date-picker anchor class on the single trigger', () => {
    const wrapper = mount(LxDatePicker, { props: { modelValue: '' } });

    const trigger = wrapper.find('.lx-date-picker');
    expect(trigger.exists()).toBe(true);
    expect(trigger.classes()).toContain('el-date-editor');
    expect(wrapper.find('.el-input__wrapper').exists()).toBe(true);
    wrapper.unmount();
  });

  it('动态更新 popperClass 后同步到已打开的日期弹层', async () => {
    const wrapper = mount(LxDatePicker, {
      props: { modelValue: '2026-09-15', popperClass: 'theme-light' },
      attachTo: document.body,
    });

    try {
      await wrapper.find('input').trigger('click');
      await new Promise((resolve) => setTimeout(resolve, 0));
      const popper = document.body.querySelector('.lx-date-picker__popper');
      expect(popper?.classList.contains('theme-light')).toBe(true);

      await wrapper.setProps({ popperClass: 'lx-theme-hud' });
      await nextTick();
      expect(popper?.classList.contains('lx-theme-hud')).toBe(true);
      expect(popper?.classList.contains('theme-light')).toBe(false);

      await wrapper.setProps({ popperClass: undefined });
      await nextTick();
      expect(popper?.classList.contains('lx-theme-hud')).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it('renders the range editor form with the same anchor class', () => {
    const wrapper = mount(LxDatePicker, {
      props: { type: 'daterange', modelValue: [] },
    });

    // 区间形态：锚定类与 el-input__wrapper 落在同一元素（样式双锚定契约）
    const trigger = wrapper.find('.lx-date-picker');
    expect(trigger.exists()).toBe(true);
    expect(trigger.classes()).toContain('el-range-editor');
    expect(trigger.classes()).toContain('el-input__wrapper');
    wrapper.unmount();
  });

  it('clears a date range to null', async () => {
    const wrapper = mount(LxDatePicker, {
      props: {
        type: 'daterange',
        modelValue: ['2026-10-01', '2026-10-06'],
        valueFormat: 'YYYY-MM-DD',
      },
      attachTo: document.body,
    });

    try {
      await wrapper.find('.el-range-editor').trigger('mouseenter');
      await nextTick();
      const clearIcon = wrapper.find('.el-range__close-icon');

      expect(clearIcon.exists()).toBe(true);
      expect(clearIcon.classes()).not.toContain('el-range__close-icon--hidden');
      await clearIcon.trigger('click');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null]);
    } finally {
      wrapper.unmount();
    }
  });

  it('defaults the range separator to 至 (Chinese contract, EP native is -)', () => {
    const wrapper = mount(LxDatePicker, {
      props: { type: 'daterange', modelValue: [] },
    });

    expect(wrapper.find('.el-range-separator').text()).toBe('至');
    wrapper.unmount();
  });

  it('窄屏默认使用单面板，并允许 singlePanel 显式覆盖', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(max-width: 640px)',
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    });

    const wrapper = mount(LxDatePicker, {
      props: { type: 'daterange', modelValue: [] },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    await input.trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.querySelectorAll('.el-date-table')).toHaveLength(1);

    await wrapper.setProps({ singlePanel: false });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.querySelectorAll('.el-date-table')).toHaveLength(2);

    await wrapper.setProps({ singlePanel: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.querySelectorAll('.el-date-table')).toHaveLength(1);

    wrapper.unmount();
  });

  it('宿主使用英文 locale 时仍显示周一起始且不修改全局 locale', async () => {
    const previousLocale = dayjs.locale();
    dayjs.locale('en');

    try {
      const wrapper = mount(
        {
          render: () =>
            h('div', [
              h(LxDatePicker, { modelValue: '2026-09-15', valueFormat: 'YYYY-MM-DD' }),
              h(LxDatePicker, {
                modelValue: ['2026-09-15', '2026-10-08'],
                type: 'daterange',
                valueFormat: 'YYYY-MM-DD',
              }),
            ]),
        },
        { attachTo: document.body },
      );

      const inputs = wrapper.findAll('input');
      await inputs[0].trigger('click');
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
      const singleDialog = document.body.querySelector('[role="dialog"]');
      const singleHeaders = Array.from(singleDialog?.querySelectorAll('th[scope="col"]') ?? []).map((cell) =>
        cell.textContent?.trim(),
      );
      await inputs[1].trigger('click');
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const dialogs = document.body.querySelectorAll('[role="dialog"]');
      const rangeHeaders = Array.from(dialogs[1]?.querySelectorAll('th[scope="col"]') ?? []).map((cell) =>
        cell.textContent?.trim(),
      );

      expect(singleHeaders).toEqual(weekdays);
      expect(rangeHeaders).toEqual([...weekdays, ...weekdays]);
      expect(dayjs.locale()).toBe('en');
      wrapper.unmount();
    } finally {
      dayjs.locale(previousLocale);
    }
  });

  it('allows overriding the range separator through props', () => {
    const wrapper = mount(LxDatePicker, {
      props: { type: 'daterange', modelValue: [], rangeSeparator: '~' },
    });

    expect(wrapper.find('.el-range-separator').text()).toBe('~');
    wrapper.unmount();
  });

  it('将范围分隔符插槽转发至真实区间触发器', () => {
    const wrapper = mount(LxDatePicker, {
      props: { type: 'daterange', modelValue: [], rangeSeparator: '~' },
      slots: { 'range-separator': '<span data-testid="custom-separator">到</span>' },
    });

    expect(wrapper.find('[data-testid="custom-separator"]').text()).toBe('到');
    expect(wrapper.find('.el-range-separator').exists()).toBe(false);
    wrapper.unmount();
  });

  it('将日期单元和导航插槽转发至真实日期面板', async () => {
    const wrapper = mount(LxDatePicker, {
      props: { modelValue: '2026-09-15', valueFormat: 'YYYY-MM-DD' },
      slots: {
        default: (cell: DateCell) =>
          h('span', { class: 'custom-date-cell', 'data-date': cell.dayjs?.format('YYYY-MM-DD') }, `日期${cell.text}`),
        'prev-month': '<span data-testid="custom-prev-month">前月</span>',
        'next-month': '<span data-testid="custom-next-month">后月</span>',
        'prev-year': '<span data-testid="custom-prev-year">前年</span>',
        'next-year': '<span data-testid="custom-next-year">后年</span>',
      },
      attachTo: document.body,
    });

    await wrapper.find('input').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const cell = document.body.querySelector('.custom-date-cell[data-date="2026-09-15"]');
    expect(cell?.textContent).toBe('日期15');
    for (const name of ['prev-month', 'next-month', 'prev-year', 'next-year']) {
      expect(document.body.querySelector(`[data-testid="custom-${name}"]`)).not.toBeNull();
    }
    wrapper.unmount();
  });

  it('区间成对 id 分别关联开始与结束字段', async () => {
    const wrapper = mount(LxDatePicker, {
      props: { type: 'daterange', modelValue: [] },
      attrs: { id: ['test-range-start', 'test-range-end'] },
    });
    await nextTick();
    expect(wrapper.findAll('input').map((input) => input.attributes('id'))).toEqual([
      'test-range-start',
      'test-range-end',
    ]);
    wrapper.unmount();
  });

  it('相邻区间选择器的两个输入框分别关联各自说明', async () => {
    const wrapper = mount({
      render: () =>
        h('div', [
          h(LxDatePicker, {
            modelValue: [],
            type: 'daterange',
            'aria-describedby': 'first-range-feedback',
          }),
          h(LxDatePicker, {
            modelValue: [],
            type: 'daterange',
            'aria-describedby': 'second-range-feedback',
          }),
        ]),
    });

    await nextTick();
    expect(wrapper.findAll('input').map((input) => input.attributes('aria-describedby'))).toEqual([
      'first-range-feedback',
      'first-range-feedback',
      'second-range-feedback',
      'second-range-feedback',
    ]);
    wrapper.unmount();
  });

  it('maps the Lx size scale onto EP kernel size classes', () => {
    // 单值形态：EP 尺寸档落在 el-input 根（el-input--small/large）
    const sm = mount(LxDatePicker, { props: { size: 'sm', modelValue: '' } });
    expect(sm.find('.lx-date-picker').classes()).toContain('el-input--small');
    sm.unmount();

    const lg = mount(LxDatePicker, { props: { size: 'lg', modelValue: '' } });
    expect(lg.find('.lx-date-picker').classes()).toContain('el-input--large');
    lg.unmount();

    // 区间形态：EP 尺寸档落在 el-range-editor 根
    const smRange = mount(LxDatePicker, {
      props: { type: 'daterange', size: 'sm', modelValue: [] },
    });
    expect(smRange.find('.lx-date-picker').classes()).toContain('el-range-editor--small');
    smRange.unmount();
  });

  it('shows the model value through the format prop (attrs-level contract)', () => {
    const wrapper = mount(LxDatePicker, {
      props: {
        modelValue: new Date(2026, 8, 29),
        format: 'YYYY/MM/DD',
      },
    });

    // format 是声明 prop：显示格式化作用于触发器输入框
    expect(wrapper.find('input').element.value).toBe('2026/09/29');
    wrapper.unmount();
  });

  it('emits update:modelValue with the parsed value on input commit', async () => {
    const wrapper = mount(LxDatePicker, {
      props: { modelValue: '', type: 'date', valueFormat: 'YYYY-MM-DD' },
      attachTo: document.body,
    });

    await wrapper.find('input').setValue('2026-09-29');
    await wrapper.find('input').trigger('blur');

    // EP 内核 blur 后提交解析值并 emit update:modelValue（格式化字符串）
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(String(emitted!.at(-1)![0])).toBe('2026-09-29');
    wrapper.unmount();
  });

  it('blocks interaction while disabled', async () => {
    const wrapper = mount(LxDatePicker, {
      props: { modelValue: '', disabled: true },
      attachTo: document.body,
    });

    expect(wrapper.find('.lx-date-picker').classes()).toContain('is-disabled');
    await wrapper.find('input').trigger('click');
    // popper 为 persistent 常驻 DOM（teleport 到 body），
    // 禁用时点击不打开：面板保持 display:none 隐藏
    const popper = document.body.querySelector('.lx-date-picker__popper');
    expect(popper).not.toBeNull();
    expect((popper as HTMLElement).style.display).toBe('none');
    wrapper.unmount();
  });

  it('keeps the trigger readonly when readonly is set', () => {
    const wrapper = mount(LxDatePicker, {
      props: { modelValue: '', readonly: true },
    });

    // EP 内核契约：readonly 传导为原生 input readonly 属性（可聚焦不可改值）
    expect(wrapper.find('input').attributes('readonly')).toBeDefined();
    wrapper.unmount();
  });

  it('passes undeclared attrs through to the kernel (aria-label)', () => {
    const wrapper = mount(LxDatePicker, {
      props: { modelValue: '' },
      attrs: { 'aria-label': '专项布控日期区间' },
    });

    expect(wrapper.find('input').attributes('aria-label')).toBe('专项布控日期区间');
    wrapper.unmount();
  });

  it('将字段说明关联至日期触发器输入框', () => {
    const wrapper = mount(LxDatePicker, {
      props: { modelValue: '' },
      attrs: { 'aria-describedby': 'date-feedback' },
    });

    expect(wrapper.find('input').attributes('aria-describedby')).toBe('date-feedback');
    wrapper.unmount();
  });

  it('更新或移除字段说明时同步实际输入框属性', async () => {
    const description = ref<string | undefined>('date-feedback');
    const wrapper = mount({
      render: () =>
        h(LxDatePicker, {
          modelValue: '',
          'aria-describedby': description.value,
        }),
    });

    expect(wrapper.find('input').attributes('aria-describedby')).toBe('date-feedback');
    description.value = 'updated-date-feedback';
    await nextTick();
    expect(wrapper.find('input').attributes('aria-describedby')).toBe('updated-date-feedback');

    description.value = undefined;
    await nextTick();
    expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined();
    wrapper.unmount();
  });

  it('相邻日期选择器只关联各自的字段说明', async () => {
    const wrapper = mount({
      render: () =>
        h('div', [
          h(LxDatePicker, {
            modelValue: '',
            'aria-describedby': 'first-date-feedback',
          }),
          h(LxDatePicker, {
            modelValue: '',
            'aria-describedby': 'second-date-feedback',
          }),
        ]),
    });

    await nextTick();
    expect(wrapper.findAll('input').map((input) => input.attributes('aria-describedby'))).toEqual([
      'first-date-feedback',
      'second-date-feedback',
    ]);
    wrapper.unmount();
  });

  it('exposes focus and blur methods', () => {
    // 波次 3 同口径：jsdom 不派发 programmatic focus 事件，
    // 仅断言实例方法透传存在（焦点态类留给浏览器 E2E 验收）
    const wrapper = mount(LxDatePicker, { props: { modelValue: '' } });

    expect(wrapper.vm.focus).toBeTypeOf('function');
    expect(wrapper.vm.blur).toBeTypeOf('function');
    wrapper.unmount();
  });
});
