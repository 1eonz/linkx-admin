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
        adaptive: false,
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

  it('leaves adaptive spans to the container-query CSS rules', () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: { name: '' },
        columns: 2,
        adaptive: true,
        fields: [{ key: 'name', label: '名称', type: 'input', span: 12 }],
      },
    });

    const item = wrapper.get('.lx-dynamic-form__item').element as HTMLElement;
    expect(item.style.gridColumn).toBe('');
    expect(item.style.getPropertyValue('--lx-dynamic-form-span-3')).toBe('2');
    expect(item.style.getPropertyValue('--lx-dynamic-form-span-2')).toBe('1');
    wrapper.unmount();
  });

  it('renders field feedback next to the control and invokes its retry action', async () => {
    let retries = 0;
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: { officer: '' },
        fields: [
          {
            key: 'officer',
            label: '负责人',
            type: 'remote-select',
            feedback: {
              status: 'error',
              message: '候选人员读取失败',
              retry: () => {
                retries += 1;
              },
            },
          },
        ],
      },
    });

    const feedback = wrapper.get('[data-lx-field-feedback]');
    expect(feedback.text()).toContain('候选人员读取失败');
    expect(feedback.attributes('role')).toBe('alert');
    const feedbackId = feedback.attributes('id');
    expect(wrapper.get('.lx-select input').attributes('aria-describedby')).toBe(feedbackId);

    await feedback.get('button').trigger('click');
    expect(retries).toBe(1);
    wrapper.unmount();
  });

  it('uses unique feedback IDs and associates them with controls in each form', () => {
    const fields = [
      {
        key: 'officer.one',
        label: '负责人一',
        type: 'input' as const,
        feedback: { message: '负责人一说明' },
      },
      {
        key: 'officer-one',
        label: '负责人二',
        type: 'input' as const,
        feedback: { message: '负责人二说明' },
      },
    ];
    const createForm = () => h(LxDynamicForm, { modelValue: {}, fields });
    const wrapper = mount({
      render: () => h('div', [createForm(), createForm()]),
    });

    const feedbackIds = wrapper.findAll('[data-lx-field-feedback]').map((feedback) => feedback.attributes('id'));
    const controlIds = wrapper
      .findAll('.lx-dynamic-form__item input')
      .map((input) => input.attributes('aria-describedby'));

    expect(new Set(feedbackIds).size).toBe(4);
    expect(controlIds).toEqual(feedbackIds);
    wrapper.unmount();
  });

  it('passes feedback descriptions to upload and custom slot controls', () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: { image: null },
        fields: [
          {
            key: 'image',
            label: '封面',
            type: 'upload',
            feedback: { message: '封面说明' },
          },
          {
            key: 'attachment',
            label: '附件',
            type: 'slot',
            feedback: { message: '附件说明' },
          },
        ],
      },
      slots: {
        attachment: ({ ariaDescribedBy }: LxDynamicFormSlotProps) =>
          h('input', {
            'data-custom-field-control': '',
            'aria-describedby': ariaDescribedBy,
          }),
      },
    });

    const uploadFeedbackId = wrapper
      .findAll('[data-lx-field-feedback]')
      .find((feedback) => feedback.text().includes('封面说明'))
      ?.attributes('id');
    const uploadTrigger = wrapper.get('.lx-upload__browse');
    expect(uploadTrigger.attributes('aria-describedby')).toBe(uploadFeedbackId);

    const customFeedbackId = wrapper
      .findAll('[data-lx-field-feedback]')
      .find((feedback) => feedback.text().includes('附件说明'))
      ?.attributes('id');
    expect(wrapper.get('[data-custom-field-control]').attributes('aria-describedby')).toBe(customFeedbackId);
    wrapper.unmount();
  });

  it('associates feedback with number, date, switch, and option group controls', async () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: {
          amount: 2,
          dueDate: '2026-10-03',
          enabled: false,
          level: 'normal',
          channels: [],
        },
        fields: [
          {
            key: 'amount',
            label: '数量',
            type: 'number',
            feedback: { message: '数量说明' },
          },
          {
            key: 'dueDate',
            label: '日期',
            type: 'date',
            feedback: { message: '日期说明' },
          },
          {
            key: 'enabled',
            label: '启用',
            type: 'switch',
            feedback: { message: '开关说明' },
          },
          {
            key: 'level',
            label: '等级',
            type: 'radio',
            options: [{ label: '常规', value: 'normal' }],
            feedback: { message: '等级说明' },
          },
          {
            key: 'channels',
            label: '渠道',
            type: 'checkbox',
            options: [{ label: '短信', value: 'sms' }],
            feedback: { message: '渠道说明' },
          },
        ],
      },
    });
    await nextTick();

    const expectControlDescription = (message: string, selector: string): void => {
      const field = wrapper.findAll('.lx-dynamic-form__item').find((item) => item.text().includes(message));
      const feedbackId = field?.find('[data-lx-field-feedback]').attributes('id');
      expect(feedbackId).toBeTruthy();
      expect(field?.get(selector).attributes('aria-describedby')).toBe(feedbackId);
    };

    expectControlDescription('数量说明', '.lx-input-number input');
    expectControlDescription('日期说明', '.lx-date-picker input');
    expectControlDescription('开关说明', '[role="switch"]');
    expectControlDescription('等级说明', '.lx-radio-group[role="radiogroup"]');
    expectControlDescription('渠道说明', '.lx-checkbox-group[role="group"]');
    wrapper.unmount();
  });

  it('keeps date feedback descriptions isolated between sibling fields', async () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: { startDate: '', endDate: '' },
        fields: [
          {
            key: 'startDate',
            label: '开始日期',
            type: 'date',
            feedback: { message: '开始日期说明' },
          },
          {
            key: 'endDate',
            label: '结束日期',
            type: 'date',
            feedback: { message: '结束日期说明' },
          },
        ],
      },
    });
    await nextTick();

    const fields = wrapper.findAll('.lx-dynamic-form__item');
    fields.forEach((field, index) => {
      const feedbackId = field.get('[data-lx-field-feedback]').attributes('id');
      expect(field.get('.lx-date-picker input').attributes('aria-describedby')).toBe(feedbackId);
      expect(fields[1 - index].get('.lx-date-picker input').attributes('aria-describedby')).not.toBe(feedbackId);
    });
    wrapper.unmount();
  });

  it('disables field retry while feedback is loading', async () => {
    let retries = 0;
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: { officer: '' },
        fields: [
          {
            key: 'officer',
            label: '负责人',
            type: 'remote-select',
            feedback: {
              status: 'loading',
              message: '候选人员加载中',
              retry: () => {
                retries += 1;
              },
            },
          },
        ],
      },
    });

    const retryButton = wrapper.get('[data-lx-field-feedback] button');
    expect((retryButton.element as HTMLButtonElement).disabled).toBe(true);
    await retryButton.trigger('click');
    expect(retries).toBe(0);
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

  it('rejects empty checkbox and multiple upload values when required', async () => {
    const checkboxForm = mount(LxDynamicForm, {
      props: {
        modelValue: { channels: [] },
        fields: [
          {
            key: 'channels',
            label: '通知渠道',
            type: 'checkbox',
            required: true,
            options: [{ label: '短信', value: 'sms' }],
          },
        ],
      },
    });

    expect(await checkboxForm.vm.validate()).toBe(false);
    expect(checkboxForm.emitted('submit')).toBeUndefined();
    await checkboxForm.setProps({ modelValue: { channels: ['sms'] } });
    expect(await checkboxForm.vm.validate()).toBe(true);
    checkboxForm.unmount();

    const uploadForm = mount(LxDynamicForm, {
      props: {
        modelValue: { images: [] },
        fields: [
          {
            key: 'images',
            label: '图片',
            type: 'upload',
            required: true,
            props: { multiple: true },
          },
        ],
      },
    });

    expect(await uploadForm.vm.validate()).toBe(false);
    expect(uploadForm.emitted('submit')).toBeUndefined();
    await uploadForm.setProps({ modelValue: { images: ['现场图片.jpg'] } });
    expect(await uploadForm.vm.validate()).toBe(true);
    uploadForm.unmount();
  });

  it('requires switches to match their configured active value', async () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: { enabled: 'off' },
        fields: [
          {
            key: 'enabled',
            label: '启用',
            type: 'switch',
            required: true,
            props: { activeValue: 'on', inactiveValue: 'off' },
          },
        ],
      },
    });

    expect(await wrapper.vm.validate()).toBe(false);
    await wrapper.setProps({ modelValue: { enabled: 'on' } });
    expect(await wrapper.vm.validate()).toBe(true);
    wrapper.unmount();
  });

  it('supports kebab-case active values and defaults required switches to true', async () => {
    const kebabCaseForm = mount(LxDynamicForm, {
      props: {
        modelValue: { enabled: 'off' },
        fields: [
          {
            key: 'enabled',
            label: '启用',
            type: 'switch',
            required: true,
            props: { 'active-value': 'ready', 'inactive-value': 'off' },
          },
        ],
      },
    });

    expect(await kebabCaseForm.vm.validate()).toBe(false);
    await kebabCaseForm.setProps({ modelValue: { enabled: 'ready' } });
    expect(await kebabCaseForm.vm.validate()).toBe(true);
    kebabCaseForm.unmount();

    const defaultActiveValueForm = mount(LxDynamicForm, {
      props: {
        modelValue: { enabled: false },
        fields: [{ key: 'enabled', label: '启用', type: 'switch', required: true }],
      },
    });

    expect(await defaultActiveValueForm.vm.validate()).toBe(false);
    await defaultActiveValueForm.setProps({ modelValue: { enabled: true } });
    expect(await defaultActiveValueForm.vm.validate()).toBe(true);
    defaultActiveValueForm.unmount();
  });

  it('keeps custom field rules alongside generated required rules', async () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: { name: 'blocked' },
        fields: [
          {
            key: 'name',
            label: '名称',
            type: 'input',
            required: true,
            rules: [
              {
                validator: (_rule, value, callback) => {
                  callback(value === 'blocked' ? new Error('名称不可用') : undefined);
                },
              },
            ],
          },
        ],
      },
    });

    expect(await wrapper.vm.validate()).toBe(false);
    await wrapper.setProps({ modelValue: { name: '有效名称' } });
    expect(await wrapper.vm.validate()).toBe(true);
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

  it('treats an empty string as no selected upload file', () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        modelValue: { image: '' },
        fields: [{ key: 'image', label: '封面', type: 'upload' }],
      },
    });

    expect(wrapper.find('.lx-upload__file').exists()).toBe(false);
    wrapper.unmount();
  });

  it('supports React-style value/change control and renders Lx field components', async () => {
    const wrapper = mount(LxDynamicForm, {
      props: {
        value: {
          name: '',
          amount: 2,
          mode: 'patrol',
          enabled: false,
          level: 'normal',
          channels: ['sms'],
        },
        fields: [
          { key: 'name', label: '名称', type: 'input' },
          { key: 'amount', label: '数量', type: 'number' },
          {
            key: 'mode',
            label: '类型',
            type: 'select',
            options: [{ label: '日常巡防', value: 'patrol' }],
          },
          { key: 'enabled', label: '启用', type: 'switch' },
          {
            key: 'level',
            label: '等级',
            type: 'radio',
            options: [{ label: '常规', value: 'normal' }],
          },
          {
            key: 'channels',
            label: '通知渠道',
            type: 'checkbox',
            options: [{ label: '短信', value: 'sms' }],
          },
        ],
      },
    });

    expect(wrapper.find('.lx-input').exists()).toBe(true);
    expect(wrapper.find('.lx-input-number').exists()).toBe(true);
    expect(wrapper.find('.lx-select').exists()).toBe(true);
    expect(wrapper.find('.lx-switch').exists()).toBe(true);
    expect(wrapper.find('.lx-radio-group').exists()).toBe(true);
    expect(wrapper.find('.lx-checkbox-group').exists()).toBe(true);

    await wrapper.find('input').setValue('新名称');
    expect(wrapper.emitted('change')?.at(-1)).toEqual([expect.objectContaining({ name: '新名称' })]);
    wrapper.unmount();
  });
});
