import { mount } from '@vue/test-utils';
import { LxTabsBar } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, watch } from 'vue';

const tabs = [
  { key: 'overview', title: '系统总览' },
  { key: 'tags', title: '群组标签', closable: true },
  { key: 'archive', title: '活动归档', closable: true },
];

describe('LxTabsBar 路由页签', () => {
  it('延迟回收保留宿主渲染后主动安排的有效焦点', async () => {
    const visibleTabs = ref([...tabs]);
    const outside = ref<HTMLButtonElement | null>(null);
    const host = defineComponent({
      setup() {
        watch(visibleTabs, () => outside.value?.focus(), { flush: 'post' });
        return () => h('div', [h('button', { ref: outside }, '宿主操作'), h(LxTabsBar, { tabs: visibleTabs.value })]);
      },
    });
    const wrapper = mount(host, { attachTo: document.body });
    try {
      (wrapper.get('[data-key="tags"] .lx-tabs-bar__close').element as HTMLButtonElement).focus();
      visibleTabs.value = [tabs[0], tabs[2]];
      await nextTick();
      await nextTick();
      expect(document.activeElement).toBe(outside.value);
    } finally {
      wrapper.unmount();
    }
  });
  it('方向键与 Home/End 只移动焦点，激活仍由点击请求宿主处理', async () => {
    const wrapper = mount(LxTabsBar, { attachTo: document.body, props: { tabs, modelValue: 'overview' } });
    try {
      const buttons = wrapper.findAll('.lx-tabs-bar__trigger');
      (buttons[0].element as HTMLButtonElement).focus();
      await buttons[0].trigger('keydown', { key: 'ArrowRight' });
      expect(document.activeElement).toBe(buttons[1].element);
      await buttons[1].trigger('keydown', { key: 'End' });
      expect(document.activeElement).toBe(buttons[2].element);
      await buttons[2].trigger('keydown', { key: 'ArrowRight' });
      expect(document.activeElement).toBe(buttons[0].element);
      await buttons[0].trigger('keydown', { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(buttons[2].element);
      await buttons[2].trigger('keydown', { key: 'Home' });
      expect(document.activeElement).toBe(buttons[0].element);
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
      await buttons[1].trigger('click');
      expect(wrapper.emitted('update:modelValue')).toEqual([['tags']]);
      expect(buttons[0].attributes('aria-current')).toBe('page');
    } finally {
      wrapper.unmount();
    }
  });

  it('中键只关闭可关闭页签，不改变受控列表或活动键', async () => {
    const wrapper = mount(LxTabsBar, { props: { tabs, modelValue: 'overview' } });
    try {
      const rows = wrapper.findAll('.lx-tabs-bar__tab');
      await rows[0].trigger('auxclick', { button: 1 });
      await rows[1].trigger('auxclick', { button: 2 });
      expect(wrapper.emitted('close')).toBeUndefined();
      await rows[1].trigger('auxclick', { button: 1 });
      expect(wrapper.emitted('close')).toEqual([['tags']]);
      expect(wrapper.findAll('.lx-tabs-bar__tab')).toHaveLength(3);
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    } finally {
      wrapper.unmount();
    }
  });

  it('宿主移除含焦点的页签后聚焦相邻项，全部移除后聚焦导航区域', async () => {
    const wrapper = mount(LxTabsBar, { attachTo: document.body, props: { tabs, modelValue: 'tags' } });
    try {
      (wrapper.get('[data-key="tags"] .lx-tabs-bar__close').element as HTMLButtonElement).focus();
      await wrapper.setProps({ tabs: [tabs[0], tabs[2]] });
      await nextTick();
      expect(document.activeElement).toBe(wrapper.get('[data-key="archive"] .lx-tabs-bar__trigger').element);
      await wrapper.setProps({ tabs: [] });
      await nextTick();
      expect(document.activeElement).toBe(wrapper.get('nav').element);
    } finally {
      wrapper.unmount();
    }
  });

  it('宿主删除后台页签时不抢走页外焦点', async () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    const wrapper = mount(LxTabsBar, { attachTo: document.body, props: { tabs } });
    try {
      outside.focus();
      await wrapper.setProps({ tabs: [tabs[0]] });
      expect(document.activeElement).toBe(outside);
    } finally {
      wrapper.unmount();
      outside.remove();
    }
  });
});
