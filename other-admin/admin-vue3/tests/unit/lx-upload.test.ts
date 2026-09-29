import { mount } from '@vue/test-utils';
import type {
  UploadFile,
  UploadProgressEvent,
  UploadRequestHandler,
  UploadRequestOptions,
  UploadUserFile,
} from 'element-plus';
import {
  LxUpload,
  type LxUploadFile,
  type LxUploadInstance,
  type LxUploadProps,
  type LxUploadRequestOptions,
} from 'lx-ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, type PropType } from 'vue';

const uploadMethods = {
  abort: vi.fn(),
  clearFiles: vi.fn(),
  handleRemove: vi.fn(),
  handleStart: vi.fn(),
  submit: vi.fn(),
};

const ElUploadStub = defineComponent({
  name: 'ElUpload',
  props: {
    action: { type: String, default: '' },
    autoUpload: { type: Boolean, default: false },
    drag: { type: Boolean, default: false },
    fileList: { type: Array as PropType<UploadUserFile[]>, default: () => [] },
    httpRequest: { type: Function as PropType<UploadRequestHandler>, default: undefined },
    onProgress: {
      type: Function as PropType<(event: UploadProgressEvent, file: UploadFile, files: UploadFile[]) => void>,
      default: undefined,
    },
  },
  emits: ['change', 'error', 'exceed', 'remove', 'success'],
  setup(_, { expose, slots }) {
    expose(uploadMethods);
    return () => h('div', { class: 'el-upload-dragger', tabindex: 0 }, slots.default?.());
  },
});

function mountUpload(props: LxUploadProps = {}) {
  return mount(LxUpload, {
    props,
    global: { stubs: { ElUpload: ElUploadStub, LxIcon: true } },
  });
}

describe('LxUpload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('defaults to a manual queue and forwards the chunk hint to the host adapter', () => {
    const request = vi.fn((_options: LxUploadRequestOptions) => new XMLHttpRequest());
    const wrapper = mountUpload({ httpRequest: request });
    const upload = wrapper.findComponent(ElUploadStub);
    const requestHandler = upload.props('httpRequest') as UploadRequestHandler;
    const rawFile = Object.assign(new File(['data'], 'table.csv'), { uid: 8 });
    const options = {
      action: 'mock://upload',
      method: 'post',
      data: {},
      filename: 'file',
      file: rawFile,
      headers: {},
      onError: vi.fn(),
      onProgress: vi.fn(),
      onSuccess: vi.fn(),
      withCredentials: false,
    } satisfies UploadRequestOptions;

    expect(upload.props('action')).toBe('');
    expect(upload.props('autoUpload')).toBe(false);
    expect(upload.props('drag')).toBe(true);
    requestHandler(options);
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ chunkSize: 1024 }));
    wrapper.unmount();
  });

  it('maps failed files to Element Plus status and retries through the instance contract', async () => {
    const raw = Object.assign(new File(['data'], 'failed.csv', { type: 'text/csv' }), { uid: 41 });
    const file: LxUploadFile = {
      uid: 41,
      name: 'failed.csv',
      size: raw.size,
      status: 'error',
      raw,
    };
    const wrapper = mountUpload({ modelValue: [file], action: 'mock://upload' });
    const upload = wrapper.findComponent(ElUploadStub);
    const fileList = upload.props('fileList') as UploadUserFile[];

    expect(fileList[0].status).toBe('fail');
    expect(wrapper.get('.lx-upload__file-status').text()).toBe('上传失败');
    await wrapper.get('.lx-upload__retry').trigger('click');
    expect(uploadMethods.handleRemove).toHaveBeenCalledWith(expect.objectContaining({ uid: 41, status: 'fail' }));
    expect(uploadMethods.handleStart).toHaveBeenCalledWith(raw);
    expect(uploadMethods.submit).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('renders accessible progress state and blocks exposed submission while disabled', () => {
    const file: LxUploadFile = {
      uid: 7,
      name: 'large.csv',
      size: 1024 * 1024,
      status: 'uploading',
      percentage: 68,
    };
    const wrapper = mountUpload({ modelValue: [file], disabled: true });
    const instance = wrapper.vm as unknown as LxUploadInstance;
    const progress = wrapper.get('.lx-upload__progress-track');

    expect(progress.attributes('aria-label')).toBe('large.csv 上传进度');
    expect(progress.attributes('aria-valuenow')).toBe('68');
    expect(wrapper.text()).toContain('上传中');
    instance.submit();
    expect(uploadMethods.submit).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('updates the controlled file model when Element Plus reports progress', () => {
    const raw = Object.assign(new File(['data'], 'large.csv'), { uid: 17 });
    const file: UploadFile = { uid: 17, name: raw.name, raw, status: 'ready' };
    const wrapper = mountUpload();
    const handler = wrapper.findComponent(ElUploadStub).props('onProgress') as (
      event: UploadProgressEvent,
      currentFile: UploadFile,
      files: UploadFile[],
    ) => void;
    const event = Object.assign(new ProgressEvent('progress'), { percent: 68 });

    handler(event, file, [file]);
    const updates = wrapper.emitted('update:modelValue');
    const latest = updates?.at(-1)?.[0] as LxUploadFile[];
    expect(latest[0]).toMatchObject({ uid: 17, status: 'uploading', percentage: 68 });
    expect(wrapper.emitted('progress')).toHaveLength(1);
    wrapper.unmount();
  });

  it('swaps the dropzone for the aggregate progress panel while uploading', () => {
    const files: LxUploadFile[] = [
      { uid: 1, name: 'a.csv', status: 'uploading', percentage: 60 },
      { uid: 2, name: 'b.csv', status: 'uploading', percentage: 20 },
    ];
    const wrapper = mountUpload({ modelValue: files, action: 'mock://upload' });
    const panel = wrapper.get('.lx-upload__panel');
    const track = panel.get('[role="progressbar"]');

    expect(wrapper.classes()).toContain('is-uploading');
    expect(wrapper.find('.lx-upload__dropzone').exists()).toBe(false);
    expect(panel.text()).toContain('正在上传 2 个文件');
    expect(track.attributes('aria-label')).toBe('批量上传总进度');
    expect(track.attributes('aria-valuenow')).toBe('40');
    expect(panel.get('.lx-upload__cancel').attributes('disabled')).toBeUndefined();
    wrapper.unmount();
  });

  it('aborts all requests and restores the queue when cancelling the batch upload', async () => {
    const file: LxUploadFile = {
      uid: 9,
      name: 'mid.csv',
      status: 'uploading',
      percentage: 45,
    };
    const wrapper = mountUpload({ modelValue: [file], action: 'mock://upload' });

    await wrapper.get('.lx-upload__cancel').trigger('click');
    expect(uploadMethods.abort).toHaveBeenCalledTimes(1);
    const latest = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(latest[0]).toMatchObject({ uid: 9, status: 'ready', percentage: 0 });
    expect(wrapper.get('.lx-upload__announcement').text()).toContain('已取消上传');
    wrapper.unmount();
  });

  it('restores the dropzone once no file is uploading', async () => {
    const file: LxUploadFile = {
      uid: 12,
      name: 'done.csv',
      status: 'uploading',
      percentage: 80,
    };
    const wrapper = mountUpload({ modelValue: [file], action: 'mock://upload' });

    expect(wrapper.find('.lx-upload__panel').exists()).toBe(true);
    await wrapper.setProps({
      modelValue: [{ ...file, status: 'success', percentage: 100 }],
    });
    expect(wrapper.find('.lx-upload__panel').exists()).toBe(false);
    expect(wrapper.find('.lx-upload__dropzone-idle').exists()).toBe(true);
    expect(wrapper.find('.lx-upload__dropzone-over').exists()).toBe(true);
    expect(wrapper.find('.lx-upload__browse').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders status badges with localized queue wording and a clear-all header', async () => {
    const files: LxUploadFile[] = [
      { uid: 1, name: 'queued.csv', status: 'ready' },
      { uid: 2, name: 'done.csv', status: 'success' },
      { uid: 3, name: 'bad.csv', status: 'error' },
    ];
    const wrapper = mountUpload({ modelValue: files, action: 'mock://upload' });
    const badges = wrapper.findAll('.lx-upload__file-status');

    expect(badges.map((badge) => badge.text())).toEqual(['排队中', '上传成功', '上传失败']);
    expect(wrapper.get('.lx-upload__list-header').text()).toContain('已选 3 个文件');
    expect(wrapper.find('.lx-upload__file.is-fail .lx-upload__file-name').exists()).toBe(true);
    expect(wrapper.get('.lx-upload__clear').attributes('disabled')).toBeUndefined();

    await wrapper.get('.lx-upload__clear').trigger('click');
    expect(uploadMethods.clearFiles).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([]);
    wrapper.unmount();
  });
});
