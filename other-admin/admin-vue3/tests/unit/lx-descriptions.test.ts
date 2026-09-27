import { mount } from '@vue/test-utils';
import { LxDescriptions, setupLxPermission } from 'lx-ui';
import { afterEach, describe, expect, it } from 'vitest';
import { h } from 'vue';

let cleanupPermission: (() => void) | undefined;

afterEach(() => {
  cleanupPermission?.();
  cleanupPermission = undefined;
});

describe('LxDescriptions', () => {
  it('renders placeholders and keeps the default single-column two-ends layout', () => {
    const wrapper = mount(LxDescriptions, {
      props: {
        items: [
          { key: 'name', label: '姓名', value: '孙志国' },
          { key: 'phone', label: '联系电话', value: '' },
        ],
      },
    });

    expect(wrapper.classes()).toContain('lx-descriptions--two-ends');
    expect(wrapper.element.style.getPropertyValue('--lx-descriptions-columns')).toBe('1');
    expect(wrapper.text()).toContain('孙志国');
    expect(wrapper.text()).toContain('-');
    wrapper.unmount();
  });

  it('infers grid layout from columns and clamps item spans to integer columns', () => {
    const wrapper = mount(LxDescriptions, {
      props: {
        columns: 2,
        items: [
          { key: 'name', label: '姓名', value: '孙志国', span: 0 },
          { key: 'organization', label: '所属组织', value: '指挥中心', span: 8 },
          { key: 'remarks', label: '备注', value: '备注', span: 1.8 },
        ],
      },
    });

    expect(wrapper.classes()).toContain('lx-descriptions--grid');
    expect(wrapper.element.style.getPropertyValue('--lx-descriptions-columns')).toBe('2');
    expect(
      wrapper
        .findAll('.lx-descriptions__item')
        .map((item) => item.element.style.getPropertyValue('--lx-descriptions-span')),
    ).toEqual(['1', '2', '1']);
    wrapper.unmount();
  });

  it('applies compact sizing and explicit row/divider/label options', () => {
    const wrapper = mount(LxDescriptions, {
      props: {
        layout: 'compact',
        rowHeight: 36,
        dividerColor: 'var(--lx-color-warning)',
        labelWidth: 88,
        items: [
          { key: 'name', label: '姓名', value: '孙志国' },
          { key: 'phone', label: '联系电话', value: '138-0010-8921', labelWidth: '7rem' },
        ],
      },
    });

    expect(wrapper.classes()).toContain('lx-descriptions--small');
    expect(wrapper.element.style.getPropertyValue('--lx-descriptions-row-height')).toBe('36px');
    expect(wrapper.element.style.getPropertyValue('--lx-descriptions-divider-color')).toBe('var(--lx-color-warning)');
    expect(
      wrapper
        .findAll('.lx-descriptions__item')
        .map((item) => item.element.style.getPropertyValue('--lx-descriptions-label-width')),
    ).toEqual(['88px', '7rem']);
    wrapper.unmount();
  });

  it('does not expose masked values through copy or status affordances', () => {
    cleanupPermission = setupLxPermission(() => ({
      maskedFields: { 'record-detail': ['policeId', 'status'] },
      current: () => 'record-detail',
    }));

    const wrapper = mount(LxDescriptions, {
      props: {
        items: [
          { key: 'policeId', label: '警号', value: '005882', mask: true, copyable: true },
          { key: 'status', label: '运行状态', value: '在线', mask: true, statusDot: 'online' },
        ],
      },
    });

    expect(wrapper.findAll('.lx-descriptions__value-text').map((value) => value.text())).toEqual(['***', '***']);
    expect(wrapper.find('.lx-code-slot--copyable').exists()).toBe(false);
    expect(wrapper.find('.lx-status-dot').exists()).toBe(false);
    wrapper.unmount();
  });

  it('names the copy control with its field and value', () => {
    const wrapper = mount(LxDescriptions, {
      props: {
        items: [{ key: 'policeId', label: '警号', value: '005882', copyable: true }],
      },
    });

    expect(wrapper.get('.lx-code-slot--copyable').attributes('aria-label')).toBe('复制警号：005882');
    wrapper.unmount();
  });

  it('lets a named item slot replace the default value renderer', () => {
    const wrapper = mount(LxDescriptions, {
      props: {
        items: [{ key: 'policeId', label: '警号', value: '005882', copyable: true }],
      },
      slots: {
        'item-policeId': ({ item, value }: { item: { label: string }; value: unknown }) =>
          h('span', { class: 'custom-value' }, `${item.label}:${String(value)}`),
      },
    });

    expect(wrapper.get('.custom-value').text()).toBe('警号:005882');
    expect(wrapper.find('.lx-code-slot--copyable').exists()).toBe(false);
    wrapper.unmount();
  });
});
