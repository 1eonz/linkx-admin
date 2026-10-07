import { mount } from '@vue/test-utils';
import { LxVirtualTree, type LxVirtualTreeNode } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { h, nextTick, reactive } from 'vue';

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

  it('为树容器提供默认及可覆盖的可访问名称', () => {
    const defaultTree = mount(LxVirtualTree, { props: { data: treeData } });
    const namedTree = mount(LxVirtualTree, {
      props: { data: treeData, ariaLabel: '组织结构' },
    });

    expect(defaultTree.get('[role="tree"]').attributes('aria-label')).toBe('树形结构');
    expect(namedTree.get('[role="tree"]').attributes('aria-label')).toBe('组织结构');
    defaultTree.unmount();
    namedTree.unmount();
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

  it('分支展开改变可见行时保留展开按钮焦点', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: { data: treeData, defaultExpandedKeys: [], filterable: false },
      attachTo: document.body,
    });
    const expandButton = wrapper.get('[data-lx-tree-key="org-1"] .lx-virtual-tree__toggle');
    expandButton.element.focus();

    await expandButton.trigger('click');
    await nextTick();

    const expandedButton = wrapper.get('[data-lx-tree-key="org-1"] .lx-virtual-tree__toggle');
    expect(document.activeElement).toBe(expandedButton.element);
    wrapper.unmount();
  });

  it('行内控件的键盘事件不会冒泡成树行的重复操作', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: {
        data: treeData,
        defaultExpandedKeys: [],
        showCheckbox: true,
        filterable: false,
      },
      attachTo: document.body,
    });
    const row = wrapper.get('[data-lx-tree-key="org-1"]');
    const expandButton = row.get('.lx-virtual-tree__toggle');

    expect(expandButton.attributes('tabindex')).toBe('-1');
    await expandButton.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await expandButton.trigger('click');
    await nextTick();
    const checkbox = wrapper.get('[data-lx-tree-key="org-1"] input[type="checkbox"]');
    expect(checkbox.attributes('tabindex')).toBe('-1');
    await checkbox.trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await row.trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['org-1', 'team-1']]);
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

  it('过滤隐藏当前树项后恢复到有效项，筛选框输入时不抢焦点', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: {
        data: [
          { id: 'node-1', label: '组织一' },
          { id: 'node-2', label: '目标组织' },
        ],
      },
      attachTo: document.body,
    });
    wrapper.get('[data-lx-tree-key="node-1"]').element.focus();

    wrapper.vm.filter('目标组织');
    await nextTick();
    await nextTick();
    const targetRow = wrapper.get('[data-lx-tree-key="node-2"]');
    expect(document.activeElement).toBe(targetRow.element);
    expect(targetRow.attributes('tabindex')).toBe('0');

    const filter = wrapper.get('input[aria-label="过滤节点"]');
    filter.element.focus();
    await filter.setValue('没有匹配项');
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(filter.element);
    expect(wrapper.get('[role="tree"]').attributes('tabindex')).toBe('-1');
    wrapper.unmount();
  });

  it('过滤时保留空字符串节点键的焦点', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: {
        data: [
          { id: 'node-1', label: '目标组织一' },
          { id: '', label: '目标组织二' },
        ],
      },
      attachTo: document.body,
    });
    wrapper.get('[data-lx-tree-key=""]').element.focus();

    wrapper.vm.filter('目标组织');
    await nextTick();
    await nextTick();

    const targetRow = wrapper.get('[data-lx-tree-key=""]');
    expect(document.activeElement).toBe(targetRow.element);
    expect(targetRow.attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('响应式原地移除当前焦点节点后将焦点移至首个有效项', async () => {
    const data = reactive<LxVirtualTreeNode[]>([
      { id: 'node-1', label: '组织一' },
      { id: 'node-2', label: '组织二' },
    ]);
    const wrapper = mount(LxVirtualTree, {
      props: { data, filterable: false },
      attachTo: document.body,
    });
    wrapper.get('[data-lx-tree-key="node-1"]').element.focus();

    data.splice(0, 1);
    await nextTick();
    await nextTick();

    const fallbackRow = wrapper.get('[data-lx-tree-key="node-2"]');
    expect(document.activeElement).toBe(fallbackRow.element);
    expect(fallbackRow.attributes('tabindex')).toBe('0');
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

  it('自定义节点键不是字符串或数字时回退到节点 id', () => {
    const wrapper = mount(LxVirtualTree, {
      props: {
        data: [{ id: 'fallback-id', label: '备用键节点', code: true }],
        nodeKey: 'code',
      },
    });

    expect(wrapper.get('[data-lx-tree-key="fallback-id"]').exists()).toBe(true);
    expect(wrapper.find('[data-lx-tree-key="true"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('混合字符串和数字键时保持节点身份与焦点隔离', async () => {
    const mixedData: LxVirtualTreeNode[] = [
      {
        id: 1,
        label: '数字节点',
        children: [{ id: 11, label: '数字子节点' }],
      },
      {
        id: '1',
        label: '字符串节点',
        children: [{ id: '11', label: '字符串子节点' }],
      },
    ];
    const wrapper = mount(LxVirtualTree, {
      props: {
        data: mixedData,
        defaultExpandedKeys: [1, '1'],
        filterable: false,
      },
      attachTo: document.body,
    });

    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(4);
    expect(wrapper.get('[data-lx-tree-key="1"]').attributes('data-lx-tree-key-type')).toBe('number');
    expect(wrapper.findAll('[data-lx-tree-key="1"]')).toHaveLength(2);

    const stringRow = wrapper.findAll('[role="treeitem"]').find((row) => row.text().includes('字符串节点'));
    if (!stringRow) throw new Error('字符串节点未渲染');
    stringRow.element.focus();
    await stringRow.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    expect(document.activeElement?.textContent).toContain('字符串子节点');
    wrapper.unmount();
  });

  it('数据不可变追加时保留虚拟窗口和当前焦点', async () => {
    const data = Array.from({ length: 100 }, (_, index) => ({
      id: `node-${index}`,
      label: `组织 ${index}`,
    }));
    const wrapper = mount(LxVirtualTree, {
      props: { data, filterable: false, height: 64, itemSize: 32 },
      attachTo: document.body,
    });

    wrapper.vm.scrollToKey('node-50');
    await nextTick();
    const focusedRow = wrapper.get('[data-lx-tree-key="node-50"]');
    (focusedRow.element as HTMLElement).focus();
    expect(document.activeElement).toBe(focusedRow.element);

    await wrapper.setProps({ data: [...data, { id: 'node-100', label: '组织 100' }] });
    await nextTick();

    expect(wrapper.get('.lx-virtual-tree__viewport').element.scrollTop).toBe(1600);
    expect(document.activeElement).toBe(wrapper.get('[data-lx-tree-key="node-50"]').element);
    expect(wrapper.get('[data-lx-tree-key="node-50"]').attributes('tabindex')).toBe('0');
    expect(wrapper.get('[data-lx-tree-key="node-44"]').attributes('tabindex')).toBe('-1');
    wrapper.unmount();
  });

  it('数据重排使当前焦点移出虚拟窗口时跟随节点恢复焦点', async () => {
    const data = Array.from({ length: 100 }, (_, index) => ({
      id: `node-${index}`,
      label: `组织 ${index}`,
    }));
    const wrapper = mount(LxVirtualTree, {
      props: { data, filterable: false, height: 64, itemSize: 32 },
      attachTo: document.body,
    });

    wrapper.vm.scrollToKey('node-50');
    await nextTick();
    const focusedRow = wrapper.get('[data-lx-tree-key="node-50"]');
    (focusedRow.element as HTMLElement).focus();

    await wrapper.setProps({ data: [data[50]!, ...data.slice(0, 50), ...data.slice(51)] });
    await nextTick();

    expect(wrapper.get('.lx-virtual-tree__viewport').element.scrollTop).toBe(0);
    const reorderedRow = wrapper.get('[data-lx-tree-key="node-50"]');
    expect(document.activeElement).toBe(reorderedRow.element);
    expect(reorderedRow.attributes('tabindex')).toBe('0');
    expect(wrapper.get('[data-lx-tree-key="node-1"]').attributes('tabindex')).toBe('-1');
    wrapper.unmount();
  });
});
