import {
  CLIENT_VISIT_PLAN_INTERVAL_DAYS_MAX,
  CLIENT_VISIT_PLAN_INTERVAL_DAYS_MIN,
} from '@/api/visit-plan';
import type { TranslationKey } from '@/locales';
import { fillTranslationParams } from '@/utils/fillTranslationParams';

export const VISIT_PLAN_INTERVAL_MIN_DAYS = CLIENT_VISIT_PLAN_INTERVAL_DAYS_MIN;
export const VISIT_PLAN_INTERVAL_MAX_DAYS = CLIENT_VISIT_PLAN_INTERVAL_DAYS_MAX;

export function clampVisitPlanIntervalDays(days: number): number {
  if (!Number.isFinite(days)) {
    return 21;
  }
  return Math.min(
    VISIT_PLAN_INTERVAL_MAX_DAYS,
    Math.max(VISIT_PLAN_INTERVAL_MIN_DAYS, Math.round(days))
  );
}

export function visitPlanIntervalIsWholeWeeks(days: number): boolean {
  const d = clampVisitPlanIntervalDays(days);
  return d >= 7 && d % 7 === 0;
}

export type VisitPlanIntervalEveryMessage = {
  kind: 'weeks' | 'days';
  count: number;
};

export function visitPlanIntervalEveryMessage(days: number): VisitPlanIntervalEveryMessage {
  const d = clampVisitPlanIntervalDays(days);
  if (visitPlanIntervalIsWholeWeeks(d)) {
    return { kind: 'weeks', count: d / 7 };
  }
  return { kind: 'days', count: d };
}

function csPlural(count: number, one: string, few: string, other: string): string {
  const n = Math.abs(count);
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return other;
}

type IntervalEveryKey = Extract<
  TranslationKey,
  | 'visitPlanIntervalWeeksEveryOne'
  | 'visitPlanIntervalWeeksEveryFew'
  | 'visitPlanIntervalWeeksEveryMany'
  | 'visitPlanIntervalDaysEveryOne'
  | 'visitPlanIntervalDaysEveryFew'
  | 'visitPlanIntervalDaysEveryMany'
>;

function intervalEveryTemplateKey(
  kind: 'weeks' | 'days',
  count: number
): IntervalEveryKey {
  const c = Math.abs(count);
  if (kind === 'weeks') {
    if (c === 1) return 'visitPlanIntervalWeeksEveryOne';
    if (c >= 2 && c <= 4) return 'visitPlanIntervalWeeksEveryFew';
    return 'visitPlanIntervalWeeksEveryMany';
  }
  if (c === 1) return 'visitPlanIntervalDaysEveryOne';
  if (c >= 2 && c <= 4) return 'visitPlanIntervalDaysEveryFew';
  return 'visitPlanIntervalDaysEveryMany';
}

/** „Každý 1 týden“ / „Každé 3 týdny“ / „Každých 5 týdnů“ nebo ekvivalent v dnech (parita web). */
export function formatVisitPlanIntervalEvery(
  days: number,
  t: (key: TranslationKey) => string
): string {
  const msg = visitPlanIntervalEveryMessage(days);
  const key = intervalEveryTemplateKey(msg.kind, msg.count);
  const template = t(key);
  if (key === 'visitPlanIntervalDaysEveryOne') {
    return template;
  }
  return fillTranslationParams(template, { count: msg.count });
}

export type VisitPlanIntervalWheelLabels = {
  primary: number;
  unitKind: 'weeks' | 'days';
  unitCount: number;
};

export function visitPlanIntervalWheelLabels(days: number): VisitPlanIntervalWheelLabels {
  const d = clampVisitPlanIntervalDays(days);
  if (visitPlanIntervalIsWholeWeeks(d)) {
    const weeks = d / 7;
    return { primary: weeks, unitKind: 'weeks', unitCount: weeks };
  }
  return { primary: d, unitKind: 'days', unitCount: d };
}

export function formatVisitPlanIntervalUnit(locale: string, days: number): string {
  const labels = visitPlanIntervalWheelLabels(days);
  const c = labels.unitCount;
  if (labels.unitKind === 'weeks') {
    if (locale === 'cs') {
      return csPlural(c, 'týden', 'týdny', 'týdnů');
    }
    if (locale === 'uk') {
      return c === 1 ? 'тиждень' : 'тижні';
    }
    return c === 1 ? 'week' : 'weeks';
  }
  if (locale === 'cs') {
    return csPlural(c, 'den', 'dny', 'dní');
  }
  if (locale === 'uk') {
    return c === 1 ? 'день' : 'дні';
  }
  return c === 1 ? 'day' : 'days';
}

/** Počet dní pro banner „za X dní“. */
export function formatVisitPlanDaysCount(locale: string, count: number): string {
  const c = Math.max(0, Math.round(count));
  if (locale === 'cs') {
    return csPlural(c, `${c} den`, `${c} dny`, `${c} dní`);
  }
  if (locale === 'uk') {
    return c === 1 ? `${c} день` : `${c} дні`;
  }
  return c === 1 ? `${c} day` : `${c} days`;
}
