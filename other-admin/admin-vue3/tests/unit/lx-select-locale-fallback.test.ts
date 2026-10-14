import { mount } from '@vue/test-utils';
import { ElOption } from 'element-plus';
import { LxSelect } from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxSelect locale fallback', () => {
  it('宿主未配置语言时为折叠摘要使用简体中文', async () => {
    const wrapper = mount(LxSelect, {
      props: {
        modelValue: ['1', '2', '3'],
        multiple: true,
        collapseTags: true,
        maxCollapseTags: 1,
      },
      slots: {
        default: [
          '<ElOption label="一级布控" value="1" />',
          '<ElOption label="二级布控" value="2" />',
          '<ElOption label="三级布控" value="3" />',
        ],
      },
      global: { components: { ElOption } },
      attachTo: document.body,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.find('.el-select__collapse-item').attributes('aria-label')).toBe('切换下拉选项 (+2)');

    wrapper.unmount();
  });
});
