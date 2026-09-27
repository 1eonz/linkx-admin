import type { LxStatus } from '../../tokens';

export interface LxDutyShift {
  date: string;
  label: string;
  status?: LxStatus;
  count?: number;
}

export interface LxDutyCalendarProps {
  month?: string;
  shifts?: LxDutyShift[];
  weekStart?: 0 | 1;
}
