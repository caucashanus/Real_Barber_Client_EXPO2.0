const PRAGUE_TZ = 'Europe/Prague';
const SOON_MINUTES = 30;

export type BranchOpenStatusKind = 'open' | 'closed' | 'openingSoon' | 'closingSoon';

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

function branchHoursForDay(day: number): DayHours {
  return day >= 1 && day <= 5
    ? { open: 9 * 60, close: 21 * 60 }
    : { open: 10 * 60, close: 18 * 60 };
}

/** Po–Pá 9–21, So–Ne 10–18 (Praha). */
export function getBranchOpenStatus(now = new Date()): BranchOpenStatusKind {
  const day = dayOfWeekInPrague(now);
  const mins = currentMinutesInPrague(now);
  const { open, close } = branchHoursForDay(day);

  if (mins >= open && mins < close) {
    if (close - mins <= SOON_MINUTES) return 'closingSoon';
    return 'open';
  }

  if (mins < open && open - mins <= SOON_MINUTES) {
    return 'openingSoon';
  }

  if (mins >= close) {
    const nextDay = (day + 1) % 7;
    const nextOpen = branchHoursForDay(nextDay).open;
    const minsUntilMidnight = 24 * 60 - mins;
    const untilNextOpen = minsUntilMidnight + nextOpen;
    if (untilNextOpen <= SOON_MINUTES) return 'openingSoon';
  }

  return 'closed';
}
