/** Parita web `shouldShowHomeVisitPlanIntervalBanner`. */
export function shouldShowHomeVisitPlanIntervalBanner(input: {
  hasStoredPlan: boolean;
  lastCompletedVisitDate: string | null;
  nextVisitTarget: string | null;
  upcomingBookingDate: string | null;
}): boolean {
  if (!input.hasStoredPlan) return false;
  if (!input.lastCompletedVisitDate?.trim()) return false;
  if (!input.nextVisitTarget?.trim()) return false;
  if (input.upcomingBookingDate?.trim()) return false;
  return true;
}
