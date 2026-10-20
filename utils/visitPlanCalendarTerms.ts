import { visitPlanNextRecommendedCenterAfterUpcoming } from '@/utils/visitPlanCalendarHighlights';

export type VisitPlanCalendarTerm = {
  id: string;
  dateIso: string;
  kind: 'recommended';
};

export function resolveVisitPlanRecommendedDateIso(input: {
  upcomingBookingDate: string | null;
  intervalDays: number;
  nextVisitTarget: string | null;
}): string | null {
  const upcoming = input.upcomingBookingDate?.trim().slice(0, 10) ?? '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(upcoming)) {
    return visitPlanNextRecommendedCenterAfterUpcoming(upcoming, input.intervalDays);
  }
  const target = input.nextVisitTarget?.trim().slice(0, 10) ?? '';
  return /^\d{4}-\d{2}-\d{2}$/.test(target) ? target : null;
}

export function buildVisitPlanRecommendedTerm(
  nextVisitTarget: string | null,
  options?: { upcomingBookingDate?: string | null; intervalDays?: number }
): VisitPlanCalendarTerm | null {
  const dateIso =
    options?.upcomingBookingDate && options.intervalDays != null
      ? resolveVisitPlanRecommendedDateIso({
          upcomingBookingDate: options.upcomingBookingDate,
          intervalDays: options.intervalDays,
          nextVisitTarget,
        })
      : nextVisitTarget?.trim().slice(0, 10) ?? null;

  if (!dateIso?.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return null;
  return {
    id: 'visit-plan-term-recommended',
    dateIso,
    kind: 'recommended',
  };
}
