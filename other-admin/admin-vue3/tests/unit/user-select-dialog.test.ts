import { defineComponent } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserSelectDialog from '@/components/UserSelectDialog/index.vue';
import type { AdminUserItem } from '@/api/authority/adminUser';

const { getAdminUserList } = vi.hoisted(() => ({ getAdminUserList: vi.fn() }));
vi.mock('@/api/authority/adminUser', () => ({
  getAdminUserList: (...args: unknown[]) => getAdminUserList(...args),
}));

const ProTableStub = defineComponent({
  props: ['data'],
  emits: ['response', 'selection-change'],
  setup(_, { expose }) {
    const init = vi.fn();
    const toggleRowSelection = vi.fn();
    const clearSelection = vi.fn();
    expose({ init, toggleRowSelection, clearSelection });
    return {};
  },
  template: '<div />',
});

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(UserSelectDialog, {
    props: { visible: false, roleId: 'r1', roleName: '运维', ...props },
    global: {
      stubs: {
        ElDialog: defineComponent({ template: '<div><slot /><slot name="footer" /></div>' }),
        ElButton: defineComponent({ template: '<button><slot /></button>' }),
        ElTag: true,
        SearchBar: true,
        ProTable: ProTableStub,
      },
    },
  });
}

describe('UserSelectDialog', () => {
  beforeEach(() => getAdminUserList.mockReset());

  it('restores supplied IDs when their rows load and confirms complete selected rows', async () => {
    const users = [
      { id: 'u1', idCard: 'alice', status: 0 },
      { id: 'u2', idCard: 'bob', status: 0 },
    ] satisfies AdminUserItem[];
    const wrapper = mountDialog({ selectedUserIds: ['u1'] });
    await wrapper.setProps({ visible: true });
    await flushPromises();

    const table = wrapper.findComponent(ProTableStub);
    table.vm.$emit('response', { code: 0, data: { records: users, total: 2 } });
    await flushPromises();

    expect(table.vm.$.exposed?.toggleRowSelection).toHaveBeenCalledWith(users[0], true);
    wrapper.findComponent(ProTableStub).vm.$emit('selection-change', [users[0], users[1]]);
    await wrapper.get('.dialog-footer button:last-child').trigger('click');

    expect(wrapper.emitted('confirm')?.[0][0]).toEqual(users);
  });

  it('keeps selections from other pages while deselecting only rows on the current page', async () => {
    const pageOne = [{ id: 'u1', idCard: 'alice', status: 0 }] satisfies AdminUserItem[];
    const pageTwo = [{ id: 'u2', idCard: 'bob', status: 0 }] satisfies AdminUserItem[];
    const wrapper = mountDialog({ selectedUserIds: ['u1'] });
    await wrapper.setProps({ visible: true });
    await flushPromises();

    const table = wrapper.findComponent(ProTableStub);
    table.vm.$emit('response', { code: 0, data: { records: pageOne, total: 2 } });
    await flushPromises();
    table.vm.$emit('response', { code: 0, data: { records: pageTwo, total: 2 } });
    await flushPromises();
    table.vm.$emit('selection-change', [pageTwo[0]]);
    table.vm.$emit('response', { code: 0, data: { records: pageOne, total: 2 } });
    await flushPromises();
    table.vm.$emit('selection-change', []);
    await wrapper.get('.dialog-footer button:last-child').trigger('click');

    expect(wrapper.emitted('confirm')?.[0][0]).toEqual([pageTwo[0]]);
  });
});
