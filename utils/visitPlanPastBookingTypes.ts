export type VisitPlanPastBooking = {
  id: string;
  dateIso: string;
  time: string;
  employeeName: string;
  avatarUrl?: string | null;
  serviceLabel?: string;
  branchLabel?: string;
  priceCzk: number;
};

export const VISIT_PLAN_MAIN_PAST_BOOKINGS_LIMIT = 2;
export const VISIT_PLAN_CALENDAR_PAST_BOOKINGS_LIMIT = 3;
