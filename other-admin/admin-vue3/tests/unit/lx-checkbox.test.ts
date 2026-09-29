import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { LxCheckbox, LxCheckboxGroup } from 'lx-ui';
import { describe, expect, it } from 'vitest';

/** 组装"组 + 多项"的测试挂载 */
function mountGroup(options: { modelValue?: string[]; disabled?: boolean; vertical?: boolean } = {}) {
  return mount(LxCheckboxGroup, {
    props: {
      modelValue: options.modelValue ?? [],
      disabled: options.disabled,
      vertical: options.vertical,
    },
    slots: {
      default: () => [
        h(LxCheckbox, { value: 'video' }, { default: () => '视频巡查权限' }),
        h(LxCheckbox, { value: 'dispatch' }, { default: () => '警单流转' }),
        h(LxCheckbox, { value: 'broadcast' }, { default: () => '全网广播调度' }),
      ],
    },
  });
}

describe('LxCheckboxGroup', () => {
  it('renders the group with LxCheckbox children and applies the vertical layout class', () => {
    const wrapper = mountGroup({ vertical: false });

    expect(wrapper.classes()).toContain('lx-checkbox-group');
    expect(wrapper.classes()).not.toContain('lx-checkbox-group--vertical');
    expect(wrapper.findAll('.lx-checkbox.el-checkbox')).toHaveLength(3);
    wrapper.unmount();

    const vertical = mountGroup({ vertical: true });
    expect(vertical.classes()).toContain('lx-checkbox-group--vertical');
    vertical.unmount();
  });

  it('marks pre-checked items through the kernel is-checked class', () => {
    const wrapper = mountGroup({ modelValue: ['video'] });

    const [first, second] = wrapper.findAll('.lx-checkbox');
    expect(first?.classes()).toContain('is-checked');
    expect(second?.classes()).not.toContain('is-checked');
    wrapper.unmount();
  });

  it('appends the value to the model array on toggle', async () => {
    const wrapper = mount(LxCheckboxGroup, {
      props: { modelValue: ['video'] },
      slots: {
        default: () => [
          h(LxCheckbox, { value: 'video' }, { default: () => '视频巡查权限' }),
          h(LxCheckbox, { value: 'dispatch' }, { default: () => '警单流转' }),
        ],
      },
    });

    // 组内勾选走 vModelCheckbox 数组契约：change 后集合追加该值
    await wrapper.findAll('input[type="checkbox"]')[1]?.setValue(true);

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['video', 'dispatch']]);
    wrapper.unmount();
  });

  it('blocks toggling while the whole group is disabled', async () => {
    const wrapper = mount(LxCheckboxGroup, {
      props: { modelValue: [], disabled: true },
      slots: {
        default: () => [h(LxCheckbox, { value: 'video' }, { default: () => '视频巡查权限' })],
      },
    });

    // EP 契约：组禁用经 provide 传导单项根类 is-disabled 与 input disabled 属性
    expect(wrapper.find('.lx-checkbox').classes()).toContain('is-disabled');
    const input = wrapper.find('input[type="checkbox"]');
    expect(input.attributes('disabled')).toBeDefined();
    await input.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });
});

describe('LxCheckbox', () => {
  it('toggles the standalone boolean model', async () => {
    const wrapper = mount(LxCheckbox, {
      props: { modelValue: false },
      slots: { default: () => '已知晓涉密核验义务' },
    });

    expect(wrapper.classes()).toContain('lx-checkbox');
    await wrapper.find('input[type="checkbox"]').setValue(true);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true]);
    wrapper.unmount();
  });

  it('renders the indeterminate dash state without changing the value', () => {
    const wrapper = mount(LxCheckbox, {
      props: { modelValue: false, indeterminate: true },
      slots: { default: () => '警单流转 (部分下属权限)' },
    });

    // EP 契约（2.14.x 一致）：is-indeterminate 落在内层 el-checkbox__input 而非根元素
    expect(wrapper.find('.el-checkbox__input').classes()).toContain('is-indeterminate');
    // 半选仅视觉表达（横杠），不改值：modelValue 保持 false
    expect(wrapper.props('modelValue')).toBe(false);
    wrapper.unmount();
  });

  it('falls back to the label prop as the option value (EP legacy contract)', () => {
    const wrapper = mount(LxCheckboxGroup, {
      props: { modelValue: ['video'] },
      slots: {
        default: () => [
          h(LxCheckbox, { label: 'video' }, { default: () => '视频巡查权限' }),
          h(LxCheckbox, { label: 'broadcast' }, { default: () => '全网广播调度' }),
        ],
      },
    });

    const [first, second] = wrapper.findAll('.lx-checkbox');
    expect(first?.classes()).toContain('is-checked');
    expect(second?.classes()).not.toContain('is-checked');
    wrapper.unmount();
  });

  it('marks the disabled state (specimen 04 approval-required row)', () => {
    const wrapper = mount(LxCheckbox, {
      props: { value: 'cross', label: '重特大警情跨区移送 (需支队审批)', disabled: true },
    });

    expect(wrapper.classes()).toContain('is-disabled');
    wrapper.unmount();
  });
});
