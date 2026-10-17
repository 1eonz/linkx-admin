import { ElButton, ElInput } from 'element-plus';
import { LxSearchBar } from 'lx-ui';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SearchBar from '@/components/SearchBar/index.vue';

describe('SearchBar lx-ui 适配器', () => {
  it('隐藏默认状态行并按选中数量禁用批量操作', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        actions: [{ key: 'batchDelete', label: '批量删除' }],
        selectedCount: 0,
      },
      global: {
        components: { ElButton, ElInput, LxSearchBar },
      },
    });

    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.get('.search-bar__right button').isDisabled()).toBe(true);
    wrapper.unmount();
  });

  it('选中批量数据后发出 action key', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        actions: [{ key: 'batchDelete', label: '批量删除' }],
        selectedCount: 2,
      },
      global: {
        components: { ElButton, ElInput, LxSearchBar },
      },
    });

    await wrapper.get('.search-bar__right button').trigger('click');
    expect(wrapper.emitted('action')).toEqual([['batchDelete']]);
    wrapper.unmount();
  });
});
