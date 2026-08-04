import { describe, expect, it } from 'vitest';

import {
  formatRelativeDayLabel,
  formatWaitlistDayWhen,
} from '@/utils/formatRelativeDayLabel';

function addCalendarDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

describe('formatWaitlistDayWhen', () => {
  const today = '2026-08-03';

  it('labels today, tomorrow and day after', () => {
    expect(formatWaitlistDayWhen(today, today, 'cs')).toBe('dnes');
    expect(formatWaitlistDayWhen(addCalendarDaysIso(today, 1), today, 'cs')).toBe('zítra');
    expect(formatWaitlistDayWhen(addCalendarDaysIso(today, 2), today, 'cs')).toBe('pozítří');
  });

  it('uses weekday within 6 days', () => {
    expect(formatWaitlistDayWhen('2026-08-06', today, 'cs')).toBe('ve čtvrtek');
    expect(formatWaitlistDayWhen('2026-08-06', today, 'en')).toBe('on thursday');
  });

  it('uses short date beyond 6 days without leading zeros', () => {
    expect(formatWaitlistDayWhen('2026-08-10', today, 'cs')).toBe('10.8.');
    expect(formatWaitlistDayWhen('2026-08-20', today, 'cs')).toBe('20.8.');
  });
});

describe('formatRelativeDayLabel title variants', () => {
  it('uses short date D.M. in titleTab for far dates', () => {
    expect(
      formatRelativeDayLabel({
        dayIso: '2026-08-20',
        todayIso: '2026-08-03',
        locale: 'cs',
        variant: 'titleTab',
      })
    ).toContain('20.8.');
  });
});
