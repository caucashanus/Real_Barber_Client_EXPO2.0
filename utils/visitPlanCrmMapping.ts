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
  type VisitPlanPreferences,
} from '@/utils/visitPlanTypes';

export type VisitPlanCrmReadOnly = {
  lastCompletedVisitDate: string | null;
  nextTargetVisitDate: string | null;
  updatedAt: string | null;
  hasStoredPlan: boolean;
};

/** Plán v CRM = uložený interval (remindersEnabled může být null jen přechodně). */
export function visitPlanHasStoredPlan(plan: ClientVisitPlan): boolean {
  return plan.intervalDays != null;
}

export function resolveRemindersEnabledFromCrmPlan(plan: ClientVisitPlan): boolean | null {
  if (plan.remindersEnabled === true || plan.remindersEnabled === false) {
    return plan.remindersEnabled;
  }
  return null;
}

export type VisitPlanSaveScope = 'full' | 'intervalOnly' | 'remindersOnly';

export type VisitPlanSaveOptions = {
  scope?: VisitPlanSaveScope;
};

export function visitPlanPreferencesToPutBody(
  prefs: VisitPlanPreferences
): ClientVisitPlanPutBody {
  return {
    intervalDays: clampVisitPlanIntervalDays(prefs.intervalDays),
    remindersEnabled: prefs.remindersEnabled,
  };
}

/** Sloučí draft s aktuálními prefs podle toho, který panel uživatel ukládá. */
export function mergeVisitPlanPrefsForSave(
  current: VisitPlanPreferences,
  draft: VisitPlanPreferences,
  scope: VisitPlanSaveScope
): VisitPlanPreferences {
  if (scope === 'intervalOnly') {
    return {
      ...current,
      intervalDays: clampVisitPlanIntervalDays(draft.intervalDays),
    };
  }
  if (scope === 'remindersOnly') {
    return {
      ...current,
      remindersEnabled: draft.remindersEnabled,
    };
  }
  return draft;
}

export function visitPlanPutBodyForSave(
  merged: VisitPlanPreferences,
  crmPlan: ClientVisitPlan | null,
  scope: VisitPlanSaveScope
): ClientVisitPlanPutBody {
  const intervalDays = clampVisitPlanIntervalDays(merged.intervalDays);

  if (scope === 'intervalOnly') {
    const fromCrm = crmPlan ? resolveRemindersEnabledFromCrmPlan(crmPlan) : null;
    return {
      intervalDays,
      remindersEnabled: fromCrm !== null ? fromCrm : merged.remindersEnabled,
    };
  }

  if (scope === 'remindersOnly') {
    const intervalFromCrm =
      crmPlan?.intervalDays != null
        ? clampVisitPlanIntervalDays(crmPlan.intervalDays)
        : intervalDays;
    return {
      intervalDays: intervalFromCrm,
      remindersEnabled: merged.remindersEnabled,
    };
  }

  return visitPlanPreferencesToPutBody(merged);
}

export function visitPlanFromCrmToPreferences(
  plan: ClientVisitPlan,
  fallback: VisitPlanPreferences
): VisitPlanPreferences {
  const intervalDays =
    plan.intervalDays != null
      ? clampVisitPlanIntervalDays(plan.intervalDays)
      : fallback.intervalDays;

  const fromCrm = resolveRemindersEnabledFromCrmPlan(plan);
  let remindersEnabled = fallback.remindersEnabled;
  if (fromCrm !== null) {
    remindersEnabled = fromCrm;
  } else if (plan.intervalDays != null) {
    remindersEnabled = true;
  }

  return {
    ...fallback,
    intervalDays,
    remindersEnabled,
  };
}

export function visitPlanCrmReadOnlyFromPlan(plan: ClientVisitPlan): VisitPlanCrmReadOnly {
  return {
    lastCompletedVisitDate: plan.lastCompletedVisitDate,
    nextTargetVisitDate: plan.nextTargetVisitDate,
    updatedAt: plan.updatedAt,
    hasStoredPlan: visitPlanHasStoredPlan(plan),
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
  return null;
}

export function validateVisitPlanProfilePhone(profilePhone: string | null | undefined): boolean {
  return Boolean(profilePhone?.trim());
}

export const VISIT_PLAN_WEEKS_RANGE = {
  min: VISIT_PLAN_INTERVAL_MIN_WEEKS,
  max: VISIT_PLAN_INTERVAL_MAX_WEEKS,
} as const;
