import { calendarDaysDiff } from '@/utils/visitPlanDates';

export type VisitPlanPageBannerImageVariant = 'urgent' | 'default' | 'relaxed';

/** Parita web `visitPlanPageBannerImage.ts` — pásma diff viz spec D. */
export function resolveVisitPlanPageBannerImageVariant(input: {
  firstVisit: boolean;
  todayIso: string;
  nextVisitTarget: string;
}): VisitPlanPageBannerImageVariant {
  if (input.firstVisit) return 'default';

  const diff = calendarDaysDiff(input.todayIso, input.nextVisitTarget);
  if (diff < 5) return 'urgent';
  if (diff <= 15) return 'relaxed';
  return 'default';
}
