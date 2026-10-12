import { mount } from '@vue/test-utils';
import { ElForm } from 'element-plus';
import { LxTextarea } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

describe('LxTextarea', () => {
  it('renders the lx-textarea shell around the EP textarea root', () => {
    const wrapper = mount(LxTextarea);

    expect(wrapper.classes()).toContain('lx-textarea');
    expect(wrapper.find('.lx-textarea__control.el-textarea').exists()).toBe(true);
    expect(wrapper.find('textarea.el-textarea__inner').exists()).toBe(true);
    wrapper.unmount();
  });

  it('applies the three-row baseline by default and forwards custom rows', () => {
    const baseline = mount(LxTextarea);

    expect(baseline.get('textarea').attributes('rows')).toBe('3');
    baseline.unmount();

    const custom = mount(LxTextarea, { props: { rows: 5 } });
    expect(custom.get('textarea').attributes('rows')).toBe('5');
    custom.unmount();
  });

  it('updates the model value through input and forwards the native change event', async () => {
    const wrapper = mount(LxTextarea, { props: { modelValue: '' } });

    const textarea = wrapper.find('textarea.el-textarea__inner');
    const value = '实行双警携犬网格化巡逻。';
    await textarea.setValue(value);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([value]);
    expect(wrapper.emitted('input')?.at(-1)).toEqual([value]);

    await wrapper.setProps({ modelValue: value });
    await textarea.trigger('change');
    expect(wrapper.emitted('change')?.at(-1)).toEqual([value]);
    wrapper.unmount();
  });

  it('设置最大长度时默认显示内容长度计数，并支持关闭或切换位置', () => {
    const outside = mount(LxTextarea, {
      props: { modelValue: '布控细则', maxlength: 200 },
    });

    const counter = outside.get('.lx-textarea__count');
    expect(counter.text()).toBe('4 / 200');
    expect(counter.attributes('aria-label')).toBe('内容长度 4 / 200');
    expect(counter.attributes('role')).toBe('status');
    expect(counter.attributes('aria-live')).toBe('off');
    expect(counter.classes()).toContain('lx-textarea__count--outside');
    outside.unmount();

    const hidden = mount(LxTextarea, {
      props: {
        modelValue: '布控细则',
        maxlength: 200,
        showWordLimit: false,
      },
    });
    expect(hidden.find('.lx-textarea__count').exists()).toBe(false);
    hidden.unmount();

    // 无 maxlength：EP 2.14.6 移除旧版"域外开口计数"行为，计数器不再渲染
    const none = mount(LxTextarea, { props: { modelValue: '补充指令' } });

    expect(none.find('.lx-textarea__count').exists()).toBe(false);
    none.unmount();

    const zeroLimit = mount(LxTextarea, { props: { maxlength: 0 } });
    expect(zeroLimit.get('textarea').attributes('maxlength')).toBe('0');
    expect(zeroLimit.get('.lx-textarea__count').text()).toContain('0 / 0');
    expect(zeroLimit.get('.lx-textarea__count').text()).toContain('已达上限');
    zeroLimit.unmount();

    const emojiLength = mount(LxTextarea, {
      props: { modelValue: '😀', maxlength: 2 },
    });
    expect(emojiLength.get('.lx-textarea__count').text()).toContain('2 / 2');
    expect(emojiLength.get('.lx-textarea__count').text()).toContain('已达上限');
    emojiLength.unmount();

    const inside = mount(LxTextarea, {
      props: {
        modelValue: '布控细则',
        maxlength: 200,
        showWordLimit: true,
        wordLimitPosition: 'inside',
      },
    });

    expect(inside.get('.lx-textarea__count').classes()).toContain('lx-textarea__count--inside');
    inside.unmount();
  });

  it('硬截断到达上限时显示状态并播报一次', async () => {
    const wrapper = mount(LxTextarea, {
      props: { modelValue: '1234', maxlength: 5 },
    });
    const counter = wrapper.get('.lx-textarea__count');
    const announcement = wrapper.get('.lx-textarea__limit-announcement');

    expect(announcement.text()).toBe('');
    await wrapper.setProps({ modelValue: '12345' });
    expect(counter.text()).toContain('已达上限');
    expect(counter.attributes('aria-label')).toBe('内容长度已达到上限 5 / 5');
    expect(announcement.text()).toBe('已达到内容长度上限。');

    await wrapper.setProps({ modelValue: '1234' });
    expect(announcement.text()).toBe('');
    await wrapper.setProps({ modelValue: '12345' });
    expect(announcement.text()).toBe('已达到内容长度上限。');
    wrapper.unmount();
  });

  it('初始值已达到硬上限时可读出状态但不主动播报', () => {
    const wrapper = mount(LxTextarea, {
      props: { modelValue: '12345', maxlength: 5 },
    });

    expect(wrapper.get('.lx-textarea__count').attributes('aria-label')).toBe('内容长度已达到上限 5 / 5');
    expect(wrapper.get('.lx-textarea__limit-announcement').text()).toBe('');
    wrapper.unmount();
  });

  it('默认硬截断且校验模式正确关联超限说明', async () => {
    const hardLimit = mount(LxTextarea, {
      props: { maxlength: 5 },
    });
    expect(hardLimit.get('textarea').attributes('maxlength')).toBe('5');
    expect(hardLimit.find('.lx-textarea__overflow-message').exists()).toBe(false);
    hardLimit.unmount();

    const value = '涉密核验'.repeat(51);
    const validation = mount(LxTextarea, {
      props: {
        modelValue: value,
        maxlength: 200,
        maxlengthMode: 'validate',
      },
      attrs: { 'aria-describedby': 'existing-help' },
    });
    const textarea = validation.get('textarea');

    expect(textarea.attributes('maxlength')).toBeUndefined();
    expect(textarea.attributes('aria-invalid')).toBe('true');
    expect(textarea.attributes('aria-describedby')).toContain('existing-help');
    const overflowMessage = validation.get('.lx-textarea__overflow-message');
    const overflowDescriptionId = overflowMessage.attributes('id');
    expect(textarea.attributes('aria-describedby')).toContain(overflowDescriptionId);
    expect(overflowMessage.text()).toBe('内容长度已超过上限，请删减后继续。');
    const announcement = validation.get('[role="alert"]');
    const firstAnnouncement = announcement.text();
    expect(firstAnnouncement).toBe('');
    expect(validation.get('.lx-textarea__validation-count').text()).toBe(`${value.length} / 200`);
    expect(validation.get('.lx-textarea__validation-count').attributes('aria-live')).toBe('off');

    await validation.setProps({ modelValue: `${value}复` });
    expect(announcement.text()).toBe(firstAnnouncement);
    expect(validation.get('.lx-textarea__overflow-message').text()).toBe('内容长度已超过上限，请删减后继续。');

    await validation.setProps({ modelValue: value.slice(0, 200) });
    expect(validation.find('.lx-textarea__overflow-message').exists()).toBe(false);
    expect(announcement.text()).toBe('');
    expect(validation.get('textarea').attributes('aria-invalid')).toBeUndefined();
    expect(validation.get('textarea').attributes('aria-describedby')).toBe('existing-help');

    await validation.setProps({ modelValue: `${value}复核` });
    expect(announcement.text()).toBe('内容长度已超过上限。');
    validation.unmount();
  });

  it('每次渲染读取最新的 id 和 ARIA attrs', async () => {
    let updateAttributes!: (id: string, describedby: string, invalid: string) => void;
    const Host = defineComponent({
      setup() {
        const id = ref('memo-first');
        const describedby = ref('help-first');
        const invalid = ref('spelling');

        updateAttributes = (nextId, nextDescribedby, nextInvalid) => {
          id.value = nextId;
          describedby.value = nextDescribedby;
          invalid.value = nextInvalid;
        };

        return () =>
          h(LxTextarea, {
            id: id.value,
            'aria-describedby': describedby.value,
            'aria-invalid': invalid.value,
          });
      },
    });
    const wrapper = mount(Host);
    await nextTick();

    expect(wrapper.findComponent(LxTextarea).props('id')).toBe('memo-first');
    expect(wrapper.get('textarea').attributes('id')).toBe('memo-first');
    expect(wrapper.get('textarea').attributes('aria-describedby')).toBe('help-first');
    expect(wrapper.get('textarea').attributes('aria-invalid')).toBe('spelling');

    updateAttributes('memo-updated', 'help-updated', 'true');
    await nextTick();

    expect(wrapper.get('textarea').attributes('id')).toBe('memo-updated');
    expect(wrapper.get('textarea').attributes('aria-describedby')).toBe('help-updated');
    expect(wrapper.get('textarea').attributes('aria-invalid')).toBe('true');
    wrapper.unmount();
  });

  it('禁用时保留已配置的计数器节点并标记禁用状态', () => {
    const wrapper = mount(LxTextarea, {
      props: { disabled: true, modelValue: '锁定', maxlength: 12 },
    });

    expect(wrapper.get('textarea').attributes('disabled')).toBeDefined();
    expect(wrapper.get('.lx-textarea__count').text()).toBe('2 / 12');
    expect(wrapper.classes()).toContain('is-disabled');
    wrapper.unmount();
  });

  it('未显式设置 disabled 时继承 ElForm 的禁用状态', () => {
    const wrapper = mount(ElForm, {
      props: { model: {}, disabled: true },
      slots: {
        default: () => h(LxTextarea, { modelValue: '由表单统一禁用' }),
      },
    });

    expect(wrapper.get('textarea').attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('显式设置 disabled=false 时覆盖 ElForm 的禁用状态', () => {
    const wrapper = mount(ElForm, {
      props: { model: {}, disabled: true },
      slots: {
        default: () =>
          h(LxTextarea, {
            modelValue: '由表单禁用但允许此字段编辑',
            disabled: false,
          }),
      },
    });

    expect(wrapper.get('textarea').attributes('disabled')).toBeUndefined();
    wrapper.unmount();
  });

  it('保留只读状态且允许聚焦', () => {
    const wrapper = mount(LxTextarea, {
      attachTo: document.body,
      props: { readonly: true, modelValue: '只读内容' },
    });

    expect(wrapper.get('textarea').attributes('readonly')).toBeDefined();
    expect(wrapper.get('textarea').attributes('disabled')).toBeUndefined();
    wrapper.vm.focus();
    expect(document.activeElement).toBe(wrapper.get('textarea').element);
    wrapper.unmount();
  });

  it('passes the resize contract through to the native textarea', () => {
    const wrapper = mount(LxTextarea, { props: { resize: 'none' } });

    expect(wrapper.get('textarea').element.style.resize).toBe('none');
    wrapper.unmount();
  });

  it('exposes focus and blur methods', () => {
    const wrapper = mount(LxTextarea, { attachTo: document.body });
    const textarea = wrapper.get('textarea').element;

    expect(wrapper.vm.focus).toBeTypeOf('function');
    expect(wrapper.vm.blur).toBeTypeOf('function');
    wrapper.vm.focus();
    expect(document.activeElement).toBe(textarea);
    wrapper.vm.blur();
    expect(document.activeElement).not.toBe(textarea);
    wrapper.unmount();
  });
});
