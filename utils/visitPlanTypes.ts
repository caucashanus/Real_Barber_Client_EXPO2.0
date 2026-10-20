/** Plán návštěv — jen telefon a SMS (parita s webem). */
export const VISIT_PLAN_CONTACT_METHODS = ['phone', 'sms'] as const;

export type VisitPlanContactMethod = (typeof VISIT_PLAN_CONTACT_METHODS)[number];

export type VisitPlanContactRemind = {
  sms: boolean;
  phone: boolean;
};

export type VisitPlanLeadTime = '3_days_before' | '1_week_before' | '2_weeks_before';

export type VisitPlanPreferences = {
  intervalDays: number;
  contactRemind: VisitPlanContactRemind;
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
  contactRemind: { sms: true, phone: false },
  leadTime: '3_days_before',
};

export const VISIT_PLAN_ONBOARDING_CONTACT_REMIND: VisitPlanContactRemind = {
  sms: true,
  phone: true,
};
