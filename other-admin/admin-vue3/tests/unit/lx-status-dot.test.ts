import { mount } from '@vue/test-utils';
import { LxStatusDot, type LxStatus } from 'lx-ui';
import { describe, expect, it } from 'vitest';

import StatusDot from '@/components/StatusDot/index.vue';

const semanticStatuses: { status: LxStatus; label: string }[] = [
  { status: 'online', label: '在线' },
  { status: 'processing', label: '处理中' },
  { status: 'busy', label: '忙碌' },
  { status: 'error', label: '错误' },
  { status: 'offline', label: '离线' },
];

const legacyStatuses: { code: number; status: LxStatus; label: string }[] = [
  { code: 0, status: 'offline', label: '离线' },
  { code: 1, status: 'processing', label: '处理中' },
  { code: 2, status: 'processing', label: '处理中' },
  { code: 3, status: 'error', label: '错误' },
  { code: 4, status: 'online', label: '在线' },
  { code: 5, status: 'busy', label: '忙碌' },
  { code: 6, status: 'error', label: '错误' },
  { code: 7, status: 'processing', label: '处理中' },
];

describe('LxStatusDot', () => {
  it.each(semanticStatuses)('为 $status 提供中文名称和可选文本', ({ status, label }) => {
    const wrapper = mount(LxStatusDot, { props: { status, showText: true, pulse: false } });

    expect(wrapper.attributes('role')).toBe('img');
    expect(wrapper.attributes('aria-label')).toBe(label);
    expect(wrapper.classes()).toContain(`lx-status-dot--${status}`);
    expect(wrapper.find('.lx-status-dot__text').text()).toBe(label);
    expect(wrapper.attributes('tabindex')).toBeUndefined();
    wrapper.unmount();
  });

  it('默认只显示离线圆点，保持纯展示语义', () => {
    const wrapper = mount(LxStatusDot);

    expect(wrapper.attributes('aria-label')).toBe('离线');
    expect(wrapper.find('.lx-status-dot__text').exists()).toBe(false);
    expect(wrapper.find('.lx-status-dot__ping').exists()).toBe(false);
    expect(wrapper.find('.lx-status-dot__wrap').attributes('style')).toContain('width: 8px');
    expect(wrapper.find('button, a, input, [tabindex]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('业务描述优先用于可访问名称，showText 单独控制可见文本', async () => {
    const wrapper = mount(LxStatusDot, {
      props: { status: 'error', statusDesc: '布控告警：需查看详情', pulse: false },
    });

    expect(wrapper.attributes('aria-label')).toBe('布控告警：需查看详情');
    expect(wrapper.find('.lx-status-dot__text').exists()).toBe(false);
    await wrapper.setProps({ showText: true });
    expect(wrapper.find('.lx-status-dot__text').text()).toBe('布控告警：需查看详情');
    await wrapper.setProps({ statusDesc: '' });
    expect(wrapper.attributes('aria-label')).toBe('错误');
    expect(wrapper.find('.lx-status-dot__text').text()).toBe('错误');
    wrapper.unmount();
  });

  it.each(legacyStatuses)('直接库 code=$code 优先于 status 并映射为 $status', ({ code, status, label }) => {
    const wrapper = mount(LxStatusDot, {
      props: { status: 'busy', code, showText: true, pulse: false },
    });

    expect(wrapper.classes()).toContain(`lx-status-dot--${status}`);
    expect(wrapper.attributes('aria-label')).toBe(label);
    expect(wrapper.find('.lx-status-dot__text').text()).toBe(label);
    wrapper.unmount();
  });

  it.each([-1, 8, 99, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    '未知 code=%s 保持离线兜底并优先于命名状态',
    (code) => {
      const wrapper = mount(LxStatusDot, { props: { status: 'online', code, showText: true } });

      expect(wrapper.classes()).toContain('lx-status-dot--offline');
      expect(wrapper.attributes('aria-label')).toBe('离线');
      expect(wrapper.find('.lx-status-dot__text').text()).toBe('离线');
      expect(wrapper.find('.lx-status-dot__ping').exists()).toBe(false);
      wrapper.unmount();
    },
  );

  it('setProps 同步更新状态、code 优先级、中文描述和呼吸标记', async () => {
    const wrapper = mount(LxStatusDot, { props: { status: 'offline', showText: true } });

    await wrapper.setProps({ status: 'online' });
    expect(wrapper.classes()).toContain('lx-status-dot--online');
    expect(wrapper.attributes('aria-label')).toBe('在线');
    expect(wrapper.find('.lx-status-dot__text').text()).toBe('在线');
    expect(wrapper.find('.lx-status-dot__ping').exists()).toBe(true);

    await wrapper.setProps({ code: 3, statusDesc: '认证失败' });
    expect(wrapper.classes()).toContain('lx-status-dot--error');
    expect(wrapper.attributes('aria-label')).toBe('认证失败');
    expect(wrapper.find('.lx-status-dot__text').text()).toBe('认证失败');
    expect(wrapper.find('.lx-status-dot__ping').exists()).toBe(false);

    await wrapper.setProps({ code: undefined, status: 'processing', statusDesc: '' });
    expect(wrapper.classes()).toContain('lx-status-dot--processing');
    expect(wrapper.attributes('aria-label')).toBe('处理中');
    expect(wrapper.find('.lx-status-dot__text').text()).toBe('处理中');
    wrapper.unmount();
  });

  it.each([0.5, 6, 8, 10, 12.5, 100])('保留合法正数 size=%s', (size) => {
    const wrapper = mount(LxStatusDot, { props: { size } });
    const dot = wrapper.find('.lx-status-dot__wrap').element;

    if (!(dot instanceof HTMLElement)) throw new Error('状态点容器应为 HTML 元素');
    expect(dot.style.width).toBe(`${size}px`);
    expect(dot.style.height).toBe(`${size}px`);
    wrapper.unmount();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    '无效 size=%s 回退为 8px',
    (size) => {
      const wrapper = mount(LxStatusDot, { props: { size } });
      const dot = wrapper.find('.lx-status-dot__wrap').element;

      if (!(dot instanceof HTMLElement)) throw new Error('状态点容器应为 HTML 元素');
      expect(dot.style.width).toBe('8px');
      expect(dot.style.height).toBe('8px');
      wrapper.unmount();
    },
  );

  it('尺寸输入失效后可随有效值恢复', async () => {
    const wrapper = mount(LxStatusDot, { props: { size: 6 } });

    await wrapper.setProps({ size: Number.NaN });
    expect(wrapper.find('.lx-status-dot__wrap').attributes('style')).toContain('width: 8px');
    await wrapper.setProps({ size: 9.5 });
    expect(wrapper.find('.lx-status-dot__wrap').attributes('style')).toContain('width: 9.5px');
    wrapper.unmount();
  });

  it.each(semanticStatuses)('只有 online 在 pulse 开启时呼吸：$status', ({ status }) => {
    const wrapper = mount(LxStatusDot, { props: { status, pulse: true } });

    expect(wrapper.find('.lx-status-dot__ping').exists()).toBe(status === 'online');
    expect(wrapper.findAll('.lx-status-dot__dot')).toHaveLength(1);
    wrapper.unmount();
  });

  it('online 默认开启呼吸，显式关闭和重新开启均生效', async () => {
    const wrapper = mount(LxStatusDot, { props: { status: 'online' } });

    expect(wrapper.find('.lx-status-dot__dot').classes()).toContain('lx-status-dot__ping');
    await wrapper.setProps({ pulse: false });
    expect(wrapper.find('.lx-status-dot__ping').exists()).toBe(false);
    expect(wrapper.find('.lx-status-dot__dot').exists()).toBe(true);
    await wrapper.setProps({ pulse: true });
    expect(wrapper.find('.lx-status-dot__dot').classes()).toContain('lx-status-dot__ping');
    wrapper.unmount();
  });

  it('保留长状态说明及宿主传入的无障碍属性，不增加交互停靠位', () => {
    const statusDesc = '认证失败，请查看网关的连接详情。'.repeat(10) + 'GatewayAuthenticationFailed'.repeat(10);
    const wrapper = mount(LxStatusDot, {
      props: { status: 'error', statusDesc, showText: true },
      attrs: { 'aria-describedby': 'connection-details' },
    });

    expect(wrapper.attributes('aria-label')).toBe(statusDesc);
    expect(wrapper.attributes('aria-describedby')).toBe('connection-details');
    expect(wrapper.find('.lx-status-dot__text').text()).toBe(statusDesc);
    expect(wrapper.find('[tabindex]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('renders a semantic status label and optional text', () => {
    const wrapper = mount(LxStatusDot, {
      props: { status: 'error', statusDesc: '布控告警', showText: true, pulse: false },
    });

    expect(wrapper.attributes('role')).toBe('img');
    expect(wrapper.attributes('aria-label')).toBe('布控告警');
    expect(wrapper.find('.lx-status-dot__text').text()).toBe('布控告警');
    expect(wrapper.find('.lx-status-dot__ping').exists()).toBe(false);
    wrapper.unmount();
  });

  it('maps legacy numeric codes before the named status', () => {
    const wrapper = mount(LxStatusDot, {
      props: { status: 'online', code: 0, pulse: false },
    });

    expect(wrapper.classes()).toContain('lx-status-dot--offline');
    expect(wrapper.attributes('aria-label')).toBe('离线');
    wrapper.unmount();
  });

  it('uses a Chinese accessible label when no status description is provided', () => {
    const wrapper = mount(LxStatusDot, {
      props: { status: 'processing', pulse: false },
    });

    expect(wrapper.attributes('aria-label')).toBe('处理中');
    wrapper.unmount();
  });

  it('only adds the breathing layer for online status when pulse is enabled', () => {
    const online = mount(LxStatusDot, { props: { status: 'online', pulse: true } });
    expect(online.find('.lx-status-dot__ping').exists()).toBe(true);
    online.unmount();

    const busy = mount(LxStatusDot, { props: { status: 'busy', pulse: true } });
    expect(busy.find('.lx-status-dot__ping').exists()).toBe(false);
    busy.unmount();
  });
});

describe('Vue3 StatusDot 业务适配', () => {
  it('保留旧连接 code=0 的 busy 语义，与直接库兼容码区分', () => {
    const wrapper = mount(StatusDot, { props: { code: 0, status: 'online', showText: true } });

    expect(wrapper.classes()).toContain('lx-status-dot--busy');
    expect(wrapper.attributes('aria-label')).toBe('忙碌');
    expect(wrapper.find('.lx-status-dot__text').text()).toBe('忙碌');
    expect(wrapper.find('.lx-status-dot__ping').exists()).toBe(false);
    wrapper.unmount();
  });
});
