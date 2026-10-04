import { mount } from '@vue/test-utils';
import {
  ElCascader,
  ElConfigProvider,
  ElForm,
  ElFormItem,
  type CascaderProps,
  type FormInstance,
  type Language,
} from 'element-plus';
import en from 'element-plus/es/locale/lang/en';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { LxCascader } from 'lx-ui';
import type { LxCascaderOption, LxCascaderProps } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref } from 'vue';

describe('LxCascader', () => {
  const options = [
    {
      label: '市局',
      value: 'city',
      children: [{ label: '指挥中心', value: 'command' }],
    },
  ];

  it('keeps path values and forwards the public focus contract', () => {
    const wrapper = mount(LxCascader, {
      props: {
        modelValue: ['city', 'command'],
        options,
      },
    });

    expect(wrapper.find('.lx-cascader').exists()).toBe(true);
    expect(wrapper.props('modelValue')).toEqual(['city', 'command']);
    expect(typeof (wrapper.vm as { focus?: () => void }).focus).toBe('function');
    expect(typeof (wrapper.vm as { togglePopperVisible?: () => void }).togglePopperVisible).toBe('function');
    expect(typeof (wrapper.vm as { getCheckedNodes?: () => unknown }).getCheckedNodes).toBe('function');
    wrapper.unmount();
  });

  it('supports object values without coercing the selected record', () => {
    const value = { id: 7, label: '节点' };
    const wrapper = mount(LxCascader, {
      props: {
        modelValue: value,
        options: [{ label: '节点', value }],
        emitPath: false,
      },
    });

    expect(wrapper.props('modelValue')).toEqual(value);
    expect(wrapper.props('emitPath')).toBe(false);
    wrapper.unmount();
  });

  it('supports custom option fields and Element Plus field mappings', () => {
    const customOptions: LxCascaderOption[] = [
      {
        name: '市局',
        nodeCode: 'city',
        childrenList: [{ name: '指挥中心', nodeCode: 'command' }],
      },
    ];
    const cascaderProps: LxCascaderProps = {
      modelValue: ['city', 'command'],
      options: customOptions,
      props: { label: 'name', value: 'nodeCode', children: 'childrenList' },
    };
    const wrapper = mount(LxCascader, { props: cascaderProps });
    const cascader = wrapper.findComponent(ElCascader);

    expect(cascader.props('options')).toEqual(customOptions);
    expect(cascader.props('props')).toEqual(cascaderProps.props);
    wrapper.unmount();
  });

  it('uses nested selection settings unless an explicit shortcut overrides them', async () => {
    const wrapper = mount(LxCascader, {
      props: {
        options,
        props: {
          label: 'name',
          value: 'nodeCode',
          children: 'childrenList',
          multiple: true,
          checkStrictly: true,
          emitPath: false,
        },
      },
    });
    const cascader = wrapper.findComponent(ElCascader);

    expect(cascader.props('props')).toMatchObject({
      label: 'name',
      value: 'nodeCode',
      children: 'childrenList',
      multiple: true,
      checkStrictly: true,
      emitPath: false,
    });

    await wrapper.setProps({
      multiple: false,
      checkStrictly: false,
      emitPath: true,
    });
    expect(cascader.props('props')).toMatchObject({
      label: 'name',
      value: 'nodeCode',
      children: 'childrenList',
      multiple: false,
      checkStrictly: false,
      emitPath: true,
    });
    wrapper.unmount();
  });

  it('disables cascader nodes and suppresses selection events while loading or errored', async () => {
    const wrapper = mount(LxCascader, {
      props: {
        options,
        loading: true,
        props: { multiple: true, disabled: 'disabled' },
      },
    });
    const cascader = wrapper.findComponent(ElCascader);
    const selected: LxCascaderProps['modelValue'] = [['city', 'command']];

    const loadingProps = cascader.props('props') as CascaderProps;
    expect(loadingProps.multiple).toBe(true);
    expect(typeof loadingProps.disabled).toBe('function');
    if (typeof loadingProps.disabled === 'function') {
      expect(loadingProps.disabled(options[0], {} as Parameters<typeof loadingProps.disabled>[1])).toBe(true);
    }

    cascader.vm.$emit('update:modelValue', selected);
    cascader.vm.$emit('change', selected);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('change')).toBeUndefined();

    await wrapper.setProps({ loading: false, error: true });
    cascader.vm.$emit('update:modelValue', selected);
    cascader.vm.$emit('change', selected);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('change')).toBeUndefined();

    await wrapper.setProps({ error: false });
    expect((cascader.props('props') as CascaderProps).disabled).toBe('disabled');
    cascader.vm.$emit('update:modelValue', selected);
    cascader.vm.$emit('change', selected);
    expect(wrapper.emitted('update:modelValue')).toEqual([[selected]]);
    expect(wrapper.emitted('change')).toEqual([[selected]]);
    wrapper.unmount();
  });

  it('disables clear and tag removal while paused, then restores them', async () => {
    const multipleOptions = [
      {
        label: '市局',
        value: 'city',
        children: [
          { label: '指挥中心', value: 'command' },
          { label: '调度中心', value: 'dispatch' },
        ],
      },
    ];
    const wrapper = mount(LxCascader, {
      props: {
        modelValue: [
          ['city', 'command'],
          ['city', 'dispatch'],
        ],
        options: multipleOptions,
        multiple: true,
        clearable: true,
        filterable: true,
        loading: true,
      },
    });
    await nextTick();
    const cascader = wrapper.findComponent(ElCascader);

    expect(cascader.props('clearable')).toBe(false);
    expect(wrapper.find('.lx-cascader').classes()).toContain('lx-cascader--selection-paused');
    const searchInput = wrapper.find('.el-cascader__search-input');
    const initialTags = wrapper.findAll('.el-cascader__tags .el-tag');
    expect(initialTags).toHaveLength(2);

    for (const key of ['Backspace', 'Delete']) {
      const keyboardEvent = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      searchInput.element.dispatchEvent(keyboardEvent);
      expect(keyboardEvent.defaultPrevented).toBe(true);
    }
    expect(wrapper.findAll('.el-cascader__tags .el-tag')).toHaveLength(2);

    await wrapper.setProps({ loading: false, error: true });
    expect(cascader.props('clearable')).toBe(false);
    expect(wrapper.find('.lx-cascader').classes()).toContain('lx-cascader--selection-paused');

    await wrapper.setProps({ error: false });
    expect(cascader.props('clearable')).toBe(true);
    expect(wrapper.find('.lx-cascader').classes()).not.toContain('lx-cascader--selection-paused');
    wrapper.unmount();
  });

  it('closes an open popper before the disabled prop reaches Element Plus', async () => {
    const wrapper = mount(LxCascader, {
      props: { options, teleported: false },
      attachTo: document.body,
    });
    const instance = wrapper.vm as unknown as {
      togglePopperVisible: (visible?: boolean) => void;
    };

    instance.togglePopperVisible(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.emitted('visibleChange')?.at(-1)).toEqual([true]);

    await wrapper.setProps({ disabled: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.emitted('visibleChange')?.at(-1)).toEqual([false]);
    expect(wrapper.find('.lx-cascader .el-input').classes()).toContain('is-disabled');
    wrapper.unmount();
  });

  it('inherits form disabled state, closes its popper, and disables retry', async () => {
    const disabled = ref(false);
    const cascaderRef = ref<{ togglePopperVisible: (visible?: boolean) => void }>();
    const visibleChanges: boolean[] = [];
    let retryCount = 0;
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ElForm,
            { disabled: disabled.value },
            {
              default: () =>
                h(LxCascader, {
                  ref: cascaderRef,
                  options,
                  error: true,
                  teleported: false,
                  onVisibleChange: (visible: boolean) => visibleChanges.push(visible),
                  onRetry: () => retryCount++,
                }),
            },
          );
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });

    cascaderRef.value?.togglePopperVisible(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(visibleChanges).toEqual([true]);

    disabled.value = true;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(visibleChanges).toEqual([true, false]);
    expect(wrapper.find('.lx-cascader .el-input').classes()).toContain('is-disabled');
    const retry = wrapper.find('.lx-cascader__feedback .lx-cascader__retry');
    expect((retry.element as HTMLButtonElement).disabled).toBe(true);
    await retry.trigger('click');
    expect(retryCount).toBe(0);
    wrapper.unmount();
  });

  it('forwards form and accessible name attributes to the input', () => {
    const wrapper = mount(LxCascader, {
      props: {
        id: 'organization-path',
        name: 'organizationPath',
        autocomplete: 'off',
        ariaLabel: '组织路径',
      },
      attachTo: document.body,
    });
    const input = wrapper.find('input');

    expect(input.attributes('id')).toBe('organization-path');
    expect(input.attributes('name')).toBe('organizationPath');
    expect(input.attributes('autocomplete')).toBe('off');
    expect(input.attributes('aria-label')).toBe('组织路径');
    wrapper.unmount();
  });

  it('supports multiple path values without flattening them', () => {
    const wrapper = mount(LxCascader, {
      props: {
        modelValue: [
          ['city', 'command'],
          ['city', 'dispatch'],
        ],
        options,
        multiple: true,
      },
    });

    expect(wrapper.props('modelValue')).toEqual([
      ['city', 'command'],
      ['city', 'dispatch'],
    ]);
    expect(wrapper.props('multiple')).toBe(true);
    wrapper.unmount();
  });

  it('exposes loading and error recovery states', async () => {
    const wrapper = mount(LxCascader, {
      props: {
        options,
        loading: true,
        error: true,
        loadingText: '组织数据加载中',
        errorText: '组织数据读取失败',
        retryText: '重新读取',
        teleported: false,
      },
      attachTo: document.body,
    });

    expect(wrapper.find('.lx-cascader-field').attributes('aria-busy')).toBe('true');
    expect(wrapper.find('.lx-cascader__feedback').text()).toContain('组织数据加载中');
    expect(wrapper.find('.lx-cascader-field').attributes('aria-invalid')).toBeUndefined();
    expect(wrapper.find('.lx-cascader__retry').exists()).toBe(false);

    (wrapper.vm as unknown as { togglePopperVisible: (visible: boolean) => void }).togglePopperVisible(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.find('.lx-cascader__popper').classes()).toContain('is-loading');
    (wrapper.vm as unknown as { togglePopperVisible: (visible: boolean) => void }).togglePopperVisible(false);

    await wrapper.setProps({ loading: false });
    expect(wrapper.find('.lx-cascader-field').attributes('aria-invalid')).toBe('true');
    expect(wrapper.find('.lx-cascader__feedback').attributes('role')).toBe('alert');
    expect(wrapper.find('.lx-cascader__feedback').text()).toContain('组织数据读取失败');
    const input = wrapper.find('input');
    const errorId = wrapper.find('.lx-cascader__feedback span').attributes('id');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')?.split(' ')).toContain(errorId);
    await wrapper.find('.lx-cascader__feedback .lx-cascader__retry').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
    wrapper.unmount();
  });

  it('uses the selected locale for built-in feedback copy', async () => {
    const wrapper = mount(LxCascader, {
      props: {
        loading: true,
        locale: en,
      },
    });

    expect(wrapper.find('.lx-cascader__feedback').text()).toContain('Loading');
    await wrapper.setProps({ loading: false, error: true });
    expect(wrapper.find('.lx-cascader__feedback').text()).toContain('Failed to load organization data');
    expect(wrapper.find('.lx-cascader__retry').text()).toBe('Retry');
    wrapper.unmount();
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
              default: () => h(LxCascader, { error: true }),
            },
          );
      },
    });
    const wrapper = mount(Host);

    expect(wrapper.find('.lx-cascader__feedback').text()).toContain('组织数据加载失败');
    locale.value = en;
    await nextTick();
    expect(wrapper.find('.lx-cascader__feedback').text()).toContain('Failed to load organization data');
    wrapper.unmount();
  });

  it('gives loading precedence when loading and error are both active', async () => {
    const wrapper = mount(LxCascader, {
      props: { options, loading: true, error: true },
      attachTo: document.body,
    });
    const input = wrapper.find('input');

    expect(wrapper.find('.lx-cascader__feedback').text()).toContain('加载中');
    expect(wrapper.find('.lx-cascader__feedback').text()).not.toContain('加载失败');
    expect(input.attributes('aria-invalid')).toBeUndefined();
    expect(input.attributes('aria-describedby')).toBeUndefined();
    expect(wrapper.find('.lx-cascader__retry').exists()).toBe(false);

    await wrapper.setProps({ loading: false });
    expect(wrapper.find('.lx-cascader__feedback').attributes('role')).toBe('alert');
    expect(wrapper.find('.lx-cascader__feedback').text()).toContain('加载失败');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.find('.lx-cascader__retry').exists()).toBe(true);
    wrapper.unmount();
  });

  it('keeps one error description across opening and closing a persistent panel', async () => {
    const wrapper = mount(LxCascader, {
      props: { id: 'path-field', options, error: true, teleported: false },
      attrs: { 'aria-describedby': 'path-help' },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    const instance = wrapper.vm as unknown as {
      togglePopperVisible: (visible: boolean) => void;
    };

    expect(input.attributes('aria-describedby')).toBe('path-help path-field-error');
    expect(wrapper.find('.lx-cascader__feedback').attributes('role')).toBe('alert');
    expect(wrapper.find('.lx-cascader__feedback').attributes('aria-live')).toBe('assertive');
    for (const visible of [true, false, true, false]) {
      instance.togglePopperVisible(visible);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(document.querySelectorAll('#path-field-error')).toHaveLength(1);
      const errorDescription = document.getElementById('path-field-error');
      expect(errorDescription?.textContent).toContain('组织数据加载失败');
      expect(errorDescription?.closest('[role="alert"]')?.getAttribute('aria-live')).toBe('assertive');
      expect(
        errorDescription?.closest(visible ? '.lx-cascader__panel-footer' : '.lx-cascader__feedback'),
      ).not.toBeNull();
      expect(input.attributes('aria-describedby')).toBe('path-help path-field-error');
    }

    await wrapper.setProps({ error: false });
    expect(input.attributes('aria-describedby')).toBe('path-help');
    expect(input.attributes('aria-invalid')).toBeUndefined();
    expect(document.querySelectorAll('#path-field-error')).toHaveLength(0);
    wrapper.unmount();
  });

  it('preserves host aria-invalid while clearing its own error state', async () => {
    const wrapper = mount(LxCascader, {
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

  it('tracks real form validation changes without a cascader update', async () => {
    const model = reactive({ path: '' });
    const formRef = ref<FormInstance>();
    const rules = {
      path: [{ required: true, message: '请选择组织路径', trigger: 'change' }],
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
                  { prop: 'path' },
                  {
                    default: () =>
                      h(LxCascader, {
                        modelValue: model.path,
                        options,
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
    await formRef.value?.validateField('path').catch(() => undefined);
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.find('.el-form-item').classes()).toContain('is-error');

    const formItem = wrapper.find('.el-form-item').element;
    const errorMessage = document.createElement('div');
    errorMessage.className = 'el-form-item__error';
    errorMessage.textContent = '请选择组织路径';
    formItem.append(errorMessage);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const errorId = errorMessage.id;
    expect(errorId).toMatch(/^lx-cascader-validation-error-\d+$/);
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

  it('closes the open popper when Escape is pressed at document level', async () => {
    const wrapper = mount(LxCascader, {
      props: { options, teleported: false },
      attachTo: document.body,
    });
    const instance = wrapper.vm as unknown as {
      togglePopperVisible: (visible?: boolean) => void;
    };

    instance.togglePopperVisible(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.emitted('visibleChange')?.at(-1)).toEqual([true]);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper.emitted('visibleChange')?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });
});
