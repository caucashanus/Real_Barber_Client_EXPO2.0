/** Plán uložený, ale bez proběhlé ani budoucí rezervace — první návštěva (parita web). */
export function isVisitPlanFirstVisitMode(input: {
  hasStoredPlan: boolean;
  lastCompletedVisitDate: string | null;
  upcomingBookingDate: string | null;
}): boolean {
  return (
    input.hasStoredPlan &&
    input.lastCompletedVisitDate == null &&
    input.upcomingBookingDate == null
  );
}
