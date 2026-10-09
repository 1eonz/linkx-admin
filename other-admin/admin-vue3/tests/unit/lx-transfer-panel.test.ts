import { mount } from '@vue/test-utils';
import { LxTransferPanel, type LxTransferPanelNode } from 'lx-ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const { lxConfirmMock, lxMessageWarningMock, treeFilterMock } = vi.hoisted(() => ({
  lxConfirmMock: vi.fn(),
  lxMessageWarningMock: vi.fn(),
  treeFilterMock: vi.fn(),
}));

vi.mock('../../../../linkx-fe/src/components/LxMessage', () => ({
  lxMessage: { warning: lxMessageWarningMock },
}));

vi.mock('../../../../linkx-fe/src/components/LxConfirm', () => ({
  lxConfirm: lxConfirmMock,
}));

const treeData: LxTransferPanelNode[] = [
  {
    id: 'root',
    label: '组织',
    code: 'ORG-01',
    status: 'online',
    statusTone: 'success',
    children: [
      {
        id: 'leaf',
        label: '直属单位',
        code: 'UNIT-01',
        status: 'processing',
        statusTone: 'processing',
      },
      {
        id: 'locked',
        label: '禁用单位',
        code: 'LOCKED-01',
        status: 'offline',
        statusTone: 'offline',
        disabled: true,
      },
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
  setup(_, { emit, expose }) {
    expose({ filter: treeFilterMock });
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
  props: {
    modelValue: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    return () =>
      h('label', { 'data-testid': 'inherit-checkbox' }, [
        h('input', {
          type: 'checkbox',
          checked: props.modelValue,
          disabled: props.disabled,
          onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked),
        }),
        slots.default?.(),
      ]);
  },
});

function mountPanel(props: Record<string, unknown> = {}) {
  return mount(LxTransferPanel, {
    props: {
      treeData,
      inheritChildDescription: '测试规则：仅继承到所选组织的直属单位；关闭后仅保留组织本身。',
      ...props,
    },
    global: { stubs: { LxVirtualTree: TreeStub, ElCheckbox: CheckboxStub } },
  });
}

describe('LxTransferPanel', () => {
  beforeEach(() => {
    lxConfirmMock.mockReset();
    lxMessageWarningMock.mockReset();
    treeFilterMock.mockReset();
  });

  it('中间批量按钮加入当前树全部可选节点并保留树外既有键', async () => {
    const wrapper = mountPanel({ modelValue: ['legacy-key', 'leaf'] });

    expect(wrapper.findAll('.lx-transfer-panel__controls-label').map((label) => label.text())).toEqual([
      '全部加入',
      '全部移除',
    ]);
    await wrapper.get('button[aria-label="全部加入"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['legacy-key', 'leaf', 'root', 'other']]);
    expect(wrapper.emitted('change')?.[0]?.[1]).toEqual([treeData[0]?.children?.[0], treeData[0], treeData[1]]);
    wrapper.unmount();
  });

  it('默认将整树反选收在范围菜单中并说明筛选范围', async () => {
    const wrapper = mountPanel({ modelValue: ['leaf', 'legacy-key', 'locked'] });
    const scopeActions = wrapper.get('.lx-transfer-panel__scope-actions');
    const invertButton = wrapper.get('button[aria-label="反选本树可选项"]');

    expect(scopeActions.find('summary').text()).toContain('更多反选选项');
    expect(scopeActions.find('summary').attributes('aria-label')).toBe('更多反选选项，包含筛选隐藏项');
    expect(scopeActions.attributes('open')).toBeUndefined();
    await scopeActions.get('summary').trigger('click');
    expect(scopeActions.attributes('open')).toBeDefined();
    expect(invertButton.text()).toBe('反选本树可选项');
    const descriptionId = invertButton.attributes('aria-describedby');
    expect(descriptionId).toBeTruthy();
    expect(wrapper.get(`#${descriptionId}`).text()).toBe(
      '包括筛选隐藏项；不可选项和未加载到当前组织树的已选项保持不变。',
    );

    await invertButton.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['legacy-key', 'locked', 'root', 'other']]);
    wrapper.unmount();
  });

  it('将源树总节点数与当前可加入数量区分展示', () => {
    const wrapper = mountPanel({ modelValue: ['leaf'], maxCount: 2 });

    expect(wrapper.get('.lx-transfer-panel__caption').text()).toContain('树节点总数：4 个');
    expect(wrapper.get('[data-testid="select-all-compact-hint"]').text()).toContain('需加入');
    wrapper.unmount();
  });

  it('已选列表提供当前数量、总量和键盘焦点入口', () => {
    const wrapper = mountPanel({ modelValue: ['leaf'] });
    const selectedList = wrapper.get('.lx-transfer-panel__selected');

    expect(selectedList.attributes('tabindex')).toBe('0');
    expect(selectedList.attributes('aria-label')).toBe('已选资源列表，当前显示 1 项，共 1 项');
    wrapper.unmount();
  });

  it('移动面板切换按钮报告面板名称和数量，并同步按下状态', async () => {
    const wrapper = mountPanel({ modelValue: ['leaf'] });
    const sourceButton = wrapper.get('[data-testid="mobile-source-panel"]');
    const selectedButton = wrapper.get('[data-testid="mobile-selected-panel"]');

    expect(sourceButton.attributes('aria-label')).toBe('显示待选资源，当前树中 2 个待选节点');
    expect(sourceButton.attributes('aria-controls')).toBe(wrapper.get('.lx-transfer-panel__panel').attributes('id'));
    expect(sourceButton.attributes('aria-pressed')).toBe('true');
    expect(selectedButton.attributes('aria-pressed')).toBe('false');

    await selectedButton.trigger('click');

    expect(selectedButton.attributes('aria-pressed')).toBe('true');
    expect(sourceButton.attributes('aria-pressed')).toBe('false');
    expect(wrapper.get(`#${selectedButton.attributes('aria-controls')}`).classes()).not.toContain('is-mobile-hidden');
    wrapper.unmount();
  });

  it('筛选反选保留筛选外、禁用与树外已选键，全树加入仍覆盖可选节点', async () => {
    const wrapper = mountPanel({ modelValue: ['root', 'leaf', 'locked', 'legacy-key', 'other'] });
    const sourceFilter = wrapper.get('input[aria-label="按机构名称或部门编码筛选待选节点"]');

    await sourceFilter.setValue('直属');
    const invertFilteredButton = wrapper.get('button[aria-label="反选筛选结果"]');
    expect(invertFilteredButton.attributes('title')).toBe('只反转名称或部门编码匹配筛选文本的可选节点');
    await invertFilteredButton.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['root', 'locked', 'legacy-key', 'other']]);

    await wrapper.setProps({ modelValue: [] });
    await wrapper.get('button[aria-label="全部加入"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['root', 'leaf', 'other']]);
    wrapper.unmount();
  });

  it('按部门编码筛选树节点并将相同匹配结果用于批量选择', async () => {
    const wrapper = mountPanel({ modelValue: [] });
    const sourceFilter = wrapper.get('input[aria-label="按机构名称或部门编码筛选待选节点"]');

    await sourceFilter.setValue('UNIT-01');
    expect(treeFilterMock).toHaveBeenLastCalledWith('UNIT-01');
    await wrapper.get('button[aria-label="全选筛选结果"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['leaf']]);
    wrapper.unmount();
  });

  it('筛选批量操作的可见状态说明无匹配、已全选和达到上限', async () => {
    const wrapper = mountPanel({ modelValue: ['leaf'], maxCount: 2 });
    const sourceFilter = wrapper.get('input[aria-label="按机构名称或部门编码筛选待选节点"]');

    await sourceFilter.setValue('直属');
    const status = wrapper.get('[role="status"]');
    expect(status.text()).toBe('筛选结果已全部选择，共 1 项');
    expect(wrapper.get('button[aria-label="全选筛选结果"]').attributes('aria-describedby')).toBe(
      status.attributes('id'),
    );

    await sourceFilter.setValue('不存在');
    expect(status.text()).toBe('没有可批量操作的匹配节点');
    expect(wrapper.get('button[aria-label="全选筛选结果"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('button[aria-label="反选筛选结果"]').attributes('disabled')).toBeDefined();

    await wrapper.setProps({ modelValue: ['root', 'leaf'] });
    await sourceFilter.setValue('外部单位');
    expect(status.text()).toBe('达到选择上限：筛选结果有 1 项未选，当前可再选 0 项');
    expect(wrapper.get('button[aria-label="全选筛选结果"]').attributes('disabled')).toBeDefined();
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

    expect(wrapper.get('button[aria-label="全部加入"]').attributes('disabled')).toBeDefined();
    const selectAllButton = wrapper.get('button[aria-label="全部加入"]');
    const selectAllReason = wrapper.get('[data-testid="select-all-disabled-reason"]');
    expect(selectAllReason.text()).toBe('全量加入需要 2 项，当前还可加入 1 项');
    expect(selectAllReason.classes()).toContain('lx-transfer-panel__visually-hidden');
    expect(selectAllReason.element.parentElement?.classList.contains('lx-transfer-panel__controls-action')).toBe(true);
    expect(wrapper.get('[data-testid="select-all-compact-hint"]').text()).toBe('需加入 2 项；仅剩 1 个名额');
    expect(selectAllButton.attributes('aria-describedby')).toBe(selectAllReason.attributes('id'));

    await wrapper.getComponent(TreeStub).vm.$emit('update:modelValue', ['leaf', 'root', 'other']);
    expect(lxMessageWarningMock).toHaveBeenCalledWith('最多可选择 2 项');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    lxConfirmMock.mockResolvedValue(true);
    await wrapper.setProps({ modelValue: ['leaf', 'root', 'other'] });
    await wrapper.get('button[aria-label="全部移除"]').trigger('click');
    await vi.waitFor(() => {
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]]);
      expect(wrapper.emitted('clear-all')).toEqual([[]]);
    });
    wrapper.unmount();
  });

  it('清空后先通知受控值和 change，再通知宿主处理清空意图', async () => {
    const eventOrder: string[] = [];
    const wrapper = mount(LxTransferPanel, {
      props: {
        treeData,
        modelValue: ['leaf'],
        inheritChildDescription: '测试规则：仅继承到所选组织的直属单位；关闭后仅保留组织本身。',
        'onUpdate:modelValue': () => eventOrder.push('update:modelValue'),
        onChange: () => eventOrder.push('change'),
        onClearAll: () => eventOrder.push('clear-all'),
      },
      global: { stubs: { LxVirtualTree: TreeStub, ElCheckbox: CheckboxStub } },
    });

    lxConfirmMock.mockResolvedValue(true);
    await wrapper.get('button[aria-label="全部移除"]').trigger('click');
    await vi.waitFor(() => expect(eventOrder).toEqual(['update:modelValue', 'change', 'clear-all']));

    wrapper.unmount();
  });

  it('确认清空后将键盘焦点移回已选资源列表', async () => {
    const wrapper = mount(LxTransferPanel, {
      props: {
        treeData,
        modelValue: ['leaf'],
        inheritChildDescription: '测试规则：仅继承到所选组织的直属单位；关闭后仅保留组织本身。',
      },
      attachTo: document.body,
      global: { stubs: { LxVirtualTree: TreeStub, ElCheckbox: CheckboxStub } },
    });
    lxConfirmMock.mockResolvedValue(true);

    const clearButton = wrapper.get('button[aria-label="全部移除"]');
    clearButton.element.focus();
    await clearButton.trigger('click');

    const selectedList = wrapper.get('.lx-transfer-panel__selected');
    await vi.waitFor(() => expect(document.activeElement).toBe(selectedList.element));
    expect(wrapper.emitted('clear-all')).toEqual([[]]);
    wrapper.unmount();
  });

  it('局部 HUD 模式下将主题类传递给 Teleport 确认框', async () => {
    const wrapper = mountPanel({ modelValue: ['leaf'] });
    wrapper.element.classList.add('lx-theme-hud');
    lxConfirmMock.mockResolvedValue(false);

    await wrapper.get('button[aria-label="全部移除"]').trigger('click');

    expect(lxConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customClass: 'lx-theme-hud',
        danger: true,
      }),
    );
    wrapper.unmount();
  });

  it('局部 HUD 模式下未加载节点的移除确认也继承主题类', async () => {
    const wrapper = mountPanel({ treeData: [], modelValue: ['legacy-key'] });
    wrapper.element.classList.add('lx-theme-hud');
    lxConfirmMock.mockResolvedValue(false);

    await wrapper.get('button[aria-label="移除 legacy-key"]').trigger('click');

    expect(lxConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customClass: 'lx-theme-hud',
        danger: true,
        title: '移除未加载的授权',
      }),
    );
    wrapper.unmount();
  });

  it('数字键和同值字符串键可同时显示，缺少状态时不伪显示离线标记', () => {
    const wrapper = mountPanel({
      treeData: [
        { id: 1, label: '数字单位' },
        { id: '1', label: '字符串单位' },
      ],
      modelValue: [1, '1'],
    });

    expect(wrapper.findAll('.lx-transfer-panel__selected-item')).toHaveLength(2);
    expect(wrapper.findAll('.lx-transfer-panel__selected-name').map((item) => item.text())).toEqual([
      '数字单位',
      '字符串单位',
    ]);
    expect(wrapper.findAll('.lx-transfer-panel__selected-name .lx-transfer-panel__status-dot')).toHaveLength(0);
    expect(wrapper.find('.lx-transfer-panel__controls').attributes('role')).toBe('group');
    wrapper.unmount();
  });

  it('非法选择上限按 0 项处理，避免按钮状态与节点变更校验不一致', async () => {
    const wrapper = mountPanel({ modelValue: [], maxCount: Number.NaN });

    expect(wrapper.get('button[aria-label="全部加入"]').attributes('disabled')).toBeDefined();
    await wrapper.getComponent(TreeStub).vm.$emit('update:modelValue', ['leaf']);

    expect(lxMessageWarningMock).toHaveBeenCalledWith('最多可选择 0 项');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('筛选已选项、逐项移除，并同步下级继承开关', async () => {
    lxConfirmMock.mockResolvedValue(true);
    const wrapper = mountPanel({ modelValue: ['leaf', 'legacy-key'] });

    await wrapper.get('input[aria-label="在已选项中检索"]').setValue('legacy');
    expect(wrapper.findAll('.lx-transfer-panel__selected-item')).toHaveLength(1);
    await wrapper.get('button[aria-label="移除 legacy-key"]').trigger('click');
    expect(lxConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '移除未加载的授权',
        message: expect.stringContaining('legacy-key'),
        danger: true,
      }),
    );
    await vi.waitFor(() => expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['leaf']]));
    await wrapper.setProps({ modelValue: ['leaf'] });
    await wrapper.get('input[aria-label="在已选项中检索"]').setValue('处理中');
    expect(wrapper.findAll('.lx-transfer-panel__selected-item')).toHaveLength(1);

    await wrapper.get('[data-testid="inherit-checkbox"] input').setValue(false);
    expect(wrapper.emitted('update:inheritChild')).toEqual([[false]]);
    wrapper.unmount();
  });

  it('将宿主提供的继承说明关联到原生复选框，并同步更新和移除', async () => {
    const wrapper = mountPanel({ inheritChildDescription: '示例规则：仅向所选机构的直属下级继承。' });
    const checkbox = wrapper.get('[data-testid="inherit-checkbox"] input');
    const description = wrapper.get('.lx-transfer-panel__inherit-description');

    expect(description.text()).toBe('示例规则：仅向所选机构的直属下级继承。');
    expect(checkbox.attributes('aria-describedby')).toBe(description.attributes('id'));

    await wrapper.setProps({ inheritChildDescription: '更新后的宿主说明。' });
    expect(description.text()).toBe('更新后的宿主说明。');
    expect(checkbox.attributes('aria-describedby')).toBe(description.attributes('id'));

    await wrapper.setProps({ inheritChildDescription: undefined });
    expect(description.text()).toBe('尚未配置经确认的具体继承范围说明，当前不可更改此选项。');
    expect(checkbox.attributes('disabled')).toBeDefined();
    expect(checkbox.attributes('aria-describedby')).toBe(description.attributes('id'));

    await wrapper.setProps({ inheritChildDescription: '' });
    expect(description.text()).toBe('尚未配置经确认的具体继承范围说明，当前不可更改此选项。');
    expect(checkbox.attributes('disabled')).toBeDefined();
    expect(checkbox.attributes('aria-describedby')).toBe(description.attributes('id'));
    wrapper.unmount();
  });

  it('继承说明仅有空白时禁用开关并拒绝变更', async () => {
    const wrapper = mountPanel({ inheritChildDescription: '   ' });
    const checkbox = wrapper.get('[data-testid="inherit-checkbox"] input');

    expect(checkbox.attributes('disabled')).toBeDefined();
    expect(wrapper.get('.lx-transfer-panel__inherit-description').text()).toContain('经确认的具体继承范围说明');
    await wrapper.getComponent({ name: 'LxCheckbox' }).vm.$emit('update:modelValue', false);
    expect(wrapper.emitted('update:inheritChild')).toBeUndefined();
    wrapper.unmount();
  });

  it('暴露 5:2:5 版式、380px 面板高度及左右筛选契约', async () => {
    const wrapper = mountPanel({ modelValue: ['leaf'] });

    expect(wrapper.get('.lx-transfer-panel').attributes('data-lx-transfer-layout')).toBe('5:2:5');
    expect(wrapper.get('.lx-transfer-panel').attributes('style')).toContain('--lx-transfer-panel-height: 380px');
    expect(wrapper.findAll('.lx-transfer-panel__panel')).toHaveLength(2);
    expect(wrapper.get('input[aria-label="按机构名称或部门编码筛选待选节点"]').attributes('placeholder')).toBe(
      '输入机构名称/部门编码检索...',
    );
    expect(wrapper.get('input[aria-label="在已选项中检索"]').attributes('placeholder')).toBe('在已选名单中检索...');
    expect(wrapper.get('input[aria-label="按机构名称或部门编码筛选待选节点"]').attributes('type')).toBe('text');
    expect(wrapper.get('input[aria-label="按机构名称或部门编码筛选待选节点"]').attributes('inputmode')).toBe('search');
    expect(wrapper.get('input[aria-label="在已选项中检索"]').attributes('type')).toBe('text');
    expect(wrapper.get('input[aria-label="在已选项中检索"]').attributes('inputmode')).toBe('search');
    expect(wrapper.get('[data-lx-transfer-code="UNIT-01"]')).toBeTruthy();
    expect(wrapper.get('[data-status-tone="processing"]').text()).toContain('处理中');

    await wrapper.get('input[aria-label="按机构名称或部门编码筛选待选节点"]').setValue('直属');
    expect(treeFilterMock).toHaveBeenLastCalledWith('直属');
    await wrapper.get('button[aria-label="清除待选节点筛选"]').trigger('click');
    expect(treeFilterMock).toHaveBeenLastCalledWith('');

    await wrapper.get('input[aria-label="在已选项中检索"]').setValue('UNIT-01');
    expect(wrapper.findAll('.lx-transfer-panel__selected-item')).toHaveLength(1);
    wrapper.unmount();
  });

  it('未知状态名称与普通对象原型键冲突时仍原样显示', () => {
    const status = 'constructor';
    const wrapper = mountPanel({
      treeData: [{ id: 'prototype-status', label: '原型键状态', status }],
      modelValue: ['prototype-status'],
    });

    expect(wrapper.get('.lx-transfer-panel__selected-item .lx-transfer-panel__node-status').text()).toBe(status);
    wrapper.unmount();
  });

  it('同一应用中的多个实例具有唯一面板标题 ID 并正确关联分组', () => {
    const PanelPair = defineComponent({
      setup() {
        return () =>
          h('div', [
            h(LxTransferPanel, {
              treeData,
              inheritChildDescription: '测试规则：仅继承到所选组织的直属单位；关闭后仅保留组织本身。',
            }),
            h(LxTransferPanel, {
              treeData,
              inheritChildDescription: '测试规则：仅继承到所选组织的直属单位；关闭后仅保留组织本身。',
            }),
          ]);
      },
    });
    const wrapper = mount(PanelPair, {
      global: { stubs: { LxVirtualTree: TreeStub, ElCheckbox: CheckboxStub } },
    });
    const groups = wrapper.findAll('.lx-transfer-panel__panel[role="group"]');
    const titleIds = groups.map((group) => group.attributes('aria-labelledby'));

    expect(groups).toHaveLength(4);
    expect(new Set(titleIds).size).toBe(4);
    groups.forEach((group, index) => {
      expect(group.find(`#${titleIds[index]}`).exists()).toBe(true);
    });
    wrapper.unmount();
  });

  it('空选中列表显示设计态文案，并保留禁用节点的移除边界', async () => {
    const wrapper = mountPanel({ modelValue: [] });

    expect(wrapper.get('.lx-transfer-panel__empty').text()).toContain('暂无分配权限，请在左侧勾选');
    expect(wrapper.get('button[aria-label="全部移除"]').attributes('disabled')).toBeDefined();
    await wrapper.setProps({ modelValue: ['locked'] });
    await wrapper.get('button[aria-label="移除 禁用单位"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]]);
    wrapper.unmount();
  });

  it('纯空白已选筛选按未筛选空态显示', async () => {
    const wrapper = mountPanel({ modelValue: [] });
    const selectedFilter = wrapper.get('input[aria-label="在已选项中检索"]');

    await selectedFilter.setValue('   ');
    expect(wrapper.get('.lx-transfer-panel__empty').text()).toBe('暂无分配权限，请在左侧勾选');

    await selectedFilter.setValue('不存在');
    expect(wrapper.get('.lx-transfer-panel__empty').text()).toBe('未找到匹配的已选项');
    wrapper.unmount();
  });

  it('空树使用最近节点详情回显，未知键标注未加载并在移除前确认', async () => {
    lxConfirmMock.mockResolvedValue(false);
    const wrapper = mountPanel({
      treeData: [],
      modelValue: ['known-stale', 'unknown-key'],
      selectedItems: [
        { id: 'known-stale', label: '已知部门名称', code: 'DEPT-OLD', status: 'online' },
        { id: 'not-selected', label: '不应显示' },
      ],
    });
    const rows = wrapper.findAll('.lx-transfer-panel__selected-item');

    expect(rows).toHaveLength(2);
    expect(rows[0]?.text()).toContain('已知部门名称');
    expect(rows[0]?.text()).toContain('DEPT-OLD');
    expect(rows[0]?.text()).toContain('节点未加载');
    expect(rows[1]?.text()).toContain('unknown-key');
    expect(rows[1]?.text()).toContain('节点未加载');
    expect(wrapper.text()).not.toContain('不应显示');

    await wrapper.get('button[aria-label="移除 已知部门名称"]').trigger('click');
    expect(lxConfirmMock).toHaveBeenCalled();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await wrapper.setProps({
      treeData: [{ id: 'known-stale', label: '当前树中的正式名称', code: 'DEPT-NEW' }],
    });
    expect(wrapper.get('.lx-transfer-panel__selected-item').text()).toContain('当前树中的正式名称');
    expect(wrapper.get('.lx-transfer-panel__selected-item').text()).not.toContain('节点未加载');
    wrapper.unmount();
  });

  it('清空包含未加载节点的已选项前确认，取消后不发送变更', async () => {
    lxConfirmMock.mockResolvedValue(false);
    const wrapper = mountPanel({ treeData: [], modelValue: ['legacy-key'] });

    await wrapper.get('button[aria-label="全部移除"]').trigger('click');
    expect(lxConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '清空已选资源',
        message: expect.stringContaining('1 个当前树中未加载的项目'),
        confirmText: '确认清空',
      }),
    );
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('clear-all')).toBeUndefined();
    wrapper.unmount();
  });

  it('清空已加载选项也必须确认，取消后不发送变更', async () => {
    lxConfirmMock.mockResolvedValue(false);
    const wrapper = mountPanel({ modelValue: ['leaf'] });

    await wrapper.get('button[aria-label="全部移除"]').trigger('click');

    expect(lxConfirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '清空已选资源',
        message: '确认移除全部 1 项已选资源吗？清空后列表将立即更新。',
      }),
    );
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('clear-all')).toBeUndefined();
    wrapper.unmount();
  });

  it('未加载节点清空确认期间受控值变化时拒绝旧确认', async () => {
    let resolveConfirmation: (confirmed: boolean) => void = () => undefined;
    lxConfirmMock.mockImplementation(() => new Promise<boolean>((resolve) => (resolveConfirmation = resolve)));
    const wrapper = mountPanel({ treeData: [], modelValue: ['old-key'] });

    await wrapper.get('button[aria-label="全部移除"]').trigger('click');
    await wrapper.setProps({ modelValue: ['new-key'] });
    resolveConfirmation(true);
    await vi.waitFor(() =>
      expect(lxMessageWarningMock).toHaveBeenCalledWith('已选授权在确认期间发生变化，请检查后重新清空'),
    );

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('clear-all')).toBeUndefined();
    expect(wrapper.findAll('.lx-transfer-panel__selected-name').map((item) => item.text())).toEqual(['new-key']);
    wrapper.unmount();
  });

  it('未加载节点移除确认期间授权被移除后重新加入时拒绝旧确认', async () => {
    let resolveConfirmation: (confirmed: boolean) => void = () => undefined;
    lxConfirmMock.mockImplementation(() => new Promise<boolean>((resolve) => (resolveConfirmation = resolve)));
    const wrapper = mountPanel({ treeData: [], modelValue: ['legacy-key'] });

    await wrapper.get('button[aria-label="移除 legacy-key"]').trigger('click');
    await wrapper.setProps({ modelValue: [] });
    await wrapper.setProps({ modelValue: ['legacy-key'] });
    resolveConfirmation(true);
    await vi.waitFor(() =>
      expect(lxMessageWarningMock).toHaveBeenCalledWith('已选授权在确认期间发生变化，请检查后重新移除'),
    );

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.emitted('clear-all')).toBeUndefined();
    expect(wrapper.findAll('.lx-transfer-panel__selected-name').map((item) => item.text())).toEqual(['legacy-key']);
    wrapper.unmount();
  });

  it('未加载节点移除确认期间同值数组引用更新仍接受确认', async () => {
    let resolveConfirmation: (confirmed: boolean) => void = () => undefined;
    lxConfirmMock.mockImplementation(() => new Promise<boolean>((resolve) => (resolveConfirmation = resolve)));
    const initialKeys = ['leaf', 'legacy-key'];
    const wrapper = mountPanel({ treeData, modelValue: initialKeys });

    await wrapper.get('button[aria-label="移除 legacy-key"]').trigger('click');
    await wrapper.setProps({ modelValue: [...initialKeys] });
    resolveConfirmation(true);
    await vi.waitFor(() => expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['leaf']]));

    expect(lxMessageWarningMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
