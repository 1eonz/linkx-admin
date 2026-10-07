import { flushPromises, mount } from '@vue/test-utils';
import { ElForm } from 'element-plus';
import { LxInput, LxSelect, LxSelectPagination } from 'lx-ui';
import type { LxSelectPaginationApi, LxSelectPaginationResult } from 'lx-ui';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('LxSelectPagination', () => {
  it('继承 ElForm 禁用态，并阻止触发器和公开加载方法发起请求', async () => {
    const formDisabled = ref(true);
    const api = vi.fn<LxSelectPaginationApi>().mockResolvedValue({
      records: [{ id: 'a', name: '选项 A' }],
      total: 1,
    });
    const selectRef = ref<{
      reload: () => void;
      loadMore: () => void;
    }>();
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ElForm,
            { disabled: formDisabled.value },
            {
              default: () =>
                h(LxSelectPagination, {
                  ref: selectRef,
                  api,
                  teleported: false,
                }),
            },
          );
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    const component = wrapper.findComponent(LxSelectPagination);
    const select = wrapper.findComponent(LxSelect);

    expect(component.props('disabled')).toBeUndefined();
    expect(select.props('disabled')).toBeUndefined();
    expect(wrapper.find('.el-select__wrapper').classes()).toContain('is-disabled');
    await wrapper.find('.el-select__wrapper').trigger('click');
    selectRef.value?.reload();
    selectRef.value?.loadMore();
    await flushPromises();

    expect(api).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('忽略旧查询和表单禁用后的迟到响应，并禁止禁用期间搜索或重载', async () => {
    const formDisabled = ref(false);
    const oldRequest = deferred<LxSelectPaginationResult>();
    const disabledRequest = deferred<LxSelectPaginationResult>();
    const requests: string[] = [];
    const onLoad = vi.fn();
    const api: LxSelectPaginationApi = ({ keyword }) => {
      requests.push(keyword);
      if (keyword === '') return oldRequest.promise;
      if (keyword === '新查询') {
        return Promise.resolve({
          records: [{ id: 'new', name: '新结果' }],
          total: 1,
        });
      }
      return disabledRequest.promise;
    };
    const selectRef = ref<{ reload: () => void }>();
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ElForm,
            { disabled: formDisabled.value },
            {
              default: () =>
                h(LxSelectPagination, {
                  ref: selectRef,
                  api,
                  debounce: 250,
                  teleported: false,
                  onLoad,
                }),
            },
          );
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await wrapper.find('.el-select__wrapper').trigger('click');
    await flushPromises();

    const search = wrapper.findComponent(LxInput);
    const select = wrapper.findComponent(LxSelect);
    expect(search.exists()).toBe(true);
    expect(search.props('disabled')).toBeUndefined();
    expect(select.props('disabled')).toBeUndefined();
    search.vm.$emit('update:modelValue', '新查询');
    await wait(280);
    await flushPromises();
    expect(requests).toEqual(['', '新查询']);

    oldRequest.resolve({
      records: [{ id: 'old', name: '旧结果' }],
      total: 1,
    });
    await flushPromises();
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('新结果');
    expect(wrapper.text()).not.toContain('旧结果');

    search.vm.$emit('update:modelValue', '禁用期间查询');
    await wait(280);
    await flushPromises();
    expect(requests).toEqual(['', '新查询', '禁用期间查询']);

    formDisabled.value = true;
    await nextTick();
    expect(wrapper.find('.el-select__wrapper').classes()).toContain('is-disabled');
    expect(select.props('disabled')).toBeUndefined();
    disabledRequest.resolve({
      records: [{ id: 'late', name: '禁用后迟到结果' }],
      total: 1,
    });
    await flushPromises();
    selectRef.value?.reload();
    search.vm.$emit('update:modelValue', '不应请求');
    await wait(280);
    await flushPromises();

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(requests).toEqual(['', '新查询', '禁用期间查询']);
    expect(wrapper.text()).not.toContain('禁用后迟到结果');
    wrapper.unmount();
  });

  it('续页失败后重试相同页码，并保留已加载结果队列', async () => {
    const requestedPages: number[] = [];
    const api: LxSelectPaginationApi = ({ page }) => {
      requestedPages.push(page);
      if (page === 1) {
        return Promise.resolve({
          records: [{ id: 'a', name: '第一页结果' }],
          total: 3,
          hasMore: true,
        });
      }
      if (requestedPages.filter((requestedPage) => requestedPage === 2).length === 1) {
        return Promise.reject(new Error('续页失败'));
      }
      return Promise.resolve({
        records: [{ id: 'b', name: '第二页结果' }],
        total: 3,
        hasMore: true,
      });
    };
    const wrapper = mount(LxSelectPagination, {
      props: { api, teleported: false },
      attachTo: document.body,
    });
    await wrapper.find('.el-select__wrapper').trigger('click');
    await flushPromises();

    wrapper.vm.loadMore();
    await flushPromises();
    expect(requestedPages).toEqual([1, 2]);
    expect(wrapper.text()).toContain('第一页结果');
    expect(wrapper.find('.lx-select-pagination__error').exists()).toBe(true);

    await wrapper.find('.lx-select-pagination__error button').trigger('click');
    await flushPromises();

    expect(requestedPages).toEqual([1, 2, 2]);
    expect(wrapper.text()).toContain('第一页结果');
    expect(wrapper.text()).toContain('第二页结果');
    wrapper.unmount();
  });

  it('空结果页仍有后续页时，续页失败按失败页码重试', async () => {
    const requestedPages: number[] = [];
    let pageTwoAttempts = 0;
    const api: LxSelectPaginationApi = ({ page }) => {
      requestedPages.push(page);
      if (page === 1) {
        return Promise.resolve({ records: [], total: 2, hasMore: true });
      }
      pageTwoAttempts += 1;
      if (pageTwoAttempts === 1) return Promise.reject(new Error('续页失败'));
      return Promise.resolve({
        records: [{ id: 'b', name: '第二页结果' }],
        total: 2,
        hasMore: false,
      });
    };
    const wrapper = mount(LxSelectPagination, {
      props: { api, teleported: false },
      attachTo: document.body,
    });
    await wrapper.find('.el-select__wrapper').trigger('click');
    await flushPromises();

    await wrapper.find('.lx-select-pagination__footer button').trigger('click');
    await flushPromises();
    expect(requestedPages).toEqual([1, 2]);
    expect(wrapper.find('.lx-select-pagination__error').exists()).toBe(true);

    await wrapper.find('.lx-select-pagination__error button').trigger('click');
    await flushPromises();

    expect(requestedPages).toEqual([1, 2, 2]);
    expect(wrapper.text()).toContain('第二页结果');
    wrapper.unmount();
  });
});
