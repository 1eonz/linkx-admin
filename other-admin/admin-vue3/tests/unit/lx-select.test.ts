import { mount } from '@vue/test-utils';
import { ElOption } from 'element-plus';
import { LxSelect } from 'lx-ui';
import { beforeEach, describe, expect, it } from 'vitest';

// EP select 的 popper teleport 到 body 且卸载后节点残留，
// 每用例前清空避免 querySelector 命中旧实例的 popper
beforeEach(() => {
  document.body.innerHTML = '';
});

describe('LxSelect', () => {
  it('renders the lx-select class on the EP kernel root with select semantics', () => {
    const wrapper = mount(LxSelect, {
      slots: { default: '<ElOption label="一级布控" value="1" />' },
      global: { components: { ElOption } },
    });

    // EP 2.14.6 根类契约：el-select + 尺寸档；Lx 锚定类 + 工程档类叠加
    expect(wrapper.classes()).toContain('lx-select');
    expect(wrapper.classes()).toContain('lx-select--md');
    expect(wrapper.classes()).toContain('el-select');
    // a11y：combobox 语义输入框承载键盘可达性（EP 内核契约）
    expect(wrapper.find('.el-select__wrapper').exists()).toBe(true);
    wrapper.unmount();
  });

  it('maps the Lx size scale onto EP kernel size classes', () => {
    const sm = mount(LxSelect, { props: { size: 'sm' } });
    expect(sm.classes()).toContain('el-select--small');
    sm.unmount();

    const lg = mount(LxSelect, { props: { size: 'lg' } });
    expect(lg.classes()).toContain('el-select--large');
    lg.unmount();

    // md（默认）映射 EP default 档：EP 不渲染尺寸修饰类
    const md = mount(LxSelect, { props: { size: 'md' } });
    expect(md.classes()).not.toContain('el-select--small');
    expect(md.classes()).not.toContain('el-select--large');
    md.unmount();
  });

  it('renders options through the default slot and shows the selected label', async () => {
    const wrapper = mount(LxSelect, {
      props: { modelValue: '1' },
      slots: {
        default: ['<ElOption label="一级布控" value="1" />', '<ElOption label="二级布控" value="2" />'],
      },
      global: { components: { ElOption } },
    });

    // EP 2.14.6：选中值经微任务渲染进 selected 标签节点（placeholder 节点承载）
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.find('.el-select__placeholder').text()).toBe('一级布控');
    wrapper.unmount();
  });

  it('emits update:modelValue when an option is picked', async () => {
    const wrapper = mount(LxSelect, {
      props: { modelValue: '' },
      slots: { default: '<ElOption label="二级布控" value="2" />' },
      global: { components: { ElOption } },
      attachTo: document.body,
    });

    await wrapper.find('.el-select__wrapper').trigger('click');
    const items = document.body.querySelectorAll('.lx-select__popper .el-select-dropdown__item');
    expect(items.length).toBe(1);
    items[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2']);
    expect(wrapper.emitted('change')?.[0]).toEqual(['2']);
    wrapper.unmount();
  });

  it('配置式选项重排后保留相同文本值的数字、字符串和布尔类型', async () => {
    const warnings: string[] = [];
    const options = [
      { label: '数字编号', value: 1 },
      { label: '字符串编号', value: '1' },
      { label: '布尔开关', value: true },
      { label: '字符串开关', value: 'true' },
    ];
    const wrapper = mount(LxSelect, {
      props: { options, modelValue: '' },
      attachTo: document.body,
      global: { config: { warnHandler: (message) => warnings.push(message) } },
    });

    await wrapper.setProps({ options: [...options].reverse() });
    await wrapper.find('.el-select__wrapper').trigger('click');
    const items = Array.from(document.body.querySelectorAll('.lx-select__popper .el-select-dropdown__item'));
    expect(items.map((item) => item.textContent?.trim())).toEqual(options.map((option) => option.label).reverse());
    expect(warnings.filter((message) => message.includes('Duplicate keys'))).toEqual([]);

    for (const [index, option] of [...options].reverse().entries()) {
      items[index].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([option.value]);
    }
    wrapper.unmount();
  });

  it('merges the anchor popper class with the host custom popper class', async () => {
    const wrapper = mount(LxSelect, {
      props: { modelValue: '' },
      attrs: { popperClass: 'host-custom-popper' },
      slots: { default: '<ElOption label="一级布控" value="1" />' },
      global: { components: { ElOption } },
      attachTo: document.body,
    });

    await wrapper.find('.el-select__wrapper').trigger('click');
    const popper = document.body.querySelector('.lx-select__popper');
    expect(popper).not.toBeNull();
    // 宿主自定义类被合并保留，而不是被组件锚定类覆盖
    expect(popper!.classList.contains('host-custom-popper')).toBe(true);
    wrapper.unmount();
  });

  it('renders multiple selection as tags (multiple prop contract)', async () => {
    const wrapper = mount(LxSelect, {
      props: { modelValue: ['city'], multiple: true },
      slots: { default: '<ElOption label="市局指挥中心" value="city" />' },
      global: { components: { ElOption } },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    // EP 2.14.6 契约：multiple 时选中项渲染为 el-select__selection 内的 tag
    expect(wrapper.find('.el-select__selection').classes()).toContain('is-near');
    expect(wrapper.find('.el-tag').text()).toBe('市局指挥中心');
    wrapper.unmount();
  });

  it('shows the placeholder text for empty value', () => {
    const wrapper = mount(LxSelect, {
      props: { modelValue: '', placeholder: '请选择布控等级' },
      slots: { default: '<ElOption label="一级布控" value="1" />' },
      global: { components: { ElOption } },
    });

    expect(wrapper.find('.el-select__placeholder').text()).toBe('请选择布控等级');
    wrapper.unmount();
  });

  it('blocks interaction while disabled', async () => {
    const wrapper = mount(LxSelect, {
      props: { modelValue: '1', disabled: true },
      slots: { default: '<ElOption label="一级布控" value="1" />' },
      global: { components: { ElOption } },
      attachTo: document.body,
    });

    // EP 2.14.6 契约：禁用类落在触发器 wrapper 上（根节点无 is-disabled）
    expect(wrapper.find('.el-select__wrapper').classes()).toContain('is-disabled');
    await wrapper.find('.el-select__wrapper').trigger('click');
    // popper 为 persistent 常驻 DOM（teleport 到 body），
    // 禁用时点击不打开：面板保持 display:none 隐藏
    const popper = document.body.querySelector('.lx-select__popper');
    expect(popper).not.toBeNull();
    expect((popper as HTMLElement).style.display).toBe('none');
    wrapper.unmount();
  });

  it('exposes focus and blur methods', () => {
    // 波次 3 同口径：jsdom 不派发 programmatic focus 事件，
    // 仅断言实例方法透传存在（焦点态类留给浏览器 E2E 验收）
    const wrapper = mount(LxSelect);

    expect(wrapper.vm.focus).toBeTypeOf('function');
    expect(wrapper.vm.blur).toBeTypeOf('function');
    wrapper.unmount();
  });
});
