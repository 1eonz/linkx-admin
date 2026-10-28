import { flushPromises, mount } from '@vue/test-utils';
import { LxBreadcrumb } from 'lx-ui';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import type { RouteRecordRedirectOption } from 'vue-router';

import Breadcrumb from '@/components/Breadcrumb/index.vue';

describe('LxBreadcrumb 受控导航', () => {
  it('按顺序渲染链接与当前位置，末项即使带目标也不可点击', async () => {
    const wrapper = mount(LxBreadcrumb, {
      props: {
        items: [
          { title: '首页', to: '/dashboard' },
          { title: '当前页面', to: '/current' },
        ],
      },
    });
    try {
      expect(wrapper.get('nav').attributes('aria-label')).toBe('面包屑导航');
      expect(wrapper.findAll('ol > li')).toHaveLength(2);
      expect(wrapper.get('a').attributes('href')).toBe('/dashboard');
      expect(wrapper.get('[aria-current="page"]').text()).toBe('当前页面');
      expect(wrapper.findAll('a')).toHaveLength(1);
      expect(wrapper.get('.lx-breadcrumb__separator').attributes('aria-hidden')).toBe('true');
      expect(wrapper.get('.lx-breadcrumb__separator').text()).toBe('/');
      await wrapper.setProps({ separator: '›' });
      expect(wrapper.get('.lx-breadcrumb__separator').text()).toBe('›');
    } finally {
      wrapper.unmount();
    }
  });

  it('宿主可阻止原生导航；更新 items 后当前位置随之更新', async () => {
    const onSelect = vi.fn((_item, event: MouseEvent) => event.preventDefault());
    const wrapper = mount(LxBreadcrumb, {
      props: { items: [{ title: '首页', to: '/dashboard' }, { title: '详情' }], onSelect },
    });
    try {
      await wrapper.get('a').trigger('click');
      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect.mock.calls[0][1].defaultPrevented).toBe(true);
      expect(wrapper.get('[aria-current="page"]').text()).toBe('详情');
      await wrapper.setProps({ items: [{ title: '首页', to: '/dashboard' }] });
      expect(wrapper.findAll('a')).toHaveLength(0);
      expect(wrapper.get('[aria-current="page"]').text()).toBe('首页');
    } finally {
      wrapper.unmount();
    }
  });

  it('保留长标题完整名称、无链接层级与空路径插槽', async () => {
    const title = '跨区域协同值班与长名称业务配置中心';
    const wrapper = mount(LxBreadcrumb, {
      props: { items: [{ title }, { title: '当前页面' }] },
      slots: { default: '本地预览' },
    });
    try {
      expect(wrapper.findAll('a')).toHaveLength(0);
      expect(wrapper.findAll('.lx-breadcrumb__item')[0].attributes('title')).toBe(title);
      expect(wrapper.get('.lx-breadcrumb__extra').text()).toBe('本地预览');
      await wrapper.setProps({ items: [] });
      expect(wrapper.find('ol').exists()).toBe(false);
      expect(wrapper.find('[aria-current]').exists()).toBe(false);
      expect(wrapper.get('.lx-breadcrumb__extra').text()).toBe('本地预览');
    } finally {
      wrapper.unmount();
    }
  });
});

const Page = defineComponent({ template: '<div />' });

async function createHost(redirect?: RouteRecordRedirectOption) {
  const router = createRouter({
    history: createMemoryHistory('/preview/'),
    routes: [
      { path: '/dashboard', component: Page, meta: { title: '首页' } },
      { path: '/landing', component: Page, meta: { title: '业务首页' } },
      {
        path: '/section/:id',
        component: Page,
        meta: { title: '业务中心' },
        redirect,
        children: [{ path: 'detail', component: Page, meta: { title: '详情' } }],
      },
    ],
  });
  await router.push('/section/42/detail');
  await router.isReady();
  const wrapper = mount(Breadcrumb, { global: { plugins: [router] } });
  return { wrapper, router };
}

describe('Vue3 面包屑宿主路由适配', () => {
  it.each([
    ['字符串', '/landing'],
    ['对象', { path: '/landing', query: { source: 'breadcrumb' } }],
    ['函数', () => ({ path: '/landing', query: { source: 'breadcrumb' } })],
  ] satisfies [string, RouteRecordRedirectOption][])(
    '%s重定向由 Router 解析，原生 href 保留 history base 与动态参数',
    async (_name, redirect) => {
      const { wrapper, router } = await createHost(redirect);
      try {
        const link = wrapper.findAll('a')[1];
        expect(link.attributes('href')).toBe('/preview/section/42');
        await link.trigger('click');
        await flushPromises();
        expect(router.currentRoute.value.path).toBe('/landing');
        expect(wrapper.get('[aria-current="page"]').text()).toBe('业务首页');
      } finally {
        wrapper.unmount();
      }
    },
  );

  it('修饰键、中键和已阻止的事件不触发 SPA 跳转', async () => {
    const { wrapper, router } = await createHost();
    try {
      const push = vi.spyOn(router, 'push');
      const breadcrumb = wrapper.findComponent(LxBreadcrumb);
      const item = breadcrumb.props('items')?.[0];
      expect(item).toBeDefined();
      for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
        const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
        breadcrumb.vm.$emit('select', item, event);
        expect(event.defaultPrevented).toBe(false);
      }
      const prevented = new MouseEvent('click', { cancelable: true });
      prevented.preventDefault();
      breadcrumb.vm.$emit('select', item, prevented);
      expect(push).not.toHaveBeenCalled();
      expect(router.currentRoute.value.path).toBe('/section/42/detail');
    } finally {
      wrapper.unmount();
    }
  });

  it('隐藏层级不生成链接，未知条目不接管导航', async () => {
    const { wrapper, router } = await createHost();
    try {
      router.currentRoute.value.matched[0].meta.breadcrumb = false;
      await router.push('/section/43/detail');
      await flushPromises();
      expect(wrapper.findAll('.lx-breadcrumb__item').map((item) => item.text())).toEqual(['首页', '详情']);
      const event = new MouseEvent('click', { cancelable: true });
      wrapper.findComponent(LxBreadcrumb).vm.$emit('select', { title: '未知', to: '/unknown' }, event);
      expect(event.defaultPrevented).toBe(false);
      expect(router.currentRoute.value.path).toBe('/section/43/detail');
    } finally {
      wrapper.unmount();
    }
  });
});
