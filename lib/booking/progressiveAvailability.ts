import { addDaysIso, formatIsoDate } from '@/lib/booking/calendarDate';

export const WIZARD_AVAILABILITY_MAX_DAYS = 50;
export const CALENDAR_INITIAL_DAYS = 42;
export const CALENDAR_EXTEND_DAYS = 14;

export function addDaysIsoFromToday(days: number, todayIso: string): string {
  return addDaysIso(todayIso, days);
}

export { addDaysIso, formatIsoDate };
