import { mount } from '@vue/test-utils';
import { LxVirtualTree, type LxVirtualTreeNode } from 'lx-ui';
import { describe, expect, it, vi } from 'vitest';
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

  it('触屏或窄屏行高与触控目标至少 44px，并同步虚拟滚动偏移', async () => {
    let mediaQueryMatches = false;
    let dispatchMediaChange: (() => void) | undefined;
    const mediaQuery: MediaQueryList = {
      matches: mediaQueryMatches,
      media: '(any-pointer: coarse), (max-width: 640px)',
      onchange: null,
      addEventListener: (_type, listener) => {
        dispatchMediaChange = () => {
          const event = new Event('change');
          if (typeof listener === 'function') listener(event);
          else listener.handleEvent(event);
        };
      },
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    };
    const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue(mediaQuery);
    const data = Array.from({ length: 100 }, (_, index) => ({
      id: `node-${index}`,
      label: `组织 ${index}`,
      children: [{ id: `child-${index}`, label: `子节点 ${index}` }],
    }));
    const wrapper = mount(LxVirtualTree, {
      props: { data, filterable: false, height: 160, itemSize: 32, showCheckbox: true },
      attachTo: document.body,
    });
    const viewport = wrapper.get('.lx-virtual-tree__viewport');

    try {
      expect(matchMedia).toHaveBeenCalledWith('(any-pointer: coarse), (max-width: 640px)');
      expect(wrapper.get('.lx-virtual-tree').element.style.getPropertyValue('--lx-tree-control-size')).toBe('24px');
      expect(wrapper.get('[data-lx-tree-key="node-0"]').element.style.getPropertyValue('--lx-tree-row-height')).toBe(
        '32px',
      );

      wrapper.vm.scrollToKey('node-50');
      expect(viewport.element.scrollTop).toBe(1600);

      mediaQueryMatches = true;
      Object.defineProperty(mediaQuery, 'matches', { configurable: true, value: true });
      dispatchMediaChange?.();
      await nextTick();
      await nextTick();

      expect(wrapper.get('.lx-virtual-tree').element.style.getPropertyValue('--lx-tree-control-size')).toBe('44px');
      expect(wrapper.get('[data-lx-tree-key="node-44"]').element.style.getPropertyValue('--lx-tree-row-height')).toBe(
        '44px',
      );
      expect(wrapper.find('[data-lx-tree-key="node-43"]').exists()).toBe(false);
      expect(viewport.element.scrollTop).toBe(2200);

      mediaQueryMatches = false;
      Object.defineProperty(mediaQuery, 'matches', { configurable: true, value: false });
      dispatchMediaChange?.();
      await nextTick();
      await nextTick();

      expect(wrapper.get('.lx-virtual-tree').element.style.getPropertyValue('--lx-tree-control-size')).toBe('24px');
      expect(wrapper.get('[data-lx-tree-key="node-50"]').element.style.getPropertyValue('--lx-tree-row-height')).toBe(
        '32px',
      );
      expect(viewport.element.scrollTop).toBe(1600);
    } finally {
      wrapper.unmount();
      matchMedia.mockRestore();
    }
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    '非法行高 %s 回退为 32px 并继续渲染树节点',
    (itemSize) => {
      const wrapper = mount(LxVirtualTree, {
        props: { data: treeData, filterable: false, height: 64, itemSize },
      });

      expect(wrapper.findAll('[role="treeitem"]').length).toBeGreaterThan(0);
      expect(wrapper.get('[role="treeitem"]').element.style.getPropertyValue('--lx-tree-row-height')).toBe('32px');
      wrapper.unmount();
    },
  );

  it('为树容器提供默认及可覆盖的可访问名称', () => {
    const defaultTree = mount(LxVirtualTree, { props: { data: treeData } });
    const namedTree = mount(LxVirtualTree, {
      props: {
        data: treeData,
        ariaLabel: '组织结构',
        ariaDescribedby: 'tree-keyboard-hint',
      },
    });

    expect(defaultTree.get('[role="tree"]').attributes('aria-label')).toBe('树形结构');
    expect(namedTree.get('[role="tree"]').attributes('aria-label')).toBe('组织结构');
    expect(namedTree.get('[role="tree"]').attributes('aria-describedby')).toBe('tree-keyboard-hint');
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
    expect(wrapper.get('[data-lx-tree-key="org-1"]').attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('[data-lx-tree-key="org-1"] .lx-virtual-tree__toggle').attributes('aria-expanded')).toBe('true');
    expect(wrapper.find('[data-lx-tree-key="org-2"]').exists()).toBe(false);

    await wrapper.get('[data-lx-tree-key="org-1"] .lx-virtual-tree__toggle').trigger('click');
    expect(wrapper.find('[data-lx-tree-key="team-1"]').exists()).toBe(false);
    expect(wrapper.get('[data-lx-tree-key="org-1"]').attributes('aria-expanded')).toBe('false');

    wrapper.vm.filter('');
    await nextTick();
    expect(wrapper.find('[data-lx-tree-key="team-1"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('按筛选后的同级集合提供树项位置和总数', async () => {
    const data: LxVirtualTreeNode[] = [
      {
        id: 'group-1',
        label: '分组一',
        children: [
          { id: 'team-a', label: '单元 A', code: 'TEAM-A' },
          { id: 'hidden', label: '无关节点' },
          { id: 'team-b', label: '单元 B', code: 'TEAM-B' },
        ],
      },
      {
        id: 'group-2',
        label: '分组二',
        children: [{ id: 'team-c', label: '单元 C', code: 'TEAM-C' }],
      },
    ];
    const wrapper = mount(LxVirtualTree, {
      props: {
        data,
        filterable: false,
        filterMethod: (node, keyword) =>
          String(node.code ?? '')
            .toLocaleLowerCase()
            .includes(keyword),
      },
    });

    wrapper.vm.filter('team');
    await nextTick();

    expect(wrapper.get('[data-lx-tree-key="group-1"]').attributes('aria-posinset')).toBe('1');
    expect(wrapper.get('[data-lx-tree-key="group-1"]').attributes('aria-setsize')).toBe('2');
    expect(wrapper.get('[data-lx-tree-key="team-a"]').attributes('aria-posinset')).toBe('1');
    expect(wrapper.get('[data-lx-tree-key="team-a"]').attributes('aria-setsize')).toBe('2');
    expect(wrapper.get('[data-lx-tree-key="team-b"]').attributes('aria-posinset')).toBe('2');
    expect(wrapper.get('[data-lx-tree-key="team-b"]').attributes('aria-setsize')).toBe('2');
    expect(wrapper.get('[data-lx-tree-key="group-2"]').attributes('aria-posinset')).toBe('2');
    expect(wrapper.get('[data-lx-tree-key="group-2"]').attributes('aria-setsize')).toBe('2');
    expect(wrapper.get('[data-lx-tree-key="team-c"]').attributes('aria-posinset')).toBe('1');
    expect(wrapper.get('[data-lx-tree-key="team-c"]').attributes('aria-setsize')).toBe('1');
    wrapper.unmount();
  });

  it('does not include disabled descendants when a parent is selected', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: { data: treeData, defaultExpandedKeys: ['org-1'], showCheckbox: true },
    });

    expect(wrapper.get('.lx-virtual-tree__selection-scope').text()).toContain('包括当前筛选隐藏的节点');
    expect(wrapper.get('[data-lx-tree-key="org-1"]').attributes('aria-description')).toContain('全部未禁用下级节点');
    expect(wrapper.get('[data-lx-tree-key="org-1"] input[type="checkbox"]').attributes('aria-description')).toContain(
      '全部未禁用下级节点',
    );
    await wrapper.get('[data-lx-tree-key="org-1"] input[type="checkbox"]').setValue(true);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['org-1', 'team-1']]);
    await wrapper.setProps({ modelValue: ['org-1', 'team-1'] });
    expect(wrapper.get('[role="status"]').text()).toBe('本次新增 2 项，当前共选中 2 项。');
    await wrapper.setProps({ modelValue: ['org-2'] });
    expect(wrapper.get('[role="status"]').text()).toBe('当前已选中 1 项。');
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

  it('从行内展开按钮获得焦点后可继续用方向键浏览树', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: {
        data: treeData,
        defaultExpandedKeys: ['org-1'],
        filterable: false,
        showCheckbox: true,
      },
      attachTo: document.body,
    });
    const expandButton = wrapper.get('[data-lx-tree-key="org-1"] .lx-virtual-tree__toggle');
    expandButton.element.focus();

    await expandButton.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    expect(document.activeElement).toBe(wrapper.get('[data-lx-tree-key="team-1"]').element);

    const checkbox = wrapper.get('[data-lx-tree-key="team-1"] input[type="checkbox"]');
    checkbox.element.focus();
    await checkbox.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    expect(document.activeElement).toBe(wrapper.get('[data-lx-tree-key="team-2"]').element);
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

  it('有筛选词时空数据仍显示空树状态', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: { data: treeData, filterable: false },
    });

    wrapper.vm.filter('不存在');
    await nextTick();
    expect(wrapper.get('.lx-virtual-tree__empty').text()).toBe('未找到匹配节点');

    await wrapper.setProps({ data: [] });
    expect(wrapper.get('.lx-virtual-tree__empty').text()).toBe('暂无数据');
    wrapper.unmount();
  });

  it('自定义过滤规则可匹配编码并保留命中节点的祖先', async () => {
    const filterMethod = vi.fn((node: LxVirtualTreeNode, keyword: string) =>
      [node.label, node.code].some((value) => typeof value === 'string' && value.toLocaleLowerCase().includes(keyword)),
    );
    const wrapper = mount(LxVirtualTree, {
      props: {
        data: [
          {
            id: 'org',
            label: '市级机构',
            children: [
              { id: 'department', label: '综合处', code: 'DEPT-01' },
              { id: 'archive', label: '归档处', code: 'DEPT-02' },
            ],
          },
        ],
        filterable: false,
        filterMethod,
      },
    });

    wrapper.vm.filter('  DEPT-01  ');
    await nextTick();

    expect(filterMethod).toHaveBeenCalledWith(expect.objectContaining({ id: 'department' }), 'dept-01');
    expect(wrapper.findAll('[role="treeitem"]').map((row) => row.attributes('data-lx-tree-key'))).toEqual([
      'org',
      'department',
    ]);
    expect(wrapper.get('.lx-virtual-tree__filter-status').text()).toBe('筛选匹配到 1 个节点；路径祖先不计入数量。');

    wrapper.vm.filter('missing');
    await nextTick();
    expect(wrapper.get('.lx-virtual-tree__filter-status').text()).toBe('筛选匹配到 0 个节点；路径祖先不计入数量。');
    wrapper.unmount();
  });

  it('行高变化时保留当前树项焦点并按新行高重算滚动位置', async () => {
    const data = Array.from({ length: 100 }, (_, index) => ({
      id: `node-${index}`,
      label: `组织 ${index}`,
    }));
    const wrapper = mount(LxVirtualTree, {
      props: { data, filterable: false, height: 160, itemSize: 32 },
      attachTo: document.body,
    });
    const viewport = wrapper.get('.lx-virtual-tree__viewport');

    wrapper.vm.scrollToKey('node-50');
    await nextTick();
    const focusedRow = wrapper.get('[data-lx-tree-key="node-50"]');
    focusedRow.element.focus();
    expect(document.activeElement).toBe(focusedRow.element);

    await wrapper.setProps({ itemSize: 64 });
    await nextTick();

    expect(viewport.element.scrollTop).toBe(3200);
    expect(document.activeElement).toBe(wrapper.get('[data-lx-tree-key="node-50"]').element);
    expect(wrapper.get('[data-lx-tree-key="node-50"]').attributes('tabindex')).toBe('0');
    expect(wrapper.get('[data-lx-tree-key="node-44"]').attributes('tabindex')).toBe('-1');

    await wrapper.setProps({ itemSize: 80 });
    await nextTick();

    expect(viewport.element.scrollTop).toBe(4000);
    expect(document.activeElement).toBe(wrapper.get('[data-lx-tree-key="node-50"]').element);
    wrapper.unmount();
  });

  it('用户滚动使当前焦点树项卸载时将焦点移至视口内停靠项', async () => {
    const data = Array.from({ length: 100 }, (_, index) => ({
      id: `node-${index}`,
      label: `组织 ${index}`,
    }));
    const wrapper = mount(LxVirtualTree, {
      props: { data, filterable: false, height: 64, itemSize: 32 },
      attachTo: document.body,
    });
    const viewport = wrapper.get('.lx-virtual-tree__viewport');
    wrapper.get('[data-lx-tree-key="node-0"]').element.focus();

    viewport.element.scrollTop = 1600;
    await viewport.trigger('scroll');
    await nextTick();
    await nextTick();

    const targetRow = wrapper.get('[data-lx-tree-key="node-50"]');
    expect(document.activeElement).toBe(targetRow.element);
    expect(targetRow.attributes('tabindex')).toBe('0');
    expect(wrapper.findAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);
    wrapper.unmount();
  });

  it.each([
    ['展开按钮', '.lx-virtual-tree__toggle'],
    ['复选框', '.lx-virtual-tree__checkbox'],
  ])('用户滚动使焦点位于行内%s时将焦点移至视口内停靠项', async (_, selector) => {
    const data = Array.from({ length: 100 }, (_, index) => ({
      id: `node-${index}`,
      label: `组织 ${index}`,
      children: index === 0 ? [{ id: 'child-0', label: '子组织' }] : undefined,
    }));
    const wrapper = mount(LxVirtualTree, {
      props: {
        data,
        defaultExpandedKeys: [],
        filterable: false,
        height: 64,
        itemSize: 32,
        showCheckbox: true,
      },
      attachTo: document.body,
    });
    const viewport = wrapper.get('.lx-virtual-tree__viewport');
    const focusedControl = wrapper.get(`[data-lx-tree-key="node-0"] ${selector}`);
    focusedControl.element.focus();
    expect(document.activeElement).toBe(focusedControl.element);

    viewport.element.scrollTop = 32;
    await viewport.trigger('scroll');
    await nextTick();
    await nextTick();

    const targetRow = wrapper.get('[data-lx-tree-key="node-1"]');
    expect(wrapper.find('[data-lx-tree-key="node-0"]').exists()).toBe(true);
    expect(document.activeElement).toBe(targetRow.element);
    expect(targetRow.attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('程序定位同步窗口内 Tab 停靠项但不抢占外部焦点', async () => {
    const data = Array.from({ length: 100 }, (_, index) => ({
      id: `node-${index}`,
      label: `组织 ${index}`,
    }));
    const wrapper = mount(LxVirtualTree, {
      props: { data, filterable: false, height: 64, itemSize: 32 },
      attachTo: document.body,
    });
    const outsideButton = document.createElement('button');
    outsideButton.textContent = '外部操作';
    document.body.append(outsideButton);

    try {
      wrapper.get('[data-lx-tree-key="node-0"]').element.focus();
      wrapper.vm.scrollToKey('node-50');
      await nextTick();
      await nextTick();
      const focusedRow = wrapper.get('[data-lx-tree-key="node-50"]');
      expect(document.activeElement).toBe(focusedRow.element);
      expect(focusedRow.attributes('tabindex')).toBe('0');

      outsideButton.focus();
      wrapper.vm.scrollToKey('node-90');
      await nextTick();
      await nextTick();

      const tabStop = wrapper.get('[data-lx-tree-key="node-90"]');
      expect(document.activeElement).toBe(outsideButton);
      expect(tabStop.attributes('tabindex')).toBe('0');
      expect(wrapper.findAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);
    } finally {
      wrapper.unmount();
      outsideButton.remove();
    }
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

  it('通过清除按钮清空筛选后将焦点还给筛选框', async () => {
    const wrapper = mount(LxVirtualTree, {
      props: { data: treeData },
      attachTo: document.body,
    });
    const filter = wrapper.get('input[aria-label="过滤节点"]');
    await filter.setValue('东一支队');

    const clearButton = wrapper.get('button[aria-label="清除过滤"]');
    clearButton.element.focus();
    expect(document.activeElement).toBe(clearButton.element);

    await clearButton.trigger('click');
    await nextTick();

    expect(filter.element.value).toBe('');
    expect(document.activeElement).toBe(filter.element);
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
