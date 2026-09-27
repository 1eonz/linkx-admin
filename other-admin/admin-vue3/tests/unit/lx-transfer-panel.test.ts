import { mount } from '@vue/test-utils';
import { LxTransferPanel, type LxVirtualTreeNode } from 'lx-ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const { lxMessageWarningMock } = vi.hoisted(() => ({ lxMessageWarningMock: vi.fn() }));

vi.mock('../../../../linkx-fe/src/components/LxMessage', () => ({
  lxMessage: { warning: lxMessageWarningMock },
}));

const treeData: LxVirtualTreeNode[] = [
  {
    id: 'root',
    label: '组织',
    children: [
      { id: 'leaf', label: '直属单位' },
      { id: 'locked', label: '禁用单位', disabled: true },
    ],
  },
  { id: 'other', label: '外部单位' },
];

const TreeStub = defineComponent({
  name: 'LxVirtualTree',
  props: {
    data: { type: Array, default: () => [] },
    height: { type: Number, default: 0 },
    modelValue: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue'],
  setup(_, { emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          class: 'tree-stub-control',
          onClick: () => emit('update:modelValue', ['leaf', 'other']),
        },
        '模拟树选择',
      );
  },
});

const CheckboxStub = defineComponent({
  name: 'ElCheckbox',
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          'data-testid': 'inherit-checkbox',
          'aria-pressed': String(props.modelValue),
          onClick: () => emit('update:modelValue', !props.modelValue),
        },
        slots.default?.(),
      );
  },
});

function mountPanel(props: Record<string, unknown> = {}) {
  return mount(LxTransferPanel, {
    props: { treeData, ...props },
    global: { stubs: { LxVirtualTree: TreeStub, ElCheckbox: CheckboxStub } },
  });
}

describe('LxTransferPanel', () => {
  beforeEach(() => lxMessageWarningMock.mockReset());

  it('全选可选节点，并在反选时保留树外的既有键', async () => {
    const wrapper = mountPanel({ modelValue: ['legacy-key', 'leaf'] });

    await wrapper.findAll('.lx-transfer-panel__header-actions button')[0].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['legacy-key', 'leaf', 'root', 'other']]);
    expect(wrapper.emitted('change')?.[0]?.[1]).toEqual([treeData[0]?.children?.[0], treeData[0], treeData[1]]);

    await wrapper.setProps({ modelValue: ['legacy-key', 'leaf', 'root', 'other'] });
    await wrapper.findAll('.lx-transfer-panel__header-actions button')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['legacy-key']]);
    wrapper.unmount();
  });

  it('树勾选不会丢失暂未加载或禁用节点，change 只返回当前树节点', async () => {
    const wrapper = mountPanel({ modelValue: ['legacy-key', 'locked'] });

    await wrapper.getComponent(TreeStub).vm.$emit('update:modelValue', ['leaf', 'other']);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['leaf', 'other', 'legacy-key', 'locked']]);
    expect(wrapper.emitted('change')?.[0]?.[1]).toEqual([
      treeData[0]?.children?.[0],
      treeData[1],
      treeData[0]?.children?.[1],
    ]);
    wrapper.unmount();
  });

  it('超过上限时拒绝增加数量，但仍允许移除和清空已有选择', async () => {
    const wrapper = mountPanel({ modelValue: ['leaf'], maxCount: 2 });

    expect(wrapper.findAll('.lx-transfer-panel__header-actions button')[0]?.attributes('disabled')).toBeDefined();
    await wrapper.getComponent(TreeStub).vm.$emit('update:modelValue', ['leaf', 'root', 'other']);
    expect(lxMessageWarningMock).toHaveBeenCalledWith('最多可选择 2 项');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await wrapper.setProps({ modelValue: ['leaf', 'root', 'other'] });
    await wrapper.get('.lx-transfer-panel__clear').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]]);
    expect(wrapper.emitted('clear-all')).toEqual([[]]);
    wrapper.unmount();
  });

  it('筛选已选项、逐项移除，并同步下级继承开关', async () => {
    const wrapper = mountPanel({ modelValue: ['leaf', 'legacy-key'] });

    await wrapper.get('input[aria-label="在已选项中检索"]').setValue('legacy');
    expect(wrapper.findAll('.lx-transfer-panel__selected-item')).toHaveLength(1);
    await wrapper.get('button[aria-label="移除 legacy-key"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['leaf']]);

    await wrapper.get('[data-testid="inherit-checkbox"]').trigger('click');
    expect(wrapper.emitted('update:inheritChild')).toEqual([[false]]);
    wrapper.unmount();
  });
});
