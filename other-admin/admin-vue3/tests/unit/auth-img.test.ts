import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAuthImageBlob } from '@/api/authImage';
import AuthImg from '@/components/AuthImg/index.vue';

vi.mock('@/api/authImage', () => ({ getAuthImageBlob: vi.fn() }));

function deferred<T>() {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

const getImage = vi.mocked(getAuthImageBlob);

describe('AuthImg', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let originalCreateDescriptor: PropertyDescriptor | undefined;
  let originalRevokeDescriptor: PropertyDescriptor | undefined;
  let nextObjectUrl = 0;

  beforeEach(() => {
    originalCreateDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    originalRevokeDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    createObjectURL = vi.fn(() => `blob:host-auth-img-${++nextObjectUrl}`);
    revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    getImage.mockReset();
  });

  afterEach(() => {
    if (originalCreateDescriptor) Object.defineProperty(URL, 'createObjectURL', originalCreateDescriptor);
    else Reflect.deleteProperty(URL, 'createObjectURL');
    if (originalRevokeDescriptor) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeDescriptor);
    else Reflect.deleteProperty(URL, 'revokeObjectURL');
    nextObjectUrl = 0;
  });

  it('renders a Blob URL after loading and releases it when unmounted', async () => {
    getImage.mockResolvedValueOnce(new Blob(['image'], { type: 'image/png' }));
    const wrapper = mount(AuthImg, { props: { authSrc: '/static/avatar.png', alt: '服务图标' } });

    await flushPromises();
    const image = wrapper.get('img');
    expect(image.attributes('src')).toBe('blob:host-auth-img-1');
    expect(image.attributes('alt')).toBe('服务图标');
    expect(image.attributes('aria-busy')).toBe('true');

    await image.trigger('load');
    expect(image.attributes('aria-busy')).toBe('false');
    wrapper.unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:host-auth-img-1');
  });

  it('aborts an old request and ignores its late response after the source changes', async () => {
    const oldRequest = deferred<Blob>();
    const newRequest = deferred<Blob>();
    getImage.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const wrapper = mount(AuthImg, { props: { authSrc: '/static/old.png' } });
    await flushPromises();
    const oldSignal = getImage.mock.calls[0][1];

    await wrapper.setProps({ authSrc: '/static/new.png' });
    expect(oldSignal?.aborted).toBe(true);
    await flushPromises();
    newRequest.resolve(new Blob(['new']));
    await flushPromises();
    oldRequest.resolve(new Blob(['old']));
    await flushPromises();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(wrapper.get('img').attributes('src')).toBe('blob:host-auth-img-1');
    wrapper.unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('shows an accessible failure state and recovers when a valid source is supplied', async () => {
    getImage.mockRejectedValueOnce(new Error('network unavailable'));
    const wrapper = mount(AuthImg, {
      props: { authSrc: '/static/broken.png', alt: '服务图标' },
      attrs: { class: 'avatar-preview' },
    });
    await flushPromises();

    expect(wrapper.get('button').attributes('aria-label')).toBe('图片加载失败，重新加载 服务图标');
    expect(wrapper.get('[aria-busy="false"]').exists()).toBe(true);
    expect(wrapper.get('.auth-img-placeholder').classes()).toContain('avatar-preview');
    expect(wrapper.find('img').exists()).toBe(false);

    getImage.mockResolvedValueOnce(new Blob(['restored']));
    await wrapper.setProps({ authSrc: '/static/restored.png' });
    await flushPromises();
    expect(wrapper.get('img').attributes('src')).toBe('blob:host-auth-img-1');
    expect(wrapper.get('img').classes()).toContain('avatar-preview');
    wrapper.unmount();
  });

  it('retries the same image source from the failure control', async () => {
    getImage.mockRejectedValueOnce(new Error('network unavailable')).mockResolvedValueOnce(new Blob(['restored']));
    const wrapper = mount(AuthImg, { props: { authSrc: '/static/retry.png' } });
    await flushPromises();

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(getImage).toHaveBeenCalledTimes(2);
    expect(getImage.mock.calls[1][0]).toBe('/static/retry.png');
    expect(wrapper.get('img').attributes('src')).toBe('blob:host-auth-img-1');
    wrapper.unmount();
  });

  it('shows an empty-source placeholder and cancels an in-flight request on unmount', async () => {
    const wrapper = mount(AuthImg, { props: { authSrc: '', alt: '头像' } });
    expect(getImage).not.toHaveBeenCalled();
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('头像，图片加载失败');
    wrapper.unmount();

    const pending = deferred<Blob>();
    getImage.mockReturnValueOnce(pending.promise);
    const loading = mount(AuthImg, { props: { authSrc: '/static/pending.png', alt: '头像' } });
    await flushPromises();
    const signal = getImage.mock.calls[0][1];
    loading.unmount();
    pending.resolve(new Blob(['late']));
    await flushPromises();

    expect(signal?.aborted).toBe(true);
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
