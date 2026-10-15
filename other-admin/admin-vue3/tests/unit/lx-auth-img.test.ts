import { flushPromises, mount } from '@vue/test-utils';
import { LxAuthImg } from 'lx-ui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

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
    const response = deferred<Blob>();
    const request = vi.fn((_src: string, _signal?: AbortSignal) => response.promise);
    const wrapper = mount(LxAuthImg, {
      props: { src: 'mock://avatar/first', request, alt: 'LinkX 标识' },
    });

    await flushPromises();
    expect(request).toHaveBeenCalledWith('mock://avatar/first', expect.any(AbortSignal));
    expect(wrapper.get('[role="status"]').text()).toBe('图片加载中');
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('LinkX 标识');
    expect(wrapper.get('[role="img"]').attributes('aria-busy')).toBe('true');

    response.resolve(new Blob(['image-data'], { type: 'image/png' }));
    await flushPromises();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(wrapper.get('img').attributes('src')).toBe('blob:lx-auth-img-1');
    expect(wrapper.get('img').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('.lx-auth-img__loading-indicator').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('.lx-auth-img__loading-indicator [data-icon-name="loading"]').exists()).toBe(true);
    expect(wrapper.get('[role="status"]').text()).toBe('图片加载中');
    await wrapper.get('img').trigger('load');
    expect(wrapper.get('img').attributes('aria-busy')).toBe('false');
    expect(wrapper.find('.lx-auth-img__loading-indicator').exists()).toBe(false);
    expect(wrapper.get('[role="status"]').text()).toBe('图片加载完成');
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

  it('aborts the previous adapter request when request changes for the same source', async () => {
    const first = deferred<Blob>();
    const second = deferred<Blob>();
    const firstRequest = vi.fn((_src: string, _signal?: AbortSignal) => first.promise);
    const secondRequest = vi.fn((_src: string, _signal?: AbortSignal) => second.promise);
    const wrapper = mount(LxAuthImg, {
      props: { src: 'mock://avatar/same', request: firstRequest },
    });
    await flushPromises();
    const firstSignal = firstRequest.mock.calls[0][1];

    await wrapper.setProps({ request: secondRequest });
    await flushPromises();
    expect(firstSignal?.aborted).toBe(true);

    first.resolve(new Blob(['stale']));
    await flushPromises();
    expect(createObjectURL).not.toHaveBeenCalled();

    second.resolve(new Blob(['current']));
    await flushPromises();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(wrapper.get('img').attributes('src')).toBe('blob:lx-auth-img-1');
    wrapper.unmount();
  });

  it('aborts a pending request on unmount and ignores its late response', async () => {
    const pending = deferred<Blob>();
    const request = vi.fn((_src: string, _signal?: AbortSignal) => pending.promise);
    const wrapper = mount(LxAuthImg, {
      props: { src: 'mock://avatar/pending', request },
    });
    await flushPromises();
    const signal = request.mock.calls[0][1];

    wrapper.unmount();
    expect(signal?.aborted).toBe(true);

    pending.resolve(new Blob(['late']));
    await flushPromises();
    expect(createObjectURL).not.toHaveBeenCalled();
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
    expect(failed.get('[role="img"]').attributes('aria-label')).toBe('服务图标');
    expect(failed.get('[role="img"]').attributes('aria-busy')).toBe('false');
    expect(failed.get('[data-icon-name="circle-alert"]').exists()).toBe(true);
    expect(failed.get('[role="status"]').text()).toBe('图片加载失败');
    expect(failed.emitted('error')).toHaveLength(1);
    failed.unmount();
  });

  it('provides a host retry action for a failed request through error-actions', async () => {
    const request = vi
      .fn<(src: string, signal?: AbortSignal) => Promise<Blob>>()
      .mockRejectedValueOnce(new Error('本地 Mock 失败'))
      .mockResolvedValueOnce(new Blob(['restored'], { type: 'image/png' }));
    const wrapper = mount(LxAuthImg, {
      props: { src: 'mock://avatar/retry', request, alt: '服务图标' },
      attachTo: document.body,
      slots: {
        'error-actions': ({ retry, loading }: { retry: () => void; loading: boolean }) =>
          h(
            'button',
            {
              type: 'button',
              'data-testid': 'auth-img-retry',
              'aria-disabled': loading,
              onClick: retry,
            },
            '重试',
          ),
      },
    });

    await flushPromises();
    expect(wrapper.get('[data-testid="auth-img-retry"]').text()).toBe('重试');
    expect(wrapper.get('[role="status"]').text()).toBe('图片加载失败');

    const retry = wrapper.get('[data-testid="auth-img-retry"]');
    retry.element.focus();
    await retry.trigger('click');
    await flushPromises();

    expect(request).toHaveBeenCalledTimes(2);
    expect(wrapper.get('[data-testid="auth-img-retry"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="auth-img-retry"]').element).toBe(retry.element);
    expect(wrapper.get('[data-testid="auth-img-retry"]').attributes('aria-disabled')).toBe('true');
    expect(wrapper.get('img').attributes('src')).toBe('blob:lx-auth-img-1');
    expect(wrapper.get('[role="status"]').text()).toBe('图片加载中');
    await wrapper.get('img').trigger('load');
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe('图片加载完成');
    expect(document.activeElement).toBe(wrapper.get('[role="status"]').element);
    wrapper.unmount();
  });

  it('keeps the retry action available when a request failure is showing a fallback', async () => {
    const request = vi
      .fn<(src: string, signal?: AbortSignal) => Promise<Blob>>()
      .mockRejectedValueOnce(new Error('本地 Mock 失败'))
      .mockResolvedValueOnce(new Blob(['restored'], { type: 'image/png' }));
    const wrapper = mount(LxAuthImg, {
      props: {
        src: 'mock://avatar/retry-with-fallback',
        request,
        fallback: '/public/fallback.png',
        alt: '服务图标',
      },
      slots: {
        'error-actions': ({ retry, loading }: { retry: () => void; loading: boolean }) =>
          h(
            'button',
            {
              type: 'button',
              'data-testid': 'auth-img-retry-with-fallback',
              'aria-disabled': loading,
              onClick: retry,
            },
            '重试',
          ),
      },
    });

    await flushPromises();
    expect(wrapper.get('img').attributes('src')).toBe('/public/fallback.png');
    expect(wrapper.get('[data-testid="auth-img-retry-with-fallback"]').exists()).toBe(true);
    await wrapper.get('img').trigger('load');

    const retry = wrapper.get('[data-testid="auth-img-retry-with-fallback"]');
    await retry.trigger('click');
    await flushPromises();

    expect(request).toHaveBeenCalledTimes(2);
    expect(wrapper.get('img').attributes('src')).toBe('blob:lx-auth-img-1');
    expect(wrapper.get('[data-testid="auth-img-retry-with-fallback"]').exists()).toBe(true);
    await wrapper.get('img').trigger('load');
    expect(wrapper.get('[role="status"]').text()).toBe('图片加载完成');
    wrapper.unmount();
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

  it('keeps the retry action available after a main image decode error with fallback', async () => {
    const request = vi
      .fn<(src: string, signal?: AbortSignal) => Promise<Blob>>()
      .mockResolvedValueOnce(new Blob(['restored'], { type: 'image/png' }));
    const wrapper = mount(LxAuthImg, {
      props: {
        src: 'mock://avatar/decode-retry',
        request,
        fallback: '/public/fallback.png',
      },
      slots: {
        'error-actions': ({ retry, loading }: { retry: () => void; loading: boolean }) =>
          h(
            'button',
            {
              type: 'button',
              'data-testid': 'auth-img-decode-retry',
              'aria-disabled': loading,
              onClick: retry,
            },
            '重试',
          ),
      },
    });

    await flushPromises();
    await wrapper.get('img').trigger('error');
    expect(wrapper.get('img').attributes('src')).toBe('/public/fallback.png');
    expect(wrapper.get('[data-testid="auth-img-decode-retry"]').exists()).toBe(true);
    await wrapper.get('img').trigger('load');

    await wrapper.get('[data-testid="auth-img-decode-retry"]').trigger('click');
    await flushPromises();
    expect(request).toHaveBeenCalledTimes(2);
    expect(wrapper.get('img').attributes('src')).toBe('blob:lx-auth-img-2');
    wrapper.unmount();
  });

  it('ignores late events from an earlier fallback image with the same URL', async () => {
    const wrapper = mount(LxAuthImg, {
      props: { src: '/public/broken.png', fallback: '/public/fallback-a.png' },
    });
    await wrapper.get('img').trigger('error');
    const firstFallback = wrapper.get('img').element;

    await wrapper.setProps({ fallback: '/public/fallback-b.png' });
    await wrapper.setProps({ fallback: '/public/fallback-a.png' });
    expect(wrapper.get('img').attributes('src')).toBe('/public/fallback-a.png');
    expect(wrapper.get('img').attributes('aria-busy')).toBe('true');
    const loadsBeforeStaleEvents = wrapper.emitted('load')?.length ?? 0;
    const errorsBeforeStaleEvents = wrapper.emitted('error')?.length ?? 0;

    firstFallback.dispatchEvent(new Event('load'));
    firstFallback.dispatchEvent(new Event('error'));

    expect(wrapper.get('img').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('[role="status"]').text()).toBe('主图加载失败，正在载入回退图片');
    expect(wrapper.emitted('load')?.length ?? 0).toBe(loadsBeforeStaleEvents);
    expect(wrapper.emitted('error')?.length ?? 0).toBe(errorsBeforeStaleEvents);

    await wrapper.get('img').trigger('load');
    expect(wrapper.get('img').attributes('aria-busy')).toBe('false');
    expect(wrapper.get('[role="status"]').text()).toBe('主图加载失败，已显示回退图片');
    wrapper.unmount();
  });

  it('shows an accessible empty-source placeholder without calling the request adapter', () => {
    const request = vi.fn(() => Promise.resolve(new Blob()));
    const wrapper = mount(LxAuthImg, {
      props: { src: '', request, alt: 'LinkX 通信服务标识' },
    });

    expect(request).not.toHaveBeenCalled();
    expect(wrapper.emitted('error')).toBeUndefined();
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('LinkX 通信服务标识');
    expect(wrapper.get('[role="status"]').text()).toBe('暂无图片');
    expect(wrapper.get('[data-icon-name="image"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('updates the empty-source placeholder when a fallback is added or removed', async () => {
    const request = vi.fn(() => Promise.resolve(new Blob()));
    const wrapper = mount(LxAuthImg, {
      props: { src: '', request, alt: 'LinkX 通信服务标识' },
    });

    await wrapper.setProps({ fallback: '/public/fallback.png' });
    expect(wrapper.get('img').attributes('src')).toBe('/public/fallback.png');
    expect(wrapper.get('img').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('[role="status"]').text()).toBe('主图地址为空，正在载入回退图片');
    await wrapper.get('img').trigger('load');
    expect(wrapper.get('[role="status"]').text()).toBe('主图地址为空，已显示回退图片');

    await wrapper.setProps({ fallback: '' });
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.get('[role="status"]').text()).toBe('暂无图片');
    expect(request).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('reuses an already loaded fallback when the main source becomes empty', async () => {
    const request = vi.fn(() => Promise.reject(new Error('本地 Mock 失败')));
    const wrapper = mount(LxAuthImg, {
      props: {
        src: 'mock://avatar/failed',
        request,
        fallback: '/public/fallback.png',
      },
    });
    await flushPromises();
    await wrapper.get('img').trigger('load');
    expect(wrapper.get('[role="status"]').text()).toBe('主图加载失败，已显示回退图片');

    const loadEventsBeforeEmptySource = wrapper.emitted('load')?.length ?? 0;
    await wrapper.setProps({ src: '' });

    expect(wrapper.get('img').attributes('src')).toBe('/public/fallback.png');
    expect(wrapper.get('img').attributes('aria-busy')).toBe('false');
    expect(wrapper.get('[role="status"]').text()).toBe('主图地址为空，已显示回退图片');
    await flushPromises();
    expect(wrapper.emitted('load')?.length).toBe(loadEventsBeforeEmptySource + 1);
    expect(request).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('applies a fallback added after request failure and clears it without retrying the source', async () => {
    const request = vi.fn(() => Promise.reject(new Error('本地 Mock 失败')));
    const wrapper = mount(LxAuthImg, {
      props: { src: 'mock://avatar/failed', request, alt: '服务图标' },
    });
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe('图片加载失败');

    await wrapper.setProps({ fallback: '/public/fallback.png' });
    expect(wrapper.get('img').attributes('src')).toBe('/public/fallback.png');
    expect(wrapper.get('img').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('[role="status"]').text()).toBe('主图加载失败，正在载入回退图片');
    await wrapper.get('img').trigger('error');
    expect(wrapper.get('[role="status"]').text()).toBe('主图和回退图片均加载失败');

    await wrapper.setProps({ fallback: '/public/next-fallback.png' });
    expect(wrapper.get('img').attributes('src')).toBe('/public/next-fallback.png');
    expect(wrapper.get('[role="status"]').text()).toBe('主图加载失败，正在载入回退图片');
    await wrapper.get('img').trigger('load');
    expect(wrapper.get('[role="status"]').text()).toBe('主图加载失败，已显示回退图片');

    await wrapper.setProps({ fallback: '' });
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.get('[role="status"]').text()).toBe('图片加载失败');
    expect(request).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('keeps a loaded main image and avoids refetching when fallback changes', async () => {
    const pending = deferred<Blob>();
    const request = vi.fn(() => pending.promise);
    const wrapper = mount(LxAuthImg, {
      props: { src: 'mock://avatar/success', request, alt: '服务图标' },
    });
    await flushPromises();

    pending.resolve(new Blob(['main-image']));
    await flushPromises();
    const mainImage = wrapper.get('img');
    const mainSrc = mainImage.attributes('src');
    await mainImage.trigger('load');

    await wrapper.setProps({ fallback: '/public/fallback.png' });
    expect(wrapper.get('img').attributes('src')).toBe(mainSrc);
    expect(wrapper.get('[role="status"]').text()).toBe('图片加载完成');
    expect(request).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('announces asynchronous state changes and forwards host attributes to the image', async () => {
    const pending = deferred<Blob>();
    const request = vi.fn(() => pending.promise);
    const wrapper = mount(LxAuthImg, {
      props: { src: 'mock://avatar/status', request },
      attrs: { class: 'host-auth-img', 'data-owner': 'host' },
    });
    const status = wrapper.get('[role="status"]');

    expect(status.attributes('aria-live')).toBe('polite');
    expect(status.attributes('aria-atomic')).toBe('true');
    expect(status.text()).toBe('图片加载中');

    pending.resolve(new Blob(['current']));
    await flushPromises();
    const image = wrapper.get('img');
    expect(image.classes()).toContain('host-auth-img');
    expect(image.attributes('data-owner')).toBe('host');
    expect(wrapper.find('.lx-auth-img__loading-indicator').exists()).toBe(true);
    await image.trigger('load');
    expect(wrapper.find('.lx-auth-img__loading-indicator').exists()).toBe(false);
    expect(status.text()).toBe('图片加载完成');
    wrapper.unmount();
  });

  it('keeps explicitly configured small dimensions on the loading frame', async () => {
    const pending = deferred<Blob>();
    const request = vi.fn(() => pending.promise);
    const wrapper = mount(LxAuthImg, {
      props: { src: 'mock://avatar/small', request, width: 12, height: 14 },
    });
    await flushPromises();

    const placeholder = wrapper.get('.lx-auth-img__placeholder');
    expect(placeholder.attributes('style')).toContain('width: 12px');
    expect(placeholder.attributes('style')).toContain('height: 14px');
    expect(placeholder.classes()).toContain('is-loading');

    pending.resolve(new Blob(['image']));
    await flushPromises();
    const frame = wrapper.get('.lx-auth-img__frame');
    expect(frame.attributes('style')).toContain('width: 12px');
    expect(frame.attributes('style')).toContain('height: 14px');
    expect(frame.attributes('style')).not.toContain('min-width');
    expect(frame.attributes('style')).not.toContain('min-height');
    expect(frame.classes()).toContain('is-loading');
    wrapper.unmount();
  });
});
