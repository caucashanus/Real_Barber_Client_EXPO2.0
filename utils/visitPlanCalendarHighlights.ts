import { addDays, computeIdealVisitWindow, normalizeIsoDateString } from '@/utils/visitPlanDates';

export type VisitPlanDayHighlight = 'idealVisit' | 'confirmedBooking';

/** Střed oranžového okna po upcoming: nejbližší rezervace + interval (parita web). */
export function visitPlanNextRecommendedCenterAfterUpcoming(
  upcomingBookingDate: string,
  intervalDays: number
): string {
  const upcoming = normalizeIsoDateString(upcomingBookingDate) ?? upcomingBookingDate.slice(0, 10);
  return addDays(upcoming, intervalDays);
}

export function visitPlanCalendarIdealCenterIso(input: {
  upcomingBookingDate: string | null;
  intervalDays: number;
  idealVisitCenterIso: string;
}): string {
  const bookingIso = normalizeIsoDateString(input.upcomingBookingDate);
  if (bookingIso) {
    return visitPlanNextRecommendedCenterAfterUpcoming(bookingIso, input.intervalDays);
  }
  return input.idealVisitCenterIso;
}

export function buildVisitPlanDayHighlights(input: {
  idealVisitCenterIso: string;
  confirmedBookingDate: string | null;
  intervalDays: number;
  suppressIdealHighlight?: boolean;
}): Record<string, VisitPlanDayHighlight> {
  if (input.suppressIdealHighlight) {
    return {};
  }

  const bookingIso = normalizeIsoDateString(input.confirmedBookingDate);

  if (bookingIso) {
    const center = visitPlanNextRecommendedCenterAfterUpcoming(bookingIso, input.intervalDays);
    const map: Record<string, VisitPlanDayHighlight> = {
      [bookingIso]: 'confirmedBooking',
    };
    for (const date of computeIdealVisitWindow(center)) {
      if (date !== bookingIso) {
        map[date] = 'idealVisit';
      }
    }
    return map;
  }

  const map: Record<string, VisitPlanDayHighlight> = {};
  for (const date of computeIdealVisitWindow(input.idealVisitCenterIso)) {
    map[date] = 'idealVisit';
  }
  return map;
}
