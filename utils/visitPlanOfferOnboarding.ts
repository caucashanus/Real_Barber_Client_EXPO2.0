/** Parita web `visitPlanShouldOfferOnboarding`. */
export function visitPlanShouldOfferOnboarding(input: {
  hasStoredPlan: boolean;
  lastCompletedVisitDate: string | null | undefined;
}): boolean {
  if (input.hasStoredPlan) return false;
  return Boolean(input.lastCompletedVisitDate?.trim());
}
