/** Today in Europe/Prague as YYYY-MM-DD. */
export function pragueTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function formatSlotDate(dateRaw: string, locale: string): string {
  try {
    const [y, m, d] = dateRaw.split('-').map(Number);
    const date = new Date(y, (m ?? 1) - 1, d ?? 1);
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale === 'uk' ? 'uk-UA' : 'cs-CZ', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      timeZone: 'Europe/Prague',
    }).format(date);
  } catch {
    return dateRaw;
  }
}

export function randomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
