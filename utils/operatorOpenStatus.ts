const PRAGUE_TZ = 'Europe/Prague';
const SOON_MINUTES = 30;

export type OperatorOpenStatusKind = 'open' | 'closed' | 'openingSoon' | 'closingSoon';

type DayHours = { open: number; close: number };

function currentMinutesInPrague(now = new Date()): number {
  const s = now.toLocaleTimeString('en-GB', {
    timeZone: PRAGUE_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const [hs, ms] = s.split(':');
  return Number(hs) * 60 + Number(ms);
}

function dayOfWeekInPrague(now = new Date()): number {
  const weekday = now.toLocaleDateString('en-US', {
    timeZone: PRAGUE_TZ,
    weekday: 'short',
  });
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

function operatorHoursForDay(day: number): DayHours {
  return day >= 1 && day <= 5
    ? { open: 8 * 60 + 30, close: 21 * 60 + 30 }
    : { open: 9 * 60 + 30, close: 18 * 60 + 30 };
}

/** Po–Pá 8:30–21:30, So–Ne 9:30–18:30 (Praha). */
export function getOperatorOpenStatus(now = new Date()): OperatorOpenStatusKind {
  const day = dayOfWeekInPrague(now);
  const mins = currentMinutesInPrague(now);
  const { open, close } = operatorHoursForDay(day);

  if (mins >= open && mins < close) {
    if (close - mins <= SOON_MINUTES) return 'closingSoon';
    return 'open';
  }

  if (mins < open && open - mins <= SOON_MINUTES) {
    return 'openingSoon';
  }

  if (mins >= close) {
    const nextDay = (day + 1) % 7;
    const nextOpen = operatorHoursForDay(nextDay).open;
    const minsUntilMidnight = 24 * 60 - mins;
    const untilNextOpen = minsUntilMidnight + nextOpen;
    if (untilNextOpen <= SOON_MINUTES) return 'openingSoon';
  }

  return 'closed';
}
