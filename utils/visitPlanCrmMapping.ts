import type { ClientVisitPlan, ClientVisitPlanPutBody } from '@/api/visit-plan';
import {
  CLIENT_VISIT_PLAN_INTERVAL_DAYS_MAX,
  CLIENT_VISIT_PLAN_INTERVAL_DAYS_MIN,
} from '@/api/visit-plan';
import { clampVisitPlanIntervalDays } from '@/utils/visitPlanIntervalDisplay';
import {
  clampVisitPlanIntervalWeeks,
  VISIT_PLAN_INTERVAL_MAX_WEEKS,
  VISIT_PLAN_INTERVAL_MIN_WEEKS,
  type VisitPlanContactRemind,
  type VisitPlanPreferences,
} from '@/utils/visitPlanTypes';

export type VisitPlanCrmReadOnly = {
  lastCompletedVisitDate: string | null;
  nextTargetVisitDate: string | null;
  updatedAt: string | null;
  hasStoredPlan: boolean;
};

export function visitPlanPreferencesToPutBody(
  prefs: VisitPlanPreferences
): ClientVisitPlanPutBody {
  return {
    intervalDays: clampVisitPlanIntervalDays(prefs.intervalDays),
    remindBySms: prefs.contactRemind.sms,
    remindByPhone: prefs.contactRemind.phone,
  };
}

export function visitPlanFromCrmToPreferences(
  plan: ClientVisitPlan,
  fallback: VisitPlanPreferences
): VisitPlanPreferences {
  const hasStoredPlan =
    plan.intervalDays != null && plan.remindBySms != null && plan.remindByPhone != null;

  if (!hasStoredPlan) {
    return { ...fallback };
  }

  const intervalDays = clampVisitPlanIntervalDays(plan.intervalDays!);
  const contactRemind: VisitPlanContactRemind = {
    sms: plan.remindBySms === true,
    phone: plan.remindByPhone === true,
  };

  return {
    ...fallback,
    intervalDays,
    contactRemind,
  };
}

export function visitPlanCrmReadOnlyFromPlan(plan: ClientVisitPlan): VisitPlanCrmReadOnly {
  const hasStoredPlan =
    plan.intervalDays != null && plan.remindBySms != null && plan.remindByPhone != null;

  return {
    lastCompletedVisitDate: plan.lastCompletedVisitDate,
    nextTargetVisitDate: plan.nextTargetVisitDate,
    updatedAt: plan.updatedAt,
    hasStoredPlan,
  };
}

export function validateVisitPlanPutBody(body: ClientVisitPlanPutBody): string | null {
  const days = body.intervalDays;
  if (
    !Number.isInteger(days) ||
    days < CLIENT_VISIT_PLAN_INTERVAL_DAYS_MIN ||
    days > CLIENT_VISIT_PLAN_INTERVAL_DAYS_MAX
  ) {
    return 'intervalDays';
  }
  if (!body.remindBySms && !body.remindByPhone) {
    return 'remind';
  }
  return null;
}

export const VISIT_PLAN_WEEKS_RANGE = {
  min: VISIT_PLAN_INTERVAL_MIN_WEEKS,
  max: VISIT_PLAN_INTERVAL_MAX_WEEKS,
} as const;
