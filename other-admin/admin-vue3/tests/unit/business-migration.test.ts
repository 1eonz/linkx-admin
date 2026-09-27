import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { rejectClient } from '@/api/nodeManage/client';
import {
  assistantAgentList,
  createAssistantAgent,
  createCategory,
  updateAssistantAgent,
} from '@/api/thirdInterface/agentInterface';
import { getCallableAppTaskConfig, setCallableAppTaskConfig } from '@/api/thirdInterface/southInterface';
import {
  getDeviceTypeList,
  updateDeviceType,
  updateDeviceTypeIsShow,
  uploadDeviceTypeIcon,
} from '@/api/thirdInterface/unifiedComm';
import RejectDialog from '@/views/nodeManage/clientManage/components/RejectDialog.vue';
import AgentBindVirtualUser from '@/views/thirdInterface/agentInterface/components/AgentBindVirtualUser.vue';
import { addAgentCategory } from '@/views/thirdInterface/agentInterface/utils/category';
import TaskConfigModal from '@/views/thirdInterface/southInterface/components/TaskConfigModal.vue';

const { httpGet, httpPost, httpPut, messageWarning, messageError, messageSuccess } = vi.hoisted(() => ({
  httpGet: vi.fn(),
  httpPost: vi.fn(),
  httpPut: vi.fn(),
  messageWarning: vi.fn(),
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
}));

vi.mock('@/utils/http', () => ({
  default: { get: httpGet, post: httpPost, put: httpPut },
}));
vi.mock('element-plus', () => ({
  ElMessage: { warning: messageWarning, error: messageError, success: messageSuccess },
}));

describe('business migration contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserves task-config URL and payload contracts', () => {
    httpGet.mockReturnValue(Promise.resolve({ code: 0 }));
    httpPost.mockReturnValue(Promise.resolve({ code: 0 }));
    getCallableAppTaskConfig('callable/1');
    setCallableAppTaskConfig('callable/1', { enableTask: 0, taskAutoFillConfig: '[]' });
    expect(httpGet).toHaveBeenCalledWith('/third/v1/app/callable/callable%2F1/task-config');
    expect(httpPost).toHaveBeenCalledWith('/third/v1/app/callable/callable%2F1/task-config', {
      enableTask: 0,
      taskAutoFillConfig: '[]',
    });
  });

  it('sends client rejection reason as the legacy query parameter', () => {
    httpPut.mockReturnValue(Promise.resolve({ code: 0 }));
    rejectClient('peer/1', 'duplicate');
    expect(httpPut).toHaveBeenCalledWith('/node/v1/p2p/clients/peer%2F1/reject', undefined, {
      params: { desc: 'duplicate' },
    });
  });

  it('preserves device-type list, update, upload and display-state contracts', () => {
    httpGet.mockResolvedValue({ code: 0 });
    httpPost.mockResolvedValue({ code: 0 });
    httpPut.mockResolvedValue({ code: 0 });
    getDeviceTypeList();
    updateDeviceType({ id: 'type/1', icon: 'path', iconUri: 'uri' });
    updateDeviceTypeIsShow('type/1', 1);
    uploadDeviceTypeIcon(new File(['icon'], 'icon.png', { type: 'image/png' }));
    expect(httpGet).toHaveBeenCalledWith('/proxy/icp/v1/isdnType/list');
    expect(httpPut).toHaveBeenCalledWith('/proxy/icp/v1/isdnType/type%2F1', {
      id: 'type/1',
      icon: 'path',
      iconUri: 'uri',
    });
    expect(httpPut).toHaveBeenCalledWith('/proxy/icp/v1/isdnType/type%2F1/isShow', undefined, {
      params: { id: 'type/1', isShow: 1 },
    });
    expect(httpPost).toHaveBeenCalledWith('/proxy/icp/v1/isdnType/uploadIcon', expect.any(FormData));
    expect((httpPost.mock.calls[0][1] as FormData).get('file')).toBeInstanceOf(File);
  });

  it('preserves virtual-user binding and full category batch contracts', () => {
    httpGet.mockResolvedValue({ code: 0 });
    httpPost.mockResolvedValue({ code: 0 });
    httpPut.mockResolvedValue({ code: 0 });
    assistantAgentList({ agentId: 'agent/1' });
    createAssistantAgent({ agentId: 'agent/1', virtualUserId: 'user-1' });
    updateAssistantAgent('binding/1', { agentId: 'agent/1', virtualUserId: 'user-2' });
    createCategory([{ id: 'existing', name: '旧分类' }, { name: '新分类' }]);
    expect(httpGet).toHaveBeenCalledWith('/collaboration/v1/ai/assistant/agent/page', {
      params: { agentId: 'agent/1' },
    });
    expect(httpPost).toHaveBeenCalledWith('/collaboration/v1/ai/assistant/agent', {
      agentId: 'agent/1',
      virtualUserId: 'user-1',
    });
    expect(httpPut).toHaveBeenCalledWith('/collaboration/v1/ai/assistant/agent/binding%2F1', {
      agentId: 'agent/1',
      virtualUserId: 'user-2',
    });
    expect(httpPost).toHaveBeenCalledWith('/XA-ics-agent/proxy/ai/v1/aiagent/management/category/saveOrUpdate/batch', [
      { id: 'existing', name: '旧分类' },
      { name: '新分类' },
    ]);
  });

  it('keeps the complete category set and refuses to write after a failed read', async () => {
    httpGet.mockResolvedValueOnce({ code: 500, msg: '分类读取失败' }).mockResolvedValueOnce({
      code: 0,
      data: [{ id: 'existing', name: '旧分类' }],
    });
    httpPost.mockResolvedValue({ code: 0 });
    expect(await addAgentCategory('新分类')).toEqual({ ok: false, message: '分类读取失败' });
    expect(httpPost).not.toHaveBeenCalled();
    expect(await addAgentCategory(' 新分类 ')).toEqual({ ok: true });
    expect(httpPost).toHaveBeenCalledWith('/XA-ics-agent/proxy/ai/v1/aiagent/management/category/saveOrUpdate/batch', [
      { id: 'existing', name: '旧分类' },
      { name: '新分类' },
    ]);
  });

  it('does not save defaults after task-config load fails and allows retry', async () => {
    httpGet.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({
      code: 0,
      data: { enableTask: 0, taskAutoFillConfig: '[]' },
    });
    const wrapper = mount(TaskConfigModal, {
      global: {
        stubs: {
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElResult: { template: '<div><slot name="extra" /></div>' },
          ElButton: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
          ElSwitch: true,
          ElForm: true,
          ElFormItem: true,
          ElInput: true,
          ElSelect: true,
          ElOption: true,
          ElDivider: true,
        },
        directives: { loading: true },
      },
    });
    const vm = wrapper.vm as unknown as { open: (row: { id: string }) => Promise<void> };
    await vm.open({ id: 'callable-1' });
    await nextTick();
    expect(wrapper.text()).toContain('重试');
    expect(httpPost).not.toHaveBeenCalled();
    expect(messageError).toHaveBeenCalledWith('获取任务标准件配置失败');
    const buttons = wrapper.findAll('button');
    expect((buttons[buttons.length - 1].element as HTMLButtonElement).disabled).toBe(true);
    await buttons[0].trigger('click');
    await nextTick();
    expect(httpGet).toHaveBeenCalledTimes(2);
    expect(httpPost).not.toHaveBeenCalled();
  });

  it('does not overwrite malformed stored task configuration with defaults', async () => {
    httpGet.mockResolvedValue({ code: 0, data: { enableTask: 1, taskAutoFillConfig: '{broken' } });
    const wrapper = mount(TaskConfigModal, {
      global: {
        stubs: {
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElResult: { template: '<div><slot name="extra" /></div>' },
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          ElSwitch: true,
          ElForm: true,
          ElFormItem: true,
          ElInput: true,
          ElSelect: true,
          ElOption: true,
          ElDivider: true,
        },
        directives: { loading: true },
      },
    });
    const vm = wrapper.vm as unknown as { open: (row: { id: string }) => Promise<void> };
    await vm.open({ id: 'callable-1' });
    await nextTick();
    expect(messageError).toHaveBeenCalledWith('任务标准件配置格式无效，请联系管理员处理');
    await wrapper.findAll('button').at(-1)?.trigger('click');
    expect(httpPost).not.toHaveBeenCalled();
  });

  it('does not emit rejection when the dialog is canceled', async () => {
    const wrapper = mount(RejectDialog, {
      props: {
        visible: true,
        clientData: { id: '1', peerId: 'peer-1', ip: '127.0.0.1', port: 1 },
      },
      global: {
        stubs: {
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElForm: true,
          ElFormItem: true,
          ElInput: true,
          ElButton: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
          ElIcon: true,
        },
      },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
  });

  it('blocks virtual-user writes when current binding cannot be read', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    httpGet.mockResolvedValue({ code: 500, msg: '读取失败' });
    const wrapper = mount(AgentBindVirtualUser, {
      props: { visible: false, agentId: 'agent-1' },
      global: {
        stubs: {
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElForm: { template: '<form><slot /></form>' },
          ElFormItem: true,
          ElSelect: true,
          ElOption: true,
          ElAlert: true,
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        },
        directives: { loading: true },
      },
    });
    await wrapper.setProps({ visible: true });
    await vi.waitFor(() => expect(messageError).toHaveBeenCalledWith('读取失败'));
    await wrapper.findAll('button').at(-1)?.trigger('click');
    expect(httpPost).not.toHaveBeenCalled();
    expect(httpPut).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('ignores a late binding response after switching to another agent', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    let resolveFirstRequest: ((value: unknown) => void) | undefined;
    httpGet
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstRequest = resolve;
          }),
      )
      .mockResolvedValueOnce({ code: 0, data: { records: [{ id: 'binding-2', virtualUserId: 'user-2' }] } })
      .mockResolvedValueOnce({ code: 0, data: [{ id: 'user-2', userName: '用户二' }] });
    const wrapper = mount(AgentBindVirtualUser, {
      props: { visible: false, agentId: 'agent-1' },
      global: {
        stubs: {
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElForm: true,
          ElFormItem: true,
          ElSelect: true,
          ElOption: true,
          ElAlert: true,
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        },
        directives: { loading: true },
      },
    });
    await wrapper.setProps({ visible: true });
    await nextTick();
    await wrapper.setProps({ agentId: 'agent-2' });
    await vi.waitFor(() =>
      expect((wrapper.vm as unknown as { form: { virtualUserId: string } }).form.virtualUserId).toBe('user-2'),
    );
    resolveFirstRequest?.({ code: 0, data: { records: [{ id: 'binding-1', virtualUserId: 'user-1' }] } });
    await nextTick();
    expect((wrapper.vm as unknown as { form: { virtualUserId: string } }).form.virtualUserId).toBe('user-2');
    vi.unstubAllGlobals();
  });
});
