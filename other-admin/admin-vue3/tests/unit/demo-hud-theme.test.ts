import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, ref } from 'vue';

import { useDemoHudTheme } from '../../../../linkx-fe/docs/.vitepress/composables/useDemoHudTheme';

const Demo = defineComponent({
  setup() {
    const enabled = ref(false);
    useDemoHudTheme(enabled);
    return { enabled };
  },
  template: '<input v-model="enabled" type="checkbox" />',
});

describe('Demo HUD 主题共享生命周期', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark', 'lx-theme-hud');
  });

  it('关闭或卸载一个实例不覆盖其他实例仍启用的主题', async () => {
    const first = mount(Demo);
    const second = mount(Demo);
    try {
      await first.get('input').setValue(true);
      await second.get('input').setValue(true);
      await first.get('input').setValue(false);
      expect(document.documentElement.classList.contains('lx-theme-hud')).toBe(true);
      first.unmount();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('lx-theme-hud')).toBe(true);
    } finally {
      first.unmount();
      second.unmount();
    }
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('lx-theme-hud')).toBe(false);
  });

  it('后挂载实例不把其他实例临时开启的主题误当作初始主题', async () => {
    const first = mount(Demo);
    await first.get('input').setValue(true);
    const second = mount(Demo);
    try {
      first.unmount();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('lx-theme-hud')).toBe(false);
      await second.get('input').setValue(true);
      expect(document.documentElement.classList.contains('lx-theme-hud')).toBe(true);
    } finally {
      first.unmount();
      second.unmount();
    }
    expect(document.documentElement.classList.contains('lx-theme-hud')).toBe(false);
  });

  it.each(['dark', 'lx-theme-hud'])('退出后精确恢复原有 %s 主题', async (originalClass) => {
    document.documentElement.classList.add(originalClass);
    const wrapper = mount(Demo);
    try {
      await wrapper.get('input').setValue(true);
    } finally {
      wrapper.unmount();
    }
    expect(document.documentElement.classList.contains('dark')).toBe(originalClass === 'dark');
    expect(document.documentElement.classList.contains('lx-theme-hud')).toBe(originalClass === 'lx-theme-hud');
  });
});
