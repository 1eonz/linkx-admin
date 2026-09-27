import { mount } from '@vue/test-utils';
import { LxDutyCalendar, type LxDutyCalendarProps, type LxDutyShift } from 'lx-ui';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

function mountCalendar(props: LxDutyCalendarProps = {}) {
  return mount(LxDutyCalendar, { props });
}

describe('LxDutyCalendar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders six complete weeks with accessible weekday headers', () => {
    const wrapper = mountCalendar({ month: '2024-02' });
    const grid = wrapper.get('[role="grid"]');
    const rows = grid.findAll('[role="row"]');

    expect(grid.attributes('aria-label')).toBe('2024-02 排班日历');
    expect(rows).toHaveLength(7);
    expect(rows[0].findAll('[role="columnheader"]')).toHaveLength(7);
    expect(rows.slice(1).every((row) => row.findAll('[role="gridcell"]').length === 7)).toBe(true);
    expect(wrapper.findAll('[role="gridcell"]')).toHaveLength(42);
    expect(
      wrapper
        .findAll('[role="gridcell"]')
        .filter((cell) => cell.attributes('data-lx-duty-date')?.startsWith('2024-02')),
    ).toHaveLength(29);

    wrapper.unmount();
  });

  it('supports Monday and Sunday as the first weekday', () => {
    const mondayCalendar = mountCalendar({ month: '2024-02' });
    expect(mondayCalendar.find('[role="columnheader"]').text()).toBe('周一');
    expect(mondayCalendar.find('[role="gridcell"]').attributes('data-lx-duty-date')).toBe('2024-01-29');

    const sundayCalendar = mountCalendar({ month: '2024-02', weekStart: 0 });
    expect(sundayCalendar.find('[role="columnheader"]').text()).toBe('周日');
    expect(sundayCalendar.find('[role="gridcell"]').attributes('data-lx-duty-date')).toBe('2024-01-28');

    mondayCalendar.unmount();
    sundayCalendar.unmount();
  });

  it('falls back to the current month for an invalid month value', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 28, 12));
    const wrapper = mountCalendar({ month: '2026-13' });

    expect(wrapper.get('h2').text()).toBe('2026-09');
    expect(wrapper.get('[role="grid"]').attributes('aria-label')).toBe('2026-09 排班日历');

    wrapper.unmount();
  });

  it('emits month changes and handles year rollover', async () => {
    const wrapper = mountCalendar({ month: '2024-12' });

    await wrapper.get('button[aria-label="下个月"]').trigger('click');

    expect(wrapper.emitted('update:month')).toEqual([['2025-01']]);
    expect(wrapper.get('h2').text()).toBe('2025-01');

    wrapper.unmount();
  });

  it('emits date and shift selections with a self-contained shift label', async () => {
    const shift: LxDutyShift = {
      date: '2024-02-05',
      label: '早班',
      status: 'online',
      count: 8,
    };
    const wrapper = mountCalendar({ month: '2024-02', shifts: [shift] });
    const cell = wrapper.get('[data-lx-duty-date="2024-02-05"]');

    await cell.trigger('click');
    await cell.get('.lx-duty-calendar__shift').trigger('click');

    expect(wrapper.emitted('cell-click')).toEqual([['2024-02-05']]);
    expect(wrapper.emitted('shift-click')).toEqual([[shift]]);
    expect(cell.get('.lx-duty-calendar__shift').attributes('aria-label')).toBe('2024-02-05，早班，8 人');

    wrapper.unmount();
  });

  it('moves keyboard focus by date and supports Home and End within a week', async () => {
    const wrapper = mountCalendar({ month: '2024-02' });

    await wrapper.get('[data-lx-duty-date="2024-02-14"]').trigger('keydown', { key: 'Home' });
    expect(wrapper.get('[data-lx-duty-date="2024-02-12"]').attributes('tabindex')).toBe('0');

    await wrapper.get('[data-lx-duty-date="2024-02-12"]').trigger('keydown', { key: 'End' });
    expect(wrapper.get('[data-lx-duty-date="2024-02-18"]').attributes('tabindex')).toBe('0');

    wrapper.unmount();
  });

  it('changes the visible month and keeps focus when arrow navigation crosses the grid boundary', async () => {
    const wrapper = mountCalendar({ month: '2024-02' });
    const firstCell = wrapper.get('[role="gridcell"][tabindex="0"]');

    await firstCell.trigger('keydown', { key: 'ArrowLeft' });

    expect(wrapper.emitted('update:month')).toEqual([['2024-01']]);
    expect(wrapper.get('h2').text()).toBe('2024-01');
    expect(wrapper.get('[data-lx-duty-date="2024-01-28"]').attributes('tabindex')).toBe('0');

    wrapper.unmount();
  });

  it('passes each date and its shifts to the custom cell slot', () => {
    const shifts: LxDutyShift[] = [{ date: '2024-02-05', label: '早班' }];
    const wrapper = mount(LxDutyCalendar, {
      props: { month: '2024-02', shifts },
      slots: {
        cell: ({ date, shifts: cellShifts }: { date: string; shifts: LxDutyShift[] }) =>
          h('span', { class: 'custom-cell' }, `${date}:${cellShifts.length}`),
      },
    });

    expect(wrapper.get('[data-lx-duty-date="2024-02-05"] .custom-cell').text()).toBe('2024-02-05:1');
    expect(wrapper.find('.lx-duty-calendar__shift').exists()).toBe(false);

    wrapper.unmount();
  });
});
