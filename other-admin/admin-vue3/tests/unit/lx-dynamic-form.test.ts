import { mount } from '@vue/test-utils';
import { LxDynamicForm, type LxDynamicFormSlotProps } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';

describe('LxDynamicForm', () => {
  it('uses schema default values when the controlled model omits a field', () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: {},
        fields: [
          { key: 'name', label: '名称', type: 'input', defaultValue: '默认单位', props: { placeholder: '名称' } },
        ],
      },
    });

    expect(wrapper.get('input[placeholder="名称"]').element.value).toBe('默认单位');
    wrapper.unmount();
  });

  it('renders a 24-column field across the full form width', () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: { name: '' },
        columns: 3,
        fields: [
          { key: 'name', label: '名称', type: 'input', span: 24 },
          { key: 'unit', label: '单位', type: 'input', span: 8 },
          { key: 'contact', label: '联系人', type: 'input', span: 12 },
        ],
      },
    });

    expect(wrapper.findAll('.lx-dynamic-form__item').map((item) => item.element.style.gridColumn)).toEqual([
      '1 / -1',
      'span 1',
      'span 2',
    ]);
    wrapper.unmount();
  });

  it('does not mutate the controlled model when resetting fields', async () => {
    const initialModel = { name: '初始单位' };
    const updatedModel = { name: '临时单位' };
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: initialModel,
        fields: [{ key: 'name', label: '名称', type: 'input' }],
      },
    });

    await wrapper.setProps({ modelValue: updatedModel });
    await nextTick();
    wrapper.vm.resetFields();

    expect(updatedModel.name).toBe('临时单位');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ name: '初始单位' }]);
    wrapper.unmount();
  });

  it('submits schema defaults after successful validation', async () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: {},
        fields: [{ key: 'name', label: '名称', type: 'input', required: true, defaultValue: '默认单位' }],
      },
    });

    await wrapper.vm.validate();

    expect(wrapper.emitted('submit')?.[0]).toEqual([{ name: '默认单位' }]);
    wrapper.unmount();
  });

  it('provides disabled and update behavior to custom field slots', async () => {
    let updateValue: LxDynamicFormSlotProps['update'] = () => undefined;
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: { attachment: '巡逻路线.png' },
        disabled: true,
        fields: [{ key: 'attachment', label: '附件', type: 'upload', slot: 'attachment' }],
      },
      slots: {
        attachment: ({ value, disabled, update }: LxDynamicFormSlotProps) => {
          updateValue = update;
          return h('button', { disabled }, String(value));
        },
      },
    });

    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    expect(wrapper.get('button').text()).toBe('巡逻路线.png');
    updateValue('ignored.png');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await wrapper.setProps({ disabled: false });
    updateValue('巡逻路线-v2.png');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ attachment: '巡逻路线-v2.png' }]);
    wrapper.unmount();
  });
});
