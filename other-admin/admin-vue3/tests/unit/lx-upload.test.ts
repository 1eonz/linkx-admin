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
    const progress = wrapper.get('[role="progressbar"]');

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
});
