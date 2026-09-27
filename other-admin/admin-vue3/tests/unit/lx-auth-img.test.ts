import { flushPromises, mount } from '@vue/test-utils';
import { LxAuthImg } from 'lx-ui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function deferred<T>() {
  let resolvePromise: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

describe('LxAuthImg', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let originalCreateDescriptor: PropertyDescriptor | undefined;
  let originalRevokeDescriptor: PropertyDescriptor | undefined;
  let nextObjectUrl = 0;

  beforeEach(() => {
    originalCreateDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    originalRevokeDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    createObjectURL = vi.fn(() => `blob:lx-auth-img-${++nextObjectUrl}`);
    revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  afterEach(() => {
    if (originalCreateDescriptor) {
      Object.defineProperty(URL, 'createObjectURL', originalCreateDescriptor);
    } else {
      Reflect.deleteProperty(URL, 'createObjectURL');
    }
    if (originalRevokeDescriptor) {
      Object.defineProperty(URL, 'revokeObjectURL', originalRevokeDescriptor);
    } else {
      Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
    nextObjectUrl = 0;
  });

  it('loads public image URLs directly and applies alt, dimensions and fit', async () => {
    const wrapper = mount(LxAuthImg, {
      props: {
        src: '/public/avatar.png',
        alt: '公开头像',
        width: 72,
        height: '48px',
        fit: 'contain',
      },
    });
    const image = wrapper.get('img');

    expect(image.attributes('src')).toBe('/public/avatar.png');
    expect(image.attributes('alt')).toBe('公开头像');
    expect(image.attributes('style')).toContain('width: 72px');
    expect(image.attributes('style')).toContain('height: 48px');
    expect(image.attributes('style')).toContain('object-fit: contain');
    await image.trigger('load');
    expect(wrapper.emitted('load')?.[0]).toEqual(['/public/avatar.png']);
    wrapper.unmount();
  });

  it('requests a Blob, emits after image load and revokes object URLs on replacement and unmount', async () => {
    const request = vi.fn((_src: string, _signal?: AbortSignal) =>
      Promise.resolve(new Blob(['image-data'], { type: 'image/png' })),
    );
    const wrapper = mount(LxAuthImg, {
      props: { src: 'mock://avatar/first', request, alt: 'LinkX 标识' },
    });

    await flushPromises();
    expect(request).toHaveBeenCalledWith('mock://avatar/first', expect.any(AbortSignal));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(wrapper.get('img').attributes('src')).toBe('blob:lx-auth-img-1');
    expect(wrapper.get('img').attributes('aria-busy')).toBe('true');
    await wrapper.get('img').trigger('load');
    expect(wrapper.get('img').attributes('aria-busy')).toBe('false');
    expect(wrapper.emitted('load')?.[0]).toEqual(['blob:lx-auth-img-1']);

    await wrapper.setProps({ src: 'mock://avatar/second' });
    await flushPromises();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:lx-auth-img-1');
    expect(wrapper.get('img').attributes('src')).toBe('blob:lx-auth-img-2');
    wrapper.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:lx-auth-img-2');
  });

  it('aborts a stale request and ignores its late response without emitting an error', async () => {
    const first = deferred<Blob>();
    const second = deferred<Blob>();
    const request = vi
      .fn<(src: string, signal?: AbortSignal) => Promise<Blob>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const wrapper = mount(LxAuthImg, {
      props: { src: 'mock://avatar/old', request },
    });
    await flushPromises();
    const oldSignal = request.mock.calls[0][1];

    await wrapper.setProps({ src: 'mock://avatar/new' });
    await flushPromises();
    expect(oldSignal?.aborted).toBe(true);

    first.resolve(new Blob(['old']));
    await flushPromises();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(wrapper.emitted('error')).toBeUndefined();

    second.resolve(new Blob(['new']));
    await flushPromises();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(wrapper.get('img').attributes('src')).toBe('blob:lx-auth-img-1');
    wrapper.unmount();
  });

  it('uses a fallback after request failure and exposes a labelled error state without one', async () => {
    const request = vi.fn(() => Promise.reject(new Error('本地 Mock 失败')));
    const fallback = mount(LxAuthImg, {
      props: {
        src: 'mock://avatar/failed',
        request,
        fallback: '/public/fallback.png',
        alt: '服务图标',
      },
    });
    await flushPromises();
    expect(fallback.get('img').attributes('src')).toBe('/public/fallback.png');
    expect(fallback.emitted('error')).toHaveLength(1);
    await fallback.get('img').trigger('load');
    fallback.unmount();

    const failed = mount(LxAuthImg, {
      props: { src: 'mock://avatar/failed', request, alt: '服务图标' },
    });
    await flushPromises();
    expect(failed.get('[role="img"]').attributes('aria-label')).toBe('服务图标，图片加载失败');
    expect(failed.get('[role="img"]').attributes('aria-busy')).toBe('false');
    expect(failed.get('[data-icon-name="image"]').exists()).toBe(true);
    expect(failed.emitted('error')).toHaveLength(1);
    failed.unmount();
  });

  it('reports an image decode error before switching to the public fallback', async () => {
    const wrapper = mount(LxAuthImg, {
      props: {
        src: '/public/broken.png',
        fallback: '/public/fallback.png',
        alt: '服务图标',
      },
    });

    await wrapper.get('img').trigger('error');
    expect(wrapper.emitted('error')).toHaveLength(1);
    expect(wrapper.get('img').attributes('src')).toBe('/public/fallback.png');
    await wrapper.get('img').trigger('load');
    expect(wrapper.emitted('load')?.[0]).toEqual(['/public/fallback.png']);
    wrapper.unmount();
  });

  it('shows an accessible empty-source placeholder without calling the request adapter', () => {
    const request = vi.fn(() => Promise.resolve(new Blob()));
    const wrapper = mount(LxAuthImg, { props: { src: '', request } });

    expect(request).not.toHaveBeenCalled();
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('图片加载失败');
    expect(wrapper.get('[data-icon-name="image"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
