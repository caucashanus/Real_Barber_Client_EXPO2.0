export type VisitPlanLeadTime = '3_days_before' | '1_week_before' | '2_weeks_before';

export type VisitPlanPreferences = {
  intervalDays: number;
  /** CRM `remindersEnabled` — Připomínat vs Nepřipomínat (kanály řídí CRM). */
  remindersEnabled: boolean;
  leadTime: VisitPlanLeadTime;
};

export const VISIT_PLAN_INTERVAL_MIN_WEEKS = 1;
export const VISIT_PLAN_INTERVAL_MAX_WEEKS = 10;

export function clampVisitPlanIntervalWeeks(weeks: number): number {
  return Math.min(
    VISIT_PLAN_INTERVAL_MAX_WEEKS,
    Math.max(VISIT_PLAN_INTERVAL_MIN_WEEKS, Math.round(weeks))
  );
}

export const DEFAULT_VISIT_PLAN_PREFERENCES: VisitPlanPreferences = {
  intervalDays: 21,
  remindersEnabled: true,
  leadTime: '3_days_before',
};
