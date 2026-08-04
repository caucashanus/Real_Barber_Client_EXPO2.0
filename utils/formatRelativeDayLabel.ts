import type { Locale } from '@/app/contexts/LanguageContext';

/** cs | en (+ uk pro sdílenou logiku s webem). */
export type RelativeDayLocale = Locale | 'uk';

export type RelativeDayVariant = 'when' | 'title' | 'titleTab';

const WHEN_RELATIVE: Record<
  RelativeDayLocale,
  { today: string; tomorrow: string; dayAfter: string }
> = {
  cs: { today: 'dnes', tomorrow: 'zítra', dayAfter: 'pozítří' },
  en: { today: 'today', tomorrow: 'tomorrow', dayAfter: 'day after tomorrow' },
  uk: { today: 'сьогодні', tomorrow: 'завтра', dayAfter: 'післязавтра' },
};

const TITLE_RELATIVE: Record<
  RelativeDayLocale,
  { today: string; tomorrow: string; dayAfter: string }
> = {
  cs: { today: 'Dnes', tomorrow: 'Zítra', dayAfter: 'Pozítří' },
  en: { today: 'Today', tomorrow: 'Tomorrow', dayAfter: 'Day after tomorrow' },
  uk: { today: 'Сьогодні', tomorrow: 'Завтра', dayAfter: 'Післязавтра' },
};

function intlLocaleTag(locale: RelativeDayLocale): string {
  if (locale === 'cs') return 'cs-CZ';
  if (locale === 'uk') return 'uk-UA';
  return 'en-GB';
}

/** Kalendářní diff: dayIso − todayIso (Praha ISO dny). */
export function calendarDayDiff(dayIso: string, todayIso: string): number {
  const parts = dayIso.trim().slice(0, 10).split('-').map(Number);
  const refParts = todayIso.trim().slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || refParts.length !== 3) return Number.NaN;
  if (parts.some((n) => !Number.isFinite(n)) || refParts.some((n) => !Number.isFinite(n))) {
    return Number.NaN;
  }
  const [yy, mm, dd] = parts;
  const [ryy, rmm, rdd] = refParts;
  const slotDay = new Date(yy, mm - 1, dd);
  const refDay = new Date(ryy, rmm - 1, rdd);
  return Math.round((slotDay.getTime() - refDay.getTime()) / 86400000);
}

function shortDateNoYear(dayIso: string): string {
  const [y, m, d] = dayIso.trim().slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return dayIso;
  return `${d}.${m}.`;
}

function weekdayWhen(dayIso: string, locale: RelativeDayLocale): string {
  const [y, m, d] = dayIso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const tag = intlLocaleTag(locale);
  const wd = dt.toLocaleDateString(tag, { weekday: 'long' }).toLocaleLowerCase(tag);
  if (locale === 'cs') {
    if (wd === 'středa' || wd === 'čtvrtek') return `ve ${wd}`;
    return `v ${wd}`;
  }
  if (locale === 'en') return `on ${wd}`;
  return wd;
}

function weekdayTitle(dayIso: string, locale: RelativeDayLocale, short = false): string {
  const [y, m, d] = dayIso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const tag = intlLocaleTag(locale);
  const wd = dt.toLocaleDateString(tag, {
    weekday: short ? 'short' : 'long',
  });
  if (short) {
    return wd.charAt(0).toLocaleUpperCase(tag) + wd.slice(1).replace(/\./g, '');
  }
  return wd.charAt(0).toLocaleUpperCase(tag) + wd.slice(1);
}

/**
 * Sdílený relativní den — stejná logika jako web.
 * `when` = do věty (malá písmena); `title` / `titleTab` = záložky a nadpisy směn.
 */
export function formatRelativeDayLabel(params: {
  dayIso: string;
  todayIso: string;
  locale?: RelativeDayLocale;
  variant: RelativeDayVariant;
}): string {
  const locale = params.locale ?? 'cs';
  const day = params.dayIso.trim().slice(0, 10);
  const today = params.todayIso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return day || today;
  }

  const diff = calendarDayDiff(day, today);
  const short = shortDateNoYear(day);

  if (params.variant === 'when') {
    const rel = WHEN_RELATIVE[locale] ?? WHEN_RELATIVE.cs;
    if (diff === 0) return rel.today;
    if (diff === 1) return rel.tomorrow;
    if (diff === 2) return rel.dayAfter;
    if (diff >= 3 && diff <= 6) return weekdayWhen(day, locale);
    return short;
  }

  const rel = TITLE_RELATIVE[locale] ?? TITLE_RELATIVE.cs;
  if (diff === 0) return `${rel.today} ${short}`;
  if (diff === 1) return `${rel.tomorrow} ${short}`;
  if (diff === 2) return `${rel.dayAfter} ${short}`;

  if (params.variant === 'titleTab') {
    return `${weekdayTitle(day, locale, true)} ${short}`;
  }

  return `${weekdayTitle(day, locale, false)} ${short}`;
}

/** Alias pro waitlist / badge — varianta `when`. */
export function formatWaitlistDayWhen(
  dayIso: string,
  todayIso: string,
  locale: RelativeDayLocale = 'cs'
): string {
  return formatRelativeDayLabel({ dayIso, todayIso, locale, variant: 'when' });
}
