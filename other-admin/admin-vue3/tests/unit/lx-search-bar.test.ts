import { mount } from '@vue/test-utils';
import { LxSearchBar, type LxCascaderOption, type LxSearchField } from 'lx-ui';
import { describe, expect, it } from 'vitest';

const fields: LxSearchField[] = [
  { key: 'keyword', label: '关键词', type: 'input' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    defaultValue: 'all',
    options: [
      { label: '全部', value: 'all' },
      { label: '在线', value: 'online' },
    ],
  },
];

describe('LxSearchBar', () => {
  it('emits the controlled value when a field changes', async () => {
    const wrapper = mount(LxSearchBar, {
      props: { fields, modelValue: { keyword: '旧值', status: 'online' } },
    });

    await wrapper.get('.lx-search-bar__field input[type="text"]').setValue('新值');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ keyword: '新值', status: 'online' }]);
    wrapper.unmount();
  });

  it('preserves numeric, mixed, and object Cascader option values', async () => {
    interface RegionValue {
      regionId: number;
    }
    interface RegionOption {
      label: string;
      value: RegionValue;
      children?: RegionOption[];
    }
    const regionValue: RegionValue = { regionId: 101 };
    const namedOptions: RegionOption[] = [{ label: '一中队', value: regionValue }];
    const cascaderOptions: LxCascaderOption[] = namedOptions;
    const cascaderFields: LxSearchField[] = [
      {
        key: 'path',
        label: '组织路径',
        type: 'cascader',
        defaultValue: [10, regionValue],
        options: [
          {
            label: '城东片区',
            value: 10,
            children: cascaderOptions,
          },
        ],
      },
    ];
    const wrapper = mount(LxSearchBar, {
      props: {
        fields: cascaderFields,
        modelValue: { path: [10, { regionId: 101 }] },
      },
    });
    const cascader = wrapper.findComponent({ name: 'ElCascader' });

    expect(cascader.props('options')).toEqual(cascaderFields[0].options);
    expect(cascader.props('modelValue')).toEqual([10, { regionId: 101 }]);

    await cascader.vm.$emit('update:modelValue', [20, { regionId: 201 }]);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ path: [20, { regionId: 201 }] }]);
    wrapper.unmount();
  });

  it('does not pass unsupported values to Cascader', () => {
    const cascaderField: LxSearchField = {
      key: 'path',
      label: '组织路径',
      type: 'cascader',
      options: [{ label: '全部', value: 'all' }],
    };
    [true, [[1]], [() => 'invalid'], [new Map([['id', 1]])]].forEach((value) => {
      const wrapper = mount(LxSearchBar, {
        props: { fields: [cascaderField], modelValue: { path: value } },
      });

      expect(wrapper.findComponent({ name: 'ElCascader' }).props('modelValue')).toBeUndefined();
      wrapper.unmount();
    });
  });

  it('preserves record-valued Cascader options with ordinary string and symbol fields', () => {
    const businessValue = {
      regionId: 101,
      call: 'business-call-field',
      [Symbol.iterator]: 'business-iterator-field',
    };
    const wrapper = mount(LxSearchBar, {
      props: {
        fields: [
          {
            key: 'path',
            label: '组织路径',
            type: 'cascader',
            options: [{ label: '一中队', value: businessValue }],
          },
        ],
        modelValue: { path: [businessValue] },
      },
    });

    const cascaderValue = wrapper.findComponent({ name: 'ElCascader' }).props('modelValue');
    expect(Array.isArray(cascaderValue)).toBe(true);
    if (!Array.isArray(cascaderValue) || typeof cascaderValue[0] !== 'object' || cascaderValue[0] === null) {
      throw new Error('Cascader 应保留记录对象路径值');
    }
    expect(Reflect.get(cascaderValue[0], 'regionId')).toBe(101);
    expect(Reflect.get(cascaderValue[0], 'call')).toBe('business-call-field');
    expect(Reflect.get(cascaderValue[0], Symbol.iterator)).toBe('business-iterator-field');
    wrapper.unmount();
  });

  it('resets to schema defaults and searches immediately', async () => {
    const wrapper = mount(LxSearchBar, {
      props: {
        fields,
        modelValue: { keyword: '值班员', status: 'online' },
      },
    });

    await wrapper
      .findAll('.lx-search-bar__actions button')
      .find((button) => button.text().includes('重置'))
      ?.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ status: 'all' }]);
    expect(wrapper.emitted('reset')).toHaveLength(1);
    expect(wrapper.emitted('search')).toHaveLength(1);
    wrapper.unmount();
  });

  it('blocks search while loading and expands fields after the first four', async () => {
    const longFields = Array.from({ length: 9 }, (_, index) => ({
      key: `field-${index}`,
      label: `条件 ${index + 1}`,
      type: 'input' as const,
    }));
    const wrapper = mount(LxSearchBar, {
      props: {
        fields: longFields,
        loading: true,
      },
    });

    expect(wrapper.findAll('.lx-search-bar__field')).toHaveLength(4);
    await wrapper.get('.lx-search-bar__collapse').trigger('click');
    expect(wrapper.findAll('.lx-search-bar__field')).toHaveLength(9);
    expect(wrapper.emitted('update:collapsed')).toEqual([[false]]);

    await wrapper.get('.lx-search-bar__actions .el-button').trigger('click');
    expect(wrapper.emitted('search')).toBeUndefined();
    wrapper.unmount();
  });
});
