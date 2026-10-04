import { mount } from '@vue/test-utils';
import { ElConfigProvider, ElForm, ElFormItem, ElTreeSelect, type FormInstance } from 'element-plus';
import type { Language } from 'element-plus/es/locale';
import en from 'element-plus/es/locale/lang/en';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { LxTreeSelect } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref } from 'vue';

describe('LxTreeSelect', () => {
  it('keeps tree values and forwards the public focus contract', async () => {
    const wrapper = mount(LxTreeSelect, {
      props: {
        modelValue: 42,
        data: [{ id: 42, name: '节点' }],
        valueKey: 'id',
      },
    });

    expect(wrapper.find('.lx-tree-select').exists()).toBe(true);
    expect(wrapper.props('modelValue')).toBe(42);
    expect(typeof (wrapper.vm as { focus?: () => void }).focus).toBe('function');
    wrapper.unmount();
  });

  it('supports empty and multiple values without string coercion', () => {
    const wrapper = mount(LxTreeSelect, {
      props: {
        modelValue: ['a', 2],
        data: [],
        multiple: true,
        valueKey: 'id',
      },
    });

    expect(wrapper.props('modelValue')).toEqual(['a', 2]);
    expect(wrapper.props('multiple')).toBe(true);
    wrapper.unmount();
  });

  it('defers multiple changes until footer confirmation', async () => {
    const wrapper = mount(LxTreeSelect, {
      props: {
        modelValue: ['a'],
        data: [
          { id: 'a', name: '节点 A' },
          { id: 'b', name: '节点 B' },
        ],
        multiple: true,
        valueKey: 'id',
        teleported: false,
      },
    });
    const treeSelect = wrapper.findComponent(ElTreeSelect);

    await treeSelect.vm.$emit('update:modelValue', ['a', 'b']);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.vm.confirm).toBeTypeOf('function');

    wrapper.vm.confirm();
    expect(wrapper.emitted('update:modelValue')).toEqual([[['a', 'b']]]);
    expect(wrapper.emitted('change')).toEqual([[['a', 'b']]]);
    expect(wrapper.emitted('confirm')).toEqual([[['a', 'b']]]);
    wrapper.unmount();
  });

  it('blocks exposed confirm and retry while loading or form-disabled', async () => {
    const loading = ref(true);
    const formDisabled = ref(false);
    const treeSelectRef = ref<{ confirm: () => void }>();
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ElForm,
            { disabled: formDisabled.value },
            {
              default: () =>
                h(LxTreeSelect, {
                  ref: treeSelectRef,
                  multiple: true,
                  loading: loading.value,
                  error: true,
                  retryable: true,
                  teleported: false,
                }),
            },
          );
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    const treeSelect = wrapper.findComponent(LxTreeSelect);
    await treeSelect.find('input').trigger('click');
    await nextTick();
    const confirm = wrapper.find('.lx-tree-select__footer-button.is-primary');
    const retry = wrapper.find('.lx-tree-select__retry');

    expect((confirm.element as HTMLButtonElement).disabled).toBe(true);
    expect((retry.element as HTMLButtonElement).disabled).toBe(true);
    treeSelectRef.value?.confirm();
    await retry.trigger('click');
    expect(treeSelect.emitted('confirm')).toBeUndefined();
    expect(treeSelect.emitted('retry')).toBeUndefined();

    loading.value = false;
    formDisabled.value = true;
    await nextTick();
    expect((confirm.element as HTMLButtonElement).disabled).toBe(true);
    expect((retry.element as HTMLButtonElement).disabled).toBe(true);
    treeSelectRef.value?.confirm();
    await retry.trigger('click');
    expect(treeSelect.emitted('confirm')).toBeUndefined();
    expect(treeSelect.emitted('retry')).toBeUndefined();

    formDisabled.value = false;
    await nextTick();
    treeSelectRef.value?.confirm();
    await retry.trigger('click');
    expect(treeSelect.emitted('confirm')).toHaveLength(1);
    expect(treeSelect.emitted('retry')).toHaveLength(1);
    wrapper.unmount();
  });

  it('closes a single-select menu and ignores late changes when form-disabled', async () => {
    const formDisabled = ref(false);
    const visibleChanges: boolean[] = [];
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ElForm,
            { disabled: formDisabled.value },
            {
              default: () =>
                h(LxTreeSelect, {
                  data: [{ id: 'a', name: '节点 A' }],
                  valueKey: 'id',
                  teleported: false,
                  onVisibleChange: (visible: boolean) => visibleChanges.push(visible),
                }),
            },
          );
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    const treeSelect = wrapper.findComponent(LxTreeSelect);

    await treeSelect.find('input').trigger('click');
    await nextTick();
    expect(visibleChanges.at(-1)).toBe(true);

    formDisabled.value = true;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(visibleChanges.at(-1)).toBe(false);

    wrapper.findComponent(ElTreeSelect).vm.$emit('update:modelValue', 'a');
    expect(treeSelect.emitted('update:modelValue')).toBeUndefined();
    expect(treeSelect.emitted('change')).toBeUndefined();
    wrapper.unmount();
  });

  it('discards a multiple draft when cancelled', async () => {
    const wrapper = mount(LxTreeSelect, {
      props: {
        modelValue: ['a'],
        data: [{ id: 'a', name: '节点 A' }],
        multiple: true,
        valueKey: 'id',
        teleported: false,
      },
    });
    const treeSelect = wrapper.findComponent(ElTreeSelect);

    await treeSelect.vm.$emit('update:modelValue', ['b']);
    wrapper.vm.cancel();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(treeSelect.props('modelValue')).toEqual(['a']);
    wrapper.unmount();
  });

  it('does not retain a closed programmatic action for the next menu session', async () => {
    const wrapper = mount(LxTreeSelect, {
      props: {
        modelValue: ['a'],
        data: [
          { id: 'a', name: '节点 A' },
          { id: 'b', name: '节点 B' },
        ],
        multiple: true,
        valueKey: 'id',
        teleported: false,
      },
    });
    const treeSelect = wrapper.findComponent(ElTreeSelect);

    wrapper.vm.cancel();
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    await treeSelect.vm.$emit('visible-change', true);
    await treeSelect.vm.$emit('update:modelValue', ['b']);
    await treeSelect.vm.$emit('visible-change', false);

    expect(wrapper.emitted('cancel')).toHaveLength(2);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(treeSelect.props('modelValue')).toEqual(['a']);
    wrapper.unmount();
  });

  it('exposes host observable error and retry states', async () => {
    const wrapper = mount(LxTreeSelect, {
      props: {
        error: '组织目录加载失败',
        retryable: true,
        retryText: '重新加载',
      },
    });

    expect(wrapper.find('[role="alert"]').text()).toContain('组织目录加载失败');
    expect(wrapper.find('[role="alert"]').attributes('aria-live')).toBe('assertive');
    const input = wrapper.find('input');
    const errorId = wrapper.find('[role="alert"]').attributes('id');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')?.split(' ')).toContain(errorId);
    await wrapper.find('.lx-tree-select__retry').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
    expect(wrapper.find('.lx-tree-select-field').attributes('aria-invalid')).toBe('true');
    wrapper.unmount();
  });

  it('localizes fallback error copy and preserves explicit descriptions', async () => {
    const wrapper = mount(LxTreeSelect, {
      props: {
        id: 'department-tree',
        'aria-describedby': 'department-help',
        locale: en,
        error: true,
        retryable: true,
      },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    const error = wrapper.find('[role="alert"]');

    expect(error.text()).toBe('Failed to load organization dataRetry');
    expect(error.attributes('id')).toBe('department-tree-error');
    expect(input.attributes('aria-describedby')).toBe('department-help department-tree-error');

    await wrapper.setProps({ error: false });
    expect(input.attributes('aria-describedby')).toBe('department-help');
    expect(input.attributes('aria-invalid')).toBeUndefined();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('preserves host aria-invalid while clearing its own error state', async () => {
    const wrapper = mount(LxTreeSelect, {
      props: { error: true },
      attrs: { 'aria-invalid': 'true' },
      attachTo: document.body,
    });
    const input = wrapper.find('input');

    expect(input.attributes('aria-invalid')).toBe('true');
    await wrapper.setProps({ error: false });
    expect(input.attributes('aria-invalid')).toBe('true');
    wrapper.unmount();
  });

  it('tracks real form validation changes without a tree-select update', async () => {
    const model = reactive({ department: '' });
    const formRef = ref<FormInstance>();
    const rules = {
      department: [{ required: true, message: '请选择部门', trigger: 'change' }],
    };
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ElForm,
            { ref: formRef, model, rules },
            {
              default: () =>
                h(
                  ElFormItem,
                  { prop: 'department' },
                  {
                    default: () =>
                      h(LxTreeSelect, {
                        modelValue: model.department,
                        'aria-describedby': 'field-help',
                      }),
                  },
                ),
            },
          );
      },
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
    });
    const input = wrapper.find('input');

    expect(input.attributes('aria-describedby')?.split(' ')).toContain('field-help');
    await formRef.value?.validateField('department').catch(() => undefined);
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.find('.el-form-item').classes()).toContain('is-error');

    const formItem = wrapper.find('.el-form-item').element;
    const errorMessage = document.createElement('div');
    errorMessage.className = 'el-form-item__error';
    errorMessage.textContent = '请选择部门';
    formItem.append(errorMessage);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const errorId = errorMessage.id;
    expect(errorId).toMatch(/^lx-tree-select-validation-error-\d+$/);
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')?.split(' ')).toContain(errorId);

    formItem.removeChild(errorMessage);
    await new Promise((resolve) => setTimeout(resolve, 0));
    formRef.value?.resetFields();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.find('.el-form-item').classes()).not.toContain('is-error');
    expect(input.attributes('aria-invalid')).toBeUndefined();
    expect(input.attributes('aria-describedby')).toBe('field-help');
    wrapper.unmount();
  });

  it('localizes the multiple-selection footer and allows copy overrides', async () => {
    const wrapper = mount(LxTreeSelect, {
      props: {
        modelValue: ['a'],
        multiple: true,
        locale: en,
        teleported: false,
      },
    });

    expect(wrapper.find('.lx-tree-select__footer').text()).toContain('1 selected');
    expect(wrapper.find('.lx-tree-select__footer').text()).toContain('Cancel');
    expect(wrapper.find('.lx-tree-select__footer').text()).toContain('Confirm');
    wrapper.unmount();

    const overridden = mount(LxTreeSelect, {
      props: {
        modelValue: ['a'],
        multiple: true,
        selectedText: '{count} departments',
        unselectedText: 'Choose departments',
        cancelText: 'Back',
        confirmText: 'Apply',
        teleported: false,
      },
    });

    expect(overridden.find('.lx-tree-select__footer').text()).toContain('1 departments');
    expect(overridden.find('.lx-tree-select__footer').text()).toContain('Back');
    expect(overridden.find('.lx-tree-select__footer').text()).toContain('Apply');
    overridden.vm.cancel();
    await overridden.setProps({ modelValue: [] });
    expect(overridden.find('.lx-tree-select__footer').text()).toContain('Choose departments');
    overridden.unmount();
  });

  it('tracks locale changes inherited from the host config provider', async () => {
    const locale = ref<Language>(zhCn);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ElConfigProvider,
            { locale: locale.value },
            {
              default: () => h(LxTreeSelect, { error: true, retryable: true }),
            },
          );
      },
    });
    const wrapper = mount(Host);

    expect(wrapper.find('.lx-tree-select__error').text()).toContain('组织目录加载失败');
    locale.value = en;
    await nextTick();
    expect(wrapper.find('.lx-tree-select__error').text()).toContain('Failed to load organization data');
    wrapper.unmount();
  });

  it('forwards explicit empty and loading text props', () => {
    const wrapper = mount(LxTreeSelect, {
      props: {
        emptyText: '暂无组织',
        noMatchText: '没有匹配组织',
        loadingText: '正在读取组织',
      },
    });
    const treeSelect = wrapper.findComponent(ElTreeSelect);

    expect(treeSelect.props('emptyText')).toBe('暂无组织');
    expect(treeSelect.props('noDataText')).toBe('暂无组织');
    expect(treeSelect.props('noMatchText')).toBe('没有匹配组织');
    expect(treeSelect.props('loadingText')).toBe('正在读取组织');
    wrapper.unmount();
  });
});
