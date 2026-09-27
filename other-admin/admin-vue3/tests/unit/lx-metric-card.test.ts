import { mount } from '@vue/test-utils';
import { LxMetricCard } from 'lx-ui';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

describe('LxMetricCard', () => {
  it('keeps the Vue3 host title, valueType, footer and named slot contract', () => {
    const wrapper = mount(LxMetricCard, {
      props: {
        title: '今日警情总数',
        value: 1247,
        valueType: 'danger',
        footer: '较昨日增加 12%',
      },
      slots: {
        extra: () => h('span', { class: 'legacy-extra' }, '实时'),
      },
    });

    expect(wrapper.get('.lx-metric-card__label').text()).toBe('今日警情总数');
    expect(wrapper.get('.lx-metric-card__value').text()).toBe('1247');
    expect(wrapper.classes()).toContain('is-danger');
    expect(wrapper.get('.lx-metric-card__footer').text()).toBe('较昨日增加 12%');
    expect(wrapper.get('.legacy-extra').text()).toBe('实时');
    wrapper.unmount();
  });

  it('preserves the lx-ui label API and lets the explicit design status override valueType', () => {
    const wrapper = mount(LxMetricCard, {
      props: { label: '在线警力', value: 1280, valueType: 'danger', status: 'success' },
    });

    expect(wrapper.get('.lx-metric-card__label').text()).toBe('在线警力');
    expect(wrapper.classes()).toContain('is-success');
    expect(wrapper.element.style.getPropertyValue('--lx-metric-value-color')).toBe('var(--lx-color-success-strong)');
    wrapper.unmount();
  });

  it('uses the matching LxIcon arrow for the trend status', () => {
    const up = mount(LxMetricCard, {
      props: { trend: '趋势上行', trendStatus: 'online' },
    });
    const down = mount(LxMetricCard, {
      props: { trend: '趋势下行', trendStatus: 'error' },
    });

    expect(up.get('.lx-metric-card__trend [data-icon-name="arrow-up"]').exists()).toBe(true);
    expect(down.get('.lx-metric-card__trend [data-icon-name="arrow-down"]').exists()).toBe(true);
    expect(up.get('.lx-metric-card__trend svg').attributes('aria-hidden')).toBe('true');
    expect(down.get('.lx-metric-card__trend svg').attributes('aria-hidden')).toBe('true');
    up.unmount();
    down.unmount();
  });

  it('prefers the title slot, badgeText and footer slot over compatibility fallbacks', () => {
    const wrapper = mount(LxMetricCard, {
      props: { title: '属性标题', label: '旧标题', badgeText: '新角标', badge: '旧角标', footer: '旧底栏' },
      slots: {
        title: () => h('span', { class: 'title-slot' }, '标题插槽'),
        label: () => h('span', { class: 'label-slot' }, '旧标题插槽'),
        footer: () => h('span', { class: 'footer-slot' }, '底栏插槽'),
      },
    });

    expect(wrapper.get('.title-slot').text()).toBe('标题插槽');
    expect(wrapper.find('.label-slot').exists()).toBe(false);
    expect(wrapper.get('.lx-metric-card__badge').text()).toContain('新角标');
    expect(wrapper.get('.footer-slot').text()).toBe('底栏插槽');
    wrapper.unmount();
  });

  it('clamps progress and exposes its readable label and formatted value', () => {
    const wrapper = mount(LxMetricCard, {
      props: {
        title: '在线设备',
        status: 'warning',
        progress: 140,
        progressLabel: '健康指标',
        progressValue: '100% 负荷',
      },
    });
    const progress = wrapper.get('[role="progressbar"]');

    expect(progress.attributes('aria-label')).toBe('健康指标');
    expect(progress.attributes('aria-valuenow')).toBe('100');
    expect(progress.attributes('aria-valuetext')).toBe('100% 负荷');
    expect(
      wrapper.get('.lx-metric-card__progress-value').element.style.getPropertyValue('--lx-metric-progress-scale'),
    ).toBe('1');
    expect(wrapper.get('.lx-metric-card__progress-caption').text()).toContain('健康指标');
    wrapper.unmount();
  });

  it('treats non-finite progress as zero and omits progress when unset', () => {
    const invalid = mount(LxMetricCard, { props: { progress: Number.NaN } });
    expect(invalid.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('0');
    expect(
      invalid.get('.lx-metric-card__progress-value').element.style.getPropertyValue('--lx-metric-progress-scale'),
    ).toBe('0');
    invalid.unmount();

    const omitted = mount(LxMetricCard);
    expect(omitted.find('[role="progressbar"]').exists()).toBe(false);
    omitted.unmount();
  });
});
