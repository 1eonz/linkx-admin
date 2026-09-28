import { flushPromises, mount } from '@vue/test-utils';
import { LxSelectTree, type LxTreeNode } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref, type PropType, watch } from 'vue';

const treeData: LxTreeNode[] = [
  {
    key: 'city',
    title: '城市公安局',
    children: [
      { key: 'station', title: '东港派出所' },
      { key: 'locked', title: '离线专网', disabled: true },
    ],
  },
];

const TreeStub = defineComponent({
  name: 'ElTree',
  props: {
    data: { type: Array as PropType<LxTreeNode[]>, default: () => [] },
    defaultExpandedKeys: {
      type: Array as PropType<(string | number)[]>,
      default: () => [],
    },
    filterNodeMethod: {
      type: Function as PropType<(value: string, data: LxTreeNode) => boolean>,
      default: undefined,
    },
  },
  emits: ['check'],
  setup(props, { emit, expose }) {
    const checkedKeys = ref<(string | number)[]>([]);
    const filterValue = ref('');
    const expandedKeys = ref(new Set<string | number>());

    watch(
      () => props.defaultExpandedKeys,
      (keys) => {
        expandedKeys.value = new Set(keys);
      },
      { immediate: true },
    );

    expose({
      filter: (value: string) => {
        filterValue.value = value;
      },
      getCheckedKeys: () => checkedKeys.value,
      getNode: (key: string | number) => ({
        expanded: expandedKeys.value.has(key),
        expand: () => {
          expandedKeys.value = new Set(expandedKeys.value).add(key);
        },
        collapse: () => {
          const next = new Set(expandedKeys.value);
          next.delete(key);
          expandedKeys.value = next;
        },
      }),
      setCheckedKeys: (keys: (string | number)[]) => {
        checkedKeys.value = [...keys];
      },
    });

    function renderNodes(nodes: LxTreeNode[]) {
      return nodes.flatMap((node) => {
        const matches = !filterValue.value || props.filterNodeMethod?.(filterValue.value, node) === true;
        if (!matches) return [];

        const children = filterValue.value || expandedKeys.value.has(node.key) ? renderNodes(node.children ?? []) : [];

        return [
          h(
            'div',
            {
              class: 'tree-stub-node',
              'data-key': String(node.key),
              'data-expanded': String(expandedKeys.value.has(node.key)),
            },
            [h('span', node.title), ...children],
          ),
        ];
      });
    }

    return () =>
      h('div', [
        ...renderNodes(props.data),
        h(
          'button',
          {
            type: 'button',
            'data-testid': 'tree-stub-check',
            onClick: () => {
              checkedKeys.value = ['city', 'station', 'locked'];
              emit('check');
            },
          },
          '模拟勾选',
        ),
      ]);
  },
});

function mountTree(props: Record<string, unknown> = {}) {
  return mount(LxSelectTree, {
    props: { data: treeData, ...props },
    global: { stubs: { ElTree: TreeStub } },
  });
}

describe('LxSelectTree', () => {
  it('同步受控勾选并从回传节点中排除禁用项', async () => {
    const wrapper = mountTree({ checkedKeys: ['station'] });
    await flushPromises();

    await wrapper.get('[data-testid="tree-stub-check"]').trigger('click');

    expect(wrapper.emitted('update:checked-keys')).toEqual([[['city', 'station']]]);
    expect(wrapper.emitted('check-change')?.[0]).toEqual([
      ['city', 'station'],
      [treeData[0], treeData[0]?.children?.[0]],
    ]);
    wrapper.unmount();
  });

  it('搜索保留匹配节点和祖先，清空时恢复原展开状态', async () => {
    const wrapper = mountTree({ expandedKeys: ['city'] });
    const search = wrapper.get('input[aria-label="搜索部门名称"]');

    await search.setValue('东港派出所');
    await flushPromises();

    expect(wrapper.findAll('.tree-stub-node').map((node) => node.attributes('data-key'))).toEqual(['city', 'station']);
    expect(wrapper.get('[data-key="city"]').attributes('data-expanded')).toBe('true');

    await search.setValue('');
    await flushPromises();

    expect(wrapper.findAll('.tree-stub-node').map((node) => node.attributes('data-key'))).toEqual([
      'city',
      'station',
      'locked',
    ]);
    expect(wrapper.get('[data-key="city"]').attributes('data-expanded')).toBe('true');
    wrapper.unmount();
  });

  it('shows an announced empty state when the host provides no nodes', () => {
    const wrapper = mountTree({ data: [] });

    expect(wrapper.get('[role="status"]').text()).toBe('暂无数据');
    wrapper.unmount();
  });
});
