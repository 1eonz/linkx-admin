import { mount } from '@vue/test-utils';
import { LxVirtualTree, type LxVirtualTreeNode } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';

const treeData: LxVirtualTreeNode[] = [
  {
    id: 'org-1',
    label: '杭州市',
    children: [
      { id: 'team-1', label: '东一支队' },
      { id: 'team-2', label: '东二支队', disabled: true },
    ],
  },
  { id: 'org-2', label: '宁波市' },
];

describe('LxVirtualTree', () => {
  it('renders a bounded window for large trees', () => {
    const data = Array.from({ length: 100 }, (_, index) => ({
      id: `node-${index}`,
      label: `组织 ${index}`,
    }));
    const wrapper = mount(LxVirtualTree, {
      props: { data, filterable: false, height: 64, itemSize: 32 },
    });

    const rows = wrapper.findAll('[role="treeitem"]');
    expect(rows.length).toBeLessThan(data.length);
    expect(rows.length).toBe(14);
    wrapper.unmount();
  });

  it('keeps matching descendants visible with their collapsed ancestors', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: { data: treeData, defaultExpandedKeys: [], filterable: true },
    });

    await wrapper.get('input[aria-label="过滤节点"]').setValue('东一支队');

    expect(wrapper.get('[data-lx-tree-key="org-1"]').exists()).toBe(true);
    expect(wrapper.get('[data-lx-tree-key="team-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-lx-tree-key="org-2"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('does not include disabled descendants when a parent is selected', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: { data: treeData, defaultExpandedKeys: ['org-1'], showCheckbox: true },
    });

    await wrapper.get('[data-lx-tree-key="org-1"] input[type="checkbox"]').setValue(true);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['org-1', 'team-1']]);
    expect(wrapper.get('[data-lx-tree-key="team-2"]').attributes('aria-disabled')).toBe('true');
    expect(wrapper.get('[data-lx-tree-key="team-2"] input[type="checkbox"]').attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('expands and moves keyboard focus through tree items', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: { data: treeData, defaultExpandedKeys: [], filterable: false },
      attachTo: document.body,
    });
    const root = wrapper.get('[data-lx-tree-key="org-1"]');

    await root.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.get('[data-lx-tree-key="team-1"]').exists()).toBe(true);

    await root.trigger('keydown', { key: 'ArrowRight' });
    await nextTick();
    expect(document.activeElement).toBe(wrapper.get('[data-lx-tree-key="team-1"]').element);
    wrapper.unmount();
  });

  it('exposes selection methods and ignores disabled or unknown keys', () => {
    const wrapper = mount(LxVirtualTree, {
      props: { data: treeData, showCheckbox: true, modelValue: ['team-1'] },
    });

    expect(wrapper.vm.getCheckedKeys()).toEqual(['team-1']);
    wrapper.vm.setCheckedKeys(['team-1', 'team-2', 'missing', 'team-1']);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['team-1']]);
    expect(wrapper.emitted('check-change')?.[0]).toEqual([['team-1'], [treeData[0].children?.[0]]]);
    wrapper.unmount();
  });

  it('expands and collapses all branches through the exposed method', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: { data: treeData, defaultExpandedKeys: [], filterable: false },
    });

    wrapper.vm.expandAll();
    await nextTick();
    expect(wrapper.get('[data-lx-tree-key="team-1"]').exists()).toBe(true);
    expect(wrapper.emitted('expand-change')?.[0]).toEqual([['org-1']]);

    wrapper.vm.expandAll(false);
    await nextTick();
    expect(wrapper.find('[data-lx-tree-key="team-1"]').exists()).toBe(false);
    expect(wrapper.emitted('expand-change')?.[1]).toEqual([[]]);
    wrapper.unmount();
  });

  it('filters and scrolls to nodes through the exposed methods', async () => {
    const data = Array.from({ length: 100 }, (_, index) => ({
      id: `node-${index}`,
      label: `组织 ${index}`,
    }));
    const wrapper = mount(LxVirtualTree, {
      props: { data, filterable: false, height: 64, itemSize: 32 },
    });

    wrapper.vm.filter('组织 99');
    await nextTick();
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);
    expect(wrapper.get('[data-lx-tree-key="node-99"]').exists()).toBe(true);

    wrapper.vm.filter('');
    await nextTick();
    wrapper.vm.scrollToKey('node-99');
    await nextTick();

    expect(wrapper.get('.lx-virtual-tree__viewport').element.scrollTop).toBe(3168);
    expect(wrapper.get('[data-lx-tree-key="node-99"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders custom node slot content with node state', () => {
    const wrapper = mount(LxVirtualTree, {
      props: { data: treeData, modelValue: ['org-1'], showCheckbox: true },
      slots: {
        node: ({ node, level, checked }: { node: LxVirtualTreeNode; level: number; checked: boolean }) =>
          h('span', { class: 'custom-node-state' }, `${node.label}:${level}:${checked}`),
      },
    });

    expect(wrapper.get('.custom-node-state').text()).toBe('杭州市:1:true');
    wrapper.unmount();
  });
});
