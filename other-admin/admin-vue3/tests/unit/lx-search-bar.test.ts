import { mount } from '@vue/test-utils';
import { LxSearchBar, type LxSearchField } from 'lx-ui';
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
