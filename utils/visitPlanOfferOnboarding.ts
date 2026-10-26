import { VISIT_PLAN_DEV_FORCE_ONBOARDING_PREVIEW } from '@/utils/visitPlanDevFlags';

/** Parita web `visitPlanShouldOfferOnboarding`. */
export function visitPlanShouldOfferOnboarding(input: {
  hasStoredPlan: boolean;
  lastCompletedVisitDate: string | null | undefined;
}): boolean {
  if (VISIT_PLAN_DEV_FORCE_ONBOARDING_PREVIEW) return true;
  if (input.hasStoredPlan) return false;
  return Boolean(input.lastCompletedVisitDate?.trim());
}
