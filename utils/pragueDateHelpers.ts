const PRAGUE_TIME_ZONE = 'Europe/Prague';

/** Dnešní kalendářní den v Praze jako YYYY-MM-DD. */
export function getPragueTodayDateString(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PRAGUE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Posune ISO kalendářní den o `days` (bez timezone posunu). */
export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.trim().slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
