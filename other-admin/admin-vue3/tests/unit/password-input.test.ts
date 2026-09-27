import { shallowMount } from '@vue/test-utils';
import { LxPasswordInput } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import PasswordInput from '@/components/PasswordInput/index.vue';

const LxPasswordInputStub = defineComponent({
  name: 'LxPasswordInput',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});

describe('PasswordInput', () => {
  it('forwards the controlled value and emits model updates', async () => {
    const wrapper = shallowMount(PasswordInput, {
      props: { modelValue: 'initial' },
      global: { stubs: { LxPasswordInput: LxPasswordInputStub } },
    });
    const input = wrapper.findComponent(LxPasswordInput);

    expect(input.props('modelValue')).toBe('initial');
    input.vm.$emit('update:modelValue', 'updated');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['updated']);

    await wrapper.setProps({ modelValue: 'parent-update' });
    expect(input.props('modelValue')).toBe('parent-update');
  });
});
