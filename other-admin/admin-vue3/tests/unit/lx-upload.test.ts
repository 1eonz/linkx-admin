import { flushPromises, mount } from '@vue/test-utils';
import type {
  UploadFile,
  UploadProgressEvent,
  UploadRequestHandler,
  UploadRequestOptions,
  UploadRawFile,
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
import { defineComponent, h, nextTick, ref, type PropType, watch } from 'vue';

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
    disabled: { type: Boolean, default: false },
    drag: { type: Boolean, default: false },
    fileList: { type: Array as PropType<UploadUserFile[]>, default: () => [] },
    httpRequest: { type: Function as PropType<UploadRequestHandler>, default: undefined },
    onChange: {
      type: Function as PropType<(file: UploadFile, files: UploadFile[]) => void>,
      default: undefined,
    },
    onProgress: {
      type: Function as PropType<(event: UploadProgressEvent, file: UploadFile, files: UploadFile[]) => void>,
      default: undefined,
    },
    onSuccess: {
      type: Function as PropType<(response: unknown, file: UploadFile, files: UploadFile[]) => void>,
      default: undefined,
    },
    onError: {
      type: Function as PropType<(error: Error, file: UploadFile, files: UploadFile[]) => void>,
      default: undefined,
    },
  },
  emits: ['error', 'exceed', 'remove'],
  setup(props, { attrs, expose, slots }) {
    expose(uploadMethods);
    return () =>
      h(
        'div',
        {
          ...attrs,
          class: 'el-upload',
          role: 'button',
          tabindex: props.disabled ? undefined : 0,
          'aria-disabled': String(props.disabled),
        },
        [h('div', { class: 'el-upload-dragger' }, slots.default?.())],
      );
  },
});

const ControlledElUploadStub = defineComponent({
  name: 'ControlledElUpload',
  props: {
    fileList: { type: Array as PropType<UploadUserFile[]>, default: () => [] },
    onChange: {
      type: Function as PropType<(file: UploadFile, files: UploadFile[]) => void>,
      default: undefined,
    },
    onRemove: {
      type: Function as PropType<(file: UploadFile, files: UploadFile[]) => void>,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    const uploadFiles = ref<UploadUserFile[]>([...props.fileList]);
    watch(
      () => props.fileList,
      (fileList) => {
        uploadFiles.value = [...fileList];
      },
    );

    const handleRemove = vi.fn(async (file: UploadFile) => {
      uploadFiles.value = uploadFiles.value.filter((item) => item.uid !== file.uid);
      props.onRemove?.(file, uploadFiles.value as UploadFile[]);
      await nextTick();
    });
    const handleStart = vi.fn((rawFile: UploadRawFile) => {
      const file: UploadUserFile = {
        uid: rawFile.uid,
        name: rawFile.name,
        raw: rawFile,
        status: 'ready',
      };
      uploadFiles.value = [...uploadFiles.value, file];
      nextTick(() => props.onChange?.(file as UploadFile, uploadFiles.value as UploadFile[]));
    });

    expose({
      abort: vi.fn(),
      clearFiles: vi.fn(),
      handleRemove,
      handleStart,
      submit: vi.fn(),
    });
    return () => h('div', { class: 'el-upload-dragger', tabindex: 0 });
  },
});

function mountUpload(props: LxUploadProps = {}) {
  return mount(LxUpload, {
    props,
    global: { stubs: { ElUpload: ElUploadStub, LxIcon: true } },
  });
}

function createRequestOptions(file: UploadRawFile): UploadRequestOptions {
  return {
    action: 'mock://upload',
    method: 'post',
    data: {},
    filename: 'file',
    file,
    headers: {},
    onError: vi.fn(),
    onProgress: vi.fn(),
    onSuccess: vi.fn(),
    withCredentials: false,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
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

  it('submits a controlled string-uid file with the raw uid Element Plus indexes by', () => {
    const raw = Object.assign(new File(['data'], 'remote.csv'), { uid: 73 }) as UploadRawFile;
    const wrapper = mountUpload({
      modelValue: [{ uid: 'remote-73', name: raw.name, size: raw.size, status: 'ready', raw }],
      action: 'mock://upload',
    });
    const upload = wrapper.findComponent(ElUploadStub);
    const file = (upload.props('fileList') as UploadUserFile[])[0];
    const instance = wrapper.vm as unknown as LxUploadInstance;

    instance.submit();

    expect(uploadMethods.submit).toHaveBeenCalledOnce();
    expect(file.uid).toBe(raw.uid);
    expect(raw.uid).toBe(file.uid);
    wrapper.unmount();
  });

  it('keeps a bare controlled File uploadable and emits the original File', () => {
    const raw = new File(['data'], 'bare.csv', { type: 'text/csv' });
    const wrapper = mountUpload({ modelValue: [raw], action: 'mock://upload' });
    const upload = wrapper.findComponent(ElUploadStub);
    const file = (upload.props('fileList') as UploadUserFile[])[0] as UploadFile;
    const onChange = upload.props('onChange') as (currentFile: UploadFile, files: UploadFile[]) => void;
    const instance = wrapper.vm as unknown as LxUploadInstance;

    expect(file.raw).toBeInstanceOf(File);
    expect(file.raw).not.toBe(raw);
    expect(file.raw?.uid).toBe(file.uid);
    instance.submit();
    onChange(file, [file]);

    expect(uploadMethods.submit).toHaveBeenCalledOnce();
    const latest = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(latest[0]?.raw).toBe(raw);
    expect((raw as File & { uid?: number }).uid).toBeUndefined();
    wrapper.unmount();
  });

  it('isolates Element Plus raw files when controlled rows share one source File', () => {
    const raw = Object.assign(new File(['data'], 'shared.csv'), {
      uid: 73,
    }) as UploadRawFile;
    const wrapper = mountUpload({
      modelValue: [
        { uid: 73, name: raw.name, size: raw.size, status: 'ready', raw },
        {
          uid: 'remote-73',
          name: raw.name,
          size: raw.size,
          status: 'ready',
          raw,
        },
      ],
      action: 'mock://upload',
    });
    const upload = wrapper.findComponent(ElUploadStub);
    const fileList = upload.props('fileList') as UploadUserFile[];
    const onSuccess = upload.props('onSuccess') as (
      response: unknown,
      currentFile: UploadFile,
      files: UploadFile[],
    ) => void;
    const succeededFiles = fileList.map((file) => ({ ...file, status: 'success' }) as UploadFile);

    expect(fileList.map((file) => file.uid)).toEqual([73, 74]);
    expect(fileList.map((file) => file.raw?.uid)).toEqual([73, 74]);
    expect(fileList[0]?.raw).toBe(raw);
    expect(fileList[1]?.raw).not.toBe(raw);
    expect(raw.uid).toBe(73);

    for (const file of succeededFiles) {
      onSuccess({ savedUid: file.uid }, file, succeededFiles);
    }

    const latest = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(latest.map((file) => file.uid)).toEqual([73, 'remote-73']);
    expect(latest.map((file) => file.status)).toEqual(['success', 'success']);
    expect(latest.every((file) => file.raw === raw)).toBe(true);
    expect(raw.uid).toBe(73);
    wrapper.unmount();
  });

  it('keeps public uid zero while assigning a nonzero Element Plus uid', () => {
    const raw = Object.assign(new File(['data'], 'zero.csv'), { uid: 0 }) as UploadRawFile;
    const wrapper = mountUpload({
      modelValue: [{ uid: 0, name: raw.name, size: raw.size, status: 'ready', raw }],
      action: 'mock://upload',
    });
    const upload = wrapper.findComponent(ElUploadStub);
    const file = (upload.props('fileList') as UploadUserFile[])[0] as UploadFile;
    const onSuccess = upload.props('onSuccess') as (
      response: unknown,
      currentFile: UploadFile,
      files: UploadFile[],
    ) => void;

    expect(file.uid).not.toBe(0);
    expect(file.raw?.uid).toBe(file.uid);
    expect(raw.uid).toBe(0);
    onSuccess({ saved: true }, { ...file, status: 'success' }, [{ ...file, status: 'success' } as UploadFile]);

    const latest = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(latest[0]).toMatchObject({ uid: 0, status: 'success' });
    expect(latest[0]?.raw).toBe(raw);
    wrapper.unmount();
  });

  it('skips zero when a colliding negative source uid increments', () => {
    const raw = Object.assign(new File(['data'], 'negative.csv'), { uid: -1 }) as UploadRawFile;
    const wrapper = mountUpload({
      modelValue: [
        { uid: -1, name: raw.name, size: raw.size, status: 'ready', raw },
        {
          uid: 'remote-negative',
          name: raw.name,
          size: raw.size,
          status: 'ready',
          raw,
        },
      ],
      action: 'mock://upload',
    });
    const fileList = wrapper.findComponent(ElUploadStub).props('fileList') as UploadUserFile[];

    expect(fileList.map((file) => file.uid)).toEqual([-1, 1]);
    expect(fileList.map((file) => file.raw?.uid)).toEqual([-1, 1]);
    expect(fileList.every((file) => file.uid !== 0)).toBe(true);
    expect(raw.uid).toBe(-1);
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

  it('keeps a retried file when the external model applies the remove update before start change', async () => {
    const raw = Object.assign(new File(['data'], 'failed.csv'), { uid: 43 }) as UploadRawFile;
    const failedFile: LxUploadFile = {
      uid: 43,
      name: raw.name,
      size: raw.size,
      status: 'error',
      raw,
    };
    const Parent = defineComponent({
      setup() {
        const modelValue = ref<LxUploadFile[]>([failedFile]);
        return () =>
          h(LxUpload, {
            modelValue: modelValue.value,
            action: 'mock://upload',
            'onUpdate:modelValue': (files: LxUploadFile[]) => {
              modelValue.value = files;
            },
          });
      },
    });
    const wrapper = mount(Parent, {
      global: { stubs: { ElUpload: ControlledElUploadStub, LxIcon: true } },
    });

    await wrapper.get('.lx-upload__retry').trigger('click');
    await flushPromises();

    expect(wrapper.get('.lx-upload__file-name').text()).toBe('failed.csv');
    expect(wrapper.get('.lx-upload__file-status').text()).toBe('排队中');
    wrapper.unmount();
  });

  it('preserves a controlled string uid when retrying a file with a numeric raw uid', async () => {
    const raw = Object.assign(new File(['data'], 'remote.csv'), { uid: 73 }) as UploadRawFile;
    const failedFile: LxUploadFile = {
      uid: 'remote-73',
      name: raw.name,
      size: raw.size,
      status: 'error',
      raw,
    };
    const updates: LxUploadFile[][] = [];
    const Parent = defineComponent({
      setup() {
        const modelValue = ref<LxUploadFile[]>([failedFile]);
        return () =>
          h(LxUpload, {
            modelValue: modelValue.value,
            action: 'mock://upload',
            'onUpdate:modelValue': (files: LxUploadFile[]) => {
              updates.push(files);
              modelValue.value = files;
            },
          });
      },
    });
    const wrapper = mount(Parent, {
      global: { stubs: { ElUpload: ControlledElUploadStub, LxIcon: true } },
    });

    await wrapper.get('.lx-upload__retry').trigger('click');
    await flushPromises();

    const latest = updates.at(-1);
    expect(latest).toMatchObject([{ uid: 'remote-73', name: 'remote.csv', status: 'ready' }]);
    expect(wrapper.get('.lx-upload__file-name').text()).toBe('remote.csv');
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

  it('uses the Element Plus trigger as the only upload button', async () => {
    const wrapper = mountUpload({ disabled: true });
    const trigger = wrapper.get('.el-upload[role="button"]');
    const browseLabel = wrapper.get('.lx-upload__browse');

    expect(trigger.attributes('aria-disabled')).toBe('true');
    expect(trigger.attributes('tabindex')).toBeUndefined();
    expect(browseLabel.element.tagName).toBe('SPAN');
    expect(browseLabel.attributes('disabled')).toBeUndefined();
    await wrapper.setProps({ disabled: false });
    expect(wrapper.get('.el-upload[role="button"]').attributes('aria-disabled')).toBe('false');
    expect(wrapper.get('.el-upload[role="button"]').attributes('tabindex')).toBe('0');
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

  it.each(['success', 'failure'] as const)('keeps the host string uid through progress and %s callbacks', (outcome) => {
    const raw = Object.assign(new File(['data'], 'remote.csv'), { uid: 73 }) as UploadRawFile;
    const wrapper = mountUpload({
      modelValue: [{ uid: 'remote-73', name: raw.name, size: raw.size, status: 'ready', raw }],
    });
    const upload = wrapper.findComponent(ElUploadStub);
    const file = (upload.props('fileList') as UploadUserFile[])[0] as UploadFile;
    const onProgress = upload.props('onProgress') as (
      event: UploadProgressEvent,
      currentFile: UploadFile,
      files: UploadFile[],
    ) => void;

    onProgress(Object.assign(new ProgressEvent('progress'), { percent: 61 }), file, [file]);

    const progressUpdate = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(progressUpdate[0]).toMatchObject({
      uid: 'remote-73',
      status: 'uploading',
      percentage: 61,
    });

    if (outcome === 'success') {
      const response = { storageKey: 'remote-73' };
      const onSuccess = upload.props('onSuccess') as (
        response: unknown,
        currentFile: UploadFile,
        files: UploadFile[],
      ) => void;
      const succeeded = { ...file, status: 'success' } as UploadFile;

      onSuccess(response, succeeded, [succeeded]);

      const successUpdate = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
      expect(successUpdate[0]).toMatchObject({
        uid: 'remote-73',
        status: 'success',
        response,
      });
    } else {
      const error = new Error('上传失败');
      const onError = upload.props('onError') as (error: Error, currentFile: UploadFile, files: UploadFile[]) => void;
      const failed = { ...file, status: 'fail' } as UploadFile;

      onError(error, failed, [failed]);

      const errorUpdate = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
      expect(errorUpdate[0]).toMatchObject({
        uid: 'remote-73',
        status: 'error',
        error,
      });
    }
    wrapper.unmount();
  });

  it('preserves uploaded URL and response metadata after controlled rehydration', async () => {
    const file: UploadFile = {
      uid: 21,
      name: 'uploaded.png',
      status: 'success',
      url: '/files/uploaded.png',
    };
    const response = { fileUrl: '/files/uploaded.png' };
    const wrapper = mountUpload();
    const upload = wrapper.findComponent(ElUploadStub);

    const onSuccess = upload.props('onSuccess') as (
      response: unknown,
      currentFile: UploadFile,
      files: UploadFile[],
    ) => void;
    onSuccess(response, file, [file]);

    const latest = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(latest[0]).toMatchObject({
      uid: 21,
      url: '/files/uploaded.png',
      response: { fileUrl: '/files/uploaded.png' },
      status: 'success',
    });

    await wrapper.setProps({ modelValue: latest });
    const rehydrated = upload.props('fileList') as UploadUserFile[];
    expect(rehydrated[0]).toMatchObject({
      url: '/files/uploaded.png',
      response: { fileUrl: '/files/uploaded.png' },
    });

    const restoredFile = {
      ...file,
      ...rehydrated[0],
    } as UploadFile;
    const onChange = upload.props('onChange') as (currentFile: UploadFile, files: UploadFile[]) => void;
    onChange(restoredFile, [restoredFile]);
    const updatedAfterChange = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(updatedAfterChange[0]).toMatchObject({
      url: '/files/uploaded.png',
      response: { fileUrl: '/files/uploaded.png' },
    });
    wrapper.unmount();
  });

  it('restores failure details from a controlled file value', async () => {
    const error = new Error('存储服务拒绝上传');
    const failedFile: LxUploadFile = {
      uid: 22,
      name: 'failed.png',
      status: 'error',
      error,
    };
    const wrapper = mountUpload({ modelValue: [failedFile] });
    const upload = wrapper.findComponent(ElUploadStub);
    const fileList = upload.props('fileList') as (UploadUserFile & { error?: Error })[];

    expect(fileList[0].error).toBe(error);
    expect(wrapper.get('.lx-upload__file-error').text()).toBe(error.message);

    const restoredFile = {
      ...fileList[0],
      status: 'fail',
    } as UploadFile & { error?: Error };
    const onChange = upload.props('onChange') as (currentFile: UploadFile, files: UploadFile[]) => void;
    onChange(restoredFile, [restoredFile]);

    const latest = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(latest[0].error).toBe(error);
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

  it('aborts a controlled file with a string uid and restores its queue status', () => {
    const file: LxUploadFile = {
      uid: 'remote-1',
      name: 'remote.csv',
      status: 'uploading',
      percentage: 55,
    };
    const wrapper = mountUpload({ modelValue: [file], action: 'mock://upload' });
    const instance = wrapper.vm as unknown as LxUploadInstance;

    instance.abort(file);

    expect(uploadMethods.abort).toHaveBeenCalledTimes(1);
    expect(uploadMethods.abort).toHaveBeenCalledWith(expect.objectContaining({ status: 'uploading' }));
    const latest = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(latest).toHaveLength(1);
    expect(latest[0]).toMatchObject({ status: 'ready', percentage: 0 });
    wrapper.unmount();
  });

  it('允许父级同步回传生成 UID 后立即取消无 UID 文件', async () => {
    const pending = deferred<unknown>();
    const adapter = vi.fn((_options: LxUploadRequestOptions) => pending.promise);
    const rawFile = new File(['data'], 'generated.csv');
    const updates: LxUploadFile[][] = [];
    const instance = ref<LxUploadInstance>();
    let abortImmediately = true;
    const wrapper = mount(LxUpload, {
      props: {
        modelValue: [
          {
            name: rawFile.name,
            size: rawFile.size,
            raw: rawFile,
            status: 'uploading',
            percentage: 35,
          },
        ],
        httpRequest: adapter,
        'onUpdate:modelValue': (files: LxUploadFile[]) => {
          updates.push(files);
          if (!abortImmediately) return;
          abortImmediately = false;
          instance.value?.abort(files[0]!);
        },
      },
      global: { stubs: { ElUpload: ElUploadStub, LxIcon: true } },
    });
    instance.value = wrapper.vm as unknown as LxUploadInstance;
    const upload = wrapper.findComponent(ElUploadStub);
    const file = (upload.props('fileList') as UploadUserFile[])[0] as UploadFile;
    const requestOptions = createRequestOptions(file.raw as UploadRawFile);
    const onSuccess = requestOptions.onSuccess;
    const requestHandler = upload.props('httpRequest') as UploadRequestHandler;
    const request = requestHandler(requestOptions);

    expect(request).toBe(pending.promise);
    const onProgress = upload.props('onProgress') as (
      event: UploadProgressEvent,
      currentFile: UploadFile,
      files: UploadFile[],
    ) => void;
    onProgress(Object.assign(new ProgressEvent('progress'), { percent: 50 }), file, [file]);

    expect(updates[0]?.[0]).toMatchObject({ status: 'uploading', percentage: 50 });
    expect(updates[0]?.[0]?.uid).toEqual(expect.stringMatching(/^__lx_upload_\d+_/));
    expect(updates.at(-1)?.[0]).toMatchObject({ status: 'ready', percentage: 0 });
    expect(updates.at(-1)?.[0]?.uid).toBe(updates[0]?.[0]?.uid);
    expect(adapter.mock.calls[0]?.[0].signal.aborted).toBe(true);
    expect(uploadMethods.abort).toHaveBeenCalledWith(expect.objectContaining({ uid: file.uid }));

    pending.resolve({ fileUrl: '/files/generated.csv' });
    await request;
    requestOptions.onSuccess({ fileUrl: '/files/generated.csv' }, file.raw as UploadRawFile);
    await flushPromises();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(updates).toHaveLength(2);
    wrapper.unmount();
  });

  it.each(['abort', 'remove'] as const)(
    'uses the raw request uid for %s when a string model uid wraps a numbered raw file',
    async (action) => {
      const rawFile = Object.assign(new File(['data'], 'remote.csv'), {
        uid: 73,
      }) as UploadRawFile;
      const file: LxUploadFile = {
        uid: 'remote-73',
        name: 'remote.csv',
        raw: rawFile,
        status: 'uploading',
        percentage: 35,
      };
      const wrapper = mountUpload({ modelValue: [file], action: 'mock://upload' });

      if (action === 'abort') {
        const instance = wrapper.vm as unknown as LxUploadInstance;
        instance.abort(file);
      } else {
        await wrapper.get('.lx-upload__remove').trigger('click');
      }

      expect(uploadMethods.abort).toHaveBeenCalledWith(expect.objectContaining({ uid: 73 }));
      wrapper.unmount();
    },
  );

  it('prefers normalized string identity when numeric and string uids share a value', () => {
    const numericFile: LxUploadFile = {
      uid: 42,
      name: 'numeric.csv',
      status: 'uploading',
      percentage: 20,
    };
    const stringFile: LxUploadFile = {
      uid: '42',
      name: 'string.csv',
      status: 'uploading',
      percentage: 70,
    };
    const wrapper = mountUpload({
      modelValue: [numericFile, stringFile],
      action: 'mock://upload',
    });
    const upload = wrapper.findComponent(ElUploadStub);
    const normalizedStringFile = (upload.props('fileList') as UploadUserFile[])[1];
    const instance = wrapper.vm as unknown as LxUploadInstance;

    instance.abort(stringFile);

    expect(uploadMethods.abort).toHaveBeenCalledWith(expect.objectContaining({ uid: normalizedStringFile.uid }));
    const latest = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(latest[0]).toMatchObject({ uid: 42, status: 'uploading', percentage: 20 });
    expect(latest[1]).toMatchObject({ status: 'ready', percentage: 0 });
    wrapper.unmount();
  });

  it('disambiguates colliding string hashes and numeric uids before aborting', () => {
    const collisionUid = 0x5e4daa9d;
    const files: LxUploadFile[] = [
      { uid: collisionUid, name: 'numeric.csv', status: 'uploading', percentage: 10 },
      { uid: 'liquid', name: 'liquid.csv', status: 'uploading', percentage: 40 },
      { uid: 'costarring', name: 'costarring.csv', status: 'uploading', percentage: 80 },
    ];
    const wrapper = mountUpload({ modelValue: files, action: 'mock://upload' });
    const upload = wrapper.findComponent(ElUploadStub);
    const normalizedFiles = upload.props('fileList') as UploadUserFile[];
    const instance = wrapper.vm as unknown as LxUploadInstance;

    expect(new Set(normalizedFiles.map((file) => file.uid)).size).toBe(3);
    instance.abort(files[1]);

    expect(uploadMethods.abort).toHaveBeenCalledWith(expect.objectContaining({ uid: normalizedFiles[1].uid }));
    const latest = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(latest[0]).toMatchObject({ uid: collisionUid, status: 'uploading' });
    expect(latest[1]).toMatchObject({ status: 'ready', percentage: 0 });
    expect(latest[2]).toMatchObject({ status: 'uploading', percentage: 80 });
    wrapper.unmount();
  });

  it('does not abort a numeric file when an unmatched string uid hashes to its uid', () => {
    const file: LxUploadFile = {
      uid: 0x5e4daa9d,
      name: 'numeric.csv',
      status: 'uploading',
      percentage: 25,
    };
    const wrapper = mountUpload({ modelValue: [file], action: 'mock://upload' });
    const instance = wrapper.vm as unknown as LxUploadInstance;

    instance.abort({ uid: 'liquid', name: 'missing.csv', status: 'uploading' });

    expect(uploadMethods.abort).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('does not treat a numeric uid and its string form as the same file when aborting', () => {
    const file: LxUploadFile = {
      uid: 42,
      name: 'numeric.csv',
      status: 'uploading',
      percentage: 25,
    };
    const wrapper = mountUpload({ modelValue: [file], action: 'mock://upload' });
    const instance = wrapper.vm as unknown as LxUploadInstance;

    instance.abort({ uid: '42', name: 'string.csv', status: 'uploading' });

    expect(uploadMethods.abort).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  it('keeps generated fallback uids distinct from later numeric source uids', async () => {
    const wrapper = mountUpload({
      modelValue: [{ name: 'fallback.png', size: 4, status: 'ready' }],
    });
    const upload = wrapper.findComponent(ElUploadStub);
    const firstFile = (upload.props('fileList') as UploadUserFile[])[0];
    const onChange = upload.props('onChange') as (currentFile: UploadFile, files: UploadFile[]) => void;

    onChange(firstFile as UploadFile, [firstFile as UploadFile]);
    const generated = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    const fallbackUid = generated[0]?.uid;

    expect(fallbackUid).toMatch(/^__lx_upload_\d+_/);

    await wrapper.setProps({
      modelValue: [...generated, { uid: firstFile.uid, name: 'numeric.png', status: 'ready' }],
    });

    const normalized = upload.props('fileList') as UploadUserFile[];
    expect(new Set(normalized.map((file) => file.uid)).size).toBe(2);
    expect(normalized[0]?.uid).toBe(firstFile.uid);
    expect(normalized[1]?.uid).not.toBe(firstFile.uid);
    wrapper.unmount();
  });

  it('generates distinct fallback uids for matching files in separate upload instances', () => {
    const emittedModels: unknown[][] = [];
    const fallbackFiles = [{ name: 'same.png', size: 4, status: 'ready' }];
    const Parent = defineComponent({
      setup() {
        return () =>
          h('div', [
            h(LxUpload, {
              modelValue: fallbackFiles,
              'onUpdate:modelValue': (files: unknown[]) => {
                emittedModels[0] = files;
              },
            }),
            h(LxUpload, {
              modelValue: fallbackFiles,
              'onUpdate:modelValue': (files: unknown[]) => {
                emittedModels[1] = files;
              },
            }),
          ]);
      },
    });
    const wrapper = mount(Parent, {
      global: { stubs: { ElUpload: ElUploadStub, LxIcon: true } },
    });
    const uploadStubs = wrapper.findAllComponents(ElUploadStub);

    uploadStubs.forEach((upload) => {
      const file = (upload.props('fileList') as UploadUserFile[])[0];
      const onChange = upload.props('onChange') as (currentFile: UploadFile, files: UploadFile[]) => void;

      onChange(file as UploadFile, [file as UploadFile]);
    });

    const readUid = (model: unknown[] | undefined) => {
      const file = model?.[0];
      if (typeof file !== 'object' || file === null || !('uid' in file)) return undefined;
      const { uid } = file;
      return typeof uid === 'string' || typeof uid === 'number' ? uid : undefined;
    };
    const firstUid = readUid(emittedModels[0]);
    const secondUid = readUid(emittedModels[1]);

    expect(firstUid).toEqual(expect.stringMatching(/^__lx_upload_\d+_/));
    expect(secondUid).toEqual(expect.stringMatching(/^__lx_upload_\d+_/));
    expect(firstUid).not.toBe(secondUid);
    wrapper.unmount();
  });

  it.each(['success', 'failure'] as const)(
    'ignores a late Promise %s callback after cancelling the upload',
    async (outcome) => {
      const pending = deferred<unknown>();
      const adapter = vi.fn((_options: LxUploadRequestOptions) => pending.promise);
      const rawFile = Object.assign(new File(['data'], 'pending.csv'), { uid: 14 }) as UploadRawFile;
      const wrapper = mountUpload({
        modelValue: [{ uid: 14, name: 'pending.csv', raw: rawFile, status: 'uploading', percentage: 45 }],
        httpRequest: adapter,
      });
      const upload = wrapper.findComponent(ElUploadStub);
      const requestOptions = createRequestOptions(rawFile);
      const onSuccess = requestOptions.onSuccess;
      const onError = requestOptions.onError;
      const requestHandler = upload.props('httpRequest') as UploadRequestHandler;
      const request = requestHandler(requestOptions);

      expect(request).toBe(pending.promise);
      expect(adapter.mock.calls[0]?.[0].signal).toBeInstanceOf(AbortSignal);
      const completion = pending.promise.then(
        (response) => requestOptions.onSuccess(response, rawFile),
        () => requestOptions.onError(new Error('迟到的上传失败')),
      );

      await wrapper.get('.lx-upload__cancel').trigger('click');
      const cancelled = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
      await wrapper.setProps({ modelValue: cancelled });

      expect(adapter.mock.calls[0]?.[0].signal.aborted).toBe(true);
      expect(cancelled[0]).toMatchObject({ uid: 14, status: 'ready', percentage: 0 });

      if (outcome === 'success') pending.resolve({ fileUrl: '/files/pending.csv' });
      else pending.reject(new Error('迟到的上传失败'));
      await completion;
      await flushPromises();

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(wrapper.emitted('success')).toBeUndefined();
      expect(wrapper.emitted('error')).toBeUndefined();
      expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
      wrapper.unmount();
    },
  );

  it.each(['success', 'failure'] as const)(
    'cancels a controlled file request and ignores its late %s callback',
    async (outcome) => {
      const pending = deferred<unknown>();
      const adapter = vi.fn((_options: LxUploadRequestOptions) => pending.promise);
      const rawFile = Object.assign(new File(['data'], 'removed.csv'), {
        uid: 15,
      }) as UploadRawFile;
      const wrapper = mountUpload({
        modelValue: [{ uid: 15, name: rawFile.name, raw: rawFile, status: 'uploading' }],
        httpRequest: adapter,
      });
      const upload = wrapper.findComponent(ElUploadStub);
      const requestOptions = createRequestOptions(rawFile);
      const onSuccess = requestOptions.onSuccess;
      const onError = requestOptions.onError;
      const requestHandler = upload.props('httpRequest') as UploadRequestHandler;
      const request = requestHandler(requestOptions);
      const completion = request.then(
        (response) => requestOptions.onSuccess(response, rawFile),
        () => requestOptions.onError(new Error('迟到的上传失败')),
      );

      await wrapper.setProps({ modelValue: [] });

      expect(adapter.mock.calls[0]?.[0].signal.aborted).toBe(true);
      expect(uploadMethods.abort).toHaveBeenCalledWith(expect.objectContaining({ uid: 15 }));
      if (outcome === 'success') pending.resolve({ fileUrl: '/files/removed.csv' });
      else pending.reject(new Error('迟到的上传失败'));
      await completion;
      await flushPromises();

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(wrapper.emitted('success')).toBeUndefined();
      expect(wrapper.emitted('error')).toBeUndefined();
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
      wrapper.unmount();
    },
  );

  it('keeps no-uid raw file request identity stable when same-name files are reordered', async () => {
    const pending = [deferred<unknown>(), deferred<unknown>()];
    const adapter = vi
      .fn((_options: LxUploadRequestOptions) => pending[0].promise)
      .mockImplementationOnce(() => pending[0].promise)
      .mockImplementationOnce(() => pending[1].promise);
    const firstRaw = new File(['same'], 'same.csv');
    const secondRaw = new File(['same'], 'same.csv');
    const modelValue: LxUploadFile[] = [
      { name: firstRaw.name, size: firstRaw.size, raw: firstRaw, status: 'uploading' },
      { name: secondRaw.name, size: secondRaw.size, raw: secondRaw, status: 'uploading' },
    ];
    const wrapper = mountUpload({ modelValue, httpRequest: adapter });
    const upload = wrapper.findComponent(ElUploadStub);
    const uploadFiles = upload.props('fileList') as UploadUserFile[];
    const requestOptions = uploadFiles.map((file) => createRequestOptions(file.raw as UploadRawFile));
    const originalFirstSuccess = requestOptions[0]!.onSuccess;
    const requestHandler = upload.props('httpRequest') as UploadRequestHandler;
    const requests = requestOptions.map((options) => requestHandler(options));
    const firstCompletion = requests[0]!.then((response) =>
      requestOptions[0]!.onSuccess(response, requestOptions[0]!.file),
    );
    const firstUid = uploadFiles[0]!.uid;
    const secondUid = uploadFiles[1]!.uid;

    expect(firstUid).not.toBe(secondUid);
    await wrapper.setProps({ modelValue: [modelValue[1]!] });

    expect(adapter.mock.calls.map(([options]) => options.signal.aborted)).toEqual([true, false]);
    expect(uploadMethods.abort).toHaveBeenCalledWith(expect.objectContaining({ uid: firstUid }));
    expect(uploadMethods.abort).not.toHaveBeenCalledWith(expect.objectContaining({ uid: secondUid }));

    pending[0]!.resolve({ fileUrl: '/files/late-first.csv' });
    await firstCompletion;
    await flushPromises();

    expect(originalFirstSuccess).not.toHaveBeenCalled();
    expect(wrapper.emitted('success')).toBeUndefined();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect((upload.props('fileList') as UploadUserFile[]).map((file) => file.uid)).toEqual([secondUid]);
    wrapper.unmount();
  });

  it('only cancels the removed internal uid when controlled files share a raw uid', async () => {
    const pending = [deferred<unknown>(), deferred<unknown>()];
    const adapter = vi.fn((options: LxUploadRequestOptions) =>
      options.file.uid === 73 ? pending[0].promise : pending[1].promise,
    );
    const sharedRaw = Object.assign(new File(['data'], 'shared.csv'), {
      uid: 73,
    }) as UploadRawFile;
    const modelValue: LxUploadFile[] = [
      { uid: 73, name: sharedRaw.name, raw: sharedRaw, status: 'uploading' },
      { uid: 'remote-73', name: sharedRaw.name, raw: sharedRaw, status: 'uploading' },
    ];
    const wrapper = mountUpload({ modelValue, httpRequest: adapter });
    const upload = wrapper.findComponent(ElUploadStub);
    const requestHandler = upload.props('httpRequest') as UploadRequestHandler;
    const uploadFiles = upload.props('fileList') as UploadUserFile[];
    const options = uploadFiles.map((file) => createRequestOptions(file.raw as UploadRawFile));
    const requests = options.map((requestOptions) => requestHandler(requestOptions));

    expect(uploadFiles.map((file) => file.uid)).toEqual([73, 74]);
    expect(adapter.mock.calls.map(([request]) => request.signal.aborted)).toEqual([false, false]);
    await wrapper.setProps({ modelValue: [modelValue[0]] });

    expect(adapter.mock.calls.map(([request]) => request.signal.aborted)).toEqual([false, true]);
    expect(uploadMethods.abort).toHaveBeenCalledWith(expect.objectContaining({ uid: 74 }));
    expect(uploadMethods.abort).not.toHaveBeenCalledWith(expect.objectContaining({ uid: 73 }));
    pending.forEach((request) => request.resolve({ fileUrl: '/files/shared.csv' }));
    await Promise.all(requests);
    wrapper.unmount();
  });

  it('keeps successful response metadata when cancelling another file', async () => {
    const response = { storageKey: 'cover-1' };
    const files: LxUploadFile[] = [
      {
        uid: 10,
        name: 'cover.png',
        status: 'success',
        url: '/files/cover.png',
        response,
      },
      {
        uid: 11,
        name: 'pending.png',
        status: 'uploading',
        percentage: 48,
      },
    ];
    const wrapper = mountUpload({ modelValue: files, action: 'mock://upload' });

    await wrapper.get('.lx-upload__cancel').trigger('click');

    const latest = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as LxUploadFile[];
    expect(latest[0]).toMatchObject({
      uid: 10,
      status: 'success',
      url: '/files/cover.png',
      response,
    });
    expect(latest[1]).toMatchObject({
      uid: 11,
      status: 'ready',
      percentage: 0,
    });
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
