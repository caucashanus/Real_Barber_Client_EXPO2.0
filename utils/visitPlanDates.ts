import type { VisitPlanLeadTime, VisitPlanPreferences } from '@/utils/visitPlanTypes';

export function normalizeIsoDateString(value: string | null | undefined): string | null {
  const day = value?.trim().slice(0, 10) ?? '';
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

export function visitPlanIntlLocaleTag(locale: string): string {
  if (locale === 'uk') return 'uk-UA';
  if (locale === 'cs') return 'cs-CZ';
  return 'en-GB';
}

export function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDateLocal(iso);
  d.setDate(d.getDate() + days);
  return isoDateLocal(d);
}

export function startOfMonthIso(iso: string): string {
  const d = parseIsoDateLocal(iso);
  return isoDateLocal(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function addMonthsIso(iso: string, months: number): string {
  const d = parseIsoDateLocal(iso);
  d.setMonth(d.getMonth() + months);
  return isoDateLocal(d);
}

export function daysInCalendarMonth(monthStartIso: string): number {
  const d = parseIsoDateLocal(monthStartIso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function formatVisitPlanDayMonthLong(iso: string, locale: string): string {
  return parseIsoDateLocal(iso).toLocaleDateString(visitPlanIntlLocaleTag(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function leadTimeDays(lead: VisitPlanLeadTime): number {
  if (lead === '1_week_before') return 7;
  if (lead === '2_weeks_before') return 14;
  return 3;
}

export function computeNextVisitTarget(lastVisitDate: string, intervalDays: number): string {
  return addDays(lastVisitDate, intervalDays);
}

export function resolveVisitPlanNextTarget(input: {
  crmNextTargetVisitDate: string | null;
  lastCompletedVisitDate: string | null;
  intervalDays: number;
}): string | null {
  const crm = input.crmNextTargetVisitDate?.trim();
  if (crm && /^\d{4}-\d{2}-\d{2}$/.test(crm.slice(0, 10))) {
    return crm.slice(0, 10);
  }
  const last = input.lastCompletedVisitDate?.trim();
  if (last && /^\d{4}-\d{2}-\d{2}$/.test(last.slice(0, 10))) {
    return computeNextVisitTarget(last.slice(0, 10), input.intervalDays);
  }
  return null;
}

export function resolveVisitPlanIdealCenterIso(
  nextVisitTarget: string | null,
  todayIso: string
): string {
  const target = nextVisitTarget?.trim().slice(0, 10) ?? '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(target)) return target;
  return todayIso;
}

export function computeIdealVisitBannerRange(centerIso: string): {
  fromIso: string;
  toIso: string;
} {
  return {
    fromIso: addDays(centerIso, -1),
    toIso: addDays(centerIso, 1),
  };
}

export function computeIdealVisitWindow(centerIso: string): string[] {
  return [-1, 0, 1].map((offset) => addDays(centerIso, offset));
}

/** Celé kalendářní dny mezi daty (záporné = cíl v minulosti). */
export function calendarDaysDiff(fromIso: string, toIso: string): number {
  const from = parseIsoDateLocal(fromIso);
  const to = parseIsoDateLocal(toIso);
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function daysFromIso(fromIso: string, toIso: string): number {
  return Math.max(0, calendarDaysDiff(fromIso, toIso));
}

export type VisitPlanPageBannerTiming =
  | { kind: 'overdue' }
  | { kind: 'dueToday' }
  | { kind: 'tomorrow' }
  | { kind: 'inDays'; days: number };

/** Parita web `resolveVisitPlanPageBannerTiming`. */
export function resolveVisitPlanPageBannerTiming(
  todayIso: string,
  nextVisitTarget: string
): VisitPlanPageBannerTiming {
  const diff = calendarDaysDiff(todayIso, nextVisitTarget);
  if (diff < 0) return { kind: 'overdue' };
  if (diff === 0) return { kind: 'dueToday' };
  if (diff === 1) return { kind: 'tomorrow' };
  return { kind: 'inDays', days: diff };
}

export function computeSuggestedContactDate(
  lastVisitDate: string,
  prefs: VisitPlanPreferences
): string {
  const nextVisitTarget = addDays(lastVisitDate, prefs.intervalDays);
  return addDays(nextVisitTarget, -leadTimeDays(prefs.leadTime));
}

export function formatVisitPlanDayMonthCompact(iso: string, locale: string): string {
  const d = parseIsoDateLocal(iso);
  if (locale === 'cs' || locale === 'uk') {
    return `${d.getDate()}.${d.getMonth() + 1}`;
  }
  const tag = locale === 'uk' ? 'uk-UA' : 'en-GB';
  return d.toLocaleDateString(tag, { day: 'numeric', month: 'numeric' });
}
